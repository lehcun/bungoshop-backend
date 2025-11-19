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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
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

    // ⚙️ Nếu có page/limit thì gọi pagination
    if (page && limit) {
      return this.productsService.findPaginatedProducts(
        Number(page),
        Number(limit),
        {
          categories,
          brands,
          priceRange,
          sort,
        },
      );
    }

    return this.productsService.findFilter({
      categories,
      brands,
      priceRange,
      sort,
    });
  }

  @Get('/hot/:id')
  async getHot(@Param('id') count: string) {
    return this.productsService.findHot(Number(count));
  }

  @Get('/all')
  async getAll() {
    return this.productsService.findAll();
  }

  @Get('/search')
  async getBySearchQuery(@Query('keyword') keyword?: string) {
    return this.productsService.findBySearchParam(keyword);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
