import { useState, useRef } from "react";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import FileService from "@/services/file.service";
import { IFile, IResponse } from "@/services/types";

interface CustomImageSelectProps {
  image?: IFile;
  label?: string;
  onImageChange: (file: IFile) => void;
  className?: string;
}

export function CustomImageSelect({ image, label = "image", onImageChange, className = "w-40 h-40" }: CustomImageSelectProps) {
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

      // Validate file size (5MB limit)
      const MAX_SIZE = 5 * 1024 * 1024;
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
            label,
          });
        } else {
          response = await FileService.uploadDocument({
            setProgress: (progress: number) => setUploadProgress(progress),
            file,
            label,
          });
        }

        if (response?.data) {
          onImageChange(response.data);
          toast({
            title: "Success",
            description: "Image uploaded successfully",
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload image",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {image ? (
        <div role="button" onClick={() => fileInputRef.current?.click()} tabIndex={0} className="relative w-full h-full">
          <img src={image.url} alt="Selected" className="w-full h-full object-cover rounded-md" />
          <Button type="button" variant="outline" size="icon" className="absolute bottom-0 right-0 ">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          className="w-full h-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:bg-zinc-100"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            disabled={isUploading}
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>
      )}

      {isUploading && uploadProgress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
          <div className="text-white font-semibold">{uploadProgress}%</div>
        </div>
      )}

      <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isUploading} />
    </div>
  );
}
