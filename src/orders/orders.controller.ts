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
import { PrismaService } from 'src/prisma/prisma.service';

export interface CheckoutPayload {
  paymentMethod: 'CARD' | 'WALLET' | 'COD' | 'TRANSFER';
  shippingAddressId: string;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private orderService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAll() {
    return await this.orderService.findAll();
  }

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
  async getHistory(@Req() req) {
    const orders = await this.prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    // Map dữ liệu về đúng format response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      total: order.totalPrice,
      items: order.items.map((item) => ({
        productName: item.product.name,
        varient: {
          size: item.variant.size,
          color: item.variant.color,
        },
        price: item.unitPrice,
        quantity: item.quantity,
        // image: item.product.
      })),
    }));

    return formattedOrders;
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
