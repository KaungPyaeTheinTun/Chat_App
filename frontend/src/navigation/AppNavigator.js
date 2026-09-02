import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import ChatListScreen from "../screens/AppStack/ChatListScreen";
import ChatScreen from "../screens/AppStack/ChatScreen";
import ConversationProfileScreen from "../screens/AppStack/ConversationProfileScreen";
import CreateGroupScreen from "../screens/AppStack/CreateGroupScreen";
import PeopleListScreen from "../screens/AppStack/PeopleListScreen";
import ProfileScreen from "../screens/AppStack/ProfileScreen";
import SearchScreen from "../screens/AppStack/SearchScreen";
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
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          backgroundColor: colors.surface,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Chats: "chatbubble-ellipses-outline",
            People: "people-outline",
            Profile: "person-circle-outline",
          };
          const iconName = icons[route.name] || "ellipse-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="People" component={PeopleListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
    </Stack.Navigator>
  );
}
