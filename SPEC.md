# SortsTG — Product Specification

> Last updated: 2026-03-04  
> Stack: React 19 + TypeScript + Vite (frontend) · Node.js/Express (auth server) · Google Drive (storage)

---

## 1. Overview

A private, single-user contact manager for browsing and managing contacts ("chicks").  
Contacts are displayed as visual cards grouped by price tier, with search, filtering, deep-links to WhatsApp / Telegram, and full CRUD. All data (contacts JSON + images) lives in the user's own Google Drive.

---

## 2. Data Model

### `Contact`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID) | Auto-generated |
| `name` | `string` | Required |
| `age` | `number` | Required, min 18 |
| `ageType` | `string` | User-defined enum (see §2.1) |
| `contactType` | `"phone" \| "telegram"` | Drives deep-link behaviour |
| `contactValue` | `string` | Phone number (with country code) or Telegram username |
| `location` | `string` | Single location string (city / area) |
| `reviewText` | `string` | Optional free-text review |
| `imageFileIds` | `string[]` | Google Drive file IDs in the Images subfolder |
| `isActive` | `boolean` | Default `true` |
| `price` | `number` | INR (₹). Tier is auto-derived from this + tier config |
| `priceType` | `"budget" \| "midrange" \| "premium" \| "models"` | Computed from price on save; stored for fast filtering |
| `createdAt` | `ISO string` | Auto-set |
| `updatedAt` | `ISO string` | Auto-set |

### `AppConfig` (stored alongside contacts in Drive)

```ts
interface AppConfig {
  ageTypes: string[];          // user-managed enum list
  tierBoundaries: {
    midrangeMin: number;       // default 7000
    premiumMin: number;        // default 13000
    modelsMin: number;         // default 18000
  };
}
```

### 2.1 `ageType` Enum

Fully user-customisable. Default values: `Young`, `Mid`, `Mature`.  
Managed from the Settings screen (add / delete). Deleting a value that contacts still use is allowed with a warning; those contacts keep the raw string until manually updated.

### 2.2 Price Tiers (derived from `AppConfig.tierBoundaries`)

| Tier key | Default range |
|---|---|
| `budget` | `price < midrangeMin` |
| `midrange` | `midrangeMin ≤ price < premiumMin` |
| `premium` | `premiumMin ≤ price < modelsMin` |
| `models` | `price ≥ modelsMin` |

Boundaries are **editable** in Settings and persisted in `AppConfig`.

---

## 3. Google Drive Storage

### Folder Layout

```
Google Drive/
└── projects/
    └── sortsTG/               ← DRIVE_FOLDER_PATH (existing)
        ├── contacts.json      ← all contacts + AppConfig
        └── images/            ← dedicated image subfolder
            ├── <uuid>_photo1.jpg
            └── ...
```

### Image Flow

1. **Upload**: user picks a file → `uploadFile(file, imagesFolderId)` → returns `webViewLink`.  
   The file **must be made publicly readable** after upload (Drive `permissions.create` with `role: reader, type: anyone`) so the `<img>` tag can display it without auth headers.  
   Store the Drive **file ID** (not the link) in `imageFileIds`; derive the display URL at render time:  
   `https://drive.google.com/uc?export=view&id=<fileId>`

2. **Delete**: when a contact is deleted or an image removed, call Drive `files.delete` for each orphaned file ID.

3. **Folder init**: on app startup, after `getOrCreateAppFolder()`, run the same walk for `images/` sub-path to get (or create) `imagesFolderId`.

### Data File

- **contacts.json** stores `{ contacts: Contact[], config: AppConfig }`.
- Use existing `saveJson` / `loadJson` from `driveService.ts`.
- Write the whole file on every change (acceptable for a personal list < 500 contacts).

---

