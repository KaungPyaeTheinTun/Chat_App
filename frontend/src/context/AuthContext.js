import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, setApiToken } from "../services/api";

const STORAGE_KEY = "chatapp.auth";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }

        const session = JSON.parse(raw);
        if (!session?.accessToken) {
          return;
        }

        setApiToken(session.accessToken);

        try {
          const verified = await authApi.verify();
          setToken(session.accessToken);
          setRefreshToken(session.refreshToken || null);
          setUser(verified.user);
        } catch (verifyError) {
          if (!session.refreshToken) {
            throw verifyError;
          }

          const refreshed = await authApi.refresh({
            refreshToken: session.refreshToken,
          });

          await saveSession(
            refreshed.accessToken,
            refreshed.refreshToken,
            refreshed.user,
          );
        }
      } catch (error) {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const persistSession = async (accessTokenValue, refreshTokenValue) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: accessTokenValue,
        refreshToken: refreshTokenValue,
      }),
    );
  };

  const saveSession = async (accessTokenValue, refreshTokenValue, nextUser) => {
    setToken(accessTokenValue);
    setRefreshToken(refreshTokenValue);
    setUser(nextUser);
    setApiToken(accessTokenValue);
    await persistSession(accessTokenValue, refreshTokenValue);
  };

  const clearSession = async () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setApiToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    await saveSession(
      response.accessToken,
      response.refreshToken,
      response.user,
    );
    return response.user;
  };

  const register = async ({ username, email, password }) => {
    const response = await authApi.register({
      username,
      email,
      password,
    });
    await saveSession(
      response.accessToken,
      response.refreshToken,
      response.user,
    );
    return response.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (error) {
      // Always clear the local session even if the API call fails.
    } finally {
      await clearSession();
    }
  };

  const updateCurrentUser = (nextUser) => setUser(nextUser);

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      updateCurrentUser,
    }),
    [user, token, refreshToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
