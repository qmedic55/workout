/**
 * Hook to detect and sync user's timezone to the server
 * This runs once when the user is authenticated to ensure their timezone is set correctly
 */

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserProfile {
  timezone?: string | null;
  [key: string]: unknown;
}

export function useTimezoneSync() {
  const hasSynced = useRef(false);

  // Get the current profile
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  // Mutation to update the timezone
  const updateTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      return apiRequest("PATCH", "/api/profile", { timezone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  useEffect(() => {
    // Only run once per session
    if (hasSynced.current) return;

    // Wait for profile to load
    if (!profile) return;

    // Detect the user's timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Check if timezone needs to be updated
    // Update if: no timezone set, or timezone is different (user traveled)
    if (!profile.timezone || profile.timezone !== detectedTimezone) {
      console.log(`[TIMEZONE] Updating timezone from "${profile.timezone}" to "${detectedTimezone}"`);
      updateTimezoneMutation.mutate(detectedTimezone);
      hasSynced.current = true;
    } else {
      // Already set correctly
      hasSynced.current = true;
    }
  }, [profile, updateTimezoneMutation]);
}
