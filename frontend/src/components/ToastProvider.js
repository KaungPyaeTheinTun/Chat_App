import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../styles/colors";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    backgroundColor: "#eafbf2",
    borderColor: "#b8ebca",
    icon: "checkmark-circle",
    iconColor: colors.success,
    textColor: "#0f5132",
  },
  error: {
    backgroundColor: "#fff0ef",
    borderColor: "#ffd3ce",
    icon: "alert-circle",
    iconColor: colors.danger,
    textColor: colors.danger,
  },
};

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -16,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, translateY]);

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

  useEffect(() => {
    if (!toast?.message) {
      return undefined;
    }

    opacity.setValue(0);
    translateY.setValue(-16);

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

    const timeout = setTimeout(() => {
      hideToast();
    }, toast.duration);

    return () => clearTimeout(timeout);
  }, [toast, hideToast, opacity, translateY]);

  const value = useMemo(
    () => ({
      showSuccess: (message, duration) =>
        showToast(message, "success", duration),
      showError: (message, duration) => showToast(message, "error", duration),
    }),
    [showToast],
  );

  const tone = toast ? toastStyles[toast.type] || toastStyles.success : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: insets.top + 12,
            left: 16,
            right: 16,
          }}
        >
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY }],
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: tone.borderColor,
              backgroundColor: tone.backgroundColor,
              paddingHorizontal: 14,
              paddingVertical: 13,
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 5,
            }}
          >
            <Ionicons
              name={tone.icon}
              size={20}
              color={tone.iconColor}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                flex: 1,
                color: tone.textColor,
                fontWeight: "700",
              }}
            >
              {toast.message}
            </Text>
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
