import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router";

/** "Shop › Categories › Poetry". The last crumb is the current page. */
const Breadcrumb = ({ items }: { items: { label: string; to?: string }[] }) => (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-foreground/55">
        <ol className="flex flex-wrap items-center gap-1.5">
            {items.map((item, index) => (
                <Fragment key={item.label}>
                    {index > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                    <li aria-current={item.to ? undefined : "page"} className={item.to ? undefined : "font-medium text-foreground"}>
                        {item.to ? (
                            <Link to={item.to} className="hover:text-foreground">
                                {item.label}
                            </Link>
                        ) : (
                            item.label
                        )}
                    </li>
                </Fragment>
            ))}
        </ol>
    </nav>
);

export default Breadcrumb;
