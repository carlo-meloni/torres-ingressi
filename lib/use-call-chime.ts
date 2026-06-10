"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Riproduce un "ding" di campanello da banco quando `callKey` cambia, ovvero a
 * ogni nuovo numero chiamato sullo schermo pubblico. Il suono è sintetizzato con
 * la Web Audio API: nessun file audio da caricare.
 *
 * I browser bloccano l'audio finché non c'è un'interazione utente, quindi
 * l'`AudioContext` viene sbloccato al primo gesto (click/tasto/touch) o tramite
 * `enableSound()`. Finché non è pronto, `ready` è `false` così lo schermo può
 * mostrare un invito ad attivare l'audio.
 */
export function useCallChime(callKey: string | null): {
  ready: boolean;
  enableSound: () => void;
} {
  const ctxRef = useRef<AudioContext | null>(null);
  // Inizializzato al valore corrente: il primo render (al mount) non suona.
  const prevKey = useRef<string | null>(callKey);
  const [ready, setReady] = useState(false);

  // Crea/sblocca il context audio (richiede un gesto utente sui browser moderni).
  function enableSound() {
    let ctx = ctxRef.current;
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      ctxRef.current = ctx;
    }
    void ctx.resume().then(() => setReady(ctx.state === "running"));
  }

  // Sblocca al primo gesto utente, così uno schermo appena aperto suona da subito.
  useEffect(() => {
    const unlock = () => enableSound();
    const opts: AddEventListenerOptions = { once: true };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // Sblocco una tantum al primo gesto: collego i listener solo al mount.
  }, []);

  // Suona quando cambia la chiamata (mai al primo valore, mai se l'audio è bloccato).
  useEffect(() => {
    if (prevKey.current === callKey) return;
    prevKey.current = callKey;

    const ctx = ctxRef.current;
    if (!callKey || !ctx || ctx.state !== "running") return;
    playChime(ctx);
  }, [callKey]);

  return { ready, enableSound };
}

/**
 * "Ding" di campanello da banco (service bell): un singolo colpo metallico e
 * brillante con coda risonante. Ottenuto sommando parziali **inarmonici** (come
 * una vera campana, non armonici interi) con attacco istantaneo e decadimento
 * esponenziale; i parziali acuti svaniscono prima dei gravi.
 */
function playChime(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const fundamental = 1320; // ding alto e brillante, tipico del campanello da banco

  // ratio = rapporto di frequenza rispetto alla fondamentale; peak = ampiezza;
  // dur = durata del ring (i parziali alti durano meno → timbro metallico).
  const partials = [
    { ratio: 1, peak: 0.5, dur: 2.4 },
    { ratio: 2.01, peak: 0.34, dur: 1.7 },
    { ratio: 2.99, peak: 0.3, dur: 1.2 },
    { ratio: 4.16, peak: 0.24, dur: 0.9 },
    { ratio: 5.43, peak: 0.2, dur: 0.7 },
    { ratio: 6.79, peak: 0.15, dur: 0.5 },
  ];

  const master = ctx.createGain();
  // Più basso del solo somma dei picchi: con tanti parziali acuti evita il clipping.
  master.gain.value = 0.42;
  master.connect(ctx.destination);

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = fundamental * p.ratio;

    // Attacco quasi istantaneo (il "colpo") + lunga coda esponenziale (il ring).
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(p.peak, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);

    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + p.dur + 0.05);
  }
}
