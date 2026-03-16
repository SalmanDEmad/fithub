'use client';

import { useState } from 'react';
import { Copy, MessageSquareText } from 'lucide-react';
import { getOutreachTemplates } from '@/lib/outreach';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SendMessageDialog({ name }: { name: string }) {
  const templates = getOutreachTemplates(name);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async (message: string) => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <MessageSquareText className="h-4 w-4" />
          Send Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a quick check-in</DialogTitle>
          <DialogDescription>
            Copy one of these messages into WhatsApp, SMS, or any channel you already use.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {templates.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => handleCopy(template)}
              className="w-full rounded-2xl border border-border bg-slate-50 p-4 text-start text-sm text-slate-700 transition-colors hover:bg-emerald-50"
            >
              {template}
            </button>
          ))}
          <div className="rounded-2xl border border-border bg-white p-4">
            <textarea
              aria-label="Custom message"
              value={customMessage}
              onChange={(event) => setCustomMessage(event.target.value)}
              placeholder={`Write a custom note for ${name}`}
              className="min-h-28 w-full resize-none rounded-xl border border-border px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => handleCopy(customMessage)}
                disabled={!customMessage.trim()}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy custom message'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
