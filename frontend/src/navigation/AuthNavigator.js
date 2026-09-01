import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/AuthStack/LoginScreen";
import RegisterScreen from "../screens/AuthStack/RegisterScreen";
import PasswordResetScreen from "../screens/AuthStack/PasswordResetScreen";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
    </Stack.Navigator>
  );
}
