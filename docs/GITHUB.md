# Đưa source lên GitHub

## Cách 1 — giao diện website

1. GitHub → New repository → đặt tên, ví dụ `cham-thi-thpt`.
2. Chọn Private, tạo repository trống.
3. Add file → Upload files.
4. Kéo **nội dung bên trong `cham-thi-smart-github`** vào, không chỉ kéo tệp ZIP.
5. Kiểm tra đã có `package.json`, `public`, `worker`, `server`, `migrations` và `.github/workflows` ngay ở gốc repository.
6. Commit changes. Nếu trình duyệt không kéo được thư mục ẩn `.github`, dùng GitHub Desktop hoặc Git như bên dưới.

Để chạy ngay trên GitHub Pages, làm tiếp theo `GITHUB_PAGES.md`. Để dùng backend chấm chung, theo `TRIEN_KHAI.md`.

## Cách 2 — GitHub Desktop

File → Add local repository, chọn thư mục `cham-thi-smart-github`. Nếu thư mục chưa là repository, chọn tạo repository tại đó. Commit, Publish repository và chọn Keep this code private. Không chọn nhầm thư mục `sites-original`.

## Cách 3 — Git

Chạy trong thư mục `cham-thi-smart-github`:

```bash
git init
git add .
git commit -m "Initial source: Cham Thi"
git branch -M main
git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_REPOSITORY.git
git push -u origin main
```

Thay tên tài khoản/repository bằng địa chỉ thật của thầy. Đăng nhập theo hướng dẫn GitHub; không ghi token vào URL remote hay tệp source.

## Kiểm thử tự động

Workflow `Kiem tra ma nguon` chạy khi push/pull request. Nó cài dependency từ lockfile, chạy test và đóng gói thử Worker. Workflow không chứa token Cloudflare và không tự xuất bản production.

Workflow `Trien khai Cloudflare` chỉ chạy khi người có quyền chọn Run workflow sau khi đã cấu hình production. Xem `TRIEN_KHAI.md`.
