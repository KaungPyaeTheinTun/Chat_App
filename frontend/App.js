import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import { ChatProvider } from "./src/context/ChatContext";
import { LocalizationProvider } from "./src/context/LocalizationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/components/ToastProvider";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
  const { colors, isDark } = useTheme();
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style={isDark ? "light" : "dark"} />
              <RootNavigator />
            </NavigationContainer>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <AppContent />
        </LocalizationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
