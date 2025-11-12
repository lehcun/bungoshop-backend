import { Body, Controller, Delete, Get, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = await this.authService.signIn(
      body.email,
      body.password,
    );
    const token = loginResult.access_token;
    const user = loginResult.user;

    if (!token) throw new Error('Not found token ');

    //Biến isProd để xác định môi trường dev hay pro
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: '/',
    });
    return { user, message: 'Đăng nhập thành công' };
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
    });
    res.send('Đã xóa cookie');
  }

  @Post('register')
  async signup(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.authService.signUp(body.name, body.email, body.password);
  }
}
