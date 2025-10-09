import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}
  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: true,
        product: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.review.findMany({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    });
  }
}
