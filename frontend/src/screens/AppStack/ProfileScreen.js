import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { usersApi } from "../../services/api";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "rgba(255,255,255,0.92)";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";
const BORDER = "#eef1f5";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateCurrentUser } = useAuth();
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
      style={{ flex: 1, backgroundColor: PAGE_BG }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 18,
        paddingBottom: 34,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => navigation.goBack()} style={backButton}>
          <Ionicons name="chevron-back" size={24} color={TEXT} />
        </Pressable>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: TEXT, fontSize: 28, fontWeight: "900" }}>
            Profile
          </Text>
          <Text style={{ marginTop: 4, color: SUBTEXT }}>
            Update your account details.
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 20,
          alignItems: "center",
          padding: 24,
          borderRadius: 28,
          backgroundColor: CARD_BG,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.72)",
          shadowColor: "#000000",
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        }}
      >
        <Pressable onPress={handlePickAvatar}>
          <UserAvatar user={previewUser} size={88} />
          <View style={cameraBadge}>
            <Ionicons name="camera" size={16} color="#ffffff" />
          </View>
        </Pressable>
        <Text
          style={{
            marginTop: 14,
            fontSize: 18,
            fontWeight: "900",
            color: TEXT,
          }}
        >
          {user?.username}
        </Text>
        <Text style={{ marginTop: 6, color: SUBTEXT }}>{user?.email}</Text>
      </View>

      <View
        style={{
          marginTop: 18,
          padding: 18,
          borderRadius: 28,
          backgroundColor: CARD_BG,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.72)",
        }}
      >
        <Text style={{ fontWeight: "900", color: TEXT, fontSize: 16 }}>
          Edit details
        </Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={SUBTEXT}
          style={inputStyle}
        />

        <Pressable onPress={handlePickAvatar} style={pickerButton}>
          <Ionicons name="image-outline" size={18} color={BLUE} />
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
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>
            {isSaving ? "Saving..." : "Save Profile"}
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
  borderColor: BORDER,
  backgroundColor: "rgba(255,255,255,0.78)",
  color: TEXT,
};

const pickerButton = {
  marginTop: 14,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: BORDER,
  backgroundColor: "rgba(255,255,255,0.78)",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
};

const pickerButtonText = {
  color: BLUE,
  fontWeight: "700",
};

const selectedText = {
  marginTop: 10,
  color: SUBTEXT,
  fontSize: 12,
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: BLUE,
};

const backButton = {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: CARD_BG,
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
  backgroundColor: BLUE,
  borderWidth: 3,
  borderColor: CARD_BG,
};
