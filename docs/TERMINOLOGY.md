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
| Saving an unfinished book | **Save as draft** ("Drafts" tab, "Continue") | unpublished listing |
| A free book | **Give it away free**, shown as "Free" | ₦0, donate |
| Book condition | **New / Like new / Good / Fair** | Mint, Used, Poor |

## Shelf statuses

| API `status` | Say (tab and pill) | Shown in the shop? |
| --- | --- | --- |
| `ACTIVE` | **Available** | Yes |
| `DRAFT` | **Draft** | No (owner only) |
| `SOLD` | **Sold** | No, but it stays on the seller's profile |
| `INACTIVE` | **Archived** | No |

Light verbs that fit the theme are welcome where they read naturally: "shelve the books you've finished", "the first books hit the shelves", "most-shelved authors". Don't force them where plain words are clearer.

## In code

- Routes: `/dashboard/shelf` (tabs via `?status=`), `/dashboard/shelf/new`, `/shop`. `/dashboard/listings` only redirects to `/dashboard/shelf` for old links.
- Names: `ShelfPage`, `AddToShelfPage`, `bookService.getMyShelf`. Data types follow the API (`IBook`, `BookStatus`); user-facing names say shelf.
- Icons: lucide `Library` for the shelf and `Store` for the shop.

## Backend

The API keeps its own name, `book` (`POST /book`, `GET /book/me`). In the UI a book is always "on your shelf". See `rebooked-backend/API_CHANGES.md` #15 for the contract.
