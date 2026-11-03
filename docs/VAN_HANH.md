# Vận hành trong tổ chuyên môn

## Mô hình sử dụng

- GK1 khối 10/11: tạo kỳ thi chung, nhập danh sách toàn khối, đáp án và thang điểm; phân công lớp/phòng/SBD cho giáo viên.
- Kiểm tra trên lớp khối 12: mỗi giáo viên tạo kỳ thi riêng.
- Cuối kì I khối 12 dùng đề Sở: tạo kỳ thi chung mới, tránh trộn với kỳ thi riêng trước đó.

Cấp quyền vào hostname tại Cloudflare Access và phân công trong từng kỳ thi là hai bước khác nhau. Người mới vào web chưa tự thấy kỳ thi riêng của người khác.

## Vai trò

| Vai trò | Chức năng |
| --- | --- |
| Chủ kỳ thi | Toàn quyền kỳ thi do mình tạo |
| Người phụ trách | Cấu hình, phân công, duyệt và quản lý toàn kỳ thi |
| Giáo viên duyệt | Xem/sửa/chốt bài trong phạm vi được giao |
| Giáo viên chấm | Quét và lưu chờ duyệt; sửa bài mình đã quét trong phạm vi |
| Chỉ xem | Xem/xuất dữ liệu trong phạm vi, không sửa/chốt |

## Camera và quét liên tục

In đúng mẫu, chọn đúng loại phiếu. Dùng HTTPS trên điện thoại, cấp quyền camera, đặt đủ bốn góc. Quét liên tục 3/5 giây; lấy phiếu cũ ra khỏi khung trước khi đặt phiếu tiếp. Ô mờ/tô kép vẫn cần duyệt.

`npm run dev` dùng loopback trên máy tính. Camera từ điện thoại truy cập IP LAN qua HTTP có thể bị trình duyệt chặn; kiểm tra camera điện thoại trên hostname HTTPS đã triển khai.

## Khi có lỗi đồng bộ

Giữ tab/ảnh và dữ liệu thiết bị. Khôi phục kết nối rồi bấm Đồng bộ; không xóa browser storage. Lỗi xung đột revision cần tải dữ liệu mới để đối chiếu, không ghi đè bằng tay vào database.

Đổi đáp án làm các bài chốt trở về chờ duyệt. Người có quyền duyệt dùng Chấm lại, đối chiếu ảnh rồi chốt. Chọn trạng thái Đã chốt trước khi xuất bảng điểm chính thức.

## Android

Đây là web chạy trên trình duyệt Android. Có thể thêm lối tắt lên màn hình chính tùy trình duyệt. Gói này không chứa APK đã ký hoặc bản phát hành Google Play; muốn APK cần bước đóng gói, thiết lập đăng nhập/camera trong ứng dụng và kiểm thử thiết bị riêng.
