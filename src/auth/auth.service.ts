import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UserService,
  ) {}

  async signIn(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    const valid = await bcrypt.compare(password, user.password); // bắt buộc phải để biến thô trước băm

    if (!user || !valid) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }
    const payload = {
      username: user.name,
      phone: user.phone,
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload); // sign -> signAsync
    const { password: pw, ...userWithoutPass } = user;
    return { access_token: token, user: userWithoutPass };
  }

  async adminSignIn(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // Check role chỉ dành cho ADMIN
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Không có quyền đăng nhập ADMIN');
    }

    const payload = {
      username: user.name,
      phone: user.phone,
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload); // sign -> signAsync
    const { password: pw, ...userWithoutPass } = user;
    return { access_token: token, user: userWithoutPass };
  }

  async signUp(name: string, email: string, password: string): Promise<any> {
    const exist = await this.usersService.findOneByEmail(email);
    if (exist) throw new ConflictException('Email đã tồn tại');
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email: email.toLocaleLowerCase(),
        password: hashPassword,
        role: 'CUSTOMER',
      },
    });

    const payload = { username: user.name, email: user.email, sub: user.id };

    const access_token = await this.jwtService.signAsync(payload);
    const { password: pw, ...userWithoutPass } = user;
    return { access_token, user: userWithoutPass };
  }
}
