# Rebooked Author Catalogue & Search Implementation

**Status:** Proposed implementation\
**Stack:** Java, Spring Boot, MongoDB\
**Primary data source:** Open Library\
**Enrichment source:** Wikidata (optional, subject to matching and
licensing review)\
**Search:** MongoDB Atlas Search when using Atlas; alternative described
for self-hosted MongoDB

------------------------------------------------------------------------

## 1. Goals

Build a central author catalogue for Rebooked so that:

-   Authors are managed as first-class records, independently of books
    and sellers.
-   A book can have multiple authors, with their display order
    preserved.
-   Sellers select existing authors through autocomplete instead of
    repeatedly typing names.
-   New authors can be proposed when no suitable match exists.
-   Potential duplicates can be detected and reviewed without
    incorrectly merging different people who share a name.
-   Rebooked can start with a large, pre-populated catalogue and
    periodically import updates.
-   Users can search for books by title, author, ISBN and genre.

### Non-goals for the first release

-   Automatically identifying every real-world author with certainty.
-   Automatically merging records based only on similar names.
-   Building a separate Elasticsearch/OpenSearch cluster.
-   Importing every available external metadata field into production.
-   Treating external catalogue IDs as Rebooked's internal IDs.

------------------------------------------------------------------------

## 2. Core design decisions

1.  **Author is a separate MongoDB document.** Do not embed the full
    author profile in every book.
2.  **Books reference authors by Rebooked author ID.** The ID is the
    source of truth.
3.  **A book supports multiple authors.** Store an ordered array of
    author references.
4.  **Names are not globally unique identities.** Two different people
    may have the same name.
5.  **External IDs identify source records, not necessarily people
    across all sources.** Store source and source ID together.
6.  **Name similarity creates suggestions, not automatic merges.**
7.  **Imported authors and user-proposed authors share the same
    canonical collection**, but retain provenance and verification
    status.
8.  **Search is backed by MongoDB.** Use Atlas Search if Rebooked is on
    Atlas; otherwise use a compatible self-hosted search strategy.

------------------------------------------------------------------------

## 3. Data model

The examples below use Spring Data MongoDB. Adjust package names, Lombok
usage, validation and audit conventions to match the existing codebase.

### 3.1 Author document

``` java
@Document(collection = "authors")
public class Author {
    @Id
    private String id;

    @Indexed
    private String name;

    // Deterministic, normalized form used for exact matching.
    @Indexed
    private String normalizedName;

    @Indexed(unique = true)
    private String slug;

    private String biography;
    private String photoUrl;

    private List<String> aliases = new ArrayList<>();
    private List<AuthorExternalIdentifier> externalIdentifiers = new ArrayList<>();

    // IMPORTED, USER_PROPOSED, ADMIN_CREATED, etc.
    private String origin;

    // UNVERIFIED, VERIFIED, NEEDS_REVIEW, MERGED
    private AuthorStatus status = AuthorStatus.UNVERIFIED;

    // If merged, point to the surviving canonical author.
    private String mergedIntoAuthorId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

``` java
public class AuthorExternalIdentifier {
    private String source;   // OPEN_LIBRARY, WIKIDATA
    private String sourceId; // e.g. OL...A or Q...
}
```

``` java
public enum AuthorStatus {
    UNVERIFIED,
    VERIFIED,
    NEEDS_REVIEW,
    MERGED
}
```

**Important:** Do not make `normalizedName` unique. Different people can
have the same name. The slug may need a disambiguating suffix, for
example `john-smith`, `john-smith-2`, or a stable ID suffix.

### 3.2 Book author reference

A book stores a compact ordered reference:

``` java
public class BookAuthorReference {
    private String authorId;
    private Integer position;
}
```

Example book document:

``` json
{
  "_id": "book-123",
  "title": "Things Fall Apart",
  "authors": [
    {
      "authorId": "author-456",
      "position": 0
    },
    {
      "authorId": "author-789",
      "position": 1
    }
  ]
}
```

The book document should not store a full author profile. If a
denormalized display-name snapshot is introduced for performance, treat
it as a cache only and define how it is refreshed after an author rename
or merge.

### 3.3 Author import job

Track each bulk import so it can be monitored and resumed:

``` java
@Document(collection = "author_import_jobs")
public class AuthorImportJob {
    @Id
    private String id;

