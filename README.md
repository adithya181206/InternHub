# InternHub

> An AI-powered internship matching and senior alumni referral platform engineered to bridge the gap between student resumes and high-impact company opportunities through automated skill-gap analysis and direct alumnus routing.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://intern-hub-wheat.vercel.app/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## Visual Preview

<a href="https://intern-hub-wheat.vercel.app/">
  <img src="https://img.shields.io/badge/🚀_Try_InternHub_Live-intern--hub--wheat.vercel.app-4F46E5?style=for-the-badge&logoColor=white" alt="Try InternHub Live" />
</a>

> **[▶ Launch InternHub Live Demo](https://intern-hub-wheat.vercel.app/)** — explore the Discovery Hub, upload a resume for Career DNA parsing, and test the full referral workflow directly in your browser.

---

## Executive Summary & Core Value Proposition

InternHub addresses the widespread disconnect between student applicants and corporate recruitment by replacing blind application drops with an automated, AI-driven referral ecosystem. By leveraging Google Gemini for multi-stage Career DNA resume extraction and instant skill-shortcoming detection, InternHub aligns student profiles with top-tier internships. It then directly pairs qualified students with verified company alumni, enabling senior employee endorsements that dramatically enhance interview conversion rates.

---

## Role-Based Features (Student & Alumnus Portals)

### Student Portal
- **Dual Authentication**: Secure sign-in via Google OAuth (`GoogleAuthProvider`) and traditional Email/Password authentication backed by Firebase Auth.
- **Career DNA (Resume Ingestion & Parsing)**: Supports direct PDF or plain-text resume uploads with automatic extraction powered by Google Gemini (`gemini-2.5-flash`). Profiles are organized into 5 structured pillars: Education, Experience, Technical Projects, Skills, and a concise 1-sentence Executive Summary.
- **Automated Readiness Scoring**: Calculates candidate qualification scores and persists base64 document snapshots for alumnus verification.
- **Discovery Hub (Unlocked Post-Resume)**: Access an expansive directory of top technology internships (Google, Vercel, OpenAI, Stripe, Microsoft, Amazon, Meta, Apple, Netflix, Spotify, etc.) featuring dynamic match percentages, skill-gap detection, and direct external application links.
- **Randomized Alumnus Referral Routing**: With one click, route referral requests to verified company alumni matching the target role, preventing candidate bottlenecks.
- **Live Referral & Application Tracking**: Monitor request lifecycles in real time (`pending`, `accepted`, `rejected`, `rejected_elsewhere`) with integrated messaging capabilities.

### Alumnus Portal
- **Verified Company Profile Management**: Employment verification workflow with simulated OTP authorization and AI document verification for seamless corporate transitions.
- **Referral Desk Queue**: Dedicated dashboard showing incoming candidate requests, AI-generated candidate profiles, technical highlights, and instant resume preview.
- **Instant Status Synchronization**: One-click Approve and Reject operations with instant Firestore synchronization and auto-generated corporate email referral drafts.
- **Duplicate & Capacity Protection**: Automatic rejection of remaining applicant requests once a role's referral capacity is reached (`rejected_elsewhere`), protecting alumni from over-commitment.

### Universal Experience
- **Theme Engine**: Universal Dark / Light Theme switching with persistent user preferences stored in `localStorage`.
- **Interactive Visuals**: Custom Three.js particle background (`@react-three/fiber`) that dynamically interacts with mouse movements and adapts color palettes across themes.
- **Responsive Layout**: Designed with Tailwind CSS for mobile, tablet, and widescreen desktop displays.

---

## System Architecture & Data Flow

### Architectural Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (Browser)                          │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 React 19 + TypeScript + Vite                        │   │
│   │   ├── Three.js Interactive Particle Swarm (@react-three/fiber)      │   │
│   │   ├── Tailwind CSS v4 UI + Framer Motion Animations                │   │
│   │   └── Zustand Global Stores (Auth, Referrals, Bookmarks, Chat)      │   │
│   └──────────────────┬───────────────────────────────┬──────────────────┘   │
└──────────────────────┼───────────────────────────────┼──────────────────────┘
                       │                               │
                       ▼                               ▼
┌──────────────────────────────────────┐     ┌────────────────────────────────┐
│           FIREBASE BACKEND           │     │       SERVERLESS / AI PROXY    │
│                                      │     │                                │
│  ┌────────────────────────────────┐  │     │  ┌──────────────────────────┐  │
│  │   Firebase Authentication      │  │     │  │  Vercel Serverless Func  │  │
│  │   (Google OAuth + Email/Pass)  │  │     │  │  /api/gemini.ts (Node)   │  │
│  └────────────────────────────────┘  │     │  └────────────┬─────────────┘  │
│                                      │     │               │                │
│  ┌────────────────────────────────┐  │     │               ▼                │
│  │   Cloud Firestore Realtime DB  │  │     │  ┌──────────────────────────┐  │
│  │   • users (auth profiles)      │  │     │  │   Google Gemini API      │  │
│  │   • user_data (DNA, resumes)   │  │     │  │   (gemini-2.5-flash)     │  │
│  │   • global (referrals, chats)  │  │     │  │   • Career DNA Parsing   │  │
│  └────────────────────────────────┘  │     │  │   • Skill Shortcomings   │  │
│                                      │     │  │   • Candidate Summaries  │  │
│                                      │     │  └──────────────────────────┘  │
└──────────────────────────────────────┘     └────────────────────────────────┘
```

### End-to-End Referral Workflow

```text
[ Student Resume Upload (PDF) ]
              │
              ▼
[ Gemini 2.5 Flash Career DNA Extraction ]
              │
              ▼
[ Match Engine & Skill-Gap Analysis ]
              │
              ▼
[ Randomized Alumnus Routing (Pending Queue) ]
              │
              ▼
[ Alumnus Decision (Approve / Reject) ] ──► [ Firestore Real-Time Sync ]
```

1. **Resume Upload**: Student uploads a PDF or text resume in Career DNA (`DNAHub.tsx`).
2. **Gemini Career DNA Parsing**: The server-side proxy `/api/gemini.ts` invokes Google Gemini (`gemini-2.5-flash`) to parse credentials into structured JSON, persisted to `user_data/mock_dna_<uid>`.
3. **Match Engine Scoring**: Discovery Hub unlocks, dynamically comparing student technical skills against internship requirements and spotlighting shortcoming tags.
4. **Randomized Alumnus Routing**: Student initiates a referral request; the engine routes the application to verified alumni at that specific company in `global/mock_referrals`.
5. **Instant Status Sync**: Alumnus inspects the candidate resume on `ReferralDesk.tsx`, executing an Approve or Reject action that immediately updates student dashboards via Firestore `onSnapshot` listeners.

---

## Tech Stack

| Domain | Technology | Purpose in InternHub |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Core component architecture and type-safe state execution |
| **Build & Tooling** | Vite 7 | High-speed hot module replacement (HMR) and production bundling |
| **Styling & Design** | Tailwind CSS v4, Lucide React | Modern utility-first styling and iconography |
| **3D & Animations** | Three.js, `@react-three/fiber`, Framer Motion | Interactive particle background swarm and fluid UI transitions |
| **State Management** | Zustand (v5) | Reactive client state stores for Auth, Referrals, Bookmarks, and Chat |
| **Authentication** | Firebase Auth | Dual Google OAuth and Email/Password credential authentication |
| **Database & Sync** | Cloud Firestore | Realtime document sync proxy (`syncStorage.ts`) and global data queues |
| **AI Integration** | Google Gemini API (`gemini-2.5-flash`) | Automated resume parsing, candidate summaries, and career counseling |
| **Serverless Proxy** | Vercel Serverless Functions (`api/gemini.ts`) | Secure backend proxy keeping Gemini API keys protected from the browser |
| **Deployment** | Vercel & GitHub Pages | Production hosting with SPA fallback routing (`404.html`) |

---

## Project Structure

```text
internhub/
├── api/
│   └── gemini.ts               # Secure Vercel serverless function proxying Gemini API calls
├── public/
│   ├── 404.html                # Single-page app routing redirect for GitHub Pages
│   ├── particle-bg.png         # Static particle texture asset
│   └── vite.svg                # Vite logo icon
├── src/
│   ├── assets/                 # Static graphical assets (react.svg)
│   ├── components/             # Reusable UI modules
│   │   ├── ChatPanel.tsx       # Live communication slide-over between students and alumni
│   │   ├── DashboardLayout.tsx # Persistent layout with navigation sidebar and theme toggle
│   │   ├── ParticleBackground.tsx # Three.js interactive 3D particle swarm canvas
│   │   ├── Sidebar.tsx         # Role-based dashboard sidebar with badge indicators
│   │   └── ToastContainer.tsx  # Dynamic floating notification container
│   ├── lib/                    # Configuration and utility abstractions
│   │   ├── firebase.ts         # Firebase app, auth, and Firestore database initialization
│   │   ├── gemini.ts           # Client-side gateway calling /api/gemini proxy
│   │   ├── syncStorage.ts      # Bi-directional Firestore ↔ LocalStorage realtime synchronizer
│   │   └── utils.ts            # ClassName merging and formatting helpers (clsx, twMerge)
│   ├── pages/                  # Role-based view controllers and route targets
│   │   ├── ApplicationTracker.tsx # Student dashboard tracking active internship applications
│   │   ├── CareerAdvisor.tsx   # Interactive AI conversational advisor powered by Gemini
│   │   ├── DashboardAnalytics.tsx # Overview analytics, placement metrics, and referral rates
│   │   ├── DiscoveryHub.tsx    # Searchable, filterable internship catalog with match scores
│   │   ├── DNAHub.tsx          # Career DNA resume ingestion, PDF parsing & manual builder
│   │   ├── LandingPage.tsx     # Hero page with dual Google/Email authentication modal
│   │   ├── ProfilePage.tsx     # User profile, role configuration, and credential manager
│   │   ├── ReferralDesk.tsx    # Alumnus portal for approving and reviewing referral queues
│   │   └── VerificationDesk.tsx# Alumnus employment proof & corporate verification desk
│   ├── store/                  # Zustand persistent reactive state stores
│   │   ├── useApplicationStore.ts # Application records and milestone lifecycle
│   │   ├── useAuthStore.ts     # User authentication state, roles, and Firestore bindings
│   │   ├── useBookmarkStore.ts # Saved internship favorites management
│   │   ├── useChatStore.ts     # Unread counters and conversation message buffers
│   │   ├── useNotificationStore.ts # Global toast dispatch and lifecycle management
│   │   └── useReferralStore.ts # Referral queue lifecycle, capacity caps & status resolution
│   ├── App.css / index.css     # Global Tailwind CSS directives and theme variables
│   ├── App.tsx                 # Root router, dynamic theme switcher & route guards
│   └── main.tsx                # React DOM entry point
├── .env.example                # Template of required client & server environment keys
├── eslint.config.js            # ESLint code quality configuration
├── index.html                  # HTML5 application shell
├── package.json                # Project dependencies, metadata, and build scripts
├── postcss.config.js           # PostCSS plugin configurations
├── tailwind.config.js          # Tailwind CSS theme extensions
├── tsconfig.json               # TypeScript workspace and compiler specifications
└── vercel.json                 # Vercel deployment rewrites for API and SPA routing
```

---

## Local Setup & Environment Configuration

### Prerequisites
- **Node.js**: $\ge$ 18.0.0
- **Package Manager**: npm or yarn
- **Firebase Project**: Cloud Firestore and Firebase Authentication (Google & Email/Password providers enabled)
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/adithya181206/InternHub.git
cd InternHub
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY="AIzaSyYourFirebaseApiKey"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Google Gemini API Key (Direct Client-side Fallback)
VITE_GEMINI_API_KEY="your-gemini-api-key"

# Server-side Gemini API Key (for Vercel Serverless Function proxy at /api/gemini)
GEMINI_API_KEY="your-gemini-api-key"
```

### Step 3: Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start the app.

---

## Database Schema Overview (Firestore Collections)

InternHub uses Cloud Firestore with transparent dual-syncing through `syncStorage.ts`:

| Collection | Document ID / Path | Key Fields | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `users/{uid}` | `uid`, `email`, `displayName`, `role` (`'student'` \| `'alumnus'`), `isVerified`, `verifiedCompany`, `dailyApiCount`, `hasResume` | Stores primary user authentication identities and verification privileges. |
| `user_data` | `user_data/{uid}_mock_applications` | `value: string (JSON array)` | Tracks student application milestones and submission dates. |
| `user_data` | `user_data/{uid}_mock_bookmarks` | `value: string (JSON array)` | Stores saved internship opportunities bookmarked by the user. |
| `user_data` | `user_data/mock_dna_{uid}` | `value: string (JSON object)` | Persists parsed Career DNA (education, experience, projects, skills, summary). |
| `user_data` | `user_data/mock_resume_file_{uid}` | `value: string (Base64 data)` | Stores base64-encoded PDF resume file for direct alumnus review. |
| `global` | `global/mock_referrals` | `value: string (JSON array)` | Central synchronized referral pool across all students and corporate alumni. |
| `global` | `global/mock_chat_messages` | `value: string (JSON array)` | Active discussion thread logs between matched students and alumni. |

---

## Future Roadmap

| Milestone | Feature | Implementation Strategy |
| :---: | :--- | :--- |
| **01** | **Automated LinkedIn Profile Import** | Ingest student experiences, certifications, and recommendations via OAuth profile sync. |
| **02** | **Email & Push Notifications** | Deliver instantaneous updates on referral approval/rejection via Firebase Cloud Messaging (FCM). |
| **03** | **Multi-Version Resume Vault** | Allow students to maintain tailored resume variations targeting distinct engineering domains. |
| **04** | **AI Mock Interview Sandbox** | Interactive Gemini-driven interview simulations tailored to specific job listings. |

---

## Author & License

- **Author**: **Etikala Adithya**
- **Institution**: B.Tech Computer Science and Engineering, B V Raju Institute of Technology (BVRIT)
- **Profile**: [github.com/adithya181206](https://github.com/adithya181206)
- **License**: Released under the [MIT License](LICENSE).
