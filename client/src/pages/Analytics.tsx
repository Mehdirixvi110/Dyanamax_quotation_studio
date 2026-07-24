import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  TrendingUp as ConversionIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useDashboardStats, useMonthlyActivity } from '../hooks/useDashboard';
import {
  useStatusBreakdown,
  useTopItems,
  useRevenueByCustomer,
} from '../hooks/useAnalytics';

const PIE_COLORS = [
  '#1B3A5C',
  '#E8A838',
  '#2E7D32',
  '#0288D1',
  '#C62828',
  '#7B1FA2',
  '#00838F',
  '#EF6C00',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

export function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyActivity();
  const { data: statusData, isLoading: statusLoading } = useStatusBreakdown();
  const { data: topItems, isLoading: itemsLoading } = useTopItems();
  const { data: revenueByCustomer, isLoading: customersLoading } = useRevenueByCustomer();

  const pieData = statusData?.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' '),
    value: s.count,
  })) ?? [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Analytics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Business insights and reports
      </Typography>

      {/* Row 1: Stat Cards */}
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
            title="Conversion Rate"
            value={stats ? `${stats.conversionRate}%` : '—'}
            icon={<ConversionIcon fontSize="large" />}
            color="#0288D1"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Row 2: Monthly Revenue + Status Pie */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Monthly Revenue
              </Typography>
              {monthlyLoading ? (
                <Skeleton variant="rectangular" height={320} />
              ) : monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}M`
                          : v >= 1000
                            ? `${(v / 1000).toFixed(0)}K`
                            : `${v}`
                      }
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                        return [value, 'Quotations'];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1B3A5C" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="quotations" fill="#E8A838" radius={[4, 4, 0, 0]} name="Quotations" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No monthly data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Status Breakdown
              </Typography>
              {statusLoading ? (
                <Skeleton variant="rectangular" height={320} />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_entry, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [value, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No status data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Top Items + Top Customers */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Top Items (by Usage)
              </Typography>
              {itemsLoading ? (
                <Box>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : topItems && topItems.length > 0 ? (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Item Title</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Usage</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topItems.map((item, idx) => (
                        <TableRow key={item.title} hover>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {item.title}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.usageCount}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.totalRevenue)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No item data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Top Customers (by Revenue)
              </Typography>
              {customersLoading ? (
                <Box>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : revenueByCustomer && revenueByCustomer.length > 0 ? (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Quotations</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenueByCustomer.map((customer, idx) => (
                        <TableRow key={customer.customerName} hover>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {customer.customerName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{customer.quotationCount}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(customer.totalRevenue)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No customer data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
