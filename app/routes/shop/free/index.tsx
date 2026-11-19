import type { Route } from "./+types/index";
import Breadcrumb from "~/components/shop/Breadcrumb";
import ShopBrowser from "~/components/shop/ShopBrowser";
import { canonicalUrl, pageMeta, SITE_NAME } from "~/utils/seo";

export function loader({ request }: Route.LoaderArgs) {
    return { url: canonicalUrl(request) };
}

export function meta({ data: loaded }: Route.MetaArgs) {
    return pageMeta({
        title: `Free books · ${SITE_NAME}`,
        description:
            "Second-hand books people are giving away free on Rebooked. Message the owner and arrange the handover — it costs nothing but a thank-you.",
        url: loaded?.url,
    });
}

/** /shop/free — books given away free. */
const FreeBooksPage = () => {
    return (
        <ShopBrowser
            eyebrow={<Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: "Free books" }]} />}
            title="Free to a good home"
            subtitle="Books people are giving away. Message the seller and arrange the handover. It costs nothing but a thank-you."
            fixed={{ free: true }}
        />
    );
};

export default FreeBooksPage;
