# Checklist tính năng theo website

Cập nhật: **09/10/2026**. Phạm vi: mã nguồn FE/BE trong workspace hiện tại.

**Cách đọc:** `[x]` = đã có phần triển khai được mô tả; `[ ]` = còn thiếu, mới có một phần hoặc cần chốt. Nhãn **[API]** chỉ xác nhận phía BE, không có nghĩa màn hình đã hoàn chỉnh. Nhãn **[Tạm]** là quy tắc đang áp dụng nhưng chưa chốt nghiệp vụ. Mỗi dòng có mã để giao việc và nghiệm thu.

Đây là checklist triển khai, **không phải biên bản nghiệm thu toàn bộ giao diện**. Đợt kiểm tra trước có 163 kiểm thử BE đạt, FE build thành công; chưa kiểm thử trình duyệt tất cả màn hình. Migration mới đã thử trên DB riêng, chưa áp dụng DB chính; chưa push/deploy. Chức năng dùng bảng mới cần migration trước khi sử dụng trên môi trường chính.

## Bản đồ các giao diện

| Website/giao diện | Người sử dụng | Điểm truy cập | Nhóm chức năng |
|---|---|---|---|
| Website công khai | Khách tham quan | `/` và các trang tiếng Việt bên dưới | Giới thiệu, sự kiện, tin tức, gian hàng, thư viện, góp ý |
| Web Admin | Quản trị viên | `/admin` | Nội dung, sự kiện, gian hàng, sách, tài khoản, cấu hình, báo cáo |
| Web đối tác | Tài khoản gian hàng/đối tác | `/partner` | Sách của gian, tham gia sự kiện, đề xuất hoạt động, hồ sơ, báo cáo |
| Ban quản lý/organizer | Vai trò kỹ thuật còn trong hệ thống | `/organizer`, `/portal` chuyển tới `/admin` | Chưa có website riêng; không mặc định có đủ quyền Admin |
| Participant cũ | Luồng cũ/dự phòng | `/participant/*`, `/register` chuyển về `/` | Không tính là website đang vận hành độc lập |

Admin hiện chuyển màn hình bằng **tab trong `/admin`**; tên tab dưới đây không phải URL riêng.

## 1. Website công khai

### 1.1 Trang chủ — `/`

- [x] PUB-01 — Hiển thị trang giới thiệu và điều hướng đến các khu nội dung, gian hàng, sự kiện và thư viện số.
- [x] PUB-02 — Ô tìm kiếm điều hướng sang thư viện với từ khóa sách hoặc tìm gian hàng trên trang chủ.
- [x] PUB-03 — Hiển thị các khu nội dung hành trình, tổ chức và tin tức từ dịch vụ nội dung đã nối API.
- [x] PUB-04 — Gửi ghi nhận lượt truy cập lên BE theo session/ngày Việt Nam. **[Tạm]** Đây chưa phải số người dùng duy nhất.
- [ ] PUB-05 — Nối số liệu footer với API thật: `Footer.tsx` vẫn dùng số nền/localStorage và số online ngẫu nhiên; chưa hoàn tất phần hiển thị thống kê thật.
- [ ] PUB-06 — Chốt định nghĩa lượt truy cập, lượt trong tháng và người đang online trước nghiệm thu analytics.

### 1.2 Thư viện số — `/thu-vien-so`

- [x] PUB-07 — Xem danh sách và chi tiết sách công khai; tìm kiếm, lọc và phân trang ở giao diện.
- [x] PUB-08 — Hiển thị thể loại, nhãn và thông tin giới thiệu sách.
- [x] PUB-09 — Xem những gian có cùng đầu sách, tồn kho và số đã bán được khai báo; phân biệt chưa khai báo với 0.
- [x] PUB-10 — QR theo cặp sách–gian; link có `book` và `stall` để mở đúng nội dung liên quan.
- [x] PUB-11 — Hiển thị sách bán chạy/nổi bật theo dữ liệu xếp hạng BE. **[Tạm]** Quy tắc hiện tại được ghi trong báo cáo API.
- [x] PUB-12 — Chỉ hiển thị nội dung sách đã được công khai; sửa đang chờ duyệt không thay ngay bản công khai.
- [ ] PUB-13 — Chốt công thức, kỳ tính, số lượng sách trong bảng xếp hạng và quyền chỉnh hạng thủ công.

