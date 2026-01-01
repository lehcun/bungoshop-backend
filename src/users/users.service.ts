import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email }, // 👈 email phải là @unique trong Prisma schema
    });
  }

  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany({
      include: {
        cart: true,
        orders: true,
      },
    });
  }

  async findByMonth() {
    const currentYear = new Date().getFullYear();
    const currMonth = new Date().getMonth() + 1;
    const startDay = new Date(currentYear, currMonth - 1, 1 + 1);
    const endDay = new Date(currentYear, currMonth, 1);

    return await this.prisma.user.findMany({
      where: { createdAt: { gte: startDay, lt: endDay } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<User | null> {
    if (!id) return null;
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  //ADDRESS
  async findDefaultAddress(userId: string) {
    return await this.prisma.address.findFirst({
      where: { userId: userId, isDefault: true },
    });
  }

  async findAllAddressById(userId: string) {
    return await this.prisma.address.findMany({
      where: { userId: userId },
    });
  }

  async createAddress(body: {
    userId: string;
    recipient: string;
    city: string;
    line1: string;
    phone: string;
    label?: string;
    isDefault?: boolean;
  }) {
    const { userId, recipient, city, line1, phone, label, isDefault } = body;
    const data = {
      userId,
      recipient,
      phone,
      city,
      line1,
      label,
      isDefault,
      country: 'Viet Nam',
    };

    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: userId, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      const addresses = await this.prisma.address.findMany({
        where: { userId: userId },
      });

      if (addresses.length === 0) {
        data.isDefault = true;
      }
    }

    return await this.prisma.address.create({
      data,
    });
  }

  async updateAddress(body: {
    id: string;
    userId: string;
    recipient: string;
    city: string;
    line1: string;
    phone: string;
    label?: string;
    isDefault?: boolean;
  }) {
    const { id, userId, recipient, city, line1, phone, label, isDefault } =
      body;

    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    await this.prisma.address.update({
      where: { id },
      data: {
        recipient: recipient,
        city: city,
        line1: line1,
        phone: phone,
        label: label,
        isDefault: isDefault,
      },
    });
  }
}
