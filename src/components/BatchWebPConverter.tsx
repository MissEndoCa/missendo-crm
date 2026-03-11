import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertToWebP } from '@/lib/imageUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileEntry {
  bucket: string;
  path: string;
  name: string;
}

const IMAGE_BUCKETS = ['patient-photos', 'avatars', 'email-assets'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif'];

export function BatchWebPConverter() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [processed, setProcessed] = useState(0);
  const [succeeded, setSucceeded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [done, setDone] = useState(false);
  const abortRef = useRef(false);

  const isImageFile = (name: string) =>
    IMAGE_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));

  const scanFiles = async () => {
    setScanning(true);
    setFiles([]);
    setDone(false);
    const found: FileEntry[] = [];

    try {
      for (const bucket of IMAGE_BUCKETS) {
        await scanBucket(bucket, '', found);
      }
      setFiles(found);
      toast({
        title: 'Scan Complete',
        description: `Found ${found.length} non-WebP image(s) to convert`,
      });
    } catch (err) {
      console.error('Scan error:', err);
      toast({ title: 'Error', description: 'Failed to scan storage', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const scanBucket = async (bucket: string, prefix: string, found: FileEntry[]) => {
    const { data, error } = await supabase.storage.from(bucket).list(prefix || undefined, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !data) return;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // it's a folder
        await scanBucket(bucket, fullPath, found);
      } else if (isImageFile(item.name)) {
        found.push({ bucket, path: fullPath, name: item.name });
      }
    }
  };

  const startConversion = async () => {
    if (files.length === 0) return;
    setConverting(true);
    setProcessed(0);
    setSucceeded(0);
    setFailed(0);
    setDone(false);
    abortRef.current = false;

    let ok = 0;
    let fail = 0;

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) break;
      const file = files[i];

      try {
        // Download original
        const { data: blob, error: dlErr } = await supabase.storage
          .from(file.bucket)
          .download(file.path);
        if (dlErr || !blob) throw dlErr || new Error('Download failed');

        const originalFile = new File([blob], file.name, { type: blob.type });
        const webpFile = await convertToWebP(originalFile, 0.85);

        // Skip if conversion returned the same file (already webp or failed)
        if (webpFile.type !== 'image/webp') {
          fail++;
          setFailed(fail);
          setProcessed(i + 1);
          continue;
        }

        const baseName = file.name.replace(/\.[^.]+$/, '');
        const newName = `${baseName}.webp`;
        const dir = file.path.includes('/')
          ? file.path.substring(0, file.path.lastIndexOf('/'))
          : '';
        const newPath = dir ? `${dir}/${newName}` : newName;

        // Upload WebP version
        const { error: upErr } = await supabase.storage
          .from(file.bucket)
          .upload(newPath, webpFile, {
            contentType: 'image/webp',
            upsert: true,
          });
        if (upErr) throw upErr;

        // Delete old file (only if new path is different)
        if (newPath !== file.path) {
          await supabase.storage.from(file.bucket).remove([file.path]);
        }

        // Update DB references
        await updateDbReferences(file.bucket, file.path, newPath);

        ok++;
        setSucceeded(ok);
      } catch (err) {
        console.warn(`Failed to convert ${file.bucket}/${file.path}:`, err);
        fail++;
        setFailed(fail);
      }

      setProcessed(i + 1);
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    setConverting(false);
    setDone(true);
    toast({
      title: 'Conversion Complete',
      description: `${ok} converted, ${fail} failed out of ${files.length} files`,
    });
  };

  const updateDbReferences = async (bucket: string, oldPath: string, newPath: string) => {
    if (oldPath === newPath) return;

    const oldUrl = getPublicUrl(bucket, oldPath);
    const newUrl = getPublicUrl(bucket, newPath);

    if (bucket === 'avatars') {
      await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('avatar_url', oldUrl);
    } else if (bucket === 'patient-photos') {
      // Update patients.photo_url
      await supabase
        .from('patients')
        .update({ photo_url: newUrl })
        .eq('photo_url', oldUrl);

      // Update patient_documents file_path
      await supabase
        .from('patient_documents')
        .update({ file_path: newPath, document_name: newPath.split('/').pop() || newPath })
        .eq('file_path', oldPath);
    }
  };

  const getPublicUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const progress = files.length > 0 ? Math.round((processed / files.length) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Batch WebP Converter
        </CardTitle>
        <CardDescription>
          Scan storage buckets and convert all existing images to WebP format for faster loading.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={scanFiles} disabled={scanning || converting} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Scan Storage'}
          </Button>

          {files.length > 0 && !converting && !done && (
            <Button onClick={startConversion}>
              Convert {files.length} Image{files.length !== 1 ? 's' : ''} to WebP
            </Button>
          )}

          {converting && (
            <Button variant="destructive" onClick={() => { abortRef.current = true; }}>
              Stop
            </Button>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Buckets: {IMAGE_BUCKETS.join(', ')}</span>
            </div>
          </div>
        )}

        {(converting || done) && (
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="flex gap-3 text-sm">
              <Badge variant="outline">{processed}/{files.length} processed</Badge>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                {succeeded} converted
              </Badge>
              {failed > 0 && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {failed} failed
                </Badge>
              )}
            </div>
            {done && (
              <p className="text-sm text-muted-foreground">
                ✅ Batch conversion finished. Database references have been updated automatically.
              </p>
            )}
          </div>
        )}

        {files.length === 0 && !scanning && (
          <p className="text-sm text-muted-foreground">
            Click "Scan Storage" to find non-WebP images in your storage buckets.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
