import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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

    if (filters.priceRange) {
      const range = filters.priceRange;

      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        where.price = { gte: min * 1000, lte: max * 1000 };
      } else if (range.includes('+')) {
        const min = Number(range.replace('+', ''));
        where.price = { gte: min * 1000 };
      }
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

    if (filters.priceRange) {
      const range = filters.priceRange;

      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        where.price = { gte: min * 1000, lte: max * 1000 };
      } else if (range.includes('+')) {
        const min = Number(range.replace('+', ''));
        where.price = { gte: min * 1000 };
      }
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

  async getAllProducts() {
    // 1. Định nghĩa cái "Chìa khóa" (Key) để tìm trong Redis
    const cacheKey = 'ALL_PRODUCTS';

    // 2. Hỏi Redis xem có dữ liệu chưa?
    const cachedProducts = await this.cacheManager.get(cacheKey);

    // Nếu có (Cache Hit) -> Trả về luôn, không cần đụng Database!
    if (cachedProducts) {
      console.log('⚡ Lấy data từ Redis siêu tốc!');
      return cachedProducts;
    }

    // 3. Nếu không có (Cache Miss) -> Query vào Postgres bằng Prisma
    console.log('🐢 Lấy data từ Database (chậm hơn)');
    const products = await this.prisma.product.findMany({
      include: {
        PromotionOnProduct: {
          include: {
            promotion: true,
          },
        },
      },
    });

    // 4. Lưu kết quả vừa tìm được vào Redis để lần sau dùng
    // (Tham số cuối là TTL: tính bằng mili-giây. Ở đây tôi set 5 phút)
    await this.cacheManager.set(cacheKey, products, 5 * 60 * 1000);

    return (await products).map((p) => this.applyPromotion(p));

    // const products = this.prisma.product.findMany({
    //   include: {
    //     PromotionOnProduct: {
    //       include: {
    //         promotion: true,
    //       },
    //     },
    //   },
    // });
    // return (await products).map((p) => this.applyPromotion(p));
  }

  async findByMonth() {
    const currentYear = new Date().getFullYear();
    const currMonth = new Date().getMonth() + 1;
    const startDay = new Date(currentYear, currMonth - 1, 1 + 1);
    const endDay = new Date(currentYear, currMonth, 1);

    const data = this.prisma.product.findMany({
      where: { createdAt: { gte: startDay, lt: endDay } },
      orderBy: { createdAt: 'desc' },
    });

    return data;
  }

  // Lấy chi tiết 1 sản phẩm
  async findOne(id: string) {
    const cacheKey = `PRODUCT_DETAIL_${id}`;

    // Check cache
    const cachedProduct = await this.cacheManager.get(cacheKey);
    if (cachedProduct) {
      console.log(`⚡ Lấy chi tiết sản phẩm ${id} từ Redis!`);
      return cachedProduct;
    }

    console.log(`🐢 Lấy chi tiết sản phẩm ${id} từ Database...`);
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        reviews: true,
        PromotionOnProduct: {
          include: { promotion: true },
        },
      },
    });

    if (!product) return null;

    const result = this.applyPromotion(product);

    // Chi tiết sản phẩm ít thay đổi -> lưu cache 15 phút
    await this.cacheManager.set(cacheKey, result, 900000);

    return result;
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

  async findVariants(productId: string) {
    return await this.prisma.productVariant.findMany({
      where: { productId },
    });
  }
}
