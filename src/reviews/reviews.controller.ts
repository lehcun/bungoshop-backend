import { Controller, Get, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewServidce: ReviewsService) {}

  @Get()
  async getAll() {
    return this.reviewServidce.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.reviewServidce.findOne(Number(id));
  }
}
