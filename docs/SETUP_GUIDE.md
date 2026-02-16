# UNHEARD Application - Setup & Deployment Guide

## Overview

The UNHEARD application is a fully dynamic, Firebase-powered platform designed for accessible communication and learning. This guide will walk you through setting up and deploying the application.

## Prerequisites

- Node.js 18+ and npm
- Firebase account (free tier is sufficient for development)
- Google AI Studio API key (for Gemini AI features)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/saikrishna1605/unsaid.git
cd unsaid
npm install
```

### 2. Firebase Setup

The application is already configured with Firebase. The configuration is in `src/firebase/config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyDrznqGAx1l2UCdedvfKyZ0j7biwfmFaiw",
  authDomain: "studio-7159486057-b2d89.firebaseapp.com",
  projectId: "studio-7159486057-b2d89",
  storageBucket: "studio-7159486057-b2d89.appspot.com",
  messagingSenderId: "826787982444",
  appId: "1:826787982444:web:f5c8eafbe12313d4163c49"
};
```

### 3. Seed the Database

Populate Firestore with initial data:

```bash
npm run seed
```

This creates:
- Learning tracks (6)
- Sample lessons (3)
- News articles (3)
- AAC communication items (12)

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required for AI features
GOOGLE_GENAI_API_KEY=your_api_key_here

# Optional customization
NEXT_PUBLIC_APP_TITLE=UNHEARD
NEXT_PUBLIC_GEMINI_MODEL=googleai/gemini-2.5-flash
```

Get your Google AI Studio API key from: https://makersuite.google.com/app/apikey

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at http://localhost:9002

## Architecture

### Technology Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: Firebase (Firestore + Authentication)
- **AI**: Google Gemini via Genkit
- **Styling**: Tailwind CSS + Radix UI
- **TypeScript**: Full type safety

### Key Features

1. **Dynamic Content Management**
   - All content stored in Firestore
   - No hardcoded data
   - Real-time updates

2. **User Authentication**
   - Anonymous sign-in for privacy
   - User profiles with accessibility preferences
   - Secure role-based access control

3. **Learning System**
   - Dynamic learning tracks and lessons
   - AI-generated quizzes
   - Progress tracking per user

4. **Community Features**
   - Post sharing
   - Comments and reactions
   - Real-time updates

5. **Volunteer System**
   - Help request creation
   - Volunteer matching
   - Live session rooms with chat

6. **Accessibility Tools**
   - AAC (Augmentative and Alternative Communication)
   - Text-to-speech
   - Voice input
   - Sign language support
   - Easy-read versions

7. **Mood Tracking**
   - Daily reflections
   - AI-generated insights
   - Music/soundscape recommendations
   - History tracking

## Firebase Collections

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

Core collections:
- `users` - User profiles and subcollections
- `posts` - Community posts with comments/reactions
- `help_requests` - Volunteer requests
- `volunteer_offers` - Help offers
- `sessions` - Live support sessions
- `learning_tracks` - Learning categories
- `lessons` - Educational content
- `news_articles` - News with AI summaries
- `aac_items` - Communication items
- `roles_admin` - Admin privileges

## Security

### Firestore Security Rules

The application implements comprehensive security rules:

1. **User Data**: Strictly isolated per user
2. **Public Content**: Read-only for non-admins
3. **Community**: Owner-only writes, public reads
4. **Sessions**: Participant-only access
5. **Admin**: Protected administrative functions

Rules are defined in `firestore.rules`.

### Authentication Flow

1. User visits application
2. Anonymous sign-in initiated
3. Profile created with preferences
4. Access granted to authenticated features

## Admin Setup

### Creating Admin Users

Admins can manage learning content, news articles, and AAC items.

To create an admin:

1. Sign in to the application
2. Get your User ID from Firebase Console
3. Add a document to `roles_admin` collection:

```javascript
// In Firebase Console Firestore
Collection: roles_admin
Document ID: {userId}
Fields:
  userId: {userId}
  grantedAt: Timestamp.now()
  grantedBy: "system"
```

### Admin Capabilities

Admins can:
- Create/edit learning tracks
- Create/edit lessons
- Create/edit news articles
- Create/edit AAC items
- Manage other admins

## AI Features Configuration

### Gemini Models

The application uses Google's Gemini models:

- **Main Model**: `gemini-2.5-flash` (fast, efficient)
- **Vision Model**: For image analysis
- **Audio Model**: For transcription

### Genkit Flows

Located in `src/ai/flows/`:

1. `chat-agent.ts` - AI assistant conversations
2. `transcribe-audio.ts` - Voice to text
3. `describe-surroundings.ts` - Image description
4. `read-text-from-image.ts` - OCR
5. `generate-easy-read-version.ts` - Accessible text
6. `generate-lesson-quiz.ts` - Quiz generation
7. `generate-sign-cards-from-text.ts` - Sign language
8. `interpret-sign-language.ts` - Sign recognition
9. `summarize-article-with-sign-cards.ts` - News summaries
10. `daily-reflection-ai.ts` - Mood reflections

## Deployment

### Firebase Hosting

The application is configured for Firebase Hosting:

```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy
```

Configuration is in `apphosting.yaml`.

### Environment Setup

For production deployment:

1. Set environment variables in Firebase Console
2. Configure custom domain (optional)
3. Enable Firebase services:
   - Authentication (Anonymous provider)
   - Firestore
   - Hosting

## Testing

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Manual Testing Checklist

- [ ] User registration and profile creation
- [ ] Learning tracks and lessons load
- [ ] Quiz generation and scoring
- [ ] Community post creation
- [ ] Comments and reactions
- [ ] Help request creation
- [ ] Volunteer offer flow
- [ ] Session room chat
- [ ] News articles and summaries
- [ ] AAC communication
- [ ] Mood tracking and recommendations
- [ ] AI assistant conversations

## Troubleshooting

### Common Issues

**Issue**: "Permission denied" errors in Firestore  
**Solution**: Check security rules and ensure user is authenticated

**Issue**: AI features not working  
**Solution**: Verify `GOOGLE_GENAI_API_KEY` is set correctly

**Issue**: Empty collections  
**Solution**: Run `npm run seed` to populate database

**Issue**: Build fails  
**Solution**: Run `npm install` and check Node.js version (18+)

### Getting Help

- Check Firebase Console for errors
- Review browser console for client-side issues
- Check Firestore rules simulator for permission issues

## Production Checklist

Before going live:

- [ ] Run database seed script
- [ ] Set up Firebase authentication
- [ ] Configure environment variables
- [ ] Review and deploy security rules
- [ ] Set up Firebase backups
- [ ] Configure custom domain
- [ ] Test all user flows
- [ ] Enable Firebase Analytics (optional)
- [ ] Set up error monitoring
- [ ] Configure CORS for external resources

## Maintenance

### Regular Tasks

1. **Weekly**: Review user feedback and logs
2. **Monthly**: Update dependencies
3. **Quarterly**: Review and update content
4. **As Needed**: Add new learning tracks/lessons

### Content Management

Add new content through Firebase Console or admin panel:

1. Navigate to Firestore
2. Select collection
3. Add document with required fields
4. Content appears instantly in app

## Support

For issues or questions:
- GitHub Issues: https://github.com/saikrishna1605/unsaid/issues
- Documentation: https://github.com/saikrishna1605/unsaid/docs

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-16
