# Chấm Thi — web chấm trắc nghiệm cho tổ chuyên môn

Mã nguồn dùng camera smartphone để chụp phiếu A4, đọc SBD/mã đề/ô tô, chấm ba phần, quản lý kỳ thi riêng và kỳ thi chung, phân công giáo viên, đồng bộ ảnh và kết quả.

**Đây là thư mục để đưa lên GitHub.** GitHub quản lý mã nguồn, chạy kiểm thử và có thể phục vụ bản chấm trên thiết bị qua Pages. Bản đầy đủ được triển khai lên **Cloudflare Workers + D1 + R2**, đăng nhập qua **Cloudflare Access** (Google hoặc mã xác thực email). GitHub Pages chỉ phục vụ tệp tĩnh, không chạy được phần API và dữ liệu chấm chung của dự án này.

## Chạy trực tiếp trên GitHub Pages

Đã có `index.html` ở gốc và bản frontend sẵn dùng trong `pages/`. Upload nội dung thư mục này, rồi chọn Settings → Pages → Deploy from a branch → main → /(root). Xem [Hướng dẫn GitHub Pages](docs/GITHUB_PAGES.md). Bản này chấm trên từng thiết bị; chấm chung cần backend.

## Bắt đầu

1. Tạo repository GitHub của tổ, chọn **Private** nếu chưa muốn công khai mã.
2. Đưa toàn bộ nội dung thư mục này lên repository, gồm cả `.github/`, `.gitignore` và `package-lock.json`.
3. Cài Node.js 24 LTS trên máy tính; mở terminal tại thư mục dự án.
4. Chạy:

```bash
npm ci
npm run db:local
npm run dev
```

Mở URL loopback mà Wrangler in ra. Bản chạy thử dùng tài khoản giả `teacher@example.test` và database/kho ảnh trên máy; không truy cập dữ liệu nhà trường hay bản web đang dùng. Không cần tài khoản ChatGPT cho bản triển khai độc lập này.

Đọc [Hướng dẫn đưa lên GitHub](docs/GITHUB.md) và [Triển khai Cloudflare](docs/TRIEN_KHAI.md) để xuất bản website thật.

## Chức năng

- Chụp/căn phiếu theo bốn ô vuông đen; hiệu chỉnh từng lưới ô.
- Giữ nguyên thuật toán camera, OMR và chấm điểm từ bản web đã dùng; quét liên tục 3/5 giây.
- Nhập Excel danh sách học sinh/đáp án; chọn Sheet12 nếu dữ liệu ở sheet đó. Cột phòng thi `Phong`/`PhongThi` là tùy chọn.
- Kỳ thi riêng: mỗi giáo viên tự quản lý dữ liệu.
- Kỳ thi chung: người phụ trách phân công quản lý/chấm/duyệt/chỉ xem, theo lớp/phòng/SBD.
- Lưu local trước, tải ảnh và dữ liệu lên kho online; hỗ trợ thử lại khi mất mạng giữa lượt quét. Mở lại kỳ thi online cần kết nối và đăng nhập.
- Chốt điểm có kiểm tra phiên bản, ảnh, quyền duyệt và SBD trùng; có lịch sử thao tác.
- Bảng điểm lọc theo lớp/phòng/giáo viên/trạng thái, xuất Excel.
- Google Drive là chức năng tùy chọn, cần cấu hình OAuth cho tên miền mới.

## Cấu trúc

| Thư mục / tệp | Vai trò |
| --- | --- |
| `public/` | Giao diện, camera, OMR, chấm điểm, mẫu phiếu và thư viện Excel |
| `server/team-api.mjs` | API kỳ thi, giáo viên, phân quyền, bài làm và ảnh |
| `worker/index.mjs` | Điểm vào Worker, bảo vệ API và tài nguyên tĩnh |
| `worker/access.mjs` | Xác minh JWT Access, thay thế lớp đăng nhập Sites |
| `migrations/0000_initial.sql` | Schema database D1 |
| `tests/` | Kiểm thử OMR, camera, Excel, phân quyền, đồng bộ và đăng nhập |
| `scripts/` | Kiểm tra source/cấu hình và chạy test |
| `.github/workflows/` | CI và triển khai thủ công từ GitHub Actions |
| `wrangler.jsonc` | Cấu hình production cần điền tài nguyên Cloudflare thật |
| `wrangler.local.jsonc` | Cấu hình chạy local bằng tài khoản giả |
| `docs/` | Hướng dẫn triển khai, chuyển dữ liệu và vận hành |
| `SOURCE_PROVENANCE.json` | Nguồn gốc phiên bản và kiểm tra các module giữ nguyên |

