import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Lấy toàn bộ sản phẩm
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
      },
    });
  }

  // Lấy chi tiết 1 sản phẩm
  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
      },
    });
  }
}
