// 相機 + GPS 權限管理
// 使用 expo-camera + expo-location
// Web 版會優雅降級為模擬模式

import { Platform } from 'react-native';

export interface Location {
  lat: number;
  lng: number;
}

export interface PermissionResult {
  granted: boolean;
  platform: 'ios' | 'android' | 'web';
  status?: string;
}

// === 相機權限 ===
export async function requestCameraPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // 立即關閉取得的串流，只是為了授權
      stream.getTracks().forEach((t) => t.stop());
      return { granted: true, platform: 'web', status: 'granted' };
    } catch {
      return { granted: false, platform: 'web', status: 'denied' };
    }
  }
  try {
    const Camera = await import('expo-camera');
    const { status } = await Camera.Camera.requestCameraPermissionsAsync();
    return {
      granted: status === 'granted',
      platform: Platform.OS as 'ios' | 'android',
      status,
    };
  } catch {
    return { granted: false, platform: Platform.OS as any, status: 'error' };
  }
}

export async function getCameraPermissionStatus(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { granted: false, platform: 'web', status: 'unknown' };
  }
  try {
    const Camera = await import('expo-camera');
    const { status } = await Camera.Camera.getCameraPermissionsAsync();
    return {
      granted: status === 'granted',
      platform: Platform.OS as 'ios' | 'android',
      status,
    };
  } catch {
    return { granted: false, platform: Platform.OS as any, status: 'error' };
  }
}

// === GPS 權限 ===
export async function requestLocationPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    if (!navigator.geolocation) {
      return { granted: false, platform: 'web', status: 'unavailable' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ granted: true, platform: 'web', status: 'granted' }),
        () => resolve({ granted: false, platform: 'web', status: 'denied' }),
        { timeout: 5000 }
      );
    });
  }
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      platform: Platform.OS as 'ios' | 'android',
      status,
    };
  } catch {
    return { granted: false, platform: Platform.OS as any, status: 'error' };
  }
}

// === 取得目前位置 ===
export async function getCurrentLocation(): Promise<Location | null> {
  if (Platform.OS === 'web') {
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  }
  try {
    const Location = await import('expo-location');
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return null;
  }
}

// === 距離計算 (Haversine)  ===
export function distanceKm(a: Location, b: Location): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
