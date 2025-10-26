import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const missing: string[] = [];

  if (!config.anthropicApiKey) {
    missing.push('ANTHROPIC_API_KEY');
  }
  if (!config.openaiApiKey) {
    missing.push('OPENAI_API_KEY');
  }

  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('The API will not work properly without these keys.');
  }
}
