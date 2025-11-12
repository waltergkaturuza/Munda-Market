import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Payment,
  Language,
  ColorLens,
  Delete,
  Add,
  Edit,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { settingsApi } from '@/api/settings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const [tabValue, setTabValue] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch all settings
  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  });

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    site_name: 'Munda Market',
    site_description: 'Digital marketplace for fresh produce',
    support_email: 'support@mundamarket.co.zw',
    support_phone: '+263771234567',
    currency: 'USD',
    timezone: 'Africa/Harare',
    language: 'en',
  });

  // Load settings from API when available
  useEffect(() => {
    if (allSettings?.general) {
      setGeneralSettings(allSettings.general);
    }
    if (allSettings?.security) {
      setSecuritySettings(allSettings.security);
    }
    if (allSettings?.notifications) {
      setNotificationSettings(allSettings.notifications);
    }
    if (allSettings?.payments) {
      setPaymentSettings(allSettings.payments);
    }
    if (allSettings?.pricing) {
      setPricingSettings(allSettings.pricing);
    }
  }, [allSettings]);

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 30,
    max_login_attempts: 5,
    password_min_length: 8,
    require_strong_password: true,
    two_factor_enabled: false,
    ip_whitelist: '',
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    whatsapp_notifications: true,
    order_alerts: true,
    payout_alerts: true,
    kyc_alerts: true,
    low_inventory_alerts: true,
    daily_reports: true,
  });

  // Payment Gateway Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    stripe_live: false,
    ecocash_enabled: true,
    zipit_enabled: true,
    bank_transfer_enabled: true,
    min_order_amount: 10,
    max_order_amount: 50000,
    delivery_fee_base: 5,
    delivery_fee_per_kg: 0.06,
    service_fee_percentage: 2,
  });

  // Pricing Settings State
  const [pricingSettings, setPricingSettings] = useState({
    auto_adjust_pricing: false,
    default_markup: 15,
    bulk_discount_enabled: true,
    price_floor_protection: true,
    dynamic_pricing_enabled: false,
  });

  // Mutations
  const updateGeneralMutation = useMutation({
    mutationFn: settingsApi.updateGeneral,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: settingsApi.updateSecurity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updatePaymentsMutation = useMutation({
    mutationFn: settingsApi.updatePayments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: settingsApi.updatePricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: settingsApi.clearCache,
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSaveGeneral = () => {
    updateGeneralMutation.mutate(generalSettings);
  };

  const handleSaveSecurity = () => {
    updateSecurityMutation.mutate(securitySettings);
  };

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate(notificationSettings);
  };

  const handleSavePayments = () => {
    updatePaymentsMutation.mutate(paymentSettings);
  };

  const handleSavePricing = () => {
    updatePricingMutation.mutate(pricingSettings);
  };

  const handleClearCache = () => {
    clearCacheMutation.mutate();
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Configure system settings and preferences
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable">
          <Tab label="General" />
          <Tab label="Security" />
          <Tab label="Notifications" />
          <Tab label="Payments" />
          <Tab label="Pricing" />
          <Tab label="Appearance" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              General Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Site Name"
                  value={generalSettings.site_name}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, site_name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Support Email"
                  value={generalSettings.support_email}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, support_email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Site Description"
                  multiline
                  rows={2}
                  value={generalSettings.site_description}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, site_description: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Support Phone"
                  value={generalSettings.support_phone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, support_phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Currency</InputLabel>
                  <Select
                    value={generalSettings.currency}
                    label="Default Currency"
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, currency: e.target.value })
                    }
                  >
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="ZWL">ZWL - Zimbabwe Dollar</MenuItem>
                    <MenuItem value="ZAR">ZAR - South African Rand</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={generalSettings.timezone}
                    label="Timezone"
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                    }
                  >
                    <MenuItem value="Africa/Harare">Africa/Harare (CAT)</MenuItem>
                    <MenuItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    value={generalSettings.language}
                    label="Default Language"
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, language: e.target.value })
                    }
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="sn">Shona</MenuItem>
                    <MenuItem value="nd">Ndebele</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSaveGeneral}>
                Save General Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Security & Access Control
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.session_timeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      session_timeout: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={securitySettings.max_login_attempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      max_login_attempts: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password Minimum Length"
                  type="number"
                  value={securitySettings.password_min_length}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      password_min_length: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.require_strong_password}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          require_strong_password: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Require Strong Password"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.two_factor_enabled}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          two_factor_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="IP Whitelist (comma-separated)"
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={securitySettings.ip_whitelist}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, ip_whitelist: e.target.value })
                  }
                  helperText="Leave empty to allow all IPs"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="bold">
              Admin Users
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary={user?.name}
                  secondary={`${user?.role} - ${user?.email || user?.phone}`}
                />
                <ListItemSecondaryAction>
                  <Chip label="Current User" color="primary" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSaveSecurity}>
                Save Security Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Notification Channels
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          email_notifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.sms_notifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          sms_notifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label="SMS Notifications"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.whatsapp_notifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          whatsapp_notifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label="WhatsApp Notifications"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="bold">
              Alert Types
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.order_alerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          order_alerts: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Order Status Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.payout_alerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          payout_alerts: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Payout Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.kyc_alerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          kyc_alerts: e.target.checked,
                        })
                      }
                    />
                  }
                  label="KYC Submission Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.low_inventory_alerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          low_inventory_alerts: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Low Inventory Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.daily_reports}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          daily_reports: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Daily Summary Reports"
                />
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveNotifications}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Payment Settings */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Payment Gateways
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.stripe_live}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, stripe_live: e.target.checked })
                      }
                    />
                  }
                  label="Stripe (Live Mode)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.ecocash_enabled}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          ecocash_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label="EcoCash Enabled"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.zipit_enabled}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, zipit_enabled: e.target.checked })
                      }
                    />
                  }
                  label="ZIPIT Enabled"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.bank_transfer_enabled}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          bank_transfer_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Bank Transfer Enabled"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="bold">
              Order Limits & Fees
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Order Amount (USD)"
                  type="number"
                  value={paymentSettings.min_order_amount}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      min_order_amount: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum Order Amount (USD)"
                  type="number"
                  value={paymentSettings.max_order_amount}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      max_order_amount: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Delivery Fee Base (USD)"
                  type="number"
                  value={paymentSettings.delivery_fee_base}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      delivery_fee_base: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Delivery Fee Per Kg (USD)"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={paymentSettings.delivery_fee_per_kg}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      delivery_fee_per_kg: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Service Fee (%)"
                  type="number"
                  value={paymentSettings.service_fee_percentage}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      service_fee_percentage: Number(e.target.value),
                    })
                  }
                />
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSavePayments}>
                Save Payment Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Pricing Settings */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Pricing Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pricingSettings.auto_adjust_pricing}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          auto_adjust_pricing: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Auto-Adjust Pricing Based on Demand"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Markup (%)"
                  type="number"
                  value={pricingSettings.default_markup}
                  onChange={(e) =>
                    setPricingSettings({
                      ...pricingSettings,
                      default_markup: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pricingSettings.bulk_discount_enabled}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          bulk_discount_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Enable Bulk Discounts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pricingSettings.price_floor_protection}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          price_floor_protection: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Price Floor Protection (Farmer Minimum)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pricingSettings.dynamic_pricing_enabled}
                      onChange={(e) =>
                        setPricingSettings({
                          ...pricingSettings,
                          dynamic_pricing_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Enable Dynamic Pricing Engine"
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              Dynamic pricing uses AI to adjust prices based on supply, demand, and market conditions.
            </Alert>

            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSavePricing}>
                Save Pricing Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Appearance Settings */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Appearance & Theming
            </Typography>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Dark Mode
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current theme: {mode === 'light' ? 'Light' : 'Dark'}
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<ColorLens />} onClick={toggleMode}>
                    Toggle Theme
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Brand Colors
                </Typography>
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={6} md={3}>
                    <Box
                      sx={{
                        bgcolor: 'primary.main',
                        height: 80,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.contrastText',
                      }}
                    >
                      Primary
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box
                      sx={{
                        bgcolor: 'secondary.main',
                        height: 80,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'secondary.contrastText',
                      }}
                    >
                      Secondary
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box
                      sx={{
                        bgcolor: 'success.main',
                        height: 80,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'success.contrastText',
                      }}
                    >
                      Success
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box
                      sx={{
                        bgcolor: 'error.main',
                        height: 80,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'error.contrastText',
                      }}
                    >
                      Error
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Logo & Branding
                </Typography>
                <Box display="flex" gap={2} mt={2}>
                  <Button variant="outlined" startIcon={<Add />}>
                    Upload Logo
                  </Button>
                  <Button variant="outlined" startIcon={<Add />}>
                    Upload Favicon
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* System Information */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          System Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Application Version
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              v1.0.0
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Backend API
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              http://localhost:8000
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Database Status
            </Typography>
            <Chip label="Connected" color="success" size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Last Backup
            </Typography>
            <Typography variant="body1">Never</Typography>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" gap={2}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={handleClearCache}
            disabled={clearCacheMutation.isPending}
          >
            {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
          </Button>
          <Button variant="outlined" color="warning" startIcon={<Security />}>
            Run Health Check
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
