# UNHEARD - Accessible Communication & Learning Platform

A fully dynamic, Firebase-powered application designed to break down communication barriers and provide accessible learning for all.

## 🌟 Features

### Dynamic Content Management
- **All data stored in Firebase Firestore** - No hardcoded content
- Real-time updates across all users
- Scalable architecture supporting unlimited content

### Core Functionalities

#### 1. **User Mode Selection**
- Anonymous authentication for privacy
- Personalized accessibility preferences
- Role-based access control

#### 2. **Learning System**
- Dynamic learning tracks fetched from Firebase
- AI-generated quizzes for each lesson
- Progress tracking with scores stored per user
- Multiple accessibility formats (audio, easy-read, sign language)

#### 3. **Community Features**
- Create and share posts dynamically
- Real-time comments and reactions
- User-owned content with full CRUD operations

#### 4. **Volunteer Hub**
- Request help with specific needs
- Offer volunteer services
- Live matching system
- Real-time session rooms with chat

#### 5. **Communication Tools**
- AAC (Augmentative and Alternative Communication) with dynamic items from Firebase
- Text-to-speech
- Voice input with AI transcription
- Sign language support
- Image-to-text OCR

#### 6. **Mood Tracking & Wellness**
- Daily reflection with AI insights
- Mood history tracking in Firebase
- Personalized music/soundscape recommendations
- Privacy-focused mood journaling

#### 7. **News & Information**
- Dynamic news articles from Firestore
- AI-powered summaries (audio, easy-read, key facts, sign cards)
- Multiple accessibility formats

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Seed the database with initial data
npm run seed

# Run development server
npm run dev
```

Visit http://localhost:9002 to see the application.

## 📚 Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md) - Complete setup and deployment instructions
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Firestore collections and security rules
- [Optimization Notes](./OPTIMIZATION_NOTES.md) - Performance optimizations

## 🔥 Firebase Integration

### Collections
- `users` - User profiles with subcollections for chats, progress, mood
- `posts` - Community posts with comments and reactions
- `learning_tracks` - Dynamic learning categories
- `lessons` - Educational content
- `news_articles` - News with AI summaries
- `aac_items` - Communication items
- `help_requests` - Volunteer requests
- `volunteer_offers` - Help offers
- `sessions` - Live support sessions
- `roles_admin` - Admin privileges

### Real-time Features
- Live chat in sessions
- Instant post/comment updates
- Progress tracking
- Mood history

## 🛡️ Security

Comprehensive Firestore security rules ensure:
- User data isolation
- Owner-only writes for user-generated content
- Admin-only access for content management
- Participant-only access for sessions

## 🤖 AI Features

Powered by Google Gemini via Genkit:
- AI assistant conversations
- Voice transcription
- Image description and OCR
- Easy-read text generation
- Quiz generation
- Sign language interpretation
- News summarization
- Daily reflections

## 🎨 Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Firebase (Firestore + Authentication)
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS + Radix UI
- **Real-time**: Firestore snapshot listeners

## 📦 Project Structure

```
src/
├── ai/                 # Genkit AI flows
├── app/                # Next.js pages
├── components/         # Reusable UI components
├── firebase/           # Firebase configuration and hooks
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── types/              # TypeScript definitions

scripts/
└── seed-database.ts    # Database seeding script

docs/
├── DATABASE_SCHEMA.md  # Firestore schema
└── SETUP_GUIDE.md      # Setup instructions
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
GOOGLE_GENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_TITLE=UNHEARD
```

### Firebase Config

Configuration is in `src/firebase/config.ts`. No changes needed for the default setup.

## 🎯 Key Implementation Details

### No Hardcoded Data
- Learning tracks: Fetched from `learning_tracks` collection
- Lessons: Queried by `trackSlug` from `lessons` collection
- News: Loaded from `news_articles` with timestamps
- AAC Items: Dynamic from `aac_items` with custom icons

### User Progress
- Quiz scores saved to `users/{userId}/learning_progress/{lessonId}`
- Timestamps track completion and attempts
- Full history maintained

### Mood Tracking
- Moods stored in `users/{userId}/mood_history/{timestamp}`
- Includes input, reflection, and mood type
- Powers music recommendations

## 🚢 Deployment

```bash
# Build production bundle
npm run build

# Deploy to Firebase
firebase deploy
```

## 📊 Production Readiness

✅ Dynamic data management  
✅ Secure authentication  
✅ Real-time synchronization  
✅ Comprehensive security rules  
✅ Progress tracking  
✅ Mood history  
✅ Admin role management  
✅ Type-safe code  
✅ Performance optimized  
✅ Scalable architecture

## 🤝 Contributing

This is a production application. For changes:
1. Test thoroughly locally
2. Run type checking: `npm run typecheck`
3. Run linting: `npm run lint`
4. Ensure security rules are updated if schema changes

## 📝 License

Private - All rights reserved

---

**Built with ❤️ for accessibility and inclusion**
