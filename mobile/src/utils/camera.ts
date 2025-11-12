import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface PhotoData {
  uri: string;
  type: string;
  name: string;
  latitude?: number;
  longitude?: number;
  takenAt: string;
}

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to take photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs location access to tag photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Location error:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

export const takePhoto = async (): Promise<PhotoData | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Camera permission is required to take photos');
    return null;
  }

  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    includeBase64: false,
  });

  if (result.didCancel || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  // Get current location
  let location: { latitude?: number; longitude?: number } = {};
  try {
    const hasLocationPermission = await requestLocationPermission();
    if (hasLocationPermission) {
      location = await getCurrentLocation();
    }
  } catch (error) {
    console.error('Failed to get location:', error);
  }

  return {
    uri: asset.uri!,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `photo-${Date.now()}.jpg`,
    latitude: location.latitude,
    longitude: location.longitude,
    takenAt: new Date().toISOString(),
  };
};

export const pickPhoto = async (): Promise<PhotoData | null> => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    includeBase64: false,
  });

  if (result.didCancel || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri!,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `photo-${Date.now()}.jpg`,
    takenAt: new Date().toISOString(),
  };
};
