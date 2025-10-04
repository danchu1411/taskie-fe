import { useCallback, useState } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "./AuthContext";
import { getGoogleIdToken, detectMockEnabled, createMockGooglePayload } from "../../lib/googleIdentity";

type MockFormData = {
  email: string;
  name: string;
};

type UseGoogleAuthResult = {
  signInWithGoogle: (remember: boolean) => Promise<void>;
  openMockDialog: () => void;
  closeMockDialog: () => void;
  submitMock: (data: { email: string; name: string; remember: boolean }) => Promise<void>;
  setMockData: (data: MockFormData) => void;
  loadingGoogle: boolean;
  googleError: string | null;
  googleHint: string | null;
  showMockDialog: boolean;
  mockForm: MockFormData;
};

/**
 * Hook for Google authentication functionality
 * 
 * Encapsulates all Google OAuth logic including real authentication,
 * mock mode, error handling, and loading states
 */
export function useGoogleAuth(): UseGoogleAuthResult {
  const { loginWithGoogle } = useAuth();
  
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleHint, setGoogleHint] = useState<string | null>(null);
  const [showMockDialog, setShowMockDialog] = useState(false);
  const [mockForm, setMockForm] = useState<MockFormData>({ email: "", name: "" });

  const signInWithGoogle = useCallback(async (remember: boolean) => {
    setLoadingGoogle(true);
    setGoogleError(null);
    setGoogleHint(null);

    try {
      const credential = await getGoogleIdToken();
      await loginWithGoogle({
        idToken: credential.credential,
        remember
      });
      setGoogleHint("Google login successful!");
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 400) {
          setGoogleError("Google token không hợp lệ. Vui lòng thử lại.");
        } else if (error.response?.status === 401) {
          setGoogleError("Xác thực Google thất bại. Vui lòng thử lại.");
        } else if (error.response?.status === 500) {
          setGoogleError("Lỗi cấu hình Google. Vui lòng kiểm tra VITE_GOOGLE_CLIENT_ID.");
        } else {
          setGoogleError("Google login failed. Please try again.");
        }
      } else if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          setGoogleHint("Google login was cancelled. Please try again if needed.");
        } else if (error.message.includes('VITE_GOOGLE_CLIENT_ID')) {
          setGoogleError("Google chưa được cấu hình. Vui lòng kiểm tra VITE_GOOGLE_CLIENT_ID.");
        } else {
          setGoogleError("Google login failed. Please try again.");
        }
      } else {
        setGoogleError("Google login failed. Please try again.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  }, [loginWithGoogle]);

  const openMockDialog = useCallback(() => {
    if (detectMockEnabled()) {
      setShowMockDialog(true);
    }
  }, []);

  const setMockData = useCallback((data: MockFormData) => {
    setMockForm(data);
  }, []);

  const submitMock = useCallback(async (data: { email: string; name: string; remember: boolean }) => {
    if (!data.email.trim() || !data.name.trim()) {
      setGoogleError("Please enter both email and name for mock login.");
      return;
    }

    setLoadingGoogle(true);
    setGoogleError(null);

    try {
      const mockPayload = createMockGooglePayload(data.email.trim(), data.name.trim());
      await loginWithGoogle({
        ...mockPayload,
        remember: data.remember
      });
      setShowMockDialog(false);
      setGoogleHint("Mock login successful!");
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 400) {
          setGoogleError("Mock data không hợp lệ. Vui lòng kiểm tra email và tên.");
        } else if (error.response?.status === 401) {
          setGoogleError("Xác thực mock thất bại. Vui lòng thử lại.");
        } else {
          setGoogleError("Mock login failed. Please try again.");
        }
      } else {
        setGoogleError("Mock login failed. Please try again.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  }, [loginWithGoogle]);

  const closeMockDialog = useCallback(() => {
    setShowMockDialog(false);
  }, []);

  return {
    signInWithGoogle,
    openMockDialog,
    closeMockDialog,
    submitMock,
    setMockData,
    loadingGoogle,
    googleError,
    googleHint,
    showMockDialog,
    mockForm
  };
}
