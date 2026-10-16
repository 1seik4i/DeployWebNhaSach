# Đường Sách TP.HCM Trực Tuyến

Frontend React của nền tảng Đường Sách TP.HCM, kết nối trực tiếp với REST API Node.js/PostgreSQL trong repository anh em `../DuongSach-BE`.

## Chức năng chính

- Khám phá gian hàng, sự kiện, di sản và bản đồ Đường Sách.
- Tìm kiếm, lọc nội dung và xem thông tin chi tiết.
- Đăng nhập bằng tài khoản trong PostgreSQL cho Đối tác và Quản trị; access token được gia hạn bằng refresh token.
- Quản trị viên quản lý gian hàng, địa điểm tổ chức và thiết bị.
- Gian hàng hỗ trợ tìm kiếm theo tên và lọc theo cơ sở.
- Bản đồ, gian hàng, sự kiện và di sản sử dụng dữ liệu từ PostgreSQL.
- Hỗ trợ giao diện tiếng Việt/Anh và hiển thị responsive trên desktop/mobile.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Framer Motion, GSAP |
| Backend | Node.js, Express 5, Prisma ORM |
| Cơ sở dữ liệu | PostgreSQL |
| Xác thực | JWT, bcrypt, phân quyền theo vai trò |
| Kiểm thử backend | Vitest, Supertest |

## Chạy dự án cục bộ

Yêu cầu: Node.js 20 trở lên, npm, Docker Desktop hoặc PostgreSQL 15 trở lên.

### 1. Cài đặt thư viện

```powershell
cd DuongSach-FE
npm install
cd ..\DuongSach-BE
npm install
```

### 2. Tạo tệp cấu hình

Sao chép tệp cấu hình riêng cho từng repository, sau đó cấu hình PostgreSQL và các khóa JWT ở backend.

```powershell
Copy-Item ..\DuongSach-FE\.env.example ..\DuongSach-FE\.env
Copy-Item .env.example .env
```

### 3. Khởi động PostgreSQL và chuẩn bị dữ liệu

```powershell
cd DuongSach-BE
docker compose up -d postgres
npm run db:push
npm run seed
```

Lưu ý: lệnh `npm run seed` nạp lại dữ liệu khởi tạo. Không chạy lệnh này trên cơ sở dữ liệu có dữ liệu cần giữ lại.

### 4. Chạy backend và frontend

Mở hai cửa sổ terminal:

```powershell
# Terminal 1 - Backend
cd DuongSach-BE
npm run dev
```

```powershell
# Terminal 2 - Frontend
cd DuongSach-FE
npm run dev
```

- Website: `http://localhost:5173`
- API mặc định: `http://localhost:4000/api`
- Kiểm tra trạng thái API: `http://localhost:4000/api/health`

## Các lệnh thường dùng

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy frontend ở chế độ phát triển |
| `npm run build` | Kiểm tra TypeScript và tạo bản frontend production |
| `npm run lint` | Kiểm tra mã nguồn frontend |
| `cd ../DuongSach-BE; npm test` | Chạy kiểm thử tích hợp backend |
| `cd ../DuongSach-BE; npm run seed` | Nạp dữ liệu khởi tạo vào database |

## Cấu trúc thư mục

```text
Duongsach-project-chinh/
├── DuongSach-FE/
│   ├── public/             # Hình ảnh và tài nguyên tĩnh
│   ├── src/                # Ứng dụng React và lớp gọi API
│   └── tests/e2e/          # Playwright, dùng tài khoản E2E thật qua biến môi trường
└── DuongSach-BE/
│   ├── prisma/             # Schema, migration và seed database
│   ├── src/                # REST API, middleware, module nghiệp vụ và cron job
│   ├── tests/              # Kiểm thử tích hợp backend
│   └── compose.yaml        # PostgreSQL dùng cho môi trường local
```

Playwright không tạo token giả. Để chạy luồng có xác thực, cấu hình `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_PARTNER_EMAIL`, `E2E_PARTNER_PASSWORD`, khởi động backend rồi chạy `npm run test:e2e` trong `DuongSach-FE`.
