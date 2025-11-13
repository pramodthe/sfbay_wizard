# FinSmart - AI-Powered Financial Planning App

A Next.js application for personal financial planning and spending analysis, powered by AI.

## Features

- 💰 Financial Dashboard with balance tracking
- 📊 Spending Analysis & Breakdown
- 🎯 Goal Setting & Tracking
- 💬 AI Financial Coach
- 📈 Cash Flow Projections
- 🤖 Smart Expense Recording with AI
- 🔐 Secure Authentication (Email/Password & Google OAuth)
- ☁️ Cloud Data Persistence & Sync
- 🔄 Real-time Data Synchronization

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **AI:** IBM Watson
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Icons:** Lucide React

## Project Structure

```
├── components/          # React components
│   ├── pages/          # Page-specific components
│   └── ui/             # Reusable UI components
├── context/            # React context providers
├── lib/                # Utility functions and services
│   └── services/       # API services
├── pages/              # Next.js pages
│   └── api/            # API routes
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- API keys for Gemini and IBM Watson (optional for AI features)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```