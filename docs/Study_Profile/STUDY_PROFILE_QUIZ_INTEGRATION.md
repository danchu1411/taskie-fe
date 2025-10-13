# Study Profile Quiz Integration Guide

## Overview

Users should complete a study profile quiz before using AI Suggestions. The backend tracks this via `hasStudyProfile` flag in user object.

**Quiz Data:**
- **Chronotype**: 0=MorningWarrior, 1=NightOwl, 2=Flexible
- **Focus Style**: 0=DeepFocus, 1=SprintWorker, 2=Multitasker
- **Work Style**: 0=DeadlineDriven, 1=SteadyPacer

**IMPORTANT**: Work Style only accepts 0 or 1 (database constraint). Do NOT send 2.

## Frontend Flow

### 1. Check hasStudyProfile on Login/Signup

All auth endpoints (login, signup, refresh, Google login) include `hasStudyProfile` in user object:

```javascript
const { user, tokens } = await login(email, password);

if (!user.hasStudyProfile) {
  // Show quiz modal or redirect
  router.push('/quiz');
}
```

### 2. Submit Quiz Results

Map quiz answers to numeric values and POST to `/api/study-profile`:

```javascript
// Example: Map quiz answers to values
const quizResults = {
  chronotype: 0,    // Based on "Are you a morning person?" answer
  focusStyle: 1,    // Based on work preference questions
  workStyle: 0      // MUST be 0 or 1 only
};

const response = await fetch('/api/study-profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(quizResults)
});

if (response.ok) {
  // Update local user state
  user.hasStudyProfile = true;
}
```

### 3. Get Existing Profile

```javascript
const response = await fetch('/api/study-profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const profile = await response.json();
  // { user_id, chronotype, focusStyle, workStyle, updated_at }
}
```

### 4. Value Mappings (TypeScript)

```typescript
enum Chronotype {
  MorningWarrior = 0,
  NightOwl = 1,
  Flexible = 2
}

enum FocusStyle {
  DeepFocus = 0,
  SprintWorker = 1,
  Multitasker = 2
}

enum WorkStyle {
  DeadlineDriven = 0,
  SteadyPacer = 1
  // NO VALUE 2 - Database constraint
}
```

## Current Behavior

- **Soft Enforcement**: AI Suggestions work WITHOUT study profile
- **Backend logs warning** when profile is missing
- **Future**: May become hard requirement (403 error)

## Error Handling

```javascript
try {
  await submitQuiz(quizResults);
} catch (error) {
  if (error.status === 400) {
    // Validation error - check values
    if (error.message.includes('workStyle')) {
      console.error('Invalid workStyle - must be 0 or 1');
    }
  }
}
```

## Migration Notes

- Existing users: `hasStudyProfile = false` (NULL timestamp)
- After completing quiz: `hasStudyProfile = true`
- Profile can be updated multiple times (upsert)

