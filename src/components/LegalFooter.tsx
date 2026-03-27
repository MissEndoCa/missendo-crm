import { Link } from "react-router-dom";

const LegalFooter = () => {
  return (
    <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
      <p>© 2026 Miss Endo Tourism LLC. All rights reserved.</p>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        <Link to="/legal/about" className="hover:underline">About Us</Link>
        <Link to="/legal/contact" className="hover:underline">Contact</Link>
        <Link to="/legal/privacy-policy" className="hover:underline">Privacy Policy</Link>
        <Link to="/legal/terms" className="hover:underline">Terms of Use</Link>
        <Link to="/legal/data-deletion" className="hover:underline">Data Deletion</Link>
      </div>
    </div>
  );
};

export default LegalFooter;
