import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, Loader2 } from "lucide-react";

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export function ProfilePictureUpload({
  currentImageUrl,
  firstName,
  lastName,
}: ProfilePictureUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "VP";

  const updateProfileMutation = useMutation({
    mutationFn: async (profileImageUrl: string | null) => {
      const response = await apiRequest("PATCH", "/api/profile", { profileImageUrl });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setPreviewUrl(null);
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      // Create an image to resize if needed
      const img = new Image();
      img.onload = () => {
        // Resize to max 200x200 for profile pictures
        const canvas = document.createElement("canvas");
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 (JPEG for smaller size)
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPreviewUrl(resizedDataUrl);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (previewUrl) {
      updateProfileMutation.mutate(previewUrl);
    }
  };

  const handleRemove = () => {
    updateProfileMutation.mutate(null);
    setPreviewUrl(null);
  };

  const handleCancel = () => {
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Picture
        </CardTitle>
        <CardDescription>Upload a photo for your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-muted">
            {displayUrl && <AvatarImage src={displayUrl} alt="Profile" />}
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="profile-picture-input"
            />

            {!previewUrl ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateProfileMutation.isPending}
                  data-testid="upload-picture-button"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {currentImageUrl ? "Change Photo" : "Upload Photo"}
                </Button>

                {currentImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemove}
                    disabled={updateProfileMutation.isPending}
                    className="text-destructive hover:text-destructive"
                    data-testid="remove-picture-button"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  data-testid="save-picture-button"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Save Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              JPG, PNG, or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
