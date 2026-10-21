const body = {
  type: 'object', additionalProperties: false,
  required: ['title', 'kind', 'locationId', 'startAt', 'endAt'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    kind: { type: 'string', enum: ['talkshow', 'workshop', 'launch', 'exhibition', 'minigame', 'signing'] },
    locationId: { type: 'string', format: 'uuid' },
    startAt: { type: 'string', format: 'date-time' }, endAt: { type: 'string', format: 'date-time' },
    capacity: { type: 'integer', minimum: 0, default: 50 },
    targetAudience: { type: 'string', minLength: 1, maxLength: 2000, description: 'Required for partners; whitespace-only values are invalid.' },
    description: { type: 'string', maxLength: 20000 }, speaker: { type: 'string', maxLength: 160 },
    imageUrl: { type: 'string', description: 'URL or base64 image, up to 20 MiB before encoding.' },
    isPublished: { type: 'boolean', description: 'Admin only: publish immediately unless false; partners always wait for review.' },
    devices: { type: 'array', maxItems: 100, items: { type: 'object', required: ['name', 'quantity'], properties: { name: { type: 'string' }, quantity: { type: 'integer', minimum: 0 } } } },
  },
};
export const eventRegistrationPaths = Object.fromEntries(['admin', 'partner'].map(role => [`/${role}/event-registrations`, { post: {
  tags: [role === 'admin' ? 'Quản trị viên - Sự kiện' : 'Đối tác - Sự kiện'],
  summary: 'Đăng ký sự kiện độc lập', security: [{ BearerAuth: [] }],
  description: 'Tạo sự kiện mới với ngày giờ riêng. Không nhận eventId, không kiểm tra lịch sự kiện khác, cho phép trùng lịch. Admin có thể nhập ngày quá khứ; đối tác không được nhập ngày trước ngày hiện tại theo Asia/Ho_Chi_Minh và bắt buộc cung cấp targetAudience. Kết thúc phải sau bắt đầu. Đối tác không cần hồ sơ tham gia sự kiện khác; đăng ký chờ Admin duyệt.',
  requestBody: { required: true, content: { 'application/json': { schema: { ...body, required: role === 'partner' ? [...body.required, 'targetAudience'] : body.required } } } },
  responses: {
    200: { description: role === 'admin' ? 'Created independent event: data {id,status}.' : 'Pending registration: data {id,registrationId,status:"pending"}. Approval publishes the event and automatically creates or updates the submitting organization participation application to approved in the same transaction; no separate participation request is needed.' },
    401: { description: 'Authentication required.' }, 403: { description: 'Role or permission denied.' }, 422: { description: 'Invalid fields, missing location or end before start.' },
  },
} }]));

eventRegistrationPaths['/partner/event-applications'] = { post: {
  tags: ['Đối tác - Sự kiện'], summary: 'Đăng ký tham gia sự kiện đang hoặc sắp diễn ra', security: [{ BearerAuth: [] }],
  description: 'Không có thời gian mở/đóng đăng ký. Không xét partnerApplyDeadline. Chấp nhận sự kiện công khai đang diễn ra hoặc sắp diễn ra theo trạng thái lịch Việt Nam; không nhận sự kiện kết thúc, hủy, nháp hoặc đã xóa. Hồ sơ vẫn được Admin xét duyệt.',
  requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false, required: ['eventId'], properties: { eventId: { type: 'string', format: 'uuid' } } } } } },
  responses: { 200: { description: 'Participation application submitted.' }, 409: { description: 'Event does not accept participation or duplicate application.' }, 401: { description: 'Authentication required.' }, 403: { description: 'Partner permission required.' } },
} };

eventRegistrationPaths['/partner/schedule'] = { get: {
  tags: ['Đối tác - Sự kiện'], summary: 'Lịch sự kiện của đối tác', security: [{ BearerAuth: [] }],
  description: 'Mỗi sự kiện có hostOrgName là tên đối tác tổ chức từ đăng ký sự kiện độc lập đã duyệt. participationStatus là trạng thái hồ sơ tham gia của đối tác hiện tại; đối tác tổ chức có trạng thái approved ngay khi đề xuất được duyệt.',
  responses: { 200: { description: 'Schedule items including hostOrgName and participationStatus when available.' } },
} };

eventRegistrationPaths['/partner/reports'] = { get: {
  tags: ['Đối tác - Sự kiện'], summary: 'Báo cáo các sự kiện đã duyệt của đối tác', security: [{ BearerAuth: [] }],
  description: 'Không truyền eventId để tổng hợp tất cả sự kiện của tổ chức có hồ sơ tham gia hoặc đề xuất đã duyệt, bao gồm sự kiện đã kết thúc. Loại sự kiện nháp, đã xóa và chưa duyệt. availableEvents chứa id và title cho bộ lọc sự kiện. Chỉ được chọn eventId thuộc danh sách này.',
  parameters: [{ in: 'query', name: 'eventId', schema: { type: 'string', format: 'uuid' } }],
  responses: { 200: { description: 'Report totals and availableEvents.' }, 403: { description: 'Event is unapproved or outside the organization scope.' } },
} };

eventRegistrationPaths['/partner/notifications'] = { get: {
  tags: ['Đối tác - Sự kiện'], summary: 'Thông báo của tài khoản đối tác', security: [{ BearerAuth: [] }],
  description: 'Chỉ trả thông báo của tài khoản hiện tại, mới nhất trước. Thông báo xét duyệt gồm title, message (tên hồ sơ, kết quả và ghi chú), kind và link tới đúng hồ sơ. Duyệt, từ chối và yêu cầu bổ sung sự kiện/đề xuất gửi tới thành viên tổ chức nộp hồ sơ trong cùng giao dịch xử lý.',
  responses: { 200: { description: 'Notifications for the authenticated user only.' } },
} };

eventRegistrationPaths['/admin/activity-proposals/{id}/approve'] = { post: {
  tags: ['Quản trị viên - Sự kiện'], summary: 'Duyệt và tự công bố hoạt động từ đề xuất', security: [{ BearerAuth: [] }],
  description: 'Trong cùng giao dịch: tạo hoặc tái sử dụng hoạt động của đề xuất, công bố hoạt động với lịch/địa điểm của đề xuất và ảnh sự kiện, lưu publishedActivityId và gửi thông báo. Không cần gọi create-activity sau khi duyệt. Đăng ký sự kiện độc lập đồng thời công bố sự kiện và ghi nhận đối tác tổ chức tham gia. Đề xuất đã xử lý trả 409.',
  parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
  requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { note: { type: 'string' } } } } } },
  responses: { 200: { description: 'Approved proposal including publishedActivityId and review.' }, 409: { description: 'Already processed or invalid proposal status.' }, 404: { description: 'Proposal not found.' } },
} };
