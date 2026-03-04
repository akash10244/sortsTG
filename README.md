# 🐔 Poultry Catalog App - User Guide

A modern, local-first poultry management application for tracking chicken inventory with photos, reviews, and price categorization.

## 📋 Features

- **CRUD Operations**: Add, edit, and delete chicken entries
- **Photo Management**: Upload multiple photos per entry with carousel viewing
- **Price Categorization**: 
  - **Budget**: Under ₹6,000
  - **Mid-Range**: ₹7,000 - ₹13,000
  - **Premium**: ₹14,000+
- **Review System**: Add ratings and comments for each entry
- **Analytics Dashboard**: Visual charts showing price distribution and category breakdown
- **Data Export**: Download catalog as JSON file
- **Categories**:
  - ⭐ **Recommended**: Your trusted breeds
  - 🔍 **Next to Try**: Breeds you're exploring

## 🚀 Getting Started

### Running the Application

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### First Time Setup

The app comes with sample data to help you get started. You can:
1. Edit or delete the sample entries
2. Add your own entries
3. Upload photos
4. Add reviews

## 📁 Data Storage

### Location
- **Catalog Data**: `/public/data/catalog.json`
- **Photos**: `/public/uploads/` (for future implementation)

### Data Structure
```json
{
  "entries": [
    {
      "id": "unique-id",
      "name": "Chicken Name",
      "description": "Details about the breed",
      "price": 5500,
      "photos": ["/uploads/photo1.jpg"],
      "reviews": [
        {
          "id": "review-id",
          "rating": 5,
          "comment": "Great birds!",
          "date": "2026-01-11"
        }
      ],
      "category": "recommended",
      "dateAdded": "2026-01-01"
    }
  ],
  "lastUpdated": "2026-01-11T05:00:00+05:30"
}
```

## 🎯 How to Use

### Adding a New Entry

1. Click the **"Add Entry"** button in the header
2. Fill in the required fields:
   - **Name** (required)
   - **Price** (required)
   - **Category** (Recommended or Next to Try)
   - **Description** (optional)
3. Upload photos (click or drag images)
4. Add reviews with star ratings
5. Click **"Create"**

### Editing an Entry

1. Find the entry card
2. Click the **Edit** (pencil) icon
3. Modify any fields
4. Click **"Update"**

### Deleting an Entry

1. Find the entry card
2. Click the **Delete** (trash) icon
3. Confirm the deletion

### Filtering by Price Range

Use the tabs at the top to filter entries:
- **All**: View all entries
- **Budget**: Under ₹6,000
- **Mid-Range**: ₹7,000 - ₹13,000
- **Premium**: ₹14,000+

### Exporting Data

1. Click **"Export Data"** in the header
2. A JSON file will download with the current date
3. Save this file as a backup
4. To restore: Replace `/public/data/catalog.json` with your backup

## 🖼️ Managing Photos

### Uploading Photos

- **Supported formats**: JPEG, JPG, PNG, WebP
- **Maximum size**: 5MB per image
- **Multiple uploads**: Upload several images at once
- Images are stored as base64 (currently in-memory)

### Photo Carousel

- Click **left/right arrows** to navigate photos
- Dots indicate current photo position
- Remove photos by clicking the **X** button in edit mode

## ⭐ Reviews System

### Adding Reviews

1. Open the Add/Edit modal
2. Scroll to the "Reviews" section
3. Select a star rating (1-5)
4. Add your comment
5. Click **"Add Review"**

### Managing Reviews

- View all reviews in the edit modal
- Delete reviews using the trash icon
- Reviews show date and rating

## 📊 Analytics Dashboard

The dashboard displays:

### Stats Cards
- **Total Entries**: Count of all chickens
- **Total Value**: Sum of all prices
- **Average Price**: Mean price across all entries
- **Category Distribution**: Visual breakdown of Recommended vs Next to Try

### Price Range Chart
- Bar chart showing distribution across Budget, Mid-Range, and Premium
- Real-time updates as you add/edit entries

## 💾 Saving Your Data

> [!IMPORTANT]
> **Current Implementation**: Data is stored in `/public/data/catalog.json`. Changes are made in-memory during your session.

### To Persist Changes:

1. Click **"Export Data"** 
2. Replace `/public/data/catalog.json` with the downloaded file
3. Refresh the page to see persisted changes

### Future Enhancement:
For a production version with real photo uploads, consider implementing a backend API or using IndexedDB for client-side persistence.

## 🎨 Design Features

- **Dark Mode**: Premium dark theme with glassmorphism
- **Vibrant Colors**: Color-coded price ranges
- **Smooth Animations**: Hover effects and transitions
- **Responsive**: Works on desktop and mobile
- **Modern Typography**: Inter font family

## 🔧 Technical Details

### Built With
- **React 18** with TypeScript
- **Vite** for fast development
- **Lucide React** for icons
- **Custom CSS** with modern design tokens

### File Structure
```
src/
├── components/          # React components
│   ├── Header.tsx
│   ├── Dashboard.tsx
│   ├── ChickCard.tsx
│   ├── ChickModal.tsx
│   ├── CategorySection.tsx
│   └── PriceRangeTabs.tsx
├── services/           # Data management
│   └── dataService.ts
├── utils/             # Utilities
│   ├── priceUtils.ts
│   └── imageUtils.ts
├── types/             # TypeScript types
│   └── index.ts
└── App.tsx            # Main app
```

## 🐛 Troubleshooting

### Photos not showing
- Check browser console for errors
- Ensure image file is under 5MB
- Verify supported format (JPEG, PNG, WebP)

### Data not persisting
- Remember to export and replace catalog.json
- Check if catalog.json is writable
- Refresh page after replacing file

### Slow performance
- Limit photos to 3-5 per entry
- Compress large images before upload
- Clear browser cache

## 📝 Tips

1. **Regular Backups**: Export data weekly
2. **Image Optimization**: Compress images before upload
3. **Organize**: Use categories effectively
4. **Reviews**: Add detailed reviews for reference
5. **Price Updates**: Keep prices current for accuracy

## 🚧 Limitations

- Photos stored as base64 (in-memory only)
- No automatic save to disk
- Must manually export to persist changes
- Single user (no authentication)
- No cloud sync

## 🔮 Future Enhancements

- Real file upload to `/public/uploads/`
- Automatic save functionality
- Search and advanced filtering
- Export to Excel/PDF
- Cloud backup integration
- Mobile app version

---

**Need Help?** Check the console for error messages or review the implementation plan in the artifacts directory.
