import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyCart(@Req() req) {
    const userId = req.user.id;
    return this.cartService.findCartByUserId(userId);
  }
}
