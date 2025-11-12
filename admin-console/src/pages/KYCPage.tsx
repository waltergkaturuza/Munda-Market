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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycApi } from '@/api/kyc';
import { KYCSubmission } from '@/types';

export default function KYCPage() {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: kycApi.getPendingSubmissions,
  });

  const reviewMutation = useMutation({
    mutationFn: kycApi.approveSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });
      setDialogOpen(false);
      setSelectedSubmission(null);
      setNotes('');
    },
  });

  const handleOpenDialog = (submission: KYCSubmission, type: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setActionType(type);
    setDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedSubmission) return;

    reviewMutation.mutate({
      user_id: selectedSubmission.user_id,
      approved: actionType === 'approve',
      notes: notes || undefined,
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        KYC Queue
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Review and approve farmer/buyer verification documents
      </Typography>

      {submissions && submissions.length === 0 && (
        <Alert severity="info">No pending KYC submissions at this time.</Alert>
      )}

      {submissions && submissions.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.user_id}>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell>{submission.phone}</TableCell>
                  <TableCell>{submission.email || '-'}</TableCell>
                  <TableCell>
                    <Chip label={submission.role} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={submission.status}
                      size="small"
                      color={submission.status === 'PENDING' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      sx={{ mr: 1 }}
                      onClick={() => handleOpenDialog(submission, 'approve')}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircle />}
                      sx={{ mr: 1 }}
                      onClick={() => handleOpenDialog(submission, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleOpenDialog(submission, 'reject')}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : 'Reject'} KYC Submission
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Name:</strong> {selectedSubmission.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Phone:</strong> {selectedSubmission.phone}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {selectedSubmission.email || 'N/A'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Role:</strong> {selectedSubmission.role}
              </Typography>

              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                placeholder="Add review notes..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending
              ? 'Processing...'
              : actionType === 'approve'
                ? 'Approve'
                : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