## 4. UI Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: "SortsTG"                    ⚙ Settings     │
├──────────────────────────────────────────────────────┤
│  🔍 Search (name / phone / TG handle)                │
│  [Active only toggle]  [Tier chips]  [📍 Location ▾] │
├──────────────────────────────────────────────────────┤
│  ── BUDGET ──────────────────────────  (N)           │
│  [Card] [Card] [Card] …  (wrap to next row)          │
│                                                      │
│  ── MID-RANGE ───────────────────────  (N)           │
│  [Card] …                                            │
│                                                      │
│  ── PREMIUM ─────────────────────────  (N)           │
│  [Card] …                                            │
│                                                      │
│  ── MODELS ──────────────────────────  (N)           │
│  [Card] …                                            │
├──────────────────────────────────────────────────────┤
│                              [＋ Add Contact]  (FAB) │
└──────────────────────────────────────────────────────┘
```

- **Default sort**: ascending by price within each section.
- Sections with 0 results still show the header with a `0` badge; no cards are rendered.
- When a search query is active, results are shown **flat** (no section grouping), still sorted ascending by price.

---

## 5. Search

- Single search bar.  
- Searches: `name`, `contactValue`, `location` — case-insensitive, partial match.
- Clears to restore grouped view.

---

## 6. Filters

All filters are AND-combined.

| Filter | Default | Behaviour |
|---|---|---|
| Active toggle | Show active only | Toggle reveals inactive (visually dimmed) |
| Tier chips | All selected | Deselect a chip to hide that section |
| Location dropdown | All checked | Multi-select checkboxes; list built from distinct `location` values |

---

## 7. Contact Card

```
┌─────────────────────────────────────┐
│  [← Image carousel →]  (dot indicators)
│  ● Active  /  ○ Inactive  badge     │
├─────────────────────────────────────┤
│  Name · Age (ageType)               │
│  📍 Location                        │
│  💰 ₹Price  [Tier badge]            │
│  🟢 WhatsApp +91-XXXXX              │  ← opens wa.me link
│    OR                               │
│  ✈️  @tg_username                   │  ← opens t.me link
│  ★ "Review in one line…" [Show more]│
├─────────────────────────────────────┤
│  [✏️ Edit]                [🗑️ Delete] │
└─────────────────────────────────────┘
```

**Inactive cards**: slightly muted (opacity / greyscale) with a clear `Inactive` badge.  
**Image carousel**: if no images → placeholder silhouette. Clicking opens a lightbox.  
**Review text**: single truncated line; `Show more` expands in-place.

### Deep-link Rules

| `contactType` | Tap opens |
|---|---|
| `phone` | `https://wa.me/<contactValue>` |
| `telegram` | `https://t.me/<contactValue>` |

---

## 8. Add / Edit Contact (Modal / Slide-over)

| Field | Input | Notes |
|---|---|---|
| Name | Text | Required |
| Age | Number | Required, min 18 |
| Age Type | Single-select | Pulls from `AppConfig.ageTypes` |
| Contact Type | Toggle Phone / Telegram | |
| Contact Value | Text | |
| Location | Text + autocomplete from existing values | |
| Price (₹) | Number | Required; tier label shown live below field |
| Is Active | Toggle | Default on |
| Review Text | Textarea | Optional |
| Images | Multi-file picker → uploads to Drive `images/` subfolder | Shows thumbnails; delete individual images |

- Save validates required fields; shows inline errors.  
- While images are uploading, a per-image progress indicator is shown.

---

## 9. Delete Contact

Confirmation dialog: **"Delete [Name]? This cannot be undone."**  
On confirm: delete contact from JSON **and** call Drive `files.delete` for each image file ID.

---

## 10. Settings Screen

Opened from the header ⚙ icon. Two sections:

### 10.1 Age Types
- List of current values, each with a 🗑 delete button.
- Inline add input.
- Deleting a value used by contacts shows a warning count.

### 10.2 Tier Boundaries
- Three number inputs: Mid-range from (₹), Premium from (₹), Models from (₹).
- Live preview: `Budget: < ₹N · Mid-range: ₹N–₹M · Premium: ₹M–₹P · Models: ≥ ₹P`.
- Save persists to `AppConfig` in Drive and re-derives all `priceType` values.

---

## 11. Drive Service — New Functions Needed

On top of existing `driveService.ts`:

```ts
// Make a just-uploaded file publicly readable
makeFilePublic(fileId: string): Promise<void>

// Delete a file from Drive
deleteFile(fileId: string): Promise<void>

// Get-or-create the images subfolder, returns its ID
getOrCreateImagesFolder(parentFolderId: string): Promise<string>
```

---

## 12. Component Tree (proposed)

```
App
├── LoginScreen
└── AuthenticatedApp
    ├── Header (Settings icon)
    ├── SearchBar
    ├── FilterBar (ActiveToggle | TierChips | LocationDropdown)
    ├── ContactGrid
    │   └── TierSection × 4
    │       └── ContactCard × N
    │           └── ImageCarousel
    ├── ContactModal (Add / Edit)
    │   └── ImageUploader
    ├── DeleteConfirmDialog
    └── SettingsModal
        ├── AgeTypeManager
        └── TierBoundaryEditor
```

---

## 13. Non-functional

- Auth: existing Google OAuth gate (only logged-in owner).
- No pagination — full list loaded at startup (suitable for < 500 contacts).
- Currency: INR (₹) only.
- Responsive: desktop + tablet primary; mobile secondary.
- One location string per contact.
