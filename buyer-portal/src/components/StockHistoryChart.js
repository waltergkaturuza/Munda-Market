import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function StockHistoryChart({ cropId, cropName, historyData }) {
  const [days, setDays] = React.useState(30);

  if (!historyData || historyData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Stock History: {cropName}
          </Typography>
          <Typography color="text.secondary">
            No historical data available yet. Data will appear after the system records stock levels.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = historyData.map((record) => ({
    date: new Date(record.recorded_at).toLocaleDateString(),
    stock: record.remaining_kg.toFixed(1),
    price: record.avg_price_per_kg ? record.avg_price_per_kg.toFixed(2) : null,
  }));

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Stock History: {cropName}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={days}
              label="Period"
              onChange={(e) => setDays(e.target.value)}
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
              <MenuItem value={180}>180 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Stock (kg)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Price ($)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="stock"
              stroke="#8884d8"
              name="Stock (kg)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              stroke="#82ca9d"
              name="Avg Price ($/kg)"
              strokeWidth={2}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