### 1.3 Gian hàng và bản đồ — `/gian-hang`, khu gian hàng/bản đồ trang chủ

- [x] PUB-14 — Xem, tìm gian hàng và điều hướng giữa thẻ gian hàng với bản đồ.
- [x] PUB-15 — Có dịch vụ đọc dữ liệu gian hàng, tọa độ và cấu hình ảnh bản đồ từ BE.
- [ ] PUB-16 — Nghiệm thu xuyên suốt việc Admin/đối tác sửa thông tin, ảnh gian hàng rồi khách thấy bản mới trên mọi vị trí công khai.

### 1.4 Sự kiện — `/su-kien`

- [x] PUB-17 — Xem danh sách/thông tin sự kiện từ API công khai.
- [x] PUB-18 — Phân biệt sắp diễn ra, đang diễn ra và đã kết thúc theo thời gian.
- [x] PUB-19 — BE lọc sự kiện nội bộ/ẩn và áp dụng thời hạn hiển thị sau khi kết thúc; hoạt động của sự kiện không công khai cũng bị ẩn.
- [ ] PUB-20 — Luồng đánh giá sự kiện mới: chờ chốt người được đánh giá, xác thực và kiểm duyệt.

### 1.5 Nội dung giới thiệu và tin tức

Trang: `/hanh-trinh`, `/bo-may-to-chuc`, `/tin-tuc`; `/tin-tuc-su-kien` cũng được nhận diện là trang tin.

- [x] PUB-21 — Xem nội dung hành trình/giới thiệu Đường sách.
- [x] PUB-22 — Xem cơ cấu tổ chức.
- [x] PUB-23 — Xem tin tức qua dịch vụ nội dung đã nối CMS.
- [x] PUB-24 — API nội dung công khai chỉ trả bản `published`, không trả bản nháp/ẩn.

### 1.6 Liên hệ, góp ý và đề xuất — `/lien-he`, form góp ý

- [x] PUB-25 — Gửi góp ý có mức đánh giá và nội dung tới BE.
- [x] PUB-26 — Gửi đề xuất sự kiện gồm họ tên, điện thoại và nội dung.
- [x] PUB-27 — Đề xuất được lưu để Admin xử lý; không tự tạo/công bố sự kiện.
- [x] PUB-28 — Không có API công khai đọc danh sách đề xuất chứa thông tin liên hệ.

## 2. Web Admin — `/admin`

### 2.1 Tổng quan — tab `dashboard`

- [x] ADM-01 — Lấy số liệu tổng quan từ database qua API dashboard.
- [x] ADM-02 — Có giao diện tổng quan và điều hướng đến các phần quản trị.
- [ ] ADM-03 — Nghiệm thu từng chỉ số/card trên màn hình với dữ liệu thực sau migration; không dùng việc build thành công để xác nhận số liệu đúng.

### 2.2 Lịch & Sự kiện — tab `events`

- [x] ADM-04 — Xem danh sách và chi tiết sự kiện; tạo sự kiện với ngày giờ/địa điểm được chuyển sang DTO BE.
- [x] ADM-05 — Công bố/ẩn sự kiện bằng thao tác lifecycle.
- [x] ADM-06 — Xem và duyệt/từ chối đăng ký tham gia của đối tác trong chi tiết sự kiện.
- [x] ADM-07 — **[API]** Hủy, nhân bản và gửi thông báo sự kiện.
- [x] ADM-08 — **[API]** Quản lý địa điểm gắn với sự kiện; hỗ trợ public/internal và thời hạn hiển thị.
- [ ] ADM-09 — Nghiệm thu đường đi UI cho hủy/nhân bản/thông báo và chỉnh thời hạn hiển thị; có endpoint chưa đủ để đánh dấu hoàn tất màn hình.

