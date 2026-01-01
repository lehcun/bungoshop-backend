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
    console.log('isDefault: ', isDefault);
    console.log('isDefaultType: ', typeof isDefault);
    const isDef = isDefault ? true : false;
    const newDto = { userId: req.user.id, isDefault: isDef, ...body };
    return await this.userService.createAddress(newDto);
  }

  @Put('address/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateAddress(
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
    return await this.userService.updateAddress({
      userId: req.user.id,
      ...body,
    });
  }
}
