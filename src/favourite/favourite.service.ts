import { Injectable } from '@nestjs/common';
import { Favourite } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavouriteService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(usedId: string) {
    return await this.prisma.favourite.findMany({
      where: { userId: usedId },
      include: {
        product: { include: { category: true, images: true, variants: true } },
      },
    });
  }

  async create(userId: string, productId: string) {
    const data = {
      userId,
      productId,
    };
    return await this.prisma.favourite.create({
      data,
      include: { product: true },
    });
  }

  async delete(id: string): Promise<Favourite> {
    return await this.prisma.favourite.delete({
      where: { id },
      include: { product: true },
    });
  }
}
