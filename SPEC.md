# SortsTG — Architecture & Flow (AI Context)

## 1. Overview
A private, single-user contact manager for browsing and managing contacts ("chicks").  
Contacts are displayed as visual cards grouped by price tier, with search, filtering, deep-links to WhatsApp / Telegram, and full CRUD. All data (contacts.json + images) lives in the user's own Google Drive.

**Stack**: React + TypeScript + Vite + CSS (no Tailwind). No backend server; 100% client-side talking directly to Google Drive API.

## 2. Core Architecture
- **Auth**: Handled by `@react-oauth/google`. User logs in, gets a short-lived `access_token` and a persistent `refresh_token` stored safely (via a small backend/bridge if configured, or just implicit flow depending on recent setup).
- **Storage (Google Drive)**:
  - App creates/finds an App Data folder (`SortsTG_Data`).
  - `contacts.json`: Central database. Downloaded on load, uploaded on save.
  - `images/`: Subfolder for storing contact photos. Images are uploaded as basic files and rendered via a `DriveImage` component that fetches them directly.
- **State Management**:
  - Custom hooks (`useAuth`, `useDrive`, `useContacts`, `useFilters`) wrap all business logic.
  - No Redux/Zustand; state flows from `App.tsx` down.

## 3. Data Model (`Contact`)
- `id`: UUID string.
- `name` (str), `age` (num), `ageType` (str, e.g. "Young", "Mid").
- `contactType`: `"phone"` | `"telegram"`.
- `contactValue`: Phone number or TG handle.
- `location`: Free-text string.
- `prices`: Array of `{ amount, duration, durationUnit }` (e.g. 13000, 2, "shots").
- `priceType`: `"budget" | "midrange" | "premium" | "models"`. Derived from the lowest price.
- `isActive`: Boolean toggle.
- `reviewText`: String, truncated on cards.
- `imageFileIds`: Array of Drive file IDs.

## 4. App UI Flow
1. **LoginScreen**: Prompt if no valid session.
2. **App (Authenticated)**:
   - **Header**: Title + Search toggle + Settings + Logout.
   - **FilterBar**: Toggles for showing Inactive, Tiers, and Locations.
   - **ContactGrid**:
     - Normally: Renders 4 `TierSection`s (Budget, Midrange, Premium, Models).
     - When Searching: Flat list of cards.
   - **ContactCard**: Horizontal layout. Photo left, details right. Tapping content opens Read-Only Modal.
   - **ContactModal**: Slides up on mobile. Used for Add (`mode='add'`), Edit (`mode='edit'`), and View (`mode='view'`). Handles image uploading to Drive.
   - **SettingsModal**: Manage `ageTypes` (enums) and tier boundary prices.

## 5. Styling Philosophy
- Pure CSS in `index.css`.
- Uses CSS Variables (`--var`) for theming (dark mode default).
- Mobile-first responsiveness (Modals stretch to 100vh on `<768px`).
- Heavy use of flexbox and CSS grids (`card-grid`, `price-entry` flex wrap).
- No utility frameworks (like Tailwind). Ensure class names follow BEM-like structure (e.g., `card__photo`, `card--inactive`).

## 6. Key Components to Know
- `DriveImage.tsx`: Crucial for rendering photos from Drive without public links (fetches array buffer using access token).
- `Lightbox.tsx`: Full-screen swipeable image viewer for cards.
- `ImageUploader.tsx`: Manages pending files before they are pushed to Drive on form save.
- `TierSection.tsx`: Collapsible accordion for tier groups.
