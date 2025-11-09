import { Injectable } from '@nestjs/common';
import { CartItem } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

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
          quantity: (await existing).quantity + quantity,
          totalPrice:
            ((await existing).quantity + quantity) *
            (await existing).priceAtAdd,
        },
      });

    const product = await this.productsService.findOne(productId);

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        variantId,
        quantity,
        priceAtAdd: (await product).salePrice,
        totalPrice: (await product).salePrice * quantity,
      },
    });
  }

  // async removeCartItem(userId, cartItemId) {
  //   const existing = await this.prisma.cartItem.findFirst({
  //     where: { id: cartItemId, userId },
  //   });

  //   if (!existing) {
  //     throw new Error('Khong tim thay san pham trong gio hang');
  //   }

  //   return this.prisma.cartItem.delete({
  //     where: { id: cartItemId },
  //   });
  // }

  async removeCartItem(userId: string, cartItemId: string) {
    if (!userId || !cartItemId) {
      throw new Error('Thiếu thông tin user hoặc cart item');
    }

    const result = await this.prisma.cartItem.deleteMany({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new Error('Không tìm thấy sản phẩm trong giỏ hàng của user này');
    }

    return {
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      deletedCount: result.count,
    };
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (!userId || !cartItemId) {
      throw new Error('Thiếu thông tin user hoặc cart item');
    }
    const result = await this.prisma.cartItem.updateMany({
      where: { id: cartItemId, userId },
      data: {
        quantity,
      },
    });
    if (result.count === 0) {
      throw new Error('Không tìm thấy sản phẩm trong giỏ hàng của user này');
    }

    return {
      message: 'Đã update sản phẩm trong giỏ hàng',
    };
  }
}
