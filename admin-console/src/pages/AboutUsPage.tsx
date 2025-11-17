import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  People,
  ShoppingCart,
  VerifiedUser,
  AttachMoney,
  LocalShipping,
  Analytics,
} from '@mui/icons-material';

export default function AboutUsPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
          About Munda Market
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Digital marketplace connecting farmers and buyers
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Mission Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Our Mission
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              Munda Market is a digital marketplace designed to revolutionize the agricultural
              supply chain in Zimbabwe. We connect farmers directly with buyers, eliminating
              intermediaries and ensuring fair prices for fresh produce. Our platform empowers
              farmers to reach a wider market while providing buyers with quality, traceable
              agricultural products.
            </Typography>
          </Paper>
        </Grid>

        {/* Features Grid */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Platform Features
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Farmer Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive tools for managing farmer accounts, farms, production plans, and
                monitoring farmer activity across the platform.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <ShoppingCart sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Buyer Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete buyer account management, order processing, inventory tracking, and
                buyer activity monitoring.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <VerifiedUser sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                KYC Verification
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Robust Know Your Customer (KYC) process to verify and approve farmer and buyer
                registrations, ensuring platform security and trust.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <AttachMoney sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Payment & Payouts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure payment processing for buyers and timely payout management for farmers,
                with comprehensive financial tracking and reporting.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <LocalShipping sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Order Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                End-to-end order processing from creation to delivery, with real-time tracking
                and status updates for all stakeholders.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Analytics sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Analytics & Reporting
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive dashboard with real-time statistics, analytics, and reporting
                tools to monitor platform performance and make data-driven decisions.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Benefits Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, mt: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Benefits
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                  For Farmers
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body1" paragraph>
                    Direct access to buyers and markets without intermediaries
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Fair pricing and transparent transaction history
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Production planning and farm management tools
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Timely payments and comprehensive financial tracking
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Access to market insights and demand forecasting
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="secondary">
                  For Buyers
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body1" paragraph>
                    Quality, fresh produce from verified farmers
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Transparent pricing and order tracking
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Inventory management and stock tracking tools
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Reliable supply chain and delivery management
                  </Typography>
                  <Typography component="li" variant="body1" paragraph>
                    Direct communication with farmers
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Contact/Support Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Need Help?
            </Typography>
            <Typography variant="body1" paragraph>
              For support, questions, or feedback, please contact the platform administrators
              or use the messaging system within the admin console.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

