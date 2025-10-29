import React, { useEffect, useState } from 'react';
import { Typography, Box, Grid, Card, CardContent, Chip, TextField, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchAnalyticsSummary } from '../services/analytics';

const sampleData = [
  { name: 'Jan', spend: 400 },
  { name: 'Feb', spend: 320 },
  { name: 'Mar', spend: 520 },
  { name: 'Apr', spend: 280 },
  { name: 'May', spend: 610 },
  { name: 'Jun', spend: 480 },
];

const COLORS = ['#2e7d32', '#66bb6a', '#43a047', '#8bc34a', '#9ccc65', '#aed581'];

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchAnalyticsSummary({ start: start || undefined, end: end || undefined });
      setSummary(data);
    };
    load();
  }, [start, end]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Start (YYYY-MM-DD)" size="small" value={start} onChange={(e) => setStart(e.target.value)} />
        <TextField label="End (YYYY-MM-DD)" size="small" value={end} onChange={(e) => setEnd(e.target.value)} />
      </Box>

      {summary && (
        <Grid container spacing={3}>
          {/* KPI cards */}
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="overline" color="text.secondary">Total Spend</Typography>
              <Typography variant="h5">${summary.kpis.total_spend.toFixed(2)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="overline" color="text.secondary">Total Orders</Typography>
              <Typography variant="h5">{summary.kpis.total_orders}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="overline" color="text.secondary">Total Volume (kg)</Typography>
              <Typography variant="h5">{summary.kpis.total_kg}</Typography>
            </CardContent></Card>
          </Grid>

          {/* Monthly spend line */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Monthly Spend</Typography>
                <Button size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/analytics/monthly_spend.csv`, '_blank')}>Export CSV</Button>
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={summary.monthly_spend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="spend" stroke="#2e7d32" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top crops bar */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Top Crops (Spend)</Typography>
                <Button size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/analytics/top_crops.csv`, '_blank')}>Export CSV</Button>
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={summary.top_crops} layout="vertical" margin={{ left: 16 }}>
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#66bb6a" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Status distribution pie */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Order Status</Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={summary.status_distribution} dataKey="count" nameKey="status" innerRadius={60} outerRadius={100} label>
                        {summary.status_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Average price per crop */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Average Price (/kg)</Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={summary.avg_price}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="price" fill="#43a047" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {/* Lead time histogram */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Lead Time (days)</Typography>
                <Button size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/analytics/lead_time.csv`, '_blank')}>Export CSV</Button>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={summary.lead_time_hist}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="days" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8bc34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Margin trend */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Avg Margin (%)</Typography>
                <Button size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/analytics/margin.csv`, '_blank')}>Export CSV</Button>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={summary.margin_series}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `${Math.round(v*100)}%`} />
                      <Tooltip formatter={(v) => `${Math.round(v*100)}%`} />
                      <Line type="monotone" dataKey="margin" stroke="#2e7d32" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cohort table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h6">Cohort Retention (orders)</Typography>
                  <Button size="small" variant="outlined" onClick={() => window.open(`${window.location.origin.replace('3000','8000')}/api/v1/analytics/cohorts.csv`, '_blank')}>Export CSV</Button>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8 }}>Cohort</th>
                        {[0,1,2,3,4,5].map((m) => (
                          <th key={m} style={{ padding: 8 }}>M+{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.cohorts && summary.cohorts.length > 0 ? summary.cohorts.map((row) => (
                        <tr key={row.cohort}>
                          <td style={{ padding: 8 }}>{row.cohort}</td>
                          {[0,1,2,3,4,5].map((m) => (
                            <td key={m} style={{ padding: 8, textAlign: 'center' }}>{row[`m${m}`] || 0}</td>
                          ))}
                        </tr>
                      )) : (
                        <tr><td colSpan="7" style={{ padding: 8, textAlign: 'center' }}>No cohort data available</td></tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      </Box>
  );
}

export default Analytics;


