# BerryBox

BerryBox is a vanilla JavaScript photo-gallery frontend. Open `index.html` through a local web server. It starts in safe demo mode with browser storage, so every UI action works without cloud credentials.

## Connect the AWS sandbox

1. In `aws-config.js`, set `demoMode` to `false` and add region, Cognito pool/client IDs, and API Gateway URL.
2. Implement the routes below with Cognito authorisation. The app sends an access token as `Authorization: Bearer <token>`.
3. Make `POST /uploads` return a presigned S3 PUT URL and key. Configure S3 CORS for your website origin.
4. Trigger Lambda from S3 ObjectCreated. Lambda resizes the original and saves metadata in RDS. `GET /photos` returns metadata and resized image URLs.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/photos?favorite=&search=&category=` | photo records (`id,name,url,createdAt,size,favorite`) |
| POST | `/uploads` | input `{name,type,size}` → `{uploadUrl,key}` |
| POST | `/photos` | record `{key,name,size}` after S3 upload |
| PATCH / DELETE | `/photos/:id` | favorite/update or delete photo |
| GET / PATCH | `/profile` | profile and storage data |

Use Cognito Hosted UI or your preferred Cognito JavaScript client in `AwsService` in `app.js`; provider-specific code is kept there.
