import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async createPayment(
    @Req() req: Request,
    @Body() body: { amount: number; info: string },
  ) {
    const ipAddr = req.ip || '127.0.0.1';
    const url = this.paymentService.createPaymentUrl(
      body.amount,
      body.info,
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
    return this.paymentService.validateIpn(query);
  }
}
