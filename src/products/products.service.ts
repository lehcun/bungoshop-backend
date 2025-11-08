import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ===== Utility function =====
  private applyPromotion(product: any) {
    const validPromos =
      product.PromotionOnProduct?.filter(
        (p: any) =>
          p.promotion &&
          p.promotion.active &&
          new Date(p.promotion.startsAt) <= new Date() &&
          new Date(p.promotion.expiresAt) >= new Date(),
      ) || [];

    if (validPromos.length === 0) {
      return { ...product, salePrice: product.price, discountPercent: 0 };
    }

    let bestPromo = null;
    let bestSalePrice = product.price;
    let bestDiscountPercent = 0;

    for (const p of validPromos) {
      const promo = p.promotion;
      let salePrice = product.price;
      let discountPercent = 0;

      if (promo.discountType === 'PERCENT') {
        discountPercent = promo.discountPercent ?? 0;
        salePrice = Math.round(product.price * (1 - discountPercent));
      } else if (promo.discountType === 'AMOUNT') {
        salePrice = Math.min(salePrice, product.price - promo.discountAmount);
        discountPercent = salePrice / product.price;
      }
      // Nếu giảm nhiều hơn thì chọn cái này
      if (salePrice < bestSalePrice) {
        bestSalePrice = salePrice;
        bestPromo = promo;
        bestDiscountPercent = discountPercent;
      }
    }

    return {
      ...product,
      salePrice: bestSalePrice,
      discountPercent: Number(Math.floor(bestDiscountPercent * 100)),
      promotion: bestPromo,
    };
  }

  // Lấy toàn bộ sản phẩm theo filter
  async findFilter(filters: {
    categories?: string[];
    brands?: string[];
    priceRange?: string;
    sort?: string;
  }) {
    const where: any = {};
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

    const products = this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        reviews: true,
        PromotionOnProduct: {
          include: {
            promotion: true,
          },
        },
      },
    });
    return (await products).map((p) => this.applyPromotion(p));
  }

  async findPaginatedProducts(page: number, limit: number, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};
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

    const products = await this.prisma.product.findMany({
      skip,
      take: limit,
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        reviews: true,
        PromotionOnProduct: {
          include: {
            promotion: true,
          },
        },
      },
    });

    const withPromo = products.map((p) => this.applyPromotion(p));

    const total = await this.prisma.product.count();
    return {
      data: withPromo,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findHot(count: number) {
    const products = this.prisma.product.findMany({
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
        PromotionOnProduct: {
          include: {
            promotion: true,
          },
        },
      },
    });
    return (await products).map((p) => this.applyPromotion(p));
  }

  // Lấy toàn bộ sản phẩm
  async findAll() {
    const products = this.prisma.product.findMany({
      include: {
        PromotionOnProduct: {
          include: {
            promotion: true,
          },
        },
      },
    });
    return (await products).map((p) => this.applyPromotion(p));
  }

  // Lấy chi tiết 1 sản phẩm
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        // category: true,
        // brand: true,
        images: true,
        variants: true,
        reviews: true,
        PromotionOnProduct: {
          include: {
            promotion: true,
          },
        },
      },
    });
    if (!product) return null;
    return this.applyPromotion(product);
  }

  //Lấy sản phẩm theo searchParams
  async findBySearchParam(query: string) {
    if (!query) return [];
    return await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          // { description: { contains: query } },
          // { brand: { contains: query } },
        ],
      },
      include: {
        images: true,
        category: true,
        reviews: true,
      },
      take: 8,
    });
  }
}
