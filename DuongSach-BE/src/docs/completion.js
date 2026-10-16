import library from "../modules/library/library.routes.js";
import management from "../modules/account/management.routes.js";
import content from "../modules/public/content.routes.js";
import operations from "../modules/event/operations.routes.js";
import partner from "../modules/booth/partner.routes.js";
import reports from "../modules/event/reports.routes.js";
import map from "../modules/public/map.routes.js";

// Enumerate the registered routers so documentation cannot drift from method/path.
export const completionPaths = {};
for (const router of [
  library,
  management,
  content,
  operations,
  partner,
  reports,
  map,
]) {
  for (const layer of router.stack) {
    if (!layer.route) continue;
    const path = layer.route.path.replace(/:([A-Za-z]+)/g, "{$1}");
    completionPaths[path] ||= {};
    for (const method of Object.keys(layer.route.methods)) {
      const publicRoute =
        path.startsWith("/public/") ||
        ["/auth/forgot-password", "/auth/reset-password"].includes(path);
      completionPaths[path][method] = {
        tags: [
          path.split("/")[1] === "public"
            ? "Công khai - API hoàn thiện"
            : "Quản trị & gian hàng - API hoàn thiện",
        ],
        summary: `${method.toUpperCase()} ${path}`,
        description:
          "Hợp đồng chi tiết và quy tắc nghiệp vụ: docs/API-COMPLETION.md. Dữ liệu trả về nằm trong data; lỗi trả về trong error.",
        security: publicRoute ? [] : [{ BearerAuth: [] }],
        parameters: [...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
          name: m[1],
          in: "path",
          required: true,
          schema: { type: "string" },
        })),
        ...(["post", "patch", "put"].includes(method)
          ? {
              requestBody: {
                content: {
                  "application/json": {
                    schema:
                      path === "/partner/book-sales"
                        ? {
                            type: "array",
                            minItems: 1,
                            maxItems: 100,
                            items: {
                              type: "object",
                              required: ["bookId", "quantity", "soldDate"],
                              properties: {
                                bookId: { type: "string", format: "uuid" },
                                quantity: { type: "integer", minimum: 0 },
                                soldDate: { type: "string", format: "date" },
                              },
                            },
                          }
                        : { type: "object" },
                  },
                },
              },
            }
          : {}),
        responses: {
          200: { description: "Thành công" },
          401: { description: "Chưa xác thực" },
          403: { description: "Không có quyền" },
          404: { description: "Không tìm thấy" },
          409: { description: "Xung đột phiên bản hoặc trạng thái" },
          422: { description: "Dữ liệu không hợp lệ" },
        },
      };
    }
  }
}
