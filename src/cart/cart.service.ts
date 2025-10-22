import { Injectable } from '@nestjs/common';
import { CartItem } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async findCartByUserId(userId: string): Promise<CartItem[] | null> {
    return await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: true,
          },
        },
        variant: true,
      },
    });
  }

  async addCartItem(userId, productId, variantId, quantity) {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId_variantId: {
          userId,
          productId,
          variantId,
        },
      },
    });
    if (existing)
      return await this.prisma.cartItem.update({
        where: { id: (await existing).id },
        data: {
          quantity: (await existing).quantity + (quantity && 1),
          totalPrice:
            ((await existing).quantity + (quantity && 1)) *
            (await existing).priceAtAdd,
        },
      });

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        variantId,
        quantity,
        priceAtAdd: (await product).price,
        totalPrice: (await product).price * quantity,
      },
    });
  }
}
