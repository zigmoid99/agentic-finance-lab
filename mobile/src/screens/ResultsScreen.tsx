import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { AnalyzeAndGenerateResponse } from '../types';

interface ResultsScreenProps {
  originalImage: string;
  results: AnalyzeAndGenerateResponse;
  onStartOver: () => void;
}

const { width } = Dimensions.get('window');

export default function ResultsScreen({
  originalImage,
  results,
  onStartOver,
}: ResultsScreenProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const { analysis, generatedImages } = results;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What's Missing?</Text>
        <TouchableOpacity onPress={onStartOver}>
          <Text style={styles.startOverButton}>Start Over</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Original Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Original Photo</Text>
          <Image source={{ uri: originalImage }} style={styles.originalImage} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Space Type:</Text>
            <Text style={styles.infoValue}>{analysis.spaceType}</Text>
          </View>
        </View>

        {/* Current Items */}
        {analysis.currentItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currently in Your Space</Text>
            <View style={styles.itemsContainer}>
              {analysis.currentItems.map((item, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Suggestions</Text>
          {analysis.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionItem}>{suggestion.item}</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    suggestion.priority === 'high' && styles.priorityHigh,
                    suggestion.priority === 'medium' && styles.priorityMedium,
                    suggestion.priority === 'low' && styles.priorityLow,
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {suggestion.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.suggestionReasoning}>
                {suggestion.reasoning}
              </Text>
              <Text style={styles.suggestionPlacement}>
                📍 {suggestion.placement}
              </Text>
            </View>
          ))}
        </View>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Could Look</Text>
            <Text style={styles.sectionSubtitle}>
              AI-generated visualizations with suggested items
            </Text>
            {generatedImages.map((generated, index) => (
              <View key={index} style={styles.generatedCard}>
                <Text style={styles.generatedTitle}>
                  With {generated.suggestion.item}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedImageIndex(
                      selectedImageIndex === index ? null : index
                    )
                  }
                >
                  <Image
                    source={{ uri: generated.imageUrl }}
                    style={styles.generatedImage}
                  />
                </TouchableOpacity>
                <Text style={styles.generatedDescription}>
                  {generated.suggestion.reasoning}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.startOverMainButton} onPress={onStartOver}>
          <Text style={styles.startOverMainButtonText}>Take Another Photo</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Claude AI & DALL-E 3
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  startOverButton: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  originalImage: {
    width: width - 40,
    height: 300,
    borderRadius: 10,
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  chipText: {
    color: '#fff',
    fontSize: 14,
  },
  suggestionCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  priorityHigh: {
    backgroundColor: '#E74C3C',
  },
  priorityMedium: {
    backgroundColor: '#F39C12',
  },
  priorityLow: {
    backgroundColor: '#95A5A6',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  suggestionReasoning: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
  },
  suggestionPlacement: {
    fontSize: 12,
    color: '#4A90E2',
  },
  generatedCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  generatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  generatedImage: {
    width: width - 70,
    height: 300,
    borderRadius: 10,
  },
  generatedDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  startOverMainButton: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  startOverMainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});
