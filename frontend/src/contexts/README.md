# Contexts

This directory contains React Context providers for global state management in the KisanSaathi application.

## Overview

Contexts provide:
- Global state management
- Shared data across components
- Avoid prop drilling
- Centralized logic

## Contexts List

### `AuthContext.tsx`
**Purpose**: Authentication state management

**Provides**:
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  register: (data) => Promise<void>;
  loading: boolean;
}
```

**Usage**:
```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext';

// In App.tsx
<AuthProvider>
  <App />
</AuthProvider>

// In components
const { user, login } = useAuth();
```

---

### `LanguageContext.tsx`
**Purpose**: Multilingual support

**Provides**:
```typescript
{
  language: 'en' | 'hi' | 'mr';
  setLanguage: (lang) => void;
  t: (key: string) => string;
  translations: Record<string, string>;
}
```

**Features**:
- Language persistence (localStorage)
- Translation function
- Dynamic language switching

---

### `FarmerProfileContext.tsx`
**Purpose**: Farmer profile and farm data

**Provides**:
```typescript
{
  profile: FarmerProfile | null;
  updateProfile: (data) => Promise<void>;
  farmDetails: FarmDetails;
  updateFarmDetails: (data) => Promise<void>;
  loading: boolean;
}
```

---

### `VoiceContext.tsx`
**Purpose**: Voice input/output functionality

**Provides**:
```typescript
{
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, language?: string) => void;
  isSupported: boolean;
}
```

**Features**:
- Web Speech API integration
- Multilingual voice support
- Browser compatibility check

---

## Context Pattern

### Creating a Context

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define types
interface ContextType {
  data: DataType;
  method: () => void;
}

// 2. Create context
const MyContext = createContext<ContextType | undefined>(undefined);

// 3. Create provider
export const MyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataType>(initialValue);

  const method = () => {
    // Logic
  };

  const value = {
    data,
    method
  };

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

// 4. Create custom hook
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

### Using a Context

```typescript
// In App.tsx
import { MyProvider } from './contexts/MyContext';

<MyProvider>
  <App />
</MyProvider>

// In components
import { useMyContext } from './contexts/MyContext';

const { data, method } = useMyContext();
```

---

## Best Practices

1. **Always provide default**: Create context with undefined default
2. **Custom hook**: Export a custom hook for type safety
3. **Error handling**: Throw error if used outside provider
4. **Memoization**: Use useMemo for expensive computations
5. **Split contexts**: Don't put everything in one context

---

## Context Composition

Nest multiple providers:

```typescript
<AuthProvider>
  <LanguageProvider>
    <FarmerProfileProvider>
      <VoiceProvider>
        <App />
      </VoiceProvider>
    </FarmerProfileProvider>
  </LanguageProvider>
</AuthProvider>
```

Or create a combined provider:

```typescript
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <FarmerProfileProvider>
          <VoiceProvider>
            {children}
          </VoiceProvider>
        </FarmerProfileProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};
```

---

## Related Directories

- **Components**: `../components/` - Consume contexts
- **Hooks**: `../hooks/` - May use contexts
- **Services**: `../services/` - Called by contexts
