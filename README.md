# 💰 Expense Tracker – MERN Stack

A full-featured, production-ready personal expense tracker built with MongoDB, Express, React (Vite), and Node.js.

## Features

- 🔐 JWT-based authentication (Register/Login/Logout)
- 📊 Interactive dashboard with Pie & Bar charts, scoped to current month
- 💸 Add / Edit / Delete income and expense transactions
- 🔍 Search, filter by category, filter by date range, pagination
- 📄 Export transactions to CSV and PDF
- 📅 Calendar page with GitHub-style heatmap, monthly stats, and All-Time Overview
- 📝 "Inkwell" journal — notebook-style notes with emoji picker, date-linking, and search
- 💰 Budgets & Alerts — set spending limits per category, get in-app notifications when thresholds are crossed
- 🔔 Notification bell with unread badge, mark-as-read, delete
- 👤 User profile with account stats, password change, notification preferences, account deletion
- 🌗 Dark / Light mode
- 📱 Fully responsive design
- ✅ Client-side and server-side validation
- 🛡️ Protected routes, bcrypt password hashing, centralized error handling

## Tech Stack

**Frontend:** React (Vite), React Router DOM, Axios, Chart.js, React Icons, React Hot Toast, jsPDF
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, express-validator

## Live Demo

*(link coming soon after deployment)*

## Project Structure

\`\`\`
ExpenseTracker/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── hooks/
        ├── pages/
        └── utils/
\`\`\`