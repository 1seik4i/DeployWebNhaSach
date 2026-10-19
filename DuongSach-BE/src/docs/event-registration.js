const body = {
  type: 'object', additionalProperties: false,
  required: ['title', 'kind', 'locationId', 'startAt', 'endAt'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    kind: { type: 'string', enum: ['talkshow', 'workshop', 'launch', 'exhibition', 'minigame', 'signing'] },
    locationId: { type: 'string', format: 'uuid' },
    startAt: { type: 'string', format: 'date-time' }, endAt: { type: 'string', format: 'date-time' },
    capacity: { type: 'integer', minimum: 0, default: 50 },
    description: { type: 'string', maxLength: 20000 }, speaker: { type: 'string', maxLength: 160 },
    imageUrl: { type: 'string', description: 'URL or base64 image, up to 20 MiB before encoding.' },
    isPublished: { type: 'boolean', description: 'Admin only: publish immediately unless false; partners always wait for review.' },
    devices: { type: 'array', maxItems: 100, items: { type: 'object', required: ['name', 'quantity'], properties: { name: { type: 'string' }, quantity: { type: 'integer', minimum: 0 } } } },
  },
};
export const eventRegistrationPaths = Object.fromEntries(['admin', 'partner'].map(role => [`/${role}/event-registrations`, { post: {
  tags: [role === 'admin' ? 'Quản trị viên - Sự kiện' : 'Đối tác - Sự kiện'],
  summary: 'Đăng ký sự kiện độc lập', security: [{ BearerAuth: [] }],
  description: 'Tạo sự kiện mới với ngày giờ riêng. Không nhận eventId, không kiểm tra lịch sự kiện khác, cho phép trùng lịch và ngày quá khứ. Kết thúc phải sau bắt đầu. Đối tác không cần hồ sơ tham gia sự kiện khác; đăng ký chờ Admin duyệt.',
  requestBody: { required: true, content: { 'application/json': { schema: body } } },
  responses: {
    200: { description: role === 'admin' ? 'Created independent event: data {id,status}.' : 'Pending registration: data {id,registrationId,status:"pending"}.' },
    401: { description: 'Authentication required.' }, 403: { description: 'Role or permission denied.' }, 422: { description: 'Invalid fields, missing location or end before start.' },
  },
} }]));

eventRegistrationPaths['/partner/event-applications'] = { post: {
  tags: ['Đối tác - Sự kiện'], summary: 'Đăng ký tham gia sự kiện đang hoặc sắp diễn ra', security: [{ BearerAuth: [] }],
  description: 'Không có thời gian mở/đóng đăng ký. Không xét partnerApplyDeadline. Chấp nhận sự kiện công khai đang diễn ra hoặc sắp diễn ra theo trạng thái lịch Việt Nam; không nhận sự kiện kết thúc, hủy, nháp hoặc đã xóa. Hồ sơ vẫn được Admin xét duyệt.',
  requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false, required: ['eventId'], properties: { eventId: { type: 'string', format: 'uuid' } } } } } },
  responses: { 200: { description: 'Participation application submitted.' }, 409: { description: 'Event does not accept participation or duplicate application.' }, 401: { description: 'Authentication required.' }, 403: { description: 'Partner permission required.' } },
} };
