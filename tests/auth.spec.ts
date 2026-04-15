import { test, expect } from '@playwright/test';

const BASE_URL = 'https://bungoshop.io.vn';

// =====================================================================
// TEST SUITE 1: ĐĂNG NHẬP (LOGIN)
// =====================================================================
test.describe('Test Suite: Đăng nhập (Login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/buyer/login`);
  });

  test('TC_DN_01: Đăng nhập thành công', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('TC_DN_02: Sai password', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('WrongPass123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'sai email hoặc mật khẩu',
      { ignoreCase: true },
    );
  });

  test('TC_DN_03: Sai email', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('notexist123@gmail.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'sai email hoặc mật khẩu',
      { ignoreCase: true },
    );
  });

  test('TC_DN_04: Nhập sai mật khẩu 5 lần', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('Password').fill(`WrongPass${i}`);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForTimeout(500); // Chờ UI phản hồi
    }
    // Lần 6 thử đăng nhập lại
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    // Test case CSV báo FAIL do hệ thống không khóa, đoạn expect này kiểm tra xem có bị khóa không
    await expect(page.locator('.error-message')).toContainText(
      'Tài khoản bị khóa',
    );
  });

  test('TC_DN_05: Bỏ trống email', async ({ page }) => {
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng nhập email',
      { ignoreCase: true },
    );
  });

  test('TC_DN_06: Bỏ trống password', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng nhập mật khẩu',
      { ignoreCase: true },
    );
  });

  test('TC_DN_07: Bỏ trống tất cả', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'yêu cầu nhập đầy đủ',
    );
  });

  test('TC_DN_08: Email sai định dạng', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099gmail.com'); // Thiếu @
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'sai email hoặc mật khẩu',
      { ignoreCase: true },
    );
  });

  test('TC_DN_09: Password quá ngắn', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('123'); // Ngắn hơn quy định
    await page.getByRole('button', { name: 'Login' }).click();
    // Test case CSV ghi là FAIL vì vẫn đăng nhập được, expect ở đây là mong đợi của Test case
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('TC_DN_10: Facebook login trả về 404', async ({ page }) => {
    await page.getByRole('button', { name: /Facebook/i }).click();
    await expect(page.locator('body')).not.toContainText(
      'This page could not be found',
    );
  });

  test('TC_DN_11: Google login trả về 404', async ({ page }) => {
    await page.getByRole('button', { name: /Google/i }).click();
    await expect(page.locator('body')).not.toContainText(
      'This page could not be found',
    );
  });

  test('TC_DN_12: Password có khoảng trắng', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill(' 123456 ');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Sai email hoặc mật khẩu',
      { ignoreCase: true },
    );
  });

  test('TC_DN_13: Nhấn Enter để login', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('TC_DN_14: Email có chữ hoa', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('LEHCUN1099@GMAIL.COM');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    // CSV báo FAIL vì vẫn login được, nhưng kết quả mong muốn là đăng nhập thành công
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });
});

