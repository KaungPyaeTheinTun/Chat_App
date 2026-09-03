import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LocalizationContext = createContext(null);
const LANGUAGE_STORAGE_KEY = "chatapp.language";

const translations = {
  en: {
    appName: "ChatApp",
    now: "now",
    commonCancel: "Cancel",
    commonConfirm: "Confirm",
    commonDelete: "Delete",
    commonLogout: "Logout",
    commonBackToLogin: "Back to login",
    commonOffline: "Offline",
    commonActiveNow: "Active now",
    commonGroupChat: "Group chat",
    commonConversation: "Conversation",
    commonPhoto: "Photo",
    commonImageMessage: "Image message",
    commonNoUsersFound: "No users found.",
    commonNoPeopleFound: "No people found.",
    commonTryAnotherKeyword: "Try another keyword.",
    commonSearchPeople: "Search people",
    commonSearchUsername: "Search username",
    commonMembers: "Members",
    commonMembersCount: "{{count}} members",
    commonOwner: "Owner",
    commonMember: "Member",
    commonKick: "Kick",
    commonSaving: "Saving...",
    commonCreating: "Creating...",
    commonSoon: "{{label}} will be available soon.",

    settingsTitle: "Settings",
    settingsSubtitle: "Manage your profile and app preferences.",
    settingsProfile: "Profile",
    settingsProfileDescription: "Edit your account details and photo",
    settingsDarkMode: "Dark Mode",
    settingsDarkDescription: "Using dark appearance",
    settingsLightDescription: "Using light appearance",
    settingsLanguage: "Language",
    settingsLanguageDescriptionEn: "Current language: English",
    settingsLanguageDescriptionMm: "Current language: Myanmar",
    settingsPrivacy: "Privacy & Security",
    settingsPrivacyDescription: "Blocked users, sessions, and account safety",
    settingsNotifications: "Notifications",
    settingsNotificationsDescription: "Push notifications and mute rules",
    settingsLogoutMessage: "Are you sure you want to logout from this account?",

    notificationsTitle: "Notifications",
    notificationsSubtitle: "Control realtime message toasts.",
    notificationsMuteAll: "Mute all notifications",
    notificationsMuteAllDescription:
      "Disable message toast notifications from everyone.",
    notificationsSearchUser: "Search user",
    notificationsPeople: "People",
    notificationsMutedByAll: "Muted by all notifications",
    notificationsUserMuted: "Message toasts muted",
    notificationsUserEnabled: "Message toasts enabled",

    languageTitle: "Language",
    languageSubtitle: "Search and choose your app language.",
    languageSearchPlaceholder: "Search language",
    languageSelected: "Selected",
    languageEmpty: "No language found.",
    languageEnglish: "English",
    languageMyanmar: "Myanmar",

    chatListMyDaySoon: "MyDay feature will be available later.",
    chatListMyDay: "MyDay",
    chatListChats: "Chats",
    chatListCreateGroup: "Create Group",
    chatListStartNewChat: "Start New Chat",
    chatListEmpty: "No conversations yet. Start one below.",
    chatListLeaveGroup: "Leave group",
    chatListDeleteConversation: "Delete conversation",
    chatListLeaveGroupConfirm: "Are you sure you want to leave this group?",
    chatListDeleteConversationConfirm:
      "Are you sure you want to delete this conversation from your chat list?",
    chatListLeave: "Leave",
    chatListReact: "React",
    chatListPin: "Pin",
    chatListUnpin: "Unpin",
    chatListMute: "Mute",
    chatListUnmute: "Unmute",
    chatListArchive: "Archive",

    chatLoadOlder: "Load older messages",
    chatEmpty: "No messages yet. Start the conversation.",
    chatTextMessage: "Text message",
    chatNotificationNewMessage: "New message",
    chatNotificationSentPhoto: "Sent a photo",
    chatNotificationGroupTitle: "{{sender}} in {{group}}",
    chatEditingMessage: "Editing message",
    chatEditMessagePlaceholder: "Edit message",
    chatMessageUpdated: "Message updated.",
    chatUnableEdit: "Unable to edit message.",
    chatUnableSend: "Unable to send message.",
    chatPhotoPermission: "Photo library permission is required.",
    chatUnableSendImage: "Unable to send image.",
    chatOnlyEditOwn: "You can only edit your own messages.",
    chatOnlyDeleteOwn: "You can only delete your own messages.",
    chatDeleteMessage: "Delete message",
    chatDeleteMessageConfirm: "Are you sure you want to delete this message?",
    chatMessageDeleted: "Message deleted.",
    chatUnableDelete: "Unable to delete message.",
    chatOpenImage: "Open image",
    chatEdit: "Edit",
    chatCopy: "Copy",
    chatReply: "Reply",
    chatForward: "Forward",
    chatReactionSoon: "{{reaction}} reactions will be available soon.",
    chatFeatureSoon: "{{label}} will be available soon.",
    chatTypingOne: "{{name}} is typing...",
    chatTypingMany: "{{names}} are typing...",
    conversationPreviewStart: "Start a conversation",
    conversationPreviewFailed: "Failed to send. Tap to retry.",
    conversationPreviewSending: "Sending...",

    peopleTitle: "People",
    peopleSubtitle: "Search users and start a conversation.",

    searchMessages: "Search messages",
    searchYourMessages: "Search your messages",
    searchHint: "Type a word or phrase to find conversations.",
    searchSearching: "Searching...",
    searchNoResults: "No results found",
    searchUnable: "Unable to search messages.",

    createGroupTitle: "Create Group",
    createGroupSubtitle: "Search usernames and add members",
    createGroupName: "Group name",
    createGroupNamePlaceholder: "Enter group name",
    createGroupCreated: "Group created.",
    createGroupUnable: "Unable to create group.",

    profileTitle: "Profile",
    profileSubtitle: "Update your account details.",
    profileEditDetails: "Edit details",
    profileUsername: "Username",
    profileChoosePhoto: "Choose photo from device",
    profileChangePhoto: "Change selected photo",
    profileSelectedPhoto: "Selected: {{name}}",
    profilePhotoSelected: "Photo selected.",
    profileUpdated: "Profile updated successfully.",
    profileNoChanges: "No profile changes to save.",
    profileUnableUpdate: "Unable to update profile.",
    profileSave: "Save Profile",
    profileNotFound: "Profile not found.",
    profileEditGroup: "Edit Group",
    profileSaveGroupName: "Save Group Name",
    profileGroupImageUpdated: "Group image updated.",
    profileUnableGroupImage: "Unable to update group image.",
    profileGroupNameUpdated: "Group name updated.",
    profileUnableGroupName: "Unable to update group name.",
    profileAddMember: "Add Member",
    profileAddSelectedMembers: "Add Selected Members",
    profileMembersAdded: "Members added.",
    profileUnableAddMembers: "Unable to add members.",
    profileKickMember: "Kick member",
    profileKickConfirm: "Remove {{name}} from this group?",
    profileMemberRemoved: "Member removed.",
    profileUnableRemoveMember: "Unable to remove member.",

    authGetStarted: "GET STARTED",
    authWelcomeBack: "Welcome back",
    authLoginSubtitle: "Sign in and continue your chats.",
    authEmail: "Email",
    authPassword: "Password",
    authForgotPassword: "Forgot Password?",
    authLogin: "Login",
    authSigningIn: "Signing in...",
    authOr: "or",
    authGoogle: "Continue with Google",
    authGithub: "Continue with GitHub",
    authSocialSoon: "{{provider}} social login will be available soon.",
    authNeedAccount: "Need an account?",
    authSignUp: "Sign up",
    authInvalidLogin: "Enter a valid email and password.",
    authWelcomeToast: "Welcome back.",
    authUnableSignIn: "Unable to sign in.",
    authCreateAccountKicker: "CREATE ACCOUNT",
    authCreateAccount: "Create account",
    authRegisterSubtitle: "Start chatting with your people.",
    authInvalidRegister: "Please complete every required field correctly.",
    authCreated: "Account created successfully.",
    authUnableRegister: "Unable to register.",
    authAlreadyAccount: "Already have an account?",
    authAccountHelp: "ACCOUNT HELP",
    authResetPassword: "Reset password",
    authResetSubtitle: "Recover access to your account.",
    authResetInfo:
      "Enter your email address and the app will be ready for a reset-link flow.",
    authInvalidEmail: "Enter a valid email address.",
    authResetReady: "Reset flow UI is ready for API integration.",
    authSendReset: "Send reset link",
  },
  mm: {
    appName: "ChatApp",
    now: "ယခု",
    commonCancel: "မလုပ်တော့ပါ",
    commonConfirm: "အတည်ပြုမည်",
    commonDelete: "ဖျက်မည်",
    commonLogout: "ထွက်မည်",
    commonBackToLogin: "Login သို့ ပြန်သွားမည်",
    commonOffline: "Offline",
    commonActiveNow: "ယခု Active ဖြစ်နေသည်",
    commonGroupChat: "Group chat",
    commonConversation: "Conversation",
    commonPhoto: "ဓာတ်ပုံ",
    commonImageMessage: "ဓာတ်ပုံ message",
    commonNoUsersFound: "User မတွေ့ပါ။",
    commonNoPeopleFound: "People မတွေ့ပါ။",
    commonTryAnotherKeyword: "အခြားစာလုံးဖြင့် ရှာကြည့်ပါ။",
    commonSearchPeople: "People ရှာမည်",
    commonSearchUsername: "Username ရှာမည်",
    commonMembers: "Members",
    commonMembersCount: "Members {{count}} ယောက်",
    commonOwner: "Owner",
    commonMember: "Member",
    commonKick: "Kick",
    commonSaving: "သိမ်းဆည်းနေသည်...",
    commonCreating: "ဖန်တီးနေသည်...",
    commonSoon: "{{label}} ကို မကြာမီ အသုံးပြုနိုင်ပါမည်။",

    settingsTitle: "Settings",
    settingsSubtitle: "Profile နှင့် app preferences များကို စီမံပါ။",
    settingsProfile: "Profile",
    settingsProfileDescription: "Account details နှင့် photo ပြင်မည်",
    settingsDarkMode: "Dark Mode",
    settingsDarkDescription: "Dark appearance အသုံးပြုနေသည်",
    settingsLightDescription: "Light appearance အသုံးပြုနေသည်",
    settingsLanguage: "Language",
    settingsLanguageDescriptionEn: "လက်ရှိဘာသာစကား: English",
    settingsLanguageDescriptionMm: "လက်ရှိဘာသာစကား: Myanmar",
    settingsPrivacy: "Privacy & Security",
    settingsPrivacyDescription: "Blocked users, sessions နှင့် account safety",
    settingsNotifications: "Notifications",
    settingsNotificationsDescription: "Push notifications နှင့် mute rules",
    settingsLogoutMessage: "ဤ account မှ logout လုပ်မှာ သေချာပါသလား။",

    notificationsTitle: "Notifications",
    notificationsSubtitle: "Realtime message toast များကို ထိန်းချုပ်ပါ။",
    notificationsMuteAll: "Notifications အားလုံး mute လုပ်မည်",
    notificationsMuteAllDescription:
      "လူတိုင်းထံမှ message toast notifications များကို ပိတ်မည်။",
    notificationsSearchUser: "User ရှာမည်",
    notificationsPeople: "People",
    notificationsMutedByAll: "All notifications ကြောင့် muted ဖြစ်နေသည်",
    notificationsUserMuted: "Message toasts muted",
    notificationsUserEnabled: "Message toasts enabled",

    languageTitle: "Language",
    languageSubtitle: "App ဘာသာစကားကို ရှာပြီး ရွေးပါ။",
    languageSearchPlaceholder: "ဘာသာစကား ရှာမည်",
    languageSelected: "ရွေးထားသည်",
    languageEmpty: "ဘာသာစကား မတွေ့ပါ။",
    languageEnglish: "English",
    languageMyanmar: "မြန်မာ",

    chatListMyDaySoon: "MyDay feature ကို နောက်မှ ထည့်ပါမည်။",
    chatListMyDay: "MyDay",
    chatListChats: "Chats",
    chatListCreateGroup: "Group ဖန်တီးမည်",
    chatListStartNewChat: "Chat အသစ် စမည်",
    chatListEmpty: "Conversation မရှိသေးပါ။ အောက်တွင် စတင်ပါ။",
    chatListLeaveGroup: "Group မှ ထွက်မည်",
    chatListDeleteConversation: "Conversation ဖျက်မည်",
    chatListLeaveGroupConfirm: "ဤ group မှ ထွက်မှာ သေချာပါသလား။",
    chatListDeleteConversationConfirm:
      "ဤ conversation ကို chat list မှ ဖျက်မှာ သေချာပါသလား။",
    chatListLeave: "ထွက်မည်",
    chatListReact: "React",
    chatListPin: "Pin",
    chatListUnpin: "Unpin",
    chatListMute: "Mute",
    chatListUnmute: "Unmute",
    chatListArchive: "Archive",

    chatLoadOlder: "Message အဟောင်းများ ဖွင့်မည်",
    chatEmpty: "Message မရှိသေးပါ။ Conversation စတင်ပါ။",
    chatTextMessage: "စာရေးပါ",
    chatNotificationNewMessage: "Message အသစ်",
    chatNotificationSentPhoto: "ဓာတ်ပုံ ပို့ထားသည်",
    chatNotificationGroupTitle: "{{group}} တွင် {{sender}}",
    chatEditingMessage: "Message ပြင်နေသည်",
    chatEditMessagePlaceholder: "Message ပြင်မည်",
    chatMessageUpdated: "Message updated.",
    chatUnableEdit: "Message ပြင်၍ မရပါ။",
    chatUnableSend: "Message ပို့၍ မရပါ။",
    chatPhotoPermission: "Photo library permission လိုအပ်သည်။",
    chatUnableSendImage: "ဓာတ်ပုံ ပို့၍ မရပါ။",
    chatOnlyEditOwn: "ကိုယ်ပိုင် message များကိုသာ ပြင်နိုင်သည်။",
    chatOnlyDeleteOwn: "ကိုယ်ပိုင် message များကိုသာ ဖျက်နိုင်သည်။",
    chatDeleteMessage: "Message ဖျက်မည်",
    chatDeleteMessageConfirm: "ဤ message ကို ဖျက်မှာ သေချာပါသလား။",
    chatMessageDeleted: "Message ဖျက်ပြီးပါပြီ။",
    chatUnableDelete: "Message ဖျက်၍ မရပါ။",
    chatOpenImage: "ဓာတ်ပုံ ဖွင့်မည်",
    chatEdit: "ပြင်မည်",
    chatCopy: "Copy",
    chatReply: "Reply",
    chatForward: "Forward",
    chatReactionSoon: "{{reaction}} reactions ကို မကြာမီ အသုံးပြုနိုင်ပါမည်။",
    chatFeatureSoon: "{{label}} ကို မကြာမီ အသုံးပြုနိုင်ပါမည်။",
    chatTypingOne: "{{name}} စာရေးနေသည်...",
    chatTypingMany: "{{names}} စာရေးနေသည်...",
    conversationPreviewStart: "Conversation စတင်ပါ",
    conversationPreviewFailed: "ပို့၍မရပါ။ ပြန်ပို့ရန် နှိပ်ပါ။",
    conversationPreviewSending: "ပို့နေသည်...",

    peopleTitle: "People",
    peopleSubtitle: "User များကို ရှာပြီး conversation စတင်ပါ။",

    searchMessages: "Messages ရှာမည်",
    searchYourMessages: "သင့် messages များကို ရှာမည်",
    searchHint: "Conversation ရှာရန် စာလုံး သို့မဟုတ် စကားစု ရိုက်ထည့်ပါ။",
    searchSearching: "ရှာဖွေနေသည်...",
    searchNoResults: "Result မတွေ့ပါ",
    searchUnable: "Messages ရှာ၍ မရပါ။",

    createGroupTitle: "Group ဖန်တီးမည်",
    createGroupSubtitle: "Username ရှာပြီး member ထည့်ပါ",
    createGroupName: "Group name",
    createGroupNamePlaceholder: "Group name ရိုက်ထည့်ပါ",
    createGroupCreated: "Group ဖန်တီးပြီးပါပြီ။",
    createGroupUnable: "Group ဖန်တီး၍ မရပါ။",

    profileTitle: "Profile",
    profileSubtitle: "သင့် account details ကို ပြင်ပါ။",
    profileEditDetails: "Details ပြင်မည်",
    profileUsername: "Username",
    profileChoosePhoto: "Device မှ photo ရွေးမည်",
    profileChangePhoto: "ရွေးထားသော photo ပြောင်းမည်",
    profileSelectedPhoto: "ရွေးထားသည်: {{name}}",
    profilePhotoSelected: "Photo ရွေးပြီးပါပြီ။",
    profileUpdated: "Profile updated successfully.",
    profileNoChanges: "Profile ပြောင်းလဲမှု မရှိပါ။",
    profileUnableUpdate: "Profile update လုပ်၍ မရပါ။",
    profileSave: "Profile သိမ်းမည်",
    profileNotFound: "Profile မတွေ့ပါ။",
    profileEditGroup: "Group ပြင်မည်",
    profileSaveGroupName: "Group Name သိမ်းမည်",
    profileGroupImageUpdated: "Group image updated.",
    profileUnableGroupImage: "Group image update လုပ်၍ မရပါ။",
    profileGroupNameUpdated: "Group name updated.",
    profileUnableGroupName: "Group name update လုပ်၍ မရပါ။",
    profileAddMember: "Member ထည့်မည်",
    profileAddSelectedMembers: "ရွေးထားသော members ထည့်မည်",
    profileMembersAdded: "Members ထည့်ပြီးပါပြီ။",
    profileUnableAddMembers: "Members ထည့်၍ မရပါ။",
    profileKickMember: "Member kick မည်",
    profileKickConfirm: "{{name}} ကို ဤ group မှ ဖယ်ရှားမည်လား။",
    profileMemberRemoved: "Member ဖယ်ရှားပြီးပါပြီ။",
    profileUnableRemoveMember: "Member ဖယ်ရှား၍ မရပါ။",

    authGetStarted: "စတင်မည်",
    authWelcomeBack: "ပြန်လည်ကြိုဆိုပါသည်",
    authLoginSubtitle: "Sign in လုပ်ပြီး chats ဆက်လုပ်ပါ။",
    authEmail: "Email",
    authPassword: "Password",
    authForgotPassword: "Password မေ့နေပါသလား?",
    authLogin: "Login",
    authSigningIn: "Signing in...",
    authOr: "သို့မဟုတ်",
    authGoogle: "Google ဖြင့် ဆက်လုပ်မည်",
    authGithub: "GitHub ဖြင့် ဆက်လုပ်မည်",
    authSocialSoon: "{{provider}} social login ကို မကြာမီ အသုံးပြုနိုင်ပါမည်။",
    authNeedAccount: "Account လိုအပ်ပါသလား?",
    authSignUp: "Sign up",
    authInvalidLogin: "Email နှင့် password မှန်ကန်စွာ ထည့်ပါ။",
    authWelcomeToast: "ပြန်လည်ကြိုဆိုပါသည်။",
    authUnableSignIn: "Sign in လုပ်၍ မရပါ။",
    authCreateAccountKicker: "ACCOUNT ဖန်တီးမည်",
    authCreateAccount: "Account ဖန်တီးမည်",
    authRegisterSubtitle: "သင့်လူများနှင့် chat စတင်ပါ။",
    authInvalidRegister: "လိုအပ်သော field များကို မှန်ကန်စွာ ဖြည့်ပါ။",
    authCreated: "Account created successfully.",
    authUnableRegister: "Register လုပ်၍ မရပါ။",
    authAlreadyAccount: "Account ရှိပြီးသားလား?",
    authAccountHelp: "ACCOUNT HELP",
    authResetPassword: "Password reset",
    authResetSubtitle: "သင့် account ကို ပြန်ဝင်နိုင်ရန် ပြုလုပ်ပါ။",
    authResetInfo:
      "Email address ထည့်ပါ။ App သည် reset-link flow အတွက် ပြင်ဆင်ထားပါသည်။",
    authInvalidEmail: "မှန်ကန်သော email address ထည့်ပါ။",
    authResetReady: "Reset flow UI သည် API integration အတွက် အသင့်ဖြစ်ပါပြီ။",
    authSendReset: "Reset link ပို့မည်",
  },
};

const interpolate = (template, params = {}) =>
  Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{{${key}}}`).join(String(value)),
    template,
  );

export function LocalizationProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage === "en" || savedLanguage === "mm") {
        setLanguage(savedLanguage);
      }
    };

    loadLanguage();
  }, []);

  const setAppLanguage = useCallback(async (nextLanguage) => {
    const normalizedLanguage = nextLanguage === "mm" ? "mm" : "en";
    setLanguage(normalizedLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setAppLanguage(language === "mm" ? "en" : "mm");
  }, [language, setAppLanguage]);

  const t = useCallback(
    (key, params) => {
      const template =
        translations[language]?.[key] || translations.en[key] || key;
      return interpolate(template, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      isMyanmar: language === "mm",
      setAppLanguage,
      toggleLanguage,
      t,
    }),
    [language, setAppLanguage, t, toggleLanguage],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export const useLocalization = () => {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error(
      "useLocalization must be used inside LocalizationProvider.",
    );
  }

  return context;
};
