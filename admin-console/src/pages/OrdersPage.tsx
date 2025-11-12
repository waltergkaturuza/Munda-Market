import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import { Order } from '@/types';
import { ORDER_STATUS } from '@/config/constants';

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  DRAFT: 'default',
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  ALLOCATED: 'info',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
  QC_PASSED: 'success',
  QC_FAILED: 'error',
};

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: number, newStatus: string) => void;
}

function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(order.order_id, newStatus);
    handleMenuClose();
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              Order #{order.order_id}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {order.buyer_name || `Buyer #${order.buyer_user_id}`}
            </Typography>
            <Typography variant="body2" gutterBottom>
              {order.crop_name || `Crop #${order.crop_id}`} - {order.quantity_kg} kg
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              ${order.total_amount_usd.toFixed(2)}
            </Typography>
            <Chip
              label={order.status}
              size="small"
              color={statusColors[order.status] || 'default'}
              sx={{ mt: 1 }}
            />
          </Box>
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          {order.status === ORDER_STATUS.PENDING_PAYMENT && (
            <MenuItem onClick={() => handleStatusChange(ORDER_STATUS.PAID)}>
              Mark as Paid
            </MenuItem>
          )}
          {order.status === ORDER_STATUS.PAID && (
            <MenuItem onClick={() => handleStatusChange(ORDER_STATUS.ALLOCATED)}>
              Mark as Allocated
            </MenuItem>
          )}
          {order.status === ORDER_STATUS.ALLOCATED && (
            <MenuItem onClick={() => handleStatusChange(ORDER_STATUS.DISPATCHED)}>
              Mark as Dispatched
            </MenuItem>
          )}
          {order.status === ORDER_STATUS.DISPATCHED && (
            <MenuItem onClick={() => handleStatusChange(ORDER_STATUS.DELIVERED)}>
              Mark as Delivered
            </MenuItem>
          )}
          <MenuItem onClick={() => handleStatusChange(ORDER_STATUS.CANCELLED)} sx={{ color: 'error.main' }}>
            Cancel Order
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ordersApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ order_id: orderId, status });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const ordersByStatus = {
    [ORDER_STATUS.PENDING_PAYMENT]: orders?.filter((o) => o.status === ORDER_STATUS.PENDING_PAYMENT) || [],
    [ORDER_STATUS.ALLOCATED]: orders?.filter((o) => o.status === ORDER_STATUS.ALLOCATED) || [],
    [ORDER_STATUS.DISPATCHED]: orders?.filter((o) => o.status === ORDER_STATUS.DISPATCHED) || [],
    [ORDER_STATUS.DELIVERED]: orders?.filter((o) => o.status === ORDER_STATUS.DELIVERED) || [],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Orders Pipeline
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Track and manage orders through fulfillment stages
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Pending Payment ({ordersByStatus.PENDING_PAYMENT.length})
            </Typography>
            {ordersByStatus.PENDING_PAYMENT.map((order) => (
              <OrderCard key={order.order_id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Allocated ({ordersByStatus.ALLOCATED.length})
            </Typography>
            {ordersByStatus.ALLOCATED.map((order) => (
              <OrderCard key={order.order_id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Dispatched ({ordersByStatus.DISPATCHED.length})
            </Typography>
            {ordersByStatus.DISPATCHED.map((order) => (
              <OrderCard key={order.order_id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Delivered ({ordersByStatus.DELIVERED.length})
            </Typography>
            {ordersByStatus.DELIVERED.map((order) => (
              <OrderCard key={order.order_id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
