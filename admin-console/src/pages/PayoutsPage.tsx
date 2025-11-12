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
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi } from '@/api/payouts';
import { Payout } from '@/types';

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [transactionRef, setTransactionRef] = useState('');

  const { data: pendingPayouts, isLoading: pendingLoading } = useQuery({
    queryKey: ['payouts-pending'],
    queryFn: payoutsApi.getPending,
  });

  const { data: allPayouts, isLoading: allLoading } = useQuery({
    queryKey: ['payouts-all'],
    queryFn: payoutsApi.getAll,
  });

  const processMutation = useMutation({
    mutationFn: payoutsApi.process,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['payouts-all'] });
      setDialogOpen(false);
      setSelectedPayout(null);
      setTransactionRef('');
    },
  });

  const handleProcessPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setDialogOpen(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedPayout) return;
    processMutation.mutate({
      payout_id: selectedPayout.payout_id,
      transaction_reference: transactionRef || undefined,
    });
  };

  const payouts = tabValue === 0 ? pendingPayouts : allPayouts;
  const isLoading = tabValue === 0 ? pendingLoading : allLoading;

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
        Payouts
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Process farmer payouts and view payment history
      </Typography>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label={`Pending (${pendingPayouts?.length || 0})`} />
        <Tab label="All Payouts" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payout ID</TableCell>
              <TableCell>Farmer</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payouts && payouts.length > 0 ? (
              payouts.map((payout) => (
                <TableRow key={payout.payout_id}>
                  <TableCell>#{payout.payout_id}</TableCell>
                  <TableCell>{payout.farmer_name || `Farmer #${payout.farmer_user_id}`}</TableCell>
                  <TableCell align="right">${payout.amount_usd.toFixed(2)}</TableCell>
                  <TableCell>{payout.currency}</TableCell>
                  <TableCell>{payout.payment_method}</TableCell>
                  <TableCell>
                    <Chip
                      label={payout.status}
                      size="small"
                      color={payout.status === 'PENDING' ? 'warning' : 'success'}
                    />
                  </TableCell>
                  <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {payout.status === 'PENDING' && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleProcessPayout(payout)}
                      >
                        Process
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No payouts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payout</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Farmer:</strong> {selectedPayout.farmer_name || `#${selectedPayout.farmer_user_id}`}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> ${selectedPayout.amount_usd.toFixed(2)} {selectedPayout.currency}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Method:</strong> {selectedPayout.payment_method}
              </Typography>

              <TextField
                fullWidth
                label="Transaction Reference (optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                margin="normal"
                placeholder="Enter payment reference number"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmProcess}
            variant="contained"
            color="success"
            disabled={processMutation.isPending}
          >
            {processMutation.isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
