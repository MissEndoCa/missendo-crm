import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Patients() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground mt-2">Manage patient records and treatment history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patient Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Patient management interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
