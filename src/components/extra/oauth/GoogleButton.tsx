/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store";
import AuthService from "@/services/auth.service";

interface GoogleButtonProps {
  isLoading?: boolean;
  className?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleButton({ isLoading, className }: GoogleButtonProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isScriptLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(document.getElementById("googleButton")!, {
        theme: "outline",
        size: "large",
      });
      window.google.accounts.id.prompt();
    }
  }, [isScriptLoaded]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsGoogleLoading(true);
      const authResponse = await AuthService.googleLogin({
        accessToken: response.credential,
      });

      if (authResponse.data) {
        setAuth(authResponse.data.token);
        toast({
          title: "Success",
          description: "Successfully logged in with Google",
        });

        if (!authResponse.data.user.emailVerified) {
          navigate(`/auth/verify-email?email=${authResponse.data.user.email}`);
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
        description: "Failed to login with Google",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (window.google) {
      //   window.google.accounts.id.prompt();
      console.log(document.getElementById("googleButton"));
      const button = document.querySelector('#googleButton [role="button"]') as HTMLElement;
      button?.click();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={isLoading || isGoogleLoading || !isScriptLoaded}
        onClick={handleGoogleLogin}
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path
            d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
            fill="currentColor"
          />
        </svg>
        Google
      </Button>
      <div id="googleButton" style={{ display: "none" }}></div>
    </>
  );
}
