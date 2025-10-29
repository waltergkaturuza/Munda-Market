from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import os, json, io

router = APIRouter()


def _load_orders() -> list:
    # Read lightweight persisted orders if available (created by orders endpoint)
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
    path = os.path.join(base, 'orders_mvp.json')
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []


@router.get('/summary')
async def analytics_summary(
    start: Optional[str] = None,
    end: Optional[str] = None,
    crop: Optional[str] = None,
    district: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
):
    orders = _load_orders()
    # Fallback to mock data when no orders
    if not orders:
        orders = [
            {
                "order_number": "M-100123",
                "created_at": "2024-01-15",
                "totals": {"subtotal": 400, "delivery_fee": 20, "service_fee": 8, "total": 428},
                "order": {"items": [{"name": "Tomatoes", "qtyKg": 200, "price": 1.2}]},
                "status": "paid",
                "delivery_district": "Harare",
                "buyer_id": "B-001",
                "delivered_at": "2024-01-20",
            },
            {
                "order_number": "M-100124",
                "created_at": "2024-03-05",
                "totals": {"subtotal": 520, "delivery_fee": 30, "service_fee": 10, "total": 560},
                "order": {"items": [{"name": "Cabbage", "qtyKg": 300, "price": 0.6}]},
                "status": "delivered",
                "delivery_district": "Bulawayo",
                "buyer_id": "B-002",
                "delivered_at": "2024-03-12",
            },
            {
                "order_number": "M-100125",
                "created_at": "2024-05-20",
                "totals": {"subtotal": 610, "delivery_fee": 35, "service_fee": 12, "total": 657},
                "order": {"items": [
                    {"name": "Onions", "qtyKg": 120, "price": 0.8},
                    {"name": "Tomatoes", "qtyKg": 80, "price": 1.1},
                ]},
                "status": "delivered",
                "delivery_district": "Harare",
                "buyer_id": "B-001",
                "delivered_at": "2024-05-25",
            },
        ]

    def to_dt(s: str):
        try:
            return datetime.strptime(s[:10], '%Y-%m-%d')
        except Exception:
            return None

    start_dt = to_dt(start) if start else None
    end_dt = to_dt(end) if end else None

    # Filter by date range and other filters if provided
    f_orders = []
    for o in orders:
        dt = to_dt(o.get('created_at') or o.get('order', {}).get('created_at', ''))
        if dt is None:
            f_orders.append(o)
            continue
        if start_dt and dt < start_dt:
            continue
        if end_dt and dt > end_dt:
            continue
        if district and o.get('delivery_district') and o.get('delivery_district').lower() != district.lower():
            continue
        # Item-level filters
        if crop or price_min is not None or price_max is not None:
            items = o.get('order', {}).get('items', [])
            keep = False
            for it in items:
                if crop and it.get('name', '').lower() != crop.lower():
                    continue
                price_ok = True
                if price_min is not None and it.get('price', 0) < price_min:
                    price_ok = False
                if price_max is not None and it.get('price', 0) > price_max:
                    price_ok = False
                if price_ok:
                    keep = True
                    break
            if not keep:
                continue
        f_orders.append(o)

    orders = f_orders

    # KPIs
    total_spend = round(sum(o['totals']['total'] for o in orders), 2)
    total_orders = len(orders)
    total_kg = 0.0
    for o in orders:
        total_kg += sum(i.get('qtyKg', 0) for i in o.get('order', {}).get('items', []))

    # Monthly spend series (YYYY-MM)
    monthly = {}
    for o in orders:
        dt = to_dt(o.get('created_at', ''))
        key = dt.strftime('%Y-%m') if dt else 'Unknown'
        monthly[key] = monthly.get(key, 0) + o['totals']['total']
    monthly_series = [
        {"month": k, "spend": round(v, 2)} for k, v in sorted(monthly.items())
    ]

    # Top crops by spend
    crop_spend = {}
    for o in orders:
        for i in o.get('order', {}).get('items', []):
            crop_spend[i['name']] = crop_spend.get(i['name'], 0) + (i.get('qtyKg', 0) * i.get('price', 0))
    top_crops = sorted(
        [{"name": k, "amount": round(v, 2)} for k, v in crop_spend.items()],
        key=lambda x: x['amount'], reverse=True
    )[:8]

    # Order status distribution
    status_counts = {}
    for o in orders:
        status_counts[o.get('status', 'unknown')] = status_counts.get(o.get('status', 'unknown'), 0) + 1
    status_dist = [{"status": k, "count": v} for k, v in status_counts.items()]

    # Average price per kg by crop
    crop_totals = {}
    for o in orders:
        for i in o.get('order', {}).get('items', []):
            name = i['name']
            qty = i.get('qtyKg', 0)
            rev = qty * i.get('price', 0)
            if name not in crop_totals:
                crop_totals[name] = {"qty": 0.0, "rev": 0.0}
            crop_totals[name]["qty"] += qty
            crop_totals[name]["rev"] += rev
    avg_price = [
        {"name": k, "price": round(v["rev"] / v["qty"], 2) if v["qty"] else 0} for k, v in crop_totals.items()
    ]

    # Cohort retention: month of first order by buyer -> subsequent months order counts (0..5)
    buyer_first: Dict[str, str] = {}
    for o in orders:
        bid = o.get('buyer_id', 'B-UNKNOWN')
        dt = to_dt(o.get('created_at', ''))
        if not dt:
            continue
        cohort = dt.strftime('%Y-%m')
        if bid not in buyer_first or cohort < buyer_first[bid]:
            buyer_first[bid] = cohort
    cohorts: Dict[str, List[int]] = {}
    for o in orders:
        bid = o.get('buyer_id', 'B-UNKNOWN')
        created = to_dt(o.get('created_at', ''))
        if not created:
            continue
        base = buyer_first.get(bid)
        if not base:
            continue
        base_dt = to_dt(base + '-01')
        offset = (created.year - base_dt.year) * 12 + (created.month - base_dt.month)
        if offset < 0 or offset > 12:
            continue
        arr = cohorts.setdefault(base, [0]*6)
        if offset < len(arr):
            arr[offset] += 1

    cohort_rows = [{"cohort": k, **{f"m{i}": v[i] for i in range(6)}} for k, v in sorted(cohorts.items())]

    # Lead time histogram
    bins = [0,1,2,3,5,7,10,14,21,30]
    lead_bins = {str(b): 0 for b in bins}
    for o in orders:
        cdt = to_dt(o.get('created_at', '')) or datetime.utcnow()
        ddt = to_dt(o.get('delivered_at', '')) or (cdt + timedelta(days=5))
        days = (ddt - cdt).days
        bucket = None
        for b in bins:
            if days <= b:
                bucket = str(b)
                break
        bucket = bucket or str(bins[-1])
        lead_bins[bucket] += 1
    lead_hist = [{"days": k, "count": v} for k, v in lead_bins.items()]

    # Fill rate and QC pass (mock if missing)
    ordered = sum(sum(i.get('qtyKg', 0) for i in o.get('order', {}).get('items', [])) for o in orders)
    fulfilled = sum(o.get('fulfilled_kg', 0) for o in orders) or ordered  # assume full if not provided
    fill_rate = round((fulfilled / ordered), 3) if ordered else 1.0
    qc_pass = round(0.95, 3)

    # Margin series (approx): base price ~ 85% of sell price if not provided
    margin_series = {}
    for o in orders:
        dt = to_dt(o.get('created_at', ''))
        key = dt.strftime('%Y-%m') if dt else 'Unknown'
        for it in o.get('order', {}).get('items', []):
            sell = it.get('price', 0)
            base = it.get('base_price', round(sell * 0.85, 2))
            margin = ((sell - base) / sell) if sell else 0
            margin_series.setdefault(key, []).append(margin)
    margin_points = [{"month": k, "margin": round(sum(v)/len(v), 3) if v else 0} for k, v in sorted(margin_series.items())]

    return {
        "kpis": {
            "total_spend": total_spend,
            "total_orders": total_orders,
            "total_kg": round(total_kg, 2),
        },
        "monthly_spend": monthly_series,
        "top_crops": top_crops,
        "status_distribution": status_dist,
        "avg_price": avg_price,
        "cohorts": cohort_rows,
        "lead_time_hist": lead_hist,
        "fill_rate": fill_rate,
        "qc_pass": qc_pass,
        "margin_series": margin_points,
    }


