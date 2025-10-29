import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, FavoriteBorder, LocalShipping } from '@mui/icons-material';
import { fetchListings } from '../services/catalog';
import { useCart } from '../services/cart';
import { Dialog, DialogContent, DialogTitle, ImageList, ImageListItem } from '@mui/material';

const mockListings = [
  { id: 'L-001', name: 'Fresh Tomatoes', grade: 'A', price: 1.2, availableKg: 500, harvest: '2024-11-02', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=800&auto=format&fit=crop' },
  { id: 'L-002', name: 'Red Onions', grade: 'B', price: 0.8, availableKg: 200, harvest: '2024-11-05', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop' },
  { id: 'L-003', name: 'Green Cabbage', grade: 'A', price: 0.6, availableKg: 300, harvest: '2024-11-01', image: 'https://images.unsplash.com/photo-1607301405390-7e0070bd2f9f?q=80&w=800&auto=format&fit=crop' },
  { id: 'L-004', name: 'Butternut Squash', grade: 'A', price: 0.9, availableKg: 450, harvest: '2024-11-06', image: 'https://images.unsplash.com/photo-1582642221644-9a5c0a51a140?q=80&w=800&auto=format&fit=crop' },
  { id: 'L-005', name: 'Green Peppers', grade: 'A', price: 1.4, availableKg: 180, harvest: '2024-11-04', image: 'https://images.unsplash.com/photo-1542835435-4fa357baa00b?q=80&w=800&auto=format&fit=crop' },
  { id: 'L-006', name: 'Carrots', grade: 'B', price: 0.7, availableKg: 260, harvest: '2024-11-03', image: 'https://images.unsplash.com/photo-1560786466-6c9fc0e9bb49?q=80&w=800&auto=format&fit=crop' },
];

function CropDiscovery() {
  const { addItem } = useCart();
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('ALL');
  const [sort, setSort] = useState('price_asc');
  const [maxPrice, setMaxPrice] = useState(2.0);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState(mockListings);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetchListings({
        q: query || undefined,
        grade,
        max_price: maxPrice,
        sort,
        page,
        page_size: pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    };
    load();
  }, [query, grade, sort, maxPrice, page, pageSize]);

  const filtered = useMemo(() => {
    let list = items;
    if (inStockOnly) list = list.filter((x) => x.availableKg > 0);
    return list;
  }, [items, inStockOnly]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Browse Crops
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4} lg={3}>
          <TextField
            fullWidth
            placeholder="Search crops..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={3} lg={2}>
          <FormControl fullWidth>
            <InputLabel>Grade</InputLabel>
            <Select value={grade} label="Grade" onChange={(e) => setGrade(e.target.value)}>
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3} lg={2}>
          <FormControl fullWidth>
            <InputLabel>Sort by</InputLabel>
            <Select value={sort} label="Sort by" onChange={(e) => setSort(e.target.value)}>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="availableKg_desc">Availability</MenuItem>
              <MenuItem value="harvest_asc">Harvest Soonest</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2} lg={3}>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" color="text.secondary">Max price ($/kg)</Typography>
            <Slider
              min={0.2}
              max={2.5}
              step={0.1}
              value={maxPrice}
              onChange={(_, v) => setMaxPrice(v)}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={2} lg={2}>
          <FormControlLabel
            control={<Checkbox checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />}
            label="In stock only"
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {filtered.map((item) => (
          <Grid key={item.id} item xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative' }}>
                <CardMedia component="img" height="160" image={item.image} alt={item.name} />
                <Chip
                  size="small"
                  label={`Grade ${item.grade}`}
                  color={item.grade === 'A' ? 'success' : item.grade === 'B' ? 'warning' : 'default'}
                  sx={{ position: 'absolute', top: 8, left: 8 }}
                />
                <Tooltip title="Add to favourites">
                  <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)' }}>
                    <FavoriteBorder fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{item.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">${item.price}</Typography>
                  <Typography variant="body2" color="text.secondary">/kg</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip size="small" icon={<LocalShipping />} label={`${item.availableKg} kg available`} />
                </Stack>
                <Typography variant="caption" color="text.secondary">Harvest: {new Date(item.harvest).toLocaleDateString()}</Typography>
              </CardContent>
              <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={() => { setDetailItem(item); setDetailOpen(true); }}>View Details</Button>
                <Button fullWidth variant="contained" onClick={() => addItem(item, 1)}>Add to Order</Button>
              </Box>
            </Card>
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1">No crops match your filters.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Simple pagination controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
        <Button variant="outlined" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <Button variant="outlined" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </Box>

      {/* Details modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {detailItem && (
          <>
            <DialogTitle>{detailItem.name}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <ImageList cols={1} rowHeight={320}>
                    {(detailItem.images || [detailItem.image]).map((src, idx) => (
                      <ImageListItem key={idx}>
                        <img src={src} alt={`${detailItem.name} ${idx + 1}`} loading="lazy" />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Stack spacing={1}>
                    <Typography variant="h6">${detailItem.price}/kg</Typography>
                    <Typography variant="body2" color="text.secondary">Grade {detailItem.grade}</Typography>
                    <Typography variant="body2">Available: {detailItem.availableKg} kg</Typography>
                    <Typography variant="body2">Harvest: {new Date(detailItem.harvest).toLocaleDateString()}</Typography>
                    {detailItem.location && (
                      <Typography variant="body2">Location: {detailItem.location.district}, {detailItem.location.province}</Typography>
                    )}
                    {detailItem.quality && (
                      <Typography variant="body2">Quality: {detailItem.quality.size || ''} {detailItem.quality.brix ? `• Brix ${detailItem.quality.brix}` : ''}</Typography>
                    )}
                    <Divider />
                    <Typography variant="subtitle2">Supply history</Typography>
                    <Box>
                      {(detailItem.supply_history || []).map((h, i) => (
                        <Typography key={i} variant="caption" display="block">{h.date}: {h.deliveredKg} kg delivered</Typography>
                      ))}
                      {!(detailItem.supply_history || []).length && (
                        <Typography variant="caption" color="text.secondary">No history available</Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                      <Button fullWidth variant="contained" onClick={() => { addItem(detailItem, 1); }}>Add to Order</Button>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default CropDiscovery;
