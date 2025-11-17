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
  Checkbox,
  ListItemText,
  Autocomplete,
} from '@mui/material';
import { MoreVert, Visibility, Block, CheckCircle, Phone, Email, Business, Add, ArrowBack, ArrowForward } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyersApi, Buyer, CreateBuyerProfileRequest, CreateBuyerRequest } from '@/api/buyers';
import { inventoryApi } from '@/api/inventory';
import { Crop } from '@/types';

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
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'create-profile'>('suspend');
  const [actionReason, setActionReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
  const [createBuyerDialogOpen, setCreateBuyerDialogOpen] = useState(false);
  const [createBuyerFormTab, setCreateBuyerFormTab] = useState(0);
  const [createBuyerForm, setCreateBuyerForm] = useState<CreateBuyerRequest>({
    name: '',
    phone: '',
    email: '',
    password: '',
    company_name: '',
    business_type: '',
    auto_activate: true,
    gov_id: '',
    bio: '',
    business_address_line1: '',
    business_address_line2: '',
    business_city: '',
    business_district: '',
    business_province: '',
    business_postal_code: '',
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_district: '',
    billing_province: '',
    billing_postal_code: '',
    delivery_address_line1: '',
    delivery_address_line2: '',
    delivery_city: '',
    delivery_district: '',
    delivery_province: '',
    delivery_postal_code: '',
    business_phone: '',
    business_email: '',
    website: '',
    tax_number: '',
    vat_number: '',
    business_registration_number: '',
    preferred_crops: [],
    preferred_districts: [],
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

  const { data: crops } = useQuery<Crop[]>({
    queryKey: ['crops'],
    queryFn: inventoryApi.getCrops,
  });

  const createBuyerMutation = useMutation({
    mutationFn: buyersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      setCreateBuyerDialogOpen(false);
      setCreateBuyerFormTab(0);
      console.log('Buyer created successfully');
      // Reset form after successful creation
      setCreateBuyerForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        company_name: '',
        business_type: '',
        auto_activate: true,
        gov_id: '',
        bio: '',
        business_address_line1: '',
        business_address_line2: '',
        business_city: '',
        business_district: '',
        business_province: '',
        business_postal_code: '',
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_district: '',
        billing_province: '',
        billing_postal_code: '',
        delivery_address_line1: '',
        delivery_address_line2: '',
        delivery_city: '',
        delivery_district: '',
        delivery_province: '',
        delivery_postal_code: '',
        business_phone: '',
        business_email: '',
        website: '',
        tax_number: '',
        vat_number: '',
        business_registration_number: '',
        preferred_crops: [],
        preferred_districts: [],
      });
    },
    onError: (error: any) => {
      console.error('Error creating buyer:', error);
      // Error is handled by the API client interceptor
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
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create New Buyer</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <Tabs value={createBuyerFormTab} onChange={(_, v) => setCreateBuyerFormTab(v)} sx={{ mb: 3 }}>
              <Tab label="Basic Info" />
              <Tab label="Business Details" />
              <Tab label="Addresses" />
              <Tab label="Additional Info" />
            </Tabs>

            {/* Basic Info Tab */}
            {createBuyerFormTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={createBuyerForm.name}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={createBuyerForm.phone}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, phone: e.target.value })}
                    required
                    placeholder="+263771234567"
                    helperText="Must start with +263 or 0"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email (Optional)"
                    type="email"
                    value={createBuyerForm.email}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Government ID (Optional)"
                    value={createBuyerForm.gov_id}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, gov_id: e.target.value })}
                    helperText="National ID or Passport Number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={createBuyerForm.password}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, password: e.target.value })}
                    required
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createBuyerForm.auto_activate}
                        onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, auto_activate: e.target.checked })}
                      />
                    }
                    label="Auto-activate account"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio / Background Information (Optional)"
                    multiline
                    rows={4}
                    value={createBuyerForm.bio}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, bio: e.target.value })}
                    placeholder="Tell us about the buyer's background, business, etc."
                  />
                </Grid>
              </Grid>
            )}

            {/* Business Details Tab */}
            {createBuyerFormTab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Company Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={createBuyerForm.company_name}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, company_name: e.target.value })}
                    helperText="If provided, buyer profile will be created automatically"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Business Type"
                    value={createBuyerForm.business_type}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_type: e.target.value })}
                    placeholder="e.g., Restaurant, Retailer, Wholesaler"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Business Phone"
                    value={createBuyerForm.business_phone}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_phone: e.target.value })}
                    placeholder="+263771234567"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Business Email"
                    type="email"
                    value={createBuyerForm.business_email}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website (Optional)"
                    value={createBuyerForm.website}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tax & Registration Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Tax Number"
                    value={createBuyerForm.tax_number}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, tax_number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="VAT Number"
                    value={createBuyerForm.vat_number}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, vat_number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Business Registration Number"
                    value={createBuyerForm.business_registration_number}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_registration_number: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}

            {/* Addresses Tab */}
            {createBuyerFormTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Business Address
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={createBuyerForm.business_address_line1}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_address_line1: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={createBuyerForm.business_address_line2}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_address_line2: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={createBuyerForm.business_city}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="District"
                    value={createBuyerForm.business_district}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_district: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Province"
                    value={createBuyerForm.business_province}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_province: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={createBuyerForm.business_postal_code}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, business_postal_code: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Billing Address (Optional - defaults to business address)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Billing Address Line 1"
                    value={createBuyerForm.billing_address_line1}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, billing_address_line1: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Billing Address Line 2"
                    value={createBuyerForm.billing_address_line2}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, billing_address_line2: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Billing City"
                    value={createBuyerForm.billing_city}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, billing_city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Billing District"
                    value={createBuyerForm.billing_district}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, billing_district: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Billing Province"
                    value={createBuyerForm.billing_province}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, billing_province: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Billing Postal Code"
                    value={createBuyerForm.billing_postal_code}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, billing_postal_code: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Default Delivery Address (Optional - defaults to business address)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delivery Address Line 1"
                    value={createBuyerForm.delivery_address_line1}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, delivery_address_line1: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delivery Address Line 2"
                    value={createBuyerForm.delivery_address_line2}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, delivery_address_line2: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Delivery City"
                    value={createBuyerForm.delivery_city}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, delivery_city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Delivery District"
                    value={createBuyerForm.delivery_district}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, delivery_district: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Delivery Province"
                    value={createBuyerForm.delivery_province}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, delivery_province: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Delivery Postal Code"
                    value={createBuyerForm.delivery_postal_code}
                    onChange={(e) => setCreateBuyerForm({ ...createBuyerForm, delivery_postal_code: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}

            {/* Additional Info Tab */}
            {createBuyerFormTab === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Crop Preferences
                  </Typography>
                  {crops && (
                    <Autocomplete
                      multiple
                      options={crops}
                      getOptionLabel={(option) => option.crop_name}
                      value={crops.filter((crop) => createBuyerForm.preferred_crops?.includes(crop.crop_id))}
                      onChange={(_, newValue) => {
                        setCreateBuyerForm({
                          ...createBuyerForm,
                          preferred_crops: newValue.map((c) => c.crop_id),
                        });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Preferred Crops" placeholder="Choose crops..." />
                      )}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox checked={selected} />
                          <ListItemText primary={option.crop_name} />
                        </li>
                      )}
                    />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Preferred Source Districts (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={createBuyerForm.preferred_districts?.join(', ') || ''}
                    onChange={(e) => {
                      const districts = e.target.value.split(',').map((d) => d.trim()).filter((d) => d.length > 0);
                      setCreateBuyerForm({ ...createBuyerForm, preferred_districts: districts });
                    }}
                    placeholder="Enter districts separated by commas (e.g., Harare, Bulawayo, Mutare)"
                    helperText="Districts where you prefer to source produce from"
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={() => setCreateBuyerDialogOpen(false)}>Cancel</Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => setCreateBuyerFormTab(createBuyerFormTab - 1)}
              disabled={createBuyerFormTab === 0}
              startIcon={<ArrowBack />}
              variant="outlined"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCreateBuyerFormTab(createBuyerFormTab + 1)}
              disabled={createBuyerFormTab === 3}
              endIcon={<ArrowForward />}
              variant="outlined"
            >
              Next
            </Button>
          </Box>

          <Button
            onClick={() => {
              // Clean up empty strings and send all fields
              const formData: CreateBuyerRequest = {
                name: createBuyerForm.name,
                phone: createBuyerForm.phone,
                password: createBuyerForm.password,
                auto_activate: createBuyerForm.auto_activate,
                email: createBuyerForm.email || undefined,
                gov_id: createBuyerForm.gov_id || undefined,
                bio: createBuyerForm.bio || undefined,
                company_name: createBuyerForm.company_name || undefined,
                business_type: createBuyerForm.business_type || undefined,
                business_address_line1: createBuyerForm.business_address_line1 || undefined,
                business_address_line2: createBuyerForm.business_address_line2 || undefined,
                business_city: createBuyerForm.business_city || undefined,
                business_district: createBuyerForm.business_district || undefined,
                business_province: createBuyerForm.business_province || undefined,
                business_postal_code: createBuyerForm.business_postal_code || undefined,
                billing_address_line1: createBuyerForm.billing_address_line1 || undefined,
                billing_address_line2: createBuyerForm.billing_address_line2 || undefined,
                billing_city: createBuyerForm.billing_city || undefined,
                billing_district: createBuyerForm.billing_district || undefined,
                billing_province: createBuyerForm.billing_province || undefined,
                billing_postal_code: createBuyerForm.billing_postal_code || undefined,
                delivery_address_line1: createBuyerForm.delivery_address_line1 || undefined,
                delivery_address_line2: createBuyerForm.delivery_address_line2 || undefined,
                delivery_city: createBuyerForm.delivery_city || undefined,
                delivery_district: createBuyerForm.delivery_district || undefined,
                delivery_province: createBuyerForm.delivery_province || undefined,
                delivery_postal_code: createBuyerForm.delivery_postal_code || undefined,
                business_phone: createBuyerForm.business_phone || undefined,
                business_email: createBuyerForm.business_email || undefined,
                website: createBuyerForm.website || undefined,
                tax_number: createBuyerForm.tax_number || undefined,
                vat_number: createBuyerForm.vat_number || undefined,
                business_registration_number: createBuyerForm.business_registration_number || undefined,
                preferred_crops: createBuyerForm.preferred_crops && createBuyerForm.preferred_crops.length > 0 ? createBuyerForm.preferred_crops : undefined,
                preferred_districts: createBuyerForm.preferred_districts && createBuyerForm.preferred_districts.length > 0 ? createBuyerForm.preferred_districts : undefined,
              };
              createBuyerMutation.mutate(formData);
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
