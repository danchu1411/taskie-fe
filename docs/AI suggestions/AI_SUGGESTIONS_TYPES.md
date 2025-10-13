# AI Suggestions TypeScript Types

## Overview

Tài liệu này cung cấp complete TypeScript type definitions cho AI Suggestions API, bao gồm request types, response types, error types, và utility types.

---

## Core Types

### Request Types

```typescript
/**
 * Request payload for generating AI suggestions
 */
interface GenerateSuggestionRequest {
  /** Type of suggestion to generate: 0=task, 1=checklist, 2=mixed */
  suggestionType: 0 | 1 | 2;
  /** User's timezone in IANA format (e.g., "Asia/Ho_Chi_Minh") */
  timezone: string;
  /** Optional custom prompt template */
  promptTemplate?: string;
}

/**
 * Request payload for updating suggestion status
 */
interface UpdateSuggestionStatusRequest {
  /** New status: 1=accepted, 2=rejected */
  status: 1 | 2;
}

/**
 * Query parameters for getting suggestions
 */
interface GetSuggestionsQuery {
  /** Filter by status: 0=pending, 1=accepted, 2=rejected */
  status?: 0 | 1 | 2;
  /** Filter by suggestion type: 0=task, 1=checklist, 2=mixed */
  suggestionType?: 0 | 1 | 2;
  /** Number of items per page (1-50) */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
}
```

### Response Types

```typescript
/**
 * Individual suggestion item (task or checklist item)
 */
interface SuggestionItem {
  /** Item type: 0=task, 1=checklist */
  item_type: 0 | 1;
  /** Item title */
  title: string;
  /** Item description */
  description: string;
  /** Estimated duration in minutes (15-120) */
  estimated_minutes: number;
  /** Optional deadline in ISO 8601 format */
  deadline?: string;
  /** Additional metadata */
  metadata: SuggestionItemMetadata;
}

/**
 * Metadata for suggestion items
 */
interface SuggestionItemMetadata {
  /** Priority level (1-5) */
  priority?: number;
  /** Array of tags */
  tags?: string[];
  /** Parent task ID (for checklist items) */
  task_id?: string;
  /** Subject or category */
  subject?: string;
  /** Type of activity */
  activity_type?: string;
  /** Additional custom fields */
  [key: string]: any;
}

/**
 * Complete suggestion object
 */
interface Suggestion {
  /** Unique suggestion identifier */
  suggestion_id: string;
  /** User who requested the suggestion */
  user_id: string;
  /** Type of suggestion: 0=task, 1=checklist, 2=mixed */
  suggestion_type: 0 | 1 | 2;
  /** Current status: 0=pending, 1=accepted, 2=rejected */
  status: 0 | 1 | 2;
  /** Array of suggested items */
  items: SuggestionItem[];
  /** AI confidence score (0.0-1.0) */
  confidence: number;
  /** AI explanation for the suggestions */
  reason: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at?: string;
}

/**
 * Response for generate suggestion endpoint
 */
interface GenerateSuggestionResponse extends Suggestion {
  /** Request metadata */
  meta: RequestMetadata;
}

/**
 * Response for get suggestions endpoint
 */
interface GetSuggestionsResponse {
  /** Array of suggestions */
  suggestions: Suggestion[];
  /** Total number of suggestions */
  total: number;
  /** Items per page */
  limit: number;
  /** Items skipped */
  offset: number;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Response for update suggestion status endpoint
 */
interface UpdateSuggestionStatusResponse {
  /** Suggestion ID */
  suggestion_id: string;
  /** Updated status */
  status: 1 | 2;
  /** Update timestamp */
  updated_at: string;
}

/**
 * Request metadata included in responses
 */
interface RequestMetadata {
  /** Unique request identifier */
  requestId: string;
  /** AI model used */
  model: string;
  /** AI provider */
  provider: string;
  /** Response time in milliseconds */
  latency_ms: number;
  /** Cost in USD */
  cost: number;
}
```

### Error Types

```typescript
/**
 * API error response structure
 */
interface APIError {
  /** Human-readable error message */
  message: string;
  /** Validation errors (for 400 status) */
  errors?: Record<string, string>;
  /** Seconds until retry allowed (for 429/503 status) */
  retryAfter?: number;
  /** Request ID for debugging */
  requestId?: string;
}

/**
 * HTTP error with response data
 */
interface HTTPError extends Error {
  /** HTTP status code */
  status?: number;
  /** Response data */
  data?: APIError;
  /** Response headers */
  headers?: Record<string, string>;
}

/**
 * Rate limit information
 */
interface RateLimitInfo {
  /** Maximum requests per window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp when window resets */
  reset: number;
}
```

