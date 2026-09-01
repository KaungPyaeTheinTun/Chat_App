import React from "react";
import { ActivityIndicator, View } from "react-native";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useAuth } from "../context/AuthContext";
import { colors } from "../styles/colors";

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

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
