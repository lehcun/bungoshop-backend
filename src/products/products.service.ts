import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Lấy toàn bộ sản phẩm theo filter
  async findFilter(filters: {
    categories?: string[];
    brands?: string[];
    priceRange?: string;
    sort?: string;
  }) {
    let where: any = {};
    if (filters.categories && filters.categories.length > 0) {
      where.category = {
        name: { in: filters.categories },
      };
    }

    if (filters.brands && filters.brands.length > 0) {
      where.brand = {
        name: { in: filters.brands },
      };
    }

    let orderBy: any = {};
    switch (filters.sort) {
      case 'priceAsc':
        orderBy = { price: 'asc' };
        break;
      case 'priceDesc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'desc' };
        break;
    }

    return this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        reviews: true,
      },
    });
  }

  async findHot(count: number) {
    return this.prisma.product.findMany({
      where: {
        status: 'HOT',
      },
      take: count,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        reviews: true,
      },
    });
  }

  // Lấy toàn bộ sản phẩm
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        reviews: true,
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
        reviews: true,
      },
    });
  }

  async;
}