---

## Service Types

### API Service Interface

```typescript
/**
 * AI Suggestions API service interface
 */
interface AISuggestionsService {
  /**
   * Generate new AI suggestions
   */
  generateSuggestion(
    request: GenerateSuggestionRequest
  ): Promise<GenerateSuggestionResponse>;

  /**
   * Get user's suggestion history
   */
  getSuggestions(
    query?: GetSuggestionsQuery
  ): Promise<GetSuggestionsResponse>;

  /**
   * Get specific suggestion details
   */
  getSuggestion(
    suggestionId: string
  ): Promise<Suggestion>;

  /**
   * Update suggestion status
   */
  updateSuggestionStatus(
    suggestionId: string,
    request: UpdateSuggestionStatusRequest
  ): Promise<UpdateSuggestionStatusResponse>;
}
```

### Hook Types

```typescript
/**
 * State for AI suggestions hook
 */
interface AISuggestionsState {
  /** Whether a request is in progress */
  loading: boolean;
  /** Array of suggestions */
  suggestions: Suggestion[];
  /** Current suggestion being displayed */
  currentSuggestion: Suggestion | null;
  /** Current error */
  error: Error | null;
  /** Rate limit information */
  rateLimitInfo: RateLimitInfo | null;
}

/**
 * Actions for AI suggestions hook
 */
interface AISuggestionsActions {
  /**
   * Generate new suggestions
   */
  generateSuggestion(type: 0 | 1 | 2): Promise<void>;
  
  /**
   * Accept a suggestion
   */
  acceptSuggestion(suggestionId: string): Promise<void>;
  
  /**
   * Reject a suggestion
   */
  rejectSuggestion(suggestionId: string): Promise<void>;
  
  /**
   * Clear current error
   */
  clearError(): void;
}

/**
 * Return type for AI suggestions hook
 */
type UseAISuggestionsReturn = AISuggestionsState & AISuggestionsActions;
```

---

## Component Types

### React Component Props

```typescript
/**
 * Props for AI Suggestions component
 */
interface AISuggestionsProps {
  /** Initial suggestion type */
  initialType?: 0 | 1 | 2;
  /** Callback when suggestion is accepted */
  onSuggestionAccepted?: (suggestion: Suggestion) => void;
  /** Callback when suggestion is rejected */
  onSuggestionRejected?: (suggestion: Suggestion) => void;
  /** Custom CSS class */
  className?: string;
  /** Whether to show suggestion history */
  showHistory?: boolean;
}

/**
 * Props for Suggestion Card component
 */
interface SuggestionCardProps {
  /** Suggestion item to display */
  item: SuggestionItem;
  /** Suggestion ID */
  suggestionId: string;
  /** Callback when accepted */
  onAccept: (suggestionId: string) => void;
  /** Callback when rejected */
  onReject: (suggestionId: string) => void;
  /** Whether actions are disabled */
  disabled?: boolean;
}

/**
 * Props for Confidence Badge component
 */
interface ConfidenceBadgeProps {
  /** Confidence score (0.0-1.0) */
  confidence: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show percentage */
  showPercentage?: boolean;
}

/**
 * Props for Rate Limit Warning component
 */
interface RateLimitWarningProps {
  /** Rate limit information */
  rateLimitInfo: RateLimitInfo;
  /** Callback when warning is dismissed */
  onDismiss?: () => void;
}
```

### Event Types

```typescript
/**
 * Suggestion generation event
 */
interface SuggestionGenerationEvent {
  /** Event type */
  type: 'suggestion_generated';
  /** Suggestion data */
  suggestion: Suggestion;
  /** Generation time in milliseconds */
  generationTime: number;
  /** User ID */
  userId: string;
}

/**
 * Suggestion acceptance event
 */
interface SuggestionAcceptanceEvent {
  /** Event type */
  type: 'suggestion_accepted';
  /** Suggestion ID */
  suggestionId: string;
  /** User ID */
  userId: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Rate limit exceeded event
 */
interface RateLimitExceededEvent {
  /** Event type */
  type: 'rate_limit_exceeded';
  /** User ID */
  userId: string;
  /** Retry after seconds */
  retryAfter: number;
  /** Timestamp */
  timestamp: string;
}
```

