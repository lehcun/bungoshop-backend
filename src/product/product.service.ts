import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { slugGenerate } from 'src/common/utils/slug.util';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async generateUniqueSlug(name: string) {
    const baseSlug = slugGenerate(name);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const exist = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (!exist) break;

      slug = `${baseSlug}-${count}`;
      count++;
    }
    return slug;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    console.log('dto: ', dto);
    const category = await this.prisma.category.findUnique({
      where: { name: dto.categoryId },
    });
    const slug = dto.slug || (await this.generateUniqueSlug(dto.name));
    return await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        status: dto.status,
        categoryId: category.id,
        brandId: dto.brandId,

        images: dto.images
          ? {
              create: dto.images.map((img) => ({
                url: img.url,
                altText: img.altText,
              })),
            }
          : undefined,

        variants: dto.variants
          ? {
              create: dto.variants.map((v) => ({
                sku: v.sku,
                size: v.size,
                color: v.color,
                metadata: v.metadata,
                price: v.price,
                stock: v.stock,
                imageUrl: v.imageUrl,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        variants: true,
      },
    });
  }

  async removeProduct(id: string) {
    return await this.prisma.product.delete({ where: { id } });
  }
}
