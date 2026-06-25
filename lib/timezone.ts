/**
 * Fuso orario dell'applicazione.
 *
 * La biglietteria è mono-fuso (Torres Sassari, Italia): tutti gli orari
 * "da muro" (aperture, slot) sono ora italiana. Centralizziamo qui la costante
 * così che:
 *
 * 1. la **visualizzazione** (`Intl.DateTimeFormat`) sia sempre ancorata a
 *    `Europe/Rome`, indipendentemente dal fuso del dispositivo di chi guarda
 *    (telefono di un tifoso, schermo pubblico, server);
 * 2. il **server** vada avviato con `TZ=Europe/Rome` (vedi script in
 *    `package.json` e le env di deploy) così che il parsing delle stringhe
 *    `datetime-local` naive e i confini di giornata (`setHours`) coincidano con
 *    l'ora italiana anche in produzione (dove Node gira in UTC di default).
 */
export const APP_TIME_ZONE = "Europe/Rome";
