/// <reference path="../pb_data/types.d.ts" />
// Raft: habits, and the taps that log them.
//
// Ids are PocketBase record ids minted on the client (15 chars, [a-z0-9]), the
// Propaganda pattern: a habit logged offline already has its final id, so a log
// can point at it through a real relation before either has reached the server.
//
// Deletes are soft (`deleted_at`) so the pull-by-`updated` sync sees them on
// every device, not only the ones connected to realtime at the time.
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const own = '@request.auth.id != "" && user = @request.auth.id';
  // Updates may not hand a record to someone else.
  const keepOwner = '(@request.body.user:isset = false || @request.body.user = @request.auth.id)';

  const habits = new Collection({
    name: "habits",
    type: "base",
    listRule: own,
    viewRule: own,
    createRule: own,
    updateRule: `${own} && ${keepOwner}`,
    deleteRule: own,
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "title", type: "text", required: true, min: 1, max: 100 },
      { name: "emoji", type: "text", max: 32 },
      // "#RRGGBB"
      { name: "color", type: "text", max: 16 },
      // Order in the picker; lower first.
      { name: "position", type: "number" },
      { name: "deleted_at", type: "date" },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE INDEX idx_habits_user_updated ON habits (user, updated)",
    ],
  });
  app.save(habits);

  // A log must point at one of the caller's own habits.
  const ownHabit = "habit.user = @request.auth.id";
  const logs = new Collection({
    name: "logs",
    type: "base",
    listRule: own,
    viewRule: own,
    createRule: `${own} && ${ownHabit}`,
    updateRule: `${own} && ${keepOwner} && ${ownHabit}`,
    deleteRule: own,
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "habit", type: "relation", required: true, collectionId: habits.id, cascadeDelete: true, maxSelect: 1 },
      // The instant of the tap.
      { name: "logged_at", type: "date", required: true },
      // The tapper's local calendar day, "YYYY-MM-DD". Stored rather than derived
      // so a log stays on the day it was made when the phone changes time zone.
      { name: "day", type: "text", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      { name: "deleted_at", type: "date" },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE INDEX idx_logs_user_updated ON logs (user, updated)",
      "CREATE INDEX idx_logs_user_day ON logs (user, day)",
    ],
  });
  app.save(logs);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("logs"));
  app.delete(app.findCollectionByNameOrId("habits"));
});
