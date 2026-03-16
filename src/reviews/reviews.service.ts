import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReviewPayload } from './reviews.controller';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}
  async findAll(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: true,
        variant: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.review.findMany({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async create(userId: string, orderId: string, payload: ReviewPayload[]) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Chuẩn bị mảng dữ liệu để insert
      const dataToInsert = payload.map((item) => ({
        userId: userId,
        productId: item.productId,
        variantId: item.variantId,
        rating: item.rating,
        comment: item.comment,
      }));

      // 2. Thực hiện bulk insert
      const result = await tx.review.createMany({
        data: dataToInsert,
        skipDuplicates: true,
      });

      // 3. Chuyển status từ SHIPPED thành COMPLETED
      // Dùng updateMany rất hay vì nó cho phép chèn nhiều điều kiện (userId, status)
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: orderId,
          userId: userId,
          status: 'SHIPPED', // Chỉ update nếu đơn này đúng là SHIPPED
        },
        data: {
          status: 'COMPLETED',
        },
      });

      // 4. (Tùy chọn) Bắt lỗi nếu không cập nhật được đơn hàng
      // Ví dụ user cố tình truyền sai orderId hoặc đơn hàng đó chưa được giao (chưa SHIPPED)
      if (updatedOrder.count === 0) {
        throw new BadRequestException(
          'Không thể cập nhật đơn hàng. Có thể đơn hàng không tồn tại, không thuộc về bạn, hoặc chưa ở trạng thái Đang giao.',
        );
      }

      return {
        message: 'Đánh giá sản phẩm thành công',
        insertedCount: result.count,
      };
    });
  }
}
