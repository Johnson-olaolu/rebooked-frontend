import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import AuthorMultiSelect from "~/components/shelf/AuthorMultiSelect";
import CategoryMultiSelect from "~/components/shelf/CategoryMultiSelect";
import PhotoUploader, { resolveCoverKey, type ShelfPhoto } from "~/components/shelf/PhotoUploader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import categoryService from "~/services/category.service";
import type { IAuthorSummary } from "~/types/author";
import type { BookCondition, IBook, IUpdateBookPayload } from "~/types/book";
import { MAX_BOOK_AUTHORS, authorLine, bookAuthorToSummary } from "~/utils/author";
import { BOOK_CONDITIONS, BOOK_LIMITS, CONDITION_HINTS, conditionLabel, isValidIsbn, normalizeIsbn } from "~/utils/book";
import { getErrorMessage, getFieldErrors } from "~/utils/https";
import { formatNaira } from "~/utils/money";

const MAX_PRICE = 10_000_000;

type FieldKey = "title" | "authors" | "isbn" | "condition" | "categoryIds" | "price" | "description" | "photos";
type Errors = Partial<Record<FieldKey, string>>;
/** Which rules a button needs: a draft only needs a title, publishing needs everything. */
export type BookFormRules = "ACTIVE" | "DRAFT";
type Mode = BookFormRules;

export interface BookFormValues {
    title: string;
    /** In display order (API_CHANGES #23b). */
    authors: IAuthorSummary[];
    isbn: string;
    condition?: BookCondition;
    categoryIds: string[];
    isFree: boolean;
    /** Digits only. */
    price: string;
    description: string;
}

export const EMPTY_BOOK_FORM: BookFormValues = {
    title: "",
    authors: [],
    isbn: "",
    condition: undefined,
    categoryIds: [],
    isFree: false,
    price: "",
    description: "",
};

/** Publishing needs everything; a draft only needs a title. Length/format rules apply to both. */
const validate = (values: BookFormValues, photos: ShelfPhoto[], mode: Mode): Errors => {
    const errors: Errors = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) errors.title = "Add the book's title";
    else if (title.length > BOOK_LIMITS.title) errors.title = `Keep it under ${BOOK_LIMITS.title} characters`;
    if (values.authors.length > MAX_BOOK_AUTHORS) errors.authors = `Up to ${MAX_BOOK_AUTHORS} authors`;
    if (values.isbn.trim() && !isValidIsbn(values.isbn)) errors.isbn = "An ISBN has 10 or 13 digits";
    if (description.length > BOOK_LIMITS.description) {
        errors.description = `Keep it under ${BOOK_LIMITS.description} characters`;
    }
    const price = Number(values.price);
    if (!values.isFree && values.price && price > MAX_PRICE) errors.price = "That price looks too high";

    if (mode === "ACTIVE") {
        if (values.authors.length === 0) errors.authors = "Add the author";
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
    authors: "add the author",
    condition: "pick a condition",
    categoryIds: "pick a category",
    price: "set a price",
    description: "write a description",
};

