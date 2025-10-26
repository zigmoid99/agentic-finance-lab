export interface Suggestion {
  item: string;
  reasoning: string;
  placement: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  spaceType: string;
  currentItems: string[];
  suggestions: Suggestion[];
  imageDescription: string;
}

export interface GeneratedImage {
  suggestion: Suggestion;
  imageUrl: string;
}

export interface AnalyzeAndGenerateResponse {
  analysis: AnalysisResult;
  generatedImages: GeneratedImage[];
}
