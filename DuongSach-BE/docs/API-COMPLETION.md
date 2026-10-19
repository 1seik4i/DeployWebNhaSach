# Đối chiếu FE – BE và hoàn thiện API (09/10/2026)

Nguồn đối chiếu: FE hiện có trong `DuongSach-FE`, tài liệu bàn giao ngày 07/10 và biên bản họp yêu cầu website Đường sách TP.HCM ngày 02/10/2026. Yêu cầu trong biên bản và luồng FE hiện tại được ưu tiên khi khác với backlog cũ.

## Kết quả và phạm vi

Đã bổ sung 121 cặp method/path trong các router mới, gồm 120 handler nghiệp vụ và một endpoint quên mật khẩu chủ động trả 503 khi chưa có dịch vụ gửi email. Con số này gồm alias và các vai trò; không phải 121 tính năng độc lập. API có sẵn cũng được sửa về DTO, phân quyền, trạng thái công khai và xử lý tranh chấp. Danh mục chính xác nằm trong [API-COMPLETION.csv](API-COMPLETION.csv) và [API-COMPLETION.json](API-COMPLETION.json), sinh trực tiếp từ router bởi `node scripts/exportApiCompletion.js`.

| Nhóm | Khoảng thiếu trước khi sửa | Đã triển khai và nối FE | Căn cứ/quy tắc |
|---|---|---|---|
| Thư viện số | Sách, danh mục, nhãn, tồn kho và duyệt nội dung chủ yếu ở localStorage | Catalogue PostgreSQL; sách ở nhiều gian; CRUD Admin; tạo/sửa qua submission, duyệt/từ chối, lưu phiên bản | Chỉ giới thiệu sách; không lưu toàn văn. Nội dung đối tác sửa phải được duyệt; bản công khai cũ giữ nguyên khi chờ |
| Phân công gian | Đối tác tự chọn gian hoặc dùng mã mẫu | Admin phân công/thu hồi gian cho tài khoản; BE xác định gian từ người đăng nhập | Đối tác không tự chuyển gian; Admin quản lý tên gian, thể loại và nhãn |
| Tồn kho, bán hàng, QR | Chưa có lưu trữ phía server theo sách–gian | Tồn kho không âm; số đã bán có thể null; nhật ký bán; QR dẫn đến đúng sách và gian | Một QR cho cặp sách–gian, không cho từng bản in |
| Tài khoản và quyền | Endpoint thiếu, DTO FE lệch, cài đặt bảo mật chưa tác động | Tạo/sửa/khóa, chặn mất Admin cuối cùng, reset token một lần, đổi mật khẩu, quyền kiểm tra lại từ DB, refresh rotation | Không trả password hash; đổi mật khẩu/khóa/đổi vai trò thu hồi phiên phù hợp |
| Sự kiện và hoạt động | FE gọi lifecycle và địa điểm chưa có handler tương ứng | Công bố/ẩn/hủy/nhân bản/thông báo; địa điểm sự kiện; tạo/sửa/công bố hoạt động; kiểm tra lịch và sức chứa | Public/internal tách khỏi thời gian diễn ra; đề xuất được duyệt chưa tự công khai |
| Đối tác và phân bổ | Đăng ký, duyệt, yêu cầu gian/hoạt động còn giả lập | Đăng ký sự kiện, xét duyệt, yêu cầu gian, phân bổ chống trùng, lịch đối tác, đề xuất hoạt động, yêu cầu đổi/hủy | Ràng buộc tổ chức sở hữu, hạn đăng ký, địa điểm và trạng thái; đổi nội dung gian không cho đổi tên |
| Nội dung trang | Hành trình, tổ chức, tin tức chỉ lưu trên trình duyệt | CMS theo slug/kind, draft/published/hidden, chống ghi đè bằng expectedVersion; FE lưu server | Nội dung công khai chỉ lấy bản published |
| Góp ý và đề xuất | Form gửi giả lập, đề xuất dễ bị nhầm với tạo sự kiện | Lưu feedback; form tên/điện thoại/nội dung; Admin theo dõi trạng thái và ghi chú | Xử lý đề xuất thủ công, không tự sinh sự kiện; thông tin liên hệ không có API đọc công khai |
| Dashboard, báo cáo, thông báo | Số liệu mẫu và thông báo cục bộ | Tổng hợp dữ liệu DB, báo cáo theo tổ chức/sự kiện, thông báo theo chủ sở hữu, đánh dấu đã đọc, audit | Không thay kết quả rỗng/0 thành số liệu mẫu |
| Bản đồ và gian | Tọa độ/ảnh/nội dung chỉ lưu cục bộ | Cấu hình bản đồ công khai, Admin lưu ảnh/tọa độ 0–100; nội dung gian lưu DB | Admin đổi tên được cả gian đã phân bổ; không tự di chuyển gian đang phân bổ sang cơ sở khác |
| Thiết bị | Danh mục thiếu trong luồng đối tác | API danh mục và số lượng thiết bị hiện có | Phạm vi kiểm kê; không suy diễn thành hệ thống cho thuê thiết bị |