const SERVER_FIELDS: Record<string, FieldKey> = {
    title: "title",
    authorIds: "authors",
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

/** Turns a saved book into form state; existing photos come in already uploaded. */
export const bookToFormState = (book: IBook): BookFormInitial => {
    const photos: ShelfPhoto[] = (book.images ?? []).map((image) => ({
        key: image.id,
        id: image.id,
        previewUrl: image.url,
        status: "done",
    }));
    return {
        values: {
            title: book.title ?? "",
            authors: (book.authors ?? []).map(bookAuthorToSummary),
            isbn: book.isbn ?? "",
            condition: book.condition ?? undefined,
            categoryIds: (book.categories ?? []).map((category) => category.id),
            isFree: !!book.isFree,
            price: !book.isFree && book.price ? String(Math.round(book.price)) : "",
            description: book.description ?? "",
        },
        photos,
        coverKey: book.coverImage?.id,
    };
};

export interface BookFormInitial {
    values: BookFormValues;
    photos: ShelfPhoto[];
    coverKey?: string;
}

export interface BookFormAction {
    key: string;
    label: string;
    busyLabel: string;
    /** Which validation must pass before the button enables. */
    rules: BookFormRules;
    /** Rendered as the form's submit button (the last, filled one). */
    primary?: boolean;
    /** Only enable once something has changed (e.g. "Save changes"). */
    requiresChange?: boolean;
    /** Throw (or reject) to keep the form open; field errors from the API land on the fields. */
    onSave: (payload: IUpdateBookPayload) => Promise<unknown>;
}

interface BookFormProps {
    header: ReactNode;
    actions: BookFormAction[];
    initial?: BookFormInitial;
    /** Where Cancel goes. */
    cancelTo: string;
    discardMessage?: string;
    /** Shows the form but locks every field and hides the buttons. */
    readOnly?: boolean;
    readOnlyNote?: ReactNode;
}

const NEW_BOOK: BookFormInitial = { values: EMPTY_BOOK_FORM, photos: [] };

const photoSignature = (photos: ShelfPhoto[], coverKey?: string) =>
    `${photos.map((photo) => photo.id ?? photo.key).join(",")}|${resolveCoverKey(photos, coverKey) ?? ""}`;

/** The add / edit book form: fields, photos, live preview and a sticky action bar. */
const BookForm = ({
    header,
    actions,
    initial = NEW_BOOK,
    cancelTo,
    discardMessage = "Discard this book? Nothing has been saved.",
    readOnly = false,
    readOnlyNote,
}: BookFormProps) => {
    const navigate = useNavigate();
    const [values, setValues] = useState<BookFormValues>(initial.values);
    const [photos, setPhotos] = useState<ShelfPhoto[]>(initial.photos);
    const [coverKey, setCoverKey] = useState<string | undefined>(initial.coverKey);
    const [errors, setErrors] = useState<Errors>({});

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
    });

    const initialSignature = useMemo(() => photoSignature(initial.photos, initial.coverKey), [initial]);
    const dirty =
        JSON.stringify(values) !== JSON.stringify(initial.values) || photoSignature(photos, coverKey) !== initialSignature;
    const uploading = photos.some((photo) => photo.status === "uploading");
    const cover = photos.find((photo) => photo.key === resolveCoverKey(photos, coverKey));

    const set = <K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
        const errorKey: FieldKey | undefined = key === "isFree" ? "price" : (key as FieldKey);
        if (errorKey && errors[errorKey]) setErrors(({ [errorKey]: _removed, ...rest }) => rest);
    };

    const saveMutation = useMutation({
        mutationFn: ({ action, payload }: { action: BookFormAction; payload: IUpdateBookPayload }) => action.onSave(payload),
        onError: (error) => {
            const fieldErrors = getFieldErrors(error);
            const mine: Errors = {};
            Object.entries(fieldErrors).forEach(([key, message]) => {
                const field = SERVER_FIELDS[key];
                if (field && !mine[field]) mine[field] = message;
            });
            setErrors(mine);
            toast.error(getErrorMessage(error, "We couldn't save that book. Please try again."));
        },
    });
    const saving = saveMutation.isPending;
    const savingKey = saving ? saveMutation.variables?.action.key : undefined;

    // Buttons stay disabled until the form can go through. Format problems (bad ISBN, too long)
    // show inline as you type; missing "required" fields go into the hint by the buttons instead.
    const draftErrors = validate(values, photos, "DRAFT");
    const publishErrors = validate(values, photos, "ACTIVE");
    const formatErrors: Errors = { ...draftErrors };
    if (!values.title.trim()) delete formatErrors.title;
    const shown: Errors = { ...formatErrors, ...errors };
    const canRun = (action: BookFormAction) =>
        !readOnly &&
        !uploading &&
        !saving &&
        (!action.requiresChange || dirty) &&
        Object.keys(action.rules === "DRAFT" ? draftErrors : publishErrors).length === 0;

    const primary = actions.find((action) => action.primary) ?? actions[actions.length - 1];
    const primaryErrors = primary?.rules === "DRAFT" ? draftErrors : publishErrors;
    const missing = (Object.keys(MISSING_LABELS) as FieldKey[]).filter((key) => primaryErrors[key] && !formatErrors[key]);
    const hint = uploading
        ? "Hang on, your photos are still uploading."
        : missing.length > 0 && primary
          ? `To ${primary.label.charAt(0).toLowerCase()}${primary.label.slice(1)}: ${missing.map((key) => MISSING_LABELS[key]).join(", ")}.`
          : Object.keys(formatErrors).length > 0
            ? "Fix the highlighted fields to continue."
            : "";

    // Warn before closing or reloading the tab with unsaved work.
    useEffect(() => {
        if (!dirty || readOnly || saveMutation.isSuccess) return;
        const handler = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty, readOnly, saveMutation.isSuccess]);

    const run = (action: BookFormAction) => {
        // The buttons are disabled until this passes; this only guards against odd submits (e.g. Enter).
        if (!canRun(action)) return;

        const uploaded = photos.filter((photo) => photo.status === "done" && photo.id);
        const imageIds = uploaded.map((photo) => photo.id!);
        const payload: IUpdateBookPayload = {
            title: values.title.trim(),
            authorIds: values.authors.map((author) => author.id),
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
        };
        if (!payload.coverImageId) delete payload.coverImageId;
        saveMutation.mutate({ action, payload });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (primary) run(primary);
    };

    const handleCancel = () => {
        if (dirty && !readOnly && !window.confirm(discardMessage)) return;
        navigate(cancelTo);
    };

    const previewPrice = formatNaira(values.price ? Number(values.price) : undefined, values.isFree);
    const textareaClass =
        "w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            {header}
            {readOnly && readOnlyNote && (
                <div className="rounded-lg border border-foreground/10 bg-secondary px-4 py-3 text-sm text-foreground/75">{readOnlyNote}</div>
            )}

            <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
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
                            <div className="truncate text-sm text-foreground/60">{authorLine(values.authors) || "Author"}</div>
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
                            <Field
                                label={values.authors.length > 1 ? "Authors" : "Author"}
                                htmlFor="authors"
                                error={shown.authors}
                                hint={values.authors.length > 1 ? "Shown in this order. Use ‹ to move an author earlier." : "Add co-authors and editors too."}
                            >
                                <AuthorMultiSelect
                                    id="authors"
                                    value={values.authors}
                                    onChange={(authors) => set("authors", authors)}
                                    invalid={!!shown.authors}
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
            </fieldset>

            {!readOnly && (
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
                    {actions.map((action) =>
                        action === primary ? (
                            <Button
                                key={action.key}
                                type="submit"
                                disabled={!canRun(action)}
                                aria-describedby={hint ? "shelf-form-hint" : undefined}
                                className="h-11 rounded-md bg-primary px-4 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90 sm:px-6"
                            >
                                {savingKey === action.key ? action.busyLabel : action.label}
                            </Button>
                        ) : (
                            <Button
                                key={action.key}
                                type="button"
                                variant="outline"
                                disabled={!canRun(action)}
                                onClick={() => run(action)}
                                className="h-11 rounded-md px-3 font-semibold sm:px-4"
                            >
                                {savingKey === action.key ? action.busyLabel : action.label}
                            </Button>
                        ),
                    )}
                </div>
            )}
        </form>
    );
};

export default BookForm;
