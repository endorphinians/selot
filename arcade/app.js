(() => {
  const storageKey = "selot.arcade.guest.v1";
  const format = new Intl.NumberFormat("en");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = id => document.getElementById(id);

  const machines = {
    aztec: {
      name: "Aztec", number: "01", caption: "Temple of the sun",
      description: "Collect puzzle pieces and land sun discs for free spins.",
      rules: "Three sun discs award 10 free spins. Each set of six puzzle pieces awards 180 times the stake per line. The star is wild.",
      symbols: [["✦", "Wild"], ["☀", "Sun disc"], ["✚", "Puzzle piece"], ["♜", "Warrior"],
        ["◆", "Totem"], ["†", "Dagger"], ["A", "A"], ["Z", "Z"], ["T", "T"], ["E", "E"], ["C", "C"]],
      accents: [1, 2, 3],
      art: '<circle cx="253" cy="76" r="53" fill="#edaa5f"/><circle cx="253" cy="76" r="68" class="art-line"/><path d="M45 215V192h38v-26h29v-28h29v-25h30V86h58v27h29v25h29v28h28v26h38v23Z" fill="#572920" stroke="#f8c07e" stroke-width="2"/><path d="M183 214V113h34v101M170 126h60m-63 19h66m-71 19h75m-79 19h83m-87 19h91" class="art-line"/><path d="M0 214h400m-400 13h400M49 44h22m-11-11v22M322 112h15m-7-7v14" class="art-line"/>',
    },
    ocean: {
      name: "Ocean World", number: "02", caption: "Beneath the tide",
      description: "Find treasure chests, turtle races, and wild reels.",
      rules: "Three chests draw a credit or free-spin reward. Three turtles trigger a race payout. Matching full columns on reels two and four double line wins for each column. Those reels turn wild during free spins.",
      symbols: [["✦", "Wild"], ["▣", "Treasure chest"], ["◀", "Shark"], ["✿", "Turtle"],
        ["♆", "Lobster"], ["✶", "Starfish"], ["A", "A"], ["K", "K"], ["Q", "Q"], ["J", "J"]],
      accents: [1, 2, 4],
      art: '<circle cx="200" cy="113" r="74" fill="#1a6961" stroke="#a8dac2" stroke-width="1"/><path d="M200 58c-20 40-40 53-40 76a40 40 0 0 0 80 0c0-23-20-36-40-76Z" fill="#7dbbaa"/><path d="M200 88v76m0 0-22-22m22 22 22-22M0 179q50-35 100 0t100 0t100 0t100 0m-400 26q50-35 100 0t100 0t100 0t100 0m-400 25q50-35 100 0t100 0t100 0t100 0" class="art-line"/><circle cx="93" cy="74" r="9" class="art-line"/><circle cx="300" cy="109" r="5" class="art-line"/><circle cx="317" cy="82" r="11" class="art-line"/>',
    },
    sparta: {
      name: "Sparta", number: "03", caption: "Shield and spear",
      description: "Rally three banners for five free spins with a wild centre reel.",
      rules: "Three banners award five free spins. The centre reel turns wild during free spins and landed warriors stay in place until the round ends.",
      symbols: [["✸", "Great wild"], ["✦", "Wild"], ["⊕", "Catapult"], ["▣", "Arena"],
        ["⚑", "Army banner"], ["♜", "Warrior"], ["♛", "Queen"], ["♞", "Steed"],
        ["◈", "Helmet"], ["⬟", "Armour"], ["↑", "Spear"]],
      accents: [1, 2, 5, 6],
      art: '<path d="M119 194 275 35m-3 30 3-30-30 5m36 154L125 35m3 30-3-30 30 5" class="art-line"/><path d="M142 75q58-29 116 0v67q-8 43-58 66-50-23-58-66Z" fill="#d3a45c" stroke="#f6d893" stroke-width="2"/><path d="M156 84q44-21 88 0v56q-8 33-44 53-36-20-44-53Z" fill="#644420"/><path d="m178 153 22-53 22 53m-35-16h26M0 210h140m120 0h140M0 222h400" class="art-line"/><circle cx="87" cy="107" r="7" class="art-line"/><circle cx="313" cy="107" r="7" class="art-line"/>',
    },
  };

  let profile = arcade.newProfile();
  let canSave = true;
  let busy = false;
  let animationId = null;
  let activeId = null;
  let actionMessage = "";

  function unavailableStorage() {
    canSave = false;
    $("storage-message").hidden = false;
    $("storage-message").textContent = "Browser storage is unavailable. Progress lasts while this page stays open.";
  }

  function refreshProfile() {
    if (!canSave) return;
    try {
      profile = arcade.readProfile(localStorage.getItem(storageKey));
    } catch {
      unavailableStorage();
    }
  }

  function saveProfile() {
    if (!canSave) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch {
      unavailableStorage();
    }
  }

  function currentBet(id) {
    const game = profile.games[id];
    return game.free ? game.freeBet : slotTables[id].bets[game.betIndex];
  }

  function cabinetCard(id, machine) {
    const lines = slotTables[id].lines.length;
    return `<article class="machine-card theme-${id}">
      <div class="card-art">
        <span class="card-number">NO. ${machine.number}</span>
        <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${machine.art}</svg>
      </div>
      <div class="card-copy">
        <p class="eyebrow">${machine.caption}</p>
        <h3>${machine.name}</h3>
        <p>${machine.description}</p>
        <div class="card-action"><span>${lines} paylines</span><a class="button button-play" href="#${id}" aria-label="Play ${machine.name}">Play <span aria-hidden="true">↗</span></a></div>
      </div>
    </article>`;
  }

  function renderLobby() {
    const { day, amount } = arcade.daily();
    const claimed = profile.claimedOn >= day;
    $("reward-value").textContent = `+${format.format(amount)} credits`;
    $("claim").disabled = busy || claimed;
    $("claim").textContent = claimed ? "Claimed" : "Claim";
    $("reward-message").textContent = claimed ? "Next reward tomorrow" : "Resets at local midnight";
  }

  function renderReels(id, last) {
    const machine = machines[id];
    const table = slotTables[id];
    $("reels").replaceChildren(...table.reels.map((strip, column) => {
      const reel = document.createElement("div");
      reel.className = "reel";
      for (let row = 0; row < table.rows; row++) {
        const symbol = last?.grid[column][row] ?? strip[(column * 3 + row + 5) % strip.length];
        const [glyph, label] = machine.symbols[symbol - 1];
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.classList.toggle("tile-special", machine.accents.includes(symbol));
        tile.classList.toggle("tile-win", Boolean(last?.wins.includes(column * table.rows + row)));
        tile.setAttribute("role", "img");
        tile.setAttribute("aria-label", label);
        tile.title = label;
        tile.textContent = glyph;
        reel.append(tile);
      }
      return reel;
    }));
  }

  function renderPlay(id) {
    const machine = machines[id];
    const table = slotTables[id];
    const game = profile.games[id];
    const bet = currentBet(id);
    const short = !game.free && profile.credits < bet;
    const animating = animationId === id;

    $("play").className = `theme-${id}`;
    $("machine-number").textContent = `Cabinet ${machine.number} / ${machine.caption}`;
    $("machine-title").textContent = machine.name;
    $("line-count").textContent = `${table.lines.length} paylines`;
    $("feature-counter").hidden = !table.puzzle;
    if (table.puzzle) $("feature-counter").textContent = `Puzzle ${game.pieces}/${table.puzzle[0]}`;
    $("free-count").textContent = game.free ? `${game.free} free spins ready` : "Standard spin";
    $("bet").textContent = format.format(bet);
    $("bet-down").disabled = busy || game.free > 0 || game.betIndex === 0;
    $("bet-up").disabled = busy || game.free > 0 || game.betIndex === table.bets.length - 1;
    $("spin").disabled = busy || short;
    $("spin").firstChild.nodeValue = animating ? "Spinning " : game.free ? "Free spin " : "Spin ";
    $("rules-copy").textContent = machine.rules;
    $("reels").classList.toggle("rolling", animating);

    if (!animating) renderReels(id, game.last);
    const result = game.last;
    const summary = result
      ? [result.total ? `+${format.format(result.total)} credits` : "No payout", ...result.notes].join(" · ")
      : "Ready to spin";
    $("result").textContent = animating ? "Reels in motion…" : actionMessage
      || (short ? `${summary} · Lower your stake or return to the lobby for the daily reward.` : summary);
  }

  function render() {
    $("balance").textContent = format.format(profile.credits);
    renderLobby();
    if (activeId) renderPlay(activeId);
  }

  function navigate(focus) {
    const id = location.hash.slice(1);
    activeId = Object.hasOwn(machines, id) ? id : null;
    actionMessage = "";
    $("lobby").hidden = Boolean(activeId);
    $("play").hidden = !activeId;
    render();
    if (focus) $(activeId ? "machine-title" : "lobby-title").focus();
  }

  async function transact(action, animateId = null) {
    if (busy) return;
    busy = true;
    actionMessage = "";
    render();
    const commit = () => {
      refreshProfile();
      const changed = action();
      if (changed) saveProfile();
      return changed;
    };
    try {
      const useLock = navigator.locks && location.protocol !== "file:" && canSave;
      const changed = useLock ? await navigator.locks.request(storageKey, commit) : commit();
      if (changed && animateId === activeId && animateId && !reduceMotion.matches) {
        animationId = animateId;
        render();
        await new Promise(resolve => setTimeout(resolve, 260));
      }
    } finally {
      animationId = null;
      busy = false;
      render();
    }
  }

  $("machines").innerHTML = Object.entries(machines).map(([id, machine]) => cabinetCard(id, machine)).join("");
  $("claim").addEventListener("click", () => transact(() => arcade.claim(profile)));
  $("spin").addEventListener("click", () => {
    const id = activeId;
    transact(() => {
      const result = arcade.spin(profile, id, currentBet(id));
      if (!result) actionMessage = "Balance changed. Choose a stake you can cover.";
      return result;
    }, id);
  });
  for (const [button, offset] of [["bet-down", -1], ["bet-up", 1]]) {
    $(button).addEventListener("click", () => {
      const id = activeId;
      transact(() => {
        const game = profile.games[id];
        const next = game.betIndex + offset;
        if (game.free || !Object.hasOwn(slotTables[id].bets, next)) return false;
        game.betIndex = next;
        return true;
      });
    });
  }
  window.addEventListener("hashchange", () => navigate(true));
  window.addEventListener("storage", event => {
    if (event.key !== storageKey && event.key !== null) return;
    refreshProfile();
    render();
  });
  window.addEventListener("focus", () => {
    refreshProfile();
    render();
  });
  setInterval(() => {
    if (!busy && !document.hidden) renderLobby();
  }, 30000);

  refreshProfile();
  navigate(false);
})();
