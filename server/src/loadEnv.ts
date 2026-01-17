import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env from current directory (server folder)
const envPath = join(process.cwd(), '.env');
console.log('🔍 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Error loading .env file:', result.error);
} else {
    console.log('✅ .env file loaded successfully');
    console.log('🔐 JWT_SECRET present:', !!process.env.JWT_SECRET);
}

// Export for use in other modules if needed
export const envLoaded = true;