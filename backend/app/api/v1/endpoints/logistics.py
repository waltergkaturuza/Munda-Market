from fastapi import APIRouter, Query

router = APIRouter()

@router.get('/estimate')
async def estimate_fee(kg: float = Query(..., gt=0), district: str | None = None):
  base = 5.0
  per_kg = 0.06
  # Simple district modifier
  modifier = 1.0
  if district:
    if district.lower().startswith('bulawayo'):
      modifier = 1.2
    elif district.lower().startswith('harare'):
      modifier = 0.9
  fee = round((base + per_kg * kg) * modifier, 2)
  return { 'fee': fee, 'currency': 'USD', 'params': { 'kg': kg, 'district': district } }


