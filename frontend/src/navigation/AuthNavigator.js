import React from "react";
import {
  CardStyleInterpolators,
  TransitionSpecs,
  createStackNavigator,
} from "@react-navigation/stack";
import LoginScreen from "../screens/AuthStack/LoginScreen";
import RegisterScreen from "../screens/AuthStack/RegisterScreen";
import PasswordResetScreen from "../screens/AuthStack/PasswordResetScreen";

const Stack = createStackNavigator();

const slideTransitionOptions = {
  gestureEnabled: true,
  gestureDirection: "horizontal",
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, ...slideTransitionOptions }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
    </Stack.Navigator>
  );
}
