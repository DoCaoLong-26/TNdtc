# Triển khai website độc lập cho tổ chuyên môn

## 1. Chuẩn bị

Cần tài khoản Cloudflare do nhà trường/tổ quản lý, tên miền quản lý trên Cloudflare, và repository GitHub chứa source này. Dịch vụ Workers, D1, R2 và Access có cơ chế tính phí/giới hạn theo gói tài khoản; kiểm tra trên tài khoản trước khi sử dụng diện rộng. Không có chi phí hay gói dịch vụ nào được đăng ký tự động bởi source.

## 2. Tạo database và kho ảnh

Sau `npm ci`:

```bash
npx wrangler login
npx wrangler d1 create cham-thi-db
npx wrangler r2 bucket create cham-thi-images
```

Chép database ID được trả về vào `database_id` trong `wrangler.jsonc`. Đặt đúng `database_name` và `bucket_name` đã tạo. Giữ binding `DB` và `BUCKET` như source. R2 dùng qua Worker; không cần công khai bucket hoặc tạo public URL cho ảnh.

## 3. Tên miền và đăng nhập

Ví dụ tên miền riêng: `chamthi.truong.example` (thay bằng tên miền thật).

Trong Cloudflare Zero Trust:

1. Bật phương thức Google nếu đã có cấu hình Google identity provider; hoặc dùng mã xác thực email theo khả năng tài khoản Access.
2. Tạo **Access application dạng Self-hosted**, bảo vệ **toàn bộ hostname**, không chỉ `/team.html`.
3. Tạo policy Allow cho đúng các email giáo viên của tổ, có thể thêm email tổ trưởng và quản trị viên.
4. Lấy team domain dạng `https://TEN_TEAM.cloudflareaccess.com` và Application Audience (AUD).
5. Điền `ACCESS_TEAM_DOMAIN` và `ACCESS_POLICY_AUD` trong `wrangler.jsonc`; giữ `AUTH_MODE` là `access`.
6. Bỏ chú thích và điền route ở cuối file:

```json
"routes": [{"pattern":"chamthi.TEN_MIEN_THAT","custom_domain":true}]
```

Thêm dấu phẩy sau trường `vars` trước khi thêm `routes`. Hai cấu hình `workers_dev:false` và `preview_urls:false` được giữ để tránh đường dẫn phụ ngoài hostname đã chọn. Worker vẫn tự xác minh JWT trước mọi API và tài nguyên tĩnh.

Không dùng `wrangler.local.jsonc` để triển khai production. `DEV_EMAIL` chỉ dành cho dữ liệu giả trên máy cá nhân.

## 4. Kiểm tra và triển khai

```bash
npm run check
npm test
npm run build
npm run db:remote
npm run deploy
```

`npm run db:remote` và `npm run deploy` kiểm tra đã thay các giá trị mẫu trước khi chạy. Không sửa/xóa migration đã áp dụng; khi đổi schema cần tạo migration mới có thứ tự tiếp theo.

Mở tên miền thật. Access sẽ yêu cầu đăng nhập trước khi tải web. Thử lần lượt:

- Quản trị viên đăng nhập, tạo kỳ thi riêng, nhập Excel, chấm phiếu thử.
- Tạo kỳ thi chung, thêm giáo viên ở **Quản lý & phân công**.
- Giáo viên khác đăng nhập bằng email đã được Access cho phép và được phân công đúng kỳ thi.
- Kiểm tra giáo viên không xem được kỳ thi riêng của người khác.
- Quét hai phiếu cùng SBD, kiểm tra chỉ một bài được chốt.
- Tải/xem ảnh trên thiết bị thứ hai và xuất Excel lọc lớp.

## 5. Triển khai từ GitHub Actions

Trong repository GitHub → Settings → Secrets and variables → Actions, khai báo:

- `CLOUDFLARE_API_TOKEN`: token có quyền triển khai Worker, truy cập D1 và tài nguyên cần thiết của tài khoản; giới hạn đúng tài khoản/tài nguyên sử dụng.
- `CLOUDFLARE_ACCOUNT_ID`: ID tài khoản Cloudflare.

Không ghi hai giá trị này vào source. Tạo GitHub Environment tên `production`; có thể yêu cầu người phụ trách duyệt trước khi deploy. Sau khi đã điền cấu hình và commit, vào Actions → **Trien khai Cloudflare** → Run workflow.

Workflow chạy test, áp dụng migration còn thiếu, rồi triển khai. Một lần deploy lỗi có thể đã áp dụng migration trước đó; kiểm tra trạng thái trước khi sửa migration hoặc chạy lại.

## Tài liệu chính thức

- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/workers/wrangler/configuration/

### Kiểm tra đóng gói

`npm run build` chỉ chạy esbuild tại máy, không gọi Wrangler hoặc gửi source tới Cloudflare. Kiểm thử chức năng và đóng gói offline đã được thực hiện. Bước thử đóng gói bằng Wrangler trong môi trường tạo gói bị cơ chế phê duyệt tự động chặn vì có thể truyền thông tin source/build sang Cloudflare; việc triển khai production và đăng nhập Access thực tế chưa được xác minh trên tài khoản của trường. Chủ tài khoản thực hiện các lệnh triển khai sau khi đã cấu hình và chủ động chọn sử dụng Cloudflare.
