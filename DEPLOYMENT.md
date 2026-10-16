# Deploy Render + Vercel

## Deploy từ repo tổng có submodule

Xem `SUBMODULES.md` để clone và cập nhật FE/BE từ repo nguồn. Nếu import repo
`DeployWebNhaSach` vào nền tảng deploy, đặt Root Directory backend là
`DuongSach-BE` và frontend là `DuongSach-FE`. Blueprint Path là `render.yaml`
ở gốc repo tổng; Blueprint này đã có `rootDir: DuongSach-BE`.
Hệ thống build cần tải được cả hai submodule, đặc biệt khi repo nguồn private.
Hướng dẫn phía dưới áp dụng khi import từng repo nguồn riêng.

### Service Render đã tạo thủ công ở thư mục gốc

Nếu Root Directory để trống, các file `package.json` và `package-lock.json`
ở gốc cũng hỗ trợ Build Command `npm ci && npm run generate` và Start Command
`npm start`. Script `generate` cài dependencies production trong `DuongSach-BE`
rồi tạo Prisma Client; script `start` chạy backend trong đúng thư mục BE.
Không chạy thêm `cd DuongSach-BE` nếu Root Directory đã là `DuongSach-BE`.

Sau khi push cấu hình mới, chọn **Manual Deploy > Deploy latest commit**.
Thêm/sửa `render.yaml` không tự cấu hình lại service tạo thủ công.
Nếu log vẫn dùng commit cũ, kiểm tra branch `master` và commit đang deploy.

## 1. Backend and database on Render

1. Push the `DuongSach-BE` repository, including `render.yaml`, to GitHub.
2. In Render, choose **New > Blueprint** and select that repository. Render will create:
   - the `duongsach-backend` Node web service;
   - the `duongsach-postgres` PostgreSQL database in Singapore.
3. At the environment-variable prompt, set the three values to the final Vercel production URL:
   - `CORS_ORIGINS`
   - `PUBLIC_SITE_URL`
   - `PUBLIC_WEB_URL`
4. Deploy. The start command bootstraps the schema and seed data only when the
   database is empty. Confirm `https://<render-service>.onrender.com/api/health`.

`render.yaml` uses a free Render service and database for evaluation. Free
Postgres has a 1 GB limit and expires after 30 days; choose a paid plan before
production use.

## 2. Frontend on Vercel

1. Import the `DuongSach-FE` repository in Vercel.
2. Set the project root directory to `.` and deploy with the detected Vite preset.
3. Add these production variables from `.env.production.example`:
   - `VITE_API_BASE_URL=/api`
   - `VITE_PUBLIC_SITE_URL=https://<your-vercel-project>.vercel.app`
4. In `vercel.json`, replace `https://duongsach-backend.onrender.com` if your
   Render backend uses a different service URL, then redeploy.
5. Return to Render and set `CORS_ORIGINS`, `PUBLIC_SITE_URL`, and
   `PUBLIC_WEB_URL` to this Vercel URL; redeploy the backend.

The Vercel rewrite keeps browser requests on `/api` and forwards them to Render,
while the final rewrite preserves React Router deep links.

## Final checks

- `https://<render-service>.onrender.com/api/health` returns HTTP 200.
- `https://<vercel-project>.vercel.app` loads and its event list is populated.
- Login and a protected API request succeed.
