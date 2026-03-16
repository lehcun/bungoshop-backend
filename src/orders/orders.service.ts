import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { CartService } from 'src/cart/cart.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private cartService: CartService,
    private prisma: PrismaService,
  ) {}

  async findAll() {
    return await this.prisma.order.findMany({});
  }

  async findOne(id: string) {
    return await this.prisma.order.findUnique({ where: { id } });
  }

  async findOneIncludeItem(id: string) {
    return await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
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

  async getUserHistory(userId: string, status?: string, search?: string) {
    // 1. Build điều kiện truy vấn (Dynamic Where)
    let whereClause: Prisma.OrderWhereInput = {
      userId: userId,
    };

    if (status && status != 'all') {
      whereClause.status = status as OrderStatus;
    }

    if (search) {
      whereClause = {
        ...whereClause,
        items: {
          some: {
            product: {
              name: {
                contains: search,
              },
            },
          },
        },
      };
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
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

    // 3. Xử lý logic map dữ liệu (Format Response)
    return orders.map((order) => ({
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
          productId: item.productId,
          variantId: item.variantId,
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
  }

  async checkout(
    userId: string,
    paymentMethod: 'VNPay' | 'MOMO' | 'ATM' | 'COD',
    shippingAddressId: string,
    cartItemIds: string[],
  ) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        userId,
        id: {
          in: cartItemIds,
        },
      },
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
      where: { userId, id: { in: cartItemIds } },
    });

    return order;
  }

  async reOrder(userId: string, orderId: string) {
    // 1. Lấy thông tin đơn hàng cũ cùng các items
    const oldOrder = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: {
        items: {
          include: { variant: true, product: true },
        },
      },
    });

    if (!oldOrder) throw new Error('Không tìm thấy đơn hàng');

    const validItems = [];

    // 2. Kiểm tra từng item xem có thể mua lại không
    for (const item of oldOrder.items) {
      // Kiểm tra sản phẩm còn active và còn hàng không
      if (item.variant.stock >= item.quantity) {
        validItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    }

    // 3. Cập nhật vào giỏ hàng (Cart)
    // Giả sử bạn có CartService, hãy gọi hàm addToCart cho từng item hợp lệ
    for (const validItem of validItems) {
      await this.cartService.addCartItem(
        userId,
        validItem.productId,
        validItem.variantId,
        validItem.quantity,
      );
    }

    return {
      message: `Đã thêm ${validItems.length}/${oldOrder.items.length} sản phẩm vào giỏ hàng`,
      addedCount: validItems.length,
    };
  }
}
