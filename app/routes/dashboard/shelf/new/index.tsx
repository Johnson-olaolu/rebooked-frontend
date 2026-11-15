import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import CategoryMultiSelect from "~/components/shelf/CategoryMultiSelect";
import PhotoUploader, { resolveCoverKey, type ShelfPhoto } from "~/components/shelf/PhotoUploader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import categoryService from "~/services/category.service";
import type { BookCondition, ICreateBookPayload } from "~/types/book";
import { BOOK_CONDITIONS, BOOK_LIMITS, CONDITION_HINTS, conditionLabel, isValidIsbn, normalizeIsbn } from "~/utils/book";
import { getErrorMessage, getFieldErrors } from "~/utils/https";
import { formatNaira } from "~/utils/money";

const MAX_PRICE = 10_000_000;

type FieldKey = "title" | "author" | "isbn" | "condition" | "categoryIds" | "price" | "description" | "photos";
type Errors = Partial<Record<FieldKey, string>>;
type Mode = "ACTIVE" | "DRAFT";

interface FormValues {
    title: string;
    author: string;
    isbn: string;
    condition?: BookCondition;
    categoryIds: string[];
    isFree: boolean;
    /** Digits only. */
    price: string;
    description: string;
}

const EMPTY: FormValues = {
    title: "",
    author: "",
    isbn: "",
    condition: undefined,
    categoryIds: [],
    isFree: false,
    price: "",
    description: "",
};

/** Publishing needs everything; a draft only needs a title. Length/format rules apply to both. */
const validate = (values: FormValues, photos: ShelfPhoto[], mode: Mode): Errors => {
    const errors: Errors = {};
    const title = values.title.trim();
    const author = values.author.trim();
    const description = values.description.trim();

    if (!title) errors.title = "Add the book's title";
    else if (title.length > BOOK_LIMITS.title) errors.title = `Keep it under ${BOOK_LIMITS.title} characters`;
    if (author.length > BOOK_LIMITS.author) errors.author = `Keep it under ${BOOK_LIMITS.author} characters`;
    if (values.isbn.trim() && !isValidIsbn(values.isbn)) errors.isbn = "An ISBN has 10 or 13 digits";
    if (description.length > BOOK_LIMITS.description) {
        errors.description = `Keep it under ${BOOK_LIMITS.description} characters`;
    }
    const price = Number(values.price);
    if (!values.isFree && values.price && price > MAX_PRICE) errors.price = "That price looks too high";

    if (mode === "ACTIVE") {
        if (!author && !errors.author) errors.author = "Add the author";
        if (!values.condition) errors.condition = "Pick a condition";
        if (values.categoryIds.length === 0) errors.categoryIds = "Pick at least one category";
        if (!values.isFree && !(price > 0) && !errors.price) errors.price = "Set a price, or give it away free";
        if (!description && !errors.description) errors.description = "Tell buyers a little about this copy";
        if (!photos.some((photo) => photo.status === "done")) errors.photos = "Add at least one photo";
    }
    return errors;
};

/** Short phrases for the "still needed" hint, in form order. */
const MISSING_LABELS: Partial<Record<FieldKey, string>> = {
    photos: "add a photo",
    title: "add the title",
    author: "add the author",
    condition: "pick a condition",
    categoryIds: "pick a category",
    price: "set a price",
    description: "write a description",
};

const SERVER_FIELDS: Record<string, FieldKey> = {
    title: "title",
    author: "author",
    isbn: "isbn",
    condition: "condition",
    categoryIds: "categoryIds",
    price: "price",
    isFree: "price",
    description: "description",
    imageIds: "photos",
    coverImageId: "photos",
};

const Field = ({
    label,
    htmlFor,
    optional,
    error,
    hint,
    children,
}: {
    label: string;
    htmlFor?: string;
    optional?: boolean;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
}) => (
    <div className="flex flex-col gap-2">
        <Label htmlFor={htmlFor}>
            {label} {optional && <span className="font-normal text-foreground/50">(optional)</span>}
        </Label>
        {children}
        {error ? (
            <span className="text-sm text-destructive">{error}</span>
        ) : hint ? (
            <span className="text-sm text-foreground/50">{hint}</span>
        ) : null}
    </div>
);

const AddToShelfPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [values, setValues] = useState<FormValues>(EMPTY);
    const [photos, setPhotos] = useState<ShelfPhoto[]>([]);
    const [coverKey, setCoverKey] = useState<string>();
    const [errors, setErrors] = useState<Errors>({});

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
    });

    const dirty = photos.length > 0 || JSON.stringify(values) !== JSON.stringify(EMPTY);
    const uploading = photos.some((photo) => photo.status === "uploading");
    const cover = photos.find((photo) => photo.key === resolveCoverKey(photos, coverKey));

    const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
        const errorKey: FieldKey | undefined = key === "isFree" ? "price" : (key as FieldKey);
        if (errorKey && errors[errorKey]) setErrors(({ [errorKey]: _removed, ...rest }) => rest);
    };

    const saveMutation = useMutation({
        mutationFn: (payload: ICreateBookPayload) => bookService.create(payload),
        onSuccess: (_response, payload) => {
            queryClient.invalidateQueries({ queryKey: ["shelf"] });
            toast.success(payload.status === "DRAFT" ? "Saved as draft." : "Added to your shelf.");
            navigate(payload.status === "DRAFT" ? "/dashboard/shelf?status=DRAFT" : "/dashboard/shelf", {
                replace: true,
            });
        },
        onError: (error) => {
            const fieldErrors = getFieldErrors(error);
            const mine: Errors = {};
            Object.entries(fieldErrors).forEach(([key, message]) => {
                const field = SERVER_FIELDS[key];
                if (field && !mine[field]) mine[field] = message;
            });
            setErrors(mine);
            toast.error(getErrorMessage(error, "We couldn't add that book. Please try again."));
        },
    });
    const saving = saveMutation.isPending;

    // Buttons stay disabled until the form can go through. Format problems (bad ISBN, too long)
    // show inline as you type; missing "required" fields go into the hint by the buttons instead.
    const draftErrors = validate(values, photos, "DRAFT");
    const publishErrors = validate(values, photos, "ACTIVE");
    const formatErrors: Errors = { ...draftErrors };
    if (!values.title.trim()) delete formatErrors.title;
    const shown: Errors = { ...formatErrors, ...errors };
    const missing = (Object.keys(MISSING_LABELS) as FieldKey[]).filter((key) => publishErrors[key] && !formatErrors[key]);
    const hint = uploading
        ? "Hang on, your photos are still uploading."
        : missing.length > 0
          ? `To add to shelf: ${missing.map((key) => MISSING_LABELS[key]).join(", ")}.`
          : Object.keys(formatErrors).length > 0
            ? "Fix the highlighted fields to continue."
            : "";
    const canDraft = Object.keys(draftErrors).length === 0 && !uploading && !saving;
    const canPublish = Object.keys(publishErrors).length === 0 && !uploading && !saving;

    // Warn before closing or reloading the tab with unsaved work.
    useEffect(() => {
        if (!dirty || saveMutation.isSuccess) return;
        const handler = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty, saveMutation.isSuccess]);

    const submit = (mode: Mode) => {
        // The buttons are disabled until this passes; this only guards against odd submits (e.g. Enter).
        if (!(mode === "DRAFT" ? canDraft : canPublish)) return;

        const uploaded = photos.filter((photo) => photo.status === "done" && photo.id);
        const imageIds = uploaded.map((photo) => photo.id!);
        const payload: ICreateBookPayload = {
            title: values.title.trim(),
            author: values.author.trim(),
            isbn: values.isbn.trim() ? normalizeIsbn(values.isbn) : "",
            condition: values.condition,
            isFree: values.isFree,
            price: values.isFree ? 0 : Number(values.price) || 0,
            description: values.description.trim(),
            categoryIds: values.categoryIds,
            tagNames: [],
            imageIds,
            // The backend requires a cover that's one of imageIds: the picked photo, else the first.
            coverImageId: cover?.id ?? imageIds[0],
            status: mode,
        };
        if (!payload.coverImageId) delete payload.coverImageId;
        saveMutation.mutate(payload);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submit("ACTIVE");
    };

    const handleCancel = () => {
        if (dirty && !window.confirm("Discard this book? Nothing has been saved.")) return;
        navigate("/dashboard/shelf");
    };

    const previewPrice = formatNaira(values.price ? Number(values.price) : undefined, values.isFree);
    const textareaClass =
        "w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <div>
                <Link
                    to="/dashboard/shelf"
                    className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
                >
                    <ArrowLeft className="size-4" aria-hidden />
                    My shelf
                </Link>
                <h1 className="font-serif text-3xl md:text-4xl">Add to shelf</h1>
                <p className="mt-1.5 text-foreground/60">
                    Buyers judge on the photo and the condition. Everything else is quick.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
                {/* Photos come first on mobile, sit on the right on desktop. */}
                <aside className="flex flex-col gap-5 lg:order-2">
                    <section className="rounded-lg border border-foreground/10 bg-card p-5">
                        <h2 className="mb-3 font-serif text-xl">Photos</h2>
                        <PhotoUploader
                            photos={photos}
                            setPhotos={(update) => {
                                setPhotos(update);
                                if (errors.photos) setErrors(({ photos: _removed, ...rest }) => rest);
                            }}
                            coverKey={coverKey}
                            onCoverChange={setCoverKey}
                            max={BOOK_LIMITS.photos}
                            invalid={!!shown.photos}
                            disabled={saving}
                        />
                        {shown.photos && <p className="mt-2 text-sm text-destructive">{shown.photos}</p>}
                    </section>

                    <section aria-label="Preview" className="hidden rounded-lg border border-foreground/10 bg-card p-5 lg:block">
                        <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-foreground/55 uppercase">Preview</h2>
                        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-secondary">
                            {cover ? (
                                <img src={cover.previewUrl} alt="" className="size-full object-cover" />
                            ) : (
                                <div className="flex size-full items-center justify-center">
                                    <img src="/brand/rebooked-mark-ink.png" alt="" className="h-12 w-auto opacity-25" />
                                </div>
                            )}
                            {values.condition && (
                                <span className="absolute top-2 right-2 rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                                    {conditionLabel(values.condition)}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 truncate font-serif text-lg">{values.title.trim() || "Book title"}</div>
                        <div className="truncate text-sm text-foreground/60">{values.author.trim() || "Author"}</div>
                        <div className="mt-1.5 font-semibold text-primary">{previewPrice || "₦—"}</div>
                    </section>
                </aside>

                <section className="flex flex-col gap-5 rounded-lg border border-foreground/10 bg-card p-5 md:p-6 lg:order-1">
                    <Field label="Title" htmlFor="title" error={shown.title}>
                        <Input
                            id="title"
                            value={values.title}
                            onChange={(event) => set("title", event.target.value)}
                            aria-invalid={!!shown.title}
                            maxLength={BOOK_LIMITS.title}
                            placeholder="Half of a Yellow Sun"
                        />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-[1fr_190px]">
                        <Field label="Author" htmlFor="author" error={shown.author}>
                            <Input
                                id="author"
                                value={values.author}
                                onChange={(event) => set("author", event.target.value)}
                                aria-invalid={!!shown.author}
                                maxLength={BOOK_LIMITS.author}
                                placeholder="Chimamanda Ngozi Adichie"
                            />
                        </Field>
                        <Field label="ISBN" htmlFor="isbn" optional error={shown.isbn}>
                            <Input
                                id="isbn"
                                value={values.isbn}
                                onChange={(event) => set("isbn", event.target.value)}
                                aria-invalid={!!shown.isbn}
                                inputMode="numeric"
                                maxLength={17}
                                placeholder="9780007200283"
                            />
                        </Field>
                    </div>

                    <Field
                        label="Condition"
                        error={shown.condition}
                        hint={`${CONDITION_HINTS[values.condition ?? "GOOD"]} Be honest — it's what your rating is built on.`}
                    >
                        <div role="radiogroup" aria-label="Condition" aria-invalid={!!shown.condition} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            {BOOK_CONDITIONS.map(({ value, label }) => {
                                const checked = values.condition === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        onClick={() => set("condition", value)}
                                        className={cn(
                                            "h-11 rounded-lg border text-[15px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                                            checked
                                                ? "border-2 border-primary bg-secondary font-semibold"
                                                : "border-input hover:border-foreground/30",
                                            shown.condition && !checked && "border-destructive/60",
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>

                    <Field
                        label="Categories"
                        htmlFor="categories"
                        error={shown.categoryIds ?? (categoriesQuery.isError ? "We couldn't load categories." : undefined)}
                        hint="Pick as many as fit — it helps buyers find it."
                    >
                        <CategoryMultiSelect
                            id="categories"
                            categories={categoriesQuery.data ?? []}
                            value={values.categoryIds}
                            onChange={(ids) => set("categoryIds", ids)}
                            loading={categoriesQuery.isLoading}
                            invalid={!!shown.categoryIds}
                        />
                    </Field>

                    <Field label="Asking price" htmlFor="price" error={shown.price}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div
                                className={cn(
                                    "flex h-9 items-center rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 sm:w-48",
                                    shown.price && "border-destructive ring-3 ring-destructive/20",
                                    values.isFree && "opacity-50",
                                )}
                            >
                                <span className="pl-3 font-semibold text-foreground/60">₦</span>
                                <input
                                    id="price"
                                    inputMode="numeric"
                                    value={values.isFree ? "" : values.price ? Number(values.price).toLocaleString("en-NG") : ""}
                                    onChange={(event) => set("price", event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 8))}
                                    disabled={values.isFree}
                                    aria-invalid={!!shown.price}
                                    placeholder={values.isFree ? "Free" : "3,500"}
                                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                                />
                            </div>
                            <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={values.isFree}
                                    onClick={() => set("isFree", !values.isFree)}
                                    className={cn(
                                        "relative h-6 w-10 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                                        values.isFree ? "bg-primary" : "bg-foreground/20",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                                            values.isFree && "translate-x-4",
                                        )}
                                    />
                                </button>
                                Give it away free
                            </label>
                        </div>
                    </Field>

                    <Field
                        label="Description"
                        htmlFor="description"
                        error={shown.description}
                        hint={`${values.description.length} / ${BOOK_LIMITS.description}`}
                    >
                        <textarea
                            id="description"
                            rows={5}
                            value={values.description}
                            onChange={(event) => set("description", event.target.value)}
                            aria-invalid={!!shown.description}
                            maxLength={BOOK_LIMITS.description}
                            placeholder="Edition, any notes or highlights, and where you're happy to meet."
                            className={textareaClass}
                        />
                    </Field>
                </section>
            </div>

            <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-end gap-2 rounded-lg border border-foreground/10 bg-card/95 p-3 backdrop-blur sm:flex-nowrap sm:gap-2.5 md:bottom-4">
                <Button
                    type="button"
                    variant="ghost"
                    disabled={saving}
                    onClick={handleCancel}
                    className={cn("mr-auto h-11 rounded-md px-2 sm:px-4", hint && "sm:mr-0")}
                >
                    Cancel
                </Button>
                {hint && (
                    // Above the buttons on mobile, between Cancel and them on desktop.
                    <p
                        id="shelf-form-hint"
                        aria-live="polite"
                        className="order-first w-full px-1 text-sm text-foreground/60 sm:order-none sm:mr-auto sm:w-auto sm:flex-1"
                    >
                        {hint}
                    </p>
                )}
                <Button
                    type="button"
                    variant="outline"
                    disabled={!canDraft}
                    onClick={() => submit("DRAFT")}
                    className="h-11 rounded-md px-3 font-semibold sm:px-4"
                >
                    {saving && saveMutation.variables?.status === "DRAFT" ? "Saving…" : "Save as draft"}
                </Button>
                <Button
                    type="submit"
                    disabled={!canPublish}
                    aria-describedby={hint ? "shelf-form-hint" : undefined}
                    className="h-11 rounded-md bg-primary px-4 text-[15px] sm:px-6 font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {saving && saveMutation.variables?.status === "ACTIVE" ? "Adding…" : "Add to shelf"}
                </Button>
            </div>
        </form>
    );
};

export default AddToShelfPage;
