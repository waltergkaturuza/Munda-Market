# Product Media & Marketing Features Guide

## Overview
Your Munda Market platform now supports rich product presentations with images, detailed descriptions, and marketing content to attract buyers. This guide explains how to add beautiful pictures and compelling details to your products.

## 📸 Features Added

### 1. **Crop-Level Media** (Base Product Information)
- Primary product image
- Gallery of additional images
- Detailed descriptions
- Short descriptions for quick previews
- Nutritional information
- Health benefits
- Storage and preparation tips

### 2. **Lot-Level Media** (Specific Harvest Batch)
- Multiple product photos
- Thumbnail image for quick display
- Detailed description of this specific lot
- Highlights/selling points
- Quality details (already existed: size, color, brix)

### 3. **Listing-Level Marketing** (Buyer-Facing Offers)
- Custom listing title
- Marketing description
- Key selling points
- Featured image
- Promotional badges (e.g., "Best Seller", "Organic")
- New arrival and limited supply flags

## 🚀 Getting Started

### Step 1: Run the Database Migration

```bash
cd backend
python migrations/run_migration.py
```

This will add all the new fields to your database.

### Step 2: Add Images to Your Crops

**Example: Creating a Crop with Images**

```bash
POST /api/v1/crops/
Content-Type: application/json
```

```json
{
  "name": "Tomatoes",
  "variety": "Roma",
  "category": "vegetable",
  "subcategory": "fruit vegetable",
  "unit": "kg",
  "perishability_days": 7,
  "base_price_usd_per_kg": 1.50,
  
  "image_url": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=800",
  "gallery_images": [
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=1200",
    "https://images.unsplash.com/photo-1514512364185-4c2b1c7e4b39?q=80&w=1200",
    "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=1200"
  ],
  
  "short_description": "Fresh, vine-ripened tomatoes perfect for salads and cooking",
  "description": "Our premium Roma tomatoes are carefully grown using sustainable farming practices. Each tomato is hand-picked at peak ripeness to ensure maximum flavor and nutritional value. Perfect for sauces, salads, or eating fresh.",
  
  "nutritional_info": {
    "calories": "18 per 100g",
    "vitamin_c": "21% DV",
    "vitamin_a": "17% DV",
    "potassium": "5% DV",
    "lycopene": "High"
  },
  
  "health_benefits": "Tomatoes are rich in lycopene, a powerful antioxidant that supports heart health. They're also an excellent source of vitamins C and K, potassium, and folate.",
  
  "storage_tips": "Store at room temperature away from direct sunlight. Once ripe, refrigerate to extend freshness for up to 7 days. For best flavor, bring to room temperature before eating.",
  
  "preparation_tips": "Wash thoroughly before use. For easy peeling, blanch in boiling water for 30 seconds, then plunge into ice water. Remove the core with a paring knife."
}
```

### Step 3: Add Photos to Your Lots

**Example: Creating a Lot with Photos**

```bash
POST /api/v1/farmers/lots
Content-Type: application/json
```

```json
{
  "plan_id": 123,
  "grade": "A",
  "available_kg": 500,
  "min_order_kg": 10,
  "size_range": "60-70mm",
  "color_description": "Deep red, uniform",
  "brix_reading": 7.5,
  "harvest_date": "2024-11-25T08:00:00Z",
  
  "thumbnail_url": "https://your-storage.com/lots/lot-123-thumb.jpg",
  "photos": [
    "https://your-storage.com/lots/lot-123-1.jpg",
    "https://your-storage.com/lots/lot-123-2.jpg",
    "https://your-storage.com/lots/lot-123-3.jpg",
    "https://your-storage.com/lots/lot-123-quality.jpg"
  ],
  
  "description": "Freshly harvested this morning from our organic farm in Mazowe. These Grade A Roma tomatoes are perfectly ripe with excellent color and firmness. Ideal for wholesale buyers seeking premium quality produce.",
  
  "highlights": [
    "Harvested less than 24 hours ago",
    "100% organic, pesticide-free",
    "Uniform size and color",
    "High brix reading (7.5) - excellent sweetness",
    "Cold chain ready",
    "Available for immediate delivery"
  ]
}
```

## 📷 Image Best Practices

### Image URLs
You can use images from:
1. **Cloud Storage** (Recommended for production)
   - AWS S3: `https://your-bucket.s3.amazonaws.com/products/tomato-1.jpg`
   - Google Cloud Storage
   - Azure Blob Storage
   - Cloudinary

2. **Free Image Services** (For testing)
   - Unsplash: `https://images.unsplash.com/photo-ID?q=80&w=800`
   - Always respect attribution requirements

### Image Size Guidelines
- **Thumbnail**: 400x400px (square, small file size)
- **Primary Image**: 800x800px (product display)
- **Gallery Images**: 1200x1200px (detail view)
- **Format**: JPEG for photos, PNG for images with transparency
- **File Size**: Keep under 200KB for fast loading

