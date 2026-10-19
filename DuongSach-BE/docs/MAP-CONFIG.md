# Map save contract

Image-only changes omit unchanged marker coordinates. The API resolves submitted
marker references using four batch reads, skips unchanged positions, and saves
the image and any moved markers in the same transaction. This avoids repeating
up to four reference lookups for every marker on a remote database.

`PUT /api/admin/map-config` requires admin authentication and accepts optional
`imageUrl` and `points: [{ id, x, y }]` in one request. Image and coordinates commit
in the existing database transaction. The browser previews a chosen image locally;
no write occurs until Save Map. A failed save retains the draft for retry. Reloading
or leaving before save discards the new image.

Map images may be up to 50 MiB (50 × 1024 × 1024 bytes). The imageUrl string limit
allows its base64 encoding plus the data URL prefix; this endpoint has a 75 MiB
JSON body limit. Other endpoints retain their existing limits. Existing
URL strings remain accepted. The browser rejects non-image files and files above
50 MiB before reading. Public map subscribers receive updates only after save.
