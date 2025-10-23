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
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';

//Hai cai nay se lam DTO sau
export interface CartItemPayload {
  productId: string;
  variantId: string;
  quantity: number;
}
export interface CartItemIdPayload {
  id: string;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyCart(@Req() req) {
    const userId = req.user.id;
    return this.cartService.findCartByUserId(userId);
  }

  @Post('/add')
  @UseGuards(AuthGuard('jwt'))
  async addToCartItem(@Req() req, @Body() payload: CartItemPayload) {
    const userId = req.user.id;
    const { productId, variantId, quantity } = payload;
    return this.cartService.addCartItem(userId, productId, variantId, quantity);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async removeCartItem(@Req() req, @Param() payload: CartItemIdPayload) {
    const userId = req.user.id;
    return this.cartService.removeCartItem(userId, payload.id);
  }
}
