# DevWatch AI

> Build Better. Ship Faster. Monitor Smarter.

DevWatch AI is an AI-powered collaborative development platform that combines cloud coding, project management, AI code review, team collaboration, monitoring, analytics, and workspace management into a single platform.

Instead of using multiple tools like VS Code, GitHub, Slack, Jira, ChatGPT, and monitoring platforms separately, DevWatch AI brings everything together in one workspace.

---

# 🚀 Overview

DevWatch AI allows developers and teams to:

- Create and manage workspaces
- Create and manage projects
- Write code directly in the browser
- Store project files in MongoDB
- Collaborate with team members
- Chat inside projects
- Get AI-powered code reviews
- Analyze complete projects with AI
- Monitor project activity
- Track analytics and performance
- Export projects as ZIP files
- Manage teams and permissions

All data is stored securely in MongoDB Atlas while authentication is handled using Firebase Authentication.

---

# ✨ Core Features

## 🔐 Authentication System

### Firebase Authentication

Supports:

- Email & Password Signup
- Email & Password Login
- Google Login
- Secure Session Management
- Persistent Authentication

### Security Features

- Firebase ID Token Verification
- JWT Authentication
- Protected API Routes
- Session Validation
- Role-Based Access Control

---

# 🏢 Workspaces

A Workspace is the top-level container where teams collaborate.

Example:

Workspace
├── Frontend Team
├── Backend Team
├── AI Team
└── QA Team

Each workspace contains:

- Projects
- Team Members
- Activity Logs
- Analytics
- Monitoring Data
- Shared Resources

---

# 📁 Projects

Projects belong to a workspace.

Users can:

- Create Projects
- Rename Projects
- Delete Projects
- Open Projects
- Manage Project Members
- Track Project Activity

Project Information:

- Project Name
- Description
- Owner
- Team Members
- Creation Date
- Last Updated Date
- Status

---

# 💻 Cloud IDE

DevWatch AI includes a browser-based coding environment.

Features:

- Monaco Editor
- File Explorer
- Folder Explorer
- Multi-file Support
- Auto Save
- Manual Save
- MongoDB File Storage

Users can:

- Create Files
- Delete Files
- Rename Files
- Create Folders
- Write Code
- Save Code
- Reopen Saved Projects

Supported Languages:

- JavaScript
- TypeScript
- Python
- HTML
- CSS
- JSON
- React
- Node.js

---

# 🤖 AI Assistant (Groq Powered)

All AI functionality is powered using the Groq API.

No OpenAI dependency is used.

---

## AI Code Review

Analyze the currently opened file.

Checks:

- Bugs
- Logic Errors
- Performance Issues
- Security Issues
- Code Smells
- Best Practices

Example:

Issue:
Using any type removes type safety.

Severity:
Medium

Recommendation:
Create a dedicated interface instead.

---

## Full Project Analysis

Analyzes the entire project.

Provides:

- Architecture Review
- Code Quality Score
- Security Review
- Maintainability Score
- Performance Analysis
- Improvement Suggestions

---

## Auto Fix

Automatically fixes detected issues.

Examples:

- Remove unused imports
- Improve TypeScript types
- Fix naming conventions
- Improve code structure
- Optimize loops

---

## AI Chat Assistant

Project-aware AI assistant.

Can:

- Explain code
- Find bugs
- Generate functions
- Suggest optimizations
- Review architecture
- Help with debugging

AI understands:

- Current File
- Current Project
- Workspace Context

---

# 👥 Team Collaboration

Multiple developers can collaborate inside the same workspace.

Features:

### Team Members

View:

- Online Members
- Offline Members
- Active Members
- Project Members

### Member Roles

- Owner
- Admin
- Developer
- Viewer

Permissions are managed based on role.

---

# 💬 Team Chat

Built-in real-time communication system.

Supports:

- Workspace Chat
- Project Chat
- Team Channels
- Mentions
- Message History

Examples:

- #general
- #frontend
- #backend
- #ai
- #design

---

# 📊 Monitoring System

Track project activity and team performance.

Monitor:

- Active Users
- Team Activity
- Deployments
- Reviews
- File Changes
- Project Health

---

# 🔔 Notifications

Real-time notifications.

