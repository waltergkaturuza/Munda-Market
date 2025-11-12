import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Menu,
  IconButton,
} from '@mui/material';
import { CheckCircle, Undo, Visibility, MoreVert, Download } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, Payment } from '@/api/payments';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'error',
  REFUNDED: 'default',
};

const methodColors: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  STRIPE: 'primary',
  ECOCASH: 'success',
  ZIPIT: 'info',
  BANK_TRANSFER: 'secondary',
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.getAll,
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ id, ref }: { id: number; ref: string }) =>
      paymentsApi.reconcile(id, ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setReconcileDialogOpen(false);
      setTransactionRef('');
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      paymentsApi.refund(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setRefundDialogOpen(false);
      setRefundReason('');
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, paymentId: number) => {
    setAnchorEl({ ...anchorEl, [paymentId]: event.currentTarget });
  };

  const handleMenuClose = (paymentId: number) => {
    setAnchorEl({ ...anchorEl, [paymentId]: null });
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailsDialogOpen(true);
  };

  const handleReconcile = (payment: Payment) => {
    setSelectedPayment(payment);
    setReconcileDialogOpen(true);
  };

  const handleRefund = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundDialogOpen(true);
  };

  const handleConfirmReconcile = () => {
    if (!selectedPayment) return;
    reconcileMutation.mutate({ id: selectedPayment.payment_id, ref: transactionRef });
  };

  const handleConfirmRefund = () => {
    if (!selectedPayment) return;
    refundMutation.mutate({ id: selectedPayment.payment_id, reason: refundReason });
  };

  const completedPayments = payments?.filter((p) => p.status === 'COMPLETED') || [];
  const pendingPayments = payments?.filter((p) => p.status === 'PENDING') || [];
  const failedPayments = payments?.filter((p) => p.status === 'FAILED') || [];

  const displayPayments =
    tabValue === 0 ? completedPayments : tabValue === 1 ? pendingPayments : failedPayments;

  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount_usd, 0);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Payments Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Monitor buyer payments, reconcile transactions, and process refunds
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Payments
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {payments?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Revenue
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                ${totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Pending
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {pendingPayments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Failed
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {failedPayments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label={`Completed (${completedPayments.length})`} />
        <Tab label={`Pending (${pendingPayments.length})`} />
        <Tab label={`Failed (${failedPayments.length})`} />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment ID</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Buyer</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Transaction Ref</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayPayments.length > 0 ? (
              displayPayments.map((payment) => (
                <TableRow key={payment.payment_id}>
                  <TableCell>#{payment.payment_id}</TableCell>
                  <TableCell>#{payment.order_id}</TableCell>
                  <TableCell>{payment.buyer_name || `Buyer #${payment.buyer_user_id}`}</TableCell>
                  <TableCell align="right" fontWeight="bold">
                    ${payment.amount_usd.toFixed(2)}
                  </TableCell>
                  <TableCell>{payment.currency}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.payment_method}
                      size="small"
                      color={methodColors[payment.payment_method] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{payment.transaction_reference || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      size="small"
                      color={statusColors[payment.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(payment)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, payment.payment_id)}
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl[payment.payment_id]}
                      open={Boolean(anchorEl[payment.payment_id])}
                      onClose={() => handleMenuClose(payment.payment_id)}
                    >
                      {payment.status === 'PENDING' && (
                        <MenuItem
                          onClick={() => {
                            handleReconcile(payment);
                            handleMenuClose(payment.payment_id);
                          }}
                        >
                          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                          Reconcile
                        </MenuItem>
                      )}
                      {payment.status === 'COMPLETED' && (
                        <MenuItem
                          onClick={() => {
                            handleRefund(payment);
                            handleMenuClose(payment.payment_id);
                          }}
                        >
                          <Undo fontSize="small" sx={{ mr: 1 }} />
                          Issue Refund
                        </MenuItem>
                      )}
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{selectedPayment.payment_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{selectedPayment.order_id}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Buyer
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedPayment.buyer_name || `Buyer #${selectedPayment.buyer_user_id}`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${selectedPayment.amount_usd.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Currency
                  </Typography>
                  <Typography variant="body1">{selectedPayment.currency}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Chip
                    label={selectedPayment.payment_method}
                    color={methodColors[selectedPayment.payment_method] || 'default'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction Reference
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.transaction_reference || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedPayment.status}
                    color={statusColors[selectedPayment.status] || 'default'}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={reconcileDialogOpen} onClose={() => setReconcileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reconcile Payment</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Payment ID:</strong> #{selectedPayment.payment_id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> ${selectedPayment.amount_usd.toFixed(2)} {selectedPayment.currency}
              </Typography>
              <Typography variant="body2" gutterBottom mb={2}>
                <strong>Method:</strong> {selectedPayment.payment_method}
              </Typography>

              <TextField
                fullWidth
                label="Transaction Reference"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter bank/gateway transaction reference"
                required
                helperText="This confirms the payment was received"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReconcileDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmReconcile}
            variant="contained"
            color="success"
            disabled={!transactionRef || reconcileMutation.isPending}
          >
            {reconcileMutation.isPending ? 'Processing...' : 'Confirm Reconciliation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Refund</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Payment ID:</strong> #{selectedPayment.payment_id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount to Refund:</strong> ${selectedPayment.amount_usd.toFixed(2)}{' '}
                {selectedPayment.currency}
              </Typography>
              <Typography variant="body2" gutterBottom mb={2}>
                <strong>Buyer:</strong> {selectedPayment.buyer_name || `Buyer #${selectedPayment.buyer_user_id}`}
              </Typography>

              <TextField
                fullWidth
                label="Refund Reason"
                multiline
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund (e.g., order cancelled, quality issue)..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmRefund}
            variant="contained"
            color="error"
            disabled={!refundReason || refundMutation.isPending}
          >
            {refundMutation.isPending ? 'Processing...' : 'Issue Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
