import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardMedia,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import {
  Close,
  Info,
  CheckCircle,
  Warning,
  Error,
  Campaign,
} from '@mui/icons-material';
import { Banner as BannerType } from '@/types';

interface BannerProps {
  banner: BannerType;
  onDismiss?: (bannerId: number) => void;
}

const bannerIcons = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: Error,
  promotion: Campaign,
};

const bannerColors = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  promotion: 'primary',
} as const;

export default function Banner({ banner, onDismiss }: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const Icon = bannerIcons[banner.banner_type] || Info;
  const color = bannerColors[banner.banner_type] || 'info';

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss(banner.banner_id);
    }
  };

  if (dismissed) {
    return null;
  }

  // Promotion banners with images get special treatment
  if (banner.banner_type === 'promotion' && banner.image_url) {
    return (
      <Card
        sx={{
          mb: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {banner.image_url && (
          <CardMedia
            component="img"
            height="200"
            image={banner.image_url}
            alt={banner.title}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {banner.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {banner.message}
              </Typography>
              {banner.link_url && banner.link_text && (
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  href={banner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 1 }}
                >
                  {banner.link_text}
                </Button>
              )}
            </Box>
            {banner.is_dismissible && (
              <IconButton
                size="small"
                onClick={handleDismiss}
                sx={{ ml: 1 }}
                aria-label="Dismiss banner"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </Box>
      </Card>
    );
  }

  // Standard alert-style banners
  return (
    <Alert
      severity={color as 'info' | 'success' | 'warning' | 'error'}
      icon={<Icon />}
      action={
        banner.is_dismissible ? (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleDismiss}
          >
            <Close fontSize="inherit" />
          </IconButton>
        ) : null
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle>{banner.title}</AlertTitle>
      <Typography variant="body2" component="div">
        {banner.message}
        {banner.link_url && banner.link_text && (
          <Link
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ ml: 1, fontWeight: 'bold' }}
          >
            {banner.link_text} →
          </Link>
        )}
      </Typography>
    </Alert>
  );
}

