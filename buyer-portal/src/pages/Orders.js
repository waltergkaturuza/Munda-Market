import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, Grid, Card, CardContent, TextField, IconButton, Button, Divider } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useCart } from '../services/cart';
import { previewOrder, submitOrder } from '../services/orders';

function Orders() {
  const { items, updateQty, removeItem, totals, clear } = useCart();
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Harare');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-preview when inputs change (debounced)
  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const data = await previewOrder(getPayload());
        if (!cancelled) { setQuote(data); setError(''); }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || 'Failed to get quote');
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [items, district, address]);

  const getPayload = () => ({
    items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qtyKg: i.qtyKg })),
    delivery_district: district,
    delivery_address: address,
    contact_name: contactName,
    contact_phone: contactPhone,
  });

  const handlePreview = async () => {
    try {
      const data = await previewOrder(getPayload());
      setQuote(data);
      setError('');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to get quote');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = await submitOrder(getPayload());
      setQuote(data.totals);
      clear();
      alert(`Order submitted: ${data.order_number}`);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={item.id} item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>{item.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ${item.price}/kg
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Qty (kg)"
                    value={item.qtyKg}
                    onChange={(e) => updateQty(item.id, Math.max(1, Number(e.target.value)))}
                    sx={{ width: 120 }}
                  />
                  <IconButton onClick={() => removeItem(item.id)}>
                    <Delete />
                  </IconButton>
                  <Box sx={{ ml: 'auto' }}>
                    <Typography variant="body2">Line: ${(item.qtyKg * item.price).toFixed(2)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {items.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary">Your cart is empty. Go to Browse Crops to add items.</Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Delivery Details</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
                <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} sx={{ minWidth: 300 }} />
                <TextField label="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                <TextField label="Contact Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
              <Typography>Subtotal: ${totals.subtotal.toFixed(2)}</Typography>
              <Typography>Delivery: ${quote?.delivery_fee?.toFixed?.(2) || '—'}</Typography>
              <Typography>Service: ${quote?.service_fee?.toFixed?.(2) || '—'}</Typography>
              <Typography>Total kg: {quote?.total_kg?.toFixed?.(2) || '—'}</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>Total: ${quote?.total?.toFixed?.(2) || '—'}</Typography>
              {error && (<Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>)}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" onClick={handlePreview} disabled={!items.length}>Get Quote</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!items.length || submitting || !quote}>Submit Order</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Orders;
