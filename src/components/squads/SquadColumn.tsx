import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { MemberDetailsDialog } from './MemberDetailsDialog';

interface SquadMember {
  id: string;
  user_id: string;
  full_name: string;
  cargo: string | null;
  is_scrum: boolean;
  horas_dia: number;
}

interface SquadColumnProps {
  squadName: string;
  members: SquadMember[];
  empresa: string;
  onRefresh: () => void;
}

export const SquadColumn = ({ squadName, members, empresa, onRefresh }: SquadColumnProps) => {
  const [selectedMember, setSelectedMember] = useState<SquadMember | null>(null);

  const scrumMembers = members.filter(m => m.is_scrum);
  const regularMembers = members.filter(m => !m.is_scrum);
  const sortedMembers = [...scrumMembers, ...regularMembers];
  
  // Calcular total de horas por dia
  const totalHorasDia = members.reduce((sum, member) => sum + member.horas_dia, 0);

  return (
    <>
      <div className="flex-shrink-0 w-80">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{squadName}</CardTitle>
            <Badge variant="secondary">{members.length} membros</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 min-h-[200px]">
              {sortedMembers.map((member) => (
                <Card
                  key={member.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    member.is_scrum ? 'border-primary bg-primary/10 shadow-sm' : ''
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  <CardContent className="p-3">
                    <div className="flex-1 min-w-0">
                      {member.is_scrum && (
                        <div className="mb-1">
                          <Badge variant="default" className="text-xs">Scrum Master</Badge>
                        </div>
                      )}
                      <p className={`font-medium text-sm truncate ${member.is_scrum ? 'text-primary' : ''}`}>
                        {member.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{member.horas_dia}h/dia</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {members.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-sm font-bold">{totalHorasDia}h/dia</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedMember && (
        <MemberDetailsDialog
          member={selectedMember}
          squadName={squadName}
          empresa={empresa}
          onClose={() => setSelectedMember(null)}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
};
