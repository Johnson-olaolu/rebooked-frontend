import { Link, useParams } from "react-router";
import type { Route } from "./+types/index";
import Breadcrumb from "~/components/shop/Breadcrumb";
import NotFoundMessage from "~/components/shop/NotFoundMessage";
import ShopBrowser from "~/components/shop/ShopBrowser";
import { formatNgState } from "~/utils/nigeria";
import { stateFromSlug } from "~/utils/slug";
import { canonicalUrl, pageMeta, SITE_NAME } from "~/utils/seo";

export function loader({ request }: Route.LoaderArgs) {
    return { url: canonicalUrl(request) };
}

export function meta({ params, data: loaded }: Route.MetaArgs) {
    const state = stateFromSlug(params.state);
    const label = state ? formatNgState(state) : "";
    if (!label) return pageMeta({ title: `Shop · ${SITE_NAME}`, url: loaded?.url, noIndex: true });
    return pageMeta({
        title: `Second-hand books in ${label} · ${SITE_NAME}`,
        description: `Buy and sell used books in ${label}. Message the seller on Rebooked and meet up locally — no shipping, no fees, no middleman.`,
        url: loaded?.url,
    });
}

/** /shop/in/:state — "Books in Lagos State". Other filters still apply. */
const StatePage = () => {
    const { state: slug } = useParams();
    const state = stateFromSlug(slug);
    const label = state ? formatNgState(state) : "";

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
