import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import FileService from "@/services/file.service";
import { IFile, IResponse } from "@/services/types";

interface CustomAvatarProps {
  readonly imageUrl?: string;
  readonly image?: IFile;
  readonly handleUpload: (file: IFile) => void;
  readonly className?: string;
  readonly fallback?: string;
}

export default function CustomAvatar({ image, imageUrl, handleUpload, className = "w-40 h-40", fallback }: CustomAvatarProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        });
        return;
      }

      // Validate file size (e.g., 5MB limit)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 5MB",
        });
        return;
      }

      try {
        setIsUploading(true);
        let response: IResponse<IFile>;
        if (image) {
          response = await FileService.updateDocument(image.id, {
            setProgress: (progress: number) => setUploadProgress(progress),
            file,
            label: "profile_picture",
          }).catch((e) => {
            console.log(e);
            throw new Error();
          });
        } else {
          response = await FileService.uploadDocument({
            setProgress: (progress: number) => setUploadProgress(progress),
            file,
            label: "profile_picture",
          }).catch(() => {
            throw new Error();
          });
        }

        if (response?.data) {
          handleUpload(response?.data);
          toast({
            title: "Success",
            description: "Profile picture updated successfully",
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload profile picture",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className={className}>
        <AvatarImage src={imageUrl} alt="Profile Picture" referrerPolicy="no-referrer" />
        <AvatarFallback className="text-4xl">{fallback}</AvatarFallback>
      </Avatar>

      {isUploading && uploadProgress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
          <div className="text-white font-semibold">{uploadProgress}%</div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute bottom-0 right-0 rounded-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Input
        id="profilePicture"
        name="profilePicture"
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
