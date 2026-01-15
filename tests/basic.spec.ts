import { test, expect } from '@playwright/test';

// URL của backend NestJS
const API_URL = 'http://localhost:3001';

test.describe('Kiểm tra API User', () => {
  test('Nên tạo được User mới và lưu vào MySQL', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`; // Email ngẫu nhiên để không trùng

    // 1. Gửi request POST đến NestJS
    const response = await request.post(`${API_URL}/users`, {
      data: {
        email: email,
        name: 'Gia Cát Lượng',
        password: '123456',
      },
    });

    // 2. Kiểm tra status code (Nên là 201 Created)
    expect(response.status()).toBe(201);

    // 3. Kiểm tra dữ liệu trả về có đúng email vừa tạo không
    const body = await response.json();
    expect(body.email).toBe(email);
    expect(body.id).toBeDefined();
  });

  test('Nên lấy được danh sách User', async ({ request }) => {
    const response = await request.get(`${API_URL}/users`);

    expect(response.ok()).toBeTruthy();
    const users = await response.json();

    // Kiểm tra kết quả trả về phải là một mảng
    expect(Array.isArray(users)).toBe(true);
  });
});
