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

  //Phần này truy vấn quá nặng cần sửa lại trong tương lai
  @Get('/user/history')
  @UseGuards(AuthGuard('jwt'))
  async getHistory(@Req() req) {
    const orders = await this.prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
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
      totalPrice: order.totalPrice,
      items: order.items.map((item) => {
        // Logic lấy ảnh:
        // Ưu tiên 1: Ảnh của variant (ví dụ: ảnh màu đỏ)
        // Ưu tiên 2: Ảnh đầu tiên trong mảng images của Product
        // Ưu tiên 3: Placeholder nếu không có ảnh nào
        const itemImage =
          item.variant?.imageUrl ||
          (item.product.images.length > 0 ? item.product.images[0].url : null);
        return {
          productName: item.product.name,
          varient: {
            size: item.variant.size,
            color: item.variant.color,
          },
          price: item.unitPrice,
          quantity: item.quantity,
          imageUrl: itemImage,
        };
      }),
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
