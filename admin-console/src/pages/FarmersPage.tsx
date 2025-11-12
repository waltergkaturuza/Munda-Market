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
import { MoreVert, Visibility, Block, CheckCircle, Phone, Email, Add } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmersApi, Farmer } from '@/api/farmers';

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
  const [createFarmerForm, setCreateFarmerForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    auto_activate: true,
  });

  const { data: farmers, isLoading } = useQuery({
    queryKey: ['farmers'],
    queryFn: farmersApi.getAll,
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

  const createFarmerMutation = useMutation({
    mutationFn: farmersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      setCreateFarmerDialogOpen(false);
      setCreateFarmerForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        auto_activate: true,
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

  const handleOpenAction = (farmer: Farmer, action: 'suspend' | 'activate') => {
    setSelectedFarmer(farmer);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedFarmer) return;

    if (actionType === 'suspend') {
      suspendMutation.mutate({ id: selectedFarmer.user_id, reason: actionReason });
    } else {
      activateMutation.mutate(selectedFarmer.user_id);
    }
  };

  const activeFarmers = farmers?.filter((f) => f.status === 'ACTIVE') || [];
  const pendingFarmers = farmers?.filter((f) => f.status === 'PENDING') || [];
  const suspendedFarmers = farmers?.filter((f) => f.status === 'SUSPENDED') || [];

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Farmers Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage farmer accounts, production plans, and earnings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateFarmerDialogOpen(true)}
        >
          Create Farmer
        </Button>
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
                {farmers?.length || 0}
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
    </Box>
  );
}
