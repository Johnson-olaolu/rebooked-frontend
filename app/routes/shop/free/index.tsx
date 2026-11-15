import { useEffect } from "react";
import Breadcrumb from "~/components/shop/Breadcrumb";
import ShopBrowser from "~/components/shop/ShopBrowser";

/** /shop/free — books given away free. */
const FreeBooksPage = () => {
    useEffect(() => {
        document.title = "Free books · Rebooked";
    }, []);

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
