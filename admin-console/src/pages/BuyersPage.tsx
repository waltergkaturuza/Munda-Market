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
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { MoreVert, Visibility, Block, CheckCircle, Phone, Email, Business } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyersApi, Buyer } from '@/api/buyers';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'error',
  DEACTIVATED: 'default',
};

export default function BuyersPage() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate'>('suspend');
  const [actionReason, setActionReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});

  const { data: buyers, isLoading } = useQuery({
    queryKey: ['buyers'],
    queryFn: buyersApi.getAll,
  });

  const { data: buyerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['buyer-details', selectedBuyer?.user_id],
    queryFn: () => buyersApi.getById(selectedBuyer!.user_id),
    enabled: !!selectedBuyer && detailsDialogOpen,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => buyersApi.suspend(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      setActionDialogOpen(false);
      setActionReason('');
    },
  });

  const activateMutation = useMutation({
    mutationFn: buyersApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      setActionDialogOpen(false);
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, buyerId: number) => {
    setAnchorEl({ ...anchorEl, [buyerId]: event.currentTarget });
  };

  const handleMenuClose = (buyerId: number) => {
    setAnchorEl({ ...anchorEl, [buyerId]: null });
  };

  const handleViewDetails = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setDetailsDialogOpen(true);
  };

  const handleOpenAction = (buyer: Buyer, action: 'suspend' | 'activate') => {
    setSelectedBuyer(buyer);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedBuyer) return;

    if (actionType === 'suspend') {
      suspendMutation.mutate({ id: selectedBuyer.user_id, reason: actionReason });
    } else {
      activateMutation.mutate(selectedBuyer.user_id);
    }
  };

  const activeBuyers = buyers?.filter((b) => b.status === 'ACTIVE') || [];
  const pendingBuyers = buyers?.filter((b) => b.status === 'PENDING') || [];
  const suspendedBuyers = buyers?.filter((b) => b.status === 'SUSPENDED') || [];

  const displayBuyers =
    tabValue === 0 ? activeBuyers : tabValue === 1 ? pendingBuyers : suspendedBuyers;

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
        Buyers Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage buyer accounts, purchase history, and spending
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Buyers
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {buyers?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Active Buyers
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {activeBuyers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Pending Verification
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {pendingBuyers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label={`Active (${activeBuyers.length})`} />
        <Tab label={`Pending (${pendingBuyers.length})`} />
        <Tab label={`Suspended (${suspendedBuyers.length})`} />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Buyer ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Total Spent (USD)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayBuyers.length > 0 ? (
              displayBuyers.map((buyer) => (
                <TableRow key={buyer.user_id}>
                  <TableCell>#{buyer.user_id}</TableCell>
                  <TableCell>{buyer.name}</TableCell>
                  <TableCell>
                    {buyer.company_name ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Business fontSize="small" />
                        {buyer.company_name}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone fontSize="small" />
                      {buyer.phone}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {buyer.email ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email fontSize="small" />
                        {buyer.email}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{buyer.total_orders || 0}</TableCell>
                  <TableCell>${buyer.total_spent_usd?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Chip label={buyer.status} size="small" color={statusColors[buyer.status]} />
                  </TableCell>
                  <TableCell>
                    {buyer.is_verified ? (
                      <Chip label="Verified" size="small" color="success" />
                    ) : (
                      <Chip label="Unverified" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>{new Date(buyer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(buyer)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, buyer.user_id)}>
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl[buyer.user_id]}
                      open={Boolean(anchorEl[buyer.user_id])}
                      onClose={() => handleMenuClose(buyer.user_id)}
                    >
                      {buyer.status !== 'SUSPENDED' && (
                        <MenuItem
                          onClick={() => {
                            handleOpenAction(buyer, 'suspend');
                            handleMenuClose(buyer.user_id);
                          }}
                        >
                          <Block fontSize="small" sx={{ mr: 1 }} />
                          Suspend
                        </MenuItem>
                      )}
                      {buyer.status === 'SUSPENDED' && (
                        <MenuItem
                          onClick={() => {
                            handleOpenAction(buyer, 'activate');
                            handleMenuClose(buyer.user_id);
                          }}
                        >
                          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                          Activate
                        </MenuItem>
                      )}
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No buyers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Buyer Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Buyer Details</DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : buyerDetails ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {buyerDetails.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {buyerDetails.company_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {buyerDetails.phone}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {buyerDetails.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip label={buyerDetails.status} color={statusColors[buyerDetails.status]} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Purchase Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Typography variant="h6">{buyerDetails.total_orders || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                  <Typography variant="h6">
                    ${buyerDetails.total_spent_usd?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog (Suspend/Activate) */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'suspend' ? 'Suspend Buyer' : 'Activate Buyer'}
        </DialogTitle>
        <DialogContent>
          {selectedBuyer && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Buyer:</strong> {selectedBuyer.name}
              </Typography>
              <Typography variant="body2" gutterBottom mb={2}>
                <strong>Phone:</strong> {selectedBuyer.phone}
              </Typography>

              {actionType === 'suspend' && (
                <TextField
                  fullWidth
                  label="Reason for Suspension"
                  multiline
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  required
                  placeholder="Enter reason for suspending this buyer..."
                />
              )}

              {actionType === 'activate' && (
                <Typography variant="body2">
                  This will reactivate the buyer account and allow them to resume purchasing.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={actionType === 'suspend' ? 'error' : 'success'}
            disabled={
              (actionType === 'suspend' && !actionReason) ||
              suspendMutation.isPending ||
              activateMutation.isPending
            }
          >
            {suspendMutation.isPending || activateMutation.isPending
              ? 'Processing...'
              : actionType === 'suspend'
                ? 'Suspend'
                : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
