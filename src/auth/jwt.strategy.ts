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
        (req: Request) => req?.cookies?.access_token, // cấu hình thêm để lấy accesstoken từ cookie
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
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
