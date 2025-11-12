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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi, CreatePricingRuleRequest } from '@/api/pricing';

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePricingRuleRequest>({
    crop_id: 0,
    markup_percentage: 0,
    priority: 1,
    active: true,
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: pricingApi.getRules,
  });

  const { data: crops } = useQuery({
    queryKey: ['crops'],
    queryFn: pricingApi.getCrops,
  });

  const createMutation = useMutation({
    mutationFn: pricingApi.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: pricingApi.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
  });

  const resetForm = () => {
    setFormData({
      crop_id: 0,
      markup_percentage: 0,
      priority: 1,
      active: true,
    });
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleDelete = (ruleId: number) => {
    if (confirm('Are you sure you want to delete this pricing rule?')) {
      deleteMutation.mutate(ruleId);
    }
  };

  if (rulesLoading) {
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
            Pricing Rules
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure markup percentages and pricing strategies
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          New Rule
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Crop</TableCell>
              <TableCell align="right">Min Quantity (kg)</TableCell>
              <TableCell align="right">Max Quantity (kg)</TableCell>
              <TableCell align="right">Markup %</TableCell>
              <TableCell align="right">Priority</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules && rules.length > 0 ? (
              rules.map((rule) => (
                <TableRow key={rule.rule_id}>
                  <TableCell>{rule.crop_name || `Crop #${rule.crop_id}`}</TableCell>
                  <TableCell align="right">{rule.min_quantity_kg || '-'}</TableCell>
                  <TableCell align="right">{rule.max_quantity_kg || '-'}</TableCell>
                  <TableCell align="right">{rule.markup_percentage}%</TableCell>
                  <TableCell align="right">{rule.priority}</TableCell>
                  <TableCell>{rule.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDelete(rule.rule_id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No pricing rules configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Pricing Rule</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Crop</InputLabel>
              <Select
                value={formData.crop_id}
                label="Crop"
                onChange={(e) => setFormData({ ...formData, crop_id: e.target.value as number })}
              >
                {crops?.map((crop) => (
                  <MenuItem key={crop.crop_id} value={crop.crop_id}>
                    {crop.crop_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Min Quantity (kg)"
              type="number"
              value={formData.min_quantity_kg || ''}
              onChange={(e) =>
                setFormData({ ...formData, min_quantity_kg: Number(e.target.value) })
              }
            />

            <TextField
              label="Max Quantity (kg)"
              type="number"
              value={formData.max_quantity_kg || ''}
              onChange={(e) =>
                setFormData({ ...formData, max_quantity_kg: Number(e.target.value) })
              }
            />

            <TextField
              label="Markup Percentage"
              type="number"
              value={formData.markup_percentage}
              onChange={(e) =>
                setFormData({ ...formData, markup_percentage: Number(e.target.value) })
              }
              required
            />

            <TextField
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              required
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || !formData.crop_id}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
