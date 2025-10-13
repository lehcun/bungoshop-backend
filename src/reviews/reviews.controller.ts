import { Controller, Get, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewServidce: ReviewsService) {}

  @Get(':id')
  async getAll(@Param('id') id: string) {
    return this.reviewServidce.findAll(id);
  }

  // @Get(':id')
  // async getOne(@Param('id') id: number) {
  //   return this.reviewServidce.findOne(Number(id));
  // }
}
