import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";

const languageOptions = [
  {
    code: "en",
    flagUri: "https://flagcdn.com/w80/gb.png",
    labelKey: "languageEnglish",
    nativeName: "English",
  },
  {
    code: "mm",
    flagUri: "https://flagcdn.com/w80/mm.png",
    labelKey: "languageMyanmar",
    nativeName: "မြန်မာ",
  },
];

export default function LanguageSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { language, setAppLanguage, t } = useLocalization();
  const [query, setQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return languageOptions;
    }

    return languageOptions.filter((item) => {
      const label = t(item.labelKey).toLowerCase();
      return (
        label.includes(needle) ||
        item.nativeName.toLowerCase().includes(needle) ||
        item.code.includes(needle)
      );
    });
  }, [query, t]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.cardGlass,
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{ color: colors.text, fontSize: 26, fontWeight: "700" }}
            >
              {t("languageTitle")}
            </Text>
            <Text style={{ marginTop: 3, color: colors.subtext }}>
              {t("languageSubtitle")}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 18,
            height: 50,
            borderRadius: 25,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            backgroundColor: colors.cardGlass,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search-outline" size={19} color={colors.subtext} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("languageSearchPlaceholder")}
            placeholderTextColor={colors.subtext}
            style={{
              flex: 1,
              marginLeft: 10,
              color: colors.text,
              fontSize: 15,
            }}
          />
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 34,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: colors.cardGlass,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {filteredLanguages.length ? (
            filteredLanguages.map((item, index) => {
              const isSelected = language === item.code;
              return (
                <View key={item.code}>
                  <Pressable
                    onPress={() => setAppLanguage(item.code)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 15,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.iconSurface,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{ uri: item.flagUri }}
                        style={{ width: 42, height: 42 }}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                      >
                        {t(item.labelKey)}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={23}
                        color={colors.primary}
                      />
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={23}
                        color={colors.subtext}
                      />
                    )}
                  </Pressable>
                  {index < filteredLanguages.length - 1 ? (
                    <View
                      style={{
                        height: 1,
                        marginLeft: 70,
                        backgroundColor: colors.divider,
                      }}
                    />
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={{ padding: 18 }}>
              <Text style={{ color: colors.subtext }}>
                {t("languageEmpty")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