## Các lệnh

```bash
npm run check       # Kiểm tra cú pháp
npm test            # Tất cả kiểm thử
npm run build       # Đóng gói Worker offline bằng esbuild, không xuất bản
npm run db:local     # Áp dụng migration vào database trên máy
npm run dev          # Chạy thử loopback
npm run db:remote    # Áp dụng migration lên D1 thật sau khi cấu hình
npm run deploy       # Triển khai website thật sau khi cấu hình
```

`build` không tạo website đang hoạt động. Cần tài khoản Cloudflare, tên miền, D1, R2 và Access application thật để triển khai. Quyền truy cập 9 đồng nghiệp ở website Sites hiện tại không tự chuyển sang website mới.

## Dữ liệu và bảo vệ truy cập

Gói nguồn không kèm ảnh bài làm thật, Excel học sinh, database thật, token hoặc danh sách email đồng nghiệp. Mẫu phiếu trống và dữ liệu giả trong test được giữ để kiểm thử.

Mọi truy cập production cần Access JWT hợp lệ. Worker kiểm tra chữ ký, issuer, audience, hạn dùng, rồi mới gắn danh tính cho API; không tin các header danh tính do trình duyệt tự gửi. Chế độ giả lập chỉ hoạt động trên loopback và chỉ khi chọn cấu hình local.

Không đưa tệp sao lưu bài làm, ảnh học sinh hay `.env` có token vào GitHub. Repository source và dữ liệu nhà trường là hai phần riêng biệt.

## Giới hạn kiểm chứng

Source và bản đóng gói được kiểm tra trong môi trường phát triển. Đăng nhập Google/Access, domain, phân quyền email, Drive OAuth và tài nguyên Cloudflare production cần chủ tài khoản cấu hình rồi thử bằng tài khoản thực. Không có tài khoản/tài nguyên mới nào được tạo hoặc xuất bản chỉ bởi việc tải ZIP này.

Nguồn: bản Sites commit `36d648eb86a6c257ddce105f6611055753cdb168`. Bản source Sites để tham khảo nằm ở thư mục `sites-original` bên cạnh trong gói tải về. Phần mã camera/OMR/chấm điểm được kiểm tra giữ nguyên byte; chỉ lớp hosting/đăng nhập và hướng dẫn sử dụng được điều chỉnh trong bản GitHub.

## Quyền sử dụng mã

Tác giả/chủ dự án quyết định giấy phép cho phần mã của dự án; gói này không tự cấp giấy phép mã nguồn mở. Giữ nguyên thông báo bản quyền thư viện bên thứ ba, đặc biệt `public/vendor/XLSX-LICENSE.txt`. Trước khi công khai repository, chọn giấy phép phù hợp với chủ sở hữu và kiểm tra các thành phần đi kèm.

### Kiểm tra đóng gói

`npm run build` chỉ chạy esbuild tại máy, không gọi Wrangler hoặc gửi source tới Cloudflare. Kiểm thử chức năng và đóng gói offline đã được thực hiện. Bước thử đóng gói bằng Wrangler trong môi trường tạo gói bị cơ chế phê duyệt tự động chặn vì có thể truyền thông tin source/build sang Cloudflare; việc triển khai production và đăng nhập Access thực tế chưa được xác minh trên tài khoản của trường. Chủ tài khoản thực hiện các lệnh triển khai sau khi đã cấu hình và chủ động chọn sử dụng Cloudflare.
