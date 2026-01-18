import { test, expect } from '@playwright/test';

test.describe('Luồng đăng nhập người dùng', () => {
  test('Khách hàng đăng nhập thành công và chuyển hướng vào Trang chủ', async ({
    page,
  }) => {
    // 1. Đi đến trang đăng nhập (NextJS chạy ở port 3000)
    await page.goto('http://localhost:3000/user/login');

    // 2. Điền thông tin vào form
    // Playwright tìm các ô input dựa trên label, placeholder hoặc CSS selector
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('123456');

    // 3. Nhấn nút Login
    await page.getByRole('button', { name: 'Login' }).click();

    // 4. KIỂM TRA (ASSERTION)
    // Kiểm tra URL có chuyển hướng sang trang chủ không
    await expect(page).toHaveURL('http://localhost:3000');
  });

  test('Hiển thị lỗi khi nhập sai mật khẩu', async ({ page }) => {
    await page.goto('http://localhost:3000/user/login');
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    const toast = page.getByText('Sai email hoặc mật khẩu');

    // Kiểm tra thông báo lỗi hiển thị trên màn hình
    await expect(toast).toBeVisible();
    // await expect(toast).toContainText('Đăng nhập thất bại');
  });

  test('Hiển thị lỗi khi nhập sai email', async ({ page }) => {
    await page.goto('http://localhost:3000/user/login');
    await page.getByPlaceholder('Email').fill('wrongemail.gmail.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();

    const toast = page.getByText('Sai email hoặc mật khẩu');

    // Kiểm tra thông báo lỗi hiển thị trên màn hình
    await expect(toast).toBeVisible();
    // await expect(toast).toContainText('Đăng nhập thất bại');
  });

  test('Không thể đăng nhập khi chưa nhập mật khẩu', async ({ page }) => {
    await page.goto('http://localhost:3000/user/login');
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    const visible = await page
      .getByRole('button', { name: 'Login' })
      .isVisible();

    await expect(visible).toBeTruthy();
  });

  test('Không thể đăng nhập khi chưa nhập email', async ({ page }) => {
    await page.goto('http://localhost:3000/user/login');
    await page.getByPlaceholder('Password').fill('123456');

    const visible = await page
      .getByRole('button', { name: 'Login' })
      .isVisible();

    await expect(visible).toBeTruthy();
  });

  test('Khóa đăng nhập nếu nhập sai quá 5 lần', async ({ page }) => {
    await page.goto('http://localhost:3000/user/login');
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');

    //Dang nhap sai 5 lan
    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      const toast = await page.getByText('Sai email hoặc mật khẩu');
    }
    //Lan 6
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    const lockMessage = page.locator('text=Bạn đã nhập sai quá nhiều lần');
    await expect(lockMessage).toBeVisible();
  });
});
