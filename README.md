# FocusDeck — macOS Desktop & Dashboard

FocusDeck is a macOS desktop dashboard and productivity command center built with **Next.js**, **Tailwind CSS**, and **Supabase**.

## Features

- **Dashboard**: Live productivity overview with focus target metrics, interactive Pomodoro timer, today's tasks, calendar timeline, habit streaks, quick notes, and reminders.
- **Dynamic Greeting**: Time-of-day contextual greeting with live date and authenticated profile display.
- **Cloud Authentication**: Supabase Email & Password authentication, Magic Link (passwordless) sign-in, and 6-digit OTP verification.
- **Dedicated Views**:
  - `/tasks` — Task checklist with status tracking and priority categorization.
  - `/calendar` — Interactive schedule and timeline viewer.
  - `/focus` — Full focus timer with customizable session lengths.
  - `/reminders` — Time-sensitive notifications and checklist.
  - `/activity` — Habit tracking and streak analytics.
- **macOS Desktop Integration**: Powered by Tauri with native window controls and minimal memory footprint.

## Tech Stack

- **Framework**: Next.js (App Router, Turbopack, static export)
- **Backend / DB**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Styling**: Tailwind CSS with custom dark mode design tokens
- **Desktop Runtime**: Tauri v2

## Getting Started

1. Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Run database migration in `supabase_schema.sql` via Supabase SQL Editor.
3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
