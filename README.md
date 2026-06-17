# QR Menu Ordering & Sales Management System

A modern full-stack web application for digital menus, tables scan ordering, real-time kitchen tracking, and POS sales management.

---

## 🚀 Features

### 👤 Customer App (Mobile First)
* **Table QR Scan**: Detects table numbers from URLs (`?table=Table+1`) and links orders to tables automatically.
* **Interactive Menu**: Categories browsing, item searches, pricing details, and live stock tracking.
* **Direct Cart & Checkout**: Manage quantities, select options, and submit order summaries directly.
* **Live Status Tracking**: Real-time kitchen progress updates (Pending -> Preparing -> Ready -> Completed) powered by Socket.IO.
* **Dynamic QR Receipts**: Renders printable receipt reference numbers and QR codes cashiers can scan.

### 💼 Admin POS Dashboard (Desktop Optimized)
* **Sales Analytics**: High-quality visual metrics for today/weekly/monthly revenue and bestselling categories.
* **Orders Control**: Interactive listing of transactions, status controls, and receipt lookups.
* **Kitchen Display System (KDS)**: Cook-board panel with real-time ticket sliders and sound notifications.
* **Menu Editor**: CRUD controls for food items and categories (supports image uploads).
* **Inventory Management**: stock logs, manual additions/deductions, and low stock warnings.
* **Tables Generator**: Generates custom table QR codes with a printer-friendly layout for tables.
* **Webcam Scanner**: In-browser scanner to process customer receipt QR codes instantly.
* **Audit Trail**: Logs all system updates with timestamps, users, and operator IP addresses.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), Tailwind CSS v4, Lucide Icons, Recharts, Socket.IO Client.
* **Backend**: Node.js, Express, Socket.IO, JWT, Multer.
* **ORM**: Prisma ORM.
* **Database**: SQLite (default local testing) or PostgreSQL (production target).

---

## 📂 Project Structure

```
juju/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Shared UI (Cards, Modals) & layouts
│   │   ├── context/        # Cart & Socket.IO client contexts
│   │   ├── pages/          # Customer views & Admin POS modules
│   │   ├── index.css       # Tailwind v4 master stylesheet
│   │   └── App.jsx         # App router and auth guards
│   └── package.json
└── server/                 # Express Backend
    ├── prisma/
    │   ├── schema.prisma   # Database Models (Portable SQLite/Postgres)
    │   └── seed.js         # Initial mock seeder script
    ├── routes/             # REST controllers (auth, orders, reports)
    ├── uploads/            # Local directory for product images
    ├── index.js            # Express entry point
    └── package.json
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Setup and Start in 3 Steps:

1. **Install all dependencies** (run from the project root):
   ```bash
   npm run install:all
   ```
2. **Initialize local SQLite database & seed data**:
   ```bash
   cd server
   npx prisma db push
   npm run seed
   cd ..
   ```
3. **Start BOTH client and server concurrently**:
   ```bash
   npm run dev
   ```
   * *Backend runs on `http://localhost:5000`*
   * *Frontend runs on `http://localhost:3000`*

---

## 🔐 Credentials for Testing

To log into the Admin panel (`http://localhost:3000/admin/login`), use the following accounts:

1. **POS Admin Account:**
   * **Username or Email**: `admin` or `admin@bistro.com`
   * **Password**: `123123`
   * *Permissions*: Complete system control, Settings, Reports, Scanner.

2. **Kitchen Staff Account:**
   * **Username or Email**: `kitchen@bistro.com`
   * **Password**: `staff123`
   * *Permissions*: Kitchen Display System (KDS), Order state changes.

---

## 🐘 Switch to Production PostgreSQL

To switch from SQLite to **PostgreSQL** for production deployment:

1. Update `server/prisma/schema.prisma` datasource provider to `"postgresql"`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update the `DATABASE_URL` environment variable inside your production `.env` file to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```
Steps to Open:
Open a new terminal in your workspace.
Run the following commands:
bash
cd server
npx prisma studio
It will automatically launch a database viewer in your web browser at: 🔗 http://localhost:5555