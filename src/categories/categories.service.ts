import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({ include: { products: true } });
  }

  //Sẽ làm lại logic này sau
  async findTrend() {
    return this.prisma.category.findMany({ take: 3 });
  }
}
