import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.order.findMany({});
  }

  async findByMonth(month: number) {
    const currentYear = new Date().getFullYear();
    const startDay = new Date(currentYear, month - 1, 1 + 1);
    const endDay = new Date(currentYear, month, 1);

    const data = this.prisma.order.findMany({
      where: { createdAt: { gte: startDay, lt: endDay } },
      orderBy: { createdAt: 'desc' },
    });

    return data;
  }

  async checkout(
    userId: string,
    paymentMethod: 'CARD' | 'WALLET' | 'COD' | 'TRANSFER',
    shippingAddressId: string,
  ) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true, variant: true },
    });

    for (const item of cartItems) {
      if (item.quantity > item.variant.stock) {
        throw new Error(
          `Khong đủ sản phẩm ${item.variant.color} ${item.variant.size} trong kho`,
        );
      }

      await this.prisma.productVariant.update({
        where: {
          id: item.variantId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    const subtotalPrice = cartItems.reduce(
      (sum, item) => sum + item.priceAtAdd,
      0,
    );

    const shippingFeePrice = 30000; // cứng v1
    const totalPrice = subtotalPrice + shippingFeePrice;
    const discountPrice = 0;

    const order = await this.prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        subtotalPrice,
        shippingFeePrice,
        discountPrice,
        totalPrice,
        paymentMethod,
        shippingAddress: {
          connect: { id: shippingAddressId },
        },
        items: {
          create: cartItems.map((item) => ({
            product: { connect: { id: item.productId } },
            variant: item.variantId
              ? { connect: { id: item.variantId } }
              : undefined,
            quantity: item.quantity,
            unitPrice: item.priceAtAdd,
            totalPrice: item.priceAtAdd * item.quantity,
          })),
        },
      },
    });

    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return order;
  }
}
