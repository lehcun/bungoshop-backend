## 🔹 Các loại `onDelete`

1. **Cascade**
   - Khi xóa bản ghi cha → tự động xóa tất cả bản ghi con liên quan.
   - Ví dụ: xóa `Product` → tất cả `OrderItem` chứa product đó cũng bị xóa.
   - Hợp lý cho các quan hệ “phụ thuộc hoàn toàn” (child không tồn tại nếu parent mất).
   - Mapping SQL: `ON DELETE CASCADE`.

---

2. **SetNull**
   - Khi xóa bản ghi cha → trường khóa ngoại ở bản ghi con được set về `NULL`.
   - Ví dụ: `Order` có `userId String?`, nếu xóa `User` → `userId` của order = `NULL` (order vẫn tồn tại).
   - Chỉ dùng được khi trường foreign key là **optional** (`String?`), nếu bắt buộc (`String`) thì Prisma báo lỗi.
   - Mapping SQL: `ON DELETE SET NULL`.

---

3. **Restrict**
   - Ngăn không cho xóa bản ghi cha nếu còn bản ghi con liên kết.
   - Ví dụ: không thể xóa `User` nếu còn `Order` gắn với user đó.
   - Mapping SQL: `ON DELETE RESTRICT`.
   - Dùng khi muốn đảm bảo toàn vẹn dữ liệu.

---

4. **NoAction** (giống Restrict trong nhiều DB)
   - DB sẽ không làm gì khi cha bị xóa → nhưng nếu violation toàn vẹn khóa ngoại thì sẽ báo lỗi.
   - Khác biệt nhỏ so với `Restrict`: tuỳ engine DB, `NoAction` cho phép deferred check (kiểm tra cuối transaction).
   - Mapping SQL: `ON DELETE NO ACTION`.

---

5. **SetDefault**
   - Khi xóa bản ghi cha → giá trị foreign key ở con sẽ được gán về **DEFAULT**.
   - Ví dụ: nếu `productId` có default `'unknown'`, thì khi xóa product, orderItem sẽ gán về `'unknown'`.
   - Ít dùng trong thực tế vì phải cấu hình default.

---

## 🔹 Khi nào dùng loại nào?

- **Cascade** → khi bản ghi con hoàn toàn phụ thuộc cha (VD: `OrderItem` phụ thuộc `Order`).
- **SetNull** → khi bản ghi con có thể tồn tại mà không cần cha (VD: `Order` có thể tồn tại mà không còn `User`).
- **Restrict / NoAction** → khi muốn chặn xóa cha nếu còn con (VD: `Category` có `Product`, không cho xóa category nếu còn sản phẩm).
- **SetDefault** → hiếm khi dùng, chỉ khi có logic business đặc biệt (VD: gán về `GuestUser`).

---

👉 Tóm gọn:

- **Quan hệ mạnh** (Order → OrderItem): `Cascade`.
- **Quan hệ mềm** (Order → User, Order → Address): `SetNull`.
- **Quan hệ quản lý** (Category → Product): thường `Restrict` để không xóa nhầm.

---