### Photography Tips
1. **Good Lighting**: Natural daylight or bright LED lights
2. **Clean Background**: White or neutral backgrounds work best
3. **Multiple Angles**: Show top view, side view, and close-ups
4. **Scale Reference**: Include common objects for size comparison
5. **Show Quality**: Highlight the best features of your produce

## 🎨 Writing Compelling Descriptions

### Short Description (Crop)
- Keep it under 100 characters
- Focus on the key benefit or feature
- Example: "Fresh, vine-ripened tomatoes perfect for salads and cooking"

### Full Description
- Tell the story: Where grown, how grown, what makes it special
- Highlight quality indicators
- Mention ideal uses
- Keep it conversational and engaging
- 2-3 paragraphs maximum

### Highlights (Lot)
- Use bullet points
- Start with action words or benefits
- Be specific: "Harvested today" not "Fresh"
- Include certifications: "Organic certified", "GAP compliant"
- Mention unique selling points

## 🎯 Marketing Examples

### Promotional Badges
```json
{
  "promotional_badge": "Best Seller",
  "is_featured": true,
  "is_new_arrival": false,
  "is_limited_supply": true
}
```

Available badge types:
- `"Best Seller"` - Popular products
- `"Organic"` - Certified organic
- `"New Arrival"` - Recently added
- `"Limited Supply"` - Scarcity marketing
- `"Premium Quality"` - Top grade
- `"Farm Fresh"` - Just harvested

### Listing Marketing
```json
{
  "title": "🌟 Premium Organic Tomatoes - Limited Stock!",
  "description": "Don't miss out on this week's harvest of exceptional Roma tomatoes. Our farmers have outdone themselves with this batch - perfect color, size, and sweetness. Order now for delivery this weekend!",
  "selling_points": [
    "Certified organic by ZimCert",
    "Hand-picked at peak ripeness",
    "Only 500kg available this week",
    "Free delivery on orders over 50kg",
    "100% satisfaction guarantee"
  ],
  "featured_image": "https://your-storage.com/featured/tomatoes-hero.jpg",
  "is_featured": true,
  "is_limited_supply": true
}
```

## 📊 Viewing Product Media

### Retrieve Crop with Images
```bash
GET /api/v1/crops/123
```

**Response:**
```json
{
  "crop_id": 123,
  "name": "Tomatoes",
  "variety": "Roma",
  "image_url": "https://...",
  "gallery_images": ["https://...", "https://..."],
  "description": "Our premium Roma tomatoes...",
  "short_description": "Fresh, vine-ripened tomatoes...",
  "nutritional_info": {
    "calories": "18 per 100g",
    "vitamin_c": "21% DV"
  },
  "health_benefits": "Tomatoes are rich in lycopene...",
  "storage_tips": "Store at room temperature...",
  "preparation_tips": "Wash thoroughly before use..."
}
```

### List All Crops with Media
```bash
GET /api/v1/crops/
```

Returns all crops with their media fields populated.

## 🔧 Updating Existing Products

### Update Crop Images
```bash
PUT /api/v1/crops/123
Content-Type: application/json
```

```json
{
  "image_url": "https://new-image-url.jpg",
  "gallery_images": [
    "https://new-gallery-1.jpg",
    "https://new-gallery-2.jpg"
  ],
  "description": "Updated description with more details..."
}
```

### Update Lot Photos
Currently, lot updates aren't fully implemented. You'll need to create a new lot with updated photos or contact admin.

## 💡 Tips for Success

1. **Start with Quality Photos**
   - Invest time in good product photography
   - Use consistent lighting and backgrounds
   - Show your produce at its best

2. **Tell Your Story**
   - Buyers want to know where their food comes from
   - Highlight your farming practices
   - Build trust with transparency

3. **Update Regularly**
   - Keep descriptions current
   - Use seasonal messaging
   - Rotate featured images

4. **Test Different Approaches**
   - Try different descriptions
   - See what buyers respond to
   - Adjust based on feedback

5. **Mobile-First Thinking**
   - Many buyers shop on mobile
   - Keep descriptions concise
   - Ensure images load quickly

## 🆘 Need Help?

### Common Issues

**Q: My images aren't showing up**
- Check that URLs are publicly accessible
- Verify the image format (JPEG/PNG/WebP)
- Ensure HTTPS is used for secure connections

**Q: Can I upload images directly?**
- Currently, you need to host images externally
- Future updates will include direct upload
- Use cloud storage services for reliable hosting

**Q: How do I add videos?**
- Video support coming in future update
- For now, use photo galleries
- Consider adding a video link in description

**Q: Can buyers see all this information?**
- Yes! All media fields are visible to buyers
- Listings show featured images prominently
- Details appear in product pages

## 📞 Support

For technical assistance or feature requests:
- Email: support@mundamarket.co.zw
- Phone: +263 XXX XXX XXX
- WhatsApp: [link to support]

---

**Last Updated:** November 25, 2024
**Version:** 1.0.0

