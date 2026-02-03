# Frontend Services

This directory contains API service modules that handle HTTP requests to the backend for the KisanSaathi application.

## Overview

Services provide:
- API endpoint calls
- Request/response handling
- Data transformation
- Error handling
- Type safety

## Services List

### `apiService.ts`
**Purpose**: Base API service with common HTTP methods

**Features**:
- Axios instance configuration
- Request interceptors (auth tokens)
- Response interceptors (error handling)
- Base URL configuration

**Methods**:
```typescript
get<T>(url: string): Promise<T>
post<T>(url: string, data: any): Promise<T>
put<T>(url: string, data: any): Promise<T>
delete<T>(url: string): Promise<T>
```

---

### `aiService.ts`
**Purpose**: AI chatbot API calls

**Methods**:
```typescript
sendMessage(message: string, language: string): Promise<ChatResponse>
getChatHistory(sessionId?: string): Promise<ChatSession[]>
```

**Endpoints**:
- `POST /api/ai/chat`
- `GET /api/ai/chat/history`

---

### `pricePredictionService.ts`
**Purpose**: Market price data API calls

**Methods**:
```typescript
getCurrentPrices(): Promise<MarketPrice[]>
getAIPriceStatus(): Promise<AIPriceStatus>
triggerAIPriceGeneration(): Promise<GenerationResult>
```

**Endpoints**:
- `GET /api/market-prices`
- `GET /api/market-prices/ai-status`
- `POST /api/market-prices/fetch-ai-prices`

**Types**:
```typescript
interface AIPriceStatus {
  lastFetchTime: Date | null;
  needsRefresh: boolean;
  aiGeneratedPriceCount: number;
  nextScheduledFetch: string;
  status: 'fresh' | 'stale';
}
```

---

### `userProfileService.ts`
**Purpose**: User profile management

**Methods**:
```typescript
getProfile(): Promise<User>
updateProfile(data: Partial<User>): Promise<User>
uploadAvatar(file: File): Promise<string>
```

---

### `weatherService.ts`
**Purpose**: Weather data API calls

**Methods**:
```typescript
getCurrentWeather(location: string): Promise<Weather>
getForecast(location: string): Promise<Forecast[]>
```

---

### `schemeRecommendationService.ts`
**Purpose**: Government schemes API

**Methods**:
```typescript
getSchemes(filters?: SchemeFilters): Promise<Scheme[]>
getSchemeById(id: string): Promise<Scheme>
```

---

### `alertService.ts`
**Purpose**: Price alerts management

**Methods**:
```typescript
getAlerts(): Promise<Alert[]>
createAlert(data: AlertData): Promise<Alert>
updateAlert(id: string, data: Partial<AlertData>): Promise<Alert>
deleteAlert(id: string): Promise<void>
```

---

### `socketService.ts`
**Purpose**: WebSocket real-time communication

**Methods**:
```typescript
connect(): void
disconnect(): void
on(event: string, callback: Function): void
emit(event: string, data: any): void
```

---

## Service Patterns

### API Call Template
```typescript
export const myService = {
  async getData(): Promise<DataType> {
    try {
      const response = await apiService.get<DataType>('/endpoint');
      return response;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
};
```

### Error Handling
```typescript
try {
  const data = await service.method();
  return data;
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  }
  throw error;
}
```

---

## Related Directories

- **Components**: `../components/` - Use services
- **Hooks**: `../hooks/` - Wrap service calls
- **Types**: `../types/` - Type definitions
