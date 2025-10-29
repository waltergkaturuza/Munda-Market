import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import { Receipt, CheckCircle, Pending, LocalShipping, Visibility, CheckCircleOutline } from '@mui/icons-material';
import { api } from '../services/auth';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // TODO: Implement order status update endpoint
      // await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setUpdateStatus('');
      loadOrders();
      setSuccess('Order status updated successfully');
    } catch (error) {
      console.error('Failed to update order status:', error);
      setError('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      IN_TRANSIT: 'primary',
      DELIVERED: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle />;
      case 'IN_TRANSIT':
        return <LocalShipping />;
      default:
        return <Pending />;
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'IN_TRANSIT',
      IN_TRANSIT: 'DELIVERED',
    };
    return statusFlow[currentStatus] || null;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Orders
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Orders
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => { setSuccess(''); setTimeout(() => setSuccess(''), 3000); }}>
          {success}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders from buyers will appear here once your lots are purchased
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">{orders.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4">
                    {orders.filter(o => o.status === 'PENDING').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    In Transit
                  </Typography>
                  <Typography variant="h4">
                    {orders.filter(o => o.status === 'IN_TRANSIT').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Delivered
                  </Typography>
                  <Typography variant="h4">
                    {orders.filter(o => o.status === 'DELIVERED').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <TableRow key={order.order_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          #{order.order_number || order.order_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {order.buyer_name || order.contact_name || 'Unknown Buyer'}
                        {order.contact_phone && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {order.contact_phone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {order.total_quantity_kg?.toLocaleString() || 0} kg
                      </TableCell>
                      <TableCell align="right">
                        ${order.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(order.status)}
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedOrder(order);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {nextStatus && (
                            <Tooltip title={`Mark as ${nextStatus}`}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleStatusUpdate(order.order_id, nextStatus)}
                              >
                                <CheckCircleOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Order Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order #{selectedOrder?.order_number || selectedOrder?.order_id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Buyer Information
                </Typography>
                <Typography variant="body1">{selectedOrder.buyer_name || selectedOrder.contact_name || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedOrder.contact_phone || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Delivery Address
                </Typography>
                <Typography variant="body1">{selectedOrder.delivery_address || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedOrder.delivery_district || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Order Items
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name || item.id}</TableCell>
                        <TableCell align="right">{item.qtyKg || 0} kg</TableCell>
                        <TableCell align="right">${item.price || 0}</TableCell>
                        <TableCell align="right">
                          ${((item.qtyKg || 0) * (item.price || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="h6">
                  ${selectedOrder.subtotal?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" color="primary">
                  ${selectedOrder.total_amount?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedOrder && getNextStatus(selectedOrder.status) && (
            <Button
              variant="contained"
              onClick={() => {
                handleStatusUpdate(selectedOrder.order_id, getNextStatus(selectedOrder.status));
                setViewDialogOpen(false);
              }}
            >
              Mark as {getNextStatus(selectedOrder.status)}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Orders;
