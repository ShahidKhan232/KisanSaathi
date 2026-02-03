# Frontend Components

This directory contains all React components for the KisanSaathi web application.

## Overview

Components are organized by feature and responsibility. Each component is built using React with TypeScript and Tailwind CSS for styling.

## Component List

### Core Components

#### `App.tsx`
**Purpose**: Root application component

**Features**:
- Route configuration
- Global state providers
- Error boundary wrapper
- Theme management

---

#### `Header.tsx`
**Purpose**: Application header with navigation and user menu

**Features**:
- Logo and branding
- Navigation links
- User profile dropdown
- Language selector
- Responsive mobile menu

**Props**:
```typescript
{
  user?: User;
  onLogout: () => void;
}
```

---

#### `Navigation.tsx`
**Purpose**: Main navigation menu

**Features**:
- Dashboard link
- Feature navigation (Chat, Prices, Disease Detection, etc.)
- Active route highlighting
- Mobile-responsive drawer

**Props**:
```typescript
{
  currentPath: string;
  onNavigate: (path: string) => void;
}
```

---

#### `Landing.tsx`
**Purpose**: Landing page for unauthenticated users

**Features**:
- Hero section with CTA
- Feature highlights
- Testimonials
- Footer with links

---

### Authentication Components

#### `AuthForm.tsx`
**Purpose**: Login and registration form

**Features**:
- Toggle between login/register
- Form validation
- Error handling
- Password visibility toggle
- Multilingual support

**Props**:
```typescript
{
  mode: 'login' | 'register';
  onSuccess: (user: User) => void;
}
```

---

#### `Onboarding.tsx`
**Purpose**: New user onboarding flow

**Features**:
- Multi-step wizard
- Farm details collection
- Preference settings
- Progress indicator

**Props**:
```typescript
{
  onComplete: () => void;
}
```

---

### Dashboard Components

#### `Dashboard.tsx`
**Purpose**: Main dashboard with overview

**Features**:
- Quick stats cards
- Recent activities
- Weather widget
- Price alerts
- Upcoming tasks

**State**:
- User data
- Weather data
- Price alerts
- Recent history

---

### AI & ML Components

#### `ChatBot.tsx`
**Purpose**: AI-powered farming assistant chatbot

**Features**:
- Real-time chat interface
- Message history
- Typing indicators
- Multilingual support (English, Hindi, Marathi)
- Context-aware responses
- Voice input (optional)

**State**:
```typescript
{
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
}
```

**Services Used**:
- `aiService.sendMessage()`
- `aiService.getChatHistory()`

---

#### `ChatHistory.tsx`
**Purpose**: View past chat conversations

**Features**:
- Session list
- Search and filter
- Delete sessions
- Resume conversations

**Props**:
```typescript
{
  onSelectSession: (sessionId: string) => void;
}
```

---

#### `CropDiseaseDetection.tsx`
**Purpose**: Upload crop images for disease detection

**Features**:
- Image upload (camera/gallery)
- Image preview
- ML-based disease detection
- Confidence score display
- Treatment recommendations
- Prevention tips
- History toggle

**State**:
```typescript
{
  selectedImage: File | null;
  prediction: {
    disease: string;
    confidence: number;
    treatment: string;
  } | null;
  isAnalyzing: boolean;
}
```

**Services Used**:
- `cropDiseaseService.detectDisease()`

---

#### `DiseaseHistory.tsx`
**Purpose**: View past disease detection results

**Features**:
- Detection history list
- Image thumbnails
- Filter by crop/disease
- Delete entries
- Re-view details

---

#### `CropRecommendation.tsx`
**Purpose**: Get crop recommendations based on soil data

**Features**:
- Soil parameter input (N, P, K, pH)
- Climate data input
- ML-based recommendations
- Confidence scores
- Cultivation tips

**State**:
```typescript
{
  soilData: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    pH: number;
  };
  recommendations: Crop[];
  isLoading: boolean;
}
```

---

### Market & Price Components

#### `PricePrediction.tsx`
**Purpose**: View AI-generated market prices

**Features**:
- **Modern UI**: Gradient header, glassmorphism effects
- **AI Status Banner**: Real-time price generation status
- **Price Cards**: Enhanced cards with gradients and animations
- **Filters**: Crop, market, state, district filters
- **Quick Filters**: One-click commodity selection
- **Refresh**: Manual price refresh
- **Multilingual**: English, Hindi, Marathi support

