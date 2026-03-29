import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    configService: ConfigService,
  ) {
    super({
      //Thay từ đọc header sang etractors
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // --- BẮT ĐẦU ĐẶT BẪY LOG ---
          console.log('=== CÓ KHÁCH GỌI API ===');
          console.log('1. Tất cả Cookies nhận được:', req.cookies);
          console.log('2. Access Token lấy ra:', req?.cookies?.access_token);
          console.log('3. Chìa khóa đang dùng:', process.env.SECRET_KEY);
          console.log(
            '4. Chìa khóa đang dùng cach 2:',
            configService.get<string>('SECRET_KEY'),
          );
          console.log('========================');

          return req?.cookies?.access_token;
        }, // cấu hình thêm để lấy accesstoken từ cookie
      ]),
      secretOrKey: configService.get<string>('SECRET_KEY'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // Lấy user đầy đủ từ DB
    const user = await this.userService.findOne(payload.sub); // Trước là payload.usedId == sub
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    const { password, ...userWithoutPass } = user;
    return userWithoutPass; // req.user = user đầy đủ
  }
}
