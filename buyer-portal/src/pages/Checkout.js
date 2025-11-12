import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import { ShoppingCart, Payment, LocalShipping, CheckCircle } from '@mui/icons-material';
import { useCart } from '../services/cart';
import { api } from '../services/auth';

const DISTRICTS = [
  'Harare',
  'Bulawayo',
  'Chitungwiza',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Kadoma',
  'Masvingo',
  'Chinhoyi',
  'Norton',
  'Marondera',
  'Ruwa',
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(1); // 1: Delivery, 2: Payment, 3: Confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPreview, setOrderPreview] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);

  const [deliveryInfo, setDeliveryInfo] = useState({
    district: '',
    address: '',
    contactName: '',
    contactPhone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('ECOCASH');

  const handlePreviewOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qtyKg: item.quantity,
        })),
        delivery_district: deliveryInfo.district,
        delivery_address: deliveryInfo.address,
        contact_name: deliveryInfo.contactName,
        contact_phone: deliveryInfo.contactPhone,
      };

      const response = await api.post('/orders/preview', orderData);
      setOrderPreview(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to preview order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qtyKg: item.quantity,
        })),
        delivery_district: deliveryInfo.district,
        delivery_address: deliveryInfo.address,
        contact_name: deliveryInfo.contactName,
        contact_phone: deliveryInfo.contactPhone,
      };

      const response = await api.post('/orders/', orderData);
      setOrderNumber(response.data.order_number);
      setStep(3);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step < 3) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Button variant="contained" onClick={() => navigate('/crops')}>
          Browse Crops
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Checkout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Steps */}
        <Grid item xs={12} md={8}>
          {/* Step 1: Delivery Information */}
          {step === 1 && (
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <LocalShipping color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Delivery Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>District</InputLabel>
                    <Select
                      value={deliveryInfo.district}
                      label="District"
                      onChange={(e) =>
                        setDeliveryInfo({ ...deliveryInfo, district: e.target.value })
                      }
                    >
                      {DISTRICTS.map((district) => (
                        <MenuItem key={district} value={district}>
                          {district}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={deliveryInfo.contactPhone}
                    onChange={(e) =>
                      setDeliveryInfo({ ...deliveryInfo, contactPhone: e.target.value })
                    }
                    required
                    placeholder="+263..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Delivery Address"
                    value={deliveryInfo.address}
                    onChange={(e) =>
                      setDeliveryInfo({ ...deliveryInfo, address: e.target.value })
                    }
                    required
                    multiline
                    rows={2}
                    placeholder="Street address, building, etc."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={deliveryInfo.contactName}
                    onChange={(e) =>
                      setDeliveryInfo({ ...deliveryInfo, contactName: e.target.value })
                    }
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePreviewOrder}
                  disabled={
                    loading ||
                    !deliveryInfo.district ||
                    !deliveryInfo.address ||
                    !deliveryInfo.contactName ||
                    !deliveryInfo.contactPhone
                  }
                >
                  {loading ? <CircularProgress size={24} /> : 'Continue to Payment'}
                </Button>
              </Box>
            </Paper>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && orderPreview && (
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Payment color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Payment Method
                </Typography>
              </Box>

              <FormControl component="fieldset">
                <FormLabel component="legend">Select payment method</FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="ECOCASH"
                    control={<Radio />}
                    label="EcoCash Mobile Money"
                  />
                  <FormControlLabel
                    value="ZIPIT"
                    control={<Radio />}
                    label="ZIPIT Bank Transfer"
                  />
                  <FormControlLabel
                    value="BANK_TRANSFER"
                    control={<Radio />}
                    label="Direct Bank Transfer"
                  />
                  <FormControlLabel
                    value="CARD"
                    control={<Radio />}
                    label="Credit/Debit Card"
                  />
                </RadioGroup>
              </FormControl>

              <Alert severity="info" sx={{ mt: 2 }}>
                You will be redirected to complete payment after placing the order.
              </Alert>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="contained" size="large" onClick={handleSubmitOrder} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Place Order'}
                </Button>
              </Box>
            </Paper>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && orderNumber && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Order Placed Successfully!
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                Order #{orderNumber}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We've received your order and will process it shortly. You'll receive updates via SMS.
              </Typography>

              <Box display="flex" gap={2} justifyContent="center">
                <Button variant="outlined" onClick={() => navigate('/orders')}>
                  View My Orders
                </Button>
                <Button variant="contained" onClick={() => navigate('/crops')}>
                  Continue Shopping
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Order Summary
            </Typography>
            <Divider sx={{ my: 2 }} />

            <List dense>
              {items.map((item) => (
                <ListItem key={item.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={item.name}
                    secondary={`${item.quantity} kg × $${item.price}/kg`}
                  />
                  <Typography fontWeight="bold">
                    ${(item.quantity * item.price).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            {orderPreview ? (
              <>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">${orderPreview.subtotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Delivery Fee</Typography>
                  <Typography variant="body2">${orderPreview.delivery_fee.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Service Fee</Typography>
                  <Typography variant="body2">${orderPreview.service_fee.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${orderPreview.total.toFixed(2)}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">
                  Subtotal
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ${total.toFixed(2)}
                </Typography>
              </Box>
            )}

            {deliveryInfo.district && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Delivering to <strong>{deliveryInfo.district}</strong>
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

