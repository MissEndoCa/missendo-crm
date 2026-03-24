import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, FileText, Search, Download, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';

const TALX_MEDIA_ORG_ID = '5af52bad-7065-401c-a5a7-57edb73c5cce';

interface MediaDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  category: string | null;
  created_at: string | null;
  patient_id: string;
  organization_id: string;
  patient?: { first_name: string; last_name: string } | null;
}

export default function Media() {
  const { profile, isSuperAdmin, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<MediaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Only Talx Media org or super admin
  const hasAccess = profile?.email === 'info@talxmedia.com.tr';

  useEffect(() => {
    if (!hasAccess) return;
    loadDocuments();
  }, [hasAccess]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('id, document_name, document_type, file_path, file_size, category, created_at, patient_id, organization_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch patient names separately
      const patientIds = [...new Set((data || []).map(d => d.patient_id))];
      const patientMap: Record<string, { first_name: string; last_name: string }> = {};
      
      if (patientIds.length > 0) {
        // Batch in chunks of 50
        for (let i = 0; i < patientIds.length; i += 50) {
          const chunk = patientIds.slice(i, i + 50);
          const { data: patients } = await supabase
            .from('patients')
            .select('id, first_name, last_name')
            .in('id', chunk);
          (patients || []).forEach(p => { patientMap[p.id] = { first_name: p.first_name, last_name: p.last_name }; });
        }
      }

      const mapped = (data || []).map((d: any) => ({
        ...d,
        patient: patientMap[d.patient_id] || null,
      }));
      setDocuments(mapped);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const photos = useMemo(() =>
    documents.filter(d => d.category === 'photo' || d.category === 'xray'),
    [documents]
  );

  const docs = useMemo(() =>
    documents.filter(d => d.category === 'document' || (!d.category && !d.document_type?.startsWith('image/'))),
    [documents]
  );

  const filteredPhotos = useMemo(() => {
    if (!search) return photos;
    const q = search.toLowerCase();
    return photos.filter(p =>
      p.document_name.toLowerCase().includes(q) ||
      p.patient?.first_name?.toLowerCase().includes(q) ||
      p.patient?.last_name?.toLowerCase().includes(q)
    );
  }, [photos, search]);

  const filteredDocs = useMemo(() => {
    if (!search) return docs;
    const q = search.toLowerCase();
    return docs.filter(d =>
      d.document_name.toLowerCase().includes(q) ||
      d.patient?.first_name?.toLowerCase().includes(q) ||
      d.patient?.last_name?.toLowerCase().includes(q)
    );
  }, [docs, search]);

  // Create lightweight transformed preview URLs for visible photos
  useEffect(() => {
    const loadThumbnails = async () => {
      const toLoad = filteredPhotos.filter((p) => !thumbnails[p.id]).slice(0, 40);
      if (toLoad.length === 0) return;

      const entries = await Promise.all(
        toLoad.map(async (doc) => {
          const { data, error } = await supabase.storage
            .from('patient-documents')
            .createSignedUrl(doc.file_path, 60 * 60, {
              transform: {
                width: 480,
                height: 480,
                resize: 'cover',
                quality: 80,
              },
            });

          if (error || !data?.signedUrl) {
            console.error('Thumbnail URL error:', error);
            return null;
          }

          return [doc.id, data.signedUrl] as const;
        })
      );

      const newThumbs = Object.fromEntries(
        entries.filter((entry): entry is readonly [string, string] => Boolean(entry))
      );

      if (Object.keys(newThumbs).length > 0) {
        setThumbnails((prev) => ({ ...prev, ...newThumbs }));
      }
    };

    loadThumbnails();
  }, [filteredPhotos, thumbnails]);

  const openLightbox = async (index: number) => {
    setLightboxIndex(index);
    const doc = filteredPhotos[index];
    if (!doc) return;

    setLightboxUrl(thumbnails[doc.id] || null);

    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .createSignedUrl(doc.file_path, 60 * 60, {
          transform: {
            width: 1800,
            quality: 90,
          },
        });

      if (error) throw error;
      if (data?.signedUrl) {
        setLightboxUrl(data.signedUrl);
      }
    } catch (err) {
      console.error('Lightbox load error:', err);
    }
  };

  const navigateLightbox = (dir: -1 | 1) => {
    if (lightboxIndex === null) return;
    const newIdx = lightboxIndex + dir;
    if (newIdx >= 0 && newIdx < filteredPhotos.length) {
      openLightbox(newIdx);
    }
  };

  const handleDownload = async (doc: MediaDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(doc.file_path);
      if (error) throw error;
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.document_name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Media Gallery</h1>
            <p className="text-sm text-muted-foreground mt-1">
              All patient photos and documents ({documents.length} files)
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or file name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList>
            <TabsTrigger value="photos" className="gap-2">
              <Image className="h-4 w-4" />
              Photos ({filteredPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents ({filteredDocs.length})
            </TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mb-3 opacity-40" />
                  <p>No photos found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border border-border hover:border-primary/50 transition-colors"
                    onClick={() => openLightbox(idx)}
                  >
                    {thumbnails[photo.id] ? (
                        <img
                          src={thumbnails[photo.id]}
                          alt={photo.document_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-pulse rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    )}
                    {/* Overlay with patient name */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 text-white text-xs">
                        <User className="h-3 w-3" />
                        <span className="truncate">
                          {photo.patient?.first_name} {photo.patient?.last_name}
                        </span>
                      </div>
                      <p className="text-white/70 text-[10px] truncate mt-0.5">{photo.document_name}</p>
                    </div>
                    {/* Category badge */}
                    {photo.category === 'xray' && (
                      <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        X-Ray
                      </Badge>
                    )}
                    {/* Download button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => { e.stopPropagation(); handleDownload(photo); }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-40" />
                  <p>No documents found</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.document_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {doc.patient?.first_name} {doc.patient?.last_name}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              {doc.created_at && (
                                <>
                                  <span>•</span>
                                  <span>{format(new Date(doc.created_at), 'dd.MM.yyyy')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => { setLightboxIndex(null); setLightboxUrl(null); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {lightboxUrl ? (
              <img
                src={lightboxUrl}
                alt={lightboxIndex !== null ? filteredPhotos[lightboxIndex]?.document_name : ''}
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            )}

            {/* Navigation */}
            {lightboxIndex !== null && lightboxIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
                onClick={() => navigateLightbox(-1)}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            {lightboxIndex !== null && lightboxIndex < filteredPhotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
                onClick={() => navigateLightbox(1)}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Info bar */}
            {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm font-medium">
                  {filteredPhotos[lightboxIndex].patient?.first_name} {filteredPhotos[lightboxIndex].patient?.last_name}
                </p>
                <p className="text-white/60 text-xs">{filteredPhotos[lightboxIndex].document_name}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
