# Study Profile Quiz Implementation Plan

## Executive Summary

Triển khai hệ thống quiz Study Profile cho Taskie frontend với:

- **Dedicated route** `/study-profile/quiz` cho trải nghiệm toàn trang
- **Soft enforcement** với infrastructure sẵn sàng cho hard block
- **Dual access**: Navigation menu + Settings page
- **2-3 câu hỏi/nhóm** (6-9 câu total) với quiz logic thông minh
- **Profile editing** với hiển thị answers cũ và upsert capability

---

## 1. Architecture Analysis

### 1.1 Current State

- **Auth system**: Context-based (`AuthContext.tsx`), user stored in `auth-storage.ts`
- **User type**: `AuthUser` thiếu `hasStudyProfile` field
- **Router**: React Router v7, route guards trong `App.tsx`
- **State**: React Query cho data fetching, Context cho auth
- **API client**: Axios instance với interceptors (`lib/api.ts`)

### 1.2 Required Changes

- Extend `AuthUser` type với `hasStudyProfile?: boolean`
- Add study profile types và enums
- Create new feature module `features/study-profile/`
- Update routing với quiz route và guards
- Integrate với navigation components

---

## 2. Type System & API Layer

### 2.1 Type Definitions (`src/lib/types.ts`)

```typescript
// Study Profile Enums
export enum Chronotype {
  MorningWarrior = 0,
  NightOwl = 1,
  Flexible = 2
}

export enum FocusStyle {
  DeepFocus = 0,
  SprintWorker = 1,
  Multitasker = 2
}

export enum WorkStyle {
  DeadlineDriven = 0,
  SteadyPacer = 1
  // NO VALUE 2 - Database constraint
}

export interface StudyProfile {
  user_id: string;
  chronotype: Chronotype;
  focusStyle: FocusStyle;
  workStyle: WorkStyle;
  updated_at: string;
}

export interface StudyProfileFormData {
  chronotype: Chronotype;
  focusStyle: FocusStyle;
  workStyle: WorkStyle;
}
```

### 2.2 Auth User Extension (`src/features/auth/auth-storage.ts`)

```typescript
export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  hasStudyProfile?: boolean; // ADD THIS
};
```

### 2.3 API Client (`src/lib/api-study-profile.ts`)

```typescript
import api from './api';
import { StudyProfile, StudyProfileFormData } from './types';

export async function getStudyProfile(): Promise<StudyProfile | null> {
  try {
    const response = await api.get<StudyProfile>('/api/study-profile');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function saveStudyProfile(data: StudyProfileFormData): Promise<StudyProfile> {
  const response = await api.post<StudyProfile>('/api/study-profile', data);
  return response.data;
}
```

### 2.4 Study Profile Data Hook (`src/features/study-profile/hooks/useStudyProfileData.ts`)

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getStudyProfile, saveStudyProfile } from '../../../lib/api-study-profile';
import { StudyProfileFormData } from '../../../lib/types';

export function useStudyProfileData() {
  const { setAuthState, user, authState } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['study-profile'],
    queryFn: getStudyProfile,
    enabled: !!user?.hasStudyProfile
  });

  const saveProfileMutation = useMutation({
    mutationFn: saveStudyProfile,
    onSuccess: (newProfile) => {
      // CRITICAL: Update auth state immediately to sync hasStudyProfile
      if (user && authState) {
        const updatedUser = { ...user, hasStudyProfile: true };
        setAuthState({ user: updatedUser, tokens: authState.tokens });
      }
      
      // Update React Query cache
      queryClient.setQueryData(['study-profile'], newProfile);
    }
  });

  return { 
    profile, 
    isLoading, 
    error, 
    saveProfile: saveProfileMutation.mutate,
    isSaving: saveProfileMutation.isPending,
    saveError: saveProfileMutation.error
  };
}
```

### 2.5 AuthContext Updates (`src/features/auth/AuthContext.tsx`)

```typescript
// Update hydrateState to handle hasStudyProfile
const hydrateState = useCallback(
  (
    payload: AuthResponsePayload,
    remember?: boolean,
    options?: { promptVerification?: boolean },
  ) => {
    const snapshot: StoredAuthState = {
      user: {
        ...payload.user,
        emailVerified: Boolean(payload.user.emailVerified),
        hasStudyProfile: Boolean(payload.user.hasStudyProfile), // ADD THIS
      },
      tokens: payload.tokens,
    };
    setAuthState(snapshot, { remember });
    setVerification(normalizeVerification(payload.verification, snapshot.user));
    setShouldPromptVerification(Boolean(options?.promptVerification && !snapshot.user.emailVerified));
    setStatus("authenticated");
  },
  [setAuthState],
);

