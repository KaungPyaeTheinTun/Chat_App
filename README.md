# React Native Real-Time Chat App

This project contains:

- `backend/`: Express.js + Socket.io + MySQL + Redis API
- `frontend/`: Expo React Native mobile client

## Local setup

1. Start MySQL, Redis, and phpMyAdmin:

```bash
docker compose up -d
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
```

4. Copy env templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

5. Start the backend:

```bash
npm run backend:dev
```

6. Start Expo:

```bash
npm run frontend:start
```

## Features

- JWT authentication
- Refresh-token based session renewal
- One-to-one conversations
- Real-time messaging with Socket.io
- Redis-backed cache and presence state
- Typing indicators, read receipts, and presence
- Message edit/delete/search
- Image messages via URL payloads
