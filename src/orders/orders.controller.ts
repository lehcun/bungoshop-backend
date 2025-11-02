import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';

export interface CheckoutPayload {
  paymentMethod: 'CARD' | 'WALLET' | 'COD' | 'TRANSFER';
  shippingAddressId: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Get()
  async getAll() {
    return this.orderService.findAll();
  }

  @Get('/month/:id')
  async getLastMonth(@Param('id') month: number) {
    return this.orderService.findByMonth(month);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  async checkout(@Req() req, @Body() payload: CheckoutPayload) {
    console.log(payload);
    const userId = req.user.id;

    const order = await this.orderService.checkout(
      userId,
      payload.paymentMethod,
      payload.shippingAddressId,
    );

    return {
      message: 'Đặt hàng thành công!',
      order,
    };
  }
}
