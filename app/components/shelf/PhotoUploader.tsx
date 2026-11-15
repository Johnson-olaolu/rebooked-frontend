import { Camera, ImagePlus, Loader2, RotateCw, Star, X } from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type Dispatch,
    type DragEvent,
    type SetStateAction,
} from "react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import fileService from "~/services/file.service";
import { getErrorMessage } from "~/utils/https";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export interface ShelfPhoto {
    key: string;
    file: File;
    previewUrl: string;
    status: "uploading" | "done" | "error";
    /** File id from POST /file once uploaded. */
    id?: string;
}

/** The picked cover if it's still there and uploaded, otherwise the first uploaded photo. */
export const resolveCoverKey = (photos: ShelfPhoto[], coverKey?: string) => {
    const uploaded = photos.filter((photo) => photo.status === "done");
    return uploaded.find((photo) => photo.key === coverKey)?.key ?? uploaded[0]?.key;
};

interface PhotoUploaderProps {
    photos: ShelfPhoto[];
    setPhotos: Dispatch<SetStateAction<ShelfPhoto[]>>;
    coverKey?: string;
    onCoverChange: (key: string) => void;
    max: number;
    invalid?: boolean;
    disabled?: boolean;
}

/** Drop zone + thumbnails. Photos upload as soon as they're picked; any one can be made the cover. */
const PhotoUploader = ({ photos, setPhotos, coverKey, onCoverChange, max, invalid, disabled }: PhotoUploaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const cover = resolveCoverKey(photos, coverKey);
    const remaining = max - photos.length;

    // Free the object URLs when the page goes away.
    const photosRef = useRef(photos);
    photosRef.current = photos;
    useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)), []);

    const upload = (photo: ShelfPhoto) => {
        setPhotos((current) => current.map((item) => (item.key === photo.key ? { ...item, status: "uploading" } : item)));
        fileService
            .upload(photo.file)
            .then(({ data }) =>
                setPhotos((current) =>
                    current.map((item) => (item.key === photo.key ? { ...item, status: "done", id: data.id } : item)),
                ),
            )
            .catch((error) => {
                setPhotos((current) => current.map((item) => (item.key === photo.key ? { ...item, status: "error" } : item)));
                toast.error(getErrorMessage(error, "A photo didn't upload. Tap it to try again."));
            });
    };

    const addFiles = (files: FileList | File[]) => {
        const list = Array.from(files);
        const images = list.filter((file) => file.type.startsWith("image/"));
        if (images.length < list.length) toast.error("Only image files can be added.");
        const small = images.filter((file) => file.size <= MAX_PHOTO_BYTES);
        if (small.length < images.length) toast.error("Photos must be 10MB or smaller.");
        if (small.length > remaining) toast.error(`You can add up to ${max} photos.`);

        const added = small.slice(0, Math.max(remaining, 0)).map<ShelfPhoto>((file) => ({
            key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            status: "uploading",
        }));
        if (added.length === 0) return;
        setPhotos((current) => [...current, ...added]);
        added.forEach(upload);
    };

    const remove = (key: string) => {
        setPhotos((current) => {
            const photo = current.find((item) => item.key === key);
            if (photo) URL.revokeObjectURL(photo.previewUrl);
            return current.filter((item) => item.key !== key);
        });
    };

    const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) addFiles(event.target.files);
        event.target.value = "";
    };

    const handleDrop =(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Touch devices: open the camera directly, or pick from the gallery. */}
            {remaining > 0 && (
                <div className="hidden grid-cols-2 gap-2.5 pointer-coarse:grid">
                    {[
                        { label: "Take photo", icon: Camera, input: cameraRef },
                        { label: "Choose photos", icon: ImagePlus, input: inputRef },
                    ].map(({ label, icon: Icon, input }) => (
                        <button
                            key={label}
                            type="button"
                            disabled={disabled}
                            aria-invalid={invalid}
                            onClick={() => input.current?.click()}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-foreground/20 bg-card px-3 py-5 font-semibold outline-none active:bg-secondary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
                                invalid && "border-destructive",
                            )}
                        >
                            <Icon className="size-6 text-foreground/45" aria-hidden />
                            {label}
                        </button>
                    ))}
                </div>
            )}
            {/* Mouse/trackpad: drop zone that also opens the file picker. */}
            {remaining > 0 && (
                <div
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled}
                    aria-invalid={invalid}
                    onClick={() => !disabled && inputRef.current?.click()}
                    onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && !disabled) {
                            event.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        "flex cursor-pointer flex-col items-center pointer-coarse:hidden justify-center gap-1.5 rounded-lg border-2 border-dashed border-foreground/20 bg-card px-4 py-7 text-center transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        dragging && "border-primary bg-secondary",
                        invalid && "border-destructive",
                        disabled && "pointer-events-none opacity-60",
                    )}
                >
                    <ImagePlus className="size-6 text-foreground/45" aria-hidden />
                    <span className="font-semibold">{photos.length ? "Add more photos" : "Drop the cover photo"}</span>
                    <span className="text-sm text-foreground/55">
                        or click to choose
                    </span>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleInput}
            />
            {/* `capture` opens the rear camera on phones; browsers without a camera fall back to the picker. */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleInput}
            />

            {photos.length > 0 && (
                <ul className="grid grid-cols-3 gap-2.5" aria-label="Photos">
                    {photos.map((photo, index) => {
                        const isCover = photo.key === cover;
                        return (
                            <li
                                key={photo.key}
                                className={cn(
                                    "group relative aspect-[3/4] overflow-hidden rounded-md border border-foreground/10 bg-secondary",
                                    isCover && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                )}
                            >
                                <img src={photo.previewUrl} alt={`Photo ${index + 1}`} className="size-full object-cover" />

                                {photo.status === "uploading" && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                                        <Loader2 className="size-5 animate-spin text-foreground/70" aria-label="Uploading" />
                                    </span>
                                )}
                                {photo.status === "error" && (
                                    <button
                                        type="button"
                                        onClick={() => upload(photo)}
                                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/75 text-xs font-semibold text-destructive"
                                    >
                                        <RotateCw className="size-4" aria-hidden />
                                        Retry
                                    </button>
                                )}

                                {isCover ? (
                                    <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                                        Cover
                                    </span>
                                ) : (
                                    photo.status === "done" && (
                                        <button
                                            type="button"
                                            onClick={() => onCoverChange(photo.key)}
                                            disabled={disabled}
                                            className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-background/90 px-1 py-0.5 text-[11px] font-semibold whitespace-nowrap text-foreground shadow-sm hover:bg-background"
                                        >
                                            <Star className="size-3" aria-hidden />
                                            Make cover
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() => remove(photo.key)}
                                    disabled={disabled}
                                    aria-label={`Remove photo ${index + 1}`}
                                    className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1 text-foreground/70 shadow-sm hover:text-destructive"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
            <p className="text-sm text-foreground/55">
                Front cover first, then spine and any damage. {remaining > 0 ? `${remaining} of ${max} left.` : `That's the most you can add (${max}).`}
            </p>
        </div>
    );
};

export default PhotoUploader;
