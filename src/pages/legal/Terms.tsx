import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { termsSections } from "@/data/legalContent";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center border-b">
            <img src="/miss-endo-logo.webp" alt="Miss Endo" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last Updated: March 27, 2026</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {termsSections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>© 2026 Miss Endo. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link to="/legal/data-deletion" className="hover:underline">Data Deletion</Link>
            <Link to="/legal/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