---

## Utility Types

### Type Guards

```typescript
/**
 * Type guard for suggestion type
 */
function isSuggestionType(value: any): value is 0 | 1 | 2 {
  return typeof value === 'number' && [0, 1, 2].includes(value);
}

/**
 * Type guard for suggestion status
 */
function isSuggestionStatus(value: any): value is 0 | 1 | 2 {
  return typeof value === 'number' && [0, 1, 2].includes(value);
}

/**
 * Type guard for item type
 */
function isItemType(value: any): value is 0 | 1 {
  return typeof value === 'number' && [0, 1].includes(value);
}

/**
 * Type guard for API error
 */
function isAPIError(value: any): value is APIError {
  return value && typeof value.message === 'string';
}

/**
 * Type guard for HTTP error
 */
function isHTTPError(value: any): value is HTTPError {
  return value && typeof value.status === 'number';
}
```

### Helper Types

```typescript
/**
 * Extract suggestion items by type
 */
type TaskItems<T extends SuggestionItem[]> = T extends (infer U)[]
  ? U extends { item_type: 0 } ? U : never
  : never;

type ChecklistItems<T extends SuggestionItem[]> = T extends (infer U)[]
  ? U extends { item_type: 1 } ? U : never
  : never;

/**
 * Suggestion with specific type
 */
type TaskSuggestion = Suggestion & { suggestion_type: 0 };
type ChecklistSuggestion = Suggestion & { suggestion_type: 1 };
type MixedSuggestion = Suggestion & { suggestion_type: 2 };

/**
 * Suggestion with specific status
 */
type PendingSuggestion = Suggestion & { status: 0 };
type AcceptedSuggestion = Suggestion & { status: 1 };
type RejectedSuggestion = Suggestion & { status: 2 };

/**
 * Partial suggestion for updates
 */
type SuggestionUpdate = Partial<Pick<Suggestion, 'status'>>;

/**
 * Suggestion creation payload
 */
type SuggestionCreatePayload = Omit<Suggestion, 'suggestion_id' | 'user_id' | 'created_at' | 'updated_at'>;
```

### Configuration Types

```typescript
/**
 * AI Suggestions configuration
 */
interface AISuggestionsConfig {
  /** API base URL */
  baseURL: string;
  /** Default timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Rate limit configuration */
  rateLimit: {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window duration in milliseconds */
    windowMs: number;
  };
  /** Cache configuration */
  cache: {
    /** Cache duration in milliseconds */
    duration: number;
    /** Maximum cache size */
    maxSize: number;
  };
}

/**
 * Environment configuration
 */
interface AISuggestionsEnv {
  /** API base URL */
  API_BASE_URL: string;
  /** JWT secret for token validation */
  JWT_SECRET: string;
  /** Database connection string */
  DATABASE_URL: string;
  /** AI provider (openai, gemini) */
  LLM_PROVIDER: string;
  /** AI model name */
  LLM_MODEL: string;
  /** AI API key */
  LLM_API_KEY: string;
  /** Rate limit window in milliseconds */
  AI_RATE_LIMIT_WINDOW_MS: number;
  /** Maximum requests per window */
  AI_RATE_LIMIT_MAX_REQUESTS: number;
}
```

---

## Validation Types

### Zod Schemas

