# Map save contract

`PUT /api/admin/map-config` requires admin authentication and accepts optional
`imageUrl` and `points: [{ id, x, y }]` in one request. Image and coordinates commit
in the existing database transaction. The browser previews a chosen image locally;
no write occurs until Save Map. A failed save retains the draft for retry. Reloading
or leaving before save discards the new image.

Map images may be up to 20 MiB (20 × 1024 × 1024 bytes). The imageUrl string limit
allows its base64 encoding plus the data URL prefix; this endpoint has a 30 MiB
JSON body limit. Other endpoints retain their existing 10 MiB JSON limit. Existing
URL strings remain accepted. The browser rejects non-image files and files above
20 MiB before reading. Public map subscribers receive updates only after save.
