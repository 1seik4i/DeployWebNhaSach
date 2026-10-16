import swaggerUi from 'swagger-ui-express';
import { heritageFeedbackPaths, heritageFeedbackSchemas } from './heritage-feedback.js';
import { completionPaths } from './completion.js';

const apiResponse = { type: 'object', properties: { success: { type: 'boolean' }, data: {} } };
const errorResponse = { type: 'object', properties: { success: { type: 'boolean', example: false }, error: { type: 'object' } } };
const bearer = [{ BearerAuth: [] }];
const jsonBody = properties => ({ required: true, content: { 'application/json': { schema: { type: 'object', properties } } } });
const success = { 200: { description: 'Thành công', content: { 'application/json': { schema: apiResponse } } }, 401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } }, 422: { description: 'Dữ liệu không hợp lệ', content: { 'application/json': { schema: errorResponse } } } };
const entityId = [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }];

const facilityPaths = (tag, name, properties) => ({
  get: { tags: Array.isArray(tag) ? tag : [tag], summary: `Danh sách ${name}`, security: bearer, parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'campus', in: 'query', schema: { type: 'string' } }], responses: success },
  post: { tags: Array.isArray(tag) ? tag : [tag], summary: `Thêm ${name}`, security: bearer, requestBody: jsonBody(properties), responses: { ...success, 201: { description: 'Đã tạo' } } },
});
const facilityItem = (tag, name, properties) => ({
  get: { tags: Array.isArray(tag) ? tag : [tag], summary: `Chi tiết ${name}`, security: bearer, parameters: entityId, responses: success },
  put: { tags: Array.isArray(tag) ? tag : [tag], summary: `Sửa ${name}`, security: bearer, parameters: entityId, requestBody: jsonBody(properties), responses: success },
  delete: { tags: Array.isArray(tag) ? tag : [tag], summary: `Xóa mềm ${name}`, security: bearer, parameters: entityId, responses: success },
});

