import { useEffect } from "react";
import { Link, useParams } from "react-router";
import Breadcrumb from "~/components/shop/Breadcrumb";
import NotFoundMessage from "~/components/shop/NotFoundMessage";
import ShopBrowser from "~/components/shop/ShopBrowser";
import { formatNgState } from "~/utils/nigeria";
import { stateFromSlug } from "~/utils/slug";

/** /shop/in/:state — "Books in Lagos State". Other filters still apply. */
const StatePage = () => {
    const { state: slug } = useParams();
    const state = stateFromSlug(slug);
    const label = state ? formatNgState(state) : "";

    useEffect(() => {
        if (label) document.title = `Books in ${label} · Rebooked`;
    }, [label]);

    if (!state) {
        return (
            <NotFoundMessage
                title="We don't know that place"
                description="State pages cover Nigeria's 36 states and the FCT. Browse the whole shop instead."
            />
        );
    }

    return (
        <ShopBrowser
            key={state}
            eyebrow={<Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: label }]} />}
            title={`Books in ${label}`}
            subtitle={
                <>
                    Second-hand books from sellers in {label}: meet up locally, no shipping.{" "}
                    <Link to="/shop?state=any" className="font-semibold text-primary hover:underline">
                        Search all of Nigeria
                    </Link>
                </>
            }
            fixed={{ state }}
        />
    );
};

export default StatePage;
