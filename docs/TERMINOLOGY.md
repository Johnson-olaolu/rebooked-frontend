# Rebooked terminology

Rebooked's vocabulary is built around a **shelf**: the books a user is offering (for sale or to give away).
Use these words in UI copy, legal pages, toasts, route paths and code names, so the product reads the same everywhere.

| Concept | Say | Avoid |
| --- | --- | --- |
| A user's books on offer | **shelf** ("My shelf", "your shelf") | listings |
| Putting a book up | **Add to shelf**, "+ Add your first book" | list a book, create listing |
| A single item | **a book** ("a book on your shelf") | a listing |
| Deleting one for good | **Remove from shelf** (always confirmed; can't be undone) | delete listing, unlist |
| Hiding one for now | **Archive** / **Put back on shelf** | deactivate, unpublish, relist |
| Changing one | **Edit** (drafts: **Continue**), saved with **Save changes** | update listing |
| A book's public page | **book page** ("View book page") | listing page, product page |
| A book in a grid | **book card** | product tile, listing card |
| A seller's public page | **their shelf** ("On Ola's shelf", "View shelf →") | store, storefront, seller shop |
| Books a seller has sold | **rehomed** ("12 books rehomed") | sold listings, completed orders |
| Where a book is | the seller's **state** ("Books in Lagos State", "Anywhere in Nigeria") | region, area, near me (until distance exists) |
| Sold or given away | **Mark as sold** (the book leaves the shelf) | close listing |
| Count of books on offer | **Books on shelf** | active listings |
| Everyone's books | **the shop** ("Browse the shop") | store, marketplace |
| The people involved | buyer / seller | lister |
| Saving an unfinished book | **Save as draft** ("Drafts" tab, "Continue") | unpublished listing |
| A free book | **Give it away free**, shown as "Free" | ₦0, donate |
| Book condition | **New / Like new / Good / Fair** | Mint, Used, Poor |
| Talking to someone | a **conversation** (one per person; "Conversations", "Message Tunde", "Continue chat") | thread, ticket, enquiry |
| What a conversation is about | **Books in this chat** ("About: *title*" when writing, "Re: *title*" on a message) | items, listings in this deal |
| Selling from a chat | **Mark as sold to Tunde**; the buyer sees **Sold to you**, anyone else **Sold to someone else** | complete order, accept |

## Shelf statuses

| API `status` | Say (tab and pill) | Shown in the shop? |
| --- | --- | --- |
| `ACTIVE` | **Available** | Yes |
| `DRAFT` | **Draft** | No (owner only) |
| `SOLD` | **Sold** | No, but it stays on the seller's profile |
| `INACTIVE` | **Archived** | No |

Light verbs that fit the theme are welcome where they read naturally: "shelve the books you've finished", "the first books hit the shelves", "most-shelved authors". Don't force them where plain words are clearer.

## Casing

- **Sentence case** for all UI copy: headings, buttons, labels, hints and empty states. In a · separated meta line, every segment starts with a capital: "₦50,000 · Good · You're the seller", "Buying from you · Warri, Delta State".
- **People's names and hand-typed places** are shown through `displayName` / `displayPlace` (`app/utils/text.ts`). A word typed entirely in lowercase gets a capital ("kastroud" → "Kastroud"). Names with their own casing ("McKenzie", "DJ Tobi") are left alone. This is for display only: what the user typed is stored, and shown in their settings, unchanged.
- **User content is never re-cased:** messages, book titles, descriptions and emails.

## In code

- Routes: `/dashboard/shelf` (tabs via `?status=`), `/dashboard/shelf/new`, `/dashboard/shelf/:id/edit`, `/book/:id` (public), `/seller/:id` (public), `/shop`, `/shop/categories`, `/shop/category/:slug`, `/shop/in/:state` (e.g. `lagos`, `fct`), `/shop/free`, `/dashboard/messages`, `/dashboard/messages/:id` (`?book=` picks the book you're writing about).
- Shop filters live in the URL: `?q=&cat=<slugs>&state=<names>|any&cond=&min=&max=&free=1&sort=price_asc|price_desc&page=`. With no `state`, a logged-in user's own state applies. `/dashboard/listings` only redirects to `/dashboard/shelf` for old links.
- Names: `ShelfPage`, `AddToShelfPage`, `EditBookPage`, `BookPage`, `BookForm`, `useBookActions`, `bookService.getMyShelf`. Data types follow the API (`IBook`, `BookStatus`); user-facing names say shelf.
- Chat: `ChatConnection` (provider) keeps the STOMP socket (`app/lib/chatSocket.ts`) live and writes events into the query cache; screens use `useChat` hooks. One conversation per pair of users, with books attached (API_CHANGES #18).
- Icons: lucide `Library` for the shelf, `Store` for the shop, `MessageSquare` for conversations.

## Backend

The API keeps its own name, `book` (`POST /book`, `GET /book/me`). In the UI a book is always "on your shelf". See `rebooked-backend/API_CHANGES.md` #15 for the contract.
