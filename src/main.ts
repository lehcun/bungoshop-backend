import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://89.167.124.206:3000',
      'http://bungoshop.io.vn', // Thêm tên miền của bạn
      'https://bungoshop.io.vn', // Thêm bản https luôn cho bước sau
      'http://www.bungoshop.io.vn',
      'https://www.bungoshop.io.vn',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(3001);
}
bootstrap();
