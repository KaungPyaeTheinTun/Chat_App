import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  CardStyleInterpolators,
  TransitionSpecs,
  createStackNavigator,
} from "@react-navigation/stack";
import ChatListScreen from "../screens/AppStack/ChatListScreen";
import ChatScreen from "../screens/AppStack/ChatScreen";
import ConversationProfileScreen from "../screens/AppStack/ConversationProfileScreen";
import CreateGroupScreen from "../screens/AppStack/CreateGroupScreen";
import GroupListScreen from "../screens/AppStack/GroupListScreen";
import LanguageSettingsScreen from "../screens/AppStack/LanguageSettingsScreen";
import NotificationSettingsScreen from "../screens/AppStack/NotificationSettingsScreen";
import PeopleListScreen from "../screens/AppStack/PeopleListScreen";
import ProfileScreen from "../screens/AppStack/ProfileScreen";
import SearchScreen from "../screens/AppStack/SearchScreen";
import SettingsScreen from "../screens/AppStack/SettingsScreen";
import UserSearchScreen from "../screens/AppStack/UserSearchScreen";
import { useLocalization } from "../context/LocalizationContext";
import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const tabIcons = {
  Chats: "chatbubble-ellipses-outline",
  Groups: "chatbubbles-outline",
  People: "people-outline",
  Settings: "settings-outline",
};

const slideTransitionOptions = {
  gestureEnabled: true,
  gestureDirection: "horizontal",
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

function FloatingTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const activeIndex = useRef(new Animated.Value(state.index)).current;
  const tabCount = state.routes.length || 1;
  const tabWidth = tabBarWidth / tabCount;
  const indicatorWidth = Math.min(104, Math.max(78, tabWidth - 8));
  const indicatorTranslateX = activeIndex.interpolate({
    inputRange: state.routes.map((_, index) => index),
    outputRange: state.routes.map(
      (_, index) => index * tabWidth + (tabWidth - indicatorWidth) / 2,
    ),
  });
  const tabLabels = {
    Chats: t("chatListChats"),
    Groups: t("groupsTitle"),
    People: t("peopleTitle"),
    Settings: t("settingsTitle"),
  };

  useEffect(() => {
    Animated.spring(activeIndex, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [activeIndex, state.index]);

  return (
    <View pointerEvents="box-none" style={floatingTabOuter}>
      <View
        onLayout={(event) => setTabBarWidth(event.nativeEvent.layout.width)}
        style={[
          floatingTabShell,
          {
            backgroundColor: colors.cardGlass,
            borderTopColor: colors.border,
          },
        ]}
      >
        {tabBarWidth ? (
          <Animated.View
            pointerEvents="none"
            style={[
              floatingTabIndicator,
              {
                width: indicatorWidth,
                backgroundColor: colors.primarySoft,
                borderColor: colors.border,
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const descriptor = descriptors[route.key];
          const label =
            descriptor.options.tabBarLabel ??
            descriptor.options.title ??
            tabLabels[route.name] ??
            route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={floatingTabItem}
            >
              <View style={floatingTabPill}>
                <Ionicons
                  name={tabIcons[route.name] || "ellipse-outline"}
                  size={23}
                  color={isFocused ? colors.primary : colors.subtext}
                />
                <Text
                  style={{
                    marginTop: 3,
                    color: isFocused ? colors.primary : colors.subtext,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Groups" component={GroupListScreen} />
      <Tab.Screen name="People" component={PeopleListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, shadowOpacity: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
        cardStyle: { backgroundColor: colors.background },
        ...slideTransitionOptions,
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
      <Stack.Screen
        name="NotificationSettingsScreen"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LanguageSettingsScreen"
        component={LanguageSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const floatingTabOuter = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: 82,
};

const floatingTabShell = {
  flex: 1,
  position: "relative",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-around",
  paddingTop: 8,
  paddingBottom: 10,
  borderTopWidth: 1,
};

const floatingTabItem = {
  flex: 1,
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
};

const floatingTabPill = {
  width: "100%",
  height: 56,
  paddingHorizontal: 4,
  borderRadius: 28,
  alignItems: "center",
  justifyContent: "center",
};

const floatingTabIndicator = {
  position: "absolute",
  left: 0,
  top: 13,
  height: 56,
  borderRadius: 999,
  borderWidth: 1,
  zIndex: 1,
};
