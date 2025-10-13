import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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

  async findOne(id: number) {
    return this.prisma.review.findMany({
      where: { id },
      include: {
        user: true,
      },
    });
  }
}
