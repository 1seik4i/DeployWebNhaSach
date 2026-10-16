-- 1. Phân công gian hàng thư viện số cho Partner
INSERT INTO user_stall_assignments (user_id, stall_id) VALUES
  ('bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', 'c5966a62-03fe-4093-ae26-4faa7a102a8b'),
  ('a1997704-8ccd-4838-ab09-31be558bf632', 'cff5ef63-f6a2-48a9-ae8e-e805566ea654')
ON CONFLICT (user_id) DO UPDATE SET stall_id = EXCLUDED.stall_id;

-- 2. Thông báo hệ thống cho Admin & Partner
INSERT INTO notifications (id, user_id, title, message, kind, is_read, link, created_at) VALUES
  -- Thông báo cho Admin (USR-ADMIN-01)
  ('d1000001-0000-4000-8000-000000000001', 'b9d37b50-942d-430a-a45f-0e303739b400', 'Đề xuất hoạt động mới', 'NXB Trẻ vừa nộp đề xuất hoạt động "Workshop: Thưởng thức Cà phê & Đọc sách". Vui lòng kiểm duyệt.', 'system'::notification_kind, false, '/admin?tab=activities', NOW() - INTERVAL '30 minutes'),
  ('d1000001-0000-4000-8000-000000000002', 'b9d37b50-942d-430a-a45f-0e303739b400', 'Yêu cầu phân bổ gian hàng', 'Nhà Sách Bình Minh đã hoàn tất hồ sơ đăng ký gian hàng cho Lễ hội Mùa Thu 2026.', 'system'::notification_kind, false, '/admin?tab=booths', NOW() - INTERVAL '2 hours'),
  ('d1000001-0000-4000-8000-000000000003', 'b9d37b50-942d-430a-a45f-0e303739b400', 'Báo cáo vận hành ngày', 'Đã có 142 lượt check-in tại Sân khấu chính A trong sự kiện hôm nay.', 'system'::notification_kind, true, '/admin?tab=reports', NOW() - INTERVAL '5 hours'),
  -- Thông báo cho Partner NXB Trẻ (USR-PARTNER-01)
  ('d1000001-0000-4000-8000-000000000004', 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', 'Hồ sơ sự kiện đã được duyệt', 'Đơn đăng ký tham gia Lễ hội Đường Sách Mùa Thu 2026 của NXB Trẻ đã được Ban Quản Lý phê duyệt chính thức.', 'system'::notification_kind, false, '/partner/events', NOW() - INTERVAL '1 day'),
  ('d1000001-0000-4000-8000-000000000005', 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', 'Phân bổ gian hàng thành công', 'Gian hàng trung tâm C-01 đã được phân bổ cho NXB Trẻ. Quý đơn vị có thể bắt đầu trang trí và nhập danh mục sách.', 'system'::notification_kind, false, '/partner/booths', NOW() - INTERVAL '1 day'),
  ('d1000001-0000-4000-8000-000000000006', 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', 'Đề xuất tọa đàm đã được duyệt', 'Hoạt động "Tọa đàm: Ký ức văn học Sài Gòn - Chợ Lớn" đã được duyệt lịch tổ chức tại Sân khấu A.', 'system'::notification_kind, true, '/partner/activities', NOW() - INTERVAL '2 days'),
  -- Thông báo cho Partner Nhà Sách Bình Minh (USR-PARTNER-02)
  ('d1000001-0000-4000-8000-000000000007', 'a1997704-8ccd-4838-ab09-31be558bf632', 'Phê duyệt tham gia sự kiện', 'Hồ sơ tham gia Lễ hội Đường Sách Mùa Thu 2026 của Nhà Sách Bình Minh đã được duyệt thành công.', 'system'::notification_kind, false, '/partner/events', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, is_read = EXCLUDED.is_read;

-- 2. Dữ liệu bán sách thực tế cho gian hàng (để biểu đồ doanh số hoạt động)
INSERT INTO book_sales (id, book_id, booth_id, quantity, sold_date) VALUES
  ('d2000001-0000-4000-8000-000000000001', 'a3000001-0000-4000-8000-000000000001', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 12, CURRENT_DATE - INTERVAL '3 days'),
  ('d2000001-0000-4000-8000-000000000002', 'a3000001-0000-4000-8000-000000000001', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 18, CURRENT_DATE - INTERVAL '2 days'),
  ('d2000001-0000-4000-8000-000000000003', 'a3000001-0000-4000-8000-000000000001', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 25, CURRENT_DATE - INTERVAL '1 day'),
  ('d2000001-0000-4000-8000-000000000004', 'a3000001-0000-4000-8000-000000000001', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 34, CURRENT_DATE),
  ('d2000001-0000-4000-8000-000000000005', 'a3000001-0000-4000-8000-000000000003', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 15, CURRENT_DATE - INTERVAL '1 day'),
  ('d2000001-0000-4000-8000-000000000006', 'a3000001-0000-4000-8000-000000000004', 'cff5ef63-f6a2-48a9-ae8e-e805566ea654', 20, CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 3. Hồ sơ gửi duyệt sách mới từ Partner
INSERT INTO book_submissions (id, book_id, stall_id, type, status, submitted_by, submitted_at, proposed_data, inventory_quantity, sold_quantity) VALUES
  ('d3000001-0000-4000-8000-000000000001', 'a3000001-0000-4000-8000-000000000001', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 'UPDATE', 'APPROVED', 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', NOW() - INTERVAL '2 days', '{"title":"Mắt biếc","author":"Nguyễn Nhật Ánh","publisher":"NXB Trẻ","price":110000}'::jsonb, 50, 15),
  ('d3000001-0000-4000-8000-000000000002', null, 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 'CREATE', 'PENDING', 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', NOW() - INTERVAL '4 hours', '{"isbn":"9786041000009","title":"Cây chuối non đi giày xanh","author":"Nguyễn Nhật Ánh","publisher":"NXB Trẻ","categoryName":"Văn học Việt Nam","publicationYear":2024,"description":"Tác phẩm truyện dài đậm chất trong trẻo và hoài niệm tuổi thơ của tác giả Nguyễn Nhật Ánh."}'::jsonb, 60, 0)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, proposed_data = EXCLUDED.proposed_data;

-- 4. Dữ liệu Tin tức & Nội dung trang chủ (Content Entries)
DELETE FROM content_entries WHERE id IN ('d4000001-0000-4000-8000-000000000000', 'd4000001-0000-4000-8000-000000000004', 'd4000001-0000-4000-8000-000000000005') OR slug IN ('landing-journey', 'landing-org', 'landing-news', 'hanh-trinh-10-nam-duong-sach');

INSERT INTO content_entries (id, slug, kind, title, data, status, version, updated_at) VALUES
  ('d4000001-0000-4000-8000-000000000000', 'landing-news', 'news', 'Bản tin & Tin tức Đường Sách TP.HCM', '{
    "articles": [
      {
        "id": "news-01",
        "titleVi": "Khai mạc Lễ hội Đường Sách TP.HCM Mùa Thu 2026: Không gian tri thức và hội ngộ tác giả",
        "titleEn": "Grand Opening of HCMC Book Street Autumn Festival 2026: A Hub of Knowledge and Author Gatherings",
        "category": "van-hoa",
        "categoryLabelVi": "Sự kiện & Hoạt động",
        "categoryLabelEn": "Events & Activities",
        "publishedDate": "10/10/2026",
        "readTime": "5 phút đọc",
        "views": 0,
        "featured": true,
        "imageUrl": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
        "imageCaptionVi": "Quang cảnh lễ khai mạc rực rỡ sắc màu tại sân khấu chính Đường Sách Nguyễn Văn Bình.",
        "imageCaptionEn": "Vibrant grand opening ceremony at the main stage of Nguyen Van Binh Book Street.",
        "summaryVi": "Sáng ngày 10/10/2026, tại con đường Nguyễn Văn Bình rợp bóng cây xanh, Lễ hội Đường Sách Mùa Thu 2026 đã chính thức mở màn với hơn 30 gian hàng, chuỗi tọa đàm và không gian trải nghiệm văn hóa đa giác quan.",
        "summaryEn": "On the morning of October 10, 2026, the Autumn Book Street Festival officially kicked off on leafy Nguyen Van Binh street featuring over 30 stalls, talks, and multi-sensory cultural experiences.",
        "contentVi": [
          "Sáng nay, tại Đường Sách Nguyễn Văn Bình, Lễ hội Đường Sách TP.HCM Mùa Thu 2026 đã chính thức khai mạc với sự hiện diện của đại diện Sở Thông tin và Truyền thông, Hội Xuất bản Việt Nam, hơn 30 đơn vị xuất bản - phát hành sách cùng hàng ngàn bạn đọc và du khách trong nước, quốc tế.",
          "Lễ hội năm nay được tổ chức với chủ đề “Kết nối tri thức - Nuôi dưỡng tương lai”, mang đến hàng ngàn tựa sách mới cùng chuỗi hơn 20 sự kiện giao lưu tác giả, tọa đàm chuyên đề và các workshop nghệ thuật thủ công độc đáo.",
          "Điểm nhấn đặc biệt của mùa lễ hội là việc ra mắt khu vực Trải nghiệm Văn hóa Số, cho phép bạn đọc quét mã QR tương tác, tra cứu vị trí sách theo gian hàng và lưu lại hành trình khám phá di sản Đường Sách trên ứng dụng di động.",
          "Lễ hội sẽ kéo dài liên tục từ ngày 10/10 đến hết ngày 18/10/2026 với nhiều chương trình ưu đãi sách hấp dẫn và các buổi ký tặng sách trực tiếp từ các tác giả tên tuổi."
        ],
        "contentEn": [
          "This morning at Nguyen Van Binh Book Street, the HCMC Autumn Book Festival 2026 was officially inaugurated with the presence of city cultural leaders, publisher representatives, and thousands of eager book lovers.",
          "This year''s theme, ''Connecting Knowledge - Nurturing Future'', introduces thousands of new titles alongside 20+ author talks, seminars, and artisan craft workshops.",
          "A major highlight is the Digital Cultural Experience zone, enabling visitors to scan interactive QR codes, explore map-based book indexes, and track cultural badges.",
          "The festival runs until October 18, 2026, offering book promotions and exclusive author signing sessions."
        ],
        "author": "Ban Quản Lý Đường Sách",
        "tags": ["Lễ hội 2026", "Sự kiện", "Khai mạc", "Văn hóa đọc"]
      },
      {
        "id": "news-02",
        "titleVi": "Tọa đàm: Hành trình 10 năm lan tỏa văn hóa đọc giữa lòng Sài Gòn",
        "titleEn": "Seminar: 10-Year Journey of Fostering Reading Culture in the Heart of Saigon",
        "category": "tac-gia",
        "categoryLabelVi": "Văn hóa đọc & Tác giả",
        "categoryLabelEn": "Reading Culture",
        "publishedDate": "09/10/2026",
        "readTime": "4 phút đọc",
        "views": 0,
        "featured": true,
        "imageUrl": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
        "imageCaptionVi": "Các diễn giả và chuyên gia văn hóa thảo luận sôi nổi tại Tọa đàm 10 năm Đường Sách.",
        "imageCaptionEn": "Guest speakers and cultural scholars in engaging discussion at the 10-year Anniversary Seminar.",
        "summaryVi": "Diễn đàn nhìn lại cột mốc 10 năm hình thành và định hướng phát triển không gian văn hóa số tại Đường Sách Nguyễn Văn Bình, nơi hội tụ của tri thức và tình yêu sách.",
        "summaryEn": "A retrospective forum on the 10-year milestone and the forward-looking digital culture roadmap of Nguyen Van Binh Book Street.",
        "contentVi": [
          "Trải qua một thập kỷ hình thành và phát triển, Đường Sách TP.HCM đã đón hơn 25 triệu lượt du khách, tổ chức thành công hơn 2.000 sự kiện văn hóa và khẳng định vị thế là một trong những điểm đến văn hóa độc đáo nhất của cả nước.",
          "Tại buổi tọa đàm, các nhà nghiên cứu văn hóa, nhà văn lão thành và các nhà xuất bản đã cùng thảo luận về vai trò của không gian mở trong việc nuôi dưỡng thói quen đọc sách cho thế hệ trẻ.",
          "Ông Lê Hoàng - đại diện Ban Điều Hành chia sẻ: ''Đường Sách không chỉ là nơi mua bán sách, mà là mái nhà chung ấm áp của những người yêu con chữ, nơi trao truyền tình yêu tri thức từ thế hệ này sang thế hệ khác.''"
        ],
        "contentEn": [
          "Over a decade of growth, HCMC Book Street has welcomed over 25 million visitors, hosted 2,000+ cultural events, and established itself as a premier cultural landmark.",
          "Scholars, veteran writers, and publishers discussed the critical role of open community spaces in nurturing youth reading habits.",
          "Organizers highlighted that Book Street is not just a commercial avenue, but a sanctuary of literary discovery and intergenerational dialogue."
        ],
        "author": "Hội Xuất Bản Việt Nam",
        "tags": ["Kỷ niệm 10 năm", "Tọa đàm", "Di sản Sài Gòn", "Tác giả"]
      },
      {
        "id": "news-03",
        "titleVi": "Ra mắt Không gian Thư viện Số & Bản đồ Tương tác Di sản Đường Sách",
        "titleEn": "Launch of Digital Library Showcase & Interactive Heritage Map",
        "category": "thong-cao",
        "categoryLabelVi": "Thông cáo báo chí",
        "categoryLabelEn": "Press Releases",
        "publishedDate": "08/10/2026",
        "readTime": "3 phút đọc",
        "views": 0,
        "featured": false,
        "imageUrl": "https://images.unsplash.com/photo-1507842229458-5777174e2d27?auto=format&fit=crop&w=1200&q=80",
        "imageCaptionVi": "Giao diện bản đồ tương tác và tra cứu thư viện số trực quan trên thiết bị thông minh.",
        "imageCaptionEn": "Interactive digital map interface and smart book catalog discovery.",
        "summaryVi": "Ứng dụng công nghệ số hóa di sản và tra cứu sách đa phương thức giúp độc giả dễ dàng tìm kiếm sách theo gian hàng, tham gia sự kiện và check-in nhận huy hiệu văn hóa.",
        "summaryEn": "Smart heritage digital solutions enabling visitors to discover books by stalls, register for events, and earn cultural badges.",
        "contentVi": [
          "Nhằm nâng cao trải nghiệm cho độc giả, Ban Quản Lý Đường Sách phối hợp cùng các đơn vị công nghệ chính thức vận hành nền tảng Thư viện Số và Bản đồ tương tác đa tiện ích.",
          "Người dùng có thể tra cứu nhanh vị trí của từng tựa sách yêu thích tại 20+ gian hàng thực tế, xem lịch sự kiện trực tiếp theo thời gian thực và quét mã QR tại các điểm check-in di sản.",
          "Hệ thống vận hành mượt mà trên cả máy tính và thiết bị di động, không yêu cầu cài đặt ứng dụng phức tạp."
        ],
        "contentEn": [
          "To elevate visitor experience, the Book Street Board launched a modernized Digital Library platform and Interactive Map.",
          "Visitors can instantly look up specific book locations across 20+ physical booths, view real-time event schedules, and scan cultural QR markers.",
          "The system runs seamlessly on both desktop and mobile web without cumbersome app downloads."
        ],
        "author": "Trung tâm Chuyển đổi số",
        "tags": ["Chuyển đổi số", "Thư viện số", "Bản đồ tương tác", "Di sản"]
      },
      {
        "id": "news-04",
        "titleVi": "Trải nghiệm Workshop nghệ thuật Đóng sách Thủ công & Khắc mộc bản",
        "titleEn": "Artisan Bookbinding & Woodblock Printing Workshop Delights Visitors",
        "category": "nhip-song",
        "categoryLabelVi": "Nhịp sống Đường Sách",
        "categoryLabelEn": "Book Street Life",
        "publishedDate": "07/10/2026",
        "readTime": "4 phút đọc",
        "views": 0,
        "featured": false,
        "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
        "imageCaptionVi": "Độc giả trẻ trải nghiệm từng công đoạn khâu sách thủ công bằng chỉ dù và giấy dó cổ truyền.",
        "imageCaptionEn": "Young participants sewing handmade book bindings on traditional Do paper.",
        "summaryVi": "Hàng trăm bạn trẻ và gia đình thích thú tự tay khâu từng gáy sách cổ, ép bìa giấy dó và in tranh mộc bản truyền thống trong không gian xanh mát dưới vòm me.",
        "summaryEn": "Hundreds of young readers and families handcrafted heirloom books and printed woodblock art under the green canopy.",
        "contentVi": [
          "Vào những ngày cuối tuần, góc sân khấu B của Đường Sách luôn rộn rã tiếng cười trong không gian workshop đóng sách thủ công.",
          "Dưới sự hướng dẫn tận tình của các nghệ nhân làng nghề, người tham gia được tự tay chọn giấy dó, đục lỗ khâu gáy theo kỹ thuật truyền thống Á Đông và khắc triện in dấu ấn cá nhân lên trang bìa.",
          "Đây là hoạt động trải nghiệm văn hóa hoàn toàn miễn phí nhằm tôn vinh giá trị của cuốn sách giấy trong kỷ nguyên số."
        ],
        "contentEn": [
          "On weekend afternoons, Stage B comes alive with creative energy during the artisan bookbinding workshops.",
          "Guided by master artisans, participants select traditional Do paper, sew custom bindings, and print personalized seals.",
          "This free cultural workshop celebrates the enduring tangible beauty of physical books in the digital era."
        ],
        "author": "CLB Sách & Nghệ Thuật Sài Gòn",
        "tags": ["Workshop", "Thủ công", "Giới trẻ", "Trải nghiệm"]
      },
      {
        "id": "news-05",
        "titleVi": "Giao lưu cùng Tác giả: Ký ức Sài Gòn - Chợ Lớn qua từng trang viết",
        "titleEn": "Author Meet & Greet: Memories of Saigon - Cho Lon in Living Pages",
        "category": "tac-gia",
        "categoryLabelVi": "Văn hóa đọc & Tác giả",
        "categoryLabelEn": "Reading Culture",
        "publishedDate": "06/10/2026",
        "readTime": "3 phút đọc",
        "views": 0,
        "featured": false,
        "imageUrl": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
        "imageCaptionVi": "Buổi ký tặng sách ấm áp và lắng đọng cùng nhà nghiên cứu văn hóa.",
        "imageCaptionEn": "Warm book signing and heartfelt dialogue with cultural researcher.",
        "summaryVi": "Buổi gặp gỡ thân mật giữa các nhà nghiên cứu lịch sử văn hóa và độc giả trẻ, mở ra những góc nhìn sâu lắng về nếp sống và con người Sài Gòn xưa.",
        "summaryEn": "An intimate gathering between historians, writers, and young readers exploring the heritage of old Saigon.",
        "contentVi": [
          "Buổi ra mắt tác phẩm khảo cứu văn hóa ''Sài Gòn - Chợ Lớn: Ký ức và Hiện tại'' đã thu hút đông đảo độc giả nhiều lứa tuổi tham dự.",
          "Tác giả đã chia sẻ những mẩu chuyện xúc động về nếp sống hào sảng, những hàng quán xưa và kiến trúc cổ đang dần biến đổi theo thời gian.",
          "Nhiều độc giả trẻ bày tỏ niềm tự hào và mong muốn tiếp tục gìn giữ những nét đẹp văn hóa độc đáo của thành phố."
        ],
        "contentEn": [
          "The book launch and panel ''Saigon - Cho Lon: Past and Present Memories'' drew a diverse, multi-generational audience.",
          "The author recounted poignant stories of Saigon hospitality, vanishing culinary streets, and colonial architecture.",
          "Young attendees expressed appreciation for city heritage preservation."
        ],
        "author": "NXB Tổng Hợp TP.HCM",
        "tags": ["Giao lưu tác giả", "Sài Gòn xưa", "Ký ức", "Sách mới"]
      }
    ]
  }'::jsonb, 'published', 1, NOW()),

  ('d4000001-0000-4000-8000-000000000004', 'landing-journey', 'journey', 'Hành trình 10 năm kiến tạo Không gian Văn hóa Đọc', '{
    "hero": {
      "era": "2016 - 2026",
      "titleLine1": "Hành trình",
      "titleLine2": "10 Năm Lan Tỏa",
      "titleLine3": "Văn Hóa Đọc",
      "summary": "Đường Sách Nguyễn Văn Bình — biểu tượng văn hóa tri thức và điểm hẹn giao lưu tác giả giữa lòng đô thị TP. Hồ Chí Minh.",
      "bgPhoto": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80"
    },
    "brandStory": {
      "title": "Câu chuyện hình thành",
      "desc": "Từ ý tưởng về một không gian văn hóa mở dành riêng cho sách và người yêu sách giữa trung tâm Sài Gòn.",
      "heading": "Biểu tượng văn hóa đọc giữa lòng đô thị Sài Gòn",
      "paragraph1": "Được khánh thành vào ngày 09/01/2016, Đường Sách TP.HCM trên trục đường Nguyễn Văn Bình đã trở thành công trình văn hóa tiêu biểu của thành phố mang tên Bác. Nằm kề bên các di tích lịch sử như Nhà thờ Đức Bà và Bưu điện Trung tâm, nơi đây không chỉ là không gian mua bán sách mà còn là điểm hẹn tinh thần của người yêu con chữ.",
      "paragraph2": "Trải qua 10 năm chuyển mình và phụng sự cộng đồng, Đường Sách đã đón tiếp hơn 25 triệu lượt khách trong và ngoài nước, tổ chức hàng ngàn chương trình tọa đàm, triển lãm và giao lưu tác giả, lan tỏa thói quen đọc sách đến mọi tầng lớp nhân dân.",
      "quote": "Đường Sách không chỉ đơn thuần là nơi bán sách, mà là mái nhà chung ấm áp của những tâm hồn đồng điệu, nơi lưu giữ ký ức và gieo mầm tri thức cho tương lai.",
      "quoteAuthor": "Lê Hoàng — Nguyên Phó Chủ tịch Hội Xuất bản Việt Nam, Giám đốc Công ty Đường Sách TP.HCM",
      "image1": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
      "image1Caption": "Không gian xanh mát rợp bóng cây cổ thụ dưới vòm me Nguyễn Văn Bình.",
      "image2": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
      "image2Caption": "Hàng ngàn độc giả hội tụ trong các dịp lễ hội sách lớn.",
      "image3": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      "image3Caption": "Workshop trải nghiệm văn hóa và nghệ thuật thủ công cho bạn trẻ.",
      "image4": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
      "image4Caption": "Sân khấu giao lưu tác giả - tác phẩm và tọa đàm chuyên đề."
    },
    "visionMission": {
      "introTitleLine1": "Tầm nhìn & Sứ mệnh",
      "introTitleLine2": "Kiến tạo tương lai văn hóa đọc",
      "introDesc": "Định hướng phát triển bền vững của Đường Sách TP.HCM trong kỷ nguyên số.",
      "visionTitle": "Tầm nhìn 2030",
      "visionDesc": "Trở thành không gian văn hóa đọc hàng đầu Đông Nam Á, kết hợp hài hòa giữa không gian vật lý di sản và trải nghiệm công nghệ số tương tác hiện đại.",
      "visionImage": "https://images.unsplash.com/photo-1507842229458-5777174e2d27?auto=format&fit=crop&w=800&q=80",
      "missionTitle": "Sứ mệnh phụng sự",
      "missionDesc": "Nuôi dưỡng thói quen đọc sách cho thế hệ trẻ, tôn vinh giá trị tri thức và xây dựng cộng đồng văn hóa đọc văn minh, nghĩa tình.",
      "missionPoints": [
        "Lan tỏa thói quen đọc sách đến mọi gia đình và thế hệ độc giả",
        "Đồng hành cùng hơn 30 nhà xuất bản và đơn vị phát hành uy tín",
        "Chuyển đổi số di sản và kết nối thư viện tương tác thông minh"
      ],
      "openAccessTitle": "Không gian Mở & Miễn phí",
      "openAccessDesc": "Mở cửa tự do 365 ngày/năm chào đón người dân thành phố và du khách thập phương.",
      "networkTitle": "Mạng lưới Đối tác Tri thức",
      "networkDesc": "Liên kết chặt chẽ với các nhà xuất bản hàng đầu, các trường đại học và tổ chức văn hóa quốc tế.",
      "innovationTitle": "Đổi mới & Sáng tạo Số",
      "innovationDesc": "Tiên phong ứng dụng bản đồ di sản tương tác, check-in QR thông minh và thư viện số tra cứu trực tuyến."
    },
    "milestonesHeader": {
      "title": "Dấu ấn qua từng thời kỳ",
      "desc": "Các cột mốc lịch sử đánh dấu sự trưởng thành và phát triển của Đường Sách TP.HCM."
    },
    "milestones": [
      {
        "id": "m1",
        "year": "2016",
        "badge": "Khởi đầu",
        "title": "Khánh thành Đường Sách TP.HCM",
        "desc": "Chính thức đi vào hoạt động ngày 09/01/2016 với 20 gian hàng xuất bản đầu tiên trên đường Nguyễn Văn Bình.",
        "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "m2",
        "year": "2018",
        "badge": "Cột mốc",
        "title": "Đạt 5 triệu lượt bạn đọc & du khách",
        "desc": "Trở thành điểm đến văn hóa du lịch hấp dẫn hàng đầu TP.HCM, đón nhận sự quan tâm của nhiều đoàn ngoại giao quốc tế.",
        "image": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "m3",
        "year": "2020",
        "badge": "Phát triển",
        "title": "Mở rộng chuỗi Workshop & Không gian Thiếu nhi",
        "desc": "Đa dạng hóa hoạt động với sân chơi đọc sách, vẽ tranh, khâu sách thủ công và triển lãm sách nghệ thuật.",
        "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "m4",
        "year": "2022",
        "badge": "Chuyển mình",
        "title": "Phục hồi mạnh mẽ & Đạt 15 triệu lượt khách",
        "desc": "Tổ chức chuỗi sự kiện Ngày Sách và Văn hóa đọc Việt Nam, thu hút hàng chục ngàn lượt độc giả mỗi ngày.",
        "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "m5",
        "year": "2024",
        "badge": "Số hóa",
        "title": "Ra mắt Đề án Chuyển đổi số & Thư viện số",
        "desc": "Áp dụng bản đồ tương tác, tra cứu sách theo vị trí gian hàng và số hóa dữ liệu di sản văn hóa đọc.",
        "image": "https://images.unsplash.com/photo-1507842229458-5777174e2d27?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "m6",
        "year": "2026",
        "badge": "10 Năm",
        "title": "Kỷ niệm 10 năm thành lập Đường Sách",
        "desc": "Khẳng định biểu tượng văn hóa tri thức vững chắc của TP.HCM và vươn tầm không gian giao lưu quốc tế.",
        "image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "m7",
        "year": "2026",
        "badge": "Vinh danh Quốc tế",
        "title": "Vinh danh Giải thưởng Quốc tế UIA 2030 Award",
        "desc": "Được Liên hiệp Kiến trúc sư Thế giới (UIA) và UN-Habitat trao giải tại hạng mục Tiếp cận không gian xanh & công cộng (Access to green and public spaces), tôn vinh mô hình không gian văn hóa đọc bền vững.",
        "image": "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "achievementsHeader": {
      "title": "Những con số ấn tượng",
      "desc": "Thành quả sau một thập kỷ đồng hành cùng bạn đọc và phát triển văn hóa đọc thành phố."
    },
    "achievements": [
      { "value": 25, "suffix": " Triệu+", "label": "Lượt khách tham quan", "desc": "Độc giả trong nước và du khách quốc tế" },
      { "value": 2200, "suffix": "+", "label": "Sự kiện văn hóa", "desc": "Tọa đàm, ra mắt sách và triển lãm chuyên đề" },
      { "value": 30, "suffix": "+", "label": "Gian hàng xuất bản", "desc": "Các đơn vị xuất bản - phát hành uy tín" },
      { "value": 10, "suffix": " Năm", "label": "Hành trình phụng sự", "desc": "2016 - 2026 bền bỉ lan tỏa tri thức" }
    ],
    "partnersHeader": {
      "title": "Đối tác đồng hành",
      "eduTitle": "Đối tác Giáo dục & Đào tạo",
      "corpTitle": "Đơn vị Xuất bản & Doanh nghiệp"
    },
    "educationPartners": [
      { "id": "dhqg", "name": "Đại học Quốc gia TP.HCM", "category": "education", "subText": "Hợp tác đào tạo & nghiên cứu" },
      { "id": "dhsp", "name": "Trường ĐH Sư Phạm TP.HCM", "category": "education", "subText": "Phát triển văn hóa đọc học đường" },
      { "id": "deakin", "name": "Deakin University", "category": "education", "subText": "Giao lưu học thuật quốc tế" },
      { "id": "swinburne", "name": "Swinburne University of Technology", "category": "education", "subText": "Chương trình đổi mới sáng tạo" }
    ],
    "enterprisePartners": [
      { "id": "nxbtre", "name": "Nhà Xuất Bản Trẻ", "category": "enterprise", "subText": "Gian hàng tiêu biểu" },
      { "id": "kimdong", "name": "NXB Kim Đồng", "category": "enterprise", "subText": "Sách thiếu nhi & giáo dục" },
      { "id": "nhanam", "name": "Công ty Văn hóa & Truyền thông Nhã Nam", "category": "enterprise", "subText": "Văn học đương đại" },
      { "id": "tonghop", "name": "NXB Tổng Hợp TP.HCM", "category": "enterprise", "subText": "Sách lịch sử văn hóa" }
    ]
  }'::jsonb, 'published', 1, NOW()),

  ('d4000001-0000-4000-8000-000000000005', 'landing-org', 'organization', 'Bộ Máy Tổ Chức Đường Sách TP.HCM', '{
    "hero": {
      "era": "Nhiệm kỳ 2024 - 2029",
      "title": "Bộ Máy Tổ Chức & Ban Điều Hành",
      "lead": "Đội ngũ chuyên trách định hướng, quản lý vận hành và kiến tạo các không gian trải nghiệm văn hóa đọc tại Đường Sách TP. Hồ Chí Minh."
    },
    "directory": {
      "kicker": "CƠ CẤU NHÂN SỰ",
      "heading": "Ban Điều Hành & Đội Ngũ Chuyên Trách",
      "sub": "Quy tụ các nhà quản lý xuất bản giàu kinh nghiệm, chuyên gia văn hóa và đội ngũ nhân sự trẻ nhiệt huyết.",
      "tier1Title": "Hội đồng Cố vấn & Lãnh đạo Cấp cao",
      "tier1Badge": "LÃNH ĐẠO",
      "tier2Title": "Ban Quản lý & Trưởng các Bộ phận",
      "tier2Badge": "QUẢN LÝ",
      "tier3Title": "Đội ngũ Điều phối & Chuyên viên Vận hành",
      "tier3Badge": "CHUYÊN VIÊN"
    },
    "leaders": [
      {
        "id": "ldr-01",
        "nameVi": "Ông Lê Hoàng",
        "roleVi": "Chủ tịch Hội đồng Phát triển & Cố vấn Cấp cao",
        "badgeVi": "Cố vấn cấp cao",
        "subVi": "Nguyên Phó Chủ tịch Hội Xuất bản Việt Nam",
        "bioVi": "Người sáng lập và định hình không gian văn hóa Đường Sách TP.HCM từ những ngày đầu, có hơn 40 năm kinh nghiệm trong ngành xuất bản Việt Nam.",
        "contactEmail": "lehoang@duongsach.example.vn",
        "avatarText": "LH",
        "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "tagsVi": ["Sáng lập", "Cố vấn", "Xuất bản"],
        "tier": 1
      },
      {
        "id": "ldr-02",
        "nameVi": "Bà Đoàn Thị Trang",
        "roleVi": "Giám đốc Điều hành Đường Sách TP.HCM",
        "badgeVi": "Ban Điều Hành",
        "subVi": "Quản trị tổng thể & Phát triển cộng đồng",
        "bioVi": "Chịu trách nhiệm điều hành toàn diện hoạt động vận hành, hợp tác xuất bản và chiến lược đổi mới trải nghiệm cho bạn đọc tại Đường Sách.",
        "contactEmail": "trangdoan@duongsach.example.vn",
        "avatarText": "TT",
        "imageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "tagsVi": ["Điều hành", "Phát triển", "Văn hóa"],
        "tier": 1
      },
      {
        "id": "ldr-03",
        "nameVi": "Ông Nguyễn Văn Hùng",
        "roleVi": "Trưởng Ban Truyền thông & Sự kiện",
        "badgeVi": "Sự kiện & Báo chí",
        "subVi": "Phụ trách các lễ hội sách & tọa đàm tác giả",
        "bioVi": "Chủ trì tổ chức hàng trăm sự kiện giao lưu tác giả, hội sách chuyên đề và phụ trách quan hệ báo chí truyền thông.",
        "contactEmail": "nguyenhung@duongsach.example.vn",
        "avatarText": "NH",
        "imageUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        "tagsVi": ["Sự kiện", "Truyền thông", "Tọa đàm"],
        "tier": 2
      },
      {
        "id": "ldr-04",
        "nameVi": "Bà Phạm Thanh Mai",
        "roleVi": "Trưởng Ban Vận hành & Cơ sở vật chất",
        "badgeVi": "Vận hành gian hàng",
        "subVi": "Phụ trách 30+ ki-ốt & an toàn kỹ thuật",
        "bioVi": "Đảm bảo công tác an ninh, cảnh quan xanh, hỗ trợ kỹ thuật và phân bổ cơ sở vật chất cho các gian hàng xuất bản.",
        "contactEmail": "phamthanhmai@duongsach.example.vn",
        "avatarText": "TM",
        "imageUrl": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        "tagsVi": ["Vận hành", "Gian hàng", "An ninh"],
        "tier": 2
      },
      {
        "id": "ldr-05",
        "nameVi": "Ông Trần Minh Khoa",
        "roleVi": "Trưởng Ban Chuyển đổi số & Thư viện số",
        "badgeVi": "Công nghệ & Số hóa",
        "subVi": "Nền tảng số & Bản đồ tương tác",
        "bioVi": "Phụ trách kiến trúc hệ sinh thái số, hệ thống tra cứu thư viện trực tuyến và tương tác mã QR di sản văn hóa.",
        "contactEmail": "minhkhoa@duongsach.example.vn",
        "avatarText": "MK",
        "imageUrl": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
        "tagsVi": ["Chuyển đổi số", "Thư viện số", "Bản đồ 3D"],
        "tier": 2
      },
      {
        "id": "ldr-06",
        "nameVi": "Bà Lê Hoàng Yến",
        "roleVi": "Chuyên viên Chăm sóc Bạn đọc & Hướng dẫn Văn hóa",
        "badgeVi": "Dịch vụ bạn đọc",
        "subVi": "Hỗ trợ khách tham quan & tour di sản",
        "bioVi": "Trực tiếp đón tiếp các đoàn du khách, hỗ trợ bạn đọc trải nghiệm bản đồ di sản và hướng dẫn hoạt động workshop thiếu nhi.",
        "contactEmail": "hoangyen@duongsach.example.vn",
        "avatarText": "HY",
        "imageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "tagsVi": ["Bạn đọc", "Tour di sản", "Workshop"],
        "tier": 3
      }
    ],
    "principles": [
      {
        "num": "01",
        "title": "Chuyên nghiệp & Tận tâm Phụng sự",
        "desc": "Đặt lợi ích của bạn đọc và cộng đồng yêu sách lên hàng đầu trong mọi hoạt động tổ chức và vận hành."
      },
      {
        "num": "02",
        "title": "Đồng hành & Kết nối Tri thức",
        "desc": "Tạo cầu nối gắn kết chặt chẽ giữa tác giả, nhà xuất bản, nhà nghiên cứu và đông đảo công chúng độc giả."
      },
      {
        "num": "03",
        "title": "Đổi mới Sáng tạo & Chuyển đổi Số",
        "desc": "Liên tục cập nhật các giải pháp công nghệ hiện đại nhằm mang lại trải nghiệm văn hóa đọc phong phú, tiện lợi và bền vững."
      }
    ]
  }'::jsonb, 'published', 1, NOW())
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, data = EXCLUDED.data, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

