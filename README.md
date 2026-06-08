# SKKSV Scholar — School Management & Assessment Platform

[![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![React Router](https://img.shields.io/badge/React_Router_7-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com)

A production-grade, single-page application built for **Sri Kanchi Kamakoti Sankara Vidyalaya** — a CBSE-affiliated school in Podili, Andhra Pradesh. The platform handles online assessments, timed examinations, holiday homework distribution, staff directory, media gallery, feedback collection, and real-time notifications — all with an integrated AI assistant.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI** | React 18 + Vite 5 | Component-based SPA with instant HMR and optimized builds |
| **Routing** | React Router v7 | Declarative routing with lazy loading |
| **Styling** | Tailwind CSS v3.4 + CSS Variables | Utility-first responsive design with dark mode & glassmorphism |
| **Animation** | Framer Motion v12 | Spring-based UI transitions and gesture-driven interactions |
| **Database** | Firebase Firestore | Real-time NoSQL document store with server timestamps |
| **File Storage** | Cloudinary | Image upload, transformation, and CDN delivery |
| **Auth** | Environment-keyed access | Admin master key, teacher secret keys, pre-assessment keys |
| **AI** | Groq API (Llama 3.3 70B) + Local Intent Engine | Context-aware AI assistant with fallback knowledge base |
| **State** | React Context API | Theme, layout, notification, and admin auth contexts |
| **Export** | xlsx | Excel report generation for assessment results |

---

## Features

### Assessment Engine
- **Dual Assessment Modes** — Standard assessments (offline-timed) and timed assessments (date-windowed, auto-graded)
- **Hierarchical Navigation** — Exam Type → Class → Subject flow with Firestore-driven data
- **Smart Question Selection** — Section-based random picks (e.g. pick 20 from questions 1-50)
- **Multi-format Questions** — Single choice, multiple choice (checkboxes), and project submissions
- **Negative Marking** — Configurable per-assessment penalty fraction
- **Timer System** — Countdown with color-state warnings (yellow at 3min, red pulse at 1min)
- **Keyboard Navigation** — A/B/C/D keys, Enter to submit, arrows to navigate
- **Pre-Assessment Gating** — Teacher-provided key required before starting
- **Answer Reveal** — Optional secret key to view correct answers post-exam

### Grading & Reports
- **CBSE-style 8-point Grading** — A1 (91%+) through E (<33%) with color coding
- **Instant Results** — Percentage, grade, performance message, and achievement certificate
- **Teacher Reports** — Sortable, filterable table with export to `.xlsx`
- **Question Analysis** — Per-question breakdown showing student vs correct answer
- **Performance Messages** — Contextual feedback based on score bands

### Media & Content
- **Image Gallery** — Category-filtered grid with fullscreen viewer and sub-category tabs
- **Staff Directory** — Hierarchical org chart with modal profiles and avatar generation
- **Holiday Homework** — Structured content delivery with projects, materials, and grading criteria
- **Image Carousel** — Auto-rotating hero banner on the home page (Firestore + Cloudinary)

### Communication
- **Real-time Notifications** — Firestore `onSnapshot` subscription with read/cleared state persisted in localStorage
- **Feedback System** — Severity-graded submissions with admin resolution workflow
- **Sankara AI Assistant** — Floating chatbot (bottom-left) with two-tier intelligence:
  - **Groq LLM** (Llama 3.3 70B) — contextual answers about school, navigation, assessments
  - **Local Fallback** — regex intent matcher with 15+ intents covering school info, grading, app guidance
  - Auto-hides during active quizzes via context-driven visibility

### Admin Panel
- **Assessment CRUD** — Form-based and raw JSON creation; inline editing and deletion
- **Notification Publisher** — Compose and schedule notifications with expiry
- **Feedback Moderation** — View, filter by severity, resolve submissions
- **Image Manager** — Browse, filter, edit metadata, and delete images (Cloudinary + Firestore sync)
- **Infrastructure** — Protected by master key (`VITE_ADMIN_KEY`), session persisted across navigation

### User Experience
- **Dark Mode** — Light/dark/system theme with smooth transition
- **Responsive Design** — Mobile-first, works seamlessly from 375px to 4K
- **Keyboard Shortcuts** — Full keyboard navigation in quizzes
- **Accessibility** — ARIA labels, semantic HTML, focus management, reduced-motion support
- **Glassmorphism** — Frosted glass cards with backdrop blur and subtle shadows
- **PWA-ready** — Manifest, meta tags, optimized chunking

---

## Firebase Data Model

| Collection | Purpose | Key Fields |
|---|---|---|
| `examTypes` | Enabled exam type registry | `examType`, `enabled` |
| `examIndex` | Class-subject lookup | `examType`, `classNum`, `subject` |
| `examConfigs` | Full exam config with questions | `title`, `teacher`, `questions[].options[]`, `isCorrect`, `timeLimitMinutes` |
| `quizResults` | Assessment submissions | `studentInfo`, `results.grade`, `results.percentage`, `timestamp` |
| `timedAssessments` | Date-windowed assessments | `startDateTime`, `endDateTime`, `assessmentType` (MCQ/Project) |
| `timedSubmissions` | Timed assessment answers | `answers`, `results`, `timeTaken`, `fileUrl` |
| `notifications` | Push notifications | `title`, `message`, `expiresAt`, `isDeleted` |
| `feedback` | User feedback | `name`, `message`, `severity`, `status` |
| `images` | Image metadata | `url`, `publicId`, `categories`, `subCategory` |
| `analytics` | Page view counter | `pageViews` |

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │      Cloudinary CDN          │
                    │   (image upload & serving)   │
                    └──────────┬──────────────────┘
                               │
┌──────────┐     ┌────────────┴──────────────────┐
│  Groq    │     │        Firebase Firestore      │
│  API     │     │  (examConfigs, quizResults,    │
│ (LLaMA)  │     │   notifications, images, ...)  │
└────┬─────┘     └────────────┬──────────────────┘
     │                        │
     └─────────┬──────────────┘
               │
     ┌─────────▼────────────────────────┐
     │      React SPA (Vite build)       │
     │                                   │
     │  Contexts: Theme, Layout, Admin,  │
     │  Notification, Sankara            │
     │                                   │
     │  Router: /, /assessments, /admin, │
     │  /gallery, /people, /feedback ... │
     │                                   │
     │  AI: Sankara (local + Groq)       │
     │  Notifications: real-time widget   │
     └───────────────────────────────────┘
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/your-org/quiz-app.git
cd quiz-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase + Cloudinary + Groq credentials

# Start development server (port 3000)
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Environment Variables

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Admin master key (required)
VITE_ADMIN_KEY=

# Cloudinary (for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_API_KEY=
VITE_CLOUDINARY_API_SECRET=

# Groq AI (optional — enables LLM chatbot)
# Get free key at https://console.groq.com
VITE_GROQ_API_KEY=
```

---

## Project Structure

```
src/
├── main.jsx                     # Entry point (ThemeProvider + Suspense)
├── App.jsx                      # Root: Router, Providers, Layout, Widgets
├── index.css                    # Tailwind + CSS variables + keyframes
├── firebase.js                  # Firebase init
│
├── config/
│   └── schoolConfig.js          # School info, grading scale, exam types
│
├── context/
│   ├── ThemeContext.jsx          # Light/dark/system theme
│   ├── LayoutContext.jsx        # Header/footer visibility
│   ├── AdminAuthContext.jsx     # Admin authentication
│   ├── NotificationContext.jsx  # Real-time notification state
│   └── SankaraContext.jsx       # AI + notification widget visibility
│
├── components/
│   ├── HomeScreen.jsx           # Landing: carousel, school info, features
│   ├── AssessmentsScreen.jsx    # Full assessment flow (exam-type → result)
│   ├── TimedAssessmentScreen.jsx # Timed assessment flow (classes → result)
│   ├── QuizScreen.jsx           # Quiz UI with timer + keyboard nav
│   ├── QuestionCard.jsx         # Question display (single/multiple choice)
│   ├── ResultScreen.jsx         # Score, grade, certificate, analysis
│   ├── ReportsScreen.jsx        # Teacher reports + Excel export
│   ├── Timer.jsx                # Countdown with color states
│   ├── StaffDirectoryScreen.jsx # Org chart + person modals
│   ├── GalleryScreen.jsx        # Category-filtered photo grid
│   ├── ContactScreen.jsx        # School contact info
│   ├── FeedbackScreen.jsx       # Feedback submission form
│   ├── HolidayHomeworkScreen.jsx# Holiday homework viewer
│   ├── Header.jsx               # Navigation header (dropdown + hamburger)
│   ├── Footer.jsx               # Page view counter footer
│   ├── FloatingWidget.jsx       # Shared floating button + panel component
│   ├── ChatBot.jsx              # Sankara AI assistant widget
│   ├── NotificationWidget.jsx   # Notification bell + list widget
│   ├── ImageModal.jsx           # Fullscreen image viewer
│   ├── PersonModal.jsx          # Staff profile modal
│   ├── ConfirmModal.jsx         # Reusable confirmation dialog
│   ├── EmptyState.jsx           # Empty/no-content state
│   └── admin/
│       ├── AdminLayout.jsx      # Admin shell (sidebar + auth gate)
│       ├── AdminPanel.jsx       # Dashboard with navigation cards
│       ├── MakeAssessment.jsx   # Assessment creator (form + JSON)
│       ├── ShowAssessments.jsx  # Assessment browser + manager
│       ├── MakeNotification.jsx # Notification composer
│       ├── FeedbackReportsScreen.jsx # Feedback moderation
│       ├── AdminImages.jsx      # Image browser + manager
│       └── UploadImage.jsx      # Image upload (Cloudinary)
│
├── services/
│   ├── firebaseService.js       # Page views, saveQuizResult
│   ├── imageService.js          # Image CRUD (Firestore)
│   ├── cloudinaryService.js     # Cloudinary upload/delete
│   ├── notificationService.js   # Firestore notification subscription
│   ├── timedAssessmentService.js# Timed assessment CRUD
│   └── sankaraAI.js             # AI engine (Groq API + local intents)
│
├── utils/
│   ├── auth.js                  # Key validation
│   ├── examLoader.js            # Lazy-loaded exam configs
│   ├── shuffle.js               # Fisher-Yates + section selection
│   ├── scoring.js               # Grading + negative marking
│   ├── format.js                # Name formatting
│   └── excelExport.js           # Excel report generation
│
└── data/
    ├── staffDirectory.json      # Staff profiles
    └── Exams/                   # Local exam fallback JSON files
```

---

## Future Roadmap

### Phase 1 — Role-Based Authentication (Next)
- **Student Login** — Individual accounts with class/subject assignments; personalized dashboard showing upcoming/past assessments, progress tracking, performance analytics over time, and revision history
- **Teacher Login** — Dedicated panel to create assessments, view class-wide analytics, track student progress per subject, manage question banks, and communicate announcements
- **Admin Dashboard** — School-wide analytics, user management, role assignment, system configuration UI (beyond current env-key model)

### Phase 2 — Academic Management
- **Attendance System** — Daily attendance tracking with student/teacher portals, monthly reports, SMS/email notifications for absenteeism
- **Fee Management** — Online fee collection, receipt generation, due-date tracking, payment history, partial payment support, and defaulter reports
- **Timetable** — Dynamic class schedules with teacher assignment, room allocation, and period management
- **Question Banks** — Searchable repository of questions by subject/chapter/difficulty; bulk import from Excel; random paper generation with blueprint adherence
- **Lesson Plans** — Structured lesson planning with objectives, activities, resources, and assessment links; curriculum mapping to CBSE guidelines
- **Year Plans** — Annual academic calendar with syllabus distribution, exam schedules, and holiday planning

### Phase 3 — Multi-Platform Ecosystem
- **Parent Mobile App** (React Native / Flutter) — Real-time push notifications, fee payments, attendance monitoring, exam results, teacher communication, event calendar
- **Teacher Mobile App** — Mark attendance on-the-go, quick feedback, class updates, timetable view
- **Student Mobile App** — Quiz taking optimized for mobile, homework submission via camera, instant result notifications
- **Offline Support** — PWA with service worker for offline assessment taking; sync results when online

### Phase 4 — Advanced AI & Analytics
- **AI Question Generator** — Generate questions from lesson content using LLM
- **Plagiarism Detection** — NLP-based similarity check for project submissions
- **Predictive Analytics** — Student performance prediction based on historical data
- **Smart Scheduling** — AI-optimized exam timetable generation
- **Voice Interface** — Sankara AI with speech-to-text for accessibility

---

## Key Highlights for Recruiters

- **Clean Architecture** — Separation of concerns with contexts, services, and utils; single-responsibility components
- **Real-time Data** — Live Firestore subscriptions for notifications and assessments
- **AI Integration** — Dual-mode chatbot with LLM (Groq + Llama 3.3) and deterministic fallback
- **Production-grade UI** — Dark mode, glassmorphism, spring animations, responsive design
- **Performance** — Vite-optimized chunks, lazy loading, CSS minification, manual Firebase/React chunking
- **Security** — Multiple key-gated access levels (admin, teacher, pre-assessment, answer-reveal)
- **Scalable Data Model** — Firestore collections designed for multi-role, multi-class, multi-subject expansion
- **PWA-ready** — Manifest, meta tags, optimized asset delivery
- **Full Test Coverage** — Keyboard navigation, accessibility (ARIA, focus management, reduced motion), form validation (Indian phone numbers, email, min-length messages)

---

## Developer

**Vishnu** — Full-stack developer passionate about building educational technology that makes a difference.

Built with React, Firebase, Tailwind CSS, and a lot of chai ☕

---

> ⚡ _This platform is actively used at Sri Kanchi Kamakoti Sankara Vidyalaya for day-to-day academic operations._
