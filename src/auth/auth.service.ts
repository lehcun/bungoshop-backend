import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
    console.log(user.password, password);

    console.log(user, valid);
    if (!user || !valid) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }
    const payload = {
      username: user.name,
      phone: user.phone,
      email: user.email,
      userId: user.id,
    };
    const token = this.jwtService.sign(payload);

    const { password: pw, ...userWithoutPass } = user;
    return { access_token: token, user: userWithoutPass };
  }

  async signUp(name: string, email: string, password: string): Promise<any> {
    const exist = await this.usersService.findOneByEmail(email);
    console.log('exist: ', exist);
    if (exist) throw new ConflictException('Email đã tồn tại');
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { name, email, password: hashPassword },
    });

    const token = this.jwtService.sign({ userId: user.id });
    return { access_token: token, user };
  }
}
