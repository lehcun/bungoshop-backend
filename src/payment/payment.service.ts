import * as crypto from 'crypto';
import * as moment from 'moment';
import * as qs from 'qs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrdersService } from 'src/orders/orders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PaymentService {
  constructor(
    private readonly orderService: OrdersService,
    private readonly prisma: PrismaService,
    @InjectQueue('process-successful-payment')
    private readonly paymentQueue: Queue,
  ) {}

  async createPaymentUrl(orderId: string, ipAddr: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    console.log('order:', order);

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    const amount = order.totalPrice;
    const orderInfo = `Thanh toan dong ${orderId}`;

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

  // async validateIpn(vnp_Params: any) {
  //   const secretKey = process.env.VNP_HASHSECRET;
  //   const secureHash = vnp_Params['vnp_SecureHash'];

  //   // 1. Xóa các tham số hash để tính toán lại
  //   delete vnp_Params['vnp_SecureHash'];
  //   delete vnp_Params['vnp_SecureHashType'];

  //   // 2. Sắp xếp và tạo lại mã Hash để so sánh
  //   const sortedParams = this.sortObject(vnp_Params);
  //   const signData = qs.stringify(sortedParams, { encode: false });
  //   const hmac = crypto.createHmac('sha512', secretKey);
  //   const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  //   // --- BẮT ĐẦU KIỂM TRA ---

  //   // Bước 1: Kiểm tra chữ ký (Checksum)
  //   if (secureHash !== signed) {
  //     return { RspCode: '97', Message: 'Invalid checksum' };
  //   }

  //   // Bước 2: Kiểm tra đơn hàng có tồn tại trong Database không
  //   const orderId = vnp_Params['vnp_TxnRef'];
  //   const order = await this.orderService.findOne(orderId);

  //   if (!order) {
  //     return { RspCode: '01', Message: 'Order not found' };
  //   }

  //   // Bước 3: Kiểm tra số tiền có khớp không (Số tiền VNPay trả về đã nhân 100)
  //   const vnpAmount = parseInt(vnp_Params['vnp_Amount']) / 100;
  //   if (order.totalPrice !== vnpAmount) {
  //     console.log(
  //       `LỖI TIỀN: DB là ${order.totalPrice}, VNPay trả về ${vnpAmount}`,
  //     );
  //     return { RspCode: '04', Message: 'Invalid amount' };
  //   }

  //   // Bước 4: Kiểm tra trạng thái đơn hàng hiện tại (Tránh xử lý trùng lặp)
  //   // Chỉ cập nhật nếu đơn hàng đang ở trạng thái 'Pending' (Chờ thanh toán)
  //   if (order.status !== 'PENDING') {
  //     return { RspCode: '02', Message: 'Order already confirmed' };
  //   }

  //   // --- CẬP NHẬT TRẠNG THÁI ---
  //   const responseCode = vnp_Params['vnp_ResponseCode'];
  //   console.log(responseCode);
  //   if (responseCode === '00') {
  //     // Thanh toán thành công
  //     const payment = await this.createPayment(order.userId, orderId, {
  //       method: PaymentMethod.VNPay,
  //       amount: vnpAmount,
  //       transactionId: vnp_Params['vnp_TransactionNo'],
  //       metadata: vnp_Params,
  //     });

  //     console.log('Payment: ', payment);
  //     console.log('Trước hàm queue trong paymentSer');

  //     // 2. 🔥 ÁP DỤNG MESSAGE QUEUE TẠI ĐÂY 🔥
  //     // Thay vì gọi hàm gửi Email/PDF làm treo API, ta đóng gói data và ném vào Queue.
  //     // API sẽ chạy tuột qua dòng này trong chưa tới 5ms!
  //     await this.paymentQueue.add(
  //       'process-successful-payment',
  //       {
  //         orderId: order.id,
  //         // Có thể truyền thêm các thông tin cần thiết khác cho Worker ở đây
  //       },
  //       {
  //         attempts: 3, // tự động thử lại 3 lần
  //         backoff: {
  //           type: 'exponential',
  //           delay: 3000, // Lần 1 cách 3s, lần 2 cách 9s...
  //         },
  //         removeOnComplete: true, // Xong việc thì xóa khỏi Redis cho nhẹ máy
  //       },
  //     );

  //     console.log(
  //       `[Queue] Đã đẩy đơn hàng ${order.id} vào hàng đợi xử lý ngầm.`,
  //     );
  //   } else {
  //     // Thanh toán lỗi (Khách hàng hủy, hết hạn, thiếu số dư...)
  //     await this.prisma.$transaction(async (tx) => {
  //       await tx.order.update({
  //         where: { id: orderId },
  //         data: {
  //           status: OrderStatus.CANCELED,
  //           paymentStatus: PaymentStatus.FAILED,
  //         },
  //       });

  //       const orderWithItems = await tx.order.findUnique({
  //         where: { id: orderId },
  //         include: { items: true },
  //       });

  //       if (orderWithItems && orderWithItems.items.length > 0) {
  //         // Chaỵ vòng lặp hoàn kho
  //         for (const item of orderWithItems.items) {
  //           await tx.productVariant.update({
  //             where: { id: item.variantId },
  //             data: {
  //               stock: {
  //                 increment: item.quantity,
  //               },
  //             },
  //           });
  //         }
  //       }
  //     });
  //   }

  //   // Trả về kết quả thành công cho VNPay để họ không gửi lại IPN nữa
  //   return { RspCode: '00', Message: 'Confirm Success' };
  // }

  async validateIpn(vnp_Params: any) {
    console.log('\n====== [IPN] BẮT ĐẦU VALIDATE ======');
    const secretKey = process.env.VNP_HASHSECRET;

    // Tạo bản sao để tránh lỗi khi delete
    const params = { ...vnp_Params };
    const secureHash = params['vnp_SecureHash'];

    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Chốt 1: Checksum
    if (secureHash !== signed) {
      console.log('🛑 [IPN] LỖI: Sai chữ ký!');
      return { RspCode: '97', Message: 'Invalid checksum' };
    }

    // Chốt 2: Đơn hàng
    const orderId = params['vnp_TxnRef'];
    const order = await this.orderService.findOne(orderId);
    if (!order) {
      console.log(`🛑 [IPN] LỖI: Không tìm thấy Order ID ${orderId} trong DB!`);
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Chốt 3: Tiền
    const vnpAmount = parseInt(params['vnp_Amount']) / 100;
    if (order.totalPrice !== vnpAmount) {
      console.log(
        `🛑 [IPN] LỖI: Tiền lệch! DB: ${order.totalPrice}, VNPay: ${vnpAmount}`,
      );
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // Chốt 4: Trạng thái
    console.log(`👉 [IPN] Trạng thái đơn hiện tại: ${order.status}`);
    if (order.status !== 'PENDING') {
      console.log('🛑 [IPN] LỖI: Đơn này đã được xử lý (Không phải PENDING)!');
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    const responseCode =
      params['vnp_ResponseCode'] || params['vnp_TransactionStatus'];
    console.log(`👉 [IPN] Mã VNPay trả về: ${responseCode}`);

    if (responseCode === '00') {
      console.log(
        '✅ [IPN] VNPay báo thành công! Chuẩn bị gọi createPayment...',
      );

      // BẪY LỖI KHI TẠO PAYMENT
      try {
        const payment = await this.createPayment(order.userId, orderId, {
          method: PaymentMethod.VNPay,
          amount: vnpAmount,
          transactionId: params['vnp_TransactionNo'],
          metadata: params,
        });

        console.log('✅ [IPN] Tạo Payment vào DB thành công:', payment?.id);

        console.log('👉 [IPN] Đang ném vào Queue...');
        await this.paymentQueue.add(
          'process-successful-payment',
          { orderId: order.id },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: true,
          },
        );
        console.log('✅ [IPN] XONG TOÀN BỘ LUỒNG THÀNH CÔNG!');
      } catch (error) {
        // NẾU PRISMA LỖI HAY GÌ ĐÓ NÓ SẼ IN RA ĐÂY
        console.error(
          '🔥 [IPN] LỖI NGHIÊM TRỌNG KHI TẠO PAYMENT HOẶC QUEUE:',
          error,
        );
      }
    } else {
      console.log(
        '👉 [IPN] Giao dịch thất bại / Bị hủy, chuyển sang CANCELED...',
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELED,
            paymentStatus: PaymentStatus.FAILED,
          },
        });

        const orderWithItems = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (orderWithItems && orderWithItems.items.length > 0) {
          // Chaỵ vòng lặp hoàn kho
          for (const item of orderWithItems.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      });
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async verifyReturnUrl(vnp_Params: any): Promise<boolean> {
    const secretKey = process.env.VNP_HASHSECRET;
    const secureHash = vnp_Params['vnp_SecureHash'];

    const paramsCopy = { ...vnp_Params };
    delete paramsCopy['vnp_SecureHash'];
    delete paramsCopy['vnp_SecureHashType'];

    const sortedParams = this.sortObject(paramsCopy);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Chỉ check chữ ký, KHÔNG CHẠM VÀO DATABASE
    return secureHash === signed;
  }

  // async createPayment(
  //   userId: string,
  //   orderId: string,
  //   paymentData: {
  //     method: PaymentMethod;
  //     amount: number;
  //     transactionId?: string;
  //     metadata?: any;
  //   },
  // ) {
  //   // 1. Kiểm tra đơn hàng có tồn tại và thuộc về user không
  //   const order = await this.prisma.order.findFirst({
  //     where: { id: orderId, userId },
  //   });

  //   if (!order) {
  //     throw new NotFoundException(
  //       'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn.',
  //     );
  //   }

  //   return this.prisma.$transaction(async (tx) => {
  //     const payment = await tx.payment.create({
  //       data: {
  //         orderId: order.id,
  //         userId,
  //         method: paymentData.method,
  //         amount: paymentData.amount,
  //         transactionId: paymentData.transactionId,
  //         metadata: paymentData.metadata,
  //         status: PaymentStatus.SUCCEEDED,
  //       },
  //     });

  //     console.log('paymentcreate: ', payment);

  //     // 3. Cập nhật trạng thái đơn hàng (Order)
  //     // Nếu số tiền thanh toán đủ, cập nhật trạng thái đơn hàng
  //     await tx.order.update({
  //       where: { id: orderId },
  //       data: {
  //         paymentStatus: PaymentStatus.SUCCEEDED,
  //         paymentMethod: paymentData.method,
  //         status: OrderStatus.PAID, // Chuyển sang trạng thái đang xử lý sau khi thanh toán
  //       },
  //     });
  //     return payment;
  //   });
  // }

  async createPayment(userId: string, orderId: string, paymentData: any) {
    console.log('\n   --- [CREATE PAYMENT] Bắt đầu ---');
    console.log(
      `   👉 Đang tìm Order với orderId: ${orderId}, userId: ${userId}`,
    );

    // Nếu userId bị undefined (khách vãng lai), lệnh findFirst này sẽ tìm sai!
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      console.error(
        '   🔥 [CREATE PAYMENT] LỖI: Không tìm thấy order hợp lệ cho User này!',
      );
      throw new NotFoundException(
        'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn.',
      );
    }

    console.log(
      '   👉 Tìm thấy Order hợp lệ, bắt đầu chạy Transaction Prisma...',
    );

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

      console.log('   ✅ Đã insert bảng Payment:', payment.id);

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          paymentMethod: paymentData.method,
          status: OrderStatus.PAID,
        },
      });

      console.log('   ✅ Đã update trạng thái Order thành PAID');
      return payment;
    });
  }
}
