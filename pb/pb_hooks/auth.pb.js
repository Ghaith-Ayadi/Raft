/// <reference path="../pb_data/types.d.ts" />
// Sign-in policy: Google only. Applied on every start from the environment, so
// adding PB_GOOGLE_CLIENT_ID / PB_GOOGLE_CLIENT_SECRET to /srv/raft/.env and
// restarting is all it takes. Until those exist, password auth stays on as the
// only method (PocketBase refuses an auth collection with no method at all).
// Email OTP and MFA are off unconditionally.
// Adapted from the other apps' copy of this file.
onBootstrap((e) => {
  e.next();
  const env = (k) => $os.getenv(k) || "";
  const users = e.app.findCollectionByNameOrId("users");
  const id = env("PB_GOOGLE_CLIENT_ID");
  const secret = env("PB_GOOGLE_CLIENT_SECRET");
  users.otp.enabled = false;
  users.mfa.enabled = false;
  if (id && secret) {
    users.oauth2.enabled = true;
    users.oauth2.providers = [{ name: "google", clientId: id, clientSecret: secret }];
    users.oauth2.mappedFields = { name: "name", avatarURL: "avatar" };
    users.passwordAuth.enabled = false;
  } else {
    users.oauth2.enabled = false;
    users.passwordAuth.enabled = true;
  }
  e.app.save(users);
});

// PocketBase applies `mappedFields` only when an OAuth2 sign-in creates the
// user. Backfill an empty name or avatar from Google on every later sign-in,
// so an account whose first import failed (or predates the mapping) heals.
// Best effort: a failed download never blocks the sign-in.
onRecordAuthWithOAuth2Request((e) => {
  const record = e.record;
  const google = e.oAuth2User;
  if (record && google) {
    let changed = false;
    if (!record.getString("name") && google.name) {
      record.set("name", google.name);
      changed = true;
    }
    if (!record.getString("avatar") && google.avatarURL) {
      try {
        record.set("avatar", $filesystem.fileFromURL(google.avatarURL));
        changed = true;
      } catch (err) {
        e.app.logger().warn("avatar backfill failed", "error", String(err));
      }
    }
    if (changed) {
      try {
        e.app.save(record);
      } catch (err) {
        e.app.logger().warn("profile backfill failed", "error", String(err));
      }
    }
  }
  e.next();
}, "users");
