# Chạy web trực tiếp bằng GitHub Pages

## Bật website — không cần cài Node.js

1. Giải nén bộ mã nguồn. Mở thư mục `cham-thi-smart-github`.
2. Trên GitHub, tạo repository (ví dụ `cham-thi-thpt`). Đưa **nội dung bên trong** thư mục này lên repository. Ngay gốc repository phải thấy `index.html`, thư mục `pages/`, `public/`, `package.json` và các thư mục nguồn khác. Không upload nguyên ZIP.
3. Trong repository chọn **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
4. Chọn nhánh **main**, thư mục **/(root)**, nhấn **Save**.
5. Chờ GitHub hoàn tất xuất bản; quay lại Settings → Pages và mở đường dẫn GitHub cung cấp. Dạng thông thường: `https://TEN_TAI_KHOAN.github.io/TEN_REPOSITORY/`.
6. Mở đường dẫn đó bằng Chrome trên Android hoặc Safari trên iPhone, cho phép camera. Nhập file Excel đáp án và danh sách học sinh (chọn Sheet12 nếu phù hợp), rồi quét/chấm.

Nếu upload cả thư mục `cham-thi-smart-github` nằm bên trong repository, đường dẫn sẽ thêm `/cham-thi-smart-github/`. Nên upload **nội dung** để đường dẫn gọn hơn.

GitHub Free hỗ trợ Pages với repository public; các gói khác có thể hỗ trợ repository private. Quyền đọc repository và quyền xem website là hai việc khác nhau: không coi GitHub Pages là cổng đăng nhập riêng của tổ. Không commit ảnh bài làm, danh sách học sinh, đáp án thực tế, mật khẩu hay token lên repository.

## Bản Pages làm được gì?

- Nhập Excel, cài đặt số câu và điểm từng phần, chọn mẫu phiếu.
- Dùng camera, quét/chụp 3 hoặc 5 giây, đọc ô tô và chấm trên thiết bị.
- Duyệt/sửa nhận dạng, lưu ảnh trong trình duyệt, xuất bảng điểm Excel và tải ảnh.
- Kết nối Drive tùy chọn: phải tự cấu hình Google OAuth Client ID và thêm origin `https://TEN_TAI_KHOAN.github.io` trong Google Cloud. Không dùng đường dẫn repository trong origin; không đưa Client Secret vào frontend.

## Giới hạn

- Không có tài khoản giáo viên, phân quyền, kho ảnh chung hay đồng bộ bảng điểm chung. Muốn có đầy đủ chức năng này, triển khai Cloudflare theo `TRIEN_KHAI.md`.
- Dữ liệu được lưu trên trình duyệt/thiết bị, không tự sang máy khác. Sao lưu trước khi xóa dữ liệu trình duyệt. Mỗi đường dẫn thư mục Pages có vùng dữ liệu riêng; đổi tên repository/địa chỉ cần sao lưu trước.
- GitHub Pages cần bật theo các bước trên; upload file lên repository chưa đủ. Không mở bằng `raw.githubusercontent.com` hoặc chỉ nhấp `index.html` trong giao diện xem source GitHub.
- `index.html` ở gốc là điểm vào và chuyển tới `pages/index.html`; không phải file HTML độc lập chứa cả ứng dụng. Luôn giữ thư mục `pages/` đi cùng.
- Không có chế độ cài APK Android hay cam kết chạy offline hoàn toàn. Có thể thêm lối tắt web ra màn hình chính.

## Cập nhật giao diện/thuật toán từ source

Bản nguồn đầy đủ giữ ở `public/`. Sau khi sửa, chạy `npm ci` rồi `npm run build:pages` để tạo lại `pages/`, chạy `npm test`, sau đó upload/commit các file thay đổi. Không sửa `pages/` bằng tay vì lần build tiếp theo sẽ ghi đè.

## Tài liệu chính thức

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
