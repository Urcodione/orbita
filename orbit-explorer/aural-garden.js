(function (root) {
  "use strict";
  const E = root.OrbitEngine;
  const base = {
    create: E.create,
    restore: E.restore,
    validate: E.validate,
    preview: E.preview,
    dispatch: E.dispatch,
  };
  const COST = { credits: 12, ore: 2 },
    YIELD = 3,
    REQUIRED = 2;
  const empty = () => ({ harvests: 0, batch: null });
  const garden = (s) => s.civilizations.people[0].activity.garden || empty();
  function ensure(s) {
    s.civilizations.people[0].activity.garden ||= empty();
    return s;
  }
  function valid(s) {
    const g = s.civilizations?.people?.[0]?.activity?.garden;
    if (g === undefined) return true;
    if (
      !g ||
      !Number.isSafeInteger(g.harvests) ||
      g.harvests < 0 ||
      g.harvests > s.turn
    )
      return false;
    if (g.batch === null) return true;
    return (
      g.batch &&
      Array.isArray(g.batch.sites) &&
      g.batch.sites.length <= REQUIRED &&
      new Set(g.batch.sites).size === g.batch.sites.length &&
      g.batch.sites.every(
        (id) =>
          typeof id === "string" &&
          /^g\d+-p\d+-s\d+$/.test(id) &&
          Number(id.slice(1).split("-")[0]) <= s.galaxyIndex,
      )
    );
  }
  function quote(s, action) {
    if (!["civPlant", "civHarvest"].includes(action)) return null;
    const g = garden(s),
      cost = action === "civPlant" ? COST : {};
    const result = { allowed: true, reason: "", cost };
    const deny = (reason) => ({ ...result, allowed: false, reason });
    if (
      s.guide?.active ||
      s.expedition ||
      s.location.stationId ||
      s.location.mode !== "docked" ||
      (s.campaign?.atHome ? 0 : s.galaxyIndex) % 3 !== 0 ||
      E.currentPlanet(s).id !== s.galaxy.planets[0].id ||
      !E.currentPlanet(s).scanned
    )
      return deny(
        "Visite um posto Aural na superfície para cuidar do viveiro.",
      );
    if (!s.civilizations.people[0].activity.restored)
      return deny("Restaure primeiro o viveiro Aural.");
    if (action === "civPlant") {
      if (g.batch)
        return deny(
          "Um canteiro já está ocupado. Conclua e colha este cultivo.",
        );
      for (const [id, n] of Object.entries(cost))
        if ((s.resources[id] || 0) < n)
          return deny(
            "Faltam " +
              (n - (s.resources[id] || 0)) +
              " " +
              (id === "credits" ? "Lumes" : "minérios") +
              ".",
          );
    } else {
      if (!g.batch) return deny("Prepare um cultivo antes de colher.");
      if (g.batch.sites.length < REQUIRED)
        return deny(
          "Extraia com coleta em " +
            (REQUIRED - g.batch.sites.length) +
            " local(is) diferente(s) para amadurecer o cultivo.",
        );
      if ((s.resources.lumenfern || 0) + YIELD > 999)
        return deny(
          "Limite de 999 samambaias no estoque. Use algumas antes de colher.",
        );
      if (E.storageView(s).free < YIELD)
        return deny(
          "Reserve 3 unidades livres no depósito para colher. As plantas permanecem no viveiro.",
        );
    }
    return result;
  }
  E.preview = (s, a, p) => quote(s, a) || base.preview(s, a, p);
  E.dispatch = (s, action, payload = {}) => {
    const q = quote(s, action);
    if (q) {
      if (!q.allowed) return { ok: false, message: q.reason };
      const n = ensure(JSON.parse(JSON.stringify(s))),
        g = garden(n),
        reward = {};
      for (const [id, cost] of Object.entries(q.cost)) n.resources[id] -= cost;
      if (action === "civPlant") g.batch = { sites: [] };
      else {
        n.resources.lumenfern = (n.resources.lumenfern || 0) + YIELD;
        n.materialDiscoveries = [
          ...new Set([...(n.materialDiscoveries || []), "lumenfern"]),
        ];
        g.batch = null;
        g.harvests++;
        reward.lumenfern = YIELD;
      }
      n.turn++;
      if (!E.validate(n))
        return { ok: false, message: "Não foi possível preservar o cultivo." };
      E.commit(s, n);
      return {
        ok: true,
        event: action,
        cost: q.cost,
        reward,
        message:
          action === "civPlant"
            ? "Canteiro preparado. Duas extrações com coleta em locais diferentes completam o cultivo."
            : "3 samambaias-lume guardadas. Use na manutenção para produzir oxigênio.",
      };
    }
    const expedition = s.expedition;
    const collected =
      action === "expeditionExtract" &&
      expedition?.harvested?.length > 0 &&
      !s.guide?.active;
    const site = expedition?.siteId;
    const result = base.dispatch(s, action, payload);
    if (!result.ok) return result;
    ensure(s);
    const g = garden(s);
    if (
      collected &&
      g.batch &&
      g.batch.sites.length < REQUIRED &&
      !g.batch.sites.includes(site)
    ) {
      g.batch.sites.push(site);
      result.reward = result.reward || {};
      result.reward.gardenProgress = g.batch.sites.length;
      result.message +=
        " Viveiro Aural: " + g.batch.sites.length + "/" + REQUIRED + ".";
      if (g.batch.sites.length === REQUIRED)
        result.message += " Colheita disponível em um posto Aural.";
    }
    return result;
  };
  E.auralGardenView = (s) => {
    const g = garden(s),
      progress = g.batch?.sites.length || 0;
    return {
      unlocked: !!s.civilizations.people[0].activity.restored,
      planted: !!g.batch,
      ready: progress === REQUIRED,
      progress,
      total: REQUIRED,
      yield: YIELD,
      harvests: g.harvests,
      cost: COST,
      plant: E.preview(s, "civPlant"),
      harvest: E.preview(s, "civHarvest"),
    };
  };
  E.validate = (s) => base.validate(s) && valid(s);
  E.create = (...args) => ensure(base.create(...args));
  E.restore = (data) => {
    const s = base.restore(data);
    return s && valid(s) ? ensure(s) : null;
  };
})(typeof window === "object" ? window : globalThis);
