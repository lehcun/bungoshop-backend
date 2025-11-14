import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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

export interface CartUpdatePayload {
  id: string;
  quantityChange: number;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyCart(@Req() req) {
    const userId = req.user.userId;
    return await this.cartService.findCartByUserId(userId);
  }

  @Post('/add')
  @UseGuards(AuthGuard('jwt'))
  async addToCartItem(@Req() req, @Body() payload: CartItemPayload) {
    const userId = req.user.userId;
    const { productId, variantId, quantity } = payload;
    return await this.cartService.addCartItem(
      userId,
      productId,
      variantId,
      quantity,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async removeCartItem(@Req() req, @Param() payload: CartItemIdPayload) {
    const userId = req.user.userId;
    console.log(userId);
    return await this.cartService.removeCartItem(userId, payload.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateCartItem(@Req() req, @Body() payload: CartUpdatePayload) {
    const userId = req.user.userId;

    // quantityChange dương là tăng còn âm là giảm
    const { id, quantityChange } = payload;
    return await this.cartService.updateQuantity(userId, id, quantityChange);
  }
}
