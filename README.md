# Paste Service

A minimal Pastebin-like web service that allows users to create and share text pastes with optional time-based expiration (TTL) and view count limits.

The service provides:
- A JSON API for programmatic access
- An HTML interface for creating and viewing pastes
- Safe rendering of paste content (no script execution)

---

## Features

- Create a paste containing arbitrary text
- Optional time-to-live (TTL) expiration
- Optional maximum view count
- JSON API and HTML views
- Deterministic time handling for testing
- Persistence across requests using Redis

---

## Tech Stack

- Node.js
- Express.js
- Redis (Upstash compatible)
- Plain HTML frontend (served as static files)

---

## Persistence Layer

Redis is used as the persistence layer.

Reasons for choosing Redis:
- Native TTL support for time-based expiration
- Atomic operations for view count tracking
- Works reliably in serverless environments
- Persists data across requests (unlike in-memory storage)

Redis is accessed using a TCP connection via the `ioredis` client.

---
## Installation & Startup

### Prerequisites
- Node.js (v16 or newer)
- Redis instance (local or Upstash)

### Steps

1. **Clone the repository**
   ```sh
   git clone https://github.com/Mohammad-Ikhlas-khan/Paste-service
   cd paste-service
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure Redis**
   - Set your Redis connection string in an environment variable:
     ```
     REDIS_URL=your_redis_connection_string
     ```
   - You can use a `.env` file or set it directly in your shell.

4. **Start the application**

### For development
   ```sh
   npm run dev
   ```
### For Production
```sh
  npm start
  ```

5. **Access the service**
   - Open [http://localhost:3000](http://localhost:3000) in your browser for the HTML interface.
   ### Health check endpoint:
   [http://localhost:3000/api/healthz](http://localhost:3000/api/healthz)

## API Endpoints

All API endpoints accept and return JSON.

### Create a Paste
- **POST** `/api/pastes`
- **Body:**
  ```json
  {
    "content": "Your text here",
    "ttl": 60,          // (optional) Time-to-live in seconds
    "maxViews": 10        // (optional) Maximum number of views
  }
  ```

- **Response:**
  ```json
  {
    "id": "pasteId",
    "url": "http://localhost:3000/p/pasteId"
  }
  ```

### Get a Paste
- **GET** `/api/pastes/:id`
- **Response:**
  ```json
  {
    "id": "pasteId",
    "content": "Your text here",
    "expiresAt": "2026-01-28T13:00:00Z", // if TTL set
    "remainingViews": 9                  // if maxViews set
  }
  ```

### View a Paste(HTML)
- **GET** `/p/:id`

#### Returns an HTML page containing the paste content rendered safely.
---