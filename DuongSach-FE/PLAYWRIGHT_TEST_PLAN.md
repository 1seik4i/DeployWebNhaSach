# Kế hoạch kiểm thử Frontend Đường Sách

## Mục tiêu chấp nhận

- Frontend chạy độc lập khi backend tắt và không phát sinh lỗi JavaScript nghiêm trọng.
- Bốn tài khoản demo đăng nhập được từ `/login`: Độc giả, Đối tác, Ban quản lý, Quản trị viên.
- Tất cả phân hệ chính của bốn vai trò mở được, có nội dung mock và không rơi vào màn hình lỗi/rỗng.
- Toàn bộ ảnh mock là tài sản local, tải thành công trên desktop và mobile.
- Chức năng tìm kiếm gian hàng và nút xóa tìm kiếm hoạt động đúng.
- Route bảo vệ chuyển người chưa đăng nhập về trang đăng nhập.

## Ma trận kịch bản

| Khu vực | Kịch bản |
| --- | --- |
| Công khai | Trang chủ, Di sản, Gian hàng, Sự kiện; dữ liệu mẫu; ảnh; tìm và xóa tìm kiếm |
| Xác thực | Đăng nhập nhanh đủ 4 role; kiểm tra redirect; route bảo vệ |
| Độc giả | Dashboard, sự kiện/hoạt động, chi tiết sự kiện, chi tiết hoạt động, mã QR, góp ý, hồ sơ |
| Đối tác | Dashboard, lịch sự kiện, gian hàng, chọn gian hàng, hoạt động, chi tiết hoạt động, báo cáo, thông báo, hồ sơ |
| Ban quản lý | Dashboard, sự kiện, gian hàng, địa điểm, thiết bị, hoạt động, người tham gia, báo cáo, góp ý, nội dung công khai, thông báo, hồ sơ |
| Quản trị viên | Tổng quan, gian hàng, địa điểm, thiết bị, người dùng, vai trò, cài đặt, thông báo, hồ sơ; tạo và xóa gian hàng mock |

## Phạm vi thiết bị

- Desktop Chromium: `1440 x 900`.
- Mobile Chromium: cấu hình Pixel 7.

## Lệnh chạy

```bash
npm run test:e2e
npm run test:e2e:desktop
npm run test:e2e:mobile
npm run test:e2e:report
```

Kết quả lỗi giữ lại screenshot, video và trace trong `test-results/`; báo cáo HTML nằm ở `playwright-report/`.
