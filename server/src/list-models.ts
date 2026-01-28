
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('Listing available Gemini models...');

async function listModels() {
    if (!GEMINI_API_KEY) {
        console.error('No API key found!');
        return;
    }

    try {
        // We can't use the high-level SDK for listModels easily in node without authentication client mostly, 
        // but the SDK *does* access the API. 
        // Actually, the SDK doesn't expose listModels directly on the main class in all versions easily.
        // Let's use a simple fetch to the REST API using the key.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log('\nAvailable Models:');
        console.log('-----------------');
        if (data.models) {
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                    console.log(`  Display Name: ${m.displayName}`);
                    console.log(`  Description: ${m.description?.substring(0, 100)}...`);
                    console.log('');
                }
            });
        } else {
            console.log('No models found in response:', data);
        }

    } catch (error: any) {
        console.error('❌ Error listing models:', error.message);
    }
}

listModels();