### 2.3 Hoạt động & Tọa đàm — tab `activities`

- [x] ADM-10 — Xem hoạt động và đề xuất của đối tác; tạo hoạt động từ form.
- [x] ADM-11 — Duyệt, từ chối hoặc yêu cầu bổ sung đề xuất.
- [x] ADM-12 — **[API]** Tạo hoạt động nháp từ đề xuất đã duyệt, sửa và công bố hoạt động.
- [x] ADM-13 — **[API]** Kiểm tra địa điểm, khoảng thời gian, sức chứa và trùng lịch.
- [ ] ADM-14 — Nối/kiểm tra thao tác UI “tạo hoạt động từ đề xuất đã duyệt”; hiện chưa thấy caller FE cho `create-activity`.
- [ ] ADM-15 — Nghiệm thu giao diện duyệt yêu cầu đổi/hủy hoạt động; API xử lý đã có.

### 2.4 Sơ đồ gian hàng — tab `booth-map`

- [x] ADM-16 — Đọc cấu hình bản đồ; lưu ảnh và tọa độ gian hàng lên BE.
- [x] ADM-17 — Thêm/sửa/xóa thông tin gian qua dịch vụ cơ sở vật chất trong chế độ API thật.
- [x] ADM-18 — **[API]** Duyệt/từ chối yêu cầu gian và chống phân bổ trùng khi xử lý đồng thời.
- [ ] ADM-19 — Hoàn thiện callback duyệt/từ chối trên bản đồ: `AdminPortal.tsx` còn gọi cập nhật gian bằng `status`, chưa gọi đúng API xét duyệt theo ID yêu cầu.
- [ ] ADM-20 — Nghiệm thu giao diện xử lý yêu cầu đổi/hủy gian; API xử lý đã có.

### 2.5 Danh mục gian, địa điểm và thiết bị — tab `booths`, `venues`, `assets`

- [x] ADM-21 — Danh mục gian hàng: xem, tạo, sửa, xóa theo ràng buộc dữ liệu.
- [x] ADM-22 — Admin đổi tên được gian đã phân bổ; đối tác không có quyền đổi tên.
- [x] ADM-23 — Không cho chuyển cơ sở/xóa gian đang được phân bổ theo ràng buộc hiện có.
- [x] ADM-24 — Quản lý danh mục địa điểm, cơ sở và sức chứa.
- [x] ADM-25 — Quản lý thiết bị và tổng số lượng; phạm vi kiểm kê.

### 2.6 Thư viện số — tab `library`

- [x] ADM-26 — Xem, thêm, sửa và lưu trữ sách trong catalogue chung.
- [x] ADM-27 — Quản lý thể loại và nhãn; gán vào sách bằng quyền Admin.
- [x] ADM-28 — Xem nội dung sách do đối tác gửi; duyệt hoặc từ chối có lý do.
- [x] ADM-29 — Bản công khai cũ được giữ khi chờ duyệt sửa; kiểm tra xung đột phiên bản và duyệt lặp.
- [x] ADM-30 — Xem dữ liệu sách theo gian; API tồn kho, số bán và nhật ký bán đã có.
- [ ] ADM-31 — Xếp hạng thủ công chưa triển khai chính thức; kéo thả chỉnh hạng đang tắt, chờ chốt nghiệp vụ.

### 2.7 Nội dung trang — tab `landing-journey`, `landing-org`, `landing-news`

