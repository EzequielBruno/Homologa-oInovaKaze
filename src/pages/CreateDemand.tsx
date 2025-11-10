import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DemandDialog from '@/components/demands/DemandDialog';
import ScopeChangeDialog from '@/components/demands/ScopeChangeDialog';

const CreateDemand = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scopeChangeOpen, setScopeChangeOpen] = useState(false);

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Gerenciar Demandas
        </h1>
        <p className="text-muted-foreground">
          Crie novas demandas ou solicite mudanças de escopo em demandas existentes
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card Nova Demanda */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setDialogOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Criar Nova Demanda
            </CardTitle>
            <CardDescription>
              Solicite uma nova demanda ao time de TI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full">
              Criar Nova Demanda
            </Button>
          </CardContent>
        </Card>

        {/* Card Mudança de Escopo */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setScopeChangeOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="w-6 h-6 text-primary" />
              Solicitar Mudança de Escopo
            </CardTitle>
            <CardDescription>
              Altere o escopo de uma demanda existente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" variant="secondary" className="w-full">
              Solicitar Mudança
            </Button>
          </CardContent>
        </Card>
      </div>

      <DemandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />

      <ScopeChangeDialog
        open={scopeChangeOpen}
        onOpenChange={setScopeChangeOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default CreateDemand;
