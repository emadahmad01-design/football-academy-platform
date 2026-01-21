# Football Academy Platform

A comprehensive, AI-powered platform designed to revolutionize football academy operations, player development, and talent scouting. This platform connects grassroots talent with professional academies and provides advanced tools for coaching, analysis, and management.

## 🚀 Features

### AI-Powered Tools
*   **AI Coach Assistant:** Real-time chat assistant for coaching advice and drill suggestions.
*   **AI Match Coach:** Tactical advice and game management support.
*   **AI Formation Simulation:** Simulates player movement and tactical setups.
*   **AI Video Analysis:** Automated analysis of match footage to identify key moments and player performance.
*   **AI Emergency Mode:** Rapid tactical adjustments for critical match situations.
*   **AI Calendar:** Smart scheduling for training sessions and matches.

### Core Platform Features
*   **Player Tracking:** Comprehensive profiles with performance metrics and development history.
*   **Drill Management:** Library of coaching drills with assignment capabilities.
*   **Academy Management:** Tools for managing teams, staff, and facilities.
*   **Video Gallery:** Centralized storage for match and training videos.
*   **Certification System:** Generate and manage coaching and player certificates.
*   **Messaging System:** Internal communication for staff and players.

## 🛠️ Tech Stack

*   **Frontend:** 
    *   React 18 (Vite)
    *   TypeScript
    *   Tailwind CSS
    *   Radix UI Components
    *   TanStack Query
*   **Backend:** 
    *   Node.js
    *   Express/HTTP Server (Custom implementation)
*   **Database & ORM:**
    *   Drizzle ORM
    *   PostgreSQL (implied)
*   **AI Integration:**
    *   OpenAI / LLM Integration for AI features
*   **Testing:**
    *   Vitest

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/3omar53/football-academy-platform.git
    cd football-academy-platform
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup:**
    *   Copy `.env.example` to `.env` (create one if it doesn't exist) and configure your database credentials and API keys.

4.  **Database Migration:**
    Push the schema to your database.
    ```bash
    npm run db:push
    ```

## 🏃‍♂️ Running the Application

**Development Mode:**
Starts the frontend and backend in watch mode.
```bash
npm run dev
```

**Production Build:**
Builds the client and server for production.
```bash
npm run build
```

**Start Production Server:**
Runs the built application.
```bash
npm start
```

## 🧪 Testing

Run the test suite using Vitest:
```bash
npm test
```

## 📂 Project Structure

*   `client/`: Frontend React application
*   `server/`: Backend API and service logic
*   `drizzle/`: Database schema and migrations
*   `research/`: Project documentation and research findings
*   `shared/`: Shared types and utilities