- [x] ADM-32 — Sửa và lưu nội dung “Về Đường Sách”/hành trình lên CMS.
- [x] ADM-33 — Sửa và lưu nội dung bộ máy tổ chức lên CMS.
- [x] ADM-34 — Quản lý tin tức; lưu thay đổi lên server trước khi báo thành công.
- [x] ADM-35 — **[API]** Phân biệt nháp/công khai/ẩn và chống ghi đè nội dung bằng phiên bản.
- [ ] ADM-36 — Upload ảnh/tài liệu vào kho lưu trữ chuyên dụng; hiện chủ yếu dùng URL/data URL/JSON, chưa có media service hoàn chỉnh.

### 2.8 Báo cáo & Ý kiến đóng góp — tab `reports`, `feedback`

- [x] ADM-37 — Lấy báo cáo sự kiện/hoạt động từ database; có xuất CSV tại giao diện báo cáo.
- [x] ADM-38 — Xem và xử lý góp ý bằng luồng quản trị hiện có.
- [x] ADM-39 — Xem đề xuất sự kiện của khách; cập nhật trạng thái và ghi chú nội bộ.
- [x] ADM-40 — Duyệt đề xuất sự kiện không tự sinh sự kiện công khai.

### 2.9 Người dùng & Phân quyền — tab `users`, `roles`

- [x] ADM-41 — Xem, tìm, tạo và sửa tài khoản; khóa/mở khóa.
- [x] ADM-42 — Tạo token thiết lập/reset mật khẩu cho người dùng; không trả password hash.
- [x] ADM-43 — Gán, đổi hoặc thu hồi gian cố định cho tài khoản đối tác qua nút “Gian”.
- [x] ADM-44 — Xem/cập nhật cấu hình quyền; BE kiểm tra quyền thực tế từ DB cho các luồng được bảo vệ.
- [x] ADM-45 — Chặn thao tác làm mất Admin đang hoạt động cuối cùng; thu hồi phiên khi thay đổi trạng thái/vai trò phù hợp.
- [ ] ADM-46 — Kiểm thử đầy đủ ma trận quyền từng tab với tài khoản organizer; dùng chung portal không đồng nghĩa có quyền Admin.

### 2.10 Cấu hình, thông báo và hồ sơ — tab `settings`, `notifications`, `profile`

- [x] ADM-47 — Lưu cấu hình chung và chính sách mật khẩu/đăng nhập/thời hạn access token.
- [x] ADM-48 — Xem thông báo của tài khoản; đánh dấu từng thông báo hoặc tất cả đã đọc.
- [x] ADM-49 — Xem/sửa hồ sơ quản trị, đổi mật khẩu và đăng xuất.
- [x] ADM-50 — **[API]** Lấy nhật ký audit để truy vết thao tác.
- [ ] ADM-51 — Màn hình audit riêng: chưa có tab tương ứng trong AdminPortal hiện tại.
- [ ] ADM-52 — MFA và email tự động (chào mừng/cảnh báo/tổng hợp): chưa có hạ tầng; các tùy chọn chưa hỗ trợ không được bật giả.

## 3. Web đối tác — `/partner`

### 3.1 Tổng quan — `/partner`

- [x] PAR-01 — Có trang tổng quan tổ chức, sự kiện, hoạt động và thông báo từ các dịch vụ đối tác.
- [ ] PAR-02 — Nghiệm thu tổng quan với tài khoản mới chưa có sự kiện/gian và với nhiều sự kiện; không suy ra từ các test API riêng lẻ.

### 3.2 Sự kiện tham gia — `/partner/events`, `/partner/events/apply`

- [x] PAR-03 — Xem đăng ký tham gia sự kiện của tổ chức.
- [x] PAR-04 — Gửi đăng ký tham gia tới Admin và theo dõi kết quả xét duyệt.
- [x] PAR-05 — BE xác định tổ chức từ tài khoản; kiểm tra trạng thái/hạn đăng ký.

### 3.3 Gian hàng — `/partner/booths`, `/partner/booths/select`

