import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RiskAssessment {
  id: string;
  probabilidade: string;
  impacto: string;
  indice_risco: number;
}

interface RiskMatrixProps {
  assessments: RiskAssessment[];
}

export function RiskMatrix({ assessments }: RiskMatrixProps) {
  const probLevels = ['>90%', '30-90%', '<30%'];
  const impactLevels = ['Alto', 'Médio', 'Baixo'];

  const getCellColor = (prob: string, impact: string) => {
    // Alto risco - Vermelho
    if ((prob === '>90%' && impact === 'Alto') || 
        (prob === '>90%' && impact === 'Médio') ||
        (prob === '30-90%' && impact === 'Alto')) {
      return 'bg-red-500/20 border-red-500';
    }
    // Risco moderado - Amarelo
    if ((prob === '30-90%' && impact === 'Médio') ||
        (prob === '<30%' && impact === 'Alto') ||
        (prob === '>90%' && impact === 'Baixo')) {
      return 'bg-yellow-500/20 border-yellow-500';
    }
    // Baixo risco - Verde
    return 'bg-green-500/20 border-green-500';
  };

  const countRisksInCell = (prob: string, impact: string) => {
    return assessments.filter(
      (a) => a.probabilidade === prob && a.impacto === impact
    ).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Risco Visual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted"></th>
                {impactLevels.map((impact) => (
                  <th key={impact} className="border p-2 bg-muted font-semibold">
                    {impact}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {probLevels.map((prob) => (
                <tr key={prob}>
                  <td className="border p-2 bg-muted font-semibold whitespace-nowrap">
                    {prob}
                  </td>
                  {impactLevels.map((impact) => {
                    const count = countRisksInCell(prob, impact);
                    return (
                      <td
                        key={`${prob}-${impact}`}
                        className={`border-2 p-8 text-center ${getCellColor(prob, impact)}`}
                      >
                        {count > 0 && (
                          <div className="text-2xl font-bold">
                            {count}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500"></div>
            <span>Baixo Risco (&lt;30)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border-2 border-yellow-500"></div>
            <span>Risco Moderado (30-90)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 border-2 border-red-500"></div>
            <span>Alto Risco (&gt;90)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
