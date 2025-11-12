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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi, SendMessageRequest } from '@/api/messaging';

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  SENT: 'info',
  DELIVERED: 'success',
  FAILED: 'error',
};

export default function MessagingPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SendMessageRequest>({
    recipient_user_ids: [],
    channel: 'SMS',
    message_body: '',
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: messagingApi.getMessages,
  });

  const sendMutation = useMutation({
    mutationFn: messagingApi.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      recipient_user_ids: [],
      channel: 'SMS',
      message_body: '',
    });
  };

  const handleSend = () => {
    sendMutation.mutate(formData);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Messaging
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Send WhatsApp/SMS notifications to farmers and buyers
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Send />} onClick={() => setDialogOpen(true)}>
          Send Message
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Message ID</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sent At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <TableRow key={message.message_id}>
                  <TableCell>#{message.message_id}</TableCell>
                  <TableCell>
                    {message.recipient_name || message.recipient_phone || `User #${message.recipient_user_id}`}
                  </TableCell>
                  <TableCell>
                    <Chip label={message.channel} size="small" />
                  </TableCell>
                  <TableCell>{message.message_body.substring(0, 50)}...</TableCell>
                  <TableCell>
                    <Chip
                      label={message.status}
                      size="small"
                      color={statusColors[message.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {message.sent_at ? new Date(message.sent_at).toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No messages sent yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={formData.channel}
                label="Channel"
                onChange={(e) =>
                  setFormData({ ...formData, channel: e.target.value as 'SMS' | 'WHATSAPP' | 'EMAIL' })
                }
              >
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Recipient User IDs (comma-separated)"
              value={formData.recipient_user_ids.join(',')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipient_user_ids: e.target.value
                    .split(',')
                    .filter((id) => id.trim())
                    .map((id) => Number(id.trim())),
                })
              }
              placeholder="1,2,3"
              helperText="Enter user IDs separated by commas"
            />

            <TextField
              label="Message"
              multiline
              rows={6}
              value={formData.message_body}
              onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
              placeholder="Enter your message here..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={
              sendMutation.isPending ||
              !formData.message_body ||
              formData.recipient_user_ids.length === 0
            }
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