Examples:

- New Project Created
- Team Member Joined
- AI Review Completed
- New Message Received
- File Updated
- Project Exported

---

# 📈 Analytics

Track development performance.

Metrics:

- Active Projects
- Files Created
- AI Reviews
- Team Activity
- Productivity Trends
- Active Members

---

# 📋 Dashboard

Central workspace overview.

Displays:

### Project Statistics

- Active Projects
- Open Reviews
- Deployments
- Alerts

### AI Insights

- Potential Bugs
- Code Quality
- Performance Issues
- Security Risks

### Team Activity

- Reviews
- Deployments
- Messages
- Project Updates

### Online Members

Shows currently active users.

---

# 📦 Project Export

Export complete project as ZIP.

Includes:

- Files
- Folders
- Code
- Project Structure

Useful for:

- GitHub Upload
- Local Development
- Backup

---

# 🎓 New User Onboarding

Shown only once after account creation.

Guides users through:

### Step 1

Create Workspace

### Step 2

Create Project

### Step 3

Create Files

### Step 4

Write Code

### Step 5

Use AI Review

### Step 6

Invite Team Members

### Step 7

Export Project

The onboarding tutorial is never shown again after completion.

---

# 📖 How To Use Guide

Accessible from the landing page.

Explains:

### Create Account

- Sign Up
- Verify Email
- Login

### Create Workspace

- Create Workspace
- Add Name
- Save

### Create Project

- New Project
- Select Workspace
- Create

### Start Coding

- Create Files
- Write Code
- Save Changes

### Use AI

- Run AI Review
- Analyze Project
- Ask Questions

### Collaborate

- Invite Members
- Chat
- Track Activity

### Export

- Export ZIP
- Download
- Upload to GitHub

---

# 🏗️ Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Monaco Editor
- Firebase Authentication

## Backend

- Node.js
- Express.js
- Socket.io
- JWT Authentication

## Database

- MongoDB Atlas
- Mongoose

## AI

- Groq API

Supported Models:

- Llama 3
- DeepSeek
- Other Groq Models

---

# 🗄️ Database Collections

## Users

```javascript
{
  _id,
  firebaseUid,
  name,
  email,
  avatar,
  role,
  createdAt
}
```

## Workspaces

```javascript
{
  _id,
  name,
  owner,
  members,
  createdAt
}
```

## Projects

```javascript
{
  _id,
  workspaceId,
  name,
  description,
  owner,
  members
}
```

## Files

```javascript
{
  _id,
  projectId,
  path,
  content,
  language,
  updatedAt
}
```

## Chats

```javascript
{
  _id,
  workspaceId,
  sender,
  message,
  createdAt
}
```

## AI Reviews

```javascript
{
  _id,
  projectId,
  fileId,
  review,
  score,
  createdAt
}
```

## Notifications

```javascript
{
  _id,
  userId,
  type,
  message,
  read
}
```

---

# ⚙️ Environment Variables

```env
# MongoDB
MONGODB_URI=

# JWT
JWT_SECRET=

# Groq
GROQ_API_KEY=

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

# 🖥️ Running Locally

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Run backend:

```bash
node server.js
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:4000
```

---

# 🛣️ Future Roadmap

## Phase 2

- Real-Time Collaborative Editing (Yjs)
- Live Cursor Sharing
- Presence Indicators
- Voice Channels

## Phase 3

- GitHub Integration
- GitLab Integration
- CI/CD Pipelines
- Deployment Automation

## Phase 4

- AI Code Generation
- AI Pull Requests
- AI Documentation Generator
- AI Test Generation

---

# 🎯 Vision

DevWatch AI aims to become an all-in-one developer workspace where teams can:

**Plan → Build → Collaborate → Review → Monitor → Analyze → Export**

without switching between multiple tools.

One Platform. One Workspace. Complete Development Lifecycle.

## Intellectual Property Notice
DevWatchAI is an original project developed for educational, research, and portfolio purposes. Please do not copy, redistribute, or reuse the source code, design, or architecture without prior permission. Feel free to explore the project for learning and inspiration, but any unauthorized reproduction or commercial use is strictly prohibited. If you'd like to build upon this work or collaborate, please reach out first.
