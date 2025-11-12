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
  Button,
  TextField,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Download, Search } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { auditApi, AuditLogFilters } from '@/api/audit';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({});

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', appliedFilters],
    queryFn: () => auditApi.getLogs(appliedFilters),
  });

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleExport = async () => {
    try {
      const blob = await auditApi.exportLogs(appliedFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Audit Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View system activity and user actions
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>
          Export
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="User ID"
              type="number"
              value={filters.user_id || ''}
              onChange={(e) =>
                setFilters({ ...filters, user_id: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Action"
              value={filters.action || ''}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Entity Type"
              value={filters.entity_type || ''}
              onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{ height: 56 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Audit ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.audit_id}>
                    <TableCell>#{log.audit_id}</TableCell>
                    <TableCell>{log.user_name || (log.user_id ? `User #${log.user_id}` : 'System')}</TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" />
                    </TableCell>
                    <TableCell>{log.entity || '-'}</TableCell>
                    <TableCell>{log.entity_id || '-'}</TableCell>
                    <TableCell>{log.ip_address || '-'}</TableCell>
                    <TableCell>{new Date(log.ts).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