- [x] PAR-06 — Xem gian trong sự kiện, gửi yêu cầu chọn gian và xem gian được phân bổ.
- [x] PAR-07 — Sửa mô tả, danh mục hiển thị, ảnh/tài liệu của gian thuộc quyền quản lý.
- [x] PAR-08 — Tên gian và thông tin dành cho Admin bị khóa ở UI/BE; không tự chuyển gian cố định được phân công.
- [x] PAR-09 — Gửi yêu cầu đổi/hủy gian để quản trị xử lý.
- [ ] PAR-10 — Nghiệm thu toàn bộ luồng đổi gian tới gian đích; API có `targetBoothId` nhưng service gửi yêu cầu hiện mới truyền loại và lý do.

### 3.4 Sách của gian — `/partner/books`

`/partner/book-sales` chuyển về trang này.

- [x] PAR-11 — Lấy gian do Admin phân công; không mặc định dùng gian mẫu A02.
- [x] PAR-12 — Xem/tìm sách thuộc gian; hiển thị trạng thái nội dung và lý do từ chối.
- [x] PAR-13 — Thêm đầu sách có sẵn trong catalogue vào gian.
- [x] PAR-14 — Gửi đầu sách mới hoặc đề xuất sửa nội dung để Admin duyệt.
- [x] PAR-15 — Cập nhật tồn kho và số lượng đã bán; số bán không bắt buộc.
- [x] PAR-16 — Bỏ sách khỏi gian của mình, không xóa sách ở các gian khác.
- [x] PAR-17 — Không tự gán thể loại/nhãn, công khai hoặc duyệt sách; BE chặn truy cập gian khác.
- [x] PAR-18 — **[API]** Gửi và đọc nhật ký bán theo ngày.
- [ ] PAR-19 — Nghiệm thu/hoàn thiện màn hình nhập nhật ký bán theo ngày riêng; không nhầm với ô số bán lũy kế ở trang sách.

### 3.5 Hoạt động — `/partner/activities`, `/partner/activities/:activityId`

- [x] PAR-20 — Xem danh sách/chi tiết đề xuất, tạo đề xuất hoạt động và theo dõi kết quả.
- [x] PAR-21 — Gửi lịch, địa điểm và nhu cầu thiết bị; BE giới hạn theo tổ chức và điều kiện tham gia.
- [x] PAR-22 — Gửi yêu cầu thay đổi hoặc hủy hoạt động.
- [x] PAR-23 — Có API danh sách người đăng ký trong phạm vi đề xuất/hoạt động của đối tác.
- [x] PAR-24 — Điểm danh bằng mã qua API; BE kiểm tra vé, thời gian, phạm vi và chống điểm danh lặp.
- [ ] PAR-25 — Nghiệm thu quét QR bằng camera/thiết bị thật; không đánh dấu hoàn tất dựa trên luồng nhập mã thủ công.

### 3.6 Báo cáo — `/partner/reports`

- [x] PAR-26 — API tổng hợp báo cáo giới hạn trong tổ chức; giao diện báo cáo lấy dữ liệu từ dịch vụ đối tác.
- [ ] PAR-27 — Kiểm chứng nội dung file xuất báo cáo đối tác với dữ liệu thực trước nghiệm thu.

### 3.7 Thông báo và hồ sơ — `/partner/notifications`, `/partner/profile`

`/partner/organization` chuyển về hồ sơ.

- [x] PAR-28 — Xem thông báo, số chưa đọc; đánh dấu từng mục/tất cả đã đọc.
- [x] PAR-29 — Xem/sửa thông tin tổ chức và liên hệ trong các trường được phép.
- [x] PAR-30 — Đổi mật khẩu và đăng xuất; không cho sửa quyền qua payload hồ sơ.

## 4. Đăng nhập và chức năng dùng chung

