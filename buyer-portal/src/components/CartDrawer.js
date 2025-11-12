import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material';
import { useCart } from '../services/cart';

function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, totals, clear } = useCart();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: 360 } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Your Basket</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>
      <Divider />
      <List sx={{ p: 2, flexGrow: 1 }}>
        {items.map((item) => (
          <ListItem key={item.id} alignItems="flex-start" sx={{ alignItems: 'center', gap: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <ListItemText
                primary={item.name}
                secondary={`$${item.price}/kg`}
              />
              <TextField
                size="small"
                type="number"
                label="Qty (kg)"
                value={item.qtyKg}
                onChange={(e) => updateQty(item.id, Math.max(1, Number(e.target.value)))}
                sx={{ width: 120, mt: 1 }}
              />
            </Box>
            <IconButton onClick={() => removeItem(item.id)}><Delete /></IconButton>
          </ListItem>
        ))}
        {!items.length && (
          <Typography variant="body2" color="text.secondary">Your basket is empty.</Typography>
        )}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Subtotal: ${totals.subtotal.toFixed(2)}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={clear} disabled={!items.length}>Clear</Button>
          <Button variant="contained" fullWidth disabled={!items.length} onClick={handleCheckout}>
            Checkout
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

export default CartDrawer;


