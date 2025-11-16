import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from '@prisma/client';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return await this.productService.create(dto);
  }
}
