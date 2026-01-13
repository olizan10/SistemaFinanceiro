import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not configured. AI features will be disabled.');
    console.warn('   Get a free API key at: https://makersuite.google.com/app/apikey');
}

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export const geminiModel = genAI?.getGenerativeModel({
    model: 'gemini-pro'
}) || null;

export const geminiVisionModel = genAI?.getGenerativeModel({
    model: 'gemini-pro-vision'
}) || null;

export default genAI;
