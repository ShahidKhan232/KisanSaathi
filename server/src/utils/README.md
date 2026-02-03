# Utils

This directory contains utility scripts and helper functions for the KisanSaathi backend application.

## Overview

Utilities provide:
- Database seeding and management
- Cron job scheduling
- Data population scripts
- Helper functions
- Configuration loaders

## Utilities List

### Cron Jobs

#### `priceFetchCron.ts`

**Purpose**: Automated daily market price generation using cron scheduler

**Schedule**: Runs daily at midnight IST (00:00)

**Features**:
- **Automatic Execution**: Triggers AI price generation every day
- **Startup Check**: Generates prices on server start if stale
- **Error Handling**: Logs failures without crashing server
- **Status Logging**: Detailed console output for monitoring

**Cron Expression**: `0 0 * * *` (midnight daily)

**Usage**:
```typescript
import { initializePriceFetchCron } from './utils/priceFetchCron.js';

// In server startup (index.ts)
initializePriceFetchCron();
```

**Process**:
1. Check if prices need refresh (>24 hours old)
2. If yes, call `marketPriceAIService.generateDailyMarketPrices()`
3. Log success/failure
4. Schedule next run

**Logs**:
```
🕐 Price fetch cron job scheduled: Daily at midnight IST
🔄 Checking if prices need refresh...
✅ Prices are fresh, no update needed
```

**Configuration**:
- Timezone: IST (Asia/Kolkata)
- Retry: No automatic retry (waits for next scheduled run)
- Timeout: None (waits for AI response)

---

### Database Scripts

#### `seedDatabase.ts`

**Purpose**: Populate database with initial sample data for development

**Usage**:
```bash
npm run build
node dist/utils/seedDatabase.js
```

**Data Created**:
- Sample users
- Crop information
- Government schemes
- Weather data
- Chat history

**Features**:
- Clears existing data before seeding
- Creates realistic sample data
- Validates data before insertion
- Logs progress

**Note**: Market prices are NOT seeded here - use `createSamplePrices.ts` instead

---

#### `createSamplePrices.ts`

**Purpose**: Create realistic sample AI-generated market prices for testing

**Usage**:
```bash
npm run build
node dist/utils/createSamplePrices.js
```

**Data Created**:
- 33 market price entries
- 11 crops (Wheat, Rice, Onion, Potato, Tomato, Cotton, Soybean, Maize, Gram, Tur, Mustard)
- Multiple markets per crop
- Realistic prices in ₹/quintal

**Features**:
- Deletes existing AI prices before creating new ones
- Uses today's date
- Marks source as 'other' (AI-generated)
- Instant execution (no API calls)

**Output**:
```
✅ Successfully created 33 sample AI-generated prices!
📊 Sample data includes:
   - Wheat (3 markets)
   - Rice (3 markets)
   ...
```

**When to Use**:
- Testing UI without API calls
- Development environment
- Demo purposes
- Quick data population

---

#### `generateInitialPrices.ts`

**Purpose**: Trigger real Gemini AI price generation manually

**Usage**:
```bash
npm run build
node dist/utils/generateInitialPrices.js
```

**Features**:
- Calls actual Gemini AI API
- Generates 50-75 prices (25 crops × 2-3 markets)
- Saves to database
- One-time execution

**Requirements**:
- Valid `GEMINI_API_KEY` in `.env`
- Active internet connection
- Gemini API quota available

**Output**:
```
🚀 Triggering AI price generation...
✅ Successfully generated 75 market prices!
```

**When to Use**:
- Initial production setup
- After clearing database
- Testing AI integration
- Manual price refresh

---

### Configuration

#### `loadEnv.ts`

**Purpose**: Load and validate environment variables

**Features**:
- Loads `.env` file
- Validates required variables
- Provides default values
- Logs configuration status

**Usage**:
```typescript
import './loadEnv.js';

// Environment variables are now available
const apiKey = process.env.GEMINI_API_KEY;
```

**Validated Variables**:
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `MONGODB_URI`
- `PORT`

---

## Utility Patterns

### Script Template

```typescript
/**
 * Script description
 */

import '../loadEnv.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

const runScript = async () => {
  try {
    console.log('🚀 Starting script...\n');

    // Connect to database
    await connectDatabase();

    // Script logic here
    const result = await performOperation();

    console.log(`✅ Script completed successfully!`);
    console.log(`Result: ${result}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

// Run the script
runScript();
```

### Cron Job Template

```typescript
import cron from 'node-cron';

export const initializeCronJob = () => {
  // Schedule: minute hour day month weekday
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🕐 Cron job started');
      
      // Job logic
      await performTask();
      
      console.log('✅ Cron job completed');
    } catch (error) {
      console.error('❌ Cron job failed:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('🕐 Cron job scheduled');
};
```

---

## Cron Schedule Reference

Common cron expressions:

```
* * * * *        Every minute
0 * * * *        Every hour
0 0 * * *        Daily at midnight
0 0 * * 0        Weekly on Sunday
0 0 1 * *        Monthly on 1st
0 0 1 1 *        Yearly on Jan 1st
*/5 * * * *      Every 5 minutes
0 */6 * * *      Every 6 hours
0 9,17 * * *     At 9 AM and 5 PM
0 9-17 * * *     Every hour from 9 AM to 5 PM
```

---

## Adding New Utilities

### Steps

1. **Create File**: `newUtil.ts`
2. **Add Imports**: Load environment, database, etc.
3. **Write Logic**: Implement utility function
4. **Add Error Handling**: Try-catch with logging
5. **Export**: Export function for use elsewhere
6. **Document**: Add to this README

### One-Time Script

For scripts that run once and exit:

```typescript
import '../loadEnv.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

const myScript = async () => {
  try {
    await connectDatabase();
    // Logic
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

myScript();
```

### Reusable Helper

For functions used by other parts of the app:

```typescript
/**
 * Helper function description
 * @param param - Parameter description
 * @returns Return value description
 */
export const helperFunction = (param: string): string => {
  // Logic
  return result;
};
```

---

## Best Practices

### 1. Always Clean Up
Use `finally` block to disconnect database and exit:

```typescript
finally {
  await disconnectDatabase();
  process.exit(0);
}
```

### 2. Provide Detailed Logging
Use emojis and clear messages:

```typescript
console.log('🚀 Starting...');
console.log('✅ Success!');
console.error('❌ Error:', error);
```

### 3. Handle Errors Gracefully
Always catch errors and exit with code 1:

```typescript
catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
```

### 4. Validate Environment
Check required variables before running:

```typescript
if (!process.env.REQUIRED_VAR) {
  throw new Error('REQUIRED_VAR not set');
}
```

### 5. Use TypeScript
Type all parameters and return values:

```typescript
async function process(data: DataType): Promise<ResultType> {
  // ...
}
```

---

## Related Directories

- **Services**: `../services/` - Business logic
- **Controllers**: `../controllers/` - HTTP handlers
- **Models**: `../models/` - Database schemas
- **Config**: `../config/` - Configuration files
