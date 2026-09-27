# Roadmap

## Done

- [x] Schema: `habits`, `logs`, owner-scoped, client-minted ids, soft deletes (`pb/`)
- [x] Local-first app: habit picker (tap to log, undo), editor, monthly calendar with day detail and back-filling
- [x] Sync + realtime, works signed out, Google sign-in
- [x] PWA: manifest, icons, service worker with offline shell

## Next

- [x] Vercel project `shame` (alias shame-lime.vercel.app), `VITE_PB_URL` set
- [x] R2 bucket `bedrock-backups-shame` (EEUR, objects expire after 30 days)
- [x] DNS: A `shame.ayadighaith.com` → 62.238.103.8 (Bedrock box), DNS only
- [ ] Bring the PocketBase container up (README "Deploy")
- [ ] Reorder habits (drag in edit mode; `position` already exists)
- [ ] Code-split to trim the bundle (192 KB gzipped today, `motion` and react-aria are most of it)

## Mobile

The goal is speed and, eventually, an iPhone home-screen widget.

**Now: stay on the Someday architecture.** A local-first PWA already makes a
tap instant (Dexie write, sync in the background) and opens offline from the
home screen. No store, no native build.

**Widget: needs a native shell, not a rewrite.** iOS widgets are WidgetKit
extensions and must ship inside an App Store / TestFlight app; a PWA cannot
provide one. The cheapest path when it's time:

1. Wrap this same web build in **Capacitor** (iOS project added next to the
   web app, the UI code is unchanged).
2. Add a **SwiftUI WidgetKit extension** to that Xcode project. Interactive
   widgets (iOS 17+) run an App Intent on tap, which calls PocketBase's REST API
   directly: `POST /api/collections/logs/records` with `{ id, user, habit,
   logged_at, day }`. The auth token is shared from the app through an App Group.
3. The widget reads today's logs the same way to show counts.

Why Capacitor over Tauri: Tauri 2's iOS support works but widget extensions
are hand-wired and less trodden; Capacitor's iOS project is a normal Xcode
project where adding a widget target is routine. A fully native SwiftUI app
is the other option if the web UI ever feels slow, and the schema needs no
change for it.

Nothing in the data model has to change for any of this: client-minted ids
and the stored `day` mean a widget can log without talking to the web app.
