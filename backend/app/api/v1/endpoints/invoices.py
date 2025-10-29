from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse, HTMLResponse, PlainTextResponse
from typing import Optional
from datetime import datetime, timedelta
import io
import os
import base64

router = APIRouter()

MOCK_INVOICES = [
    {
        "invoice_id": "INV-001",
        "order_number": "M-100123",
        "date": "2024-11-01",
        "buyer_name": "System Administrator",
        "status": "PAID",
        "currency": "USD",
        "lines": [
            {"name": "Carrots", "qtyKg": 100, "unit_price": 0.7},
            {"name": "Green Cabbage", "qtyKg": 200, "unit_price": 0.6},
        ],
        "fees": {"delivery": 12.8, "service": 5.0},
    },
    {
        "invoice_id": "INV-002",
        "order_number": "M-100124",
        "date": "2024-11-02",
        "buyer_name": "System Administrator",
        "status": "PAID",
        "currency": "USD",
        "lines": [
            {"name": "Fresh Tomatoes", "qtyKg": 50, "unit_price": 1.2},
        ],
        "fees": {"delivery": 6.5, "service": 2.0},
    },
    {
        "invoice_id": "INV-003",
        "order_number": "M-100125",
        "date": "2024-11-03",
        "buyer_name": "System Administrator",
        "status": "DUE",
        "currency": "USD",
        "lines": [
            {"name": "Red Onions", "qtyKg": 120, "unit_price": 0.8},
        ],
        "fees": {"delivery": 9.4, "service": 2.1},
    },
]


def _with_totals(inv: dict) -> dict:
    lines = [
        {**ln, "line_total": round(ln["qtyKg"] * ln["unit_price"], 2)} for ln in inv["lines"]
    ]
    subtotal = round(sum(l["line_total"] for l in lines), 2)
    delivery = inv["fees"].get("delivery", 0.0)
    service = inv["fees"].get("service", 0.0)
    total = round(subtotal + delivery + service, 2)
    return {**inv, "lines": lines, "subtotal": subtotal, "total": total}


@router.get("/")
async def list_invoices(q: Optional[str] = None, status: Optional[str] = None):
    items = MOCK_INVOICES
    if q:
        items = [i for i in items if q.lower() in i["invoice_id"].lower() or q.lower() in i["order_number"].lower()]
    if status:
        items = [i for i in items if i["status"].lower() == status.lower()]
    return {"items": [_with_totals(i) for i in items], "total": len(items)}


@router.get("/{invoice_id}")
async def invoice_detail(invoice_id: str):
    inv = next((i for i in MOCK_INVOICES if i["invoice_id"] == invoice_id), None)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _with_totals(inv)


