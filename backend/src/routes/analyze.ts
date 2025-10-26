import { Router, Request, Response } from 'express';
import { analyzeImage } from '../services/claudeService';
import { generateMultipleEnhancedImages } from '../services/openaiService';
import { ApiResponse, AnalysisResult } from '../types';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageBase64 in request body',
      } as ApiResponse<never>);
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    console.log('Analyzing image with Claude...');
    const analysisResult = await analyzeImage(base64Data);

    console.log('Analysis complete:', {
      spaceType: analysisResult.spaceType,
      suggestionsCount: analysisResult.suggestions.length,
    });

    res.json({
      success: true,
      data: analysisResult,
    } as ApiResponse<AnalysisResult>);
  } catch (error) {
    console.error('Error in /analyze:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse<never>);
  }
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { imageBase64, suggestions, imageDescription } = req.body;

    if (!imageBase64 || !suggestions || !imageDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: imageBase64, suggestions, imageDescription',
      } as ApiResponse<never>);
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    console.log('Generating enhanced images...');
    const generatedImages = await generateMultipleEnhancedImages(
      base64Data,
      suggestions,
      imageDescription
    );

    console.log(`Generated ${generatedImages.length} images`);

    res.json({
      success: true,
      data: generatedImages,
    });
  } catch (error) {
    console.error('Error in /generate:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse<never>);
  }
});

// Combined endpoint for analyze + generate in one call
router.post('/analyze-and-generate', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageBase64 in request body',
      } as ApiResponse<never>);
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    console.log('Step 1: Analyzing image with Claude...');
    const analysisResult = await analyzeImage(base64Data);

    console.log('Step 2: Generating enhanced images with DALL-E...');
    const generatedImages = await generateMultipleEnhancedImages(
      base64Data,
      analysisResult.suggestions,
      analysisResult.imageDescription
    );

    res.json({
      success: true,
      data: {
        analysis: analysisResult,
        generatedImages,
      },
    });
  } catch (error) {
    console.error('Error in /analyze-and-generate:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse<never>);
  }
});

export default router;
