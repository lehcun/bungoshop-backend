import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';

export interface CartItemPayload {
  productId: string;
  variantId: string;
  quantity: number;
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
    console.log(userId, productId, variantId, quantity);
    return this.cartService.addCartItem(userId, productId, variantId, quantity);
  }
}
