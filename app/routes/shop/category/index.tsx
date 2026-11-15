import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "react-router";
import Breadcrumb from "~/components/shop/Breadcrumb";
import NotFoundMessage from "~/components/shop/NotFoundMessage";
import ShopBrowser from "~/components/shop/ShopBrowser";
import categoryService from "~/services/category.service";
import { categoryBySlug } from "~/utils/slug";

/** /shop/category/:slug — the shop, fixed to one category. */
const CategoryPage = () => {
    const { slug } = useParams();
    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
    });
    const category = categoryBySlug(categoriesQuery.data ?? [], slug);

    useEffect(() => {
        if (category) document.title = `${category.name} · Rebooked`;
    }, [category]);

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
