import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Lấy toàn bộ sản phẩm theo filter
  async findFilter(filters: {
    categories?: string[];
    priceRange?: string;
    sort?: string;
  }) {
    let orderBy: any = { createdAt: 'desc' }; // Default newest
    switch (filters.sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'date_oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'date_newest':
        orderBy = { createdAt: 'desc' };
        break;
    }

    console.log('📦 Filters:', filters);
    console.log('📑 Sort by:', orderBy);

    return this.prisma.product.findMany({
      where: {
        category: {
          name: { in: filters.categories },
        },
      },
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
