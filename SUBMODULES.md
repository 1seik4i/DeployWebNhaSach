# Cập nhật mã nguồn FE / BE

Repo deploy tham chiếu hai repo nguồn qua `.gitmodules`, cùng nhánh `master`:

- `DuongSach-BE`: https://github.com/amazing-intern-fall-2026/DuongSach-BE
- `DuongSach-FE`: https://github.com/amazing-intern-fall-2026/DuongSach-FE

## Lưu cấu hình lần đầu

Tại thư mục gốc repo deploy:

```powershell
git add .gitmodules update-sources.ps1 SUBMODULES.md DEPLOYMENT.md
git commit -m "Configure frontend and backend submodules"
git push
```

## Clone sang máy mới

```powershell
git clone --recurse-submodules https://github.com/1seik4i/DeployWebNhaSach.git
cd DeployWebNhaSach
```

Nếu đã clone nhưng các thư mục con chưa có mã nguồn:

```powershell
git submodule update --init --recursive
```

## Lấy phiên bản mới để deploy

Commit hoặc stash các thay đổi local ở cả repo deploy và repo nguồn trước khi cập nhật.
Script kiểm tra trạng thái này trước khi pull:

```powershell
.\update-sources.ps1
git diff --submodule=log
git add DuongSach-BE DuongSach-FE
git commit -m "Update frontend and backend for deployment"
git push
```

`git pull` lấy commit của repo deploy. Script còn lấy bản mới nhất trên nhánh
`master` của từng repo nguồn. Repo deploy lưu commit cụ thể, vì vậy phải commit
và push hai tham chiếu mới để hệ thống deploy nhận phiên bản đó.

Các sửa đổi bên trong FE/BE phải được commit và push vào repo nguồn tương ứng;
commit repo deploy không đưa các file chưa commit ở repo con lên GitHub.
Không commit `.env`, mật khẩu hoặc token. Với repo nguồn private, tài khoản clone
và hệ thống deploy cần quyền đọc cả hai repo.