def _csv_response(rows: List[Dict[str, object]], headers: List[str], filename: str):
    buf = io.StringIO()
    buf.write(",".join(headers) + "\n")
    for r in rows:
        buf.write(",".join(str(r.get(h, '')) for h in headers) + "\n")
    stream = io.BytesIO(buf.getvalue().encode('utf-8'))
    return StreamingResponse(stream, media_type='text/csv', headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get('/monthly_spend.csv')
async def monthly_spend_csv():
    data = await analytics_summary()
    return _csv_response(data['monthly_spend'], ['month', 'spend'], 'monthly_spend.csv')


@router.get('/top_crops.csv')
async def top_crops_csv():
    data = await analytics_summary()
    return _csv_response(data['top_crops'], ['name', 'amount'], 'top_crops.csv')


@router.get('/cohorts.csv')
async def cohorts_csv():
    data = await analytics_summary()
    headers = ['cohort'] + [f'm{i}' for i in range(6)]
    return _csv_response(data['cohorts'], headers, 'cohorts.csv')


@router.get('/lead_time.csv')
async def lead_time_csv():
    data = await analytics_summary()
    return _csv_response(data['lead_time_hist'], ['days', 'count'], 'lead_time.csv')


@router.get('/margin.csv')
async def margin_csv():
    data = await analytics_summary()
    return _csv_response(data['margin_series'], ['month', 'margin'], 'margin.csv')


