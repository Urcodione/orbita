(function (root) {
  "use strict";
  const E = root.OrbitEngine,
    base = {
      create: E.create,
      restore: E.restore,
      validate: E.validate,
      preview: E.preview,
      dispatch: E.dispatch,
    };
  const fresh = () => ({ reports: [], jobs: {} });
  const ensure = (s) => {
    s.civilizations.services ||= fresh();
    return s;
  };
  const state = (s) => s.civilizations.services || fresh();
  const faction = (s) => (s.campaign?.atHome ? 0 : s.galaxyIndex) % 3;
  const valid = (s) => {
    const v = s.civilizations?.services;
    if (v === undefined) return true;
    return (
      !!v &&
      Array.isArray(v.reports) &&
      v.reports.length <= 1000 &&
      new Set(v.reports).size === v.reports.length &&
      v.reports.every(
        (id) =>
          typeof id === "string" &&
          /^g\d+-p\d+$/.test(id) &&
          Number(id.slice(1).split("-")[0]) <= s.galaxyIndex,
      ) &&
      !!v.jobs &&
      typeof v.jobs === "object" &&
      !Array.isArray(v.jobs) &&
      Object.entries(v.jobs).every(
        ([k, n]) =>
          /^(0|[1-9]\d*)$/.test(k) &&
          Number(k) <= s.galaxyIndex &&
          Number.isInteger(n) &&
          n >= 0 &&
          n <= 3,
      )
    );
  };
  function prospect(s, id) {
    const p = s.galaxy.planets.find((x) => x.id === id);
    if (!p) return null;
    const local = E.deposits(p),
      resource = local
        .slice()
        .sort((a, b) => E.materials[b].base - E.materials[a].base)[0];
    if (!resource) return null;
    const site = p.sites.find((site) => {
      const i = Number(site.id.split("-s")[1]);
      return [local[i % local.length], local[(i + 1) % local.length]].includes(
        resource,
      );
    });
    return site
      ? {
          resourceId: resource,
          resource: E.materials[resource].name,
          siteId: site.id,
          siteName: site.name,
        }
      : null;
  }
  E.reclaimComparison = (id) => {
    const recipe = E.componentRecipes.find((x) => x.id === id),
      alloy = E.componentRecipes.find((x) => x.id === "alloy");
    if (!["prism", "circuit", "seal"].includes(id)) return null;
    const cost = { ...alloy.cost, credits: (alloy.cost.credits || 0) + 12 };
    return {
      craft: { ...recipe.cost },
      recover: { alloy: 1, credits: 12 },
      fromRaw: cost,
    };
  };
  function quote(s, a, p = {}) {
    if (!["civSurvey", "civReclaim"].includes(a)) return null;
    const survey = a === "civSurvey",
      cost = survey ? { credits: 12, data: 6 } : { credits: 12 },
      components = survey ? {} : { alloy: 1 },
      v = state(s);
    const q = { allowed: true, reason: "", cost, components },
      deny = (reason) => ({ ...q, allowed: false, reason });
    if (
      s.guide?.active ||
      s.expedition ||
      s.location.stationId ||
      s.location.mode !== "docked" ||
      faction(s) !== (survey ? 1 : 2) ||
      E.currentPlanet(s).id !== s.galaxy.planets[0].id ||
      !E.currentPlanet(s).scanned
    )
      return deny("Visite o posto deste povo na superfície.");
    if (!s.civilizations.people[survey ? 1 : 2].activity.restored)
      return deny("Restaure primeiro a instalação deste posto.");
    if (survey) {
      if (!s.galaxy.planets.some((x) => x.id === p.planetId))
        return deny("Selecione um mundo desta galáxia.");
      if (s.galaxy.planets.find((x) => x.id === p.planetId)?.scanned)
        return deny(
          "Mundo já analisado. Os dados estão disponíveis na análise do planeta; não é necessário pagar uma leitura.",
        );
      if (v.reports.includes(p.planetId))
        return deny("Leitura já registrada. Consulte o relatório abaixo.");
      if (!prospect(s, p.planetId))
        return deny(
          "Nenhum depósito especial a localizar. Não há cobrança neste mundo.",
        );
      if (v.reports.length >= 1000)
        return deny("Arquivo de leituras completo.");
    } else {
      if (!["prism", "circuit", "seal"].includes(p.componentId))
        return deny("Escolha prisma, circuito ou selo.");
      if ((v.jobs[s.galaxyIndex] || 0) >= 3)
        return deny(
          "Três recuperações utilizadas nesta galáxia. Procure outro posto Thar em uma nova galáxia.",
        );
      if ((s.components[p.componentId] || 0) >= 999)
        return deny("Limite de estoque deste componente atingido.");
      if (
        E.storageView(s).used -
          E.componentVolume("alloy") +
          E.componentVolume(p.componentId) >
        E.storageView(s).capacity
      )
        return deny("Libere espaço no depósito antes de recuperar.");
    }
    for (const [id, n] of Object.entries(cost))
      if ((s.resources[id] || 0) < n)
        return deny(
          "Faltam " +
            (n - (s.resources[id] || 0)) +
            " " +
            (id === "credits" ? "Lumes" : "dados") +
            ".",
        );
    if (!survey && (s.components.alloy || 0) < 1)
      return deny(
        "Sem liga. Oficina: 3 minérios + 4 Lumes. Desmontar dá minério e Lumes.",
      );
    return q;
  }
  E.preview = (s, a, p) => quote(s, a, p) || base.preview(s, a, p);
  E.dispatch = (s, a, p = {}) => {
    const q = quote(s, a, p);
    if (!q) return base.dispatch(s, a, p);
    if (!q.allowed) return { ok: false, message: q.reason };
    const n = ensure(JSON.parse(JSON.stringify(s))),
      v = state(n);
    for (const [id, x] of Object.entries(q.cost)) n.resources[id] -= x;
    if (a === "civSurvey") v.reports.push(p.planetId);
    else {
      n.components.alloy--;
      n.components[p.componentId] = (n.components[p.componentId] || 0) + 1;
      v.jobs[s.galaxyIndex] = (v.jobs[s.galaxyIndex] || 0) + 1;
    }
    n.turn++;
    if (!E.validate(n))
      return {
        ok: false,
        message: "Operação não concluída. Nenhum recurso consumido.",
      };
    E.commit(s, n);
    return {
      ok: true,
      event: a,
      cost: q.cost,
      reward: {},
      message:
        a === "civSurvey"
          ? "Leitura registrada. A análise local continua necessária para pousar."
          : "Componente recuperado e guardado no depósito.",
    };
  };
  E.civilizationServiceView = (s) => ({
    reports: state(s).reports,
    remaining: 3 - (state(s).jobs[s.galaxyIndex] || 0),
  });
  E.civilizationReport = (s, id) => {
    if (!state(s).reports.includes(id)) return null;
    const p = s.galaxy.planets.find((x) => x.id === id);
    if (!p) return null;
    return {
      name: p.name,
      biome: p.biomeName,
      temperature: p.temperature,
      radiation: p.radiation,
      weather: p.weather,
      signal: p.anomaly,
      ...prospect(s, id),
    };
  };
  E.validate = (s) => base.validate(s) && valid(s);
  E.create = (...args) => ensure(base.create(...args));
  E.restore = (data) => {
    const s = base.restore(data);
    return s && valid(s) ? ensure(s) : null;
  };
})(typeof window === "object" ? window : globalThis);