## Hợp đồng chung

- Base URL: `/api`. JSON thành công: `{ "success": true, "data": ..., "warnings": [] }`. API phân trang cũ có `meta`/`pagination`.
- Endpoint `/admin/*`, `/partner/*`, `/organizer/*` yêu cầu `Authorization: Bearer <accessToken>` và kiểm tra vai trò/quyền. UUID của tổ chức/gian do server xác định; truyền ID của đối tác khác không cấp quyền.
- Lỗi: `{ "success": false, "error": { "code": "...", "message": "...", "details": [] } }`. 401: phiên không hợp lệ; 403: thiếu quyền; 404: không có/không thuộc phạm vi; 409: trùng, sai trạng thái hoặc xung đột phiên bản; 422: dữ liệu sai; 429: giới hạn yêu cầu.
- Ngày giờ hoạt động/sự kiện dùng ISO 8601 có múi giờ; ngày bán dùng `YYYY-MM-DD`. Tồn kho/số bán phải là số nguyên không âm; `soldQuantity: null` là chưa khai báo, khác 0.
- Swagger có toàn bộ method/path mới; schema JSON chung chưa thay thế validation chi tiết trong router. Các ví dụ dưới đây là những hợp đồng FE sử dụng chính.

### Thư viện và gian được phân công

1. Admin tạo thể loại/nhãn: `POST /admin/book-categories` với `{ "name": "Văn học", "nameEn": "Literature" }`; nhãn chỉ cần `name`. PATCH cập nhật và DELETE lưu trữ, không xóa dây chuyền sách.
2. Admin gán gian: `PUT /admin/users/{userId}/stall-assignment` với `{ "stallId": "<booth UUID>", "expectedVersion": 0 }`. Lấy phiên bản bằng GET cùng URL; `stallId: null` thu hồi. Partner lấy `/partner/assigned-stall`; không có gian thì không được ghi catalogue.
3. Sách mới: `POST /partner/book-submissions` với `{ "proposedData": { "isbn": "9780000000001", "title": "Tên sách", "author": "Tác giả", "coverUrl": "https://example.com/cover.jpg" }, "inventoryQuantity": 10, "soldQuantity": null }`. Sửa sách thêm `bookId` và các trường thay đổi trong `proposedData`. Partner không gửi `categoryId`, `labelIds`, `status`.
4. Admin GET `/admin/book-submissions`; POST `/{id}/approve` hoặc `/{id}/reject` với `{ "rejectionReason": "Cần bổ sung thông tin" }`. Chỉ xử lý submission pending; hai lần duyệt đồng thời chỉ một lần thành công. Phiên bản sách thay đổi trong lúc chờ sẽ báo xung đột.
5. Sách đã có: `POST /partner/books` với `{ "bookId": "<UUID>", "inventoryQuantity": 5 }`. Cập nhật `PATCH /partner/books/{bookId}/quantities` với `{ "inventoryQuantity": 3, "soldQuantity": null, "expectedVersion": 1 }`. DELETE chỉ bỏ sách khỏi gian của người gọi.
6. Nhật ký bán: `POST /partner/book-sales` nhận **mảng**, ví dụ `[{ "bookId": "<UUID>", "quantity": 2, "soldDate": "2026-10-09" }]`. Đây là báo cáo bán theo ngày, không tự trừ tồn hoặc cộng vào số bán lũy kế đã khai báo.
7. Công khai: `/public/books`, `/public/books/{id}`, `/public/books/{id}/stalls`, `/public/book-stalls`, `/public/book-stalls/{id}`, `/public/book-categories`, `/public/book-labels`, `/public/book-rankings`. QR dùng `PUBLIC_WEB_URL/thu-vien-so?book=<id>&stall=<id>`.

### Tài khoản và phiên đăng nhập

`POST /admin/users`: `fullName`, `email`, `role` (`admin|partner|organizer`), tùy chọn `phone`, `status`, `password`. Nếu không cung cấp mật khẩu, trả thông tin thiết lập mật khẩu để Admin chuyển cho người dùng. Partner mới có tổ chức tương ứng.

