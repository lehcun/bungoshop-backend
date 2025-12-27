import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { UserService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  //Lấy luôn tháng hiện tại
  @Get('/month')
  async findByMonth() {
    return await this.userService.findByMonth();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(id);
  // }
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUserInfo(@Req() req) {
    return {
      user: req.user,
    };
  }

  @Get('address')
  @UseGuards(AuthGuard('jwt'))
  async getAddress(@Req() req) {
    return await this.userService.findAddressById(req.user.id);
  }

  @Post()
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.userService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string },
  ) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Post('address')
  async createAddress(
    @Body()
    body: {
      userId: string;
      recipient: string;
      city: string;
      line1: string;
      phone: string;
      label: string;
    },
  ) {
    console.log('body: ', body);
    return await this.userService.createAddress(body);
  }
}
