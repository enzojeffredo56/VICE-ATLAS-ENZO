"use client";

import { useTransition } from "react";
import { Crown, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openBillingPortalAction, startCheckoutAction } from "@/lib/billing/actions";

export function SubscribeButton({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      disabled={pending || !enabled}
      onClick={() =>
        start(async () => {
          const res = await startCheckoutAction();
          if (res && !res.ok) toast.error(res.message ?? "");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Crown />} {enabled ? "S'abonner" : "Bientôt disponible"}
    </Button>
  );
}

export function PortalButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await openBillingPortalAction();
          if (res && !res.ok) toast.error(res.message ?? "");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Settings />} Gérer mon abonnement
    </Button>
  );
}
