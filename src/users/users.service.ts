import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: number, data: { name?: string; email?: string }): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  delete(id: number): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
