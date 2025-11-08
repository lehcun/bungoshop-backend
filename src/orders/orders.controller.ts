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
    private readonly orderService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAll() {
    return this.orderService.findAll();
  }

  @Get('/month/:id')
  async getLastMonth(@Param('id') month: number) {
    return this.orderService.findByMonth(month);
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
