import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BirdProvider, useBirds } from './lib/BirdContext';
import { COLORS } from './lib/theme';

import ScannerScreen from './screens/ScannerScreen';
import CaptureResultScreen from './screens/CaptureResultScreen';
import BirdDetailScreen from './screens/BirdDetailScreen';
import DexScreen from './screens/DexScreen';
import ProfileScreen from './screens/ProfileScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import GalleryScreen from './screens/GalleryScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import MapScreen from './screens/MapScreen';
import AlbumScreen from './screens/AlbumScreen';
import DownloadScreen from './screens/DownloadScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Tabs: undefined;
  CaptureResult: {
    speciesId: number; isNew: boolean; isGacha: boolean; reason?: string;
    oldRarity: string; newRarity: string; newCount: number; xpGained: number;
  };
  BirdDetail: { speciesId: number };
  Gallery: undefined;
  Map: undefined;
  Album: undefined;
  AdminLogin: undefined;
  AdminPanel: { mode?: 'parent' | 'super' } | undefined;
  Download: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.bg,
    text: COLORS.text,
    border: 'transparent',
    primary: COLORS.neon,
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 10,
          paddingBottom: 18,
        },
        tabBarActiveTintColor: COLORS.neon,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 1 },
        tabBarIcon: ({ color, focused }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'ellipse';
          if (route.name === 'Scanner') icon = focused ? 'scan-circle' : 'scan-circle-outline';
          else if (route.name === 'Dex') icon = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'AlbumTab') icon = focused ? 'images' : 'images-outline';
          else if (route.name === 'Profile') icon = focused ? 'person-circle' : 'person-circle-outline';
          return (
            <Ionicons
              name={icon}
              size={route.name === 'Scanner' ? 36 : 26}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dex" component={DexScreen} options={{ tabBarLabel: 'DEX' }} />
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ tabBarLabel: 'CAPTURE' }} />
      <Tab.Screen name="AlbumTab" component={AlbumScreen} options={{ tabBarLabel: 'ALBUM' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'TRAINER' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { hasSeenWelcome } = useBirds();
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}
      initialRouteName={hasSeenWelcome ? 'Tabs' : 'Welcome'}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="CaptureResult" component={CaptureResultScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="BirdDetail" component={BirdDetailScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Gallery" component={GalleryScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Album" component={AlbumScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Download" component={DownloadScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaProvider>
        <BirdProvider>
          <StatusBar style="light" />
          <NavigationContainer theme={NavTheme}>
            <RootNavigator />
          </NavigationContainer>
        </BirdProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
