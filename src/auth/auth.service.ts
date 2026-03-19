import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
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

  // Sinh mã OTP, lưu vào DB và trả về mã đó

  private async generateAndSaveOtp(email: string): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.prisma.otp.upsert({
      where: { email },
      update: { code: otpCode, expiresAt },
      create: { email, code: otpCode, expiresAt },
    });

    return otpCode;
  }

  private async generateAuthResponse(user: any) {
    const payload = {
      username: user.name,
      phone: user.phone,
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);
    const { password, ...userWithoutPass } = user;

    return { access_token: token, user: userWithoutPass };
  }

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

    const otpCode = await this.generateAndSaveOtp(lowerCaseEmail);

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

    return {
      message: 'Xác nhận email thành công!',
      ...(await this.generateAuthResponse(user)),
    };
  }

  async resendOtp(email: string) {
    const lowerCaseEmail = email.toLocaleLowerCase();

    // 1. Kiểm tra xem email này có thực sự đang trong trạng thái chờ xác thực không
    const user = await this.prisma.user.findUnique({
      where: { email: lowerCaseEmail },
    });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại.');
    }

    if (user.status === 'ACTIVE') {
      throw new BadRequestException('Tài khoản này đã được xác thực.');
    }

    // 2. Tạo mã mới và cập nhật thời gian hết hạn
    const otpCode = await this.generateAndSaveOtp(lowerCaseEmail);

    // 3. Gửi lại mail
    await this.mailerService.sendMail({
      to: lowerCaseEmail,
      subject: 'Mã xác nhận đăng ký tài khoản (Gửi lại)',
      text: `Chào bạn, mã xác nhận đăng ký tài khoản của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút.`,
    });

    return { message: 'Mã xác nhận mới đã được gửi đến email của bạn.' };
  }

  // Quên mật khẩu - Hàm gửi reset otp
  async sendPasswordResetOtp(email: string) {
    const lowerCaseEmail = email.toLocaleLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: lowerCaseEmail },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tài khoản này chưa được xác thực hoặc đã bị khóa.',
      );
    }

    const otpCode = await this.generateAndSaveOtp(lowerCaseEmail);

    await this.mailerService.sendMail({
      to: lowerCaseEmail,
      subject: 'Mã OTP đặt lại mật khẩu',
      text: `Chào ${user.name},\n\nMã OTP để đặt lại mật khẩu của bạn là: ${otpCode}.\nMã này có hiệu lực trong 5 phút.\nNếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.`,
    });

    return {
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.',
    };
  }

  //Quên mật khẩu - Xác nhận OTP và cập nhật mật khẩu mới
  async resetPassword(email: string, code: string, newPassword: string) {
    const lowerCaseEmail = email.toLocaleLowerCase();

    const otpRecord = await this.prisma.otp.findUnique({
      where: { email: lowerCaseEmail },
    });

    // Kiểm tra mã OTP có tồn tại và khớp không
    if (!otpRecord || otpRecord.code !== code) {
      throw new UnauthorizedException('Mã xác nhận không chính xác.');
    }

    // Kiểm tra mã OTP đã hết hạn chưa
    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException(
        'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    // Kiểm tra User có tồn tại và đang ACTIVE không
    const user = await this.prisma.user.findUnique({
      where: { email: lowerCaseEmail },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new BadRequestException('Tài khoản không hợp lệ hoặc đã bị khóa.');
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới
    await this.prisma.user.update({
      where: { email: lowerCaseEmail },
      data: { password: hashPassword },
    });

    // Xóa mã OTP để không bị sử dụng lại (Bảo mật Replay Attack)
    await this.prisma.otp.delete({
      where: { email: lowerCaseEmail },
    });

    return {
      message:
        'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    };
  }
}
