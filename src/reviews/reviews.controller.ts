import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '@nestjs/passport';

export interface ReviewPayload {
  productId: string;
  variantId: string;
  rating: number;
  comment: string;
}

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

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() req,
    @Param('id') orderId: string,
    @Body() payload: ReviewPayload[],
  ) {
    console.log(req.user.id, orderId, payload);
    return await this.reviewServidce.create(req.user.id, orderId, payload);
  }
}
