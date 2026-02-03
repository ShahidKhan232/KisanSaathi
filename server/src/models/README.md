# Models

This directory contains MongoDB schema definitions using Mongoose for the KisanSaathi application.

## Overview

Models define:
- Database schema structure
- Data validation rules
- Default values
- Indexes for performance
- Virtual properties and methods

## Models List

### User Model
**File**: `User.ts`

**Purpose**: User authentication and profile data

**Schema**:
```typescript
{
  name: String (required)
  email: String (required, unique)
  password: String (required, hashed)
  phone: String
  role: 'farmer' | 'admin' | 'expert'
  farmDetails: {
    location: String
    landSize: Number
    crops: [String]
  }
  preferences: {
    language: 'en' | 'hi' | 'mr'
    notifications: Boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: `email` (unique)

---

### MarketPrice Model
**File**: `MarketPrice.ts`

**Purpose**: Store AI-generated and government market price data

**Schema**:
```typescript
{
  commodity: String (required)
  variety: String
  market: String (required)
  state: String (required)
  district: String (required)
  minPrice: Number (required)
  maxPrice: Number (required)
  modalPrice: Number (required)
  priceDate: Date (required)
  source: 'agmarknet' | 'enam' | 'other' (required)
  arrivals: Number
  fetchedAt: Date
}
```

**Indexes**: 
- `{ commodity: 1, market: 1, priceDate: -1 }`
- `{ source: 1, fetchedAt: -1 }`

**Source Types**:
- `agmarknet`: Government data from Agmarknet
- `enam`: Government data from eNAM portal
- `other`: AI-generated prices (Gemini)

---

### CropInfo Model
**File**: `CropInfo.ts`

**Purpose**: Detailed crop cultivation information

**Schema**:
```typescript
{
  name: String (required, unique)
  scientificName: String
  category: 'cereal' | 'pulse' | 'oilseed' | 'vegetable' | 'fruit' | 'cash'
  season: ['kharif' | 'rabi' | 'zaid']
  duration: Number (days)
  soilType: [String]
  climate: String
  waterRequirement: 'low' | 'medium' | 'high'
  cultivation: {
    preparation: String
    sowing: String
    irrigation: String
    fertilizer: String
    pestControl: String
    harvesting: String
  }
  yield: {
    average: Number (quintals/hectare)
    potential: Number
  }
  marketPrice: {
    min: Number
    max: Number
  }
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: `name` (unique)

---

### CropDisease Model
**File**: `CropDisease.ts`

**Purpose**: Store crop disease detection history

**Schema**:
```typescript
{
  userId: ObjectId (ref: 'User', required)
  cropName: String (required)
  diseaseName: String (required)
  confidence: Number (0-100)
  imageUrl: String
  symptoms: [String]
  treatment: String
  prevention: String
  detectedAt: Date
}
```

**Indexes**: `{ userId: 1, detectedAt: -1 }`

---

### CropRecommendation Model
**File**: `CropRecommendation.ts`

**Purpose**: Store crop recommendation history

**Schema**:
```typescript
{
  userId: ObjectId (ref: 'User', required)
  soilData: {
    nitrogen: Number (required)
    phosphorus: Number (required)
    potassium: Number (required)
    pH: Number (required)
  }
  climate: {
    temperature: Number
    humidity: Number
    rainfall: Number
  }
  recommendedCrops: [{
    name: String
    confidence: Number
    reason: String
  }]
  createdAt: Date
}
```

**Indexes**: `{ userId: 1, createdAt: -1 }`

---

### GovernmentScheme Model
**File**: `GovernmentScheme.ts`

**Purpose**: Government schemes and subsidies information

**Schema**:
```typescript
{
  name: String (required)
  description: String (required)
  category: 'subsidy' | 'loan' | 'insurance' | 'training' | 'other'
  eligibility: [String]
  benefits: [String]
  applicationProcess: String
  documents: [String]
  state: String
  startDate: Date
  endDate: Date
  contactInfo: {
    phone: String
    email: String
    website: String
  }
  isActive: Boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: `{ state: 1, isActive: 1 }`

---

### PriceAlert Model
**File**: `PriceAlert.ts`

**Purpose**: User-configured price alerts

**Schema**:
```typescript
{
  userId: ObjectId (ref: 'User', required)
  commodity: String (required)
  market: String
  targetPrice: Number (required)
  condition: 'above' | 'below' (required)
  isActive: Boolean (default: true)
  lastTriggered: Date
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: `{ userId: 1, isActive: 1 }`

---

### WeatherData Model
**File**: `WeatherData.ts`

**Purpose**: Weather information and forecasts

**Schema**:
```typescript
{
  location: String (required)
  coordinates: {
    latitude: Number
    longitude: Number
  }
  temperature: {
    min: Number
    max: Number
    avg: Number
  }
  humidity: Number
  rainfall: Number
  windSpeed: Number
  forecast: [{
    date: Date
    temperature: { min, max, avg }
    humidity: Number
    rainfall: Number
    condition: String
  }]
  recordDate: Date (required)
  source: String
}
```

**Indexes**: `{ location: 1, recordDate: -1 }`

---

### ChatHistory Model
**File**: `ChatHistory.ts`

**Purpose**: AI chatbot conversation history

**Schema**:
```typescript
{
  userId: ObjectId (ref: 'User', required)
  sessionId: String (required)
  messages: [{
    role: 'user' | 'assistant'
    content: String
    timestamp: Date
  }]
  language: 'en' | 'hi' | 'mr'
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: `{ userId: 1, sessionId: 1 }`

---

## Model Patterns

### Timestamps
All models use automatic timestamps:

```typescript
const schema = new Schema({
  // fields
}, {
  timestamps: true  // Adds createdAt and updatedAt
});
```

### References
Use ObjectId references for relationships:

```typescript
userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
```

### Validation
Add validation rules:

```typescript
email: {
  type: String,
  required: [true, 'Email is required'],
  unique: true,
  lowercase: true,
  match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
}
```

### Indexes
Create indexes for frequently queried fields:

```typescript
schema.index({ field1: 1, field2: -1 });
```

---

## Adding New Models

### Steps

1. **Create Model File**: `NewModel.ts`
2. **Define Schema**: Add fields with types and validation
3. **Add Indexes**: For performance
4. **Export Model**: Export Mongoose model
5. **Update index.ts**: Add to exports
6. **Document**: Add to this README

### Template

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface INewModel extends Document {
  field1: string;
  field2: number;
  createdAt: Date;
  updatedAt: Date;
}

const newModelSchema = new Schema<INewModel>({
  field1: {
    type: String,
    required: [true, 'Field1 is required'],
    trim: true
  },
  field2: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Add indexes
newModelSchema.index({ field1: 1 });

export const NewModel = mongoose.model<INewModel>('NewModel', newModelSchema);
```

---

## Best Practices

### 1. Use TypeScript Interfaces
Define interfaces for type safety:

```typescript
export interface IUser extends Document {
  name: string;
  email: string;
}
```

### 2. Add Validation
Validate data at schema level:

```typescript
age: {
  type: Number,
  min: [0, 'Age must be positive'],
  max: [120, 'Age must be realistic']
}
```

### 3. Create Indexes
Index frequently queried fields:

```typescript
schema.index({ userId: 1, createdAt: -1 });
```

### 4. Use Enums
Define allowed values:

```typescript
role: {
  type: String,
  enum: ['farmer', 'admin', 'expert'],
  default: 'farmer'
}
```

### 5. Add Defaults
Set default values:

```typescript
isActive: {
  type: Boolean,
  default: true
}
```

---

## Related Directories

- **Controllers**: `../controllers/` - Use models to handle data
- **Routes**: `../routes/` - Define API endpoints
- **Services**: `../services/` - Business logic using models
