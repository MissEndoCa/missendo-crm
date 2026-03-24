import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart3, RefreshCw, TrendingUp, MousePointerClick, Eye, DollarSign, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CampaignInsight {
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  reach: number;
  spend: number;
  cpc: number;
  ctr: number;
  conversions: number;
}

export function AdPerformanceDashboard({ autoFetch = false }: { autoFetch?: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignInsight[]>([]);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [currency, setCurrency] = useState<string>('USD');
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-ad-insights', {
        body: { datePreset },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.currency) {
        setCurrency(data.currency);
      }
      if (data?.error) {
        setError(data.error);
        setCampaigns([]);
      } else {
        setCampaigns(data?.campaigns || []);
      }
      setHasFetched(true);
    } catch (err: any) {
      console.error('Error fetching ad insights:', err);
      setError(err.message || 'Failed to fetch ad insights');
      toast({
        title: 'Error',
        description: 'Failed to fetch ad performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount when connected
  useEffect(() => {
    if (autoFetch && !initialLoaded) {
      setInitialLoaded(true);
      fetchInsights();
    }
  }, [autoFetch, initialLoaded]);


  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      reach: acc.reach + c.reach,
      spend: acc.spend + c.spend,
      conversions: acc.conversions + c.conversions,
    }),
    { impressions: 0, clicks: 0, reach: 0, spend: 0, conversions: 0 }
  );

  const avgCtr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00';
  const avgCpc = totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : '0.00';
  const avgCpl = totals.conversions > 0 ? (totals.spend / totals.conversions).toFixed(2) : '0.00';

  const formatNumber = (n: number) => n.toLocaleString();
  const formatCurrency = (n: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Ad Performance
            </CardTitle>
            <CardDescription>
              Real-time campaign performance metrics from Facebook Ads
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7d">Last 7 Days</SelectItem>
                <SelectItem value="last_14d">Last 14 Days</SelectItem>
                <SelectItem value="last_30d">Last 30 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchInsights} disabled={loading} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 mb-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ Ad performance metrics require the <strong>ads_read</strong> permission, which is currently pending Meta App Review approval. This feature will be available once the permission is granted.
          </p>
        </div>

        {!hasFetched && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Click "Fetch Data" to load campaign performance metrics from Facebook Ads.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        )}

        {error && hasFetched && (
          <div className="text-center py-6">
            <p className="text-destructive text-sm">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Make sure Facebook is connected and an Ad Account is linked.
            </p>
          </div>
        )}

        {hasFetched && !loading && !error && campaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No campaign data found for the selected period.</p>
          </div>
        )}

        {hasFetched && !loading && campaigns.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  Impressions
                </div>
                <p className="text-lg font-bold">{formatNumber(totals.impressions)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  Clicks
                </div>
                <p className="text-lg font-bold">{formatNumber(totals.clicks)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  Reach
                </div>
                <p className="text-lg font-bold">{formatNumber(totals.reach)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="w-3.5 h-3.5" />
                  Spend
                </div>
                <p className="text-lg font-bold">{formatCurrency(totals.spend)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="w-3.5 h-3.5" />
                  Conversions
                </div>
                <p className="text-lg font-bold">{formatNumber(totals.conversions)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Avg CTR
                </div>
                <p className="text-lg font-bold">{avgCtr}%</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="w-3.5 h-3.5" />
                  Avg CPC
                </div>
                <p className="text-lg font-bold">{formatCurrency(parseFloat(avgCpc))}</p>
              </div>
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="w-3.5 h-3.5" />
                  CPL
                </div>
                <p className="text-lg font-bold">{totals.conversions > 0 ? formatCurrency(parseFloat(avgCpl)) : '—'}</p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-4">Campaign Spend & Clicks</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaigns.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="campaign_name" 
                    tick={{ fontSize: 11 }} 
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '…' : v}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => [
                      name === 'spend' ? formatCurrency(value) : formatNumber(value),
                      name === 'spend' ? 'Spend' : 'Clicks'
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="spend" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Campaign Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.campaign_id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{c.campaign_name}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.impressions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.clicks)}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.reach)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.spend)}</TableCell>
                      <TableCell className="text-right">{c.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.cpc)}</TableCell>
                      <TableCell className="text-right">{c.conversions > 0 ? formatCurrency(c.spend / c.conversions) : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={c.conversions > 0 ? 'default' : 'secondary'}>
                          {c.conversions}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
