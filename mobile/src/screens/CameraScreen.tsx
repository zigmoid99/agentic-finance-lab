import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface CameraScreenProps {
  onPhotoTaken: (uri: string) => void;
}

export default function CameraScreen({ onPhotoTaken }: CameraScreenProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            We need your permission to use the camera
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onPhotoTaken(capturedImage);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.button} onPress={handleRetake}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleUsePhoto}
            >
              <Text style={styles.buttonText}>What's Missing?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room Designer AI</Text>
        <Text style={styles.subtitle}>
          Take a photo of your room, office, or any space
        </Text>
      </View>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  flipButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  flipButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1a1a1a',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4A90E2',
  },
  galleryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  placeholder: {
    width: 80,
  },
  button: {
    backgroundColor: '#333',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
});
