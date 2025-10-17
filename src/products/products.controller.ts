import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('categories') category?: string | string[],
    @Query('brands') brand?: string | string[],
    @Query('priceRange') priceRange?: string,
    @Query('sort') sort?: string,
  ) {
    // ⚙️ Chuyển category thành mảng luôn
    const categories = category
      ? Array.isArray(category)
        ? category
        : category.split(',')
      : [];

    // ⚙️ Chuyển brand thành mảng luôn
    const brands = brand
      ? Array.isArray(brand)
        ? brand
        : brand.split(',')
      : [];

    return this.productsService.findFilter({
      categories,
      brands,
      priceRange,
      sort,
    });
  }

  @Get('/display/:id')
  async getHot(@Param('id') count: string) {
    return this.productsService.findHot(Number(count));
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