// Add method to update user profile
const updateUserProfile = useCallback((updates: Partial<AuthUser>) => {
  if (!authState) return;
  
  const updatedUser = { ...authState.user, ...updates };
  setAuthState({ ...authState, user: updatedUser });
}, [authState, setAuthState]);
```

---

## 3. Quiz Component Architecture

### 3.1 Module Structure

```
src/features/study-profile/
├── StudyProfileQuiz.tsx          # Main quiz page
├── components/
│   ├── QuizProgress.tsx          # Progress indicator
│   ├── QuizQuestion.tsx          # Question card component  
│   ├── QuizNavigation.tsx        # Next/Back buttons
│   └── QuizComplete.tsx          # Success screen
├── hooks/
│   ├── useStudyProfileQuiz.ts    # Quiz logic & state
│   └── useStudyProfileData.ts    # API calls with React Query
├── utils/
│   └── quizQuestions.ts          # Question definitions & mapping
├── i18n/
│   └── quizCopy.ts               # Internationalization support
└── types.ts                      # Local types
```

### 3.2 i18n Configuration (`i18n/quizCopy.ts`)

```typescript
// Setup i18n structure early to avoid refactoring later
export const QUIZ_COPY = {
  vi: {
    welcome: {
      title: "Khám phá phong cách học tập của bạn",
      description: "Trả lời 6-9 câu hỏi ngắn để AI hiểu bạn hơn và đưa ra gợi ý phù hợp nhất",
      estimatedTime: "⏱️ Chỉ mất 2-3 phút"
    },
    questions: {
      chrono_1: "Khi nào bạn cảm thấy năng suất nhất?",
      chrono_2: "Lịch ngủ lý tưởng của bạn?",
      focus_1: "Bạn làm việc hiệu quả nhất khi?",
      // ... more questions
    },
    options: {
      chrono_morning: "Buổi sáng (6h-12h)",
      chrono_evening: "Buổi tối (18h-24h)",
      chrono_flexible: "Linh hoạt theo ngày",
      // ... more options
    },
    success: {
      title: "Hoàn thành! 🎉",
      message: "Profile của bạn đã được lưu. AI sẽ sử dụng thông tin này để đề xuất tasks và lịch học phù hợp.",
      cta: "Dùng thử AI Suggestions"
    }
  },
  en: {
    welcome: {
      title: "Discover Your Learning Style",
      description: "Answer 6-9 short questions to help AI understand you better and provide personalized suggestions",
      estimatedTime: "⏱️ Takes only 2-3 minutes"
    },
    // ... English translations
  }
};

// Helper function to get localized copy
export function getQuizCopy(locale: 'vi' | 'en' = 'vi') {
  return QUIZ_COPY[locale];
}
```

### 3.3 Quiz Questions Design (`utils/quizQuestions.ts`)

```typescript
import { getQuizCopy } from '../i18n/quizCopy';

// 2-3 questions per category = 6-9 total
export const QUIZ_QUESTIONS = [
  // Chronotype (2 questions)
  {
    id: 'chrono_1',
    category: 'chronotype',
    questionKey: 'chrono_1', // Reference to i18n
    options: [
      { value: 0, labelKey: 'chrono_morning', icon: '🌅' },
      { value: 1, labelKey: 'chrono_evening', icon: '🌙' },
      { value: 2, labelKey: 'chrono_flexible', icon: '🔄' }
    ]
  },
  {
    id: 'chrono_2',
    category: 'chronotype',
    questionKey: 'chrono_2',
    options: [
      { value: 0, labelKey: 'chrono_early_bed', icon: '🌅' },
      { value: 1, labelKey: 'chrono_late_bed', icon: '🌙' },
      { value: 2, labelKey: 'chrono_variable', icon: '🔄' }
    ]
  },
  
  // FocusStyle (3 questions)
  {
    id: 'focus_1',
    category: 'focusStyle',
    questionKey: 'focus_1',
    options: [
      { value: 0, labelKey: 'focus_deep', icon: '🎯' },
      { value: 1, labelKey: 'focus_sprint', icon: '⚡' },
      { value: 2, labelKey: 'focus_multitask', icon: '🔀' }
    ]
  },
  // ... 2 more focus questions
  
  // WorkStyle (2 questions)  
  {
    id: 'work_1',
    category: 'workStyle',
    questionKey: 'work_1',
    options: [
      { value: 0, labelKey: 'work_deadline', icon: '⏰' },
      { value: 1, labelKey: 'work_steady', icon: '📊' }
    ]
  },
  // ... 1 more work question
];

