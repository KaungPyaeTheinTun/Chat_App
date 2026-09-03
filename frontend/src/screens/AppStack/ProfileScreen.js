import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { usersApi } from "../../services/api";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateCurrentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [username, setUsername] = useState(user?.username || "");
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
    setSelectedAvatar(null);
  }, [user]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showError(t("chatPhotoPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedAvatar(result.assets[0]);
      showSuccess(t("profilePhotoSelected"));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let updatedUser = user;
      const trimmedUsername = username.trim();
      let changed = false;

      if (trimmedUsername && trimmedUsername !== user?.username) {
        updatedUser = await usersApi.update(user.userId, {
          username: trimmedUsername,
        });
        changed = true;
      }

      if (selectedAvatar) {
        updatedUser = await usersApi.uploadAvatar(user.userId, selectedAvatar);
        changed = true;
      }

      updateCurrentUser(updatedUser);
      setSelectedAvatar(null);
      showSuccess(changed ? t("profileUpdated") : t("profileNoChanges"));
    } catch (error) {
      showError(getErrorMessage(error, t("profileUnableUpdate")));
    } finally {
      setIsSaving(false);
    }
  };

  const previewUser = selectedAvatar
    ? { ...user, avatarUrl: selectedAvatar.uri }
    : user;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 18,
        paddingBottom: 34,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[backButton, { backgroundColor: colors.cardGlass }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            {t("profileTitle")}
          </Text>
          <Text style={{ marginTop: 4, color: colors.subtext }}>
            {t("profileSubtitle")}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 20,
          alignItems: "center",
          padding: 24,
          borderRadius: 28,
          backgroundColor: colors.cardGlass,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000000",
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        }}
      >
        <Pressable onPress={handlePickAvatar}>
          <UserAvatar user={previewUser} size={88} />
          <View
            style={[
              cameraBadge,
              {
                backgroundColor: colors.primary,
                borderColor: colors.cardGlass,
              },
            ]}
          >
            <Ionicons name="camera" size={16} color="#ffffff" />
          </View>
        </Pressable>
        <Text
          style={{
            marginTop: 14,
            fontSize: 18,
            fontWeight: "900",
            color: colors.text,
          }}
        >
          {user?.username}
        </Text>
        <Text style={{ marginTop: 6, color: colors.subtext }}>
          {user?.email}
        </Text>
      </View>

      <View
        style={{
          marginTop: 18,
          padding: 18,
          borderRadius: 28,
          backgroundColor: colors.cardGlass,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontWeight: "900", color: colors.text, fontSize: 16 }}>
          {t("profileEditDetails")}
        </Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t("profileUsername")}
          placeholderTextColor={colors.subtext}
          style={[
            inputStyle,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
              color: colors.text,
            },
          ]}
        />

        <Pressable
          onPress={handlePickAvatar}
          style={[
            pickerButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
            },
          ]}
        >
          <Ionicons name="image-outline" size={18} color={colors.primary} />
          <Text style={[pickerButtonText, { color: colors.primary }]}>
            {selectedAvatar ? t("profileChangePhoto") : t("profileChoosePhoto")}
          </Text>
        </Pressable>

        {selectedAvatar ? (
          <Text style={[selectedText, { color: colors.subtext }]}>
            {t("profileSelectedPhoto", {
              name: selectedAvatar.fileName || t("commonPhoto"),
            })}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSave}
          style={[primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>
            {isSaving ? t("commonSaving") : t("profileSave")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const inputStyle = {
  marginTop: 14,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 999,
  borderWidth: 1,
};

const pickerButton = {
  marginTop: 14,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 999,
  borderWidth: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
};

const pickerButtonText = {
  fontWeight: "700",
};

const selectedText = {
  marginTop: 10,
  fontSize: 12,
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
};

const backButton = {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
};

const cameraBadge = {
  position: "absolute",
  right: -1,
  bottom: 1,
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 3,
};
