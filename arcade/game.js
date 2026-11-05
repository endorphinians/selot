const arcade = (() => {
  const startingCredits = 10000;
  const machineIds = Object.keys(slotTables);
  const wilds = { aztec: [1], ocean: [1], sparta: [1, 2] };
  const rng = size => Math.floor(Math.random() * size);

  function emptyGame() {
    return { betIndex: 0, free: 0, freeBet: 0, pieces: 0, held: [], last: null };
  }

  function newProfile() {
    return {
      credits: startingCredits,
      claimedOn: "",
      sound: true,
      games: Object.fromEntries(machineIds.map(id => [id, emptyGame()])),
    };
  }

  function readProfile(serialized) {
    const initial = newProfile();
    try {
      const stored = JSON.parse(serialized);
      if (!stored || !Number.isSafeInteger(stored.credits) || stored.credits < 0) return initial;
      initial.credits = stored.credits;
      initial.sound = typeof stored.sound === "boolean" ? stored.sound : true;
      if (typeof stored.claimedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(stored.claimedOn)) {
        initial.claimedOn = stored.claimedOn;
      }
      for (const id of machineIds) {
        const game = stored.games?.[id];
        const table = slotTables[id];
        if (!game || !Number.isInteger(game.betIndex) || !Object.hasOwn(table.bets, game.betIndex)) continue;
        if (!Number.isSafeInteger(game.free) || game.free < 0) continue;
        if (game.free > 0 && !table.bets.includes(game.freeBet)) continue;
        if (!Number.isInteger(game.pieces) || game.pieces < 0 || game.pieces >= 6) continue;
        if (!Array.isArray(game.held) || !game.held.every(cell =>
          Number.isInteger(cell) && cell >= 0 && cell < table.rows * table.reels.length)) continue;
        const last = game.last;
        const symbols = new Set(table.reels.flat());
        const cells = table.rows * table.reels.length;
        const validLast = last && Number.isSafeInteger(last.total) && last.total >= 0 && Array.isArray(last.notes)
          && last.notes.every(note => typeof note === "string") && Array.isArray(last.wins)
          && last.wins.every(cell => Number.isInteger(cell) && cell >= 0 && cell < cells)
          && Array.isArray(last.grid) && last.grid.length === table.reels.length
          && last.grid.every(reel => Array.isArray(reel) && reel.length === table.rows
            && reel.every(symbol => symbols.has(symbol)));
        initial.games[id] = { ...game, last: validLast ? last : null };
      }
    } catch {
      return initial;
    }
    return initial;
  }

  function daily(date = new Date()) {
    const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map(value => String(value).padStart(2, "0")).join("-");
    return { day, amount: dailyRewards[(date.getDay() + 6) % 7] };
  }

  function claim(profile, date) {
    const { day, amount } = daily(date);
    if (profile.claimedOn >= day) return 0;
    profile.claimedOn = day;
    profile.credits += amount;
    return amount;
  }

  function reelGrid(table, random) {
    return table.reels.map(reel => {
      const start = random(reel.length);
      return Array.from({ length: table.rows }, (_, row) => reel[(start + row) % reel.length]);
    });
  }

  function weighted(rows, random) {
    let position = random(rows.reduce((sum, row) => sum + row[2], 0));
    return rows.find(row => (position -= row[2]) < 0);
  }

  function lineWins(id, table, grid, lineBet, multiplier) {
    let total = 0;
    const wins = new Set();
    for (const line of table.lines) {
      const symbols = line.map((row, column) => grid[column][row]);
      const pay = table.pays.find(([, pattern]) => pattern.every((symbol, column) =>
        symbol === 0 || symbol === symbols[column] || wilds[id].includes(symbols[column])));
      if (!pay) continue;
      total += pay[0] * lineBet * multiplier;
      pay[1].forEach((symbol, column) => {
        if (symbol) wins.add(column * table.rows + line[column]);
      });
    }
    return { total, wins: [...wins] };
  }

  function spin(profile, id, requestedBet, random = rng) {
    const table = slotTables[id];
    const game = profile.games[id];
    const isFree = game.free > 0;
    const bet = isFree ? game.freeBet : requestedBet;
    if (!table.bets.includes(bet) || (!isFree && profile.credits < bet)) return null;

    const lineBet = bet / table.lines.length;
    const grid = reelGrid(table, random);
    const drawn = grid.flat();
    const count = symbol => drawn.filter(value => value === symbol).length;
    const notes = [];
    let multiplier = 1;
    let bonus = 0;
    let freeAward = 0;

    if (isFree) {
      game.free--;
    } else {
      profile.credits -= bet;
      game.held = [];
    }

    if (table.scatter) {
      const [symbol, threshold, turns] = table.scatter;
      if (count(symbol) >= threshold) freeAward = turns;
    }

    if (table.puzzle) {
      const [threshold, payout] = table.puzzle;
      game.pieces += count(3);
      if (game.pieces >= threshold) {
        bonus += Math.floor(game.pieces / threshold) * payout * lineBet;
        game.pieces %= threshold;
        notes.push("Puzzle completed");
      }
    }

    if (table.ocean) {
      for (const column of [1, 3]) {
        if (isFree) grid[column].fill(1);
        if (grid[column].every(symbol => symbol === grid[column][0])) multiplier *= 2;
      }
      if (!isFree && count(4) >= table.ocean.raceCount) {
        const [rank, amount] = weighted(table.ocean.ranks, random);
        bonus += Math.floor(amount * lineBet / 100);
        notes.push(`Turtle race · Rank ${rank}`);
      }
      if (!isFree && count(2) >= table.ocean.bonusCount) {
        const [type, amount] = weighted(table.ocean.bonuses, random);
        if (type === 2) freeAward += Math.floor(amount / 100);
        else bonus += Math.floor(amount * lineBet / 100);
        notes.push("Treasure chest");
      }
    }

    if (id === "sparta" && isFree) {
      grid[2].fill(1);
      drawn.forEach((symbol, cell) => {
        if (symbol === 6 && Math.floor(cell / table.rows) !== 2 && !game.held.includes(cell)) {
          game.held.push(cell);
        }
      });
      for (const cell of game.held) grid[Math.floor(cell / table.rows)][cell % table.rows] = 6;
    }

    if (freeAward) {
      game.free += freeAward;
      game.freeBet = bet;
      notes.push(`+${freeAward} free spins`);
    }
    if (!game.free) game.held = [];

    const { total: lineTotal, wins } = lineWins(id, table, grid, lineBet, multiplier);
    if (lineTotal && multiplier > 1) notes.push(`×${multiplier} line payout`);
    const total = lineTotal + bonus;
    profile.credits += total;
    game.last = { grid, wins, total, notes };
    return game.last;
  }

  return { claim, daily, newProfile, readProfile, spin, lineWins };
})();
