import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('API Giỏ hàng (e2e)', () => {
  let app: INestApplication;
  let authToken = 'Bearer token_gia_lap_hoac_lay_tu_api_login';

  // Khởi động server NestJS ảo
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Test Case: API_CART_01
  it('/api/cart (POST) - Thêm sản phẩm thành công', async () => {
    const payload = { productId: 5, quantity: 2 };

    const response = await request(app.getHttpServer())
      .post('/api/cart')
      .set('Authorization', authToken)
      .send(payload);

    // Kiểm chứng (Assert) với các cột trong file Excel
    expect(response.status).toBe(HttpStatus.CREATED); // Kỳ vọng 201
    expect(response.body).toHaveProperty('quantity', 2);
  });

  // Test Case: API_CART_02
  it('/api/cart (POST) - Validation lỗi số lượng', async () => {
    const badPayload = { productId: 5, quantity: 'hai' }; // Cố tình truyền sai kiểu dữ liệu

    const response = await request(app.getHttpServer())
      .post('/api/cart')
      .set('Authorization', authToken)
      .send(badPayload);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST); // Kỳ vọng 400 Bad Request
  });
});
