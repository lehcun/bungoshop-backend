import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UserService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UserService,
    private mailerService: MailerService,
  ) {}

  async signIn(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const valid = await bcrypt.compare(password, user.password); // bắt buộc phải để biến thô trước băm
    if (!valid) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
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
    const lowerCaseEmail = email.toLocaleLowerCase();

    const existUser = await this.prisma.user.findUnique({
      where: { email: lowerCaseEmail },
    });

    if (existUser) {
      if (existUser.status === 'ACTIVE') {
        throw new ConflictException('Email này đã được đăng ký và xác thực.');
      } else if (
        existUser.status === 'DELETED' ||
        existUser.status === 'SUSPENDED'
      ) {
        throw new ConflictException('Email này đã bị xóa hoặc đang tạm dừng.');
      } else if (existUser.status === 'UNVERIFIED') {
        // Nếu status là UNVERIFIED thì xóa đi tạo lại (hoặc update) để lấy mã mới
        await this.prisma.user.delete({ where: { email: lowerCaseEmail } });
      }
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email: lowerCaseEmail,
        password: hashPassword,
        // role: 'CUSTOMER', -> Prisma tự default
        // status: 'UNVERIFIED', -> Prisma tự default
      },
    });

    // Tạo và lưu mã OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.otp.upsert({
      where: { email: lowerCaseEmail },
      update: { code: otpCode, expiresAt },
      create: { email: lowerCaseEmail, code: otpCode, expiresAt },
    });

    // Gửi mail
    await this.mailerService.sendMail({
      to: lowerCaseEmail,
      subject: 'Mã xác nhận đăng ký tài khoản',
      text: `Mã xác nhận của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút.`,
    });

    return { message: 'Vui lòng kiểm tra email để lấy mã xác nhận.' };
  }

  async verifySignUp(email: string, code: string): Promise<any> {
    const lowerCaseEmail = email.toLocaleLowerCase();

    const otpRecord = await this.prisma.otp.findUnique({
      where: { email: lowerCaseEmail },
    });

    if (!otpRecord || otpRecord.code !== code) {
      throw new UnauthorizedException('Mã xác nhận không chính xác.');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException('Mã xác nhận đã hết hạn.');
    }

    // Cập nhật status thành ACTIVE
    const user = await this.prisma.user.update({
      where: { email: lowerCaseEmail },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.otp.delete({ where: { email: lowerCaseEmail } });

    // Cấp Token
    const payload = { username: user.name, email: user.email, sub: user.id };
    const access_token = await this.jwtService.signAsync(payload);

    const { password: pw, ...userWithoutPass } = user;

    return {
      message: 'Xác nhận email thành công!',
      access_token,
      user: userWithoutPass,
    };
  }
}
