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
| Books a seller has sold | **sold** ("12 books sold", "Sold" tab) | rehomed, sold listings, completed orders |
| Books a buyer hearted to come back to | **saved** ("Save", "Saved books", heart icon) | favourites, favorites, wishlist, liked |
| Books a user opened lately | **recently viewed** | history, recents |
| A buyer's 1–5 stars for a seller | **rating** ("Rate Tola", "4.8 ★ · 12 ratings") | score, feedback |
| The optional words with a rating | **review** ("Show more reviews") | testimonial, comment (in UI) |
| Marking a book as sold | always **to someone you chatted with** ("Who bought it?") | sold outside Rebooked |
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
| Things to look at | **Notifications** (bell on the site, count on the dashboard menu item, "Mark all as read") | alerts, activity feed, inbox |
| Selling from a chat | **Mark as sold to Tunde**; the buyer sees **Sold to you**, anyone else **Sold to someone else** | complete order, accept |
| Who wrote a book | **author** / **authors**, picked from the catalogue, shown "Terry Pratchett & Neil Gaiman" or "A, B + 2 more" | writer, by (as a label) |
| An author's public page | **author page** ("Chinua Achebe: books on Rebooked") | author profile, bio page |
| An author missing from the catalogue | **Add a new author** ("Add “Tola Okogwu” as a new author", "Is it one of these?") | create author, suggest an author |
| An author a seller added that nobody has checked yet | **Added by a seller** (sellers' UI); **Unverified** (admin only) | pending, unconfirmed |
| Searching the shop | sort **Best match** (only while searching, and the default then) | relevance, top results |

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

- Routes: `/dashboard/shelf` (tabs via `?status=`), `/dashboard/shelf/new`, `/dashboard/shelf/:id/edit`, `/book/:id` (public), `/seller/:id` (public), `/shop`, `/shop/categories`, `/shop/category/:slug`, `/shop/in/:state` (e.g. `lagos`, `fct`), `/shop/free`, `/dashboard/messages`, `/dashboard/messages/:id` (`?book=` picks the book you're writing about), `/dashboard/notifications`, `/dashboard/saved`, `/dashboard/bought/:bookId` (rate the seller), `/dashboard/settings` (Profile tab), `/dashboard/settings/notifications` (Notifications tab; emails link here), `/dashboard/settings/security` (Security tab), `/auth/forgot-password`, `/auth/change-password?email=&token=` (reset link), `/unsubscribe?token=` (public), `/author/:slug` (public; a merged author's old slug swaps to the new one). Super admin only: `/admin/authors`, `/admin/authors/review`, `/admin/authors/:id`, `/admin/imports`.
- Shop filters live in the URL: `?q=&cat=<slugs>&state=<names>|any&cond=&min=&max=&free=1&sort=newest|price_asc|price_desc|relevance&page=`. `sort` is left out when it's the default: `relevance` while there's a `q`, `newest` otherwise. With no `state`, a logged-in user's own state applies. `/dashboard/listings` only redirects to `/dashboard/shelf` for old links.
- Names: `ShelfPage`, `AddToShelfPage`, `EditBookPage`, `BookPage`, `BookForm`, `useBookActions`, `bookService.getMyShelf`. Data types follow the API (`IBook`, `BookStatus`); user-facing names say shelf.
- Chat: `ChatConnection` (provider) keeps the STOMP socket (`app/lib/chatSocket.ts`) live and writes events into the query cache; screens use `useChat` hooks. One conversation per pair of users, with books attached (API_CHANGES #18).
- Authors: books carry `authors: [{ id, name, slug }]` in display order and the form sends `authorIds` (API_CHANGES #23). Display through `authorLine` / `authorYears` (`app/utils/author.ts`); pick with `AuthorMultiSelect` (`ProposeAuthorDialog` for missing authors).
- Notifications: copy and links per type live in `app/utils/notification.ts` (e.g. "Tunde asked about *Purple Hibiscus*", "Finish adding *X* to your shelf"); they arrive on the same socket as chat (API_CHANGES #19).
- Icons: lucide `Library` for the shelf, `Store` for the shop, `MessageSquare` for conversations, `Bell` for notifications.

## Backend

The API keeps its own name, `book` (`POST /book`, `GET /book/me`). In the UI a book is always "on your shelf". See `rebooked-backend/API_CHANGES.md` #15 for the contract.
