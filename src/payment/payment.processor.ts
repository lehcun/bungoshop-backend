import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// Giả sử bạn có 2 service này để xử lý mail và PDF
// import { EmailService } from 'src/email/email.service';
// import { PdfService } from 'src/pdf/pdf.service';

@Processor('process-successful-payment')
@Injectable()
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    // private readonly emailService: EmailService,
    // private readonly pdfService: PdfService,
  ) {
    super();
  }

  // Hàm này là "trái tim" của Worker, tự động chạy khi có Job rớt vào Queue
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[Worker] Bắt đầu xử lý Job ${job.id} - Đơn hàng: ${job.data.orderId}`,
    );

    // Dựa vào tên công việc để phân luồng (vì 1 Queue có thể chứa nhiều loại việc khác nhau)
    switch (job.name) {
      case 'process-successful-payment': {
        const { orderId } = job.data;

        console.log('--- WORKER ĐÃ NHẬN ĐƯỢC JOB ---');
        console.log('Data nhận được:', job.data);

        // Giả lập xử lý tốn thời gian
        await new Promise((res) => setTimeout(res, 3000));

        console.log('--- WORKER XỬ LÝ XONG (FAKE) ---');

        // 1. Lấy toàn bộ thông tin đơn hàng (kèm thông tin User để lấy Email)
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { user: true, items: true },
        });

        if (!order) {
          this.logger.error(`Không tìm thấy đơn hàng ${orderId}`);
          throw new Error('Order not found'); // Quăng lỗi để BullMQ biết và tự động Retry
        }

        try {
          // 2. Tạo file PDF Hóa đơn (Tác vụ nặng số 1: Mất khoảng 1-2s)
          this.logger.log(`Đang tạo PDF hóa đơn cho đơn ${orderId}...`);
          // const pdfBuffer = await this.pdfService.generateInvoice(order);

          // 3. Gửi Email đính kèm PDF (Tác vụ nặng số 2: Mất khoảng 2-3s)
          this.logger.log(
            `Đang gửi Email xác nhận tới: ${order.user.email}...`,
          );
          // await this.emailService.sendOrderConfirmation(order.user.email, pdfBuffer);

          this.logger.log(
            `[Worker] Hoàn thành xuất sắc xử lý đơn ${orderId} 🎉`,
          );
          return { success: true };
        } catch (error) {
          // Nếu lỗi ở khâu gửi Email (VD: Đứt cáp mạng, server mail từ chối)
          this.logger.error(
            `Lỗi trong quá trình tạo PDF/Gửi Mail cho đơn ${orderId}`,
            error.stack,
          );
          throw error; // BẮT BUỘC phải throw error để BullMQ kích hoạt cơ chế Retry 3 lần
        }
      }

      default:
        this.logger.warn(`Không nhận diện được công việc: ${job.name}`);
    }
  }

  // (Optional) Lắng nghe sự kiện khi Job thất bại hoàn toàn sau 3 lần Retry
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `❌ Job ${job.id} thất bại HOÀN TOÀN sau các lần thử lại! Lỗi: ${error.message}`,
    );
    // Thực tế: Chỗ này thường để bắn thông báo qua Telegram/Slack cho Admin biết
    // "Sếp ơi hệ thống gửi Mail đang tèo, vào check đi!!!"
  }
}
