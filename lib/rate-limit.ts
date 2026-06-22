import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting per gli endpoint sensibili: login (brute force / credential
 * stuffing), registrazione (creazione massiva di account) e prenotazioni
 * pubbliche (spam di turni). Usa Upstash Redis con algoritmo *sliding window*,
 * compatibile con il runtime serverless.
 *
 * **Fail-open**: se Upstash non è configurato (es. sviluppo locale senza le env)
 * o è irraggiungibile, la richiesta viene SEMPRE consentita. Il rate limiting
 * non deve diventare un single point of failure che blocca l'app.
 */

// Client Redis condiviso, creato una sola volta. `null` quando le env non sono
// configurate: in quel caso si fa fail-open (vedi `checkRateLimit`).
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/** Configurazione di un limite: N richieste in una finestra temporale. */
export interface RateLimitRule {
  /** Prefisso univoco della chiave in Redis (namespacing per endpoint). */
  prefix: string;
  /** Numero massimo di richieste nella finestra. */
  limit: number;
  /** Durata della finestra (es. "15 m", "1 h"). */
  window: Parameters<typeof Ratelimit.slidingWindow>[1];
}

/**
 * Limiti per endpoint, centralizzati qui per facilitarne la revisione. Le chiavi
 * (`identifier`) sono costruite dal chiamante: vedi i commenti per la strategia.
 */
export const RATE_LIMITS = {
  /** Login: brute force / credential stuffing. Chiave per `IP:email`. */
  login: { prefix: "rl:login", limit: 5, window: "15 m" },
  /** Registrazione: creazione massiva di account. Chiave per `IP`. */
  register: { prefix: "rl:register", limit: 3, window: "1 h" },
  /** Prenotazioni pubbliche: una prenotazione ogni 10 minuti per `IP`, a prescindere dall'email. */
  booking: { prefix: "rl:booking", limit: 1, window: "10 m" },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

// Memoizza un Ratelimit per regola: ricrearlo a ogni richiesta è inutile.
const limiters = new Map<RateLimitName, Ratelimit>();

function getLimiter(name: RateLimitName): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(name);
  if (!limiter) {
    const rule = RATE_LIMITS[name];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
      prefix: rule.prefix,
      analytics: false,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  /** `true` se la richiesta è consentita. */
  success: boolean;
  /** Richieste ancora disponibili nella finestra corrente. */
  remaining: number;
  /** Istante (epoch ms) in cui la finestra si resetta (0 = sconosciuto). */
  reset: number;
}

/**
 * Verifica e consuma un colpo del rate limit per `identifier` sulla regola
 * `name`. Fail-open: se Upstash non è configurato o solleva un errore, ritorna
 * sempre `success: true`.
 */
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) {
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch {
    // Fail-open: un guasto di Upstash non deve bloccare gli utenti legittimi.
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
}

/**
 * Estrae l'IP del client dagli header. In produzione (dietro proxy / Vercel)
 * l'IP reale è il primo valore di `x-forwarded-for`; `x-real-ip` come fallback.
 * Ritorna `"unknown"` se non determinabile (tutti gli "unknown" condividono lo
 * stesso bucket: accettabile, è solo un fallback).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Messaggio d'errore in italiano con il tempo d'attesa arrotondato al minuto
 * superiore. `reset` è un epoch in ms (0 = sconosciuto → 1 minuto).
 */
export function rateLimitMessage(reset: number): string {
  const ms = reset - Date.now();
  const minutes = ms > 0 ? Math.ceil(ms / 60_000) : 1;
  return `Troppi tentativi. Riprova tra ${minutes} ${
    minutes === 1 ? "minuto" : "minuti"
  }.`;
}

/** Secondi per l'header `Retry-After` di una risposta 429. */
export function retryAfterSeconds(reset: number): number {
  const ms = reset - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 60;
}
