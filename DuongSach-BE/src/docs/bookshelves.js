const security = [{ BearerAuth: [] }];
const properties = {
  name: { type: 'string', minLength: 1, maxLength: 200 },
  ranked: { type: 'boolean', description: 'Display rank numbers in shelf order when true; plain book collection when false.' },
  bookIds: { type: 'array', maxItems: 5000, uniqueItems: true, items: { type: 'string', format: 'uuid' }, description: 'Ordered IDs of active books.' },
};
const requestBody = required => ({ required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false, required, properties } } } });
const read = { summary: 'List bookshelves', description: 'Returns shelves with id, name, ranked and books in configured order. Public shelves expose only active books with an active category, excluding uncategorized books; the same rule applies to public catalogue, search, rankings, details and availability. Admin shelves retain active uncategorized books for classification. Existing bestseller and weekly hot shelves are preserved until edited. All books is a separate public books view.', responses: { 200: { description: 'Bookshelves in display order.' } } };
export const bookshelfPaths = {
  '/public/bookshelves': { get: { ...read, tags: ['Thư viện số'] } },
  '/admin/bookshelves': {
    get: { ...read, security, tags: ['Thư viện số'] },
    post: { summary: 'Create bookshelf', security, tags: ['Thư viện số'], requestBody: requestBody(['name', 'ranked', 'bookIds']), responses: { 200: { description: 'Shelf created.' }, 409: { description: 'Duplicate shelf name.' }, 422: { description: 'Invalid fields, duplicate IDs or inactive books.' } } },
  },
  '/admin/bookshelves/{id}': { delete: {
    summary: 'Delete bookshelf', security, tags: ['Thư viện số'],
    description: 'Removes only the bookshelf configuration. Books and inventory are preserved. Removing the last shelf leaves an empty shelf list; defaults are not recreated.',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Shelf deleted.' }, 404: { description: 'Shelf not found.' } },
  }, patch: {
    summary: 'Edit bookshelf or reorder its books', security, tags: ['Thư viện số'],
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], requestBody: requestBody([]),
    responses: { 200: { description: 'Shelf updated. Supplied bookIds replace the selection and order. Omitted bookIds preserve the current selection.' }, 404: { description: 'Shelf not found.' }, 409: { description: 'Duplicate shelf name.' }, 422: { description: 'Invalid fields or inactive books.' } },
  } },
};
