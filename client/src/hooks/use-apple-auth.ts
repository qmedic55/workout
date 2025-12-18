import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SignInWithApple, SignInWithAppleOptions, SignInWithAppleResponse } from "@capacitor-community/apple-sign-in";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAppleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isAppleSignInAvailable = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const signInWithApple = async () => {
    if (!isAppleSignInAvailable) {
      toast({
        title: "Not Available",
        description: "Sign in with Apple is only available on iOS devices.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const options: SignInWithAppleOptions = {
        clientId: "com.vitalpath.app",
        redirectURI: "https://health-mentor-ai--ikugelman.replit.app/api/auth/apple/callback",
        scopes: "email name",
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
      };

      const result: SignInWithAppleResponse = await SignInWithApple.authorize(options);

      // Send the authorization to the server
      const response = await apiRequest("POST", "/api/auth/apple", {
        identityToken: result.response.identityToken,
        authorizationCode: result.response.authorizationCode,
        email: result.response.email,
        givenName: result.response.givenName,
        familyName: result.response.familyName,
        user: result.response.user,
      });

      if (response.ok) {
        // Invalidate auth query to refresh user state
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Apple.",
        });
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      console.error("Apple Sign In error:", error);

      // User cancelled is not really an error
      if (error?.message?.includes("cancelled") || error?.code === "ERR_CANCELED") {
        return;
      }

      toast({
        title: "Sign In Failed",
        description: error.message || "Could not sign in with Apple. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithApple,
    isLoading,
    isAppleSignInAvailable,
  };
}
