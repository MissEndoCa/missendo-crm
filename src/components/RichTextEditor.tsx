import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Unlink,
  Code,
  Eye,
  Upload,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { convertToWebP } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'html'>('visual');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [htmlContent, setHtmlContent] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2',
      },
    },
  });

  // Update editor content when external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setHtmlContent(content);
    }
  }, [content, editor]);

  // Convert plain text with line breaks to proper HTML paragraphs
  const textToHtml = (text: string): string => {
    // If already has HTML tags, return as is
    if (/<[^>]+>/.test(text)) {
      return text;
    }
    // Convert line breaks to paragraphs
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length === 0) return '<p></p>';
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  };

  // Sync HTML changes to editor when switching tabs
  const handleTabChange = (tab: string) => {
    if (tab === 'visual' && activeTab === 'html' && editor) {
      // When switching from HTML to visual, convert and update the editor
      const convertedHtml = textToHtml(htmlContent);
      editor.commands.setContent(convertedHtml);
      onChange(convertedHtml);
      setHtmlContent(convertedHtml);
    }
    setActiveTab(tab as 'visual' | 'html');
  };

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    onChange(value);
  };

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    
    // Check if URL has protocol
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
    setLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setImagePopoverOpen(false);
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir görsel dosyası seçin');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Görsel boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setIsUploading(true);

    try {
      const convertedFile = await convertToWebP(file);
      const fileExt = convertedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `campaign-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(filePath, convertedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: convertedFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('email-assets')
        .getPublicUrl(filePath);

      // Insert image into editor
      editor.chain().focus().setImage({ src: publicUrl }).run();
      setImagePopoverOpen(false);
      toast.success('Image added successfully');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editor]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-muted text-foreground"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between border-b bg-muted/30 px-2">
          <TabsList className="h-9 bg-transparent p-0">
            <TabsTrigger 
              value="visual" 
              className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none"
            >
              <Eye className="h-3.5 w-3.5" />
              Visual
            </TabsTrigger>
            <TabsTrigger 
              value="html" 
              className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none"
            >
              <Code className="h-3.5 w-3.5" />
              HTML
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="m-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/50">
            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Text Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Link */}
            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive('link') && "bg-muted text-foreground"
                  )}
                  title="Add Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Insert Link</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLink()}
                    />
                    <Button size="sm" onClick={addLink}>Add</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {editor.isActive('link') && (
              <ToolbarButton
                onClick={removeLink}
                title="Remove Link"
              >
                <Unlink className="h-4 w-4" />
              </ToolbarButton>
            )}

            {/* Image */}
            <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Add Image"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-4">
                  <p className="text-sm font-medium">Add Image</p>
                  
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Bilgisayardan yükle</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Görsel Seç
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-popover px-2 text-muted-foreground">veya</span>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Add via URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addImage()}
                        disabled={isUploading}
                      />
                      <Button size="sm" onClick={addImage} disabled={isUploading || !imageUrl}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Editor Content */}
          <EditorContent 
            editor={editor} 
            className="min-h-[200px] [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
          />
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <Textarea
            value={htmlContent}
            onChange={(e) => handleHtmlChange(e.target.value)}
            placeholder="<p>Write your HTML here...</p>"
            className="min-h-[280px] font-mono text-sm border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
