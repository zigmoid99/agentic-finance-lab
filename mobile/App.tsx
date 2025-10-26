import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import CameraScreen from './src/screens/CameraScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import { analyzeAndGenerate } from './src/services/api';
import { convertImageToBase64 } from './src/utils/imageUtils';
import { AnalyzeAndGenerateResponse } from './src/types';

type AppState = 'camera' | 'loading' | 'results';

export default function App() {
  const [appState, setAppState] = useState<AppState>('camera');
  const [originalImage, setOriginalImage] = useState<string>('');
  const [results, setResults] = useState<AnalyzeAndGenerateResponse | null>(null);

  const handlePhotoTaken = async (uri: string) => {
    setOriginalImage(uri);
    setAppState('loading');

    try {
      // Convert image to base64
      const base64 = await convertImageToBase64(uri);

      // Call API
      const response = await analyzeAndGenerate(base64);

      // Update state with results
      setResults(response);
      setAppState('results');
    } catch (error) {
      console.error('Error processing image:', error);

      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert(
        'Error',
        `Failed to analyze image: ${errorMessage}\n\nPlease check:\n- Backend server is running\n- API keys are configured\n- Network connection is working`,
        [
          {
            text: 'Try Again',
            onPress: () => setAppState('camera'),
          },
        ]
      );
      setAppState('camera');
    }
  };

  const handleStartOver = () => {
    setOriginalImage('');
    setResults(null);
    setAppState('camera');
  };

  return (
    <>
      <StatusBar style="light" />
      {appState === 'camera' && <CameraScreen onPhotoTaken={handlePhotoTaken} />}
      {appState === 'loading' && <LoadingScreen />}
      {appState === 'results' && results && (
        <ResultsScreen
          originalImage={originalImage}
          results={results}
          onStartOver={handleStartOver}
        />
      )}
    </>
  );
}
