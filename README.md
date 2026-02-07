# Syncly 💬  
Real-Time Chat Application

Syncly is a real-time chat application built with a modern full-stack architecture.  
It focuses on secure authentication, message persistence, and real-time user presence using Redis.

---

## 🚀 Features

- 🔐 JWT-based authentication with protected routes  
- 💬 One-to-one real-time messaging  
- 🟢 Online user presence & real-time indicators  
- 💾 Persistent chat messages  
- 📱 Responsive and clean UI  

---

## 🛠 Tech Stack

### Frontend
- Next.js  
- React  
- Tailwind CSS  
- TypeScript

### Backend
- Node.js  
- Express.js  
- JWT Authentication  
- TypeScript

### Database & Caching
- PostgreSQL (Neon)  
- Drizzle ORM  
- Redis (online user presence & real-time state)

---

## 🧠 Architecture Overview

- Next.js handles the frontend UI and routing  
- Express.js provides REST APIs for authentication and messaging  
- PostgreSQL stores users and chat messages  
- Drizzle ORM manages database queries in a type-safe way  
- Redis tracks online users and real-time presence efficiently  

---

## 📸 Screenshots

_Add screenshots or GIFs here to showcase the chat UI, authentication flow, and online status._

---

## 🔗 Live Demo

👉 https://syncly-fawn.vercel.app/

---

## 📦 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/syncly.git

# Install dependencies on fronend and run
cd web
npm install
npm run dev

# Install dependencies on Backend and run
cd server
npm install
npm run dev
```

---

## Environment Variables

# Backend
```bash
DATABASE_URL="your postgress url"
JWT_SECRET="your secret"
PORT=5000
NODE_ENV="development"
REDIS_URL="your redis url"
FRONT_END="https://localhost:3000"
```
# frontend
```bash
NEXT_PUBLIC_API="http://localhost:5000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```
---

