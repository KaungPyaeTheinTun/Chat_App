import React from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import ChatListScreen from "../screens/AppStack/ChatListScreen";
import ChatScreen from "../screens/AppStack/ChatScreen";
import ConversationProfileScreen from "../screens/AppStack/ConversationProfileScreen";
import CreateGroupScreen from "../screens/AppStack/CreateGroupScreen";
import PeopleListScreen from "../screens/AppStack/PeopleListScreen";
import ProfileScreen from "../screens/AppStack/ProfileScreen";
import SearchScreen from "../screens/AppStack/SearchScreen";
import SettingsScreen from "../screens/AppStack/SettingsScreen";
import UserSearchScreen from "../screens/AppStack/UserSearchScreen";
import { colors } from "../styles/colors";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.55)",
          shadowColor: "#000000",
          shadowOpacity: 0.12,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        },
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={65}
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "rgba(255,255,255,0.34)" },
            ]}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Chats: "chatbubble-ellipses-outline",
            People: "people-outline",
            Settings: "settings-outline",
          };
          const iconName = icons[route.name] || "ellipse-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="People" component={PeopleListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConversationProfileScreen"
        component={ConversationProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateGroupScreen"
        component={CreateGroupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserSearchScreen"
        component={UserSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
