/// <reference path="../pb_data/types.d.ts" />
// States and comments.
//
// A habit's `kind` is "habit" (one tap logs it) or "state" (a log picks one or
// more of its `options`, [{ id, label }]). A log keeps the picked option ids in
// `values` and an optional free-text `comment`. Empty `kind` reads as "habit",
// so records made before this migration need no backfill.
migrate((app) => {
  const habits = app.findCollectionByNameOrId("habits");
  habits.fields.add(new SelectField({ name: "kind", values: ["habit", "state"], maxSelect: 1 }));
  habits.fields.add(new JSONField({ name: "options", maxSize: 20000 }));
  app.save(habits);

  const logs = app.findCollectionByNameOrId("logs");
  logs.fields.add(new JSONField({ name: "values", maxSize: 5000 }));
  logs.fields.add(new TextField({ name: "comment", max: 2000 }));
  app.save(logs);
}, (app) => {
  const habits = app.findCollectionByNameOrId("habits");
  habits.fields.removeByName("kind");
  habits.fields.removeByName("options");
  app.save(habits);

  const logs = app.findCollectionByNameOrId("logs");
  logs.fields.removeByName("values");
  logs.fields.removeByName("comment");
  app.save(logs);
});
