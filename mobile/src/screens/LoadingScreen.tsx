import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.title}>Analyzing Your Space...</Text>
        <Text style={styles.message}>
          {message || 'Our AI is examining your photo and generating suggestions'}
        </Text>
        <View style={styles.steps}>
          <Text style={styles.step}>✓ Analyzing room layout</Text>
          <Text style={styles.step}>✓ Identifying current items</Text>
          <Text style={styles.step}>⏳ Generating suggestions</Text>
          <Text style={styles.step}>⏳ Creating enhanced visualizations</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  steps: {
    alignSelf: 'stretch',
    paddingHorizontal: 40,
  },
  step: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
});
