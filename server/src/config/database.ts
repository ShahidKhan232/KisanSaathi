import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export let mongoReady = false;

/**
 * Connect to MongoDB with retry logic and connection pooling
 */
export const connectDatabase = async (): Promise<void> => {
    if (!MONGO_URI) {
        console.warn('⚠️  MONGO_URI not set. Using in-memory storage. DATA WILL BE LOST ON RESTART.');
        return;
    }

    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            await mongoose.connect(MONGO_URI, {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            mongoReady = true;
            console.log('✅ MongoDB connected successfully');
            console.log(`   Database: ${mongoose.connection.name}`);
            console.log(`   Host: ${mongoose.connection.host}`);

            // Set up connection event handlers
            setupConnectionHandlers();

            return;
        } catch (error) {
            retries++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`⚠️  MongoDB connection attempt ${retries}/${MAX_RETRIES} failed: ${errorMessage}`);

            if (retries < MAX_RETRIES) {
                console.log(`   Retrying in ${RETRY_DELAY / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.warn('   Max retries reached. Using in-memory storage as fallback. DATA WILL BE LOST ON RESTART.');
            }
        }
    }
};

/**
 * Set up MongoDB connection event handlers
 */
const setupConnectionHandlers = () => {
    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
        mongoReady = false;
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        mongoReady = true;
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        mongoReady = false;
    });
};

/**
 * Disconnect from MongoDB gracefully
 */
export const disconnectDatabase = async (): Promise<void> => {
    if (mongoReady) {
        await mongoose.disconnect();
        mongoReady = false;
        console.log('✅ MongoDB disconnected gracefully');
    }
};

/**
 * Get detailed database status
 */
export const getDatabaseStatus = () => {
    const connectionStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    return {
        configured: !!MONGO_URI,
        connected: mongoReady,
        connectionState: mongoose.connection.readyState,
        connectionStateLabel: connectionStates[mongoose.connection.readyState as keyof typeof connectionStates],
        database: mongoose.connection.name || 'N/A',
        host: mongoose.connection.host || 'N/A',
        models: Object.keys(mongoose.models),
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections) : []
    };
};

/**
 * Create indexes for all models
 * Call this after all models are loaded
 */
export const createIndexes = async (): Promise<void> => {
    if (!mongoReady) {
        console.log('⚠️  Skipping index creation - MongoDB not connected');
        return;
    }

    try {
        console.log('🔧 Creating database indexes...');
        const models = Object.values(mongoose.models);

        for (const model of models) {
            await model.createIndexes();
        }

        console.log(`✅ Indexes created for ${models.length} models`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error creating indexes:', errorMessage);
    }
};

/**
 * Health check for database connection
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
    if (!mongoReady || !mongoose.connection.db) {
        return false;
    }

    try {
        await mongoose.connection.db.admin().ping();
        return true;
    } catch (error) {
        return false;
    }
};
