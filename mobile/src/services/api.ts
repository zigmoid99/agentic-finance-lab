import axios from 'axios';
import { AnalysisResult, AnalyzeAndGenerateResponse } from '../types';

// You'll need to update this with your backend URL
// For iOS simulator: http://localhost:3000
// For Android emulator: http://10.0.2.2:3000
// For physical device: http://YOUR_COMPUTER_IP:3000
const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for image generation
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function analyzeImage(imageBase64: string): Promise<AnalysisResult> {
  const response = await api.post('/api/analyze', { imageBase64 });
  return response.data.data;
}

export async function analyzeAndGenerate(
  imageBase64: string
): Promise<AnalyzeAndGenerateResponse> {
  const response = await api.post('/api/analyze-and-generate', { imageBase64 });
  return response.data.data;
}

export function setApiBaseUrl(url: string) {
  api.defaults.baseURL = url;
}
