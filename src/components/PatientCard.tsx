import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Mail, Building2, Pencil, FileText, Trash2 } from 'lucide-react';

type CrmStatus = 'new_lead' | 'called_answered' | 'called_no_answer' | 'waiting_photos' | 'photos_received' | 'treatment_plan_sent' | 'follow_up' | 'confirmed' | 'completed' | 'lost';

const CRM_STATUS_CONFIG: Record<CrmStatus, { label: string; color: string; bgColor: string }> = {
  new_lead: { label: 'New Lead', color: 'text-slate-600', bgColor: 'bg-white border border-slate-300' },
  called_answered: { label: 'Answered - Hang Up', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  called_no_answer: { label: 'No Answer - Call Back', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  waiting_photos: { label: 'Waiting Photos', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  photos_received: { label: 'Case Under Review', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  treatment_plan_sent: { label: 'Treatment Plan Sent', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  follow_up: { label: 'Follow-up - Pending', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmed: { label: 'Confirmed - Deposit', color: 'text-green-700', bgColor: 'bg-green-100' },
  completed: { label: 'Completed', color: 'text-emerald-800', bgColor: 'bg-emerald-200' },
  lost: { label: 'Lost / Closed', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface PatientCardProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    date_of_birth: string | null;
    gender: string | null;
    country: string | null;
    photo_url: string | null;
    created_at: string;
    organization_id: string;
    crm_status?: CrmStatus | null;
    organizations?: {
      name: string;
    } | null;
  };
  isSuperAdmin: boolean;
  onEdit: () => void;
  onDetails: () => void;
  onDelete: () => void;
  onCrmStatusChange?: (patientId: string, newStatus: CrmStatus) => void;
}

export function PatientCard({ patient, isSuperAdmin, onEdit, onDetails, onDelete, onCrmStatusChange }: PatientCardProps) {
  const currentStatus = patient.crm_status || 'new_lead';
  const statusConfig = CRM_STATUS_CONFIG[currentStatus];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header - Avatar + Name + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarImage src={patient.photo_url || ''} />
              <AvatarFallback className="bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">
                {patient.first_name} {patient.last_name}
              </h3>
              {patient.gender && (
                <span className="text-xs text-muted-foreground">{patient.gender}</span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={onDetails}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-3 space-y-2">
          {patient.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{patient.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{patient.phone}</span>
          </div>
        </div>

        {/* CRM Status */}
        {onCrmStatusChange && (
          <div className="mt-3">
            <Select
              value={currentStatus}
              onValueChange={(value) => onCrmStatusChange(patient.id, value as CrmStatus)}
            >
              <SelectTrigger className={`w-full h-8 text-xs ${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CRM_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className={`${config.color}`}>{config.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Additional Info - Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {isSuperAdmin && patient.organizations?.name && (
            <Badge variant="outline" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              {patient.organizations.name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
