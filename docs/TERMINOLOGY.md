# Rebooked terminology

Rebooked's vocabulary is built around a **shelf**: the books a user is offering (for sale or to give away).
Use these words in UI copy, legal pages, toasts, route paths and code names, so the product reads the same everywhere.

| Concept | Say | Avoid |
| --- | --- | --- |
| A user's books on offer | **shelf** ("My shelf", "your shelf") | listings |
| Putting a book up | **Add to shelf**, "+ Add your first book" | list a book, create listing |
| A single item | **a book** ("a book on your shelf") | a listing |
| Taking one down | **Remove from shelf** | delete listing, unlist |
| Sold or given away | **Mark as sold** (the book leaves the shelf) | close listing |
| Count of books on offer | **Books on shelf** | active listings |
| Everyone's books | **the shop** ("Browse the shop") | store, marketplace |
| The people involved | buyer / seller | lister |

Light verbs that fit the theme are welcome where they read naturally: "shelve the books you've finished", "the first books hit the shelves", "most-shelved authors". Don't force them where plain words are clearer.

## In code

- Routes: `/dashboard/shelf`, `/shop`. `/dashboard/listings` only redirects to `/dashboard/shelf` for old links.
- Names: `ShelfPage`, `addToShelfSoon`, and `shelf` / `shelfItem` for future types and services.
- Icons: lucide `Library` for the shelf and `Store` for the shop.

## Backend

The backend has no shelf model yet. When it adds one, naming it `shelf` / `shelfItem` (e.g. `GET /user/me/shelf`, `POST /shelf`) keeps the API and UI in step.
