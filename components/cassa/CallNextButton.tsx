"use client";

import { useTransition } from "react";

import { callNext } from "@/actions/queue";
import { Button } from "@/components/ui/button";

/**
 * Pulsante "Chiama prossimo" di uno sportello. Invoca la Server Action `callNext`
 * con stato `pending` (disabilitato durante la chiamata) e mostra l'eventuale
 * errore tramite `onError`. L'aggiornamento dei dati arriva via `router.refresh()`
 * scatenato dall'evento realtime / dalla rivalidazione della pagina.
 */
export function CallNextButton({
  counterId,
  disabled,
  onError,
}: {
  counterId: string;
  disabled?: boolean;
  onError?: (message: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    onError?.(null);
    startTransition(async () => {
      const result = await callNext(counterId);
      if (!result.success) onError?.(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="brand"
      onClick={handleClick}
      disabled={disabled || isPending}
      className="w-full"
    >
      {isPending ? "Chiamata…" : "Chiama prossimo"}
    </Button>
  );
}
