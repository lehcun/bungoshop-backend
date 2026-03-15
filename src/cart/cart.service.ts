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
    console.log(userId, cartItemId);
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

  async updateQuantity(
    userId: string,
    cartItemId: string,
    quantityChange: number,
  ) {
    if (!userId || !cartItemId) {
      throw new Error('Thiếu thông tin user hoặc cart item');
    }
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId, userId },
    });

    const currQuantity = cartItem.quantity;

    const result = await this.prisma.cartItem.updateMany({
      where: { id: cartItemId, userId },
      data: {
        quantity: currQuantity + quantityChange,
      },
    });
    if (result.count === 0) {
      throw new Error('Không tìm thấy sản phẩm trong giỏ hàng của user này');
    }

    return {
      message: 'Đã update sản phẩm trong giỏ hàng',
    };
  }

  async updateVariant(
    userId: string,
    cartItemId: string,
    newVariantId: string,
  ) {
    if (!userId || !cartItemId || !newVariantId) {
      throw new Error('Thiếu thông tin user hoặc cart item');
    }

    // 1. Lấy CartItem hiện tại ra (Kèm theo Product để đề phòng Variant không set giá)
    const currentCartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!currentCartItem || currentCartItem.userId !== userId) {
      throw new Error('Không tìm thấy giỏ hàng hoặc không có quyền truy cập');
    }

    if (currentCartItem.variantId === newVariantId) {
      return currentCartItem;
    }

    // 2. Lấy Variant mới lên
    const newVariant = await this.prisma.productVariant.findUnique({
      where: { id: newVariantId },
    });

    // 3. Xử lý giá (Fallback: Nếu variant không có giá riêng thì lấy giá gốc của Product)
    const finalPrice =
      newVariant.price !== null
        ? newVariant.price
        : currentCartItem.product.price;

    if (!newVariant) {
      throw new Error('Không tìm thấy phân loại sản phẩm');
    }

    // 4. Kiểm tra xem User đã có Variant này trong giỏ hàng chưa (tránh lỗi Unique)
    const existingCartItemWithNewVariant =
      await this.prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId,
            productId: currentCartItem.productId,
            variantId: newVariantId,
          },
        },
      });

    if (existingCartItemWithNewVariant) {
      return await this.prisma.$transaction(async (tx) => {
        const newQuantity =
          existingCartItemWithNewVariant.quantity + currentCartItem.quantity;

        // Cập nhật lại số lượng và tổng tiền cho item đã tồn tại
        const updatedItem = await tx.cartItem.update({
          where: { id: existingCartItemWithNewVariant.id },
          data: {
            quantity: newQuantity,
            totalPrice: newQuantity * finalPrice,
          },
        });

        // Xóa dòng giỏ hàng cũ đi
        await tx.cartItem.delete({
          where: { id: currentCartItem.id },
        });

        return updatedItem;
      });
    }

    return await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        variantId: newVariantId,
        priceAtAdd: finalPrice,
        totalPrice: finalPrice * currentCartItem.quantity,
      },
    });
  }
}