export const swaggerDocument = {
  openapi: '3.0.3',
  info: { title: 'Đường Sách TP.HCM API', version: '1.0.0', description: 'Các API hiện được mở: phiên đăng nhập, dữ liệu landing page, bản đồ và CRUD cơ sở vật chất.' },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Quản trị viên - Di sản', description: 'CRUD di sản và QR theo slug cố định.' },
    { name: 'Quản trị viên - Phản hồi', description: 'Quản lý phản hồi riêng tư.' },
    { name: 'Hệ thống', description: 'Kiểm tra trạng thái dịch vụ.' },
    { name: 'Xác thực & phiên', description: 'Dùng cho tất cả vai trò đăng nhập và duy trì phiên.' },
    { name: 'Công khai - Landing page', description: 'Dữ liệu hiển thị công khai trên landing page.' },
    { name: 'Công khai - Bản đồ', description: 'Dữ liệu điểm tương tác trên bản đồ.' },
    { name: 'Độc giả - Hồ sơ cá nhân', description: 'Thông tin cá nhân của role participant.' },
    { name: 'Đối tác - Hồ sơ cá nhân', description: 'Thông tin cá nhân của role partner.' },
    { name: 'Ban quản lý - Hồ sơ cá nhân', description: 'Thông tin cá nhân của role organizer.' },
    { name: 'Ban quản lý - CRUD địa điểm tổ chức', description: 'Quản lý địa điểm tổ chức.' },
    { name: 'Ban quản lý - CRUD thiết bị', description: 'Quản lý danh mục thiết bị.' },
    { name: 'Quản trị viên - Hồ sơ cá nhân', description: 'Thông tin cá nhân của Admin.' },
    { name: 'Quản trị viên - Vai trò & phân quyền', description: 'Quản lý vai trò và quyền truy cập.' },
    { name: 'Quản trị viên - CRUD gian hàng', description: 'Quản lý danh mục gian hàng.' },
    { name: 'Quản trị viên - CRUD địa điểm tổ chức', description: 'Quản lý địa điểm tổ chức.' },
    { name: 'Quản trị viên - CRUD thiết bị', description: 'Quản lý danh mục thiết bị.' },
    { name: 'Quản trị & BQL - Sự kiện', description: 'Quản lý sự kiện dành cho Admin và Ban quản lý.' },
    { name: 'Quản trị & BQL - Đề xuất', description: 'Thẩm định và phê duyệt đề xuất hoạt động từ đối tác.' },
  ],
  components: { schemas: heritageFeedbackSchemas, securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    ...heritageFeedbackPaths,
    '/health': { get: { tags: ['Hệ thống'], summary: 'Kiểm tra trạng thái API', responses: success } },
    '/auth/login': { post: { tags: ['Xác thực & phiên'], summary: 'Đăng nhập', requestBody: jsonBody({ email: { type: 'string' }, password: { type: 'string', format: 'password' } }), responses: success } },
    '/auth/refresh': { post: { tags: ['Xác thực & phiên'], summary: 'Làm mới phiên', requestBody: jsonBody({ refreshToken: { type: 'string' } }), responses: success } },
    '/auth/logout': { post: { tags: ['Xác thực & phiên'], summary: 'Đăng xuất', responses: success } },
    '/auth/me': { get: { tags: ['Xác thực & phiên'], summary: 'Thông tin phiên', security: bearer, responses: success } },
    '/auth/demo-accounts': { get: { tags: ['Xác thực & phiên'], summary: 'Tài khoản đăng nhập nhanh', responses: success } },
    '/auth/demo-login': { post: { tags: ['Xác thực & phiên'], summary: 'Đăng nhập nhanh theo vai trò', requestBody: jsonBody({ role: { type: 'string', enum: ['partner', 'admin'] } }), responses: success } },
    '/partner/profile': { get: { tags: ['Đối tác - Hồ sơ cá nhân'], summary: 'Hồ sơ đối tác', security: bearer, responses: success }, patch: { tags: ['Đối tác - Hồ sơ cá nhân'], summary: 'Cập nhật hồ sơ đối tác', security: bearer, requestBody: jsonBody({ fullName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }), responses: success } },
    '/admin/profile': { get: { tags: ['Quản trị viên - Hồ sơ cá nhân'], summary: 'Hồ sơ quản trị viên', security: bearer, responses: success }, patch: { tags: ['Quản trị viên - Hồ sơ cá nhân'], summary: 'Cập nhật hồ sơ quản trị viên', security: bearer, requestBody: jsonBody({ fullName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }), responses: success } },
    '/admin/roles': { get: { tags: ['Quản trị viên - Vai trò & phân quyền'], summary: 'Danh sách vai trò và quyền được gán', security: bearer, responses: success } },
    '/admin/permissions': { get: { tags: ['Quản trị viên - Vai trò & phân quyền'], summary: 'Danh sách quyền', security: bearer, responses: success } },
    '/admin/roles/{id}/permissions': { put: { tags: ['Quản trị viên - Vai trò & phân quyền'], summary: 'Cập nhật quyền của vai trò', security: bearer, parameters: entityId, requestBody: jsonBody({ permissionCodes: { type: 'array', items: { type: 'string' } } }), responses: success } },
    '/public/booths': { get: { tags: ['Công khai - Landing page'], summary: 'Gian hàng công khai', responses: success } },
    '/public/events': { get: { tags: ['Công khai - Landing page'], summary: 'Sự kiện công khai', responses: success } },
    '/public/activities': { get: { tags: ['Công khai - Landing page'], summary: 'Hoạt động công khai', responses: success } },
    '/public/heritages': { get: { tags: ['Công khai - Landing page'], summary: 'Di sản công khai', responses: success } },
    '/public/heritages/{slug}': { get: { tags: ['Công khai - Landing page'], summary: 'Chi tiết di sản', description: 'Chỉ di sản published, chưa xóa. Không trả feedback, thông tin liên hệ hoặc ghi chú nội bộ của phản hồi. Chấp nhận slug hoặc UUID.', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { ...success, 404: { description: 'Di sản không tồn tại, chưa công bố hoặc đã xóa' } } } },
    '/public/map-hotspots': { get: { tags: ['Công khai - Bản đồ'], summary: 'Điểm bản đồ từ gian hàng có tọa độ', responses: success } },
    '/admin/booths': facilityPaths('Quản trị viên - CRUD gian hàng', 'gian hàng', { name: { type: 'string' }, campus: { type: 'string' } }),
    '/admin/booths/{id}': facilityItem('Quản trị viên - CRUD gian hàng', 'gian hàng', { name: { type: 'string' }, campus: { type: 'string' } }),
    '/admin/venues': facilityPaths(['Ban quản lý - CRUD địa điểm tổ chức', 'Quản trị viên - CRUD địa điểm tổ chức'], 'địa điểm tổ chức', { name: { type: 'string' }, campus: { type: 'string' }, capacity: { type: 'integer', minimum: 1 } }),
    '/admin/venues/{id}': facilityItem(['Ban quản lý - CRUD địa điểm tổ chức', 'Quản trị viên - CRUD địa điểm tổ chức'], 'địa điểm tổ chức', { name: { type: 'string' }, campus: { type: 'string' }, capacity: { type: 'integer', minimum: 1 } }),
    '/admin/assets': facilityPaths(['Ban quản lý - CRUD thiết bị', 'Quản trị viên - CRUD thiết bị'], 'thiết bị', { name: { type: 'string' }, totalQuantity: { type: 'integer', minimum: 0 } }),
    '/admin/assets/{id}': facilityItem(['Ban quản lý - CRUD thiết bị', 'Quản trị viên - CRUD thiết bị'], 'thiết bị', { name: { type: 'string' }, totalQuantity: { type: 'integer', minimum: 0 } }),
    '/admin/events': {
      get: {
        tags: ['Quản trị & BQL - Sự kiện'],
        summary: 'Danh sách sự kiện',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'priorityLevel', in: 'query', schema: { type: 'string', enum: ['regular', 'medium', 'high'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'] } },
        ],
        responses: success,
      },
      post: {
        tags: ['Quản trị & BQL - Sự kiện'],
        summary: 'Tạo sự kiện mới',
        security: bearer,
        requestBody: jsonBody({
          title: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          venueId: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          priorityLevel: { type: 'string', enum: ['regular', 'medium', 'high'], default: 'regular' },
        }),
        responses: { ...success, 201: { description: 'Đã tạo sự kiện thành công' } },
      },
    },
    '/admin/events/{id}': {
      get: {
        tags: ['Quản trị & BQL - Sự kiện'],
        summary: 'Chi tiết sự kiện',
        security: bearer,
        parameters: entityId,
        responses: success,
      },
      put: {
        tags: ['Quản trị & BQL - Sự kiện'],
        summary: 'Cập nhật thông tin sự kiện',
        security: bearer,
        parameters: entityId,
        requestBody: jsonBody({
          title: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          venueId: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          priorityLevel: { type: 'string', enum: ['regular', 'medium', 'high'] },
        }),
        responses: success,
      },
      delete: {
        tags: ['Quản trị & BQL - Sự kiện'],
        summary: 'Xóa mềm sự kiện',
        security: bearer,
        parameters: entityId,
        responses: success,
      },
    },
    '/admin/proposals': {
      get: {
        tags: ['Quản trị & BQL - Đề xuất'],
        summary: 'Danh sách đề xuất hoạt động',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'need_revision', 'rejected', 'withdrawn'] } },
          { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: success,
      },
    },
    '/admin/proposals/{id}': {
      get: {
        tags: ['Quản trị & BQL - Đề xuất'],
        summary: 'Chi tiết đề xuất hoạt động',
        security: bearer,
        parameters: entityId,
        responses: success,
      },
    },
    '/admin/proposals/{id}/approve': {
      post: {
        tags: ['Quản trị & BQL - Đề xuất'],
        summary: 'Phê duyệt đề xuất hoạt động',
        security: bearer,
        parameters: entityId,
        requestBody: jsonBody({
          note: { type: 'string', description: 'Ghi chú phê duyệt (tùy chọn)' },
        }),
        responses: success,
      },
    },
    '/admin/proposals/{id}/reject': {
      post: {
        tags: ['Quản trị & BQL - Đề xuất'],
        summary: 'Từ chối đề xuất hoạt động',
        security: bearer,
        parameters: entityId,
        requestBody: jsonBody({
          note: { type: 'string', description: 'Lý do từ chối (bắt buộc)' },
        }),
        responses: success,
      },
    },
  },
};

Object.assign(swaggerDocument.paths, completionPaths);
swaggerDocument.info.version = '3.0.0';
swaggerDocument.info.description = 'API thư viện số, kiểm duyệt, phân công gian hàng, tài khoản, nội dung và vận hành sự kiện.';

export const swaggerMiddleware = [
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { customSiteTitle: 'Đường Sách TP.HCM - API' }),
];
