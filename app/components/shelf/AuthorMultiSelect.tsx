import { Check, ChevronLeft, Plus, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import ProposeAuthorDialog from "~/components/shelf/ProposeAuthorDialog";
import { useAuthorSearch } from "~/hooks/useAuthorSearch";
import { cn } from "~/lib/utils";
import type { IAuthorSummary } from "~/types/author";
import { AUTHOR_SEARCH_MIN, MAX_BOOK_AUTHORS, authorContext } from "~/utils/author";

interface AuthorMultiSelectProps {
    id?: string;
    /** In display order. Whole objects, so chips keep their names whatever the search shows. */
    value: IAuthorSummary[];
    onChange: (authors: IAuthorSummary[]) => void;
    invalid?: boolean;
    /** Ids of the hint/error text under the field. */
    describedBy?: string;
}

type Option = { kind: "author"; author: IAuthorSummary } | { kind: "propose" };

/**
 * The book form's Authors field (API_CHANGES #23): type to search the catalogue, pick as many as
 * needed (in order), or add a missing author. Built like CategoryMultiSelect, but searches the server.
 */
const AuthorMultiSelect = ({ id, value, onChange, invalid = false, describedBy }: AuthorMultiSelectProps) => {
    const listId = useId();
    const anchorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [active, setActive] = useState(0);
    const [proposeOpen, setProposeOpen] = useState(false);
    const { term, ready, results, searching, isError } = useAuthorSearch(search);

    const full = value.length >= MAX_BOOK_AUTHORS;
    const typed = search.trim();
    const canPropose = typed.length >= AUTHOR_SEARCH_MIN && !full;
    const options: Option[] = [
        ...results.map((author): Option => ({ kind: "author", author })),
        ...(canPropose ? [{ kind: "propose" } as const] : []),
    ];
    const isSelected = (authorId: string) => value.some((author) => author.id === authorId);

    const add = (author: IAuthorSummary) => {
        if (!isSelected(author.id) && value.length < MAX_BOOK_AUTHORS) onChange([...value, author]);
        setSearch("");
        inputRef.current?.focus();
    };
    const remove = (authorId: string) => onChange(value.filter((author) => author.id !== authorId));
    const moveEarlier = (index: number) => {
        if (index < 1) return;
        const next = [...value];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        onChange(next);
    };

    const choose = (option: Option) => {
        if (option.kind === "propose") {
            setOpen(false);
            setProposeOpen(true);
            return;
        }
        if (isSelected(option.author.id)) {
            remove(option.author.id);
            setSearch("");
            inputRef.current?.focus();
        } else {
            add(option.author);
        }
    };

    const openList = () => {
        setOpen(true);
        setActive(0);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) return openList();
            setActive((index) => Math.min(index + 1, options.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            // Never submit the surrounding form from the search box.
            event.preventDefault();
            if (open && options[active]) choose(options[active]);
            else openList();
        } else if (event.key === "Escape") {
            setOpen(false);
        } else if (event.key === "Backspace" && !search && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const activeOption = open ? options[Math.min(active, options.length - 1)] : undefined;
    const optionId = (option: Option) => `${listId}-${option.kind === "author" ? option.author.id : "propose"}`;

    let status: string | null = null;
    if (full) status = `That's the most a book can have (${MAX_BOOK_AUTHORS}).`;
    else if (typed.length < AUTHOR_SEARCH_MIN) status = "Type at least 2 letters of the author's name.";
    else if (isError) status = "We couldn't search authors just now. Try again in a moment.";
    else if (results.length === 0 && searching) status = "Searching…";
    else if (results.length === 0 && ready && !searching) status = `No authors match “${term}”.`;

    return (
        <>
            <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
                <PopoverPrimitive.Anchor asChild>
                    <div
                        ref={anchorRef}
                        onClick={() => inputRef.current?.focus()}
                        aria-invalid={invalid}
                        className={cn(
                            "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-1.5 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                            invalid && "border-destructive ring-3 ring-destructive/20",
                        )}
                    >
                        {value.map((author, index) => (
                            <span
                                key={author.id}
                                className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-secondary py-0.5 pr-1 pl-1 text-sm font-medium"
                            >
                                {index > 0 ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            moveEarlier(index);
                                        }}
                                        aria-label={`Move ${author.name} earlier`}
                                        title="Move earlier"
                                        className="rounded p-0.5 text-foreground/45 hover:bg-foreground/10 hover:text-foreground"
                                    >
                                        <ChevronLeft className="size-3.5" />
                                    </button>
                                ) : (
                                    <span className="w-1" aria-hidden />
                                )}
                                <span className="truncate">{author.name}</span>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        remove(author.id);
                                    }}
                                    aria-label={`Remove ${author.name}`}
                                    className="rounded p-0.5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </span>
                        ))}
                        <input
                            ref={inputRef}
                            id={id}
                            role="combobox"
                            aria-expanded={open}
                            aria-controls={listId}
                            aria-autocomplete="list"
                            aria-describedby={describedBy}
                            aria-activedescendant={activeOption ? optionId(activeOption) : undefined}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setActive(0);
                                setOpen(true);
                            }}
                            // Results need typing, so focus alone (e.g. returning from the dialog) doesn't pop an empty list.
                            onFocus={() => search.trim() && openList()}
                            onKeyDown={handleKeyDown}
                            disabled={full}
                            placeholder={full ? "" : value.length ? "Add another author…" : "Search authors, e.g. Chimamanda Ngozi Adichie"}
                            autoComplete="off"
                            className="h-7 min-w-32 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground disabled:cursor-default md:text-sm"
                        />
                    </div>
                </PopoverPrimitive.Anchor>

                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        align="start"
                        sideOffset={6}
                        // Keep typing in the search box; clicks on the field itself shouldn't close the list.
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onInteractOutside={(event) => {
                            if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
                        }}
                        className="z-50 w-(--radix-popover-trigger-width) min-w-(--radix-popper-anchor-width) overflow-hidden rounded-lg border border-border bg-card p-1 text-foreground shadow-[0_14px_34px_rgba(74,45,24,0.14)]"
                    >
                        <ul id={listId} role="listbox" aria-multiselectable aria-label="Authors" className="max-h-72 overflow-y-auto">
                            {options.map((option, index) => {
                                const highlighted = activeOption === option;
                                if (option.kind === "propose") {
                                    return (
                                        <li
                                            key="propose"
                                            id={optionId(option)}
                                            role="option"
                                            aria-selected={false}
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => choose(option)}
                                            onMouseEnter={() => setActive(index)}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold text-primary",
                                                results.length > 0 && "mt-1 border-t border-foreground/10 pt-2.5",
                                                highlighted && "bg-secondary",
                                            )}
                                        >
                                            <Plus className="size-4 shrink-0" aria-hidden />
                                            <span className="min-w-0 truncate">Add “{typed}” as a new author</span>
                                        </li>
                                    );
                                }
                                const { author } = option;
                                const selected = isSelected(author.id);
                                const context = authorContext(author);
                                return (
                                    <li
                                        key={author.id}
                                        id={optionId(option)}
                                        role="option"
                                        aria-selected={selected}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => choose(option)}
                                        onMouseEnter={() => setActive(index)}
                                        className={cn(
                                            "flex cursor-pointer items-start justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
                                            highlighted && "bg-secondary",
                                        )}
                                    >
                                        <span className="min-w-0">
                                            <span className={cn("flex flex-wrap items-center gap-x-2", selected && "font-semibold")}>
                                                {author.name}
                                                {!author.verified && (
                                                    <span className="rounded bg-foreground/8 px-1.5 py-px text-[11px] font-medium text-foreground/60">
                                                        Added by a seller
                                                    </span>
                                                )}
                                            </span>
                                            {author.matchedAlias && (
                                                <span className="block truncate text-xs text-foreground/55">Also known as {author.matchedAlias}</span>
                                            )}
                                            {context && <span className="block truncate text-xs text-foreground/55">{context}</span>}
                                        </span>
                                        {selected && <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
                                    </li>
                                );
                            })}
                            {status && (
                                <li role="presentation" className="px-2.5 py-2 text-sm text-foreground/55">
                                    {status}
                                </li>
                            )}
                        </ul>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            <ProposeAuthorDialog
                open={proposeOpen}
                onOpenChange={(next) => {
                    setProposeOpen(next);
                    if (!next) inputRef.current?.focus();
                }}
                initialName={typed}
                selectedIds={value.map((author) => author.id)}
                onPick={add}
            />
        </>
    );
};

export default AuthorMultiSelect;
