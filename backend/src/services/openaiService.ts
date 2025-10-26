import OpenAI from 'openai';
import { config } from '../config';
import { Suggestion } from '../types';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function generateEnhancedImage(
  originalImageBase64: string,
  suggestion: Suggestion,
  imageDescription: string
): Promise<string> {
  try {
    // Create a detailed prompt for DALL-E 3
    const prompt = `A realistic interior design photo showing ${imageDescription}, enhanced with ${suggestion.item}.

The ${suggestion.item} should be placed ${suggestion.placement}. ${suggestion.reasoning}

Style: Professional interior design photography, realistic, well-lit, high quality, modern aesthetic.
The enhancement should look natural and blend seamlessly with the existing space.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating image with DALL-E:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateMultipleEnhancedImages(
  originalImageBase64: string,
  suggestions: Suggestion[],
  imageDescription: string
): Promise<Array<{ suggestion: Suggestion; imageUrl: string }>> {
  const results = [];

  // Generate images for top 3 suggestions
  const topSuggestions = suggestions.slice(0, 3);

  for (const suggestion of topSuggestions) {
    try {
      const imageUrl = await generateEnhancedImage(
        originalImageBase64,
        suggestion,
        imageDescription
      );
      results.push({ suggestion, imageUrl });
    } catch (error) {
      console.error(`Failed to generate image for suggestion: ${suggestion.item}`, error);
      // Continue with other suggestions even if one fails
    }
  }

  return results;
}
