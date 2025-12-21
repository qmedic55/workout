import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useShareCard, type ShareCardData } from "@/hooks/use-share-card";
import { Share2, Download, Copy, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ShareButtonProps {
  cardData: ShareCardData;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

// Check if native sharing is available
function canShareNatively(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

// Check if running on mobile
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function ShareButton({
  cardData,
  variant = "outline",
  size = "default",
  className,
}: ShareButtonProps) {
  const { generateCard, isGenerating } = useShareCard();
  const { toast } = useToast();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  // Log share event mutation
  const logShareMutation = useMutation({
    mutationFn: async (platform: string) => {
      await apiRequest("POST", "/api/share/log", {
        cardType: cardData.type,
        platform,
      });
    },
  });

  // Generate the image if not already generated
  const ensureImage = async (): Promise<Blob> => {
    if (imageBlob) return imageBlob;
    const blob = await generateCard(cardData);
    setImageBlob(blob);
    return blob;
  };

  // Native share using Web Share API
  const handleNativeShare = async () => {
    try {
      const blob = await ensureImage();
      const file = new File([blob], "vitalpath-progress.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: cardData.title,
          text: cardData.subtitle || "Check out my progress on VitalPath!",
        });
        logShareMutation.mutate("native");
        toast({
          title: "Shared successfully!",
          description: "Your progress has been shared.",
        });
      } else {
        // Fallback to sharing without file
        await navigator.share({
          title: cardData.title,
          text: cardData.subtitle || "Check out my progress on VitalPath!",
          url: cardData.username
            ? `https://vitalpath.app/u/${cardData.username}`
            : "https://vitalpath.app",
        });
        logShareMutation.mutate("native_link");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Share failed",
          description: "Could not share. Try downloading the image instead.",
          variant: "destructive",
        });
      }
    }
  };

  // Download image
  const handleDownload = async () => {
    try {
      const blob = await ensureImage();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vitalpath-${cardData.type}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logShareMutation.mutate("download");
      toast({
        title: "Image downloaded!",
        description: "Share it on your favorite social media.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not generate the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy profile link
  const handleCopyLink = async () => {
    const url = cardData.username
      ? `https://vitalpath.app/u/${cardData.username}`
      : "https://vitalpath.app";

    try {
      await navigator.clipboard.writeText(url);
      logShareMutation.mutate("copy");
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // On mobile with native share support, show single button
  if (isMobile() && canShareNatively()) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {size !== "icon" && <span className="ml-2">Share</span>}
      </Button>
    );
  }

  // On desktop, show dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {size !== "icon" && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download Image
        </DropdownMenuItem>
        {cardData.username && (
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Profile Link
          </DropdownMenuItem>
        )}
        {canShareNatively() && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