- [x] COM-01 — Có trang đăng nhập chung `/login`, màn hình đăng nhập Admin khi vào `/admin`, đối tác khi vào `/partner` chưa có phiên.
- [x] COM-02 — Access token/refresh token; FE làm mới phiên, BE xoay refresh token và chặn tái sử dụng đồng thời.
- [x] COM-03 — Đổi mật khẩu/reset thành công làm vô hiệu phiên cũ theo cơ chế hiện có.
- [x] COM-04 — **[API]** Reset token có hạn, lưu hash và dùng một lần; component đặt lại mật khẩu đã có.
- [ ] COM-05 — Sửa vị trí route `/reset-password`: hiện được khai báo trong nhánh chỉ render khi URL bắt đầu bằng `/partner`, nên link reset công khai chưa đi tới component đúng.
- [ ] COM-06 — Quên mật khẩu tự gửi email: chưa cấu hình nhà cung cấp, endpoint hiện trả 503; dùng luồng Admin cấp token trong lúc chờ.
- [x] COM-07 — Chế độ API thật không âm thầm chuyển sang mock trong các service đã chỉnh; mock chỉ bật bằng cấu hình riêng.
- [ ] COM-08 — Rà hết dữ liệu minh họa còn ở component, đặc biệt footer; COM-07 không đồng nghĩa toàn bộ website đã hết số liệu mẫu.
- [ ] COM-09 — Áp dụng migration lên môi trường chính và nghiệm thu UI xuyên suốt các vai trò.
- [ ] COM-10 — Hoàn thiện phân trang danh sách lớn, bộ đếm giới hạn dùng chung khi chạy nhiều instance và lưu trữ media phục vụ triển khai.

## 5. Các việc cần ưu tiên để đóng checklist

| Ưu tiên | Mã checklist | Việc cần đóng | Trang chịu ảnh hưởng |
|---|---|---|---|
| Cao | COM-05 | Đưa reset-password thành route công khai truy cập được | Đặt lại mật khẩu |
| Cao | ADM-19 | Duyệt gian theo requestId và đúng endpoint approve/reject | Admin → Sơ đồ gian hàng |
| Cao | PUB-05, COM-08 | Thay số nền/online ngẫu nhiên bằng số liệu thật hoặc trạng thái chưa có dữ liệu | Footer công khai |
| Cao | ADM-14 | Hoàn thiện luồng từ đề xuất đã duyệt đến hoạt động nháp/công khai | Admin → Hoạt động |
| Cao | COM-09 | Migration và nghiệm thu toàn bộ luồng trên môi trường đích | Cả 3 website |
| Tiếp theo | ADM-15, ADM-20, PAR-10 | Nối và nghiệm thu duyệt đổi/hủy hoạt động, gian hàng | Admin và đối tác |
| Chờ cấu hình | COM-06, ADM-52 | Email và các tùy chọn bảo mật chưa có hạ tầng | Đăng nhập/cài đặt |
| Chờ quyết định | PUB-06, PUB-13, PUB-20, ADM-31 | Analytics, xếp hạng, đánh giá sự kiện | Công khai/Admin |

## Nguồn kiểm tra và cập nhật

- FE: `DuongSach-FE/src/App.tsx` (đường dẫn), `components/AdminPortal.tsx`, `components/admin/AdminSidebar.tsx`, `pages/partner/PartnerLayout.tsx` (menu/tab).
- Đối chiếu thêm các service FE, Footer, màn hình thư viện/điểm danh/báo cáo và router BE; các điểm thiếu nêu trên được ghi nhận từ mã nguồn, chưa phải lỗi tái hiện bằng trình duyệt.
- [Báo cáo triển khai API và giới hạn](../API-COMPLETION.md).
- [Danh mục API hiện có trong đợt bổ sung](../API-COMPLETION.csv).
- [Checklist dạng CSV để lọc theo website/trang/trạng thái](CHECKLIST-TINH-NANG-THEO-WEB.csv).

Khi nghiệm thu: cập nhật checkbox, ghi môi trường/ngày/người kiểm tra và bằng chứng cho từng mã. Không đổi dòng **[API]** thành “đã hoàn tất trang” trước khi kiểm tra thao tác FE tương ứng.
