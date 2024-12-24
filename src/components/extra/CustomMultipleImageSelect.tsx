import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import FileService from "@/services/file.service";
import { IFile } from "@/services/types";
import fileService from "@/services/file.service";

interface CustomMultipleImageSelectProps {
  images?: IFile[];
  label?: string;
  onImagesChange: (files: IFile[]) => void;
  maxFiles?: number;
}

export function CustomMultipleImageSelect({ images = [], label = "image", onImagesChange, maxFiles = 5 }: CustomMultipleImageSelectProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const files = Array.from(e.target.files);

    if (files.length + images.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} images`,
      });
      return;
    }

    // Validate file types and sizes
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter((file) => !file.type.startsWith("image/") || file.size > MAX_SIZE);

    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid files",
        description: "All files must be images under 5MB",
      });
      return;
    }

    try {
      setIsUploading(true);
      const uploadedFiles: IFile[] = [];

      for (const file of files) {
        const response = await FileService.uploadDocument({
          setProgress: (progress: number) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            }));
          },
          file,
          label,
        });

        if (response?.data) {
          uploadedFiles.push(response.data);
        }
      }

      onImagesChange([...images, ...uploadedFiles]);
      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload images",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleRemoveImage = (index: number) => {
    fileService.deleteDocument(images[index].id);
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {images.map((image, index) => (
          <div key={image.id} className="relative aspect-square">
            <img src={image.url} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded-md" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => handleRemoveImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {images.length < maxFiles && (
          <div
            role="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:bg-zinc-100 cursor-pointer"
          >
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      <Input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isUploading} />

      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="text-sm text-gray-500">
              Uploading {fileName}: {progress}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
