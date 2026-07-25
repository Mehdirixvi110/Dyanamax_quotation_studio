import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Description as QuotationIcon,
  Inventory as ItemsIcon,
  People as CustomersIcon,
  AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardStats, useRecentQuotations, useMonthlyActivity } from '../hooks/useDashboard';
import type { QuotationStatus } from '../types';

const statusColors: Record<QuotationStatus, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
  draft: 'default',
  published: 'info',
  client_viewed: 'secondary',
  client_submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  expired: 'default',
  archived: 'default',
};

const statusLabels: Record<QuotationStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  client_viewed: 'Viewed',
  client_submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  archived: 'Archived',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </Box>
        <Box>
          {loading ? (
            <>
              <Skeleton width={60} height={32} />
              <Skeleton width={100} height={20} />
            </>
          ) : (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentQuotations, isLoading: quotationsLoading } = useRecentQuotations();
  const { data: monthlyActivity, isLoading: chartLoading } = useMonthlyActivity();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Overview of your quotation business
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Quotations"
            value={stats?.totalQuotations ?? 0}
            icon={<QuotationIcon fontSize="large" />}
            color="#1B3A5C"
            loading={statsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Items"
            value={stats?.totalItems ?? 0}
            icon={<ItemsIcon fontSize="large" />}
            color="#E8A838"
            loading={statsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers ?? 0}
            icon={<CustomersIcon fontSize="large" />}
            color="#2E7D32"
            loading={statsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Revenue"
            value={stats ? formatCurrency(stats.totalRevenue) : '—'}
            icon={<RevenueIcon fontSize="large" />}
            color="#0288D1"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Charts and Recent Quotations */}
      <Grid container spacing={3}>
        {/* Monthly Activity Chart */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Monthly Activity
              </Typography>
              {chartLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                        return [value, 'Quotations'];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="quotations" fill="#1B3A5C" radius={[4, 4, 0, 0]} name="Quotations" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#E8A838" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Quotations */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Quotations
              </Typography>
              {quotationsLoading ? (
                <Box>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Reference</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentQuotations?.map((q) => (
                        <TableRow key={q.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {q.referenceNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(q.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                              {q.customerName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabels[(q.status?.toLowerCase() ?? 'draft') as QuotationStatus] ?? q.status}
                              color={statusColors[(q.status?.toLowerCase() ?? 'draft') as QuotationStatus] ?? 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatCurrency(q.grandTotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
