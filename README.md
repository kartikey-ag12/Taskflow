# TaskFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking team progress with role-based access control.

🔗 **Live Demo**: [https://your-app.railway.app](https://your-app.railway.app)

---

## Features

- 🔐 **Authentication** — JWT-based signup/login with bcrypt password hashing
- 👥 **Role-Based Access Control** — Admin (full control) and Member (view + update own tasks)
- 📁 **Project Management** — Create, edit, delete projects; manage team members
- ✅ **Task Management** — Create tasks with title, description, priority, due date, assignee
- 📊 **Kanban Board** — Visualize tasks across Todo / In Progress / Done
- 📈 **Dashboard** — Stats: total tasks, completed, overdue, completion rate
- ⚠️ **Overdue Detection** — Highlights and lists past-due tasks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcrypt |
| Deployment | Railway |

---

## Getting Started (Local)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env — add your MONGODB_URI
npm install
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **First user to sign up becomes Admin automatically.**

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | List all users |

### Projects
| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/projects` | List user's projects | All |
| POST | `/api/projects` | Create project | Admin |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| DELETE | `/api/projects/:id/members/:uid` | Remove member | Admin |

### Tasks
| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/tasks/project/:id` | Get project tasks | All |
| POST | `/api/tasks/project/:id` | Create task | Admin |
| PUT | `/api/tasks/:id` | Update task | Admin/Assignee |
| DELETE | `/api/tasks/:id` | Delete task | Admin |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregated stats |

---

## Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create/Edit/Delete Project | ✅ | ❌ |
| Add/Remove Members | ✅ | ❌ |
| Create/Delete Task | ✅ | ❌ |
| Update Task Status | ✅ | ✅ (own tasks only) |
| View Dashboard & Projects | ✅ | ✅ |

---

## Deployment on Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random string
   - `NODE_ENV` — `production`
   - `PORT` — `5000`
4. Railway auto-builds and deploys

---

## License
MIT
