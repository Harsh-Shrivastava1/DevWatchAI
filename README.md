# DevWatch AI

DevWatch AI is an AI-powered collaborative cloud IDE and development workspace.
This workspace includes a runnable Next.js frontend prototype and a Node/Express
backend scaffold for API routes, Socket.io collaboration, MongoDB models, AI
review, monitoring, chat, notifications, and project export.

## Run the frontend

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Run the backend

```bash
cp .env.example .env
npm run server:dev
```

The JavaScript backend defaults to `http://127.0.0.1:4000`.

```bash
npm run dev
```

The frontend can still be run with:

```bash
npm run frontend:dev
```

## Backend routes

- `POST /api/ai/review`
- `POST /api/ai/suggestions`
- `POST /api/ai/bug-detection`
- `POST /api/ai/auto-fix`
- `POST /api/ai/chat`
- `POST /api/ai/project-analysis`
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/workspaces`
- `POST /api/workspaces/create`
- `POST /api/workspaces/invite`
- `GET /api/projects?workspaceId=...`
- `POST /api/projects/create`
- `DELETE /api/projects/:id`
- `GET /api/files/:projectId`
- `POST /api/files/save`
- `DELETE /api/files/:id`
- `GET /api/chat/:projectId`
- `POST /api/chat/send`
- `GET /api/monitoring/:projectId`
- `POST /api/monitoring/:projectId`
- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/export/:projectId`

## Implemented surfaces

- Landing page with product preview, feature cards, and CTA flow
- Workspace dashboard with overview, projects, AI reviews, monitoring,
  analytics, team, notifications, and settings
- Cloud IDE with file explorer, tabs, Monaco editor, save/run/deploy/review
  actions, chat, AI review, monitoring, and local project export
- Express API route scaffold matching the product plan
- Socket.io room events for project collaboration, file updates, chat, typing,
  notifications, and presence
- Mongoose schemas for users, workspaces, members, projects, files, chats,
  AI reviews, monitoring, and notifications

## Service credentials

Add the values from `.env.example` to enable MongoDB Atlas, Groq, Firebase, and
a deployed Socket.io URL.