`POST /admin/users/{id}/reset-password` trả liên kết/token thiết lập lại có hạn dùng. `POST /auth/reset-password`: `{ "token": "...", "newPassword": "..." }`. Token lưu dạng hash, chỉ dùng một lần. Đổi mật khẩu: `{ "currentPassword": "...", "newPassword": "..." }` tại endpoint vai trò tương ứng trong danh mục. Phiên cũ bị vô hiệu sau đổi mật khẩu.

FE lưu refresh token và gọi `POST /auth/refresh` với `{ "refreshToken": "..." }` khi access token hết hạn. Refresh token được xoay vòng; hai yêu cầu dùng cùng token không thể cùng thành công. `POST /auth/logout` thu hồi refresh token.

### Sự kiện và đối tác

- Partner POST `/partner/event-applications` với `{ "eventId": "<UUID>" }`. Admin xét qua `/admin/partner-applications/{id}/approve|reject`.
  Không áp dụng ngày mở đăng ký hay `partnerApplyDeadline`. Sự kiện công khai đang diễn ra hoặc sắp diễn ra theo lịch Việt Nam luôn nhận hồ sơ tham gia; sự kiện đã kết thúc, hủy, nháp hoặc xóa không nhận. Đăng ký tham gia vẫn cần Admin xét duyệt.
- Partner POST `/partner/booth-requests` với `{ "eventId": "<UUID>", "boothId": "<UUID>" }`; Admin `/admin/booth-requests/{id}/approve|reject`.
- `GET /admin/event-locations?eventId=<UUID>` (Partner có endpoint cùng tên). `PUT /admin/events/{id}/locations`: `{ "locationIds": ["<UUID>"] }`.
- Hoạt động mới: `eventId`, `title`, `kind`, `locationId`, `startAt`, `endAt`, `capacity`; tùy chọn `description`, `speaker`, `imageUrl`. `kind`: `talkshow|workshop|launch|exhibition|minigame|signing`. POST `/admin/activities`, PATCH `/{id}`, POST `/{id}/publish`.
- Đề xuất Partner: `/partner/activity-proposals`, cùng trường lịch ở trên; hỗ trợ thông tin liên hệ, đối tượng và `devices`. Duyệt bằng `/admin/activity-proposals/{id}/approve`, tạo bản nháp bằng `/{id}/create-activity`, sau đó công bố hoạt động riêng.
- Yêu cầu đổi/hủy: POST `/partner/booths/{id}/requests` hoặc `/partner/activity-proposals/{id}/requests` với `kind: change|cancellation`, `reason`; đổi gian có `targetBoothId`. Admin xử lý `/admin/{booth-change-requests|booth-cancellation-requests|activity-change-requests|activity-cancellation-requests}/{id}/status` với `status: approved|rejected`, `note`; đổi hoạt động có thể kèm `replacement` chứa `locationId`, `startAt`, `endAt`.
- Điểm danh `/partner/attendance/scan`: `{ "qrToken": "<UUID>" }`; giới hạn tổ chức, thời gian, trạng thái vé/hoạt động/sự kiện; quét lại trả `already_scanned`.

### CMS, đề xuất, bản đồ và cấu hình

- `POST /admin/content`: `{ "slug": "landing-journey", "kind": "journey", "title": "Hành trình", "data": {}, "status": "published" }`. Kind: `journey|organization|news|footer`. PATCH `/{id}` nhận trường thay đổi và `expectedVersion`; GET public chỉ thấy published. Cấu trúc `data` do editor FE quản lý.
- `POST /public/event-suggestions`: `{ "fullName": "Người đề xuất", "phone": "0901234567", "content": "Nội dung đề xuất sự kiện" }`. Admin GET/PATCH `/admin/event-suggestions/{id}` với `status: new|contacted|approved|rejected|closed`, `internalNote`.
- `GET /public/map-config`, `PUT /admin/map-config`: ảnh và danh sách điểm theo schema router; từng gian cũng có PATCH `/admin/booths/{id}/map-position` với `{ "x": 50, "y": 25 }`.
- `PUT /admin/settings` nhận các khóa `admin.system` và `events.retentionDays` (0–3650). `admin.system` gồm `general`, `security`, `notifications`. Cấu hình bảo mật tác động vào độ dài mật khẩu, ký tự đặc biệt, số lần đăng nhập sai và hạn access token. Các nút MFA/email chưa có hạ tầng không cho bật giả.
- Sự kiện công khai được giữ sau ngày kết thúc theo `events.retentionDays` (mặc định 30); `publicUntil` riêng của sự kiện ưu tiên nếu có. Trạng thái thời gian được tính từ ngày bắt đầu/kết thúc, độc lập với `visibility`.

## Các điểm chưa thể chốt từ biên bản

