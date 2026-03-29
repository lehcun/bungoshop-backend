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
  async createPayment(@Req() req: Request, @Body() body: { orderId: string }) {
    //Tạo url chuyển sang webhook vnpay (sandbox)
    const ipAddr = req.ip || '127.0.0.1';
    const url = await this.paymentService.createPaymentUrl(
      body.orderId,
      ipAddr,
    );
    return { url };
  }

  // 1. DÀNH CHO BROWSER CỦA NGƯỜI DÙNG (Chỉ lo UI)
  @Get('vnpay_return')
  async vnpayReturn(@Query() query: any, @Res() res: any) {
    const vnp_Params = { ...query };
    console.log('vnp_Params: ', vnp_Params);

    const isSignatureValid =
      await this.paymentService.verifyReturnUrl(vnp_Params);

    if (isSignatureValid) {
      if (vnp_Params['vnp_ResponseCode'] === '00') {
        // Trả về UI thành công. Chuyện update DB để IPN lo.
        return res.redirect(`${process.env.FRONTEND_URL}/checkout/success`);
      } else {
        return res.redirect(
          `${process.env.FRONTEND_URL}/checkout/error?code=${vnp_Params['vnp_ResponseCode']}`,
        );
      }
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/checkout/error?code=97`);
    }
  }

  // 2. DÀNH CHO SERVER VNPAY GỌI VÀO (Người nắm quyền quyết định)
  @Get('vnpay_ipn')
  async vnpayIpn(@Query() query: any) {
    console.log('Webhook IPN nhận được tín hiệu từ VNPay:', query);
    // Hàm này sẽ: Check chữ ký -> Check DB -> Update DB -> Gọi BullMQ Worker
    const result = await this.paymentService.validateIpn(query);

    // Bắt buộc phải return ra định dạng này cho VNPay
    return result;
  }

  // API TẠO ĐƠN MOMO
  @Post('momo/create')
  async createMoMoPayment(@Body() body: { orderId: string }) {
    const url = await this.paymentService.createMoMoPaymentUrl(body.orderId);
    return { url };
  }

  // 1. DÀNH CHO BROWSER CỦA NGƯỜI DÙNG (Giao diện UI)
  @Get('momo_return')
  async momoReturn(@Query() query: any, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL;

    const resultCode = query.resultCode;
    const message = query.message || 'Thanh toán thất bại';

    if (query.resultCode === '0') {
      return res.redirect(`${frontendUrl}/checkout/success`);
    } else {
      console.log(
        `${frontendUrl}/checkout/error?code=${resultCode}&message=${encodeURIComponent(message)}`,
      );
      return res.redirect(
        `${frontendUrl}/checkout/error?code=${resultCode}&message=${encodeURIComponent(message)}`,
      );
    }
  }

  // 2. DÀNH CHO SERVER MOMO GỌI VÀO (Tạo Payment ngầm)
  @Post('momo_ipn')
  async momoIpn(@Body() body: any) {
    console.log('Webhook MOMO IPN nhận tín hiệu:', body);

    await this.paymentService.validateMoMoIpn(body);

    return { message: 'Received IPN successfully' };
  }
}