def render_invoice_html(inv: dict) -> str:
    # Minimal branded HTML (print-friendly) matching Munda Market palette
    styles = """
    <style>
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      body { font-family: Arial, sans-serif; margin: 24px; color: #1b1b1b; }
      .header { display:flex; justify-content:space-between; align-items:center; }
      .brand { display:flex; align-items:center; gap:16px; }
      .logo{ width:72px; height:72px; background:#2e7d32; border-radius:8px; display:inline-block; }
      h1 { margin: 0; font-size: 22px; }
      .badge { background:#8bc34a; color:#0b3d0b; padding:4px 10px; border-radius:4px; font-weight:600; }
      .meta { margin-top:8px; color:#555; }
      .two-col { display:flex; gap:24px; margin-top:16px; }
      .col { flex:1; }
      .summary { width:360px; border:1px solid #e0e0e0; border-radius:6px; overflow:hidden; }
      .summary .head { background:#8bc34a; color:#0b3d0b; padding:8px 12px; font-weight:700; }
      .summary .row { display:flex; justify-content:space-between; padding:8px 12px; border-bottom:1px solid #f0f0f0; }
      .summary .total { background:#2e7d32; color:#fff; font-weight:800; }
      table { width:100%; border-collapse: collapse; margin-top:16px; }
      th { background:#e8f5e9; color:#1b5e20; text-align:left; padding:10px; font-weight:700; }
      td { padding:10px; border-bottom:1px solid #eee; }
      .right { text-align:right; }
      .totals { margin-top:12px; width:100%; }
      .totals td { padding:6px 10px; }
      .grand { background:#2e7d32; color:#fff; font-weight:700; }
      .foot { margin-top:24px; font-size:12px; color:#666; }
    </style>
    """
    lines_html = "".join(
        f"<tr><td>{ln['name']}</td><td class='right'>{ln['qtyKg']} kg</td><td class='right'>$ {ln['unit_price']:.2f}</td><td class='right'>$ {ln['line_total']:.2f}</td></tr>"
        for ln in inv["lines"]
    )
    # Try to embed logo as base64
    def _resolve_logo_path() -> Optional[str]:
        explicit = r"C:\\Users\\Administrator\\Documents\\Munda Market\\buyer-portal\\src\\components\\assets\\logo.png"
        if os.path.exists(explicit):
            return explicit
        rel = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../buyer-portal/src/components/assets/logo.png'))
        if os.path.exists(rel):
            return rel
        return None

    logo_b64 = None
    logo_path = _resolve_logo_path()
    if logo_path:
        try:
            with open(logo_path, 'rb') as f:
                logo_b64 = base64.b64encode(f.read()).decode('ascii')
        except Exception:
            logo_b64 = None

    logo_html = "" if not logo_b64 else f"<img src='data:image/png;base64,{logo_b64}' style='width:88px;height:auto;'/>"

    # Dates
    issued = inv.get('date')
    issued_dt = None
    try:
        issued_dt = datetime.strptime(issued, '%Y-%m-%d') if issued else datetime.utcnow()
    except Exception:
        issued_dt = datetime.utcnow()
    due_dt = issued_dt + timedelta(days=14)
    due = due_dt.strftime('%Y-%m-%d')

    html = f"""
    <html><head><meta charset='utf-8'>{styles}</head>
    <body>
      <div class='header'>
        <div class='brand'>
          {logo_html if logo_b64 else "<div class='logo'></div>"}
          <div style='font-size:12px;color:#666;'>6352 Mazoe Rd, Harare • +26377 444 355 • hello@munda-market.com</div>
        </div>
        <div>
          <div class='badge'>Invoice {inv['invoice_id']}</div>
        </div>
      </div>
      <div class='meta'>Order: {inv['order_number']} • Date: {inv['date']} • Status: {inv['status']}</div>
      <div class='two-col'>
        <div class='col'>
          <div style='font-size:12px;color:#777; margin-bottom:6px;'>RECIPIENT:</div>
          <div style='font-weight:700'>{inv.get('buyer_name','')}</div>
          <div style='font-size:12px;color:#777'>1 Titania Way</div>
          <div style='font-size:12px;color:#777'>Chegutu, Mashonaland West</div>
        </div>
        <div class='summary'>
          <div class='head'>Invoice #{inv['invoice_id']}</div>
          <div class='row'><div>Issued</div><div>{issued_dt.strftime('%Y-%m-%d')}</div></div>
          <div class='row'><div>Due</div><div>{due}</div></div>
          <div class='row total'><div style='color:#fff'>Total</div><div style='color:#fff'>$ {inv['total']:.2f}</div></div>
        </div>
      </div>

      <div style='font-weight:700; margin-top:18px;'>For Services Rendered</div>

      <table>
        <thead>
          <tr><th>Product / Service</th><th class='right'>Qty</th><th class='right'>Unit Price</th><th class='right'>Total</th></tr>
        </thead>
        <tbody>
          {lines_html}
        </tbody>
      </table>
      <div class='foot'>Thanks for your business!</div>
      <table class='totals'>
        <tr><td class='right' style='width:80%'>Subtotal</td><td class='right' style='width:20%'>$ {inv['subtotal']:.2f}</td></tr>
        <tr><td class='right'>Delivery</td><td class='right'>$ {inv['fees']['delivery']:.2f}</td></tr>
        <tr><td class='right'>Service</td><td class='right'>$ {inv['fees']['service']:.2f}</td></tr>
        <tr class='grand'><td class='right'>Total</td><td class='right'>$ {inv['total']:.2f}</td></tr>
      </table>
    </body></html>
    """
    return html


