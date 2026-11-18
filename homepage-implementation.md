# Rebooked Homepage Module Implementation

**Status:** Proposed implementation\
**Stack:** Java 21, Spring Boot 3.4, MongoDB, Redis, LangChain4j (Gemini)\
**Package:** `com.personal.rebooked.homepage` (replaces the TODO list in
`HomepageController.java`)\
**Consumers:** the frontend home page (`app/routes/home/index.tsx`)

------------------------------------------------------------------------

## 1. Goals

Replace the mostly static home page with live, cached sections:

-   A hero with this week's three highlighted books.
-   Site stats (books listed, books sold, readers, sellers, authors,
    average seller rating).
-   Categories with live counts.
-   A weekly **featured** set: one category, its top six books and a
    featured author.
-   **AI picks**: about eight books with a one-line reason each. Global
    daily, personalised for signed-in readers in a later phase.
-   **Trending this week** (the stub's "Week Highlights").
-   **New arrivals**.
-   **Top authors of the week**.
-   **Readers are saying**: recent seller reviews.
-   **Trusted sellers**: top-rated sellers.

The page must load fast for anonymous visitors. It must never fail as a
whole because one section failed. Nothing slow (AI calls, aggregations)
runs on the request path.

### Non-goals for the first release

-   News and events (no content source yet).
-   Real-time stats. A 15-minute delay is fine.
-   Per-user personalisation of anything other than AI picks. "Near you"
    and "Continue browsing" use existing endpoints from the frontend.

------------------------------------------------------------------------

## 2. Core design decisions

1.  **One public bundle endpoint, `GET /homepage`.** One round trip,
    easy to cache, and the frontend shares it across every section.
2.  **Every section is a Redis snapshot built off the request path** by
    a scheduled job. The bundle only reads keys. If a key is missing,
    the section is computed inline once and cached.
3.  **Sections fail independently.** Each section is built in its own
    try/catch. On failure the bundle carries `null` or `[]` for that
    section and logs the error. `GET /homepage` returns 200 whenever the
    application is healthy.
4.  **Book IDs are stored, not book documents.** Snapshots hold ordered
    IDs. At serve time they are re-read with `BookService.booksInOrder`
    and filtered to `ACTIVE`, so sold or unpublished books drop out.
    Lists that fall below their target size are backfilled (§5).
5.  **"Weekly" means the ISO week starting Monday 00:00 Africa/Lagos.**
    This matches the zone used by the existing `@Scheduled` jobs.
6.  **The featured set is persisted in Mongo**, not only in Redis. That
    gives history (so picks don't repeat), an audit trail for admin
    overrides, and survival across Redis flushes.
7.  **AI generation runs in a job, never in a request.** If the model
    fails, the previous set stays live.
8.  **Book payloads use the same DTO as `GET /book/query`**, so the
    frontend's `BookCard` renders them unchanged.

------------------------------------------------------------------------

## 3. API

All responses use the existing `ResponseHandler.generateResponse`
envelope `{ message, status, data }`.

### 3.1 Public

  ---------------------------------------------------------------------------
  Method   Endpoint                Auth       Purpose
  -------- ----------------------- ---------- -------------------------------
  `GET`    `/homepage`             public     Every non-personalised section

  `GET`    `/homepage/stats`       public     Stats only, for other pages
                                              (about, sell page)

  `GET`    `/homepage/for-you`     user       Personalised AI picks (phase 3)
  ---------------------------------------------------------------------------

`GET /homepage` example (`data`):

``` json
{
  "generatedAt": "2026-11-18T09:15:00Z",
  "weekOf": "2026-11-16",
  "hero": [ /* 3 × Book */ ],
  "stats": {
    "activeBooks": 2847,
    "booksSold": 1312,
    "readers": 5120,
    "sellers": 940,
    "authors": 1785,
    "avgSellerRating": 4.7
  },
  "categories": [ /* ≤ 8 × Category, with booksCount */ ],
  "featured": {
    "category": { /* Category */ },
    "books": [ /* 6 × Book */ ],
    "author": {
      /* AuthorDetail: id, name, slug, verified, photoUrl, biography, ... */
      "books": [ /* ≤ 4 × Book */ ]
    },
    "source": "AUTO"
  },
  "aiPicks": [
    { "book": { /* Book */ }, "reason": "A tight Lagos thriller for fans of Oyinkan Braithwaite." }
  ],
  "trending": [ /* ≤ 12 × Book */ ],
  "newArrivals": [ /* ≤ 12 × Book */ ],
  "topAuthors": [
    { /* AuthorSummary */ "photoUrl": null, "weekScore": 214 }
  ],
  "reviews": [
    {
      "rating": 5,
      "comment": "Exactly as described, met at the gate on time.",
      "createdAt": "2026-11-15T14:02:00Z",
      "reviewer": { "userName": "adaeze", "profilePictureUrl": null },
      "book": { "id": "…", "title": "…", "coverImage": { /* File */ } }
    }
  ],
  "sellers": [ /* ≤ 4 × SellerSummary (with rating) + "soldCount" */ ]
}
```

Rules:

-   `featured.category` and `featured.author` may be `null`. List
    sections may be empty. The frontend hides empty sections.
-   `reviews[].reviewer` exposes only the public username and avatar. It
    never includes email, full name or the buyer's ID.
-   `sellers[]` and `reviews[]` never include private profile fields.
-   Set `Cache-Control: public, max-age=60` on `GET /homepage` and
    `GET /homepage/stats`.

`GET /homepage/for-you` (`data`):

``` json
{
  "aiPicks": [ { "book": { }, "reason": "…" } ],
  "basedOn": ["Mystery & Thriller", "Chimamanda Ngozi Adichie"],
  "personalised": true
}
```

When personalisation isn't possible (no saved or viewed history) or
fails, return the global picks with `personalised: false`.

### 3.2 Admin

  -------------------------------------------------------------------------------------
  Method   Endpoint                                 Purpose
  -------- ---------------------------------------- -----------------------------------
  `GET`    `/admin/homepage/featured?week=`         The featured set for a week
                                                    (default: current), with history

  `PUT`    `/admin/homepage/featured`               Override this week's set

  `DELETE` `/admin/homepage/featured?week=`         Drop the override; regenerate AUTO

  `POST`   `/admin/homepage/refresh/{section}`      Rebuild one snapshot now (`stats`,
                                                    `trending`, `featured`,
                                                    `ai-picks`, `top-authors`,
                                                    `reviews`, `sellers`, `new`,
                                                    `categories`, `all`)
  -------------------------------------------------------------------------------------

`PUT /admin/homepage/featured` request (every field optional; omitted
fields keep the AUTO choice):

``` json
{
  "categoryId": "…",
  "bookIds": ["…", "…", "…", "…", "…", "…"],
  "authorId": "…",
  "heroBookIds": ["…", "…", "…"],
  "note": "Back-to-school week"
}
```

Validate that every ID exists and that books are `ACTIVE`. Reject more
than 6 `bookIds` or 3 `heroBookIds`. Writing sets `source = ADMIN`,
records `createdBy`, and evicts `homepage:featured:{week}`.

------------------------------------------------------------------------

## 4. Data model

### 4.1 Weekly featured set (Mongo)

``` java
@Document(collection = "homepage_features")
public class HomepageFeature {
    @Id
    private String id;

    @Indexed(unique = true)
    private LocalDate weekStart;        // Monday, Africa/Lagos

    private String categoryId;
    private List<String> bookIds = new ArrayList<>();      // ≤ 6, ordered
    private String authorId;
    private List<String> heroBookIds = new ArrayList<>();  // ≤ 3, ordered

    private FeatureSource source;       // AUTO, ADMIN
    private String createdBy;           // admin user id when ADMIN
    private String note;

    private Instant createdAt;
    private Instant updatedAt;
}
```

Index: unique `{ weekStart: 1 }`.

### 4.2 Daily view buckets (Redis)

Today views are counted in `BookViews.record` through the `RECORD` Lua
script. They are deduplicated per viewer per book per day and
accumulated in the `views:pending` hash, which `ViewFlushJob` flushes
into the all-time `viewCount`. All-time counts can't produce "this
week", so add a dated sorted set **inside the same script, on the
`counted == 1` branch**:

``` lua
if counted == 1 then
  ...
  redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
  redis.call('ZINCRBY', KEYS[5], 1, ARGV[1])           -- new
  if redis.call('TTL', KEYS[5]) < 0 then
    redis.call('EXPIRE', KEYS[5], 691200)               -- 8 days
  end
end
```

`KEYS[5]` is `views:day:{yyyyMMdd}`, using the same `DAY` formatter and
`ZONE` already in `BookViews`. The views are already deduplicated, so
the trend can't be inflated by refreshing.

### 4.3 Redis keys

  -------------------------------------------------------------------------------------
  Key                                  Value                            TTL
  ------------------------------------ -------------------------------- --------------
  `views:day:{yyyyMMdd}`               ZSET bookId → views              8 days

  `views:week`                         ZSET, union of last 7 days       2 h

  `homepage:stats`                     Stats JSON                       30 min

  `homepage:trending`                  `[bookId]`                       2 h

  `homepage:new`                       `[bookId]`                       5 min

  `homepage:categories`                `[Category]`                     1 h

  `homepage:featured:{weekStart}`      Resolved featured IDs            8 days

  `homepage:top-authors:{weekStart}`   `[{authorId, weekScore}]`        8 days

  `homepage:ai-picks`                  `[{id, reason}]`                 48 h

  `homepage:ai-picks:user:{userId}`    `[{id, reason}]` + `basedOn`     24 h

  `homepage:reviews`                   `[ratingId]`                     1 h

  `homepage:sellers`                   `[sellerId]`                     24 h
  -------------------------------------------------------------------------------------

Use the existing `RedisService` (manual save and get with TTL). This
matches how `AI_PICKS_KEY` is cached today, so no `@Cacheable` is
needed.

------------------------------------------------------------------------

## 5. Section rules

### 5.1 Stats (every 15 min)

  Field               Definition
  ------------------- ----------------------------------------------------
  `activeBooks`       Books with status `ACTIVE`
  `booksSold`         Books with status `SOLD`
  `readers`           Users with a confirmed email
  `sellers`           Distinct users with at least one ACTIVE or SOLD book
  `authors`           Authors linked to at least one ACTIVE or SOLD book
                      (reuse the `AuthorStats` counters)
  `avgSellerRating`   Mean `stars` across `seller_ratings`, 1 decimal;
                      `null` when there are fewer than 10 ratings

### 5.2 Trending this week (hourly)

1.  `ZUNIONSTORE views:week 7 views:day:{today} … views:day:{today-6}`.
2.  Walk `ZREVRANGE views:week` and keep `ACTIVE` books until 12 are
    found.
3.  If fewer than 6 are found, backfill from
    `BookService.getTopBooks()` (all-time views) without duplicates.

### 5.3 New arrivals (5 min)

The 12 newest `ACTIVE` books by `createdAt`, which is the same order as
`/book/query?sort=NEWEST`. Evict `homepage:new` on `BookChangedEvent`
when a book becomes `ACTIVE` or leaves `ACTIVE`.

### 5.4 Categories (hourly)

`CategoryService.fetchTopCategories(8)`, which already sets
`booksCount`.

### 5.5 Top authors of the week (Monday 06:00 + daily refresh)

Score over the last 7 days:

    weekScore = Σ views of the author's books (from views:week)
              + 5 × books by the author sold this week (soldDate)
              + 2 × books by the author newly listed this week (createdAt)

-   Only authors with at least one `ACTIVE` book qualify. Exclude
    `MERGED` authors.
-   The top 6 by `weekScore`, with ties broken by available count.
-   The Monday run writes `homepage:top-authors:{weekStart}`. A daily
    run may refresh it during the week, so early-week data isn't empty.
-   If fewer than 3 qualify, fall back to the current `GET /author/top`
    logic (most-shelved). Leave `GET /author/top` itself unchanged.

### 5.6 Featured this week (Monday 06:00)

If an ADMIN document exists for the week, use it. Fill any omitted
fields with the AUTO choices.

Otherwise choose automatically and save with `source = AUTO`:

-   **Category:** a seeded category with at least 6 `ACTIVE` books that
    wasn't featured in the last 8 weeks. Among candidates, prefer the
    highest share of 7-day views. Pick randomly from the top 3, so
    rotation isn't purely popularity-driven.
-   **Books (6):** that category's `ACTIVE` books ranked by 7-day views,
    then newest. Prefer books with a cover image.
-   **Author:** the highest `weekScore` author who has a `biography` or
    `photoUrl` and wasn't featured in the last 4 weeks. Return up to 4
    of their `ACTIVE` books with the author.
-   **Hero (3):** the top 3 trending books that have a cover image,
    excluding the featured books. Backfill from newest books with
    covers.

At serve time, re-read and filter to `ACTIVE`. If the featured books
drop below 4, backfill from the same category using the ranking rule
above. Don't rewrite the stored document.

### 5.7 AI picks: global (daily 03:00)

Move the generation in `BookService.getAIRecommendedBooks()` into a
`HomepageJobs` method. The request path then only reads the cache.

1.  Candidate pool of about 60 `ACTIVE` books: 20 from trending, 20
    newest, 20 random. Deduplicate. The current code samples uniformly
    at random only.
2.  Send `id`, `title`, `author`, a description truncated to 300
    characters, `categories` and `condition`.
3.  New prompt, a new `AiService` method:

    ```
    You recommend second-hand books to readers in Nigeria.
    From the list provided, choose the 8 most appealing books for a
    general audience. Favour variety across categories and authors.
    Respond ONLY with a JSON array of objects:
    [{"id": "<book id from the list>", "reason": "<one sentence, at most 90 characters>"}]
    ```

4.  Parse with a typed DTO. Drop IDs not in the candidate pool. Trim
    reasons to 90 characters. If fewer than 4 valid picks come back,
    treat the run as failed.
5.  On failure, keep the existing key (extend its TTL) and log. Never
    throw on the request path. Today's `500 Failed to fetch AI
    recommended books` goes away.
6.  `GET /book/ai-picks` keeps working by reading the same key and
    returning just the books.

Gemini is called once a day, so cost stays negligible.

### 5.8 AI picks: personalised (phase 3)

`GET /homepage/for-you`, for signed-in users:

1.  Read `homepage:ai-picks:user:{id}`. On a hit, re-read the books and
    return them.
2.  On a miss, build a profile from the user's saved books and recent
    views (the `recent:*` list): top 3 categories and top 3 authors.
3.  Candidate pool of about 40 `ACTIVE` books from those categories and
    authors plus 10 trending. Exclude the user's own books, books
    already saved, and books in their recent views.
4.  Same prompt, with an added line: "The reader likes: <categories>,
    <authors>."
5.  Cache for 24 h. Limit to one generation per user per 6 h, and put a
    hard timeout (8 s) on the model call. On timeout or failure, return
    the global picks with `personalised: false`.
6.  If the user has no history, skip the model and return the global
    picks.

### 5.9 Readers are saying (hourly)

-   `seller_ratings` from the last 7 days with `stars >= 4` and a
    non-blank `comment` of at least 20 characters. Widen to 30 days if
    there are fewer than 3.
-   Pick 5 at random. At most one per seller.
-   Join the book (title and cover; a `SOLD` book is fine here) and the
    reviewer's public username and avatar.

### 5.10 Trusted sellers (daily)

-   Sellers with at least 3 ratings and at least one `ACTIVE` book.
-   Order by average stars, then rating count, then `soldCount`. Take 4.
-   Return `SellerSummary` (including `rating`) plus `soldCount`.

------------------------------------------------------------------------

## 6. Jobs

Add one `HomepageJobs` component. Every schedule is a property with a
default, matching `ViewFlushJob`. Every cron uses
`zone = "Africa/Lagos"`.

  -----------------------------------------------------------------------------------
  Job                    Property                       Default
  ---------------------- ------------------------------ -----------------------------
  Stats                  `homepage.stats-interval`      `PT15M`

  Trending + week union  `homepage.trending-interval`   `PT1H`

  Reviews                `homepage.reviews-interval`    `PT1H`

  Sellers + top authors  `homepage.daily-cron`          `0 30 2 * * *`
  (daily refresh)

  AI picks               `homepage.ai-picks-cron`       `0 0 3 * * *`

  Weekly featured +      `homepage.weekly-cron`         `0 0 6 * * MON`
  top authors snapshot
  -----------------------------------------------------------------------------------

`SchedulingConfig` has a 2-thread pool shared with the notification,
view-flush and import jobs. Either raise it to 4 threads or keep the
homepage jobs short. The AI job is the slow one, so it should not block
`ViewFlushJob`.

Run a one-off warm-up of every section at startup when the keys are
missing (`ApplicationReadyEvent`), so a fresh deploy doesn't serve an
empty page.

------------------------------------------------------------------------

## 7. Package layout

    homepage/
      HomepageController.java        GET /homepage, /homepage/stats, /homepage/for-you
      HomepageAdminController.java   /admin/homepage/**
      HomepageService.java           assembles the bundle from snapshots
      HomepageJobs.java              @Scheduled builders
      sections/
        StatsSection.java
        TrendingSection.java
        FeaturedSection.java
        AiPicksSection.java
        TopAuthorsSection.java
        ReviewsSection.java
        SellersSection.java
      models/HomepageFeature.java
      models/FeatureSource.java
      repositories/HomepageFeatureRepository.java
      dto/HomepageDto.java, StatsDto.java, AiPickDto.java, ...

Each `*Section` has `build()` (job: compute and write the Redis key) and
`read()` (request: read the key, resolve IDs, backfill, or call
`build()` once on a miss). `HomepageService.bundle()` calls every
`read()` in its own try/catch.

Move the `HomepageController` TODO comment into this document's history
and keep the "OTHER PAGES" list in a separate issue.

------------------------------------------------------------------------

## 8. Security and operations

-   `GET /homepage` and `/homepage/stats` are public. Add them to the
    security permit-list next to `/book/query`.
-   `/homepage/for-you` requires auth. `/admin/homepage/**` requires the
    admin role.
-   Rate-limit `/homepage/for-you` per user, because it can trigger a
    model call.
-   Don't log prompts that include a user's reading history at INFO
    level.
-   Log each job's duration and outcome. Alert if the AI job has failed
    3 days in a row, or if `GET /homepage` p95 is over 300 ms.

------------------------------------------------------------------------

## 9. Testing plan

### Unit tests

-   Week start calculation in Africa/Lagos, including Sunday 23:30 and
    Monday 00:30.
-   Trending: union over 7 days, filtering to ACTIVE, backfill.
-   Top-author score and its fallback to most-shelved.
-   Featured rotation: no category repeats within 8 weeks and no author
    repeats within 4 weeks. ADMIN fields override and AUTO fills the
    gaps.
-   AI response parsing: invalid JSON, unknown IDs, fewer than 4 picks,
    over-long reasons.
-   Review selection: filters, 30-day widening, one per seller.

### Integration tests

-   `GET /homepage` returns 200 with every other section intact when
    one section throws.
-   A sold featured book disappears from the next response and is
    backfilled.
-   `PUT /admin/homepage/featured` changes the next `GET /homepage`
    immediately.
-   The AI job failing leaves yesterday's picks in place.
-   A counted view increments `views:day:{today}`. A repeat view the
    same day does not.
-   `/homepage/for-you` without history returns the global picks with
    `personalised: false`.

------------------------------------------------------------------------

## 10. Phases

### Phase 1: Bundle foundation

-   Daily view buckets in `BookViews`.
-   `HomepageService`, `GET /homepage` and `/homepage/stats` with
    `stats`, `categories`, `newArrivals` and `trending`.
-   Stats and trending jobs, plus the startup warm-up.

### Phase 2: Weekly curation

-   `homepage_features` collection and `FeaturedSection` (category,
    books, author, hero).
-   Top authors of the week.
-   Admin endpoints.

### Phase 3: AI

-   The scheduled global AI-picks job with reasons. Remove generation
    from the request path.
-   Personalised `GET /homepage/for-you`.

### Phase 4: Social proof

-   Reviews and trusted-sellers sections.

Document each phase in `API_CHANGES.md` (§24a, §24b …) as usual.

------------------------------------------------------------------------

## 11. Frontend contract summary

The frontend will add:

-   `app/types/homepage.d.ts`, which mirrors §3.1 as `IHomepage`.
-   `app/services/homepage.service.ts` with `get()`, `stats()` and
    `forYou()`.
-   `app/hooks/useHomepage.ts`, one TanStack query keyed `["homepage"]`
    with a 5-minute stale time; each section reads its slice.

Until each phase lands, the frontend keeps using the existing endpoints:
`/book/query?sort=NEWEST`, `/category`, `/author/top` and
`/book/recently-viewed`. Sections that depend on endpoints that don't
exist yet stay hidden.

------------------------------------------------------------------------

## 12. Decisions to confirm before implementation

1.  **Featured curation:** is an AUTO pick with optional admin override
    right, or should someone approve each week before it goes live?
2.  **AI cadence:** daily global picks is the recommendation. Weekly is
    cheaper but goes stale as books sell.
3.  **Stats wording:** is showing `booksSold` acceptable while the
    numbers are small? The frontend can hide any stat under a threshold
    (for example, under 100).
4.  **Admin UI:** do featured overrides need a screen in the admin area
    now, or are API calls enough for the first release?
