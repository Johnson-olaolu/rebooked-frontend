# Hero imagery

Curated stock photography for the homepage hero stack (`app/routes/home/components/HeroBooks.tsx`).

These are **deliberately not store listings.** Seller-uploaded covers vary in quality and we
can't vouch for them, so the most prominent image on the site uses photography we've vetted.

Each file is cropped to 600×800 (3:4) and encoded as WebP at q82.

## Selection rule

No photo may contain a legible book title, because the hero card captions it with a
public-domain classic. Every image below is a stack, a page texture or an angled shot where
no competing title can be read.

## Sources

All images are from Pexels and Unsplash. Both licenses permit commercial use without
attribution; credit is recorded here anyway.

| File | Source |
|---|---|
| `cover-01.webp` | Pexels photo 1148399 — https://www.pexels.com/photo/1148399/ |
| `cover-02.webp` | Unsplash `photo-1495446815901-a7297e633e8d` — https://unsplash.com/photos/a7297e633e8d |
| `cover-03.webp` | Unsplash `photo-1544716278-ca5e3f4abd8c` — https://unsplash.com/photos/ca5e3f4abd8c |
| `cover-04.webp` | Unsplash `photo-1457369804613-52c61a468e7d` — https://unsplash.com/photos/52c61a468e7d |
| `cover-05.webp` | Unsplash `photo-1495640388908-05fa85288e61` — https://unsplash.com/photos/05fa85288e61 |

## Replacing an image

Keep the 3:4 crop and the `cover-0N.webp` name, re-check the "no legible title" rule, and
update the row above. The manifest lives in `HeroBooks.tsx`.
