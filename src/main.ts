import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔹 bật CORS cho Next.js (localhost:3000)
  app.enableCors({
    origin: 'http://localhost:3000', // domain frontend
    credentials: true, // nếu dùng cookie
  });

  await app.listen(3001);
}
bootstrap();
