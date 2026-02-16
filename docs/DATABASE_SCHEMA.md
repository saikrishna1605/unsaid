# Firebase Database Schema Documentation

## Overview

The UNHEARD application uses Firebase Firestore as its primary database. All data is stored dynamically and securely with proper authentication and access control.

## Collections

### 1. Users (`/users/{userId}`)

**Description**: User profile and account information  
**Security**: Users can only read/write their own profile

**Schema**:
```typescript
{
  id: string;              // User ID (matches auth UID)
  name: string;            // Display name
  role: string;            // User role (e.g., "Primary user")
  accessibilityPreferences: string;  // JSON string of preferences
}
```

#### Subcollections

##### 1.1 Chats (`/users/{userId}/chats/{chatId}`)
User's private chat history with AI assistant

```typescript
{
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'model';
    content: string;
    imageUrl?: string;
  }>;
  createdAt: Timestamp;
  userId: string;
}
```

##### 1.2 Learning Progress (`/users/{userId}/learning_progress/{lessonId}`)
Tracks user's learning journey and quiz scores

```typescript
{
  lessonId: string;
  lessonTitle: string;
  track: string;
  trackSlug: string;
  score: number;           // Quiz score
  totalQuestions: number;  // Total quiz questions
  completedAt: Timestamp;
  lastAttemptAt: Timestamp;
}
```

##### 1.3 Mood History (`/users/{userId}/mood_history/{moodId}`)
User's mood tracking and reflections

```typescript
{
  mood: 'positive' | 'neutral' | 'negative';
  input: string;           // User's input
  reflection: string;      // AI-generated reflection
  timestamp: Timestamp;
}
```

---

### 2. Posts (`/posts/{postId}`)

**Description**: Community posts created by users  
**Security**: All authenticated users can read; only author can write/delete

**Schema**:
```typescript
{
  id: string;
  userId: string;
  userName: string;
  rawContent: string;
  createdAt: Timestamp;
}
```

#### Subcollections

##### 2.1 Comments (`/posts/{postId}/comments/{commentId}`)
```typescript
{
  id: string;
  userId: string;
  userName: string;
  content: string;
  postId: string;
  createdAt: Timestamp;
}
```

##### 2.2 Reactions (`/posts/{postId}/reactions/{reactionId}`)
```typescript
{
  id: string;              // Same as userId
  userId: string;
  type: 'like' | 'support' | 'celebrate';
  postId: string;
}
```

---

### 3. Help Requests (`/help_requests/{requestId}`)

**Description**: Requests for volunteer help  
**Security**: All authenticated users can read; only author can modify

**Schema**:
```typescript
{
  id: string;
  description: string;
  userId: string;
  createdAt: Timestamp;
  status: 'open' | 'matched' | 'completed';
  duration: number;        // Expected duration in minutes
}
```

---

### 4. Volunteer Offers (`/volunteer_offers/{offerId}`)

**Description**: Offers to help with requests  
**Security**: All authenticated users can read; only author can modify

**Schema**:
```typescript
{
  id: string;
  userId: string;
  userName: string;
  helpRequestId: string;
  status: 'pending' | 'accepted' | 'rejected';
}
```

---

### 5. Sessions (`/sessions/{sessionId}`)

**Description**: Live support sessions between users  
**Security**: Only participants can access

**Schema**:
```typescript
{
  id: string;
  helpRequestId: string;
  participantIds: string[];  // Array of user IDs
  status: 'active' | 'completed';
  chatLog: Array<{
    userId: string;
    userName: string;
    content: string;
    timestamp: Timestamp;
  }>;
  createdAt: Timestamp;
}
```

---

### 6. Learning Tracks (`/learning_tracks/{trackId}`)

**Description**: Categories of learning content  
**Security**: Public read; admin write

**Schema**:
```typescript
{
  id: string;
  title: string;
  slug: string;            // URL-friendly identifier
  description: string;
  order?: number;          // Display order
}
```

---

### 7. Lessons (`/lessons/{lessonId}`)

**Description**: Educational content within tracks  
**Security**: Public read; admin write

**Schema**:
```typescript
{
  id: string;
  title: string;
  track: string;           // Track title
  trackSlug: string;       // Track slug for URL
  text: string;            // Lesson content
  order?: number;          // Display order within track
}
```

---

### 8. News Articles (`/news_articles/{articleId}`)

**Description**: News content with AI-powered summaries  
**Security**: Public read; admin write

**Schema**:
```typescript
{
  id: string;
  title: string;
  imageUrl: string;
  imageHint?: string;      // Hint for AI image description
  content: string;
  createdAt: Timestamp;
}
```

---

### 9. AAC Items (`/aac_items/{itemId}`)

**Description**: Augmentative and Alternative Communication items  
**Security**: Authenticated read; admin write

**Schema**:
```typescript
{
  id: string;
  label: string;           // Display text
  iconName: string;        // Lucide icon name
  category?: string;       // Optional grouping
  order?: number;          // Display order
}
```

---

### 10. Admin Roles (`/roles_admin/{userId}`)

**Description**: Administrator privilege management  
**Security**: Only admins can read/write

**Schema**:
```typescript
{
  userId: string;          // User ID with admin privileges
  grantedAt: Timestamp;    // When privileges were granted
  grantedBy: string;       // Who granted the privileges
}
```

---

## Security Rules Summary

1. **User Isolation**: Users can only access their own data under `/users/{userId}`
2. **Ownership Model**: Public collections use `userId` field for write validation
3. **Admin Privileges**: Admin-only collections require entry in `/roles_admin`
4. **Collaborative Access**: Sessions use `participantIds` array for access control
5. **Public Read**: Learning content and news are publicly readable but admin-managed

## Indexing Recommendations

For optimal performance, create these composite indexes in Firestore:

1. **Posts**: `userId` + `createdAt` (DESC)
2. **Help Requests**: `status` + `createdAt` (DESC)
3. **Lessons**: `trackSlug` + `order` (ASC)
4. **Learning Progress**: `userId` + `completedAt` (DESC)

## Data Seeding

To populate the database with initial data, run:

```bash
npm run seed
```

This will create:
- 6 learning tracks
- 3 sample lessons
- 3 news articles
- 12 AAC communication items

## Real-time Updates

All collections support real-time updates through Firestore's snapshot listeners. The application uses custom React hooks (`useCollection`, `useDoc`) for automatic real-time synchronization.

## Backup and Export

Regular backups should be configured in Firebase Console:
- Recommended: Daily automated backups
- Export location: Cloud Storage bucket
- Retention: 30 days minimum

---

**Last Updated**: 2026-02-16  
**Version**: 1.0.0
