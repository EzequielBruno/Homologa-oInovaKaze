import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FileUploadPaymentProps {
  paymentConditionId?: string;
  existingFiles?: string[];
  onFilesChange?: (files: string[]) => void;
}

interface UploadedFile {
  name: string;
  path: string;
  url?: string;
}

export const FileUploadPayment = ({
  paymentConditionId,
  existingFiles = [],
  onFilesChange,
}: FileUploadPaymentProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(
    existingFiles.map(path => ({
      name: path.split('/').pop() || path,
      path,
    }))
  );
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadedPaths: string[] = [];

      for (const file of Array.from(selectedFiles)) {
        // Valida tamanho (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
          toast({
            title: 'Arquivo muito grande',
            description: `${file.name} excede o limite de 20MB`,
            variant: 'destructive',
          });
          continue;
        }

        // Sanitiza o nome do arquivo removendo caracteres especiais
        const sanitizedName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais por underscore
          .replace(/_+/g, '_'); // Remove underscores duplicados

        // Cria nome único
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomStr}_${sanitizedName}`;
        const filePath = paymentConditionId 
          ? `${paymentConditionId}/${fileName}`
          : `temp/${fileName}`;

        // Upload
        const { error } = await supabase.storage
          .from('payment-conditions-docs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        uploadedPaths.push(filePath);
      }

      const newFiles: UploadedFile[] = uploadedPaths.map(path => ({
        name: path.split('/').pop() || path,
        path,
      }));

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      
      // Notifica o componente pai
      onFilesChange?.(updatedFiles.map(f => f.path));

      toast({
        title: 'Arquivos enviados',
        description: `${uploadedPaths.length} arquivo(s) enviado(s) com sucesso`,
      });

      // Limpa o input
      event.target.value = '';
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar os arquivos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-conditions-docs')
        .download(file.path);

      if (error) throw error;

      // Cria URL e faz download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download concluído',
        description: `${file.name} foi baixado com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (file: UploadedFile) => {
    setFileToDelete(file);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    setDeleting(true);

    try {
      const { error } = await supabase.storage
        .from('payment-conditions-docs')
        .remove([fileToDelete.path]);

      if (error) throw error;

      const updatedFiles = files.filter(f => f.path !== fileToDelete.path);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles.map(f => f.path));

      toast({
        title: 'Arquivo removido',
        description: `${fileToDelete.name} foi excluído`,
      });

      setFileToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível remover o arquivo',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label 
          htmlFor="file-upload" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            uploading 
              ? "border-muted-foreground/30 bg-muted/20 cursor-not-allowed" 
              : "border-muted-foreground/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/50"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 gap-2">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Enviando arquivos...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-foreground">
                    Clique para selecionar ou arraste arquivos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG (max. 20MB)
                  </p>
                </div>
              </>
            )}
          </div>
          <Input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos anexados:</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => confirmDelete(file)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o arquivo "{fileToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
