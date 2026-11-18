"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useHomepage } from "~/hooks/useHomepage";
import type { IHomepageStats } from "~/types/homepage";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const formatCount = (value: number) => (value >= 10_000 ? compact.format(value) : Math.round(value).toLocaleString());

const DURATION_MS = 1200;

/** Counts from 0 to `target` once the element scrolls into view. Jumps straight there with reduced motion. */
const CountUp = ({ target, format }: { target: number; format: (value: number) => string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [value, setValue] = useState(target);

    // Layout effect so the reset to 0 happens before the first paint, with no flash of the final number.
    useLayoutEffect(() => {
        const node = ref.current;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!node || reduced || !("IntersectionObserver" in window) || target === 0) {
            setValue(target);
            return;
        }
        setValue(0);
        let frame = 0;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                observer.disconnect();
                const start = performance.now();
                const tick = (now: number) => {
                    const progress = Math.min(1, (now - start) / DURATION_MS);
                    setValue(target * (1 - Math.pow(1 - progress, 3))); // ease-out cubic
                    if (progress < 1) frame = requestAnimationFrame(tick);
                };
                frame = requestAnimationFrame(tick);
            },
            { threshold: 0.4 },
        );
        observer.observe(node);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [target]);

    return (
        <span ref={ref} className="tabular-nums">
            {format(value)}
        </span>
    );
};

const tiles = (stats: IHomepageStats) =>
    [
        { label: "Books on the shelf", value: stats.activeBooks, format: formatCount },
        { label: "Found a second reader", value: stats.booksSold, format: formatCount },
        { label: "Readers", value: stats.readers, format: formatCount },
        { label: "Authors on Rebooked", value: stats.authors, format: formatCount },
        stats.avgSellerRating != null && {
            label: "Average seller rating",
            value: stats.avgSellerRating,
            format: (value: number) => `${value.toFixed(1)}★`,
        },
    ].filter((tile) => !!tile);

/** Home stats counter (API_CHANGES #24c). Hidden until the bundle arrives, or when the store is empty. */
const StatsStrip = () => {
    const { data: stats } = useHomepage((homepage) => homepage.stats);
    if (!stats || stats.activeBooks === 0) return null;
    const shown = tiles(stats);

    return (
        <div className="border-t border-border bg-secondary/60 px-6 py-8 md:px-12">
            <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
                {shown.map((tile) => (
                    <div key={tile.label} className="flex flex-col-reverse gap-1">
                        <dt className="text-sm text-foreground/60">{tile.label}</dt>
                        <dd className="font-serif text-3xl text-primary md:text-4xl">
                            <CountUp target={tile.value} format={tile.format} />
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

export default StatsStrip;
