# Email editing permissions

`PATCH /api/admin/users/{id}` accepts a valid email (maximum 200 characters)
and requires admin authorization. Existing uniqueness constraints apply.

`PATCH /api/partner/profile` rejects any body containing `email` with HTTP 403
and the message “Chỉ Admin được thay đổi email của đối tác.” Other supported
profile fields can still be changed. Partner clients must omit email when saving.
The partner profile view displays email as read-only.
It reads the admin-managed user account email, including after other profile
edits, so an older organization contact email cannot overwrite it.

Admin account contact cells truncate long email/phone values visually with an
ellipsis. The full value remains available in the title and edit form.
