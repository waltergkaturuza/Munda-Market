import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Typography,
  Stack,
} from '@mui/material';
import {
  Close,
  Warning,
  Error,
  Info,
  CheckCircle,
  ShoppingCart,
} from '@mui/icons-material';

const severityIcons = {
  low: Info,
  medium: Warning,
  high: Warning,
  critical: Error,
};

const severityColors = {
  low: 'info',
  medium: 'warning',
  high: 'warning',
  critical: 'error',
};

export default function InventoryAlerts({ alerts, onAcknowledge, onDismiss }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Filter to show only active alerts
  const activeAlerts = alerts.filter(
    (alert) => alert.status === 'active'
  );

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      {activeAlerts.map((alert) => {
        const Icon = severityIcons[alert.severity] || Warning;
        const color = severityColors[alert.severity] || 'warning';

        return (
          <Alert
            key={alert.alert_id}
            severity={color}
            icon={<Icon />}
            action={
              <Stack direction="row" spacing={1}>
                {alert.action_url && alert.action_text && (
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    href={alert.action_url}
                    startIcon={<ShoppingCart />}
                  >
                    {alert.action_text}
                  </Button>
                )}
                <IconButton
                  aria-label="acknowledge"
                  color="inherit"
                  size="small"
                  onClick={() => onAcknowledge && onAcknowledge(alert.alert_id)}
                >
                  <CheckCircle fontSize="inherit" />
                </IconButton>
                <IconButton
                  aria-label="dismiss"
                  color="inherit"
                  size="small"
                  onClick={() => onDismiss && onDismiss(alert.alert_id)}
                >
                  <Close fontSize="inherit" />
                </IconButton>
              </Stack>
            }
            sx={{ mb: 2 }}
          >
            <AlertTitle>{alert.title}</AlertTitle>
            <Typography variant="body2">{alert.message}</Typography>
            {alert.alert_data && (
              <Box sx={{ mt: 1 }}>
                {alert.alert_data.current_stock_kg !== undefined && (
                  <Chip
                    size="small"
                    label={`Current Stock: ${alert.alert_data.current_stock_kg.toFixed(1)}kg`}
                    sx={{ mr: 1 }}
                  />
                )}
                {alert.alert_data.threshold_kg !== undefined && (
                  <Chip
                    size="small"
                    label={`Threshold: ${alert.alert_data.threshold_kg.toFixed(1)}kg`}
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Alert>
        );
      })}
    </Box>
  );
}

