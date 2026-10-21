const sessionHeader = { name: 'X-Guest-Session', in: 'header', required: false, description: 'UUID for the current browser tab session. Reuse on status and submission requests. Older same-origin clients may use the HttpOnly browser-session cookie.', schema: { type: 'string', format: 'uuid' } };
const quota = { type: 'object', properties: { limit: { type: 'integer', enum: [3] }, used: { type: 'integer', minimum: 0, maximum: 3 }, remaining: { type: 'integer', minimum: 0, maximum: 3 } } };
export const guestSessionHeader = sessionHeader;
export const guestSubmissionPaths = {
  '/public/submission-quota': { get: {
    tags: ['Công khai - Landing page'], summary: 'Lượt gửi còn lại của phiên khách', parameters: [sessionHeader],
    responses: { 200: { description: 'Independent feedback and event proposal quotas.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { feedback: quota, eventProposal: quota } } } } } } } },
  } },
  '/public/event-suggestions': { post: {
    tags: ['Công khai - Landing page'], summary: 'Gửi đề xuất sự kiện', parameters: [sessionHeader],
    description: 'At most 3 successful submissions per browser session, independent of feedback. Validation and database errors do not consume quota. The database transaction atomically increments the quota and saves the submission. Response data includes submissionQuota {limit,used,remaining}.',
    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false, required: ['fullName', 'phone', 'content'], properties: { fullName: { type: 'string', minLength: 2, maxLength: 160 }, phone: { type: 'string' }, content: { type: 'string', minLength: 10, maxLength: 10000 } } } } } },
    responses: { 200: { description: 'Saved suggestion and submissionQuota.' }, 422: { description: 'Invalid session or form data; does not consume quota.' }, 429: { description: 'GUEST_SUBMISSION_LIMIT when the session has already submitted 3 proposals; RATE_LIMITED for the existing short-term request limiter.' } },
  } },
};
