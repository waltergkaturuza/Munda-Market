import { useState, SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  useTheme,
} from '@mui/material';
import {
  People,
  ShoppingCart,
  Info,
  Dashboard,
  VerifiedUser,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';
import { ROUTES } from '@/config/constants';

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
      id={`home-tabpanel-${index}`}
      aria-labelledby={`home-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `home-tab-${index}`,
    'aria-controls': `home-tabpanel-${index}`,
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
          Welcome to Munda Market
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Digital marketplace for fresh produce - Admin Console
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="home navigation tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            label="Farmers"
            icon={<People />}
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            label="Buyers"
            icon={<ShoppingCart />}
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            label="About Us"
            icon={<Info />}
            iconPosition="start"
            {...a11yProps(2)}
          />
        </Tabs>

        {/* Farmers Tab */}
        <TabPanel value={value} index={0}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Farmers Management
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Manage farmer accounts, farms, production plans, and monitor farmer activity.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      View All Farmers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browse and manage all registered farmers in the system
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      variant="contained"
                      fullWidth
                      onClick={() => handleNavigate(ROUTES.FARMERS)}
                    >
                      Go to Farmers
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <VerifiedUser sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      KYC Queue
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review and approve farmer registrations
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      variant="contained"
                      color="warning"
                      fullWidth
                      onClick={() => handleNavigate(ROUTES.KYC)}
                    >
                      Review KYC
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Dashboard sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View overall statistics and analytics
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      variant="contained"
                      color="info"
                      fullWidth
                      onClick={() => handleNavigate(ROUTES.DASHBOARD)}
                    >
                      View Dashboard
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Buyers Tab */}
        <TabPanel value={value} index={1}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Buyers Management
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Manage buyer accounts, orders, inventory, and monitor buyer activity.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <ShoppingCart sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      View All Buyers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browse and manage all registered buyers in the system
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      variant="contained"
                      color="secondary"
                      fullWidth
                      onClick={() => handleNavigate(ROUTES.BUYERS)}
                    >
                      Go to Buyers
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <ShoppingCart sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Orders Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View and manage all orders from buyers
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => handleNavigate(ROUTES.ORDERS)}
                    >
                      View Orders
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Inventory sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Inventory
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage buyer inventory and stock levels
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="large"
                      variant="contained"
                      color="info"
                      fullWidth
                      onClick={() => handleNavigate(ROUTES.INVENTORY)}
                    >
                      View Inventory
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* About Us Tab */}
        <TabPanel value={value} index={2}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              About Munda Market
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Learn more about our platform and mission.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Our Mission
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Munda Market is a digital marketplace designed to connect farmers directly
                      with buyers, eliminating intermediaries and ensuring fair prices for fresh
                      produce. We empower farmers to reach a wider market while providing buyers
                      with quality, traceable agricultural products.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      For Farmers
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Direct access to buyers and markets
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Fair pricing and transparent transactions
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Production planning and farm management tools
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Timely payments and financial tracking
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      For Buyers
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Quality, fresh produce from verified farmers
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Transparent pricing and order tracking
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Inventory management tools
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Reliable supply chain and delivery
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Admin Console Features
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <People color="primary" />
                          <Typography variant="body2">User Management</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VerifiedUser color="warning" />
                          <Typography variant="body2">KYC Verification</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ShoppingCart color="secondary" />
                          <Typography variant="body2">Order Processing</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AttachMoney color="success" />
                          <Typography variant="body2">Payment Management</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}

