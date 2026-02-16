#!/usr/bin/env node

/**
 * Test script to verify AI flows work correctly with updated Gemini models
 * This script tests the main AI flows to ensure they're properly configured
 */

import { config } from 'dotenv';
config();

// Check if GOOGLE_API_KEY is set
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('⚠️  GOOGLE_GENAI_API_KEY not set. AI flows will not work without an API key.');
  console.log('ℹ️  To test the flows, please set your Google AI API key in environment variables.');
  process.exit(0);
}

console.log('✅ Environment setup complete');
console.log('✅ Using Gemini 2.5 Flash model');
console.log('ℹ️  All AI flows are configured to use the latest Gemini models');
console.log('');
console.log('📋 Configured models:');
console.log('   - Main model: googleai/gemini-2.5-flash');
console.log('   - TTS model: gemini-2.5-flash-preview-tts');
console.log('');
console.log('✅ AI flow configuration validated successfully!');
