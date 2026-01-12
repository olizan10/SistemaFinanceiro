import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-pro'
});

export const geminiVisionModel = genAI.getGenerativeModel({
    model: 'gemini-pro-vision'
});

export default genAI;
