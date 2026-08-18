# Convomate — Real-Time English Speaking & Learning Platform

<p align="center">
  <img src="public/favicon.ico" alt="Convomate Logo" width="64" height="64" />
</p>

<p align="center">
  <strong>An advanced real-time EdTech web application for 1-on-1 English mentorship, live peer speaking practice, automated scheduling, and learning analytics.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 13" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Inertia.js-v3-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/FrankenPHP-Octane-00BCD4?style=for-the-badge&logo=caddy&logoColor=white" alt="FrankenPHP" />
</p>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Pupil (Student) Experience](#pupil-student-experience)
  - [Teacher Experience](#teacher-experience)
  - [Administrative Suite](#administrative-suite)
  - [Real-Time & Background Infrastructure](#real-time--background-infrastructure)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker (Recommended)](#quick-start-with-docker-recommended)
  - [Manual / Local Setup](#manual--local-setup)
- [Commands & Scripts](#commands--scripts)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Project Directory Structure](#project-directory-structure)
- [License](#license)

---

## 🌟 Overview

**Convomate** connects English language learners with qualified teachers and peer practice partners. Designed for high performance and low latency, it pairs **Laravel 13 Octane (FrankenPHP)** with **Inertia.js v3 + React 19** to deliver a fluid SPA experience backed by real-time WebSockets (**Laravel Reverb**) and queue orchestration (**Laravel Horizon**).

---

## 🚀 Key Features

### 🧑‍🎓 Pupil (Student) Experience
- **Teacher Marketplace**: Filter teachers by accent, teaching specializations, price per hour, CEFR level, and ratings.
- **Smart Booking Flow**: Select availability slots, split into 30 or 60-minute sessions, specify discussion topics, and book trial or standard lessons.
- **Speaking Room (Peer Matchmaking)**: Instant peer search with WebSockets presence channels, matchmaking requests, and live WebRTC/video chat rooms.
- **Progress & Gamification**: CEFR roadmap progression, weekly practice goals, session milestones, and streak tracking.
- **Session Hub**: Seamless 1-click meeting join links, lesson materials, and post-session teacher reviews.

### 👨‍🏫 Teacher Experience
- **Flexible Availability Manager**: Configure recurring weekly schedules and custom single-date overrides with automated timezone conversions and slot caching.
- **Appointment Lifecycle Management**: Approve, reject, reschedule, or cancel bookings; launch video meetings with instant room tokens.
- **2-Way Google Calendar Synchronization**: Background jobs sync confirmed appointments with teachers' personal Google Calendars.
- **Credential & Portfolio Management**: Multi-certificate upload system (IELTS, TOEFL, CELTA, etc.) with verification badges, intro videos, and qualitative student reviews.

### 🛡️ Administrative Suite
- **Payment Pipeline**: Review student payment confirmations/rejections and monitor platform revenue.
- **User & Certificate Moderation**: Teacher onboarding workflows, granular verification of individual teaching certificates with score-badge locks, and user management.
- **Live Support & Broadcasts**: Real-time customer support ticket management, threaded replies, and platform-wide announcement broadcasts.

### ⚡ Real-Time & Background Infrastructure
- **Laravel Reverb WebSockets**: Real-time matchmaking queue, live support threads, appointment status broadcasts, and peer signaling.
- **Laravel Horizon**: Redis queue monitoring for reminders (`ScheduleAppointmentRemindersJob`, `SendAppointmentReminderJob`) and Google Calendar synchronization.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | [Laravel 13](https://laravel.com), [PHP 8.3+](https://php.net), [Laravel Octane](https://laravel.com/docs/octane) with FrankenPHP |
| **Authentication** | [Laravel Fortify](https://laravel.com/docs/fortify) (Passkeys, 2FA, Email Verification), [Socialite](https://laravel.com/docs/socialite) (Google OAuth) |
| **Frontend** | [Inertia.js v3](https://inertiajs.com), [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com), [Lucide React](https://lucide.dev), [Sonner](https://sonner.emilkowal.ski) |
| **Real-Time** | [Laravel Reverb](https://reverb.laravel.com), `@laravel/echo-react`, `pusher-js` |
| **Queues & Cache** | [Laravel Horizon](https://laravel.com/docs/horizon), Redis 7 |
| **Database** | PostgreSQL 17 (UUID Primary Keys) |
| **Tooling & Linter** | [Laravel Wayfinder](https://github.com/laravel/wayfinder), [Laravel Pint](https://laravel.com/docs/pint), ESLint v9, Prettier, Vite 8 |

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Client                          │
│     React 19 • Inertia.js v3 • TypeScript • Tailwind CSS    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Inertia Request / Wayfinder Typed APIs
┌──────────────────────────────▼──────────────────────────────┐
│                  Laravel 13 Application                     │
│    Controllers • Custom Services • Form Requests • Policies │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│   PostgreSQL 17 Database    │ │    Redis 7 + Horizon        │
│   Users, Bookings, Profiles │ │    Queue Workers & Cache    │
└─────────────────────────────┘ └──────────────┬──────────────┘
                                               │
                                ┌──────────────▼──────────────┐
                                │   Laravel Reverb Server     │
                                │   WebSockets (Port 8443)    │
                                └─────────────────────────────┘
```

---

## 🏁 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) **OR**:
  - PHP >= 8.3 with extensions (`pdo_pgsql`, `redis`, `bcmath`, `curl`, `mbstring`, `openssl`)
  - [Composer](https://getcomposer.org/)
  - [Node.js](https://nodejs.org/) (>= 20.x) & NPM / PNPM
  - PostgreSQL 17 & Redis 7

---

### Quick Start with Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/English_Speaking_App.git
   cd English_Speaking_App
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Start all Docker containers**:
   ```bash
   docker compose up -d --build
   ```

4. **Initialize application**:
   ```bash
   docker compose exec api php artisan key:generate
   docker compose exec api php artisan migrate --seed
   ```

5. **Access the application**:
   - Web App: `http://localhost:8080` (or `https://localhost` if TLS certs configured)
   - Reverb WebSocket Server: `ws://localhost:8443`
   - Horizon Dashboard: `http://localhost:8080/horizon` (Admin restricted)

---

### Manual / Local Setup

1. **Install PHP and Node dependencies**:
   ```bash
   composer install
   npm install
   ```

2. **Set up `.env` file**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Configure Database & Redis in `.env`**:
   ```ini
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=edtech
   DB_USERNAME=postgres
   DB_PASSWORD=your_password

   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379

   BROADCAST_CONNECTION=reverb
   QUEUE_CONNECTION=redis
   ```

4. **Run migrations and seeders**:
   ```bash
   php artisan migrate --seed
   ```

5. **Run the local development stack**:
   ```bash
   composer run dev
   ```
   *This concurrently boots `php artisan serve`, queue worker, pail logs, and Vite.*

---

## ⚡ Commands & Scripts

| Command | Description |
|---|---|
| `composer run dev` | Runs local server, queue listener, logs (`pail`), and Vite concurrently |
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Compiles production frontend assets |
| `npm run types:check` | Runs TypeScript compiler type checking without emitting files |
| `npm run lint` / `npm run lint:check` | Fixes or verifies ESLint compliance across frontend files |
| `npm run format` | Runs Prettier with Tailwind CSS plugin on `resources/` |
| `composer run lint` | Runs Laravel Pint code formatter across PHP files |
| `DB_HOST=127.0.0.1 ./vendor/bin/phpunit` | Runs the automated PHPUnit test suite |

---

## 🧪 Testing & Quality Assurance

The codebase includes an extensive automated test suite covering authentication, appointment lifecycles, matchmaking, availability slots, and admin workflows:

```bash
# Run all PHPUnit tests
DB_HOST=127.0.0.1 ./vendor/bin/phpunit

# Run a specific feature test
DB_HOST=127.0.0.1 ./vendor/bin/phpunit tests/Feature/BookingWorkflowTest.php

# Run TypeScript static type check
npm run types:check
```

---

## 📂 Project Directory Structure

```
English_Speaking_App/
├── app/
│   ├── Enums/                 # Platform enums (ReminderType, etc.)
│   ├── Events/                # Real-time broadcast events (AppointmentBooked, etc.)
│   ├── Http/
│   │   ├── Controllers/       # Domain controllers (Pupil, Teacher, Admin, Booking)
│   │   └── Middleware/        # Role-based middleware (Admin, Teacher, Pupil)
│   ├── Jobs/                  # Queue jobs (Google Calendar sync, appointment reminders)
│   ├── Models/                # Eloquent models (User, TeacherProfile, PupilProfile, etc.)
│   ├── Notifications/         # Database and mail notifications
│   └── Services/              # Core business services (SlotService, BookingService, MatchmakingService)
├── database/
│   ├── factories/             # Model factories for testing
│   ├── migrations/            # Database schema migrations
│   └── seeders/               # Initial data & admin seeders
├── resources/
│   ├── js/
│   │   ├── components/        # Reusable UI component library (shadcn/Radix)
│   │   ├── layouts/           # App layouts (AppLayout, GuestLayout, etc.)
│   │   ├── pages/             # Inertia page components
│   │   │   ├── admin/         # Admin dashboard, user & certificate moderation
│   │   │   ├── pupil/         # Pupil teacher search, booking, progress
│   │   │   ├── teacher/       # Teacher availability, appointments, feedback
│   │   │   ├── speaking.tsx   # Real-time peer matchmaking & video chat room
│   │   │   └── welcome.tsx    # Marketing landing page
│   │   └── types/             # TypeScript type definitions
│   └── css/                   # Tailwind CSS v4 styling
├── routes/
│   ├── web.php                # Web routes & role groups
│   ├── channels.php           # Laravel Reverb broadcast authorization channels
│   └── settings.php           # User profile & account setting routes
├── tests/
│   ├── Feature/               # End-to-end and feature integration tests
│   └── Unit/                  # Isolated unit tests
├── docker-compose.yml         # Containerized services orchestration
└── vite.config.ts             # Vite build configuration with Wayfinder plugin
```

---

## 📄 License

This project is open-sourced software licensed under the [MIT license](LICENSE).
