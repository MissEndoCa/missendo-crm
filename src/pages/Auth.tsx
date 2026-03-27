import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Shield, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import missEndoLogo from '@/assets/miss-endo-logo.webp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const signinSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [showSignupInfo, setShowSignupInfo] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = signinSchema.parse(formData);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto">
            <img src={missEndoLogo} alt="Miss Endo" className="h-20 w-auto" />
          </div>
          <CardDescription className="text-base">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowSignupInfo(true)}
                className="text-sm text-primary hover:underline font-medium"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Secure healthcare CRM platform</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <Link to="/legal/about" className="hover:text-foreground hover:underline transition-colors">About Us</Link>
              <Link to="/legal/contact" className="hover:text-foreground hover:underline transition-colors">Contact</Link>
              <Link to="/legal/privacy-policy" className="hover:text-foreground hover:underline transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms" className="hover:text-foreground hover:underline transition-colors">Terms of Use</Link>
              <Link to="/legal/data-deletion" className="hover:text-foreground hover:underline transition-colors">Data Deletion</Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSignupInfo} onOpenChange={setShowSignupInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Information</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              Organizations are created by us, and only organizations we've created can log in and view their own data. We only create and provide organization accounts to companies with whom we have contracts. If you own an organization, you can send an email to <strong>info@missendo.com</strong> to apply for an account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button asChild>
              <a href="mailto:info@missendo.com">
                <Mail className="w-4 h-4" />
                Contact Us
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
