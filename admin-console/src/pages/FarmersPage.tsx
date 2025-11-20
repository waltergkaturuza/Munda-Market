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
  Alert,
  Checkbox,
  ListItemText,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { MoreVert, Visibility, Block, CheckCircle, Phone, Email, Add, Refresh, Business, ArrowBack, ArrowForward } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmersApi, Farmer, CreateFarmRequest, CreateFarmerRequest } from '@/api/farmers';
import { inventoryApi } from '@/api/inventory';
import { Crop } from '@/types';
import { ZIMBABWE_PROVINCES, ZIMBABWE_DISTRICTS, CROP_CATEGORIES, CROP_TYPES } from '@/constants/zimbabwe';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'error',
  DEACTIVATED: 'default',
};

export default function FarmersPage() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate'>('suspend');
  const [actionReason, setActionReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
  const [createFarmerDialogOpen, setCreateFarmerDialogOpen] = useState(false);
  const [createFarmerFormTab, setCreateFarmerFormTab] = useState(0);
  const [selectedHomeProvince, setSelectedHomeProvince] = useState<string>('');
  const [selectedFarmProvince, setSelectedFarmProvince] = useState<string>('');
  const [selectedCropCategory, setSelectedCropCategory] = useState<string>('');
  const [createFarmerForm, setCreateFarmerForm] = useState<CreateFarmerRequest>({
    name: '',
    phone: '',
    email: '',
    password: '',
    auto_activate: true,
    gov_id: '',
    bio: '',
    home_address_line1: '',
    home_address_line2: '',
    home_district: '',
    home_province: '',
    home_postal_code: '',
    farm_name: '',
    farm_latitude: -17.8292,
    farm_longitude: 31.0522,
    farm_geohash: '',
    farm_district: '',
    farm_province: '',
    farm_ward: '',
    farm_address_line1: '',
    farm_address_line2: '',
    farm_postal_code: '',
    farm_total_hectares: undefined,
    farm_type: '',
    irrigation_available: '',
    preferred_crops: [],
    association_name: '',
    association_membership_id: '',
  });
  const [createFarmDialogOpen, setCreateFarmDialogOpen] = useState(false);
  const [createFarmForm, setCreateFarmForm] = useState<CreateFarmRequest>({
    name: '',
    geohash: '',
    latitude: -17.8292,
    longitude: 31.0522,
    district: '',
    province: '',
    ward: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    total_hectares: undefined,
    farm_type: '',
    irrigation_available: '',
    association_name: '',
    association_membership_id: '',
  });

  const { data: farmers, isLoading, error, refetch } = useQuery({
    queryKey: ['farmers'],
    queryFn: async () => {
      try {
        const data = await farmersApi.getAll();
        console.log('Farmers fetched:', data);
        return data || [];
      } catch (err) {
        console.error('Error fetching farmers:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: farmerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['farmer-details', selectedFarmer?.user_id],
    queryFn: () => farmersApi.getById(selectedFarmer!.user_id),
    enabled: !!selectedFarmer && detailsDialogOpen,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      farmersApi.suspend(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      setActionDialogOpen(false);
      setActionReason('');
    },
  });

  const activateMutation = useMutation({
    mutationFn: farmersApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      setActionDialogOpen(false);
    },
  });

  const { data: crops } = useQuery<Crop[]>({
    queryKey: ['crops'],
    queryFn: inventoryApi.getCrops,
  });

  const createFarmerMutation = useMutation({
    mutationFn: farmersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      setCreateFarmerDialogOpen(false);
      setCreateFarmerFormTab(0);
      setSelectedHomeProvince('');
      setSelectedFarmProvince('');
      setSelectedCropCategory('');
      setCreateFarmerForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        auto_activate: true,
        gov_id: '',
        bio: '',
        home_address_line1: '',
        home_address_line2: '',
        home_district: '',
        home_province: '',
        home_postal_code: '',
        farm_name: '',
        farm_latitude: -17.8292,
        farm_longitude: 31.0522,
        farm_geohash: '',
        farm_district: '',
        farm_province: '',
        farm_ward: '',
        farm_address_line1: '',
        farm_address_line2: '',
        farm_postal_code: '',
        farm_total_hectares: undefined,
        farm_type: '',
        irrigation_available: '',
        preferred_crops: [],
        association_name: '',
        association_membership_id: '',
      });
    },
  });

  const createFarmMutation = useMutation({
    mutationFn: ({ farmerId, data }: { farmerId: number; data: CreateFarmRequest }) =>
      farmersApi.createFarm(farmerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-details', selectedFarmer?.user_id] });
      setCreateFarmDialogOpen(false);
      setCreateFarmForm({
        name: '',
        geohash: '',
        latitude: -17.8292,
        longitude: 31.0522,
        district: '',
        province: '',
        ward: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        total_hectares: undefined,
        farm_type: '',
        irrigation_available: '',
        association_name: '',
        association_membership_id: '',
      });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, farmerId: number) => {
    setAnchorEl({ ...anchorEl, [farmerId]: event.currentTarget });
  };

  const handleMenuClose = (farmerId: number) => {
    setAnchorEl({ ...anchorEl, [farmerId]: null });
  };

  const handleViewDetails = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setDetailsDialogOpen(true);
  };

  const handleOpenAction = (farmer: Farmer, action: 'suspend' | 'activate' | 'create-farm') => {
    setSelectedFarmer(farmer);
    if (action === 'create-farm') {
      setCreateFarmForm({
        name: '',
        geohash: '',
        latitude: -17.8292,
        longitude: 31.0522,
        district: '',
        province: '',
        ward: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        total_hectares: undefined,
        farm_type: '',
        irrigation_available: '',
        association_name: '',
        association_membership_id: '',
      });
      setCreateFarmDialogOpen(true);
    } else {
      setActionType(action);
      setActionDialogOpen(true);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedFarmer) return;

    if (actionType === 'suspend') {
      suspendMutation.mutate({ id: selectedFarmer.user_id, reason: actionReason });
    } else {
      activateMutation.mutate(selectedFarmer.user_id);
    }
  };

  // Ensure farmers is always an array
  const farmersList = Array.isArray(farmers) ? farmers : [];
  const activeFarmers = farmersList.filter((f) => f.status === 'ACTIVE');
  const pendingFarmers = farmersList.filter((f) => f.status === 'PENDING');
  const suspendedFarmers = farmersList.filter((f) => f.status === 'SUSPENDED');

  const displayFarmers =
    tabValue === 0 ? activeFarmers : tabValue === 1 ? pendingFarmers : suspendedFarmers;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              <Refresh sx={{ mr: 1 }} /> Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          Failed to load farmers: {
            (error as any)?.message || 
            (error as any)?.response?.data?.detail || 
            'Unknown error. Please check your connection and try again.'
          }
        </Alert>
      )}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Farmers Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage farmer accounts, production plans, and earnings
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateFarmerDialogOpen(true)}
          >
            Create Farmer
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Farmers
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {farmersList.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Active Farmers
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {activeFarmers.length}
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
                {pendingFarmers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label={`Active (${activeFarmers.length})`} />
        <Tab label={`Pending (${pendingFarmers.length})`} />
        <Tab label={`Suspended (${suspendedFarmers.length})`} />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Farmer ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Farms</TableCell>
              <TableCell>Production (kg)</TableCell>
              <TableCell>Earnings (USD)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayFarmers.length > 0 ? (
              displayFarmers.map((farmer) => (
                <TableRow key={farmer.user_id}>
                  <TableCell>#{farmer.user_id}</TableCell>
                  <TableCell>{farmer.name}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone fontSize="small" />
                      {farmer.phone}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {farmer.email ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email fontSize="small" />
                        {farmer.email}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{farmer.farms_count || 0}</TableCell>
                  <TableCell>{farmer.total_production_kg?.toLocaleString() || 0}</TableCell>
                  <TableCell>${farmer.total_earnings_usd?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Chip label={farmer.status} size="small" color={statusColors[farmer.status]} />
                  </TableCell>
                  <TableCell>
                    {farmer.is_verified ? (
                      <Chip label="Verified" size="small" color="success" />
                    ) : (
                      <Chip label="Unverified" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>{new Date(farmer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(farmer)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, farmer.user_id)}
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl[farmer.user_id]}
                      open={Boolean(anchorEl[farmer.user_id])}
                      onClose={() => handleMenuClose(farmer.user_id)}
                    >
                      {farmer.status !== 'SUSPENDED' && (
                        <MenuItem
                          onClick={() => {
                            handleOpenAction(farmer, 'suspend');
                            handleMenuClose(farmer.user_id);
                          }}
                        >
                          <Block fontSize="small" sx={{ mr: 1 }} />
                          Suspend
                        </MenuItem>
                      )}
                      {farmer.status === 'SUSPENDED' && (
                        <MenuItem
                          onClick={() => {
                            handleOpenAction(farmer, 'activate');
                            handleMenuClose(farmer.user_id);
                          }}
                        >
                          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                          Activate
                        </MenuItem>
                      )}
                      <MenuItem
                        onClick={() => {
                          handleOpenAction(farmer, 'create-farm');
                          handleMenuClose(farmer.user_id);
                        }}
                      >
                        <Business fontSize="small" sx={{ mr: 1 }} />
                        Create Farm
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No farmers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Farmer Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Farmer Details</DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : farmerDetails ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {farmerDetails.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {farmerDetails.phone}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {farmerDetails.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip label={farmerDetails.status} color={statusColors[farmerDetails.status]} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Farms ({farmerDetails.farms?.length || 0})
              </Typography>
              {farmerDetails.farms && farmerDetails.farms.length > 0 ? (
                farmerDetails.farms.map((farm: any) => (
                  <Card key={farm.farm_id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {farm.farm_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {farm.location} - {farm.total_area_hectares} hectares
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No farms registered
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Production Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Production
                  </Typography>
                  <Typography variant="h6">
                    {farmerDetails.total_production_kg?.toLocaleString() || 0} kg
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings
                  </Typography>
                  <Typography variant="h6">
                    ${farmerDetails.total_earnings_usd?.toFixed(2) || '0.00'}
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
          {actionType === 'suspend' ? 'Suspend Farmer' : 'Activate Farmer'}
        </DialogTitle>
        <DialogContent>
          {selectedFarmer && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Farmer:</strong> {selectedFarmer.name}
              </Typography>
              <Typography variant="body2" gutterBottom mb={2}>
                <strong>Phone:</strong> {selectedFarmer.phone}
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
                  placeholder="Enter reason for suspending this farmer..."
                />
              )}

              {actionType === 'activate' && (
                <Typography variant="body2">
                  This will reactivate the farmer account and allow them to resume operations.
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

      {/* Create Farmer Dialog */}
      <Dialog
        open={createFarmerDialogOpen}
        onClose={() => {
          setCreateFarmerDialogOpen(false);
          setCreateFarmerFormTab(0);
          setSelectedHomeProvince('');
          setSelectedFarmProvince('');
          setSelectedCropCategory('');
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Create New Farmer</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <Tabs value={createFarmerFormTab} onChange={(_, v) => setCreateFarmerFormTab(v)} sx={{ mb: 3 }}>
              <Tab label="Basic Info" />
              <Tab label="Home Address" />
              <Tab label="Farm Details" />
              <Tab label="Additional Info" />
            </Tabs>

            {/* Basic Info Tab */}
            {createFarmerFormTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={createFarmerForm.name}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={createFarmerForm.phone}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, phone: e.target.value })}
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
                    value={createFarmerForm.email}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Government ID (Optional)"
                    value={createFarmerForm.gov_id}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, gov_id: e.target.value })}
                    helperText="National ID or Passport Number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={createFarmerForm.password}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, password: e.target.value })}
                    required
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createFarmerForm.auto_activate}
                        onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, auto_activate: e.target.checked })}
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
                    value={createFarmerForm.bio}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, bio: e.target.value })}
                    placeholder="Tell us about the farmer's background, experience, etc."
                  />
                </Grid>
              </Grid>
            )}

            {/* Home Address Tab */}
            {createFarmerFormTab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Home Address
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={createFarmerForm.home_address_line1}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, home_address_line1: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={createFarmerForm.home_address_line2}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, home_address_line2: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Province</InputLabel>
                    <Select
                      value={selectedHomeProvince}
                      label="Province"
                      onChange={(e) => {
                        const province = e.target.value;
                        setSelectedHomeProvince(province);
                        setCreateFarmerForm({ ...createFarmerForm, home_province: province, home_district: '' });
                      }}
                    >
                      {ZIMBABWE_PROVINCES.map((province) => (
                        <MenuItem key={province} value={province}>
                          {province}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedHomeProvince}>
                    <InputLabel>District</InputLabel>
                    <Select
                      value={createFarmerForm.home_district}
                      label="District"
                      onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, home_district: e.target.value })}
                    >
                      {selectedHomeProvince && ZIMBABWE_DISTRICTS[selectedHomeProvince]?.map((district) => (
                        <MenuItem key={district} value={district}>
                          {district}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={createFarmerForm.home_postal_code}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, home_postal_code: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}

            {/* Farm Details Tab */}
            {createFarmerFormTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Initial Farm Information (Optional - can be added later)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Farm Name"
                    value={createFarmerForm.farm_name}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Farm Type"
                    value={createFarmerForm.farm_type}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_type: e.target.value })}
                    placeholder="e.g., Commercial, Subsistence, Organic"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={createFarmerForm.farm_latitude}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_latitude: parseFloat(e.target.value) || -17.8292 })}
                    inputProps={{ step: 'any' }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={createFarmerForm.farm_longitude}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_longitude: parseFloat(e.target.value) || 31.0522 })}
                    inputProps={{ step: 'any' }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Geohash"
                    value={createFarmerForm.farm_geohash}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_geohash: e.target.value })}
                    helperText="Location geohash identifier"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Farm Province</InputLabel>
                    <Select
                      value={selectedFarmProvince}
                      label="Farm Province"
                      onChange={(e) => {
                        const province = e.target.value;
                        setSelectedFarmProvince(province);
                        setCreateFarmerForm({ ...createFarmerForm, farm_province: province, farm_district: '' });
                      }}
                    >
                      {ZIMBABWE_PROVINCES.map((province) => (
                        <MenuItem key={province} value={province}>
                          {province}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedFarmProvince}>
                    <InputLabel>Farm District</InputLabel>
                    <Select
                      value={createFarmerForm.farm_district}
                      label="Farm District"
                      onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_district: e.target.value })}
                    >
                      {selectedFarmProvince && ZIMBABWE_DISTRICTS[selectedFarmProvince]?.map((district) => (
                        <MenuItem key={district} value={district}>
                          {district}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Ward"
                    value={createFarmerForm.farm_ward}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_ward: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Farm Address Line 1"
                    value={createFarmerForm.farm_address_line1}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_address_line1: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Farm Address Line 2"
                    value={createFarmerForm.farm_address_line2}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_address_line2: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={createFarmerForm.farm_postal_code}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_postal_code: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Total Hectares"
                    type="number"
                    value={createFarmerForm.farm_total_hectares || ''}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, farm_total_hectares: e.target.value ? parseFloat(e.target.value) : undefined })}
                    inputProps={{ step: 'any', min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Irrigation Available"
                    value={createFarmerForm.irrigation_available}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, irrigation_available: e.target.value })}
                    placeholder="e.g., Drip, Sprinkler, Rainfed"
                  />
                </Grid>
              </Grid>
            )}

            {/* Additional Info Tab */}
            {createFarmerFormTab === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Crop Preferences
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Crop Category</InputLabel>
                        <Select
                          value={selectedCropCategory}
                          label="Crop Category"
                          onChange={(e) => setSelectedCropCategory(e.target.value)}
                        >
                          {CROP_CATEGORIES.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      {selectedCropCategory && (
                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          options={CROP_TYPES[selectedCropCategory] || []}
                          getOptionLabel={(option) => option}
                          value={(() => {
                            // Get currently selected crops from this category
                            if (!crops) return [];
                            const selectedCropNames = crops
                              .filter((c) => createFarmerForm.preferred_crops?.includes(c.crop_id))
                              .map((c) => c.crop_name);
                            return CROP_TYPES[selectedCropCategory]?.filter((name) => 
                              selectedCropNames.some((selected) => selected.toLowerCase() === name.toLowerCase())
                            ) || [];
                          })()}
                          onChange={(_, newValue) => {
                            // Map crop names to crop IDs if available in API
                            if (crops) {
                              const selectedCropIds = newValue
                                .map((cropName) => crops.find((c) => c.crop_name.toLowerCase() === cropName.toLowerCase())?.crop_id)
                                .filter((id): id is number => id !== undefined);
                              
                              // Get existing selections from other categories
                              const currentCategoryCropIds = CROP_TYPES[selectedCropCategory]
                                ?.map((name) => crops.find((c) => c.crop_name.toLowerCase() === name.toLowerCase())?.crop_id)
                                .filter((id): id is number => id !== undefined) || [];
                              
                              // Remove old selections from this category and add new ones
                              const otherCategoryIds = (createFarmerForm.preferred_crops || []).filter(
                                (id) => !currentCategoryCropIds.includes(id)
                              );
                              const combinedIds = [...new Set([...otherCategoryIds, ...selectedCropIds])];
                              
                              setCreateFarmerForm({
                                ...createFarmerForm,
                                preferred_crops: combinedIds,
                              });
                            }
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label={`Select ${selectedCropCategory}`} placeholder="Choose crops..." />
                          )}
                          renderOption={(props, option, { selected }) => (
                            <li {...props} key={option}>
                              <Checkbox
                                checked={selected}
                                sx={{ mr: 1, pointerEvents: 'none' }}
                                disableRipple
                                tabIndex={-1}
                              />
                              <ListItemText primary={option} />
                            </li>
                          )}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      {crops && (
                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          options={crops}
                          getOptionLabel={(option) => option.crop_name}
                          value={crops.filter((crop) => createFarmerForm.preferred_crops?.includes(crop.crop_id))}
                          onChange={(_, newValue) => {
                            setCreateFarmerForm({
                              ...createFarmerForm,
                              preferred_crops: newValue.map((c) => c.crop_id),
                            });
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Or Select from All Available Crops" placeholder="Choose crops..." />
                          )}
                          renderOption={(props, option, { selected }) => (
                            <li {...props} key={option.crop_id}>
                              <Checkbox
                                checked={selected}
                                sx={{ mr: 1, pointerEvents: 'none' }}
                                disableRipple
                                tabIndex={-1}
                              />
                              <ListItemText primary={option.crop_name} />
                            </li>
                          )}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Association Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Association Name"
                    value={createFarmerForm.association_name}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, association_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Association Membership ID"
                    value={createFarmerForm.association_membership_id}
                    onChange={(e) => setCreateFarmerForm({ ...createFarmerForm, association_membership_id: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={() => setCreateFarmerDialogOpen(false)}>Cancel</Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => setCreateFarmerFormTab(createFarmerFormTab - 1)}
              disabled={createFarmerFormTab === 0}
              startIcon={<ArrowBack />}
              variant="outlined"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCreateFarmerFormTab(createFarmerFormTab + 1)}
              disabled={createFarmerFormTab === 3}
              endIcon={<ArrowForward />}
              variant="outlined"
            >
              Next
            </Button>
          </Box>

          <Button
            onClick={() => {
              // Clean up empty strings and send all fields
              // Only include farm coordinates if farm details are being provided
              const hasFarmDetails = !!(createFarmerForm.farm_name && createFarmerForm.farm_district && createFarmerForm.farm_province);
              
              const formData: CreateFarmerRequest = {
                name: createFarmerForm.name,
                phone: createFarmerForm.phone,
                password: createFarmerForm.password,
                auto_activate: createFarmerForm.auto_activate,
                email: createFarmerForm.email || undefined,
                gov_id: createFarmerForm.gov_id || undefined,
                bio: createFarmerForm.bio || undefined,
                home_address_line1: createFarmerForm.home_address_line1 || undefined,
                home_address_line2: createFarmerForm.home_address_line2 || undefined,
                home_district: createFarmerForm.home_district || undefined,
                home_province: createFarmerForm.home_province || undefined,
                home_postal_code: createFarmerForm.home_postal_code || undefined,
                farm_name: createFarmerForm.farm_name || undefined,
                farm_latitude: hasFarmDetails ? createFarmerForm.farm_latitude : undefined,
                farm_longitude: hasFarmDetails ? createFarmerForm.farm_longitude : undefined,
                farm_geohash: createFarmerForm.farm_geohash || undefined,
                farm_district: createFarmerForm.farm_district || undefined,
                farm_province: createFarmerForm.farm_province || undefined,
                farm_ward: createFarmerForm.farm_ward || undefined,
                farm_address_line1: createFarmerForm.farm_address_line1 || undefined,
                farm_address_line2: createFarmerForm.farm_address_line2 || undefined,
                farm_postal_code: createFarmerForm.farm_postal_code || undefined,
                farm_total_hectares: createFarmerForm.farm_total_hectares,
                farm_type: createFarmerForm.farm_type || undefined,
                irrigation_available: createFarmerForm.irrigation_available || undefined,
                preferred_crops: createFarmerForm.preferred_crops && createFarmerForm.preferred_crops.length > 0 ? createFarmerForm.preferred_crops : undefined,
                association_name: createFarmerForm.association_name || undefined,
                association_membership_id: createFarmerForm.association_membership_id || undefined,
              };
              createFarmerMutation.mutate(formData);
            }}
            variant="contained"
            disabled={
              !createFarmerForm.name ||
              !createFarmerForm.phone ||
              !createFarmerForm.password ||
              createFarmerMutation.isPending
            }
          >
            {createFarmerMutation.isPending ? 'Creating...' : 'Create Farmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Farm Dialog */}
      <Dialog
        open={createFarmDialogOpen}
        onClose={() => setCreateFarmDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Farm for {selectedFarmer?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              fullWidth
              label="Farm Name"
              value={createFarmForm.name}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, name: e.target.value })}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={createFarmForm.latitude}
                  onChange={(e) => setCreateFarmForm({ ...createFarmForm, latitude: parseFloat(e.target.value) || 0 })}
                  required
                  inputProps={{ step: 'any' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={createFarmForm.longitude}
                  onChange={(e) => setCreateFarmForm({ ...createFarmForm, longitude: parseFloat(e.target.value) || 0 })}
                  required
                  inputProps={{ step: 'any' }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Geohash"
              value={createFarmForm.geohash}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, geohash: e.target.value })}
              required
              helperText="Location geohash identifier"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="District"
                  value={createFarmForm.district}
                  onChange={(e) => setCreateFarmForm({ ...createFarmForm, district: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Province"
                  value={createFarmForm.province}
                  onChange={(e) => setCreateFarmForm({ ...createFarmForm, province: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Ward (Optional)"
              value={createFarmForm.ward}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, ward: e.target.value })}
            />
            <TextField
              fullWidth
              label="Address Line 1 (Optional)"
              value={createFarmForm.address_line1}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, address_line1: e.target.value })}
            />
            <TextField
              fullWidth
              label="Address Line 2 (Optional)"
              value={createFarmForm.address_line2}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, address_line2: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Postal Code (Optional)"
                  value={createFarmForm.postal_code}
                  onChange={(e) => setCreateFarmForm({ ...createFarmForm, postal_code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Hectares (Optional)"
                  type="number"
                  value={createFarmForm.total_hectares || ''}
                  onChange={(e) => setCreateFarmForm({ ...createFarmForm, total_hectares: e.target.value ? parseFloat(e.target.value) : undefined })}
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Farm Type (Optional)"
              value={createFarmForm.farm_type}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, farm_type: e.target.value })}
              placeholder="e.g., Commercial, Subsistence, Organic"
            />
            <TextField
              fullWidth
              label="Irrigation Available (Optional)"
              value={createFarmForm.irrigation_available}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, irrigation_available: e.target.value })}
              placeholder="e.g., Drip, Sprinkler, Rainfed"
            />
            <TextField
              fullWidth
              label="Association Name (Optional)"
              value={createFarmForm.association_name}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, association_name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Association Membership ID (Optional)"
              value={createFarmForm.association_membership_id}
              onChange={(e) => setCreateFarmForm({ ...createFarmForm, association_membership_id: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFarmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedFarmer) {
                createFarmMutation.mutate({
                  farmerId: selectedFarmer.user_id,
                  data: createFarmForm,
                });
              }
            }}
            variant="contained"
            disabled={
              !createFarmForm.name ||
              !createFarmForm.geohash ||
              !createFarmForm.district ||
              !createFarmForm.province ||
              createFarmMutation.isPending
            }
          >
            {createFarmMutation.isPending ? 'Creating...' : 'Create Farm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
