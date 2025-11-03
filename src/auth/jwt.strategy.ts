import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'MY_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    // Lấy user đầy đủ từ DB
    const user = await this.userService.findOne(payload.usedId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    const { password, ...userWithoutPass } = user;
    return userWithoutPass; // req.user = user đầy đủ
  }
}
