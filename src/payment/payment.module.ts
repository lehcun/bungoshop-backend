import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrdersModule } from 'src/orders/orders.module';
import { BullModule } from '@nestjs/bullmq';
import { PaymentProcessor } from './payment.processor';
@Module({
  imports: [
    OrdersModule,
    BullModule.registerQueue({ name: 'process-successful-payment' }),
  ],
  providers: [PaymentService, PaymentProcessor],
  controllers: [PaymentController],
})
export class PaymentModule {}