// Smart aggregation logic
export function aggregateAnswers(answers: Record<string, number>) {
  // Mode calculation for each category
  const chronoVotes = [answers.chrono_1, answers.chrono_2];
  const focusVotes = [answers.focus_1, answers.focus_2, answers.focus_3];
  const workVotes = [answers.work_1, answers.work_2];
  
  return {
    chronotype: calculateMode(chronoVotes),
    focusStyle: calculateMode(focusVotes),
    workStyle: calculateMode(workVotes)
  };
}

// Helper to get localized question text
export function getQuestionText(questionId: string, locale: 'vi' | 'en' = 'vi') {
  const copy = getQuizCopy(locale);
  return copy.questions[questionId] || questionId;
}
```

### 3.4 Quiz Hook (`hooks/useStudyProfileQuiz.ts`)

```typescript
export function useStudyProfileQuiz(existingProfile?: StudyProfile | null) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    // Pre-fill with existing profile if editing
    if (existingProfile) {
      return reverseMapProfile(existingProfile);
    }
    return {};
  });

  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
  const isComplete = currentStep === QUIZ_QUESTIONS.length - 1;
  
  // Navigation, validation, aggregation logic
}
```

---

## 4. Routing & Navigation Flow

### 4.1 Route Configuration (`App.tsx`)

```typescript
// Add quiz route
function StudyProfileQuizRoute() {
  const navigate = useNavigationHandler();
  return (
    <RequireAuthRoute allowUnverified={true}>
      <StudyProfileQuiz onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

// Update Routes
<Route path="/study-profile/quiz" element={<StudyProfileQuizRoute />} />
```

### 4.2 Post-Login Flow Logic

```typescript
// Update resolveAuthenticatedDestination in App.tsx
function resolveAuthenticatedDestination(auth: AuthSnapshot) {
  if (auth.shouldPromptVerification && !auth.user?.emailVerified) {
    return "/auth/verify-email";
  }
  
  // NEW: Check study profile
  if (auth.user?.hasStudyProfile === false) {
    return "/study-profile/quiz";
  }
  
  return "/today";
}
```

### 4.3 Quiz Completion with Return URL (`StudyProfileQuiz.tsx`)

```typescript
function StudyProfileQuiz({ onNavigate }: { onNavigate: NavigateHandler }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('return') || '/today';

  const handleQuizComplete = useCallback(() => {
    // Navigate back to original destination
    onNavigate(returnUrl);
  }, [onNavigate, returnUrl]);

  return (
    <div>
      {/* Quiz UI */}
      <QuizComplete onComplete={handleQuizComplete} />
    </div>
  );
}
```

### 4.4 Navigation Menu Integration

- Add "Study Profile" link to main navigation (if exists)
- Badge indicator nếu chưa complete
- Accessible từ all authenticated pages

---

## 5. AI Suggestions Enforcement

### 5.1 Soft Enforcement (Current)

```typescript
// In AI Suggestions component/page
function AISuggestionsPage() {
  const { user } = useAuth();
  const { data: profile } = useStudyProfile();
  
  if (!user?.hasStudyProfile) {
    return (
      <div className="warning-banner">
        <InfoIcon />
        <p>Complete your Study Profile to get better AI suggestions</p>
        <Button onClick={() => navigate('/study-profile/quiz')}>
          Take Quiz
        </Button>
      </div>
    );
  }
  
  // Normal AI suggestions UI
}
```

### 5.2 Infrastructure for Hard Enforcement (Updated)

```typescript
// Prepare for future 403 handling with redirect loop prevention
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403 && 
        error.response?.data?.code === 'STUDY_PROFILE_REQUIRED') {
      
      // CRITICAL: Check current location to avoid loops
      const currentPath = window.location.pathname;
      const isAlreadyOnQuiz = currentPath.includes('/study-profile/quiz');
      
      if (!isAlreadyOnQuiz) {
        // Store return URL for after quiz completion
        const returnUrl = currentPath !== '/study-profile/quiz' ? currentPath : '/today';
        navigate(`/study-profile/quiz?return=${encodeURIComponent(returnUrl)}`);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Settings/Profile Integration

### 6.1 Settings Page Structure

```typescript
// src/features/settings/SettingsPage.tsx (NEW or extend existing)
function SettingsPage() {
  return (
    <div>
      <SettingsSection title="Study Profile">
        <StudyProfileSummary />
        <Button onClick={() => navigate('/study-profile/quiz')}>
          Edit Study Profile
        </Button>
      </SettingsSection>
      {/* Other settings */}
    </div>
  );
}
```

### 6.2 Profile Summary Component

```typescript
// Display current profile with labels
function StudyProfileSummary() {
  const { data: profile } = useStudyProfile();
  
  if (!profile) return <EmptyState />;
  
  return (
    <div className="profile-summary">
      <ProfileItem 
        label="Chronotype" 
        value={getChronotypeLabel(profile.chronotype)}
        icon={getChronotypeIcon(profile.chronotype)}
      />
      <ProfileItem 
        label="Focus Style" 
        value={getFocusStyleLabel(profile.focusStyle)}
      />
      <ProfileItem 
        label="Work Style" 
        value={getWorkStyleLabel(profile.workStyle)}
      />
      <p className="text-sm text-gray-500">
        Last updated: {formatDate(profile.updated_at)}
      </p>
    </div>
  );
}
```

---

## 7. UX Details

### 7.1 Quiz Flow

1. **Welcome screen**: Explain purpose, estimated time (2-3 mins)
2. **Question cards**: One at a time, with icons và descriptions
3. **Progress bar**: Visual feedback
4. **Navigation**: Back button (preserve answers), Next/Submit
5. **Success screen**: Confirmation + CTA to AI Suggestions or dashboard

### 7.2 Loading & Error States

- **Initial load**: Skeleton loader cho quiz page
- **Submit**: Button loading state với spinner
- **Network error**: Retry button, save draft locally
- **Validation**: Highlight unanswered questions

### 7.3 Copy & Messaging

```typescript
const COPY = {
  welcome: {
    title: "Khám phá phong cách học tập của bạn",
    description: "Trả lời 6-9 câu hỏi ngắn để AI hiểu bạn hơn và đưa ra gợi ý phù hợp nhất",
    estimatedTime: "⏱️ Chỉ mất 2-3 phút"
  },
  success: {
    title: "Hoàn thành! 🎉",
    message: "Profile của bạn đã được lưu. AI sẽ sử dụng thông tin này để đề xuất tasks và lịch học phù hợp.",
    cta: "Dùng thử AI Suggestions"
  }
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

- Quiz logic: answer aggregation, mode calculation
- Form validation: required fields, value constraints
- Mapping functions: quiz → API, API → display
- i18n functions: copy retrieval, locale switching

### 8.2 Integration Tests

- **Flow 1**: Login → auto-redirect to quiz → submit → redirect to dashboard
- **Flow 2**: Edit profile from settings → pre-filled form → update → success
- **Flow 3**: AI Suggestions without profile → warning banner → navigate to quiz
- **Flow 4**: hasStudyProfile sync after successful POST
- **Flow 5**: Redirect loop prevention when already on quiz page
- **Flow 6**: Return URL preservation through quiz flow

### 8.3 API Mocking

```typescript
// Mock handlers for testing
const handlers = [
  rest.get('/api/study-profile', (req, res, ctx) => {
    return res(ctx.json(mockProfile));
  }),
  rest.post('/api/study-profile', (req, res, ctx) => {
    // Validate workStyle !== 2
    if (req.body.workStyle === 2) {
      return res(ctx.status(400), ctx.json({ error: 'Invalid workStyle' }));
    }
    return res(ctx.json({ ...req.body, updated_at: new Date() }));
  })
];
```

---

## 9. Implementation Roadmap

### Sprint 1: Foundation (3-4 days)

- [ ] Type definitions và enums
- [ ] API client layer với error handling
- [ ] Auth user extension với `hasStudyProfile`
- [ ] Quiz questions configuration
- [ ] **NEW**: Setup i18n structure cho quiz copy
- [ ] **NEW**: Implement hasStudyProfile sync trong AuthContext
- [ ] **NEW**: Add updateUserProfile method

### Sprint 2: Core Quiz (4-5 days)

- [ ] Quiz page component structure
- [ ] Question components với UI
- [ ] Quiz logic hook với state management
- [ ] Progress tracking và navigation
- [ ] Form validation

### Sprint 3: Integration (3-4 days)

- [ ] Routing setup và guards
- [ ] Post-login redirect logic
- [ ] Navigation menu integration
- [ ] Settings page integration
- [ ] Profile summary component

### Sprint 4: Enforcement & Polish (2-3 days)

- [ ] Soft enforcement banner
- [ ] **NEW**: Implement redirect loop prevention trong interceptor
- [ ] **NEW**: Add return URL handling trong quiz completion
- [ ] Error handling và retry logic
- [ ] Loading states và animations
- [ ] Success screen với CTAs

### Sprint 5: Testing & Refinement (2-3 days)

- [ ] Unit tests cho quiz logic
- [ ] Integration tests cho flows
- [ ] **NEW**: Test edge cases: refresh token, multiple tabs, etc.
- [ ] E2E testing với Playwright
- [ ] Accessibility audit
- [ ] Performance optimization

**Total estimate**: 14-19 days (2.5-4 weeks)

---

## 10. Risks & Open Questions

### Risks

1. **WorkStyle constraint**: Phải validate client-side để tránh 400 error
2. **Profile sync**: hasStudyProfile cần update sau quiz success ✅ **ADDRESSED**
3. **Network failures**: Implement auto-save draft hoặc retry logic
4. **Quiz abandonment**: Track analytics để optimize questions
5. **Redirect loops**: ✅ **ADDRESSED** với current path checking
6. **i18n refactoring**: ✅ **ADDRESSED** với early i18n setup

### Open Questions

1. **Analytics tracking**: Cần track quiz start/complete/abandon events?
2. **Multi-language**: Quiz questions có cần i18n không? ✅ **ADDRESSED**
3. **Profile reset**: Có cho user xóa profile và làm lại từ đầu?
4. **Rate limiting**: Study profile API có rate limit như AI Suggestions?
5. **Mobile UX**: Quiz UI có cần responsive adjustments đặc biệt?

### Assumptions

- Backend API đã sẵn sàng và stable
- `hasStudyProfile` được trả về trong all auth endpoints
- Soft enforcement là đủ trong short-term
- No migration script needed cho existing users

### Backend Coordination Needed

- **Confirm**: Error format cho validation failures (400)
- **Confirm**: Rate limiting policy cho study-profile endpoints
- **Test**: hasStudyProfile flag updates correctly sau POST
- **Discuss**: Analytics/logging requirements cho quiz events
- **Clarify**: Profile deletion policy (if any)

---

## Key Files to Create/Modify

### New Files

- `src/lib/api-study-profile.ts`
- `src/features/study-profile/StudyProfileQuiz.tsx`
- `src/features/study-profile/components/*`
- `src/features/study-profile/hooks/*`
- `src/features/study-profile/utils/quizQuestions.ts`
- `src/features/study-profile/i18n/quizCopy.ts` ✅ **NEW**

### Modified Files

- `src/lib/types.ts` (add enums & interfaces)
- `src/features/auth/auth-storage.ts` (extend AuthUser)
- `src/App.tsx` (routing & guards)
- `src/features/auth/AuthContext.tsx` (handle hasStudyProfile) ✅ **UPDATED**
- `src/lib/api.ts` (interceptor updates) ✅ **UPDATED**
- Navigation components (add Study Profile link)

### To-dos

- [ ] Create type definitions for Study Profile (enums, interfaces, API types)
- [ ] Extend AuthUser type with hasStudyProfile field
- [ ] Build API client layer for study-profile endpoints with error handling
- [ ] **NEW**: Setup i18n structure and copy management
- [ ] **NEW**: Implement hasStudyProfile sync in AuthContext
- [ ] Design and implement quiz questions configuration with aggregation logic
- [ ] Build quiz UI components (page, questions, progress, navigation)
- [ ] Implement quiz state management hook with validation and pre-fill logic
- [ ] Add quiz route and update post-login redirect logic
- [ ] **NEW**: Implement return URL handling in quiz completion
- [ ] Integrate Study Profile link into navigation menu
- [ ] Create/extend Settings page with profile summary and edit capability
- [ ] Implement soft enforcement banner in AI Suggestions with infrastructure for hard block
- [ ] **NEW**: Add redirect loop prevention in API interceptor
- [ ] Write unit and integration tests for quiz flows and API integration
- [ ] Add loading states, error handling, animations, and success screens
