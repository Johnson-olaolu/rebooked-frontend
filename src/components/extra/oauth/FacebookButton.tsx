/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore, useUserStore } from "@/store";
import AuthService from "@/services/auth.service";

interface FacebookButtonProps {
  isLoading?: boolean;
  className?: string;
}

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (response: any) => void, params: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export function FacebookButton({ isLoading, className }: FacebookButtonProps) {
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="connect.facebook.net"]')) {
      setIsScriptLoaded(true);
      return;
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v20.0",
      });
      setIsScriptLoaded(true);
    };

    // Load the SDK asynchronously
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete window.fbAsyncInit;
    };
  }, []);

  const handleFacebookLogin = async () => {
    if (!window.FB) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Facebook SDK not loaded",
      });
      return;
    }

    try {
      setIsFacebookLoading(true);
      const response = await new Promise((resolve, reject) => {
        window.FB?.login(
          (response) => {
            if (response.authResponse) {
              resolve(response.authResponse);
            } else {
              reject(new Error("User cancelled login or did not fully authorize"));
            }
          },
          { scope: "email,public_profile" }
        );
      });

      const authResponse = await AuthService.facebookLogin({
        accessToken: (response as { accessToken: string }).accessToken,
      });

      if (authResponse.data) {
        setAuth(authResponse.data.token);
        toast({
          title: "Success",
          description: "Successfully logged in with Facebook",
        });

        if (!authResponse.data.user.emailVerified) {
          navigate(`/auth/verify-email?email=${authResponse.data.user.email}`);
        } else if (authResponse.data.user.role.name === "user") {
          setUser(authResponse.data.user);
          navigate("/");
        } else if (!authResponse.data.user.onboarded) {
          navigate("/seller/onboarding");
        } else {
          navigate("/seller/dashboard");
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to login with Facebook",
      });
    } finally {
      setIsFacebookLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isLoading || isFacebookLoading || !isScriptLoaded}
      onClick={handleFacebookLogin}
    >
      <Facebook className="h-5 w-5 mr-2" />
      Facebook
    </Button>
  );
}