// =====================================================================
// TEST SUITE 2: ĐĂNG KÝ (REGISTER)
// =====================================================================
test.describe('Test Suite: Đăng ký (Register)', () => {
  test.beforeEach(async ({ page }) => {
    // Sửa lại URL nếu đường dẫn đăng ký của bạn khác
    await page.goto(`${BASE_URL}/buyer/register`);
  });

  test('TC_REG_01: Đăng ký thành công', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser01');
    await page
      .getByPlaceholder('Email')
      .fill(`testuser${Date.now()}@gmail.com`); // Dùng Date.now() để email luôn mới
    await page.getByPlaceholder('Password').fill('StrongPass123!');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/buyer/login`);
  });

  test('TC_REG_02: Bỏ trống tên', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('newuser02@gmail.com');
    await page.getByPlaceholder('Password').fill('StrongPass123!');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng điền đủ thông tin',
      { ignoreCase: true },
    );
  });

  test('TC_REG_03: Bỏ trống email', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser03');
    await page.getByPlaceholder('Password').fill('StrongPass123!');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng điền đủ thông tin',
      { ignoreCase: true },
    );
  });

  test('TC_REG_04: Bỏ trống password', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser04');
    await page.getByPlaceholder('Email').fill('newuser04@gmail.com');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng điền đủ thông tin',
      { ignoreCase: true },
    );
  });

  test('TC_REG_05: Bỏ trống tất cả', async ({ page }) => {
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng điền đủ thông tin',
      { ignoreCase: true },
    );
  });

  test('TC_REG_06: Email thiếu @', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser06');
    await page.getByPlaceholder('Email').fill('newuser06gmail.com');
    await page.getByPlaceholder('Password').fill('StrongPass123!');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toContainText(
      "Vui lòng bao gồm '@'",
      { ignoreCase: true },
    );
  });

  test('TC_REG_07: Password quá ngắn', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser07');
    await page
      .getByPlaceholder('Email')
      .fill(`testuser${Date.now()}@gmail.com`);
    await page.getByPlaceholder('Password').fill('123');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toBeVisible(); // Bắt buộc phải có lỗi
  });

  test('TC_REG_08: Email đã tồn tại', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('Le Hieu');
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com'); // Email đã có
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    // Theo CSV là Fail do nó lại báo xác nhận thay vì báo tồn tại
    await expect(page.locator('.error-message')).toContainText(
      'Email đã tồn tại',
      { ignoreCase: true },
    );
  });

  test('TC_REG_09: Tên có ký tự đặc biệt', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('User@#$%');
    await page
      .getByPlaceholder('Email')
      .fill(`testuser${Date.now()}@gmail.com`);
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.error-message')).toBeVisible(); // Mong muốn không cho đăng ký
  });

  test('TC_REG_10: Email viết hoa', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser10');
    await page
      .getByPlaceholder('Email')
      .fill(`TESTUSER${Date.now()}@GMAIL.COM`);
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/buyer/login`); // Đăng ký thành công
  });

  test('TC_REG_11: Password hợp lệ', async ({ page }) => {
    await page.getByPlaceholder('Tên người dùng').fill('TestUser11');
    await page
      .getByPlaceholder('Email')
      .fill(`testuser${Date.now()}@gmail.com`);
    await page.getByPlaceholder('Password').fill('Strong!@#Pass123');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/buyer/login`);
  });
});

// =====================================================================
// TEST SUITE 3: QUÊN MẬT KHẨU (FORGOT PASSWORD)
// =====================================================================
test.describe('Test Suite: Quên mật khẩu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/buyer/forgot-password`);
  });

  test('TC_FP_01: Đổi mật khẩu thành công', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();

    // Giả lập nhập OTP (Cần chỉnh selector theo giao diện thực tế)
    await page.getByPlaceholder('Nhập mã OTP').fill('123456');
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(page.locator('.toast-message')).toContainText(
      'Đổi mật khẩu thành công',
    );
  });

  test('TC_FP_02: Email chưa đăng ký', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('chuadangky@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Không tìm thấy tài khoản với email này',
      { ignoreCase: true },
    );
  });

  test('TC_FP_03: Email sai định dạng', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('saiemail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await expect(page.locator('.error-message')).toContainText(
      "Vui lòng bao gồm '@'",
      { ignoreCase: true },
    );
  });

  test('TC_FP_04: Bỏ trống email', async ({ page }) => {
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Vui lòng nhập email',
      { ignoreCase: true },
    );
  });

  test('TC_FP_05: Email có khoảng trắng', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun 1099@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'không được chứa biểu tượng',
      { ignoreCase: true },
    );
  });

  test('TC_FP_06: Nhập sai OTP', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await page.getByPlaceholder('Nhập mã OTP').fill('000000'); // OTP sai
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Mã xác nhận không chính xác',
    );
  });

  test('TC_FP_07: OTP hết hạn', async ({ page }) => {
    // Kịch bản này khó auto 100% nếu không can thiệp backend, ở đây chỉ viết luồng giả định
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await page.waitForTimeout(61000); // Đợi 1 phút giả định hết hạn
    await page.getByPlaceholder('Nhập mã OTP').fill('123456');
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(page.locator('.error-message')).toContainText(
      'Mã xác nhận đã hết hạn',
    );
  });

  test('TC_FP_08: Gửi lại mã thành công', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();
    await page.getByRole('button', { name: 'Gửi lại mã' }).click();
    await expect(page.locator('.toast-message')).toContainText(
      'Mã OTP đặt lại mật khẩu đã được gửi',
    );
  });

  test('TC_FP_09: Nhập OTP nhiều lần sai', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click();

    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('Nhập mã OTP').fill(`00000${i}`);
      await page.getByRole('button', { name: 'Xác nhận' }).click();
    }
    // Mong muốn hệ thống sẽ khóa form nhập OTP
    await expect(page.locator('.error-message')).toContainText('giới hạn nhập');
  });
});
