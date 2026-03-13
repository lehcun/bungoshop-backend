import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export interface CheckoutPayload {
  paymentMethod: 'VNPay' | 'MOMO' | 'ATM' | 'COD';
  shippingAddressId: string;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private orderService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getOrders() {
    return await this.orderService.findAll();
  }

  //Sửa lại toàn bộ hàm này
  @Get('/month')
  async getLastMonth() {
    const currMonth = new Date().getMonth() + 1;
    const currMonthOrders = await this.orderService.findByMonth(currMonth);
    const prevMonthOrders = await this.orderService.findByMonth(currMonth - 1);

    const currMonthlyRevenue = currMonthOrders.reduce(
      (acc: number, curr) => acc + curr.totalPrice,
      0,
    );

    const preMonthlyRevenue = prevMonthOrders.reduce(
      (acc: number, curr) => acc + curr.totalPrice,
      0,
    );

    //Cái này sẽ để đi chỗ khác
    const allOrders = await this.orderService.findAll();

    return {
      revenueGrowth: currMonthlyRevenue - preMonthlyRevenue,
      momGrowth:
        ((currMonthlyRevenue - preMonthlyRevenue) / preMonthlyRevenue) * 100,

      totalOrder: allOrders.length,
      currMonthlyCount: currMonthOrders.length,
    };
  }

  @Get('/user/history')
  @UseGuards(AuthGuard('jwt'))
  async getHistory(
    @Req() req,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (status && status !== 'all')
      status = status.toUpperCase() as OrderStatus;
    return await this.orderService.getUserHistory(req.user.id, status, search);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  async checkout(@Req() req, @Body() payload: CheckoutPayload) {
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
