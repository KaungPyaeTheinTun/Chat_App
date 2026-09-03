import React from "react";
import { ActivityIndicator, View } from "react-native";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