**State**:
```typescript
{
  priceData: MarketPrice[];
  selectedCrop: string;
  selectedMarket: string;
  aiPriceStatus: {
    lastFetchTime: Date;
    needsRefresh: boolean;
    aiGeneratedPriceCount: number;
    status: 'fresh' | 'stale';
  };
  isLoading: boolean;
}
```

**Services Used**:
- `pricePredictionService.getCurrentPrices()`
- `pricePredictionService.getAIPriceStatus()`
- `pricePredictionService.triggerAIPriceGeneration()`

**UI Features**:
- Gradient header (green-to-emerald)
- AI price count badge
- Glassmorphism AI insights banner
- Enhanced filter section
- Premium price cards with:
  - Gradient borders
  - Hover animations
  - Larger price display
  - Confidence scores
  - Trend indicators

---

### Information Components

#### `SchemeRecommendations.tsx`
**Purpose**: Government schemes and subsidies

**Features**:
- Scheme list
- Filter by category/state
- Eligibility checker
- Application process
- Contact information

**State**:
```typescript
{
  schemes: Scheme[];
  selectedCategory: string;
  selectedState: string;
}
```

---

### User Components

#### `Profile.tsx`
**Purpose**: User profile management

**Features**:
- Profile photo upload
- Personal information edit
- Farm details management
- Preference settings
- Password change

**State**:
```typescript
{
  user: User;
  isEditing: boolean;
  isSaving: boolean;
}
```

---

### Utility Components

#### `Modal.tsx`
**Purpose**: Reusable modal dialog

**Features**:
- Backdrop click to close
- ESC key to close
- Custom content
- Header and footer slots

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}
```

---

#### `ErrorBoundary.tsx`
**Purpose**: Catch and display React errors

**Features**:
- Error catching
- Fallback UI
- Error logging
- Retry option

---

#### `ApplicationProgressTracker.tsx`
**Purpose**: Track multi-step application progress

**Features**:
- Step indicators
- Progress bar
- Navigation between steps
- Validation per step

**Props**:
```typescript
{
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
}
```

---

## Component Patterns

### Functional Components
All components use functional components with hooks:

```typescript
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### TypeScript Props
Define props with TypeScript interfaces:

```typescript
interface Props {
  required: string;
  optional?: number;
  callback: () => void;
}
```

### State Management
Use hooks for state:

```typescript
const [data, setData] = useState<Type>(initial);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Context Usage
Access global state via context:

```typescript
const { user, language } = useAuth();
const { t } = useTranslation();
```

---

## Styling

### Tailwind CSS
All components use Tailwind utility classes:

```tsx
<div className="max-w-6xl mx-auto p-4 space-y-6">
  <h1 className="text-2xl font-bold text-gray-800">
    Title
  </h1>
</div>
```

### Responsive Design
Use responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### Custom Styles
For complex styles, use inline styles or CSS modules:

```tsx
<div style={{ background: 'linear-gradient(...)' }}>
  {/* Content */}
</div>
```

---

## Adding New Components

### Steps

1. **Create Component File**: `NewComponent.tsx`
2. **Define Props Interface**: TypeScript types
3. **Implement Component**: Functional component with hooks
4. **Add Styling**: Tailwind classes
5. **Export**: Export from component file
6. **Document**: Add to this README

### Template

```typescript
import React, { useState, useEffect } from 'react';

interface NewComponentProps {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({ 
  prop1, 
  prop2 = 0, 
  onAction 
}) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Side effects
  }, []);

  const handleClick = () => {
    onAction();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{prop1}</h1>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click Me
      </button>
    </div>
  );
};
```

---

## Best Practices

### 1. Keep Components Focused
Each component should have a single responsibility.

### 2. Use TypeScript
Always define prop types and state types.

### 3. Extract Reusable Logic
Use custom hooks for shared logic:

```typescript
const useData = () => {
  const [data, setData] = useState([]);
  // Logic
  return { data, loading, error };
};
```

### 4. Optimize Performance
Use React.memo for expensive components:

```typescript
export const ExpensiveComponent = React.memo(({ data }) => {
  // Render
});
```

### 5. Handle Errors
Always handle loading and error states:

```typescript
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <Content data={data} />;
```

---

## Related Directories

- **Services**: `../services/` - API calls
- **Hooks**: `../hooks/` - Custom hooks
- **Contexts**: `../contexts/` - Global state
- **Types**: `../types/` - TypeScript definitions
