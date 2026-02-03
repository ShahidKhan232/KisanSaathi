# Custom Hooks

This directory contains reusable React hooks for the KisanSaathi application.

## Overview

Custom hooks provide:
- Reusable stateful logic
- Side effect management
- API integration
- State management

## Hooks List

### `useAuth.ts`
**Purpose**: Authentication state and methods

**Returns**:
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  register: (data) => Promise<void>;
}
```

**Usage**:
```typescript
const { user, login, logout } = useAuth();
```

---

### `useLanguage.ts`
**Purpose**: Multilingual support

**Returns**:
```typescript
{
  language: 'en' | 'hi' | 'mr';
  setLanguage: (lang) => void;
  t: (key: string) => string;
}
```

**Usage**:
```typescript
const { language, t } = useLanguage();
```

---

### `useWeather.ts`
**Purpose**: Weather data fetching

**Returns**:
```typescript
{
  weather: Weather | null;
  forecast: Forecast[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

---

### `useAlerts.ts`
**Purpose**: Price alerts management

**Returns**:
```typescript
{
  alerts: Alert[];
  createAlert: (data) => Promise<void>;
  deleteAlert: (id) => Promise<void>;
  loading: boolean;
}
```

---

### `useUserProfile.ts`
**Purpose**: User profile data

**Returns**:
```typescript
{
  profile: User | null;
  updateProfile: (data) => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

---

### `useApiProfile.ts`
**Purpose**: API-based profile management

Similar to `useUserProfile` but with API integration.

---

### `useVoice.ts`
**Purpose**: Voice input/output

**Returns**:
```typescript
{
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
}
```

---

### `useSocket.ts`
**Purpose**: WebSocket connection

**Returns**:
```typescript
{
  isConnected: boolean;
  emit: (event, data) => void;
  on: (event, callback) => void;
}
```

---

## Hook Patterns

### Basic Hook Template
```typescript
export const useMyHook = () => {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Side effects
  }, []);

  const method = async () => {
    setLoading(true);
    try {
      // Logic
      setState(newValue);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { state, loading, error, method };
};
```

---

## Best Practices

1. **Name with "use" prefix**: All hooks must start with "use"
2. **Return object**: Return an object with named properties
3. **Handle loading/error**: Always include loading and error states
4. **Clean up effects**: Return cleanup functions in useEffect
5. **Type everything**: Use TypeScript for all hooks

---

## Related Directories

- **Components**: `../components/` - Use hooks
- **Services**: `../services/` - Called by hooks
- **Contexts**: `../contexts/` - Global state
