import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(
    @Body()
    dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const adminLoginResult = await this.authService.adminSignIn(
      dto.email,
      dto.password,
    );
    const token = adminLoginResult.access_token;
    const user = adminLoginResult.user;

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

  @Post('login')
  async login(
    @Body()
    dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = await this.authService.signIn(dto.email, dto.password);
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

    return { message: 'Đăng xuất thành công' };
  }

  @Post('register')
  async signup(
    @Body()
    dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const signUpResult = await this.authService.signUp(
      dto.name,
      dto.email,
      dto.password,
    );
    const token = signUpResult.access_token;
    const user = signUpResult.user;

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { user, message: 'Dang ky thanh cong' };
  }
}
