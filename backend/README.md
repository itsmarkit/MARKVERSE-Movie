# MARK Admin Backend — Express + MongoDB

Backend contract for `contentStore.js`.

## 1. Requirements

- Node.js 20+
- MongoDB 6+ (local or Atlas)

## 2. Install

```bash
npm install
cp .env.example .env
```

Set `MONGO_URI` in `.env`.

## 3. Start MongoDB

Local MongoDB example:

```bash
sudo systemctl start mongod
```

Then:

```bash
npm run seed
npm run dev
```

API health:

```text
GET http://localhost:5000/api/health
```

## 4. Frontend

Set:

```env
VITE_API_BASE=http://localhost:5000/api
```

If the frontend is served by the same origin/reverse proxy, use:

```env
VITE_API_BASE=/api
```

## 5. Uploads

Files are returned as URLs such as:

```text
/uploads/images/123-file.webp
/uploads/videos/123-file.mp4
```

The frontend upload function can consume the returned `url` directly.

## Important security note

This first version intentionally keeps the `/admin/*` contract directly accessible because the supplied frontend does not send an authentication token or session cookie. Before deploying publicly, add real admin authentication and authorization. Do not expose this API to the internet unchanged.
