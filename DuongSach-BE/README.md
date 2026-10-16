# Backend Đường Sách TP.HCM

REST API cho nền tảng Đường Sách TP.HCM, xây dựng bằng Node.js, Express, Prisma ORM và PostgreSQL.

## Yêu cầu

- Node.js 20 trở lên
- npm
- Docker Desktop hoặc PostgreSQL 15 trở lên

## Cài đặt

```bash
npm install
cp .env.example .env
```

File `.env.example` chứa cấu hình local đồng bộ với `compose.yaml`. Hãy thay các khóa JWT bằng giá trị bí mật an toàn trước khi triển khai production.

## Khởi động PostgreSQL

Chỉ chạy PostgreSQL:

```bash
docker compose up -d postgres
```

Chạy PostgreSQL và Adminer; Adminer có tại `http://localhost:8080`:

```bash
docker compose up -d
```

Với volume mới, Docker tự nạp schema và dữ liệu trong
`database/snapshot/current.sql`. Đợi PostgreSQL healthy rồi tạo Prisma Client:

```bash
npm run generate
```

Snapshot giữ dữ liệu nghiệp vụ và tài khoản từ database nguồn. Mật khẩu của mọi
tài khoản trong snapshot là `123456`; refresh token và password reset được bỏ.
Email, vai trò và trạng thái tài khoản được giữ nguyên; tài khoản khóa vẫn bị khóa.
Ví dụ tài khoản admin: `admin@duongsach.example.vn`.

Volume có dữ liệu được giữ nguyên, không tự nạp lại snapshot. Không cần chạy
`db:push` hoặc `npm run seed` khi khởi tạo bằng Docker snapshot.

### Cập nhật snapshot từ database hiện tại

Chạy trong thư mục backend khi service PostgreSQL nguồn đang hoạt động:

```bash
npm run seed:export
```

Commit `database/snapshot/current.sql`, `database/docker-init/`, script xuất và
cấu hình Docker vào repo để người clone có cùng bộ dữ liệu. Script dùng database
của service `postgres` trong Compose, không thay đổi dữ liệu nguồn. Password hash
nguồn không được xuất; hash mật khẩu test được thay vào dữ liệu users trước khi
ghi file. Snapshot bao gồm schema, enums, indexes, constraints và triggers.
Nên xuất khi không có thao tác cập nhật database vì users được đọc riêng.

Seed mẫu cũ trong `database/seed` vẫn được giữ; `npm run seed` không phải cách
khôi phục snapshot hiện tại. File upload trong `uploads/` không nằm trong snapshot
PostgreSQL; cần chia sẻ riêng nếu dữ liệu tham chiếu đến file local.

Nếu muốn thay database local cũ bằng snapshot, hãy sao lưu trước:

```bash
# Xóa toàn bộ dữ liệu volume của project hiện tại
docker compose down -v
docker compose up -d
```

## Chạy ứng dụng

```bash
# Development
npm run dev

# Production
npm start
```

- API mặc định: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Swagger UI: `http://localhost:4000/api/docs`

## Kiểm thử

```bash
npm test
```

Bộ integration test cần một PostgreSQL đã được cấu hình và có dữ liệu phù hợp với `.env`.

## Triển khai Render

Vì đây là repository backend độc lập, để **Root Directory** trống hoặc đặt là `.`.

```text
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
```

Thiết lập toàn bộ biến trong `.env.example` trên Render. Không commit file `.env` thật.

## Cấu trúc

```text
.
├── compose.yaml       # PostgreSQL và Adminer cho local development
├── database/         # Các file SQL seed
├── prisma/           # Prisma schema, migration và seed entrypoint
├── scripts/          # Script khởi động và bootstrap deployment
├── src/              # REST API, middleware và module nghiệp vụ
├── tests/            # Integration tests
├── .env.example      # Biến môi trường mẫu
└── package.json
```
