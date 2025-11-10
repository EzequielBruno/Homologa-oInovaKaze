import { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  existingFiles?: string[];
  maxFiles?: number;
}

const FileUpload = ({ onFilesUploaded, existingFiles = [], maxFiles = 5 }: FileUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(existingFiles);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: 'Limite excedido',
        description: `Você pode enviar no máximo ${maxFiles} arquivos`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const uploadedUrls: string[] = [];

      for (const file of Array.from(selectedFiles)) {
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'Arquivo muito grande',
            description: `${file.name} excede o limite de 10MB`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('demand-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('demand-documents')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      const newFiles = [...files, ...uploadedUrls];
      setFiles(newFiles);
      onFilesUploaded(newFiles);

      toast({
        title: 'Arquivos enviados',
        description: `${uploadedUrls.length} arquivo(s) enviado(s) com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/demand-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0];
        await supabase.storage.from('demand-documents').remove([filePath]);
      }

      const newFiles = files.filter((f) => f !== url);
      setFiles(newFiles);
      onFilesUploaded(newFiles);

      toast({
        title: 'Arquivo removido',
        description: 'O arquivo foi removido com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading || files.length >= maxFiles}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Anexar Documentos/Fluxogramas
            </>
          )}
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {files.length} arquivo(s) anexado(s)
          </p>
          {files.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">
                Documento {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(url)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Formatos aceitos: PDF, PNG, JPG, DOC, DOCX, XLS, XLSX (máx. 10MB cada)
      </p>
    </div>
  );
};

export default FileUpload;
