import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavouriteService } from './favourite.service';

export interface FavouritePayload {
  userId: string;
  productId: string;
}

@Controller('favourite')
export class FavouriteController {
  constructor(private favouriteService: FavouriteService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getHistory(@Req() req) {
    const userId = req.user.id;
    return this.favouriteService.findAll(userId);
  }

  @Post()
  async create(@Body() body: FavouritePayload) {
    const { userId, productId } = body;
    return await this.favouriteService.create(userId, productId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.favouriteService.delete(id);
  }
}
