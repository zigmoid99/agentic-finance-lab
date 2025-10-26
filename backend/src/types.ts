export interface AnalysisResult {
  spaceType: string;
  currentItems: string[];
  suggestions: Suggestion[];
  imageDescription: string;
}

export interface Suggestion {
  item: string;
  reasoning: string;
  placement: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GenerationRequest {
  originalImageBase64: string;
  suggestion: Suggestion;
  imageDescription: string;
}

export interface GenerationResult {
  generatedImageUrl: string;
  suggestion: Suggestion;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
