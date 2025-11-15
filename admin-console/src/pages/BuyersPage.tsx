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
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { MoreVert, Visibility, Block, CheckCircle, Phone, Email, Business, Add } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyersApi, Buyer, CreateBuyerProfileRequest } from '@/api/buyers';

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
  const [createBuyerDialogOpen, setCreateBuyerDialogOpen] = useState(false);
  const [createBuyerForm, setCreateBuyerForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    company_name: '',
    business_type: '',
    auto_activate: true,
  });
  const [createProfileDialogOpen, setCreateProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<CreateBuyerProfileRequest>({
    company_name: '',
    business_type: '',
    business_phone: '',
    business_email: '',
  });

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

  const createProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateBuyerProfileRequest }) =>
      buyersApi.createProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-details', selectedBuyer?.user_id] });
      setCreateProfileDialogOpen(false);
      setProfileData({ company_name: '', business_type: '', business_phone: '', business_email: '' });
    },
  });

  const createBuyerMutation = useMutation({
    mutationFn: buyersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      setCreateBuyerDialogOpen(false);
      setCreateBuyerForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        company_name: '',
        business_type: '',
        auto_activate: true,
      });
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

  const handleOpenAction = (buyer: Buyer, action: 'suspend' | 'activate' | 'create-profile') => {
    setSelectedBuyer(buyer);
    setActionType(action);
    if (action === 'create-profile') {
      setProfileData({
        company_name: buyer.name,
        business_phone: buyer.phone,
        business_email: buyer.email || '',
        business_type: '',
      });
      setCreateProfileDialogOpen(true);
    } else {
      setActionDialogOpen(true);
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Buyers Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage buyer accounts, purchase history, and spending
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateBuyerDialogOpen(true)}
        >
          Create Buyer
        </Button>
      </Box>

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
                      {!buyer.company_name && (
                        <MenuItem
                          onClick={() => {
                            handleOpenAction(buyer, 'create-profile');
                            handleMenuClose(buyer.user_id);
                          }}
                        >
                          <Add fontSize="small" sx={{ mr: 1 }} />
                          Create Profile
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

      {/* Create Profile Dialog */}
      <Dialog
        open={createProfileDialogOpen}
        onClose={() => setCreateProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Buyer Profile</DialogTitle>
        <DialogContent>
          {selectedBuyer && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Creating profile for: <strong>{selectedBuyer.name}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Company Name"
                value={profileData.company_name}
                onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Business Type"
                value={profileData.business_type}
                onChange={(e) => setProfileData({ ...profileData, business_type: e.target.value })}
                margin="normal"
                placeholder="e.g., Restaurant, Retailer, Wholesaler"
              />
              <TextField
                fullWidth
                label="Business Phone"
                value={profileData.business_phone}
                onChange={(e) => setProfileData({ ...profileData, business_phone: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Business Email"
                type="email"
                value={profileData.business_email}
                onChange={(e) => setProfileData({ ...profileData, business_email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Tax Number (Optional)"
                value={profileData.tax_number || ''}
                onChange={(e) => setProfileData({ ...profileData, tax_number: e.target.value })}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProfileDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedBuyer) {
                createProfileMutation.mutate({ id: selectedBuyer.user_id, data: profileData });
              }
            }}
            variant="contained"
            disabled={!profileData.company_name || createProfileMutation.isPending}
          >
            {createProfileMutation.isPending ? 'Creating...' : 'Create Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Buyer Dialog */}
      <Dialog
        open={createBuyerDialogOpen}
        onClose={() => setCreateBuyerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Buyer</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              fullWidth
              label="Full Name"
              value={createBuyerForm.name}
              onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={createBuyerForm.phone}
              onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, phone: e.target.value })}
              required
              placeholder="+263771234567"
              helperText="Must start with +263 or 0"
            />
            <TextField
              fullWidth
              label="Email (Optional)"
              type="email"
              value={createBuyerForm.email}
              onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={createBuyerForm.password}
              onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, password: e.target.value })}
              required
              helperText="Minimum 6 characters"
            />
            <TextField
              fullWidth
              label="Company Name (Optional)"
              value={createBuyerForm.company_name}
              onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, company_name: e.target.value })}
              helperText="If provided, buyer profile will be created automatically"
            />
            <TextField
              fullWidth
              label="Business Type (Optional)"
              value={createBuyerForm.business_type}
              onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_type: e.target.value })}
              placeholder="e.g., Restaurant, Retailer, Wholesaler"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={createBuyerForm.auto_activate}
                  onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, auto_activate: e.target.checked })}
                />
              }
              label="Auto-activate account (user can login immediately)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBuyerDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              createBuyerMutation.mutate({
                name: createBuyerForm.name,
                phone: createBuyerForm.phone,
                email: createBuyerForm.email || undefined,
                password: createBuyerForm.password,
                company_name: createBuyerForm.company_name || undefined,
                business_type: createBuyerForm.business_type || undefined,
                auto_activate: createBuyerForm.auto_activate,
              });
            }}
            variant="contained"
            disabled={
              !createBuyerForm.name ||
              !createBuyerForm.phone ||
              !createBuyerForm.password ||
              createBuyerMutation.isPending
            }
          >
            {createBuyerMutation.isPending ? 'Creating...' : 'Create Buyer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
