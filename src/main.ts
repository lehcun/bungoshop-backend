import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // cho phép frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // nếu cần cookie / Authorization header
  });

  await app.listen(3001);
}
bootstrap();
