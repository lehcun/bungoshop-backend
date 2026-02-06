import * as crypto from 'crypto';
import * as moment from 'moment';
import * as qs from 'qs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrdersService } from 'src/orders/orders.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly orderService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  createPaymentUrl(
    amount: number,
    orderInfo: string,
    orderId: string,
    ipAddr: string,
  ) {
    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân 100
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sắp xếp các tham số theo thứ tự bảng chữ cái (Bắt buộc)
    vnp_Params = this.sortObject(vnp_Params);

    // Tạo chữ ký số
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }

  // Hàm phụ trợ sắp xếp Object
  private sortObject(obj: any) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
  }

  async validateIpn(vnp_Params: any) {
    const secretKey = process.env.VNP_HASHSECRET;
    const secureHash = vnp_Params['vnp_SecureHash'];

    // 1. Xóa các tham số hash để tính toán lại
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // 2. Sắp xếp và tạo lại mã Hash để so sánh
    const sortedParams = this.sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // --- BẮT ĐẦU KIỂM TRA ---

    // Bước 1: Kiểm tra chữ ký (Checksum)
    if (secureHash !== signed) {
      return { RspCode: '97', Message: 'Invalid checksum' };
    }

    // Bước 2: Kiểm tra đơn hàng có tồn tại trong Database không
    const orderId = vnp_Params['vnp_TxnRef'];
    const order = await this.orderService.findOne(orderId);

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Bước 3: Kiểm tra số tiền có khớp không (Số tiền VNPay trả về đã nhân 100)
    const vnpAmount = parseInt(vnp_Params['vnp_Amount']) / 100;
    // if (order.totalPrice !== vnpAmount) {
    //   console.log('test3');
    //   return { RspCode: '04', Message: 'Invalid amount' };
    // }

    // Bước 4: Kiểm tra trạng thái đơn hàng hiện tại (Tránh xử lý trùng lặp)
    // Chỉ cập nhật nếu đơn hàng đang ở trạng thái 'Pending' (Chờ thanh toán)
    if (order.status !== 'PENDING') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // --- CẬP NHẬT TRẠNG THÁI ---
    const responseCode = vnp_Params['vnp_ResponseCode'];
    if (responseCode === '00') {
      // Thanh toán thành công
      await this.createPayment(order.userId, orderId, {
        method: PaymentMethod.VNPay,
        amount: vnpAmount,
        transactionId: vnp_Params['vnp_TransactionNo'],
        metadata: vnp_Params,
      });
    } else {
      // Thanh toán lỗi (Khách hàng hủy, hết hạn, thiếu số dư...)
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    }

    // Trả về kết quả thành công cho VNPay để họ không gửi lại IPN nữa
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async createPayment(
    userId: string,
    orderId: string,
    paymentData: {
      method: PaymentMethod; // Sử dụng Enum PaymentMethod từ Prisma
      amount: number;
      transactionId?: string;
      metadata?: any;
    },
  ) {
    // 1. Kiểm tra đơn hàng có tồn tại và thuộc về user không
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException(
        'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn.',
      );
    }

    // Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn.
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          userId,
          method: paymentData.method,
          amount: paymentData.amount,
          transactionId: paymentData.transactionId,
          metadata: paymentData.metadata,
          status: PaymentStatus.SUCCEEDED,
        },
      });

      // 3. Cập nhật trạng thái đơn hàng (Order)
      // Nếu số tiền thanh toán đủ, cập nhật trạng thái đơn hàng
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          paymentMethod: paymentData.method,
          status: OrderStatus.PAID, // Chuyển sang trạng thái đang xử lý sau khi thanh toán
        },
      });
      return payment;
    });
  }
}