```typescript
import { z } from 'zod';

/**
 * Zod schema for suggestion type
 */
export const SuggestionTypeSchema = z.enum([0, 1, 2]);

/**
 * Zod schema for suggestion status
 */
export const SuggestionStatusSchema = z.enum([0, 1, 2]);

/**
 * Zod schema for item type
 */
export const ItemTypeSchema = z.enum([0, 1]);

/**
 * Zod schema for generate suggestion request
 */
export const GenerateSuggestionRequestSchema = z.object({
  suggestionType: SuggestionTypeSchema,
  timezone: z.string().min(1),
  promptTemplate: z.string().optional()
});

/**
 * Zod schema for update suggestion status request
 */
export const UpdateSuggestionStatusRequestSchema = z.object({
  status: z.enum([1, 2])
});

/**
 * Zod schema for get suggestions query
 */
export const GetSuggestionsQuerySchema = z.object({
  status: SuggestionStatusSchema.optional(),
  suggestionType: SuggestionTypeSchema.optional(),
  limit: z.number().min(1).max(50).optional(),
  offset: z.number().min(0).optional()
});

/**
 * Zod schema for suggestion item metadata
 */
export const SuggestionItemMetadataSchema = z.object({
  priority: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  task_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  activity_type: z.string().optional()
}).passthrough(); // Allow additional fields

/**
 * Zod schema for suggestion item
 */
export const SuggestionItemSchema = z.object({
  item_type: ItemTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  estimated_minutes: z.number().min(15).max(120),
  deadline: z.string().datetime().optional(),
  metadata: SuggestionItemMetadataSchema
});

/**
 * Zod schema for suggestion
 */
export const SuggestionSchema = z.object({
  suggestion_id: z.string().uuid(),
  user_id: z.string().uuid(),
  suggestion_type: SuggestionTypeSchema,
  status: SuggestionStatusSchema,
  items: z.array(SuggestionItemSchema),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});

/**
 * Zod schema for API error
 */
export const APIErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string()).optional(),
  retryAfter: z.number().optional(),
  requestId: z.string().uuid().optional()
});
```

### Type Inference

```typescript
/**
 * Infer types from Zod schemas
 */
type GenerateSuggestionRequest = z.infer<typeof GenerateSuggestionRequestSchema>;
type UpdateSuggestionStatusRequest = z.infer<typeof UpdateSuggestionStatusRequestSchema>;
type GetSuggestionsQuery = z.infer<typeof GetSuggestionsQuerySchema>;
type SuggestionItem = z.infer<typeof SuggestionItemSchema>;
type Suggestion = z.infer<typeof SuggestionSchema>;
type APIError = z.infer<typeof APIErrorSchema>;
```

---

## Usage Examples

### Basic Usage

```typescript
import { 
  GenerateSuggestionRequest, 
  GenerateSuggestionResponse,
  Suggestion,
  SuggestionItem 
} from './types';

// Generate suggestions
const request: GenerateSuggestionRequest = {
  suggestionType: 0,
  timezone: 'Asia/Ho_Chi_Minh'
};

const response: GenerateSuggestionResponse = await generateSuggestion(request);

// Process suggestions
response.items.forEach((item: SuggestionItem) => {
  console.log(`${item.title}: ${item.estimated_minutes} minutes`);
});
```

### Error Handling

```typescript
import { APIError, HTTPError, isAPIError, isHTTPError } from './types';

try {
  const response = await generateSuggestion(request);
} catch (error) {
  if (isHTTPError(error)) {
    if (error.status === 429) {
      // Handle rate limiting
      const retryAfter = error.data?.retryAfter;
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    } else if (error.status === 400) {
      // Handle validation errors
      const errors = error.data?.errors;
      console.log('Validation errors:', errors);
    }
  }
}
```

### Type Guards

```typescript
import { 
  isSuggestionType, 
  isItemType, 
  TaskItems, 
  ChecklistItems 
} from './types';

function processSuggestion(suggestion: Suggestion) {
  // Type-safe suggestion type checking
  if (isSuggestionType(suggestion.suggestion_type)) {
    console.log('Valid suggestion type:', suggestion.suggestion_type);
  }
  
  // Separate tasks and checklist items
  const tasks = suggestion.items.filter(item => isItemType(item.item_type) && item.item_type === 0);
  const checklistItems = suggestion.items.filter(item => isItemType(item.item_type) && item.item_type === 1);
  
  console.log(`Found ${tasks.length} tasks and ${checklistItems.length} checklist items`);
}
```

---

## Best Practices

### 1. Type Safety
- Always use TypeScript types for API requests và responses
- Implement type guards for runtime type checking
- Use Zod schemas for validation
- Leverage TypeScript's strict mode

### 2. Error Handling
- Define specific error types
- Use discriminated unions for error states
- Implement proper error boundaries
- Log errors with structured data

### 3. Performance
- Use readonly types where appropriate
- Implement proper caching with typed cache keys
- Use utility types to avoid code duplication
- Leverage TypeScript's type inference

### 4. Maintainability
- Keep types in separate files
- Use consistent naming conventions
- Document complex types
- Version your type definitions

### 5. Testing
- Test type guards thoroughly
- Use type assertions in tests
- Mock with proper types
- Test error scenarios with typed errors
