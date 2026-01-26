import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, Mail, Building2, MapPin, Calendar, Pencil, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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
    organizations?: {
      name: string;
    } | null;
  };
  isSuperAdmin: boolean;
  onEdit: () => void;
  onDetails: () => void;
  onDelete: () => void;
}

export function PatientCard({ patient, isSuperAdmin, onEdit, onDetails, onDelete }: PatientCardProps) {
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

        {/* Additional Info - Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {isSuperAdmin && patient.organizations?.name && (
            <Badge variant="outline" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              {patient.organizations.name}
            </Badge>
          )}
          {patient.country && (
            <Badge variant="secondary" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {patient.country}
            </Badge>
          )}
          {patient.date_of_birth && (
            <Badge variant="secondary" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}
            </Badge>
          )}
        </div>

        {/* Footer - Registration date */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Registered: {format(new Date(patient.created_at), 'MMM dd, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}