    private String source;
    private String datasetVersion;
    private String sourceFile;
    private String status; // PENDING, RUNNING, COMPLETED, FAILED

    private long recordsRead;
    private long recordsCreated;
    private long recordsUpdated;
    private long recordsSkipped;
    private long recordsNeedingReview;
    private long recordsFailed;

    private String checkpoint;
    private String errorSummary;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
```

For detailed error reporting, use a separate `author_import_errors`
collection rather than storing an unbounded error list in one job
document.

### 3.4 Optional alias collection

For a modest catalogue, aliases can remain embedded in the author
document. If alias counts or alias search requirements grow, move them
to a separate `author_aliases` collection with fields such as
`authorId`, `name`, `normalizedName` and `source`.

Do not treat every alias as proof of identity. Aliases should be sourced
or reviewed.

------------------------------------------------------------------------

## 4. Name normalization and duplicate detection

Create one shared normalization component and use it consistently in:

-   Author creation.
-   Author autocomplete.
-   Import processing.
-   Alias creation.
-   Duplicate detection.

A basic normalization pipeline should:

1.  Trim leading and trailing whitespace.
2.  Normalize Unicode to a consistent form (NFKC is a reasonable
    starting point).
3.  Collapse repeated whitespace.
4.  Apply locale-independent lowercase for matching.
5.  Preserve the original display name separately.
6.  Avoid removing meaningful punctuation or name components without a
    deliberate rule.

Example:

  Input               Normalized value
  ------------------- ------------------
  `Chinua Achebe`     `chinua achebe`
  `CHINUA ACHEBE`     `chinua achebe`
  `Chinua   Achebe`   `chinua achebe`

### Matching policy

  -----------------------------------------------------------------------
  Match type              Example                 Behaviour
  ----------------------- ----------------------- -----------------------
  Exact external          Same Open Library ID    Update/link the same
  identifier                                      source record

  Exact normalized name   Same normalized name    Return existing
                                                  candidates; do not
                                                  assume identity

  Alias match             Name matches a known    Suggest the linked
                          alias                   author

  Fuzzy match             Minor spelling          Show possible matches
                          variation               for confirmation

  Same name, different    Two people named John   Keep separate records
  person                  Smith                   
  -----------------------------------------------------------------------

Use external IDs as strong evidence for matching records from the same
source. Cross-source matching (for example, Open Library to Wikidata)
should use additional evidence such as dates, works and source links.
Ambiguous matches should be queued for review.

### Fuzzy matching

-   With MongoDB Atlas, configure an Atlas Search autocomplete index for
    author names and aliases, with fuzzy matching enabled at query time.
-   Without Atlas Search, use exact normalized matching first. A
    dedicated search service or an application-level fuzzy matching
    library can be added if required.
-   Do not run an expensive full collection scan for every keystroke.
-   Apply minimum query length, result limits and debouncing in the
    client.

------------------------------------------------------------------------

## 5. MongoDB indexes

Create indexes through versioned database migrations or a controlled
startup/index-management process. Do not rely solely on developers
manually creating indexes in production.

Recommended indexes:

### `authors`

-   `normalizedName` --- non-unique ascending index.
-   `slug` --- unique index.
-   `externalIdentifiers.source + externalIdentifiers.sourceId` ---
    unique compound multikey index where supported by the chosen schema
    and validated against MongoDB's multikey uniqueness rules.
-   Optional status and updated date indexes for admin queues.

**Implementation note:** MongoDB unique multikey index behaviour can be
restrictive when an array contains multiple values. If enforcing
uniqueness of each `(source, sourceId)` pair is essential, prefer a
separate `author_external_identifiers` collection with a unique compound
index:

``` json
{
  "authorId": "author-456",
  "source": "OPEN_LIBRARY",
  "sourceId": "OL123A"
}
```

Indexes for that collection:

-   Unique compound index on `{ source: 1, sourceId: 1 }`.
-   Index on `{ authorId: 1 }`.

This separate collection is the safer recommended design for strong
external-ID uniqueness.

### `books`

-   `authors.authorId` --- ascending index.
-   `title` --- index appropriate to the selected search strategy.
-   `isbn` --- unique only if the existing product rules guarantee one
    book record per ISBN; otherwise use a non-unique index.
-   `genreIds` --- ascending multikey index.

------------------------------------------------------------------------

## 6. Author ingestion pipeline

### 6.1 Sources

**Open Library** should be the primary seed source. It provides author
records, identifiers and links to works. Prefer its bulk data dumps for
large imports instead of repeatedly calling its live API.

-   API documentation: https://openlibrary.org/developers/api
-   Data dumps: https://openlibrary.org/data

**Wikidata** can optionally enrich or help disambiguate records using
stable QIDs and structured metadata.

-   Data access: https://www.wikidata.org/wiki/Wikidata:Data_access

Before importing or redistributing any source fields, review the current
dataset/API terms, attribution requirements, image rights and licensing.
Store provenance so Rebooked can identify where each field came from. Do
not assume that every field or image in an external catalogue has
identical reuse rights.

### 6.2 Pipeline stages

1.  **Acquire** --- download a versioned dump to controlled storage.
2.  **Register job** --- create an import job with source and dataset
    version.
3.  **Parse** --- stream records; do not load a multi-gigabyte dump into
    memory.
4.  **Transform** --- map source fields into Rebooked's internal staging
    DTO.
5.  **Normalize** --- calculate normalized names and clean aliases.
6.  **Match external identifiers** --- check whether the source record
    was already imported.
7.  **Deduplicate cautiously** --- use exact source IDs first; queue
    ambiguous cross-source matches.
8.  **Upsert** --- create or update the canonical author record and
    external-ID mapping.
9.  **Checkpoint** --- persist progress at safe batch boundaries.
10. **Report** --- save counts and errors, then mark the job complete or
    failed.

### 6.3 Import behaviour

-   Imports must be idempotent: re-running the same dump must not create
    duplicate authors.
-   Use bulk writes in bounded batches.
-   Use a checkpoint that can resume after process failure.
-   Do not overwrite a user-corrected display name with an unreviewed
    source value.
-   Keep field-level provenance if multiple sources can update the same
    field.
-   Mark incomplete records as unverified rather than discarding every
    record with missing biography or photo.
-   Avoid importing every source record blindly. Define a selection
    policy based on useful author metadata, works or catalogue
    relevance.
-   Keep raw source data in temporary storage or a staging collection
    only when needed for audit/reprocessing; apply retention limits.

### 6.4 Initial catalogue strategy

For the first production seed, use a broad but quality-controlled author
catalogue. Include international authors and deliberately validate
coverage for Nigerian and other African authors, academic authors,
children's authors and popular genre writers.

Do not make a claim that a catalogue is comprehensive. Track coverage
and gaps and allow users to propose missing authors.

### 6.5 Scheduled updates

After the initial import, schedule a periodic job (for example, monthly)
to check for a new source dump. Compare source IDs and update only
changed/new records. Keep the last successful dataset version and import
timestamp.

------------------------------------------------------------------------

## 7. Application API

Suggested REST endpoints. Adapt names and response envelopes to
Rebooked's existing API conventions.

### Author search and retrieval

  ---------------------------------------------------------------------------------
  Method                  Endpoint                          Purpose
  ----------------------- --------------------------------- -----------------------
  `GET`                   `/api/authors/search?q={query}`   Autocomplete and author
                                                            search

  `GET`                   `/api/authors/{authorId}`         Retrieve author details

  `GET`                   `/api/authors/{authorId}/books`   Paginated books by
                                                            author
  ---------------------------------------------------------------------------------

Example search response:

``` json
{
  "items": [
    {
      "id": "author-456",
      "name": "Chinua Achebe",
      "slug": "chinua-achebe",
      "verified": true
    }
  ]
}
```

Search behaviour:

-   Require a sensible minimum query length (for example, 2 characters).
-   Return a small result set (for example, 10--20 items).
-   Search display names and aliases.
-   Rank exact normalized matches above prefix matches, then fuzzy
    matches.
-   Include enough context to help distinguish authors with identical
    names, such as birth/death years where available.
-   Do not expose internal import metadata unnecessarily.

### Author proposals

  Method   Endpoint                   Purpose
  -------- -------------------------- --------------------------
  `POST`   `/api/authors/proposals`   Propose a missing author

Example request:

``` json
{
  "name": "New Author Name"
}
```

The server must normalize the name and search for candidates before
creating a new record. If possible duplicates are found, return them to
the client for confirmation. A proposal can be saved as `UNVERIFIED` or
sent to an admin review queue, depending on product policy.

### Book creation/update

Book create/update requests should accept author IDs, not arbitrary
author names:

``` json
{
  "title": "Example Book",
  "authorIds": [
    "author-456",
    "author-789"
  ]
}
```

The backend must:

1.  Validate that every author ID exists and is selectable.
2.  Resolve merged author IDs to their canonical records.
3.  Reject duplicate author IDs in the same book request.
4.  Preserve the order supplied by the user.
5.  Store `BookAuthorReference` objects with positions.
6.  Avoid silently creating author records from the submitted strings.

------------------------------------------------------------------------

## 8. Book search

Support a unified search endpoint, for example:

`GET /api/books/search?q=achebe&genreId=...&page=0&size=20`

Search fields may include:

-   Book title.
-   Author name and aliases.
-   ISBN.
-   Publisher, where available.
-   Description, if useful and indexed.

For an author query, first resolve matching author IDs, then find books
whose `authors.authorId` is in that set. Combine with title/ISBN matches
according to the product's ranking rules.

Suggested initial ranking:

1.  Exact ISBN.
2.  Exact book title.
3.  Exact author name.
4.  Prefix title/author match.
5.  Fuzzy title/author match.
6.  Description or other lower-priority text match.

Use pagination and explicit sort options. Do not rely on an unbounded
query.

### Search implementation options

**MongoDB Atlas**

Use Atlas Search indexes for autocomplete and fuzzy search. Define
analyzers for names and aliases, and test accent/diacritic behaviour.
Keep normal MongoDB indexes for lookup and relationship queries.

**Self-hosted MongoDB**

Start with normalized exact/prefix queries and ordinary indexes. If
typo-tolerant search becomes a requirement, evaluate a dedicated search
engine or application-level search component. MongoDB's standard text
index is not a drop-in equivalent to Atlas Search autocomplete and fuzzy
matching.

------------------------------------------------------------------------

## 9. Seller book-entry experience

The author input should be a searchable multi-select component, not a
free-text field.

Expected flow:

1.  Seller focuses the Authors field.
2.  Seller types an author name.
3.  Client debounces input and calls `/api/authors/search`.
4.  Existing authors appear as selectable suggestions.
5.  Seller can select multiple authors.
6.  Selected authors appear as removable chips.
7.  If no suitable author exists, show **Propose a new author**.
8.  Before accepting a new proposal, show possible matches if the
    backend found any.
9.  Book submission sends selected author IDs in display order.

The UI should show useful disambiguation details when available (for
example, birth/death years or a short biography). Do not ask sellers to
decide between two records based on name alone when the records are
indistinguishable; allow an admin review path.

------------------------------------------------------------------------

## 10. Admin author management

Build an admin interface for:

-   Searching and viewing authors.
-   Reviewing unverified user proposals.
-   Reviewing possible duplicate pairs.
-   Editing display names, biographies and aliases.
-   Adding/removing external identifiers with an audit trail.
-   Merging duplicate author records.
-   Keeping two same-name authors separate.
-   Viewing books linked to an author.
-   Inspecting import jobs and failures.

### Merge workflow

Merging must be an explicit, audited operation:

1.  Admin chooses the surviving canonical author.
2.  Admin chooses the duplicate author.
3.  Show both profiles, identifiers, aliases and linked book counts.
4.  Confirm that the records represent the same person.
5.  Update books referencing the duplicate to reference the canonical
    author.
6.  Transfer aliases and valid external identifiers.
7.  Mark the duplicate as `MERGED` and set `mergedIntoAuthorId`.
8.  Prevent merged records from appearing as selectable results.
9.  Retain a redirect/resolution path for old author URLs and IDs.
10. Record who performed the merge, when, and why.

Use a transaction where supported by the MongoDB deployment. For large
merges, use a resumable job with an explicit merge state and
reconciliation checks. Do not delete the duplicate record immediately.

------------------------------------------------------------------------

## 11. Genre and category modelling

Genres should also be independent records if books can belong to
multiple genres.

A book can reference multiple genre IDs. Categories may represent
broader groupings (for example, Academic, Fiction or Children's Books),
while genres describe content type (for example, Historical Fiction,
Romance or Thriller).

Avoid storing uncontrolled genre strings on every book. Use controlled
genre records, slugs and optional parent relationships. Keep category
and genre concepts distinct in the UI and data model.

------------------------------------------------------------------------

## 12. Security, validation and operational considerations

-   Restrict author creation/proposal and admin operations according to
    user roles.
-   Rate-limit public author search and proposal endpoints.
-   Validate and limit query length and page size.
-   Sanitize user-entered biographies and external URLs before display.
-   Avoid trusting imported URLs or image locations without validation.
-   Log import and merge operations with actor, timestamp and outcome.
-   Do not expose private seller data in author search results.
-   Monitor query latency, search index health, import failures and
    duplicate-review backlog.
-   Back up MongoDB before large imports and bulk merge operations.
-   Test index creation and bulk writes against a staging copy of
    production-sized data.

------------------------------------------------------------------------

## 13. Testing plan

### Unit tests

-   Name normalization (case, whitespace, Unicode).
-   External identifier equality.
-   Alias matching.
-   Duplicate candidate scoring.
-   Slug generation and collisions.
-   Merged-author resolution.
-   Book author order preservation.

### Integration tests

-   Search exact author name.
-   Search by alias.
-   Search with a typo (where supported by the selected search engine).
-   Create a book with multiple authors.
-   Reject unknown author IDs.
-   Reject duplicate author IDs in a book.
-   Find books by author.
-   Import the same source record twice without creating duplicates.
-   Resume an interrupted import.
-   Merge authors and confirm all book references are updated.
-   Keep two distinct authors with identical names separate.

### Load tests

-   Autocomplete under expected concurrent seller traffic.
-   Author-to-books lookup on authors with many associated books.
-   Bulk import throughput and memory use.
-   Search latency with realistic catalogue size.

------------------------------------------------------------------------

## 14. Suggested implementation phases

### Phase 1 --- Domain foundation

-   Add Author and external identifier collections.
-   Add ordered author references to Book.
-   Add indexes.
-   Add normalization service.
-   Add repository and service tests.

### Phase 2 --- Seller experience

-   Add author autocomplete endpoint.
-   Add multi-select author input.
-   Add missing-author proposal flow.
-   Update book create/edit validation to use author IDs.

### Phase 3 --- Initial seed

-   Build streaming Open Library dump parser.
-   Add import job tracking and checkpoints.
-   Import a quality-controlled initial dataset.
-   Validate African and Nigerian author coverage.
-   Reconcile counts, duplicates and failed records.

### Phase 4 --- Search

-   Confirm whether production uses MongoDB Atlas.
-   If Atlas, configure Atlas Search autocomplete/fuzzy indexes.
-   If self-hosted, ship indexed exact/prefix search first and evaluate
    a dedicated fuzzy search option.
-   Add author-aware book search and ranking.

### Phase 5 --- Admin and maintenance

-   Add author review and duplicate resolution UI.
-   Add audited merge workflow.
-   Add periodic source-dump checks and incremental imports.
-   Add operational dashboards and alerts.

------------------------------------------------------------------------

## 15. Decisions to confirm before implementation

These are the remaining environment/product decisions:

1.  **MongoDB deployment:** Atlas or self-hosted? This determines the
    search implementation.
2.  **Current Book schema:** Confirm the existing book author field and
    plan a migration from current string values to author references.
3.  **Author proposal policy:** Can sellers create unverified authors
    immediately, or must an admin approve every new author?
4.  **Initial import scope:** Import a broad catalogue or begin with a
    curated subset and expand?
5.  **External metadata policy:** Which fields (biography, image, dates,
    aliases) can be retained and displayed under the applicable source
    terms?

------------------------------------------------------------------------

## 16. Recommended first engineering task

Start with the domain foundation and a migration plan for existing
books:

1.  Inspect the current Book document and all code paths that read/write
    its author field.
2.  Create the Author and AuthorExternalIdentifier collections.
3.  Implement a normalization service and repository methods.
4.  Add ordered author ID references to Book.
5.  Write a migration that converts existing author strings into
    candidate Author records.
6.  Generate a duplicate-review report rather than automatically merging
    uncertain matches.
7.  Validate migrated book-author relationships before switching reads
    to the new model.

This sequence avoids coupling the author catalogue to the bulk import
before the core domain model is stable.
