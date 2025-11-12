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
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory';

export default function InventoryPage() {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAvailableInventory,
    refetchInterval: 60000, // Refresh every minute
  });

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
        Inventory
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        View available crops and harvest schedules
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Crop Name</TableCell>
              <TableCell align="right">Available (kg)</TableCell>
              <TableCell align="right">Farms Growing</TableCell>
              <TableCell align="right">Avg Harvest Days</TableCell>
              <TableCell align="right">Base Price (USD/kg)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory && inventory.length > 0 ? (
              inventory.map((item) => (
                <TableRow key={item.crop_id}>
                  <TableCell>{item.crop_name}</TableCell>
                  <TableCell align="right">{item.available_quantity_kg.toLocaleString()}</TableCell>
                  <TableCell align="right">{item.farms_growing}</TableCell>
                  <TableCell align="right">{item.avg_harvest_days}</TableCell>
                  <TableCell align="right">${item.base_price_usd_per_kg.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.available_quantity_kg > 0 ? 'In Stock' : 'Out of Stock'}
                      size="small"
                      color={item.available_quantity_kg > 0 ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No inventory data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
