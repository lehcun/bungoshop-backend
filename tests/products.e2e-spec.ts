import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Products & Product API (e2e)', () => {
  let app: INestApplication;
  let createdProductId: string; // Lưu ID để test các route GET/:id và DELETE

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Rất quan trọng cho TC_PROD_11: Bật ValidationPipe để check DTO
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // KHỐI 1: TẠO SẢN PHẨM (POST /product)
  // ==========================================

  it('TC_PROD_11: [POST /product] Tạo sản phẩm thất bại do thiếu payload', async () => {
    const badPayload = { description: 'Thiếu name và price' };

    const response = await request(app.getHttpServer())
      .post('/product')
      .send(badPayload);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('TC_PROD_10: [POST /product] Tạo sản phẩm mới thành công', async () => {
    const validPayload = {
      name: 'Laptop Test Jest',
      price: 20000000,
      description: 'Sản phẩm tạo tự động từ Jest',
      // Thêm các field bắt buộc khác trong DTO của bạn nếu có
    };

    const response = await request(app.getHttpServer())
      .post('/product')
      .send(validPayload);

    expect(response.status).toBe(HttpStatus.CREATED); // 201 Created
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(validPayload.name);

    // Lưu lại ID để xài cho các test bên dưới
    createdProductId = response.body.id;
  });

  // ==========================================
  // KHỐI 2: ĐỌC VÀ LỌC DỮ LIỆU (GET /products)
  // ==========================================

  it('TC_PROD_01: [GET /products/all] Lấy tất cả sản phẩm', async () => {
    const response = await request(app.getHttpServer()).get('/products/all');

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1); // Ít nhất phải có cái laptop vừa tạo
  });

  it('TC_PROD_02: [GET /products/month] Lấy sản phẩm của tháng hiện tại', async () => {
    const response = await request(app.getHttpServer()).get('/products/month');

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('TC_PROD_05: [GET /products/search] Tìm kiếm sản phẩm theo từ khóa', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/search')
      .query({ keyword: 'Laptop Test' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it('TC_PROD_07: [GET /products] Lọc sản phẩm KHÔNG phân trang', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ sort: 'desc', priceRange: '10000000-30000000' }); // Query string

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('TC_PROD_08: [GET /products] Phân trang sản phẩm', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(HttpStatus.OK);
    // Dữ liệu phân trang thường bọc trong một object chứa metadata, ví dụ response.body.data
    // Tùy theo cách bạn return trong service mà assert cho đúng nhé
    expect(response.body).toBeDefined();
  });

  it('TC_PROD_09: [GET /products] Chuỗi categories tự động split', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ categories: 'laptop,phone', page: 1, limit: 10 });

    expect(response.status).toBe(HttpStatus.OK);
  });

  // ==========================================
  // KHỐI 3: ĐỌC CHI TIẾT THEO ID VÀ LỖI
  // ==========================================

  it('TC_PROD_03: [GET /product/:id] Lấy chi tiết 1 sản phẩm theo ID', async () => {
    const response = await request(app.getHttpServer()).get(
      `/product/${createdProductId}`,
    );

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveProperty('id', createdProductId);
  });

  it('TC_PROD_04: [GET /product/:id/variants] Lấy danh sách biến thể của sản phẩm', async () => {
    const response = await request(app.getHttpServer()).get(
      `/product/${createdProductId}/variants`,
    );

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('TC_PROD_06: [GET /product/:id] Báo lỗi 404 nếu ID sản phẩm không tồn tại', async () => {
    const response = await request(app.getHttpServer()).get(
      '/product/999999999',
    ); // ID ảo

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ==========================================
  // KHỐI 4: XÓA SẢN PHẨM (DELETE /product/:id)
  // ==========================================

  it('TC_PROD_12: [DELETE /product/:id] Xóa sản phẩm thành công', async () => {
    const response = await request(app.getHttpServer()).delete(
      `/product/${createdProductId}`,
    );

    expect(response.status).toBe(HttpStatus.OK);

    // Có thể double check bằng cách gọi GET lại xem đã ra 404 chưa
    const checkDeleted = await request(app.getHttpServer()).get(
      `/products/${createdProductId}`,
    );
    expect(checkDeleted.status).toBe(HttpStatus.NOT_FOUND);
  });
});
