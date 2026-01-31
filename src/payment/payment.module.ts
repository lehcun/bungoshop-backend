import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrdersModule } from 'src/orders/orders.module';
@Module({
  imports: [OrdersModule],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
