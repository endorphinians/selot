import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createContext, runInContext } from "node:vm";

const context = createContext({});
for (const file of ["tables.js", "game.js"]) {
  runInContext(await readFile(new URL(file, import.meta.url), "utf8"), context);
}
const { arcade, slotTables } = runInContext("({arcade, slotTables})", context);
const plain = value => JSON.parse(JSON.stringify(value));

test("a guest starts with one shared balance and all three machines", () => {
  const profile = arcade.newProfile();
  assert.equal(profile.credits, 10000);
  assert.deepEqual(Object.keys(profile.games), ["aztec", "ocean", "sparta"]);
});

test("daily rewards follow the local weekday and cannot be claimed twice", () => {
  const profile = arcade.newProfile();
  const monday = new Date(2026, 10, 2, 10);
  assert.equal(arcade.claim(profile, monday), 2000);
  assert.equal(arcade.claim(profile, new Date(2026, 10, 2, 23, 59)), 0);
  assert.equal(arcade.claim(profile, new Date(2026, 10, 3, 0, 1)), 3000);
  assert.equal(profile.credits, 15000);
});

test("invalid or unaffordable stakes leave the complete profile unchanged", () => {
  for (const id of Object.keys(slotTables)) {
    const profile = arcade.newProfile();
    profile.credits = 0;
    const before = JSON.stringify(profile);
    assert.equal(arcade.spin(profile, id, slotTables[id].bets[0]), null);
    assert.equal(arcade.spin(profile, id, -1), null);
    assert.equal(JSON.stringify(profile), before);
  }
});

test("paid spins deduct exactly one stake and credit the reported payout", () => {
  for (const id of Object.keys(slotTables)) {
    const profile = arcade.newProfile();
    const bet = slotTables[id].bets[0];
    const result = arcade.spin(profile, id, bet, () => 0);
    assert.equal(profile.credits, 10000 - bet + result.total);
    assert.equal(result.grid.length, 5);
    assert.ok(Number.isSafeInteger(profile.credits));
  }
});

test("free spins use their locked stake without deducting credits", () => {
  for (const id of Object.keys(slotTables)) {
    const profile = arcade.newProfile();
    profile.games[id].free = 1;
    profile.games[id].freeBet = slotTables[id].bets[0];
    profile.credits = 0;
    const result = arcade.spin(profile, id, -1, () => 5);
    assert.ok(result);
    assert.equal(profile.credits, result.total);
  }
});

test("Aztec scatter awards ten turns and preserves the triggering stake", () => {
  const profile = arcade.newProfile();
  const bet = slotTables.aztec.bets[0];
  const result = arcade.spin(profile, "aztec", bet, () => 0);
  assert.ok(result.notes.includes("+10 free spins"));
  assert.equal(profile.games.aztec.free, 10);
  assert.equal(profile.games.aztec.freeBet, bet);
});

test("Ocean free spins make reels two and four wild", () => {
  const profile = arcade.newProfile();
  profile.games.ocean.free = 1;
  profile.games.ocean.freeBet = slotTables.ocean.bets[0];
  const result = arcade.spin(profile, "ocean", -1, () => 5);
  assert.deepEqual(plain(result.grid[1]), [1, 1, 1]);
  assert.deepEqual(plain(result.grid[3]), [1, 1, 1]);
});

test("Sparta keeps warriors during a free-spin round", () => {
  const profile = arcade.newProfile();
  profile.games.sparta.free = 2;
  profile.games.sparta.freeBet = slotTables.sparta.bets[0];
  profile.games.sparta.held = [0];
  const result = arcade.spin(profile, "sparta", -1, () => 5);
  assert.equal(result.grid[0][0], 6);
  assert.deepEqual(plain(result.grid[2]), [1, 1, 1]);
});

test("saved credits, free spins, last results, and sound survive a reload", () => {
  const profile = arcade.newProfile();
  arcade.spin(profile, "aztec", slotTables.aztec.bets[0], () => 0);
  profile.sound = false;
  assert.deepEqual(plain(arcade.readProfile(JSON.stringify(profile))), plain(profile));
});

test("a corrupt Ocean symbol is discarded before the UI tries to draw it", () => {
  const profile = arcade.newProfile();
  arcade.spin(profile, "ocean", slotTables.ocean.bets[0], () => 0);
  profile.games.ocean.last.grid[0][0] = 11;
  const restored = arcade.readProfile(JSON.stringify(profile));
  assert.equal(restored.games.ocean.last, null);
  assert.equal(restored.credits, profile.credits);
});

test("malformed saved data restores a usable guest profile", () => {
  for (const invalid of ["broken", "null", '{"credits":-1}', '{"credits":2.5}']) {
    assert.equal(arcade.readProfile(invalid).credits, 10000);
  }
  const profile = arcade.newProfile();
  profile.games.aztec.betIndex = "0";
  profile.games.sparta.last = {
    total: -50, notes: [], wins: [-1], grid: Array.from({ length: 5 }, () => [1, 1, 1]),
  };
  const restored = arcade.readProfile(JSON.stringify(profile));
  assert.equal(restored.games.aztec.betIndex, 0);
  assert.equal(restored.games.sparta.last, null);
});
