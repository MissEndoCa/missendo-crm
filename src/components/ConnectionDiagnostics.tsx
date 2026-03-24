import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  webhookActive: boolean;
  leadgenSubscribed: boolean;
  forms: Array<{ id: string; name: string; status: string }>;
  error?: string;
}

export function ConnectionDiagnostics({ pageId }: { pageId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const checkStatus = async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'diagnostics', pageId },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      console.error('Diagnostics error:', err);
      setResult({ webhookActive: false, leadgenSubscribed: false, forms: [], error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!pageId) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Connection Diagnostics</CardTitle>
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Check Status
          </Button>
        </div>
      </CardHeader>
      {result && (
        <CardContent className="space-y-2">
          {result.error ? (
            <p className="text-sm text-destructive">{result.error}</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {result.webhookActive ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm ${result.webhookActive ? 'text-success' : 'text-destructive'}`}>
                  {result.webhookActive ? 'Webhook subscription active' : 'Webhook subscription not found'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {result.leadgenSubscribed ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm ${result.leadgenSubscribed ? 'text-success' : 'text-destructive'}`}>
                  {result.leadgenSubscribed ? 'Leadgen field subscribed' : 'Leadgen field not subscribed'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{result.forms.length} lead form(s) found on page</span>
              </div>
              {result.forms.length > 0 && (
                <ul className="ml-6 space-y-0.5">
                  {result.forms.map((form) => (
                    <li key={form.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>•</span>
                      <span>{form.name}</span>
                      <Badge variant="outline" className="text-xs">{form.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
