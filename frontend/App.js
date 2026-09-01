import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import { ChatProvider } from "./src/context/ChatContext";
import { ToastProvider } from "./src/components/ToastProvider";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
