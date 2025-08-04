# 🃏 Agile Poker Planning

A story point estimation tool.

![Agile Poker Planning](https://img.shields.io/badge/Status-Active-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)


## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon DB)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mkdotd/VCPokerPlanning.git
   cd VCPokerPlanning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`


## 🛠️ TechStack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Wouter** - Routing
- **TanStack Query** - Data fetching and caching
- **Vite** - Build tool and dev server

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **WebSockets** - Real-time updates (via polling)


## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/poker_planning

# Application
NODE_ENV=development
PORT=5000

# Jira Integration (optional)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
```
