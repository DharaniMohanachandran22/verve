# State Management Architecture: React Query integration

This document outlines the transition to and implementation of **React Query** for state management and caching in the Trello clone application.

## Overview
As of Task 30.2, the application has moved away from manual `useEffect`-based data fetching and custom `refresh` functions in Context providers. Instead, we utilize `@tanstack/react-query` to handle server state, caching, synchronization, and optimistic updates.

## Key Principles

### 1. Centralized Cache Invalidation
Instead of child components calling a global `refresh` function, we utilize `queryClient.invalidateQueries`. This allows for fine-grained control over which parts of the application state need to be re-fetched after a mutation.

**Example:**
```typescript
const queryClient = useQueryClient();

const moveCardMutation = useMutation({
  mutationFn: (data) => api.patch('/cards/move', data),
  onSuccess: () => {
    // Automatically triggers a re-fetch of the board data across all components
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  }
});
```

### 2. Standardized Query Keys
We use a structured naming convention for query keys to ensure consistency and facilitate bulk invalidation.
- `['boards']`: List of all boards for the current user.
- `['board', id]`: Detailed board data, including lists and card summaries.
- `['card', id]`: Full card details, checklists, activities, and attachments.

### 3. Progressive Loading States
Components utilize the `isLoading` and `isPending` properties provided by React Query to show professional, high-quality loading indicators (e.g., bone skeletons or spinners), enhancing the "Premium" feel of the platform.

### 4. Error Handling
Global error handling is configured at the `QueryClient` level, while component-specific error states are handled via the `error` object returned from `useQuery`.

## Impact on Development
When adding new features:
1. **Define a Mutation:** Use `useMutation` for any server-side write action.
2. **Invalidate Cache:** Always include an `onSuccess` handler that invalidates relevant queries.
3. **Avoid Local Duplicate State:** Rely on the React Query cache as the single source of truth whenever possible.

---
*Delivering a premium Trello clone experience through professional architecture.*
