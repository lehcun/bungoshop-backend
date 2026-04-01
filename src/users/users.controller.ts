import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Gender } from '@prisma/client';

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

  @Post()
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.userService.create(body);
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  async updateInfo(
    @Req() req,
    @Body() body: { name: string; gender: Gender; dob: string },
  ) {
    const userId = req.user.id;
    return await this.userService.updateUserInfo(
      userId,
      body.name,
      body.gender,
      body.dob,
    );
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

  //ADDRESS
  @Get('address/default')
  @UseGuards(AuthGuard('jwt'))
  async getDefaultAddress(@Req() req) {
    return await this.userService.findDefaultAddress(req.user.id);
  }

  @Get('address')
  @UseGuards(AuthGuard('jwt'))
  async getAddress(@Req() req) {
    return await this.userService.findAllAddressById(req.user.id);
  }

  @Post('address')
  @UseGuards(AuthGuard('jwt'))
  async createAddress(
    @Req() req,
    @Body()
    body: {
      recipient: string;
      city: string;
      line1: string;
      phone: string;
      label?: string;
      isDefault?: boolean;
    },
  ) {
    const { isDefault } = body;
    const isDef = isDefault ? true : false;
    const newDto = { userId: req.user.id, isDefault: isDef, ...body };
    return await this.userService.createAddress(newDto);
  }

  @Delete('address/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteAddress(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return await this.userService.deleteAddress(id, userId);
  }

  @Put('address/:id')
  async updateAddress(
    @Param() param,
    @Req() req,
    @Body()
    body: {
      id: string;
      recipient: string;
      city: string;
      line1: string;
      phone: string;
      label?: string;
      isDefault?: boolean;
    },
  ) {
    const { id } = param;
    return await this.userService.updateAddress({
      id,
      userId: req.user.id,
      ...body,
    });
  }
}
