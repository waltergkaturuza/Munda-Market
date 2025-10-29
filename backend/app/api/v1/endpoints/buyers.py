from fastapi import APIRouter

router = APIRouter()

# Buyer endpoints will be implemented here
@router.get("/")
async def placeholder():
    return {"message": "Buyer endpoints coming soon"}
