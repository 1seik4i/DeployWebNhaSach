# Event registration images

Admin `POST/PATCH /api/admin/activities` and partner
`POST/PATCH /api/partner/activity-proposals` accept an optional `imageUrl`:
an existing image URL or a base64 data URL from the registration form.
Images may be up to 20 MiB before base64 encoding. The string limit includes
encoding overhead, and these routes allow 30 MiB JSON requests. Oversized
images fail validation with a Vietnamese field error rather than a 2,000-character
URL error. The browser checks image type and size before reading the file.

Partner image data is stored in the existing proposal metadata and returned as
`imageUrl`. Approval/review notes preserve that metadata. Creating an activity
from an approved proposal copies its image; subsequent proposal edits update
the linked activity image. No database migration is required.
