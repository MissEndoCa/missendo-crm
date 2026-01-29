import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, Search, Filter, Eye, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  user_id: string | null;
  user_email: string | null;
  organization_id: string | null;
  created_at: string;
}

const TABLE_LABELS: Record<string, string> = {
  patients: 'Patients',
  appointments: 'Appointments',
  patient_documents: 'Documents',
  patient_notes: 'Notes',
  patient_payments: 'Payments',
  patient_transfers: 'Transfers',
  leads: 'Leads',
  treatments: 'Treatments',
  hotels: 'Hotels',
  organizations: 'Organizations',
  profiles: 'Users',
};

const ACTION_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof Plus }> = {
  INSERT: { label: 'Created', variant: 'default', icon: Plus },
  UPDATE: { label: 'Updated', variant: 'secondary', icon: Pencil },
  DELETE: { label: 'Deleted', variant: 'destructive', icon: Trash2 },
};

export function ActivityLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadLogs();
  }, [tableFilter, actionFilter, dateFrom, dateTo, page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (tableFilter && tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      if (actionFilter && actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`);
      }

      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedData: AuditLog[] = (data || []).map((item: any) => ({
        id: item.id,
        table_name: item.table_name,
        record_id: item.record_id,
        action: item.action,
        old_data: item.old_data as Record<string, any> | null,
        new_data: item.new_data as Record<string, any> | null,
        user_id: item.user_id,
        user_email: item.user_email,
        organization_id: item.organization_id,
        created_at: item.created_at,
      }));

      if (page === 0) {
        setLogs(mappedData);
      } else {
        setLogs(prev => [...prev, ...mappedData]);
      }
      
      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    loadLogs();
  };

  const getRecordSummary = (log: AuditLog): string => {
    const data = log.new_data || log.old_data;
    if (!data) return '-';

    // Try to find a meaningful identifier
    if (data.first_name && data.last_name) {
      return `${data.first_name} ${data.last_name}`;
    }
    if (data.name) return data.name;
    if (data.title) return data.title;
    if (data.document_name) return data.document_name;
    if (data.hotel_name) return data.hotel_name;
    if (data.email) return data.email;
    
    return log.record_id?.slice(0, 8) || '-';
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const summary = getRecordSummary(log).toLowerCase();
    const email = log.user_email?.toLowerCase() || '';
    const tableName = (TABLE_LABELS[log.table_name] || log.table_name).toLowerCase();
    
    return summary.includes(searchLower) || 
           email.includes(searchLower) || 
           tableName.includes(searchLower);
  });

  const renderJsonDiff = (log: AuditLog) => {
    if (log.action === 'INSERT') {
      return (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-primary">Created Data:</h4>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-96">
            {JSON.stringify(log.new_data, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === 'DELETE') {
      return (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-destructive">Deleted Data:</h4>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-96">
            {JSON.stringify(log.old_data, null, 2)}
          </pre>
        </div>
      );
    }

    // UPDATE - show diff
    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const changedFields: { key: string; old: any; new: any }[] = [];

    allKeys.forEach(key => {
      if (key === 'updated_at') return; // Skip timestamp fields
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changedFields.push({ key, old: oldData[key], new: newData[key] });
      }
    });

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Changed Fields:</h4>
        {changedFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No significant changes detected</p>
        ) : (
          <div className="space-y-2">
            {changedFields.map(({ key, old, new: newVal }) => (
              <div key={key} className="border rounded-md p-2 text-xs">
                <span className="font-medium text-primary">{key}:</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="bg-destructive/10 p-2 rounded">
                    <span className="text-destructive font-medium">Old:</span>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                      {typeof old === 'object' ? JSON.stringify(old, null, 2) : String(old ?? 'null')}
                    </pre>
                  </div>
                  <div className="bg-primary/10 p-2 rounded">
                    <span className="text-primary font-medium">New:</span>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                      {typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : String(newVal ?? 'null')}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Activity Logs
        </CardTitle>
        <CardDescription>
          Track all changes made to the system (who added, edited, or deleted what)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {Object.entries(TABLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">From:</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="w-full sm:w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">To:</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="w-full sm:w-auto"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
            >
              Clear Dates
            </Button>
          )}
        </div>

        {/* Logs Table */}
        <ScrollArea className="h-[500px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Date & Time</TableHead>
                <TableHead className="w-24">Action</TableHead>
                <TableHead className="w-28">Table</TableHead>
                <TableHead>Record</TableHead>
                <TableHead className="w-48">User</TableHead>
                <TableHead className="w-16">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && page === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const actionConfig = ACTION_CONFIG[log.action];
                  const ActionIcon = actionConfig.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionConfig.variant} className="gap-1">
                          <ActionIcon className="w-3 h-3" />
                          {actionConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {TABLE_LABELS[log.table_name] || log.table_name}
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-48">
                        {getRecordSummary(log)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-48">
                        {log.user_email || 'System'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Load More */}
        {hasMore && filteredLogs.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedLog && (
                  <>
                    <Badge variant={ACTION_CONFIG[selectedLog.action].variant}>
                      {ACTION_CONFIG[selectedLog.action].label}
                    </Badge>
                    <span>{TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}</span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), 'dd MMM yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User:</span>
                    <p className="font-medium">{selectedLog.user_email || 'System'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Record ID:</span>
                    <p className="font-medium font-mono text-xs">{selectedLog.record_id || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Record:</span>
                    <p className="font-medium">{getRecordSummary(selectedLog)}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  {renderJsonDiff(selectedLog)}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