@router.get("/{invoice_id}/html")
async def invoice_html(invoice_id: str):
    inv = await invoice_detail(invoice_id)
    html = render_invoice_html(inv)
    return HTMLResponse(content=html, headers={"Content-Disposition": f"inline; filename=invoice_{invoice_id}.html"})


@router.get("/{invoice_id}/csv")
async def invoice_csv(invoice_id: str):
    inv = await invoice_detail(invoice_id)
    buf = io.StringIO()
    buf.write("Item,Qty(kg),Unit Price,Line Total\n")
    for ln in inv["lines"]:
        buf.write(f"{ln['name']},{ln['qtyKg']},{ln['unit_price']},{ln['line_total']}\n")
    buf.write(f"Subtotal,,,{inv['subtotal']}\n")
    buf.write(f"Delivery,,,{inv['fees']['delivery']}\n")
    buf.write(f"Service,,,{inv['fees']['service']}\n")
    buf.write(f"Total,,,{inv['total']}\n")
    stream = io.BytesIO(buf.getvalue().encode('utf-8'))
    return StreamingResponse(stream, media_type='text/csv', headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}.csv"})


@router.get("/{invoice_id}/pdf")
async def invoice_pdf(invoice_id: str):
    inv = await invoice_detail(invoice_id)
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.lib.units import mm
    except Exception as e:
        # Report that ReportLab is not available
        raise HTTPException(status_code=501, detail="PDF generation requires the 'reportlab' package. Please install it in the backend environment.")

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    # Branding header
    brand_green = colors.HexColor('#2e7d32')
    light_green = colors.HexColor('#e8f5e9')
    accent_green = colors.HexColor('#8bc34a')

    # Logo image (fallback to circle if missing)
    # Resolve logo path: explicit Windows path first, then repo-relative path
    explicit = r"C:\\Users\\Administrator\\Documents\\Munda Market\\buyer-portal\\src\\components\\assets\\logo.png"
    logo_path = explicit if os.path.exists(explicit) else os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../buyer-portal/src/components/assets/logo.png'))
    drew_logo = False
    try:
        if os.path.exists(logo_path):
            # drawImage expects lower-left as origin
            c.drawImage(logo_path, 18*mm, height-42*mm, width=36*mm, height=36*mm, preserveAspectRatio=True, mask='auto')
            drew_logo = True
    except Exception:
        drew_logo = False
    if not drew_logo:
        c.setFillColor(brand_green)
        c.circle(20*mm, (height-20*mm), 9*mm, fill=1, stroke=0)

    # Contact line only (no extra "MUNDA MARKET" title – the logo already includes the brand)
    c.setFillColor(colors.HexColor('#666666'))
    c.setFont('Helvetica', 8)
    c.drawString(60*mm, height-20*mm, '6352 Mazoe Rd, Harare  •  +26377 444 355  •  hello@munda-market.com')

    # Invoice summary card (right)
    x_card = width-75*mm
    y_card = height-30*mm
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor('#e0e0e0'))
    c.roundRect(x_card, y_card, 60*mm, 25*mm, 3*mm, fill=1, stroke=1)
    # Header
    c.setFillColor(accent_green)
    c.roundRect(x_card, y_card+17*mm, 60*mm, 8*mm, 3*mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont('Helvetica-Bold', 11)
    c.drawString(x_card+4*mm, y_card+19*mm, f'Invoice #{inv["invoice_id"]}')
    # Issued / Due / Total rows
    try:
        issued_dt = datetime.strptime(inv.get('date',''), '%Y-%m-%d')
    except Exception:
        issued_dt = datetime.utcnow()
    due_dt = issued_dt + timedelta(days=14)
    c.setFont('Helvetica', 9)
    c.setFillColor(colors.black)
    c.drawString(x_card+4*mm, y_card+13*mm, 'Issued')
    c.drawRightString(x_card+56*mm, y_card+13*mm, issued_dt.strftime('%Y-%m-%d'))
    c.drawString(x_card+4*mm, y_card+9*mm, 'Due')
    c.drawRightString(x_card+56*mm, y_card+9*mm, due_dt.strftime('%Y-%m-%d'))
    c.setFillColor(brand_green)
    c.roundRect(x_card, y_card, 60*mm, 7*mm, 2*mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(x_card+4*mm, y_card+2*mm, 'Total')
    c.drawRightString(x_card+56*mm, y_card+2*mm, f"$ {inv['total']:.2f}")

    # Recipient (left)
    c.setFillColor(colors.HexColor('#777777'))
    c.setFont('Helvetica', 8)
    c.drawString(20*mm, height-34*mm, 'RECIPIENT:')
    c.setFillColor(colors.black)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(20*mm, height-38*mm, inv.get('buyer_name',''))
    c.setFont('Helvetica', 8)
    c.setFillColor(colors.HexColor('#666666'))
    c.drawString(20*mm, height-41*mm, '1 Titania Way')
    c.drawString(20*mm, height-44*mm, 'Chegutu, Mashonaland West')

    # Table header
    top = height-55*mm
    c.setFillColor(light_green)
    c.rect(20*mm, top, width-40*mm, 8*mm, fill=1, stroke=0)
    c.setFillColor(brand_green)
    c.setFont('Helvetica-Bold', 9)
    c.drawString(22*mm, top+2.5*mm, 'Product / Service')
    c.drawRightString(width-90*mm, top+2.5*mm, 'Qty (kg)')
    c.drawRightString(width-55*mm, top+2.5*mm, 'Unit Price')
    c.drawRightString(width-22*mm, top+2.5*mm, 'Total')

    # Lines
    y = top-8*mm
    c.setFont('Helvetica', 9)
    for ln in inv['lines']:
        c.setFillColor(colors.black)
        c.drawString(22*mm, y+2*mm, ln['name'])
        c.drawRightString(width-90*mm, y+2*mm, f"{ln['qtyKg']}")
        c.drawRightString(width-55*mm, y+2*mm, f"$ {ln['unit_price']:.2f}")
        c.drawRightString(width-22*mm, y+2*mm, f"$ {ln['line_total']:.2f}")
        c.setStrokeColor(colors.HexColor('#eeeeee'))
        c.line(20*mm, y, width-20*mm, y)
        y -= 7*mm

    # Totals
    y -= 2*mm
    c.setFont('Helvetica', 10)
    c.setFillColor(colors.black)
    c.drawRightString(width-35*mm, y, 'Subtotal')
    c.drawRightString(width-22*mm, y, f"$ {inv['subtotal']:.2f}")
    y -= 6*mm
    c.drawRightString(width-35*mm, y, 'Delivery')
    c.drawRightString(width-22*mm, y, f"$ {inv['fees']['delivery']:.2f}")
    y -= 6*mm
    c.drawRightString(width-35*mm, y, 'Service')
    c.drawRightString(width-22*mm, y, f"$ {inv['fees']['service']:.2f}")
    y -= 8*mm

    # Grand total bar
    c.setFillColor(brand_green)
    c.roundRect(width-80*mm, y-6*mm, 60*mm, 10*mm, 2*mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont('Helvetica-Bold', 12)
    c.drawRightString(width-30*mm, y-1*mm, f"$ {inv['total']:.2f}")
    c.setFont('Helvetica-Bold', 10)
    c.drawString(width-78*mm, y-1*mm, 'Total')

    # Footer
    c.setFillColor(colors.HexColor('#666666'))
    c.setFont('Helvetica', 8)
    c.drawString(20*mm, 15*mm, 'Thanks for your business!')

    c.showPage()
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type='application/pdf', headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}.pdf"})



