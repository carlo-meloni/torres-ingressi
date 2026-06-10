"use client";

import { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

import type { QueueSnapshot } from "@/types/booking";

/** Nome canale ed evento: devono combaciare con `lib/realtime.ts`. */
const QUEUE_CHANNEL = "coda";
const QUEUE_UPDATED = "queue-updated";

interface UseQueueChannelOptions {
  /**
   * Invocata a ogni evento ricevuto. La cassa la usa per `router.refresh()`;
   * lo schermo pubblico la lascia vuota e legge lo snapshot ritornato.
   */
  onPing?: () => void;
}

/**
 * Sottoscrive il canale realtime della coda e ritorna l'ultima istantanea
 * ricevuta (inizializzata con `initial`). No-op se le env pubbliche di Pusher
 * mancano o se gira lato server: in tal caso lo stato resta su `initial` e il
 * componente continua a funzionare con i dati passati dal server.
 */
export function useQueueChannel(
  initial: QueueSnapshot,
  { onPing }: UseQueueChannelOptions = {},
): QueueSnapshot {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>(initial);

  // `onPing` in un ref così l'effetto di sottoscrizione non si ricrea a ogni render.
  const onPingRef = useRef(onPing);
  useEffect(() => {
    onPingRef.current = onPing;
  }, [onPing]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe(QUEUE_CHANNEL);

    channel.bind(QUEUE_UPDATED, (data: QueueSnapshot) => {
      setSnapshot(data);
      onPingRef.current?.();
    });

    return () => {
      channel.unbind(QUEUE_UPDATED);
      pusher.unsubscribe(QUEUE_CHANNEL);
      pusher.disconnect();
    };
  }, []);

  return snapshot;
}
