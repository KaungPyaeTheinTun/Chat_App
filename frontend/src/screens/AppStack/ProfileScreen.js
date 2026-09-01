import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { usersApi } from "../../services/api";
import { colors } from "../../styles/colors";

export default function ProfileScreen() {
  const { user, logout, updateCurrentUser } = useAuth();
  const { showError, showSuccess } = useToast();
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
      showError("Photo library permission is required.");
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
      showSuccess("Photo selected.");
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
      showSuccess(
        changed
          ? "Profile updated successfully."
          : "No profile changes to save.",
      );
    } catch (error) {
      showError(getErrorMessage(error, "Unable to update profile."));
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
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 30,
      }}
    >
      <Text
        style={{ color: colors.subtext, fontWeight: "700", letterSpacing: 1 }}
      >
        PROFILE
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: "800",
          color: colors.text,
        }}
      >
        Your account
      </Text>

      <View
        style={{
          marginTop: 18,
          alignItems: "center",
          padding: 24,
          borderRadius: 28,
          backgroundColor: colors.surface,
        }}
      >
        <UserAvatar user={previewUser} size={78} />
        <Text
          style={{
            marginTop: 14,
            fontSize: 18,
            fontWeight: "800",
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
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ fontWeight: "800", color: colors.text }}>
          Edit details
        </Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={colors.subtext}
          style={inputStyle}
        />

        <Pressable onPress={handlePickAvatar} style={pickerButton}>
          <Ionicons name="image-outline" size={18} color={colors.primary} />
          <Text style={pickerButtonText}>
            {selectedAvatar
              ? "Change selected photo"
              : "Choose photo from device"}
          </Text>
        </Pressable>

        {selectedAvatar ? (
          <Text style={selectedText}>
            Selected: {selectedAvatar.fileName || "photo"}
          </Text>
        ) : null}

        <Pressable onPress={handleSave} style={primaryButton}>
          <Text style={{ color: colors.white, fontWeight: "800" }}>
            {isSaving ? "Saving..." : "Save Profile"}
          </Text>
        </Pressable>

        <Pressable onPress={logout} style={secondaryButton}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>Logout</Text>
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
  borderColor: colors.border,
  backgroundColor: colors.background,
  color: colors.text,
};

const pickerButton = {
  marginTop: 14,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
};

const pickerButtonText = {
  color: colors.primary,
  fontWeight: "700",
};

const selectedText = {
  marginTop: 10,
  color: colors.subtext,
  fontSize: 12,
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: colors.primary,
};

const secondaryButton = {
  marginTop: 12,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: colors.accent,
};
