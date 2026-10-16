const ref = name => ({ $ref: `#/components/schemas/${name}` });
const text = { type: 'string', nullable: true };
const uuid = { type: 'string', format: 'uuid' };
const date = { type: 'string', format: 'date-time' };
const heritageStatus = { type: 'string', enum: ['published', 'draft', 'hidden'] };
const feedbackStatus = { type: 'string', enum: ['new', 'in_progress', 'responded', 'closed'] };
const content = {
  code: { ...text, maxLength: 20 }, name: { type: 'string', minLength: 1, maxLength: 200 }, nameEn: { ...text, maxLength: 200 },
  ...Object.fromEntries(['province', 'provinceEn', 'category', 'categoryEn', 'period', 'periodEn', 'mapAreaName'].map(key => [key, { ...text, maxLength: 120 }])),
  ...Object.fromEntries(['address', 'addressEn', 'briefDesc', 'briefDescEn', 'story', 'storyEn', 'referenceSource'].map(key => [key, { ...text, maxLength: 50000 }])),
  ...Object.fromEntries(['imageUrl', 'imageAlt', 'imageSource', 'imageLicense'].map(key => [key, { ...text, maxLength: 5000 }])),
  highlights: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 5000 } },
  highlightsEn: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 5000 } },
  status: heritageStatus,
  mapX: { type: 'number', nullable: true, minimum: -9999.99, maximum: 9999.99 },
  mapY: { type: 'number', nullable: true, minimum: -9999.99, maximum: 9999.99 },
};
const slug = { type: 'string', maxLength: 200, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: 'Trimmed and lowercased on creation. Immutable afterwards, including after soft deletion.' };
export const heritageFeedbackSchemas = {
  HeritageCreate: { type: 'object', additionalProperties: false, required: ['name', 'slug'], properties: { ...content, slug } },
  HeritageUpdate: { type: 'object', additionalProperties: false, minProperties: 1, properties: { ...content, slug: { type: 'string', description: 'Optional; must exactly match the existing slug. A change returns 400 SLUG_IMMUTABLE.' } } },
  Heritage: { type: 'object', properties: {
    ...content, id: uuid, slug,
    mapX: { type: 'string', nullable: true, description: 'Prisma Decimal serialized as a string.' },
    mapY: { type: 'string', nullable: true, description: 'Prisma Decimal serialized as a string.' },
    qrStatus: { type: 'string', enum: ['active', 'generating', 'inactive'] },
    viewCount: { type: 'integer' }, qrScanCount: { type: 'integer' },
    isDeleted: { type: 'boolean' }, deletedAt: { ...date, nullable: true }, deletedBy: { ...uuid, nullable: true }, createdAt: date, updatedAt: date,
  } },
  HeritageQr: { type: 'object', properties: {
    id: uuid, heritageId: uuid, createdAt: date,
    qrData: { type: 'string', format: 'uri', description: 'Encoded public URL; not an image or base64.' },
    publicUrl: { type: 'string', format: 'uri', example: 'http://localhost:5173/heritage/example-slug' },
  } },
  Feedback: { type: 'object', properties: {
    id: uuid, heritageId: { ...uuid, nullable: true }, boothId: { ...uuid, nullable: true },
    targetScope: { type: 'string', enum: ['entire', 'heritage', 'booth', 'facility'] }, targetName: text,
    rating: { type: 'integer', minimum: 1, maximum: 5 }, comments: text, contactEmail: text,
    source: { type: 'string', enum: ['qr_general', 'qr_heritage', 'web_landing'] },
    status: feedbackStatus, internalNote: text, assignedTo: { ...uuid, nullable: true }, createdAt: date, updatedAt: date,
    heritage: { type: 'object', nullable: true, properties: { id: uuid, name: { type: 'string' }, slug: { type: 'string' } } },
  } },
  FeedbackStatusUpdate: { type: 'object', additionalProperties: false, required: ['status'], properties: { status: feedbackStatus, internalNote: { ...text, maxLength: 50000 } } },
  HeritageFeedbackError: { type: 'object', properties: { success: { type: 'boolean', example: false }, error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: { type: 'array', items: { type: 'object' } } } } } },
  HeritageFeedbackPagination: { type: 'object', properties: Object.fromEntries(['page', 'limit', 'total', 'totalPages'].map(key => [key, { type: 'integer' }])) },
};
const json = schema => ({ 'application/json': { schema } });
const errors = Object.fromEntries(Object.entries({ 400: 'Invalid input / SLUG_IMMUTABLE', 401: 'Unauthenticated', 403: 'Admin role required', 404: 'Resource missing or deleted', 409: 'Duplicate slug or code', 500: 'Unexpected server error (no database diagnostics exposed)' }).map(([status, description]) => [status, { description, content: json(ref('HeritageFeedbackError')) }]));
const responses = (schema, list = false, code = 200) => ({
  ...errors,
  [code]: { description: 'Success', content: json({ type: 'object', properties: {
    success: { type: 'boolean', example: true }, data: list ? { type: 'array', items: schema } : schema,
    warnings: { type: 'array', items: { type: 'string' } },
    ...(list ? { meta: ref('HeritageFeedbackPagination'), pagination: ref('HeritageFeedbackPagination') } : {}),
  } }) },
});
const query = (name, schema) => ({ name, in: 'query', schema });
const paging = [query('page', { type: 'integer', default: 1, minimum: 1, maximum: 1000000 }), query('limit', { type: 'integer', default: 20, minimum: 1, maximum: 100 })];
const id = [{ name: 'id', in: 'path', required: true, schema: uuid }];
const body = name => ({ required: true, content: json(ref(name)) });
const heritage = { tags: ['Quản trị viên - Di sản'], security: [{ BearerAuth: [] }] };
const feedback = { tags: ['Quản trị viên - Phản hồi'], security: [{ BearerAuth: [] }] };
export const heritageFeedbackPaths = {
  '/admin/heritages': {
    get: { ...heritage, summary: 'List non-deleted heritage', description: 'Search name/nameEn/slug case-insensitively. Sort updatedAt DESC, id DESC.', parameters: [...paging, query('search', { type: 'string', maxLength: 200 }), query('status', heritageStatus)], responses: responses(ref('Heritage'), true) },
    post: { ...heritage, summary: 'Create heritage', requestBody: body('HeritageCreate'), responses: responses(ref('Heritage'), false, 201) },
  },
  '/admin/heritages/{id}': {
    get: { ...heritage, summary: 'Heritage edit detail', parameters: id, responses: responses(ref('Heritage')) },
    put: { ...heritage, summary: 'Update heritage content', description: 'Only supplied fields change. Slug is immutable; attempts to change it return 400 SLUG_IMMUTABLE.', parameters: id, requestBody: body('HeritageUpdate'), responses: responses(ref('Heritage')) },
    delete: { ...heritage, summary: 'Soft delete heritage', description: 'Sets isDeleted, deletedAt, deletedBy. Retains feedback and reserves the slug.', parameters: id, responses: responses({ type: 'object', properties: { id: uuid, deleted: { type: 'boolean' } } }) },
  },
  '/admin/heritages/{id}/qr': {
    get: { ...heritage, summary: 'Retrieve or generate stable heritage QR data', description: 'Stores PUBLIC_WEB_URL + /heritage/ + slug. Falls back to PUBLIC_SITE_URL for existing deployments. Reuses the existing QR row and normalizes legacy URLs. Concurrent calls do not create duplicates. No image is generated. Keep the public domain stable for printed QR codes.', parameters: id, responses: responses(ref('HeritageQr')) },
  },
  '/admin/feedbacks': {
    get: { ...feedback, summary: 'List feedback', description: 'Filters combine with AND. Ordered createdAt DESC, id DESC.', parameters: [...paging, query('heritageId', uuid), query('rating', { type: 'integer', minimum: 1, maximum: 5 }), query('status', feedbackStatus)], responses: responses(ref('Feedback'), true) },
  },
  '/admin/feedbacks/{id}': {
    get: { ...feedback, summary: 'Feedback detail including private contact and internal note', parameters: id, responses: responses(ref('Feedback')) },
  },
  '/admin/feedbacks/{id}/status': {
    patch: { ...feedback, summary: 'Update feedback status and optional internal note', description: 'All FeedbackStatus values are accepted. Omitting internalNote preserves it; null clears it. Private notes are never included in public Heritage responses.', parameters: id, requestBody: body('FeedbackStatusUpdate'), responses: responses(ref('Feedback')) },
  },
};
