import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import type { Route } from "./+types/index";
import Breadcrumb from "~/components/shop/Breadcrumb";
import NotFoundMessage from "~/components/shop/NotFoundMessage";
import ShopBrowser from "~/components/shop/ShopBrowser";
import categoryService from "~/services/category.service";
import { categoryBySlug } from "~/utils/slug";
import { canonicalUrl, pageMeta, SITE_NAME } from "~/utils/seo";

/** The category list is small and rarely changes, so fetching it per request is cheap. */
export async function loader({ request }: Route.LoaderArgs) {
    const url = canonicalUrl(request);
    try {
        return { categories: await categoryService.getAll(), url };
    } catch {
        return { categories: null, url };
    }
}

export function meta({ params, data: loaded }: Route.MetaArgs) {
    const category = categoryBySlug(loaded?.categories?.data ?? [], params.slug);
    if (!category) return pageMeta({ title: `Shop · ${SITE_NAME}`, url: loaded?.url, noIndex: true });
    return pageMeta({
        title: `Second-hand ${category.name} books · ${SITE_NAME}`,
        description: `Used ${category.name.toLowerCase()} books from readers across Nigeria. Message the seller directly on Rebooked — no fees, no middleman.`,
        url: loaded?.url,
    });
}

/** /shop/category/:slug — the shop, fixed to one category. */
const CategoryPage = ({ loaderData }: Route.ComponentProps) => {
    const { slug } = useParams();
    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
        initialData: loaderData?.categories ?? undefined,
    });
    const category = categoryBySlug(categoriesQuery.data ?? [], slug);

    if (categoriesQuery.isLoading) {
        return <div aria-busy className="mx-auto h-40 max-w-7xl animate-pulse px-6 py-12" />;
    }
    if (!category) {
        return (
            <NotFoundMessage
                title="Category not found"
                description="That category doesn't exist (any more). Have a look through the full list instead."
                to="/shop/categories"
                cta="All categories"
            />
        );
    }

    return (
        <ShopBrowser
            key={category.id}
            eyebrow={<Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: "Categories", to: "/shop/categories" }, { label: category.name }]} />}
            title={category.name}
            subtitle={category.description || `Second-hand ${category.name.toLowerCase()} from readers across Nigeria.`}
            fixed={{ categoryId: category.id }}
        />
    );
};

export default CategoryPage;
