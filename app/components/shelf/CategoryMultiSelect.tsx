import { Check, ChevronDown, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "~/lib/utils";
import type { ICategory } from "~/types/book";

interface CategoryMultiSelectProps {
    id?: string;
    categories: ICategory[];
    value: string[];
    onChange: (ids: string[]) => void;
    loading?: boolean;
    invalid?: boolean;
    placeholder?: string;
}

/**
 * Searchable multi-select combobox: type to filter, Enter/click to toggle, Backspace on an
 * empty search removes the last pick. Selected categories show as removable chips. No limit.
 */
const CategoryMultiSelect = ({
    id,
    categories,
    value,
    onChange,
    loading = false,
    invalid = false,
    placeholder = "Search categories…",
}: CategoryMultiSelectProps) => {
    const listId = useId();
    const anchorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [active, setActive] = useState(0);

    const byId = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
    const selected = value.map((categoryId) => byId.get(categoryId)).filter((category): category is ICategory => !!category);

    const options = useMemo(() => {
        const term = search.trim().toLowerCase();
        const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
        return term ? sorted.filter((category) => category.name.toLowerCase().includes(term)) : sorted;
    }, [categories, search]);

    const toggle = (categoryId: string) => {
        onChange(value.includes(categoryId) ? value.filter((item) => item !== categoryId) : [...value, categoryId]);
        setSearch("");
        inputRef.current?.focus();
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
            if (open && options[active]) toggle(options[active].id);
            else openList();
        } else if (event.key === "Escape") {
            setOpen(false);
        } else if (event.key === "Backspace" && !search && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const activeOption = open ? options[active] : undefined;

    return (
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
                    {selected.map((category) => (
                        <span
                            key={category.id}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary py-0.5 pr-1 pl-2 text-sm font-medium"
                        >
                            {category.name}
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    toggle(category.id);
                                }}
                                aria-label={`Remove ${category.name}`}
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
                        aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setActive(0);
                            setOpen(true);
                        }}
                        onFocus={openList}
                        onKeyDown={handleKeyDown}
                        placeholder={selected.length ? "Add another…" : placeholder}
                        autoComplete="off"
                        className="h-7 min-w-32 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                    />
                    <ChevronDown className="mr-1 size-4 shrink-0 text-foreground/40" aria-hidden />
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
                    <ul id={listId} role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <li className="px-2.5 py-2 text-sm text-foreground/55">Loading categories…</li>
                        ) : options.length === 0 ? (
                            <li className="px-2.5 py-2 text-sm text-foreground/55">No categories match “{search}”.</li>
                        ) : (
                            options.map((category, index) => {
                                const isSelected = value.includes(category.id);
                                return (
                                    <li
                                        key={category.id}
                                        id={`${listId}-${category.id}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => toggle(category.id)}
                                        onMouseEnter={() => setActive(index)}
                                        className={cn(
                                            "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
                                            index === active && "bg-secondary",
                                            isSelected && "font-semibold",
                                        )}
                                    >
                                        {category.name}
                                        {isSelected && <Check className="size-4 text-primary" aria-hidden />}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
};

export default CategoryMultiSelect;
