import { useState, useRef, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { privacySections, termsSections } from '@/data/legalContent';

interface AgreementCheckboxProps {
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

export function AgreementCheckbox({ agreed, onAgreedChange }: AgreementCheckboxProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [pendingFromCheckbox, setPendingFromCheckbox] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  const handleCheckboxClick = () => {
    if (agreed) {
      onAgreedChange(false);
      setPrivacyRead(false);
      setTermsRead(false);
      return;
    }
    if (privacyRead && termsRead) {
      onAgreedChange(true);
      return;
    }
    setPendingFromCheckbox(true);
    if (!privacyRead) {
      setShowPrivacy(true);
    } else {
      setShowTerms(true);
    }
  };

  const handlePrivacyAgree = () => {
    setPrivacyRead(true);
    setShowPrivacy(false);
    if (!termsRead) {
      if (pendingFromCheckbox) {
        setShowTerms(true);
      }
    } else {
      onAgreedChange(true);
      setPendingFromCheckbox(false);
    }
  };

  const handleTermsAgree = () => {
    setTermsRead(true);
    setShowTerms(false);
    if (!privacyRead) {
      if (pendingFromCheckbox) {
        setShowPrivacy(true);
      }
    } else {
      onAgreedChange(true);
      setPendingFromCheckbox(false);
    }
  };

  const handlePrivacyClose = (open: boolean) => {
    if (!open) {
      setShowPrivacy(false);
      setPendingFromCheckbox(false);
    }
  };

  const handleTermsClose = (open: boolean) => {
    if (!open) {
      setShowTerms(false);
      setPendingFromCheckbox(false);
    }
  };

  const handlePrivacyLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPendingFromCheckbox(false);
    setShowPrivacy(true);
  };

  const handleTermsLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPendingFromCheckbox(false);
    setShowTerms(true);
  };

  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false);
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);

  const handlePrivacyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setPrivacyScrolledToBottom(true);
    }
  }, []);

  const handleTermsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setTermsScrolledToBottom(true);
    }
  }, []);

  return (
    <>
      <div className="flex items-start gap-2">
        <Checkbox
          id="agreement"
          checked={agreed}
          onCheckedChange={handleCheckboxClick}
        />
        <label htmlFor="agreement" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
          I have read and agree to the{' '}
          <button
            type="button"
            onClick={handlePrivacyLinkClick}
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            Privacy Policy
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={handleTermsLinkClick}
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            Terms of Use
          </button>
          .
        </label>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={handlePrivacyClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto pr-2 space-y-4"
            style={{ maxHeight: '60vh' }}
            onScroll={handlePrivacyScroll}
          >
            {privacySections.map((section, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={handlePrivacyAgree}
              disabled={!privacyScrolledToBottom}
              className="w-full"
            >
              {privacyScrolledToBottom ? 'I Agree' : 'Please scroll to the bottom to continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms of Use Dialog */}
      <Dialog open={showTerms} onOpenChange={handleTermsClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Terms of Use</DialogTitle>
          </DialogHeader>
          <div
            ref={termsScrollRef}
            className="flex-1 overflow-y-auto pr-2 space-y-4"
            style={{ maxHeight: '60vh' }}
            onScroll={handleTermsScroll}
          >
            {termsSections.map((section, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={handleTermsAgree}
              disabled={!termsScrolledToBottom}
              className="w-full"
            >
              {termsScrolledToBottom ? 'I Agree' : 'Please scroll to the bottom to continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
