import { useId, useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuthorSearch } from "~/hooks/useAuthorSearch";
import type { IAuthorSummary } from "~/types/author";
import { AUTHOR_SEARCH_MIN, authorContext } from "~/utils/author";

interface AuthorSearchSelectProps {
    label: string;
    /** Authors that can't be picked (e.g. the one being merged). */
    excludeIds?: string[];
    onSelect: (author: IAuthorSummary) => void;
}

/** Pick one author from the catalogue (merged authors never appear). Used to choose a merge target. */
const AuthorSearchSelect = ({ label, excludeIds = [], onSelect }: AuthorSearchSelectProps) => {
    const inputId = useId();
    const [search, setSearch] = useState("");
    const { term, ready, results, searching, isError } = useAuthorSearch(search);
    const options = results.filter((author) => !excludeIds.includes(author.id));

    let status: string | null = null;
    if (search.trim().length < AUTHOR_SEARCH_MIN) status = "Type at least 2 letters.";
    else if (isError) status = "Search isn't working right now.";
    else if (options.length === 0 && searching) status = "Searching…";
    else if (options.length === 0 && ready) status = `No other authors match “${term}”.`;

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>{label}</Label>
            <Input
                id={inputId}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or other name"
                autoComplete="off"
                autoFocus
            />
            <ul aria-label="Matching authors" className="max-h-72 space-y-1.5 overflow-y-auto">
                {options.map((author) => {
                    const context = authorContext(author);
                    return (
                        <li key={author.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(author)}
                                className="flex w-full flex-col items-start rounded-lg border border-foreground/12 bg-card px-3 py-2 text-left hover:border-foreground/30"
                            >
                                <span className="font-semibold">
                                    {author.name}
                                    {!author.verified && <span className="ml-2 text-xs font-normal text-foreground/55">Unverified</span>}
                                </span>
                                {author.matchedAlias && <span className="text-xs text-foreground/55">Also known as {author.matchedAlias}</span>}
                                {context && <span className="text-xs text-foreground/55">{context}</span>}
                            </button>
                        </li>
                    );
                })}
                {status && <li className="px-1 py-1 text-sm text-foreground/55">{status}</li>}
            </ul>
        </div>
    );
};

export default AuthorSearchSelect;
