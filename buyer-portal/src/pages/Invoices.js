import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, Card, CardContent, Grid, Button, TextField, Chip, Dialog, DialogTitle, DialogContent, Divider, Stack } from '@mui/material';
import { fetchInvoices, fetchInvoiceDetail, downloadInvoice } from '../services/invoices';

function Invoices() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetchInvoices({ q: query || undefined, status: status || undefined });
      setItems(res.items);
    };
    load();
  }, [query, status]);

  const handleOpen = async (id) => {
    const inv = await fetchInvoiceDetail(id);
    setDetail(inv);
    setOpen(true);
  };

  const handleDownload = async (id) => {
    const blob = await downloadInvoice(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Invoices
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <TextField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="PAID / DUE" />
      </Box>

      <Grid container spacing={3}>
        {items.map((inv) => (
          <Grid key={inv.invoice_id} item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Invoice {inv.invoice_id}</Typography>
                  <Chip size="small" label={inv.status} color={inv.status === 'PAID' ? 'success' : 'warning'} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Date: {inv.date}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Subtotal: ${inv.subtotal.toFixed(2)} • Total: ${inv.total.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => handleOpen(inv.invoice_id)}>View</Button>
                  <Button size="small" variant="contained" onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/invoices/${inv.invoice_id}/pdf`, '_blank')}>PDF</Button>
                  <Button size="small" variant="outlined" onClick={async () => {
                    const blob = await downloadInvoice(inv.invoice_id); // legacy txt for fallback
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `invoice_${inv.invoice_id}.txt`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}>TXT</Button>
                  <Button size="small" variant="outlined" onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/invoices/${inv.invoice_id}/csv`, '_blank')}>Excel (CSV)</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        {detail && (
          <>
            <DialogTitle>Invoice {detail.invoice_id}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">Order: {detail.order_number} • Date: {detail.date}</Typography>
              <Divider sx={{ my: 2 }} />
              {detail.lines.map((ln, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography>{ln.name} • {ln.qtyKg} kg x ${ln.unit_price}</Typography>
                  <Typography>${ln.line_total.toFixed(2)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography>Subtotal: ${detail.subtotal.toFixed(2)}</Typography>
              <Typography>Delivery: ${detail.fees.delivery.toFixed(2)}</Typography>
              <Typography>Service: ${detail.fees.service.toFixed(2)}</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>Total: ${detail.total.toFixed(2)}</Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={() => handleDownload(detail.invoice_id)}>Download</Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Invoices;


