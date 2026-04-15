import { test, expect } from '@playwright/test';

const BASE_URL = 'https://bungoshop.io.vn';

test.describe('Test Suite: Giỏ hàng (Cart)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Đăng nhập trước khi test giỏ hàng
    await page.goto(`${BASE_URL}/buyer/login`);
    await page.getByPlaceholder('Email').fill('lehcun1099@gmail.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();

    // Đợi đăng nhập xong và chuyển về trang chủ hoặc trang sản phẩm
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('test_case_yeuthich', async ({ page }) => {
    await page.getByRole('button').nth(3).click();
    await expect(page.getByText('Đã thêm Casio MTP-V002D vào')).toBeVisible();
  });

  test('TC_GH_01: Thêm sản phẩm vào giỏ hàng', async ({ page }) => {
    // 2. Chọn một sản phẩm đầu tiên hiển thị trên trang chủ
    const product = page.locator('.product-item, .card').first();
    await product.click();

    // 3. Nhấn nút "Thêm vào giỏ hàng" (Dựa trên hình ảnh nút màu cam/đỏ của bạn)
    const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await addToCartBtn.click();

    // 4. Kiểm tra Toast message thông báo thành công
    await expect(page.getByText(/Thêm vào giỏ hàng thành công/i)).toBeVisible();
  });

  test('TC_GH_02: Thay đổi số lượng sản phẩm trong giỏ', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`); // Vào trang giỏ hàng

    // Tìm ô input số lượng của sản phẩm đầu tiên
    const quantityInput = page.locator('input[type="number"]').first();
    const oldVal = await quantityInput.inputValue();

    // Tăng số lượng lên 2
    await quantityInput.fill('2');
    await quantityInput.press('Enter');

    // Kiểm tra giá trị đã thay đổi
    await expect(quantityInput).toHaveValue('2');

    // Kiểm tra thông báo cập nhật (nếu có)
    await expect(page.getByText(/Cập nhật giỏ hàng thành công/i)).toBeVisible();
  });

  test('TC_GH_03: Xóa sản phẩm khỏi giỏ hàng', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);

    // Lưu số lượng sản phẩm trước khi xóa
    const productRows = page.locator('.cart-item, tr');
    const countBefore = await productRows.count();

    // Nhấn nút Xóa (thường là icon thùng rác hoặc chữ X)
    // Dựa trên giao diện, bạn có thể dùng locator theo class icon
    await page.locator('.btn-delete, .icon-trash').first().click();

    // Xác nhận xóa nếu có popup confirm
    // await page.getByRole('button', { name: 'Đồng ý' }).click();

    // Kiểm tra số lượng dòng sản phẩm giảm đi
    const countAfter = await productRows.count();
    expect(countAfter).toBeLessThan(countBefore);
    await expect(page.getByText(/Đã xóa sản phẩm/i)).toBeVisible();
  });

  test('TC_GH_04: Kiểm tra tổng tiền chính xác', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);

    // Lấy giá của sản phẩm 1 (Giả định selector lấy text tiền)
    const priceText = await page.locator('.product-price').first().innerText();
    const price = parseInt(priceText.replace(/\D/g, '')); // Chuyển "100.000đ" thành 100000

    // Lấy số lượng
    const qty = await page.locator('input[type="number"]').first().inputValue();
    const expectedTotal = price * parseInt(qty);

    // Lấy tổng tiền hiển thị cuối trang
    const totalDisplay = await page.locator('.total-price-final').innerText();
    const actualTotal = parseInt(totalDisplay.replace(/\D/g, ''));

    expect(actualTotal).toBe(expectedTotal);
  });

  test('TC_GH_05: Giỏ hàng trống', async ({ page }) => {
    // Xóa hết sạch giỏ hàng rồi kiểm tra giao diện
    // ... thực hiện xóa ...

    await expect(page.getByText(/Giỏ hàng của bạn đang trống/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Tiếp tục mua sắm' }),
    ).toBeVisible();
  });
});
