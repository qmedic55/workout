import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface ShareResult {
  success: boolean;
  method: "capacitor" | "web" | "fallback";
  error?: string;
}

/**
 * Share content using the best available method:
 * 1. Capacitor Share plugin (native iOS/Android)
 * 2. Web Share API (modern browsers)
 * 3. Returns false if neither is available
 */
export async function shareNative(options: ShareOptions): Promise<ShareResult> {
  // Try Capacitor native share first
  if (Capacitor.isNativePlatform()) {
    try {
      // Capacitor Share doesn't support files directly, only text/url
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.title || "Share",
      });
      return { success: true, method: "capacitor" };
    } catch (error) {
      // User may have cancelled, which throws an error
      const message = error instanceof Error ? error.message : "Share cancelled";
      if (message.includes("cancel")) {
        return { success: false, method: "capacitor", error: "Cancelled" };
      }
      console.error("Capacitor share error:", error);
    }
  }

  // Try Web Share API
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const shareData: ShareData = {
        title: options.title,
        text: options.text,
        url: options.url,
      };

      // Add files if supported
      if (options.files && options.files.length > 0) {
        if (navigator.canShare && navigator.canShare({ files: options.files })) {
          shareData.files = options.files;
        }
      }

      await navigator.share(shareData);
      return { success: true, method: "web" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Share failed";
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, method: "web", error: "Cancelled" };
      }
      console.error("Web share error:", error);
      return { success: false, method: "web", error: message };
    }
  }

  // Neither method available
  return { success: false, method: "fallback", error: "Sharing not supported" };
}

/**
 * Check if native sharing is available
 */
export function canShare(): boolean {
  return (
    Capacitor.isNativePlatform() ||
    (typeof navigator !== "undefined" && !!navigator.share)
  );
}

/**
 * Check if file sharing is supported
 */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.canShare) return false;

  // Test with a dummy file
  const testFile = new File(["test"], "test.txt", { type: "text/plain" });
  return navigator.canShare({ files: [testFile] });
}

/**
 * Share an image blob
 */
export async function shareImage(
  blob: Blob,
  filename: string,
  title?: string,
  text?: string
): Promise<ShareResult> {
  const file = new File([blob], filename, { type: blob.type });

  return shareNative({
    title,
    text,
    files: [file],
  });
}

/**
 * Copy text to clipboard (fallback for when sharing isn't available)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
