import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('create')
  async createPayment(
    @Req() req: Request,
    @Body() body: { amount: number; info: string; orderId: string },
  ) {
    //Tạo url chuyển sang webhook vnpay (sandbox)
    const ipAddr = req.ip || '127.0.0.1';
    const url = this.paymentService.createPaymentUrl(
      body.amount,
      body.info,
      body.orderId,
      ipAddr,
    );
    return { url };
  }

  @Get('vnpay_ipn')
  async vnpayIpn(@Query() query: any) {
    // 1. Kiểm tra Checksum (Tương tự như bước tạo chữ ký nhưng so sánh)
    // 2. Kiểm tra đơn hàng trong DB
    // 3. Nếu mọi thứ OK, update status thành "Success"
    console.log('Dữ liệu VNPay gửi về:', query);
    return await this.paymentService.validateIpn(query);
  }

  @Get('vnpay_return')
  async vnpayReturn(@Query() query: any, @Res() res: any) {
    const vnp_Params = query;
    console.log('vnp_Params: ', vnp_Params);

    const isValid = await this.paymentService.validateIpn(vnp_Params);

    if (isValid) {
      const responseCode = vnp_Params['vnp_ResponseCode'];

      if (responseCode === '00') {
        // Thanh toán thành công -> Chuyển hướng về trang giao diện thành công của Frontend
        return res.redirect('http://localhost:3000/checkout/success');
      } else {
        // Thanh toán lỗi (ví dụ: người dùng hủy)
        return res.redirect(
          `http://localhost:3000/checkout/error?code=${responseCode}`,
        );
      }
    } else {
      // Chữ ký không hợp lệ
      return res.redirect('http://localhost:3000/checkout/error?code=97');
    }
  }
}
