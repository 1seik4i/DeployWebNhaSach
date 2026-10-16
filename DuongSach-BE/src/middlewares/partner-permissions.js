import { authenticate } from "./auth.js";
import { requirePermission } from "./rbac.js";
const permissions = {
  profile: ["account.profile", "account.profile"],
  password: ["account.password", "account.password"],
  "event-applications": ["events.view", "events.apply"],
  booths: ["booths.view", "booths.register"],
  "booth-requests": ["booths.view", "booths.register"],
  "event-locations": ["events.view", "events.view"],
  assets: ["booths.view", "booths.view"],
  schedule: ["events.view", "events.view"],
  "activity-proposals": ["activities.propose", "activities.propose"],
  attendance: ["activities.checkin", "activities.checkin"],
  reports: ["reports.partner", "reports.partner"],
  notifications: ["account.profile", "account.profile"],
};
export function partnerPermissions(req, res, next) {
  const permission =
    permissions[req.path.split("/")[1]]?.[req.method === "GET" ? 0 : 1];
  if (!permission) return next();
  authenticate(req, res, (error) =>
    error ? next(error) : requirePermission(permission)(req, res, next),
  );
}
