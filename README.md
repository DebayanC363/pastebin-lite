# Pastebin Lite

A minimal Pastebin-like service built using Node.js and Express.

---

## How to run the app locally

### Requirements
- Node.js (v18 or later)

### Steps
```bash
npm install
node index.js
```

The server will start on:

```
http://localhost:3000
```

---

## API Endpoints

### Health Check
```http
GET /api/healthz
```

Response:
```json
{ "ok": true }
```

---

### Create a Paste
```http
POST /api/pastes
```

Request body:
```json
{
  "content": "hello world",
  "ttl_seconds": 10,
  "max_views": 2
}
```

Response:
```json
{
  "id": "uuid",
  "url": "/p/uuid"
}
```

---

### Get a Paste (JSON)
```http
GET /api/pastes/:id
```

Returns the paste content as JSON.  
Returns **404** if the paste is expired or the view limit is exceeded.

---

### Get a Paste (HTML View)
```http
GET /p/:id
```

Displays the paste content in the browser.

---

## Persistence Layer

- Uses an in-memory JavaScript `Map`
- No database is used
- All data is lost when the server restarts

This is acceptable as per the assignment instructions.

---

## Important Design Decisions

- In-memory storage for simplicity and compliance with requirements
- Optional TTL-based expiration
- Optional maximum view count
- Deterministic testing via `TEST_MODE=1` and `x-test-now-ms` header
- No background jobs or external services
