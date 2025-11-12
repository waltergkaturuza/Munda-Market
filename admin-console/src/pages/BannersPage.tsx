import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bannersApi } from '@/api/banners';
import { Banner, BannerCreate, BannerUpdate, BannerType, BannerPlatform } from '@/types';

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

  const [formData, setFormData] = useState<BannerCreate>({
    title: '',
    message: '',
    banner_type: 'info',
    platform: 'all',
    image_url: '',
    link_url: '',
    link_text: '',
    is_active: true,
    is_dismissible: true,
    priority: 0,
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannersApi.listBanners(),
  });

  const createMutation = useMutation({
    mutationFn: (data: BannerCreate) => bannersApi.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-banners'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BannerUpdate }) =>
      bannersApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-banners'] });
      setDialogOpen(false);
      setEditingBanner(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannersApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-banners'] });
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      banner_type: 'info',
      platform: 'all',
      image_url: '',
      link_url: '',
      link_text: '',
      is_active: true,
      is_dismissible: true,
      priority: 0,
    });
    setEditingBanner(null);
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        message: banner.message,
        banner_type: banner.banner_type,
        platform: banner.platform,
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        link_text: banner.link_text || '',
        start_date: banner.start_date,
        end_date: banner.end_date,
        is_active: banner.is_active,
        is_dismissible: banner.is_dismissible,
        priority: banner.priority,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBanner(null);
    resetForm();
  };

  const handleSubmit = () => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.banner_id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (bannerToDelete) {
      deleteMutation.mutate(bannerToDelete.banner_id);
    }
  };

  const toggleActive = (banner: Banner) => {
    updateMutation.mutate({
      id: banner.banner_id,
      data: { is_active: !banner.is_active },
    });
  };

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
          <Typography variant="h4" fontWeight="bold">
            Dashboard Banners
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Create Banner
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" py={3}>
                      No banners found. Create your first banner to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.banner_id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {banner.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={banner.banner_type}
                        size="small"
                        color={
                          banner.banner_type === 'error'
                            ? 'error'
                            : banner.banner_type === 'warning'
                            ? 'warning'
                            : banner.banner_type === 'success'
                            ? 'success'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={banner.platform} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{banner.priority}</TableCell>
                    <TableCell>
                      <Tooltip title={banner.is_active ? 'Active' : 'Inactive'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleActive(banner)}
                          color={banner.is_active ? 'success' : 'default'}
                        >
                          {banner.is_active ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {banner.start_date
                        ? new Date(banner.start_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {banner.end_date
                        ? new Date(banner.end_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(banner)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(banner)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                multiline
                rows={3}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Banner Type</InputLabel>
                <Select
                  value={formData.banner_type}
                  onChange={(e) =>
                    setFormData({ ...formData, banner_type: e.target.value as BannerType })
                  }
                  label="Banner Type"
                >
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="promotion">Promotion</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value as BannerPlatform })
                  }
                  label="Platform"
                >
                  <MenuItem value="all">All Platforms</MenuItem>
                  <MenuItem value="admin">Admin Console</MenuItem>
                  <MenuItem value="buyer">Buyer Portal</MenuItem>
                  <MenuItem value="farmer">Farmer App</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Image URL (optional)"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                fullWidth
                placeholder="https://example.com/image.jpg"
              />
              <TextField
                label="Link URL (optional)"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                fullWidth
                placeholder="https://example.com"
              />
              <TextField
                label="Link Text (optional)"
                value={formData.link_text}
                onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                fullWidth
                placeholder="Learn More"
              />
              <TextField
                label="Priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                }
                inputProps={{ min: 0 }}
                fullWidth
                helperText="Higher priority banners appear first"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_dismissible ?? true}
                    onChange={(e) =>
                      setFormData({ ...formData, is_dismissible: e.target.checked })
                    }
                  />
                }
                label="Dismissible"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.title || !formData.message}
            >
              {editingBanner ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Banner</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              Are you sure you want to delete "{bannerToDelete?.title}"? This action
              cannot be undone.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}

