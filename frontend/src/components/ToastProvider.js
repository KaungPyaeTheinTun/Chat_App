import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, PanResponder, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "./UserAvatar";
import { useLocalization } from "../context/LocalizationContext";
import { useTheme } from "../context/ThemeContext";

const ToastContext = createContext(null);

const getToastStyles = (colors) => ({
  success: {
    backgroundColor: colors.toast,
    borderColor: colors.toastBorder,
    icon: "checkmark-circle",
    iconColor: colors.success,
    textColor: colors.text,
  },
  error: {
    backgroundColor: colors.toast,
    borderColor: colors.toastBorder,
    icon: "alert-circle",
    iconColor: colors.danger,
    textColor: colors.text,
  },
  message: {
    backgroundColor: colors.toast,
    borderColor: colors.toastBorder,
    icon: "chatbubble-ellipses",
    iconColor: colors.primary,
    textColor: colors.text,
  },
});

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-90)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -90,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(dragY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [dragY, opacity, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_event, gestureState) => {
        dragY.setValue(Math.min(0, gestureState.dy));
      },
      onPanResponderRelease: (_event, gestureState) => {
        if (gestureState.dy < -38 || gestureState.vy < -0.8) {
          hideToast();
          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          stiffness: 180,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          stiffness: 180,
        }).start();
      },
    }),
  ).current;

  const showToast = useCallback(
    (message, type = "success", duration = 2400) => {
      setToast({
        id: Date.now(),
        message,
        type,
        duration,
      });
    },
    [],
  );

  const showMessageNotification = useCallback((payload, duration = 3600) => {
    setToast({
      id: Date.now(),
      type: "message",
      duration,
      message: payload.message,
      title: payload.title,
      time: payload.time,
      avatarUser: payload.avatarUser,
    });
  }, []);

  useEffect(() => {
    if (!toast?.message) {
      return undefined;
    }

    opacity.setValue(0);
    translateY.setValue(-90);
    dragY.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, toast.duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [dragY, toast, hideToast, opacity, translateY]);

  const value = useMemo(
    () => ({
      showSuccess: (message, duration) =>
        showToast(message, "success", duration),
      showError: (message, duration) => showToast(message, "error", duration),
      showMessageNotification,
    }),
    [showMessageNotification, showToast],
  );

  const toastStyles = getToastStyles(colors);
  const tone = toast ? toastStyles[toast.type] || toastStyles.success : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            zIndex: 9999,
            elevation: 9999,
          }}
        >
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              opacity,
              transform: [{ translateY }, { translateY: dragY }],
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: tone.borderColor,
              backgroundColor: tone.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 11,
              shadowColor: "#000000",
              shadowOpacity: 0.18,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 9,
            }}
          >
            {toast.type === "message" ? (
              <View style={{ marginRight: 10 }}>
                <UserAvatar user={toast.avatarUser} size={42} />
              </View>
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.iconSurface,
                  marginRight: 10,
                }}
              >
                <Ionicons name={tone.icon} size={22} color={tone.iconColor} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: tone.textColor,
                    fontWeight: "900",
                  }}
                >
                  {toast.type === "message" ? toast.title : t("appName")}
                </Text>
                <Text
                  style={{
                    color:
                      toast.type === "message"
                        ? colors.subtext
                        : colors.subtext,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {toast.type === "message" ? toast.time : t("now")}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 2,
                  color: tone.textColor,
                  fontWeight: "600",
                  lineHeight: 18,
                }}
              >
                {toast.message}
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
};
