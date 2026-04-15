import { test, expect } from '@playwright/test';
const BASE_URL = 'https://bungoshop.io.vn';

test.describe('Kiểm thử giao diện Giỏ hàng (Cart UI)', () => {
  // Chạy trước mỗi Test Case: Giả lập việc thêm 1 sản phẩm vào giỏ rồi vào trang Cart
  test.beforeEach(async ({ page }) => {
    // 1. Đăng nhập trước khi test giỏ hàng
    await page.goto(`${BASE_URL}/buyer/login`);
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();

    // Đợi đăng nhập xong và chuyển về trang chủ hoặc trang sản phẩm
    await expect(page).toHaveURL(`${BASE_URL}/`);

    await page.goto(`${BASE_URL}/shop`);
    await page.getByRole('link', { name: 'product-img NEW' }).first().click();
    await page.getByRole('button', { name: 'White' }).click();
    await page.getByRole('button', { name: 'L', exact: true }).click();
    await page.getByRole('button', { name: '🛒 Thêm vào giỏ hàng' }).click();
    await page.goto(`${BASE_URL}/cart`);
  });

  test('UI_CART_01: Tăng số lượng sản phẩm', async ({ page }) => {
    // Tìm dòng chứa sản phẩm đầu tiên trong giỏ hàng
    const cartItem = page.getByText(
      'Gucci Polo ShirtPhân loại hàng: White L700.000 ₫-2+🗑️',
    );

    // Lấy số lượng ban đầu (Kỳ vọng là 1)
    const quantityInput = cartItem.getByText('1', { exact: true });
    await expect(quantityInput).toHaveValue('1');

    // Click nút Tăng (+)
    await cartItem.getByRole('button', { name: '+' }).click();

    // KIỂM CHỨNG: Số lượng phải tự động cập nhật thành 2
    // Playwright cực kỳ thông minh, nó sẽ tự động đợi (auto-wait) cho đến khi số đổi thành 2
    await expect(quantityInput).toHaveValue('2');
  });

  test('UI_CART_02: Giảm số lượng sản phẩm', async ({ page }) => {
    const cartItem = page.locator('.cart-item').first();
    const quantityInput = cartItem.locator('input[type="number"]');

    // Đầu tiên click (+) để nó lên 2 đã
    await cartItem.getByRole('button', { name: '+' }).click();
    await expect(quantityInput).toHaveValue('2');

    // Sau đó click nút Giảm (-)
    await cartItem.getByRole('button', { name: '-' }).click();

    // KIỂM CHỨNG: Số lượng tụt về 1
    await expect(quantityInput).toHaveValue('1');
  });

  test('UI_CART_03: Nút giảm bị vô hiệu hóa khi số lượng = 1', async ({
    page,
  }) => {
    const cartItem = page.locator('.cart-item').first();
    const quantityInput = cartItem.locator('input[type="number"]');

    // Đảm bảo số lượng đang là 1
    await expect(quantityInput).toHaveValue('1');

    // Tìm nút (-)
    const decreaseBtn = cartItem.getByRole('button', { name: '-' });

    // KIỂM CHỨNG: Tùy UI của bạn thiết kế. Thường thì nút này sẽ bị thuộc tính `disabled`
    await expect(decreaseBtn).toBeDisabled();
  });

  test('UI_CART_04 & 05: Xóa sản phẩm và hiển thị Giỏ hàng trống', async ({
    page,
  }) => {
    const cartItem = page.locator('.cart-item').first();

    // Click biểu tượng Thùng rác (hoặc nút Xóa)
    // Ví dụ UI của bạn dùng icon thùng rác có class .delete-btn
    await cartItem.locator('.delete-btn').click();

    // Đợi 1 chút nếu UI có popup xác nhận "Bạn có chắc muốn xóa?"
    // await page.getByRole('button', { name: 'Xác nhận' }).click();

    // KIỂM CHỨNG 1: Khối sản phẩm đó biến mất hoàn toàn khỏi màn hình
    await expect(cartItem).not.toBeVisible();

    // KIỂM CHỨNG 2: Màn hình hiện dòng chữ "Giỏ hàng trống"
    const emptyMessage = page.getByText('Giỏ hàng của bạn đang trống');
    await expect(emptyMessage).toBeVisible();

    // KIỂM CHỨNG 3: Không có nút "Thanh toán"
    const checkoutBtn = page.getByRole('button', { name: 'Thanh toán' });
    await expect(checkoutBtn).not.toBeVisible();
  });
});
