# Independent event registration

The shared form submits to `POST /api/admin/event-registrations` or
`POST /api/partner/event-registrations`, using the authenticated role. Body:
`title`, `kind`, `locationId`, `startAt`, `endAt`, optional `capacity` (default 50),
`description`, `speaker`, `imageUrl`, `isPublished`, and `devices[{name,quantity}]`.
There is no `eventId` input; unknown fields are rejected.

Each successful registration creates a new Event with exactly the submitted
dates and selected location. No existing event is selected, queried for its date
range, or used as a parent. Overlapping events at the same location are allowed.
Past dates are allowed. Only valid dates, end after start, and an existing location
are required. Images support up to 20 MiB with a 30 MiB JSON body limit.

Admin registration creates an independent event and its program, published by
default or draft when isPublished=false. Response: `{id,status}`.

Partner registration needs an organization, but no prior event application or
approval. It creates a private draft Event and a pending registration in the
existing review queue. Response: `{id,registrationId,status:"pending"}`. The internal
program/review rows reference only this new event, never another event. Admin
approval publishes this event and its program atomically. Until approval it is
excluded by the public event visibility filter. Editing a registration changes
only its own event dates/location and retains end-after-start validation.

Authentication and role/partner permission checks remain enforced. Failures
return standard API errors (422 for invalid fields/range, 403 for unauthorized
roles). Creation and approval are database transactions; no migration is needed.
Legacy activity APIs remain available for older records and are no longer used by
the shared event-registration form.
