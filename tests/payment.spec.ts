import { test, expect } from '@playwright/test';

// URL của backend NestJS

test.describe('Kiểm tra luông thanh toán của người dùng', () => {
  test('Người dùng thanh toán thành công', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page
      .getByRole('textbox', { name: 'Email' })
      .fill('lehcun1099@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.goto('http://localhost:3000/shop');
    await page.getByRole('link', { name: 'product-img NEW' }).first().click();
    await page.getByRole('button', { name: 'White' }).click();
    await page.getByRole('button', { name: 'L', exact: true }).click();
    await page.getByRole('button', { name: '🛒 Thêm vào giỏ hàng' }).click();
    await page.goto('http://localhost:3000/cart');
    await page.getByRole('button', { name: 'VNPay' }).click();
    await page.getByText('💳 Thanh toán').click();
    await page.getByText('Thẻ nội địa và tài khoản ngân').click();
    await page.locator('#NCB').click();
    await page.getByPlaceholder('Nhập số thẻ').fill('9704198526191432198');
    await page
      .getByPlaceholder('Nhập tên chủ thẻ (không dấu)')
      .fill('NGUYEN VAN A');
    await page.getByPlaceholder('MM/YY').fill('07/15');
    await page.locator('#btnContinue').click();
    await page.getByRole('link', { name: 'Đồng ý & Tiếp tục' }).click();
    await page.getByPlaceholder('Nhập mã OTP').click();
    await page.getByPlaceholder('Nhập mã OTP').fill('123456');
    await page.getByRole('button', { name: 'Thanh toán' }).click();

    await expect(
      page.getByRole('heading', { name: 'Thanh toán thành công' }),
    ).toBeVisible();
  });

  test('Người dùng hủy thanh toán', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page
      .getByRole('textbox', { name: 'Email' })
      .fill('lehcun1099@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.goto('http://localhost:3000/shop');
    await page.getByRole('link', { name: 'product-img NEW' }).first().click();
    await page.getByRole('button', { name: 'White' }).click();
    await page.getByRole('button', { name: 'L', exact: true }).click();
    await page.getByRole('button', { name: '🛒 Thêm vào giỏ hàng' }).click();
    await page.goto('http://localhost:3000/cart');
    await page.getByRole('button', { name: 'VNPay' }).click();
    await page.getByText('💳 Thanh toán').click();
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();

    await expect(
      page.getByRole('heading', { name: 'Thanh toán thất bại' }),
    ).toBeVisible();
  });
});