1. **Email quên mật khẩu chưa vận hành**: `/auth/forgot-password` trả 503 và hướng dẫn liên hệ Admin. Reset qua Admin và trang đặt mật khẩu đã hoạt động. Chưa tích hợp nhà cung cấp email, email chào mừng/tổng hợp hay MFA.
2. **Xếp hạng là quy tắc tạm**: bestseller dùng tổng số bán lũy kế khai báo; tuần dùng nhật ký bán 7 ngày gần nhất, tối đa 100. Chưa chốt công thức, kỳ thống kê, số phần tử hoặc quyền chỉnh thủ công. FE đã tắt kéo thả chỉnh hạng; không coi quy tắc tạm là quyết định của cuộc họp.
3. **Đánh giá sự kiện**: cần chốt ai được đánh giá, xác thực và kiểm duyệt. Không bổ sung luồng đánh giá sự kiện mới khi chưa có quy tắc; rating hoạt động có sẵn vẫn được dùng trong báo cáo.
4. **Lượt truy cập là số đo tạm**: một session/ngày theo giờ Việt Nam. Không đồng nghĩa số người duy nhất; chưa có định nghĩa analytics chính thức.
5. **Vận hành**: giới hạn đăng nhập/submit đang nằm trong bộ nhớ tiến trình; triển khai nhiều instance cần bộ đếm chung. Ảnh/tài liệu đang lưu URL/JSON theo giới hạn request, chưa có kho object storage/upload riêng. Một số danh sách quản trị lấy tối đa 200 dòng, cần phân trang nếu dữ liệu lớn.
6. **Dữ liệu demo cũ**: dữ liệu catalogue/CMS trong localStorage không tự nhập vào DB. FE dùng API thật mặc định; chỉ bật `VITE_USE_MOCK_API=true` cho demo riêng.

## Áp dụng database

Migration `prisma/migrations/20261009000000_complete_fe_api/migration.sql` bổ sung bảng/cột, FK, CHECK và quyền thư viện; không xóa dữ liệu cũ. Đã thử trên DB kiểm thử riêng có seed hiện tại: sau migration vẫn giữ 14 người dùng, 35 gian và 9 sự kiện, thêm 6 quyền thư viện. Chưa tự áp dụng lên DB phát triển chính hoặc server triển khai.

**DB có lịch sử Prisma migrations đồng bộ:** sao lưu rồi chạy `npm run migrate:deploy` và `npm run generate`. Không dùng migrate reset.

**DB dự án trước đây được tạo bằng db push/SQL:** kiểm tra trạng thái schema và sao lưu trước. Khi chưa có các bảng/cột mới, áp dụng đúng một lần bằng:

```powershell
npx.cmd prisma db execute --file prisma/migrations/20261009000000_complete_fe_api/migration.sql --schema prisma/schema.prisma
npm.cmd run generate
```

Không chạy lại toàn bộ SQL migration khi đã áp dụng, không tự đánh dấu baseline cho lịch sử chưa được kiểm tra. Nếu đã dùng `db push` để tạo các bảng/cột, chỉ chạy `npm.cmd run db:api-constraints` để bổ sung CHECK và quyền; script này chạy lặp an toàn. Render bootstrap đã gọi script sau bước khởi tạo schema/seed.

Với **DB mới, trống**, dùng quy trình tạo/seed sẵn có của dự án, sau đó `npm.cmd run db:api-constraints`. Tránh chạy migration bổ sung trên DB chưa có bảng nền.

FE: `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=/api` khi dùng Vite proxy cổng 4000. BE đặt `PUBLIC_WEB_URL` đúng URL FE để QR/reset link trỏ đúng môi trường. Không đưa thông tin kết nối/token vào git.

## Kiểm chứng

- Integration suite chạy với PostgreSQL riêng; không sử dụng DB người dùng. Bao phủ duyệt đồng thời, chống phân bổ gian trùng, phân quyền và quyền sở hữu, dữ liệu pending không lộ, version conflict, số lượng không hợp lệ, reset một lần, thu hồi phiên cũ, refresh token đồng thời, sự kiện nội bộ và hoạt động, CMS, đề xuất, tọa độ bản đồ.
- FE kiểm tra TypeScript và production build bằng `npm run build`. Còn cảnh báo bundle lớn; chưa thực hiện kiểm thử trình duyệt toàn bộ màn hình.
- Migration được kiểm chứng từ schema cũ có dữ liệu seed; script CHECK/quyền chạy lại không lỗi. Đây không phải xác nhận triển khai lên production.

Thay đổi hiện nằm ở working tree FE/BE; chưa commit, push hoặc deploy.
