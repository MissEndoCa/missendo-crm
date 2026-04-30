import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
  organizationId?: string | null;
  isSuperAdmin: boolean;
  organizations: { id: string; name: string }[];
  createdBy?: string;
}

type FieldKey = 'first_name' | 'last_name' | 'full_name' | 'email' | 'phone' | 'country' | 'source' | 'notes' | 'ignore';

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: 'ignore', label: '— Ignore —' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'full_name', label: 'Full Name (will be split)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'country', label: 'Country' },
  { value: 'source', label: 'Source / Campaign' },
  { value: 'notes', label: 'Notes' },
];

// Smart auto-detection from common Facebook Lead Ads / generic CSV column names
function autoDetect(header: string): FieldKey {
  const h = header.toLowerCase().trim().replace(/[_\s-]+/g, '');
  if (['firstname', 'fname', 'givenname', 'ad', 'isim'].includes(h)) return 'first_name';
  if (['lastname', 'lname', 'surname', 'familyname', 'soyad'].includes(h)) return 'last_name';
  if (['fullname', 'name', 'adsoyad'].includes(h)) return 'full_name';
  if (['email', 'emailaddress', 'eposta', 'mail'].includes(h)) return 'email';
  if (['phone', 'phonenumber', 'mobile', 'cellphone', 'telefon', 'tel', 'gsm'].includes(h)) return 'phone';
  if (['country', 'countryname', 'ulke'].includes(h)) return 'country';
  if (['source', 'campaign', 'campaignname', 'adname', 'formname', 'platform'].includes(h)) return 'source';
  if (['notes', 'note', 'comment', 'message', 'aciklama'].includes(h)) return 'notes';
  return 'ignore';
}

interface ParsedRow {
  raw: Record<string, any>;
  mapped: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    country: string | null;
    source: string | null;
    notes: string | null;
  };
  duplicateOf?: { id: string; first_name: string; last_name: string; phone: string; email: string | null };
  decision?: 'import' | 'skip';
}

export function LeadImportDialog({ open, onOpenChange, onImported, organizationId, isSuperAdmin, organizations, createdBy }: Props) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'duplicates' | 'importing' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [targetOrgId, setTargetOrgId] = useState<string>(organizationId || '');
  const [defaultSource, setDefaultSource] = useState<string>('Facebook');
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setStep('upload');
    setHeaders([]); setRows([]); setMapping({}); setParsedRows([]);
    setProgress({ done: 0, total: 0, errors: 0 });
    setBusy(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (file: File) => {
    try {
      setBusy(true);
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '', raw: false });
      if (json.length === 0) {
        toast({ title: 'Empty file', description: 'No rows found in the file', variant: 'destructive' });
        setBusy(false);
        return;
      }
      const hdrs = Object.keys(json[0]);
      const initialMapping: Record<string, FieldKey> = {};
      hdrs.forEach(h => { initialMapping[h] = autoDetect(h); });
      setHeaders(hdrs);
      setRows(json);
      setMapping(initialMapping);
      setStep('mapping');
    } catch (e) {
      console.error(e);
      toast({ title: 'Parse error', description: 'Could not read the file. Please use CSV or Excel.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const previewMapped = useMemo(() => {
    return rows.slice(0, 5).map(r => mapRow(r, mapping, defaultSource));
  }, [rows, mapping, defaultSource]);

  const proceedToDuplicateCheck = async () => {
    // Validate: must have at least phone or email mapped, and a name source
    const mapped = Object.values(mapping);
    const hasName = mapped.includes('first_name') || mapped.includes('full_name');
    const hasPhone = mapped.includes('phone');
    if (!hasName) {
      toast({ title: 'Missing mapping', description: 'Map at least one column to Name.', variant: 'destructive' });
      return;
    }
    if (!hasPhone) {
      toast({ title: 'Missing mapping', description: 'Map a column to Phone.', variant: 'destructive' });
      return;
    }
    if (isSuperAdmin && !targetOrgId) {
      toast({ title: 'Pick clinic', description: 'Select a target clinic for these leads.', variant: 'destructive' });
      return;
    }

    setBusy(true);
    try {
      const allMapped: ParsedRow[] = rows.map(r => ({ raw: r, mapped: mapRow(r, mapping, defaultSource) }));

      // Filter out rows with missing required fields
      const valid = allMapped.filter(r => r.mapped.phone && (r.mapped.first_name || r.mapped.last_name));
      const invalid = allMapped.length - valid.length;

      // Check duplicates against DB by phone/email
      const phones = [...new Set(valid.map(r => r.mapped.phone).filter(Boolean))];
      const emails = [...new Set(valid.map(r => r.mapped.email).filter((e): e is string => !!e))];

      const orgFilter = isSuperAdmin ? targetOrgId : organizationId;
      let existing: any[] = [];
      if (phones.length > 0) {
        const { data } = await supabase
          .from('leads')
          .select('id,first_name,last_name,phone,email,organization_id')
          .eq('organization_id', orgFilter!)
          .in('phone', phones);
        if (data) existing = existing.concat(data);
      }
      if (emails.length > 0) {
        const { data } = await supabase
          .from('leads')
          .select('id,first_name,last_name,phone,email,organization_id')
          .eq('organization_id', orgFilter!)
          .in('email', emails);
        if (data) existing = existing.concat(data);
      }

      const dupByPhone = new Map<string, any>();
      const dupByEmail = new Map<string, any>();
      existing.forEach(e => {
        if (e.phone) dupByPhone.set(e.phone, e);
        if (e.email) dupByEmail.set(e.email.toLowerCase(), e);
      });

      const finalRows: ParsedRow[] = valid.map(r => {
        const dup = dupByPhone.get(r.mapped.phone) || (r.mapped.email ? dupByEmail.get(r.mapped.email.toLowerCase()) : null);
        return { ...r, duplicateOf: dup, decision: dup ? undefined : 'import' };
      });

      setParsedRows(finalRows);
      const dupCount = finalRows.filter(r => r.duplicateOf).length;

      if (invalid > 0) {
        toast({ title: `${invalid} rows skipped`, description: 'Missing phone or name.' });
      }

      if (dupCount > 0) {
        setStep('duplicates');
      } else {
        // Go straight to import
        await runImport(finalRows);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to check duplicates', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const setDuplicateDecision = (idx: number, decision: 'import' | 'skip') => {
    setParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, decision } : r));
  };

  const setAllDuplicates = (decision: 'import' | 'skip') => {
    setParsedRows(prev => prev.map(r => r.duplicateOf ? { ...r, decision } : r));
  };

  const runImport = async (rowsToProcess: ParsedRow[]) => {
    const toImport = rowsToProcess.filter(r => r.decision === 'import');
    if (toImport.length === 0) {
      toast({ title: 'Nothing to import', description: 'All rows were skipped.' });
      setStep('done');
      return;
    }

    setStep('importing');
    setProgress({ done: 0, total: toImport.length, errors: 0 });
    const orgId = isSuperAdmin ? targetOrgId : organizationId;

    let done = 0, errors = 0;
    const BATCH = 100;
    for (let i = 0; i < toImport.length; i += BATCH) {
      const batch = toImport.slice(i, i + BATCH).map(r => ({
        first_name: r.mapped.first_name,
        last_name: r.mapped.last_name,
        email: r.mapped.email,
        phone: r.mapped.phone,
        country: r.mapped.country,
        source: r.mapped.source,
        notes: r.mapped.notes,
        status: 'new' as const,
        organization_id: orgId!,
        assigned_by_missendo: isSuperAdmin,
        created_by: createdBy,
      }));
      const { error } = await supabase.from('leads').insert(batch);
      if (error) {
        console.error('Batch insert error', error);
        errors += batch.length;
      } else {
        done += batch.length;
      }
      setProgress({ done, total: toImport.length, errors });
    }

    toast({
      title: 'Import complete',
      description: `${done} imported${errors > 0 ? `, ${errors} failed` : ''}.`,
    });
    setStep('done');
    onImported();
  };

  const proceedFromDuplicates = async () => {
    const undecided = parsedRows.filter(r => r.duplicateOf && !r.decision);
    if (undecided.length > 0) {
      toast({ title: 'Action required', description: `Decide on ${undecided.length} duplicate(s) first.`, variant: 'destructive' });
      return;
    }
    await runImport(parsedRows);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" /> Import Leads from CSV / Excel
          </DialogTitle>
          <DialogDescription>
            Upload a file exported from Facebook Leads Center, Excel, or any CSV. Columns are auto-detected.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/30 transition">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Click to select a file</p>
                <p className="text-sm text-muted-foreground">CSV, XLSX or XLS</p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Reading file…</div>}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isSuperAdmin && (
                <div>
                  <Label>Target Clinic</Label>
                  <Select value={targetOrgId} onValueChange={setTargetOrgId}>
                    <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Default Source (if column not mapped)</Label>
                <Input value={defaultSource} onChange={e => setDefaultSource(e.target.value)} placeholder="e.g. Facebook" />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Column Mapping ({rows.length} rows detected)</Label>
              <ScrollArea className="max-h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CSV Column</TableHead>
                      <TableHead>Sample</TableHead>
                      <TableHead>Maps to</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headers.map(h => (
                      <TableRow key={h}>
                        <TableCell className="font-mono text-xs">{h}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {String(rows[0]?.[h] ?? '')}
                        </TableCell>
                        <TableCell>
                          <Select value={mapping[h]} onValueChange={(v) => setMapping(prev => ({ ...prev, [h]: v as FieldKey }))}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div>
              <Label className="mb-2 block">Preview (first 5 rows)</Label>
              <ScrollArea className="max-h-48 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewMapped.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{`${m.first_name} ${m.last_name}`.trim() || <span className="text-destructive">missing</span>}</TableCell>
                        <TableCell className="text-xs">{m.phone || <span className="text-destructive">missing</span>}</TableCell>
                        <TableCell className="text-xs">{m.email || '—'}</TableCell>
                        <TableCell className="text-xs">{m.country || '—'}</TableCell>
                        <TableCell className="text-xs">{m.source || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={proceedToDuplicateCheck} disabled={busy}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking…</> : 'Continue'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'duplicates' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm">
                Found <strong>{parsedRows.filter(r => r.duplicateOf).length}</strong> rows that match existing leads (by phone or email). Decide what to do for each:
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAllDuplicates('skip')}>Skip all duplicates</Button>
              <Button size="sm" variant="outline" onClick={() => setAllDuplicates('import')}>Import all anyway</Button>
            </div>

            <ScrollArea className="max-h-96 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>New Lead (from CSV)</TableHead>
                    <TableHead>Existing Lead (in CRM)</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((r, i) => r.duplicateOf && (
                    <TableRow key={i}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.mapped.first_name} {r.mapped.last_name}</div>
                        <div className="text-muted-foreground">{r.mapped.phone}</div>
                        {r.mapped.email && <div className="text-muted-foreground">{r.mapped.email}</div>}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.duplicateOf.first_name} {r.duplicateOf.last_name}</div>
                        <div className="text-muted-foreground">{r.duplicateOf.phone}</div>
                        {r.duplicateOf.email && <div className="text-muted-foreground">{r.duplicateOf.email}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={r.decision === 'skip' ? 'default' : 'outline'}
                            onClick={() => setDuplicateDecision(i, 'skip')}
                          >Skip</Button>
                          <Button
                            size="sm"
                            variant={r.decision === 'import' ? 'default' : 'outline'}
                            onClick={() => setDuplicateDecision(i, 'import')}
                          >Import</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between text-sm text-muted-foreground">
              <div>
                <Badge variant="secondary">{parsedRows.filter(r => r.decision === 'import').length}</Badge> will be imported
              </div>
              <div>
                <Badge variant="secondary">{parsedRows.filter(r => r.decision === 'skip').length}</Badge> will be skipped
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button onClick={proceedFromDuplicates}>Start Import</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-10 space-y-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <div>
              <div className="font-medium">Importing leads…</div>
              <div className="text-sm text-muted-foreground">
                {progress.done} / {progress.total}{progress.errors > 0 ? ` (${progress.errors} failed)` : ''}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress.total ? (progress.done + progress.errors) / progress.total * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="py-10 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
            <div>
              <div className="font-medium text-lg">Import complete</div>
              <div className="text-sm text-muted-foreground">
                {progress.done} leads imported{progress.errors > 0 ? `, ${progress.errors} failed` : ''}.
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => handleClose(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function mapRow(raw: Record<string, any>, mapping: Record<string, FieldKey>, defaultSource: string) {
  let first_name = '', last_name = '', email: string | null = null, phone = '', country: string | null = null, source: string | null = null, notes: string | null = null;

  for (const [col, field] of Object.entries(mapping)) {
    const val = String(raw[col] ?? '').trim();
    if (!val || field === 'ignore') continue;
    switch (field) {
      case 'first_name': first_name = val; break;
      case 'last_name': last_name = val; break;
      case 'full_name': {
        const parts = val.split(/\s+/);
        first_name = first_name || parts[0] || '';
        last_name = last_name || parts.slice(1).join(' ') || '';
        break;
      }
      case 'email': email = val.toLowerCase(); break;
      case 'phone': phone = val.replace(/[^\d+]/g, ''); break;
      case 'country': country = val; break;
      case 'source': source = val; break;
      case 'notes': notes = val; break;
    }
  }
  if (!source && defaultSource) source = defaultSource;
  return { first_name, last_name, email, phone, country, source, notes };
}
