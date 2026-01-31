import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OrdersModule } from 'src/orders/orders.module';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
