# ChatApp

ChatApp is a full-stack real-time messaging app built with Expo React Native, Node.js, Socket.io, MySQL, and Redis. It supports direct chats, group chats, realtime messaging, image uploads, reply/forward messages, read states, online presence, dark/light mode, localization, and a mobile-first chat UI.

Detailed project documentation is available in `docs/ChatApp-Documentation.pdf`.

## Tech Stack

Frontend:

- Expo React Native
- React Navigation
- Axios
- Socket.io Client
- AsyncStorage
- Expo Image Picker, Blur, Clipboard, and Vector Icons

Backend:

- Node.js
- Express.js
- Socket.io
- MySQL with `mysql2/promise`
- Redis
- JWT authentication
- bcrypt password hashing
- multer file uploads
- express-validator
- Node test runner

Infrastructure:

- Docker Compose
- MySQL 8
- Redis 7
- phpMyAdmin

## Features

- JWT register/login/logout and refresh-token session flow
- Direct one-to-one conversations
- Group conversations with owner/member management
- Conversation pin, mute, archive, delete, and leave actions
- Realtime text and image messaging
- Message edit, delete, copy, reply, and multi-target forward
- Optimistic sending with pending/failed/retry states
- Delivered/read states and unread counts
- Typing indicator and online/offline presence
- Animated online dot on profile icons
- Fullscreen image viewer
- Search messages and users
- Notification settings with mute-all and per-user mute
- Dark/light mode
- English/Myanmar localization
- Custom mobile UI with floating bottom navigation

## Architecture Overview

The backend uses an enterprise-style layered architecture:

- `routes`: API endpoints and validation rules
- `controllers`: request/response orchestration
- `services`: business logic and transactions
- `repository`: MySQL data access
- `database`: database adapter abstraction
- `middleware`: auth, validation, logging, rate limiting, sanitization, upload handling, and errors
- `socket`: Socket.io handlers and room/connection managers
- `exceptions`: structured API errors

The frontend uses React Native screens, reusable components, navigation stacks/tabs, API/socket services, and Context providers for auth, chat state, theme, localization, and notifications.

## Database

The canonical schema is `backend/database/schema.sql`.

Main tables:

- `users`
- `conversations`
- `conversation_members`
- `messages`
- `message_receipts`
- `attachments`
- `messages_archive`
- `device_tokens`

Important design choices:

- Conversations and memberships are stored separately.
- Read state is tracked per user for group-chat correctness.
- Messages use `client_message_id` for retry/idempotency.
- Recent messages stay in `messages`.
- Old messages can be archived into a monthly partitioned `messages_archive` table.
- Redis caches frequently accessed recent messages and presence state.

## Getting Started

Start MySQL, Redis, and phpMyAdmin:

```bash
docker compose up -d
```

Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Create environment files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Update `backend/.env` with strong secrets:

```text
JWT_SECRET=your_long_random_secret
REFRESH_TOKEN_SECRET=your_other_long_random_secret
```

For Android emulator, use:

```text
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000
EXPO_PUBLIC_SOCKET_IO_URL=http://10.0.2.2:5000
```

For a physical phone, use your computer LAN IP instead of `localhost`.

Run backend:

```bash
npm run backend:dev
```

Run frontend:

```bash
npm run frontend:start
```

## Useful Commands

```bash
npm run backend:dev
npm run frontend:start
npm run frontend:android
```

Backend:

```bash
cd backend
npm test
npm run seed:users
npm run archive:messages
```

Generate PDF documentation:

```bash
node scripts/generateDocsPdf.js
```

## Ports

- Backend: `5000`
- MySQL: `3307`
- Redis: `6379`
- phpMyAdmin: `8080`

## Testing

Backend tests cover authentication, message sending, reply/forward behavior, read-state optimization, archived message serialization, batch loading, and socket room/connection managers.

```bash
cd backend
npm test
```

## Current Limitations

- Push notification provider integration is prepared but not fully connected to FCM/APNs.
- Social login buttons are UI placeholders.
- MyDay/story publishing is a placeholder for a future 24-hour feature.
- Production file uploads should move from local storage to object storage with signed URLs.
- End-to-end encryption is not implemented.
