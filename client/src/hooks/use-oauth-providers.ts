import { useQuery } from "@tanstack/react-query";

interface ProvidersResponse {
  providers: string[];
}

export function useOAuthProviders() {
  const { data, isLoading, error } = useQuery<ProvidersResponse>({
    queryKey: ["/api/auth/providers"],
    queryFn: async () => {
      const res = await fetch("/api/auth/providers");
      if (!res.ok) {
        throw new Error("Failed to fetch providers");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  return {
    providers: data?.providers || [],
    isLoading,
    error,
    hasGoogle: data?.providers?.includes("google") || false,
    hasFacebook: data?.providers?.includes("facebook") || false,
    hasTwitter: data?.providers?.includes("twitter") || false,
    hasApple: data?.providers?.includes("apple") || false,
  };
}
