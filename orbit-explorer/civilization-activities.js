(function (root) {
  "use strict";
  const E = root.OrbitEngine;
  const base = {
    create: E.create,
    restore: E.restore,
    validate: E.validate,
    preview: E.preview,
    dispatch: E.dispatch,
    view: E.civilizationView,
  };
  const definitions = [
    {
      title: "Restaurar o viveiro",
      components: { seal: 1 },
      cost: { lumenfern: 2 },
      material: "cryorchid",
      amount: 1,
      recipe: "aural-seedbank",
      repair: "Viveiro restaurado. As sementes voltaram a respirar.",
    },
    {
      title: "Reparar o farol",
      components: { alloy: 2, circuit: 1 },
      cost: {},
      material: "ferronita",
      amount: 3,
      recipe: "veyra-beacon",
      repair: "Farol restaurado. Os viajantes voltaram a receber seu sinal.",
    },
    {
      title: "Calibrar o observatório",
      components: { prism: 1, circuit: 1 },
      cost: {},
      material: "glassjelly",
      amount: 1,
      recipe: "thar-echo",
      repair: "Observatório calibrado. Os ecos distantes podem ser comparados.",
    },
  ];
  E.recipes.push(
    {
      id: "aural-seedbank",
      name: "Arca de Sementes",
      type: "life",
      rarity: "rare",
      power: 1.72,
      specialty: "Biosfera conservadora",
      description:
        "Reserva biológica de ar para viagens longas. Prioriza autonomia.",
      components: { seal: 2, battery: 1 },
      cost: { credits: 45, data: 25 },
      capabilities: { toxicity: 40 },
      effects: { maxOxygen: 24, oxygenEfficiency: 0.25 },
    },
    {
      id: "veyra-beacon",
      name: "Âncora dos Viajantes",
      type: "survival",
      rarity: "rare",
      power: 1.72,
      specialty: "Travessias de tempestade",
      description:
        "Amortecedores e balizas protegem o rover em terreno hostil.",
      components: { alloy: 2, circuit: 2 },
      cost: { credits: 50, data: 30 },
      capabilities: { heat: 350, cold: 120, radiation: 90 },
      effects: { expeditionIntegrity: 3, hazardProtection: 1 },
    },
    {
      id: "thar-echo",
      name: "Prisma de Ecos",
      type: "scanner",
      rarity: "rare",
      power: 1.72,
      specialty: "Leitura de sinais distantes",
      description:
        "Óptica derivada da medusa de vidro para localizar sinais com maior alcance.",
      components: { prism: 2, circuit: 2 },
      cost: { credits: 55, data: 35 },
      capabilities: {},
      effects: { scanRadius: 1, scanBonus: 0.18 },
    },
  );
  const fresh = () => ({
    restored: false,
    exchanged: false,
    flora: [],
    beacons: [],
    biomes: [],
    systems: [],
  });
  const index = (s) => (s.campaign?.atHome ? 0 : s.galaxyIndex) % 3;
  const activity = (p) => p.activity || fresh();
  function ensure(s) {
    for (const p of s.civilizations.people) p.activity ||= fresh();
    return s;
  }
  function valid(s) {
    return (
      !s.civilizations ||
      s.civilizations.people.every((p) => {
        const a = p.activity;
        if (a === undefined) return true;
        if (
          !a ||
          typeof a.restored !== "boolean" ||
          typeof a.exchanged !== "boolean"
        )
          return false;
        const unique = (key, max, check) =>
          Array.isArray(a[key]) &&
          a[key].length <= max &&
          new Set(a[key]).size === a[key].length &&
          a[key].every(check);
        const location = (id, suffix) =>
          typeof id === "string" &&
          new RegExp("^g\\d+-" + suffix + "\\d+$").test(id) &&
          Number(id.slice(1).split("-")[0]) <= s.galaxyIndex;
        return (
          unique("flora", 3, (id) => E.materials[id]?.category === "Flora") &&
          unique("biomes", 3, (id) => Object.hasOwn(E.biomes, id)) &&
          unique(
            "beacons",
            2,
            (id) =>
              typeof id === "string" &&
              /^g\d+-p\d+-s\d+$/.test(id) &&
              Number(id.slice(1).split("-")[0]) <= s.galaxyIndex,
          ) &&
          unique("systems", 2, (id) => location(id, "sys"))
        );
      })
    );
  }
  const hazardous = (planet) =>
    planet.weather >= 30 ||
    planet.radiation >= 60 ||
    Math.abs(planet.temperature) >= 100;
  function objective(s) {
    const p = s.civilizations.people[index(s)],
      a = activity(p),
      f = index(s);
    if (p.step === 0)
      return {
        text: "Entregue materiais no entreposto para iniciar a aliança. As atividades de campo passam a contar após esta etapa.",
        done: 0,
        total: 1,
      };
    if (p.step === 3)
      return {
        text: "Aliança concluída. Seu reconhecimento e as etapas anteriores estão preservados.",
        done: 3,
        total: 3,
      };
    if (p.step === 1) {
      const extra = f === 2 ? a.biomes.length : 0;
      return {
        text:
          f === 2
            ? "Analise três biomas diferentes e calibre o observatório no posto."
            : "Visite o posto no primeiro mundo da galáxia e " +
              (f === 0 ? "restaure seu viveiro." : "repare seu farol."),
        done: Number(a.restored) + extra,
        total: f === 2 ? 4 : 1,
      };
    }
    return [
      {
        text: "Colete e extraia duas espécies de flora diferentes após iniciar a aliança. Compras não contam como coleta.",
        done: a.flora.length,
        total: 2,
      },
      {
        text: "Ative as duas balizas e extraia de dois locais distintos com clima ≥30, radiação ≥60 ou temperatura além de ±100 °C.",
        done: a.beacons.length,
        total: 2,
      },
      {
        text: "Recupere um núcleo e extraia em dois sistemas diferentes após iniciar a aliança.",
        done: a.systems.length,
        total: 2,
      },
    ][f];
  }
  function quote(s, action, payload = {}) {
    const p = s.civilizations.people[index(s)],
      a = activity(p),
      d = definitions[index(s)];
    const deny = (reason) => ({
      allowed: false,
      reason,
      cost: {},
      components: {},
    });
    if (action === "fabricate") {
      const owner = definitions.findIndex((d) => d.recipe === payload.recipeId);
      if (owner >= 0 && !activity(s.civilizations.people[owner]).exchanged)
        return deny(
          "Obtenha esta receita na troca especial do posto de " +
            E.civilizationCatalog[owner].name +
            ".",
        );
      return null;
    }
    if (action === "civMission") {
      const goal = objective(s);
      if (p.step > 0 && p.step < 3 && goal.done < goal.total)
        return deny(
          goal.text + " Progresso " + goal.done + "/" + goal.total + ".",
        );
      return null;
    }
    if (!["civRestore", "civExchange"].includes(action)) return null;
    const cost = action === "civRestore" ? d.cost : { [d.material]: d.amount };
    const components = action === "civRestore" ? d.components : {};
    const result = { allowed: true, reason: "", cost, components };
    const block = (reason) => ({ ...result, allowed: false, reason });
    if (
      s.guide?.active ||
      s.expedition ||
      s.location.stationId ||
      s.location.mode !== "docked" ||
      E.currentPlanet(s)?.id !== s.galaxy.planets[0].id ||
      !E.currentPlanet(s).scanned
    )
      return block(
        "Desça ao primeiro mundo analisado desta galáxia para acessar o posto.",
      );
    if (!p.visits.includes(E.currentPlanet(s).id))
      return block("Ouça primeiro o testemunho deste posto.");
    if (action === "civRestore" && (p.step === 0 || a.restored))
      return block(
        a.restored
          ? "Instalação restaurada."
          : "Inicie a aliança no entreposto antes de restaurar a instalação.",
      );
    if (action === "civExchange" && a.exchanged)
      return block("Receita já recebida. Troca única por civilização.");
    for (const [id, n] of Object.entries(cost))
      if ((s.resources[id] || 0) < n)
        return block(
          "Faltam " +
            (n - (s.resources[id] || 0)) +
            " " +
            E.materials[id].name +
            ".",
        );
    for (const [id, n] of Object.entries(components))
      if ((s.components[id] || 0) < n)
        return block(
          "Faltam " +
            (n - (s.components[id] || 0)) +
            " " +
            E.componentRecipes.find((r) => r.id === id).name +
            ".",
        );
    return result;
  }
  E.preview = (s, a, p) => quote(s, a, p) || base.preview(s, a, p);
  function add(list, id, max) {
    if (list.length < max && !list.includes(id)) list.push(id);
  }
  E.dispatch = (s, action, payload = {}) => {
    const q = quote(s, action, payload);
    if (q && !q.allowed) return { ok: false, message: q.reason };
    if (["civRestore", "civExchange"].includes(action)) {
      const n = ensure(JSON.parse(JSON.stringify(s))),
        a = n.civilizations.people[index(n)].activity,
        d = definitions[index(n)];
      for (const [id, cost] of Object.entries(q.cost)) n.resources[id] -= cost;
      for (const [id, cost] of Object.entries(q.components))
        n.components[id] -= cost;
      if (action === "civRestore") a.restored = true;
      else a.exchanged = true;
      n.turn++;
      if (!E.validate(n))
        return {
          ok: false,
          message: "Não foi possível preservar esta operação.",
        };
      E.commit(s, n);
      return {
        ok: true,
        event: action,
        cost: q.cost,
        reward: {},
        message:
          action === "civRestore"
            ? d.repair
            : "Receita " +
              E.recipes.find((r) => r.id === d.recipe).name +
              " recebida. Disponível na oficina.",
      };
    }
    const person = s.civilizations.people[index(s)],
      started = person.step >= 1 && !s.guide?.active;
    const progressKey = ["flora", "beacons", "systems"][index(s)];
    const priorCount = started ? activity(person)[progressKey].length : 0;
    const expedition = s.expedition,
      planet = E.currentPlanet(s),
      f = index(s);
    const observation = expedition
      ? {
          core: expedition.coreRecovered,
          beacons: expedition.beacons?.length || 0,
          site: expedition.siteId,
        }
      : null;
    const result = base.dispatch(s, action, payload);
    if (!result.ok) return result;
    ensure(s);
    if (started) {
      const a = s.civilizations.people[f].activity;
      if (action === "scan" && f === 2) add(a.biomes, planet.biome, 3);
      if (action === "expeditionExtract" && observation) {
        if (f === 0)
          for (const [id, amount] of Object.entries(result.reward || {}))
            if (amount > 0 && E.materials[id]?.category === "Flora")
              add(a.flora, id, 2);
        if (f === 1 && observation.beacons === 2 && hazardous(planet))
          add(a.beacons, observation.site, 2);
        if (f === 2 && observation.core) add(a.systems, planet.systemId, 2);
      }
    }
    if (started && person.step < 3 && action === "expeditionExtract") {
      const done = activity(s.civilizations.people[f])[progressKey].length;
      if (done > priorCount) {
        result.reward ||= {};
        result.reward.allianceProgress = {
          name: ["Aural", "Veyra", "Thar"][f],
          done: Math.min(done, 2),
          total: 2,
        };
      }
    }
    return result;
  };
  E.civilizationView = (s) => {
    const view = base.view(s),
      d = definitions[view.index],
      a = activity(s.civilizations.people[view.index]);
    return {
      ...view,
      objective: objective(s),
      activity: a,
      operation: d,
      exchangeRecipe: E.recipes.find((r) => r.id === d.recipe),
      actions: {
        ...view.actions,
        Restore: E.preview(s, "civRestore"),
        Exchange: E.preview(s, "civExchange"),
      },
    };
  };
  E.validate = (s) => base.validate(s) && valid(s);
  E.create = (...args) => ensure(base.create(...args));
  E.restore = (data) => {
    const s = base.restore(data);
    return s && valid(s) ? ensure(s) : null;
  };
})(typeof window === "object" ? window : globalThis);
