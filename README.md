# README.md: Project Scoping & Architecture v3

## Project: Syllabus Summarizer & Dynamic Dashboard

**Date:** 2025-07-26

### 1. High-Level Vision

The goal is to build a web application that transforms dense, static course syllabi into a dynamic, visual, and strategic dashboard. A user can upload a syllabus file (e.g., PDF) and receive an intelligently organized dashboard that highlights key dates, assignment weights, and other crucial information. The application serves as a strategic advisor, helping students quickly understand and prioritize their workload for a course.

### 2. Core Architectural Concepts

Our architecture is built around the Next.js framework, which handles both the frontend and backend logic, simplifying development and deployment. This is augmented by Supabase as our Backend-as-a-Service (BaaS) provider.

#### 2.1. Dual LLM Strategy via API Routes

The core intelligence of the application is executed within a Next.js API route (`/api/upload`) and occurs *only once* per syllabus upload:

1.  **The Parser:** The first LLM call ingests the raw text from the uploaded syllabus and extracts structured data (e.g., assignment names, due dates, grade weights) into a predictable JSON format.
2.  **The Composer:** This structured JSON data is then immediately used in a second LLM call. This "meta-prompt" provides the LLM with the course data and a "manifest" of available front-end components. The LLM's task is to act as a UI designer, returning a JSON "recipe" that defines the ideal initial dashboard layout.

#### 2.2. LLM Service Abstraction

To remain flexible, the API route logic will use an abstraction layer to communicate with the chosen LLM provider.

-   The route will make a standard HTTPS POST request to the provider's API endpoint (e.g., OpenAI, Anthropic, Google Gemini).
-   API keys and model names will be stored securely in environment variables, accessible only on the server-side within the Next.js environment.
-   This allows us to switch LLM providers or models by simply changing configuration.

#### 2.3. One-Time Composition & Data Persistence

To ensure performance and low cost, the expensive Dual LLM process is not run on every page load. The structured data and the JSON layout recipe are both saved to the Supabase database via the API route. All subsequent views of the dashboard will fetch this pre-computed data directly, resulting in an instantaneous and server-rendered initial page load.

#### 2.4. AI as a Starting Point, User as the Final Editor

The AI-generated dashboard layout provides an intelligent default. The user has full control to customize their dashboard after the initial generation by rearranging, resizing, or hiding components.

### 3. Technology Stack & Languages

| Component                      | Technology           | Primary Language(s)          | Role & Responsibility                                                                                                                                                                                                                           |
| ------------------------------ | -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application Logic & UI**     | **Next.js (React)**    | **TypeScript**, CSS/SCSS     | Handles the entire application. Renders the UI components, provides file-based routing, and executes backend logic (syllabus processing, LLM calls, DB communication) via server-side API Routes.                                            |
| **Backend as a Service (BaaS)** | **Supabase**         | **SQL** (for migrations)     | Manages core infrastructure: PostgreSQL database for data storage, user authentication (login/signup), and cloud storage for the uploaded syllabus files. Interacts directly with the Next.js backend logic.                               |

### 4. Proposed Project Directory Structure

A unified Next.js project structure will be used. The `backend` directory is no longer needed.

```
syllabus-summarizer/
├── .github/              # CI/CD workflows (e.g., for Vercel)
├── app/                  # Next.js App Router
│   ├── (auth)/             # Route group for auth pages (login, signup)
│   ├── (dashboard)/        # Route group for protected dashboard pages
│   │   ├── [courseId]/
│   │   │   └── page.tsx      # Main dashboard view for a course
│   │   └── layout.tsx
│   ├── api/                # Backend API Routes
│   │   └── upload/
│   │       └── route.ts      # The single endpoint for handling file upload & LLM processing
│   ├── globals.css
│   └── layout.tsx          # Root layout
├── components/           # Reusable React components
│   ├── dashboard/          # Components specific to the dashboard (Timeline, PieChart)
│   └── ui/                 # General-purpose UI components (Button, Card, Input)
├── lib/                  # Helper functions & shared logic
│   ├── llm.ts              # LLM service abstraction layer
│   └── supabase.ts         # Supabase client configuration
├── supabase/             # Supabase-specific configuration
│   └── migrations/       # Database schema migrations
├── .env.local            # Local environment variables
├── .env.example          # Example environment variables
├── .gitignore
├── GEMINI.md             # This file
├── next.config.mjs
├── tsconfig.json
└── package.json```