import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import {
  Inventory,
  Warning,
  Error,
  CheckCircle,
  ShoppingCart,
} from '@mui/icons-material';

const alertLevelColors = {
  ok: 'success',
  low: 'warning',
  critical: 'error',
};

const alertLevelIcons = {
  ok: CheckCircle,
  low: Warning,
  critical: Error,
};

export default function StockLevelCard({ stockLevel, onReorder }) {
  const { crop_name, remaining_kg, min_stock_threshold_kg, alert_level, days_until_harvest } = stockLevel;

  const Icon = alertLevelIcons[alert_level] || Inventory;
  const color = alertLevelColors[alert_level] || 'default';

  // Calculate percentage for progress bar
  const percentage = min_stock_threshold_kg
    ? Math.min((remaining_kg / min_stock_threshold_kg) * 100, 100)
    : 100;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {crop_name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Chip
                icon={<Icon />}
                label={alert_level.toUpperCase()}
                color={color}
                size="small"
              />
              {days_until_harvest !== null && days_until_harvest !== undefined && (
                <Chip
                  label={`Harvest in ${days_until_harvest} days`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
          {onReorder && alert_level !== 'ok' && (
            <Button
              size="small"
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => onReorder(stockLevel)}
            >
              Reorder
            </Button>
          )}
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Available Stock
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {remaining_kg.toFixed(1)} kg
            </Typography>
          </Box>
          {min_stock_threshold_kg && (
            <>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={color}
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary" mt={0.5}>
                Threshold: {min_stock_threshold_kg.toFixed(1)} kg
              </Typography>
            </>
          )}
        </Box>

        {stockLevel.reorder_quantity_kg && (
          <Typography variant="caption" color="text.secondary">
            Suggested reorder: {stockLevel.reorder_quantity_kg.toFixed(1)} kg
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

