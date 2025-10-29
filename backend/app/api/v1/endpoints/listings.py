from fastapi import APIRouter, Query
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# Temporary in-memory listings for MVP
MOCK_LISTINGS = [
    {
        "id": "L-001", "name": "Fresh Tomatoes", "grade": "A", "price": 1.2,
        "availableKg": 500, "harvest": "2024-11-02",
        "image": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=800&auto=format&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1514512364185-4c2b1c7e4b39?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=1200&auto=format&fit=crop"
        ],
        "location": {
            "district": "Harare",
            "province": "Harare",
            "country": "Zimbabwe"
        },
        "quality": { "brix": 7.5, "size": "60-70mm", "grade": "A" },
        "supply_history": [
            {"date": "2024-10-01", "deliveredKg": 300},
            {"date": "2024-10-15", "deliveredKg": 450}
        ]
    },
    {
        "id": "L-002", "name": "Red Onions", "grade": "B", "price": 0.8,
        "availableKg": 200, "harvest": "2024-11-05",
        "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop"
    },
    {
        "id": "L-003", "name": "Green Cabbage", "grade": "A", "price": 0.6,
        "availableKg": 300, "harvest": "2024-11-01",
        "image": "https://images.unsplash.com/photo-1607301405390-7e0070bd2f9f?q=80&w=800&auto=format&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1607301405390-7e0070bd2f9f?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567302543636-2e0b1af1b3ac?q=80&w=1200&auto=format&fit=crop"
        ],
        "location": {
            "district": "Mazowe",
            "province": "Mashonaland Central",
            "country": "Zimbabwe"
        },
        "quality": { "size": "Large", "grade": "A" },
        "supply_history": [
            {"date": "2024-09-20", "deliveredKg": 500}
        ]
    },
    {
        "id": "L-004", "name": "Butternut Squash", "grade": "A", "price": 0.9,
        "availableKg": 450, "harvest": "2024-11-06",
        "image": "https://images.unsplash.com/photo-1582642221644-9a5c0a51a140?q=80&w=800&auto=format&fit=crop"
    },
    {
        "id": "L-005", "name": "Green Peppers", "grade": "A", "price": 1.4,
        "availableKg": 180, "harvest": "2024-11-04",
        "image": "https://images.unsplash.com/photo-1542835435-4fa357baa00b?q=80&w=800&auto=format&fit=crop"
    },
    {
        "id": "L-006", "name": "Carrots", "grade": "B", "price": 0.7,
        "availableKg": 260, "harvest": "2024-11-03",
        "image": "https://images.unsplash.com/photo-1560786466-6c9fc0e9bb49?q=80&w=800&auto=format&fit=crop"
    },
]


@router.get("/")
async def get_listings(
    q: Optional[str] = None,
    grade: Optional[str] = Query(None, pattern="^[ABC]$|^ALL$", description="Filter by grade"),
    max_price: Optional[float] = None,
    sort: str = "price_asc",
    page: int = 1,
    page_size: int = 8,
):
    """Return paginated, filterable listings (temporary mock data)."""
    items = MOCK_LISTINGS.copy()

    if q:
        items = [x for x in items if q.lower() in x["name"].lower()]
    if grade and grade != "ALL":
        items = [x for x in items if x["grade"] == grade]
    if max_price is not None:
        items = [x for x in items if x["price"] <= max_price]

    field, direction = (sort.split("_") + ["asc"])[:2]
    reverse = direction == "desc"
    if field in {"price", "availableKg", "harvest"}:
        key_fn = (lambda x: x.get(field))
        items.sort(key=key_fn, reverse=reverse)

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = items[start:end]

    return {
        "items": page_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }
