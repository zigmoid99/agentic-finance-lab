import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { AnalysisResult, Suggestion } from '../types';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

export async function analyzeImage(imageBase64: string): Promise<AnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this image of a room/space. The user is asking "What's missing?"

Please provide:
1. What type of space this is (living room, bedroom, office, kitchen, etc.)
2. What items/furniture are currently visible
3. 3-5 specific suggestions for items, accessories, or furnishings that would enhance this space
4. A brief description of the overall scene

For each suggestion, include:
- The specific item name
- Why it would improve the space
- Where it should be placed
- Priority level (high/medium/low)

Format your response as JSON with this structure:
{
  "spaceType": "type of space",
  "currentItems": ["item1", "item2", ...],
  "imageDescription": "brief description of what you see",
  "suggestions": [
    {
      "item": "item name",
      "reasoning": "why this would help",
      "placement": "where to place it",
      "priority": "high/medium/low"
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
