import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('categories') category?: string | string[],
    @Query('priceRange') priceRange?: string,
    @Query('sort') sort?: string,
  ) {
    // ⚙️ Chuyển category thành mảng luôn
    const categories = category
      ? Array.isArray(category)
        ? category
        : category.split(',')
      : [];

    return this.productsService.findFilter({ categories, priceRange });
  }

  @Get('/all')
  async getAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
