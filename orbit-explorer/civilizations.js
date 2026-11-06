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
  const FACTIONS = [
    {
      name: "Consórcio Aural",
      speaker: "Semeadora Iara",
      ship: "albatroz",
      color: "#d9ae55",
      material: "lumenfern",
      recipe: "aural-life",
      missions: [
        "Reacender os viveiros",
        "A semente testemunha",
        "Um jardim entre estrelas",
      ],
      witness:
        "Iara reconhece a semente do posto. A Aurora deixou viveiros vivos ao longo da rota do Coro.",
      line: "Nossas sementes atravessaram o silêncio. Ajude-nos a devolver ar aos viveiros.",
    },
    {
      name: "Nômades Veyra",
      speaker: "Mestre de rota Khar",
      ship: "carcara",
      color: "#db7138",
      material: "ferronita",
      recipe: "veyra-shield",
      missions: [
        "Uma oficina no vazio",
        "O farol dos viajantes",
        "A rota partilhada",
      ],
      witness:
        "Khar recebe a gravação do farol. Os Veyra escoltaram a Aurora quando suas primeiras antenas se apagaram.",
      line: "Nenhuma rota pertence a um só povo. Reerguer um posto é abrir caminho para todos.",
    },
    {
      name: "Liga Thar",
      speaker: "Arquivista Seli",
      ship: "coruja",
      color: "#8580df",
      material: "prismalita",
      recipe: "thar-scanner",
      missions: [
        "Restaurar o observatório",
        "A memória do silêncio",
        "O arquivo das vozes",
      ],
      witness:
        "Seli decifra o testemunho. O Coro preserva memórias de povos inteiros, além do sinal da Aurora.",
      line: "Guardamos sinais de mundos que ninguém mais lembra. Precisamos de olhos e de testemunhas.",
    },
  ];
  const stories = [
    [
      "Iara entrega coordenadas de um viveiro sem irrigação. As sementes da Aurora ainda dormem ali; leve peças ao posto para fazê-las respirar.",
      "O viveiro desperta. Iara reconhece nas folhas o mesmo pulso do Coro: a Aurora deixou vida, além de mensagens. Reúna flora de dois ambientes para comparar esse sinal.",
      "As duas espécies respondem ao mesmo pulso. Iara preserva uma cópia viva do testemunho da Aurora. Sua aliança protege essa memória; o viveiro continua produzindo ar para sua jornada.",
    ],
    [
      "Khar aponta um farol apagado na antiga rota da Aurora. Restaure-o: as leituras dos viajantes ajudarão a escolher seus próximos destinos.",
      "O farol volta a ouvir. Entre os sinais surge a escolta perdida da Aurora. Ative balizas e extraia de dois locais hostis para reconstruir a passagem dos viajantes.",
      "As balizas ligam os fragmentos da rota. Khar confirma: a Aurora atravessou a tempestade seguindo o Coro. Os Veyra passam a guardar esse caminho para quem vier depois.",
    ],
    [
      "Seli precisa comparar sinais de três biomas e recalibrar o observatório. Os registros da Aurora estão misturados às vozes de mundos esquecidos.",
      "O observatório separa as primeiras vozes. A bancada recuperadora volta ao serviço. Recupere núcleos em dois sistemas para descobrir se as memórias sobreviveram à distância.",
      "Os núcleos preservam a mesma assinatura em sistemas distintos. Seli conclui que o Coro transporta memórias, não apenas mensagens. O arquivo Thar agora guarda o testemunho da sua viagem.",
    ],
  ];
  const recipes = [
    {
      id: "aural-life",
      name: "Jardim de Iara",
      type: "life",
      rarity: "rare",
      power: 1.72,
      description:
        "Biosfera Aural: reserva de ar e vedação para postos remotos.",
      cost: { credits: 45, data: 30 },
      components: { seal: 2, circuit: 2 },
      capabilities: { toxicity: 75, pressure: 45 },
      effects: { maxOxygen: 35 },
    },
    {
      id: "veyra-shield",
      name: "Manto das Rotas",
      type: "shield",
      rarity: "rare",
      power: 1.72,
      description: "Cerâmica Veyra: calor e casco para longas viagens.",
      cost: { credits: 45, data: 30 },
      components: { alloy: 2, seal: 2 },
      capabilities: { heat: 1100, radiation: 140 },
      effects: { maxHull: 14 },
    },
    {
      id: "thar-scanner",
      name: "Lente da Memória",
      type: "scanner",
      rarity: "rare",
      power: 1.72,
      description: "Óptica Thar: pesquisa e alcance de sinal.",
      cost: { credits: 45, data: 40 },
      components: { prism: 2, circuit: 2 },
      capabilities: {},
      effects: { scanRadius: 1, scanBonus: 0.2 },
    },
  ];
  E.recipes.push(...recipes);
  function fresh() {
    return {
      v: 1,
      seen: [],
      people: FACTIONS.map(() => ({
        donations: 0,
        deliveries: 0,
        step: 0,
        visits: [],
      })),
    };
  }
  function ensure(s) {
    return s.civilizations || (s.civilizations = fresh());
  }
  function faction(s) {
    return (s.campaign?.atHome ? 0 : s.galaxyIndex) % 3;
  }
  function reputation(p) {
    return Math.min(
      100,
      p.donations * 10 + p.deliveries * 15 + p.step * 20 + p.visits.length * 10,
    );
  }
  function valid(s) {
    const c = s.civilizations;
    if (c === undefined) return true;
    if (
      !c ||
      !Array.isArray(c.seen) ||
      c.seen.length > 2 ||
      new Set(c.seen).size !== c.seen.length ||
      c.seen.some((k) => !["dock", "harvest"].includes(k)) ||
      c.v !== 1 ||
      !Array.isArray(c.people) ||
      c.people.length !== 3
    )
      return false;
    return c.people.every(
      (p, i) =>
        p &&
        ["donations", "deliveries", "step"].every(
          (k) =>
            Number.isInteger(p[k]) &&
            p[k] >= 0 &&
            p[k] <= (k === "step" ? 3 : 5),
        ) &&
        Array.isArray(p.visits) &&
        p.visits.length <= 100 &&
        new Set(p.visits).size === p.visits.length &&
        p.visits.every(
          (id) =>
            /^g\d+-p0$/.test(id) &&
            Number(id.slice(1).split("-")[0]) <= s.galaxyIndex &&
            Number(id.slice(1).split("-")[0]) % 3 === i,
        ),
    );
  }
  function outpost(s) {
    if (s.guide?.active || s.expedition || s.location.stationId) return null;
    const planet = E.currentPlanet(s),
      index = s.galaxy.planets.findIndex((p) => p.id === planet?.id);
    return index === 0 && planet?.scanned ? planet : null;
  }
  const fail = (reason) => ({ allowed: false, reason, cost: {} });
  function plan(s, a, p = {}) {
    const own = a.startsWith("civ");
    const f = faction(s),
      person = (s.civilizations || fresh()).people[f],
      rep = reputation(person),
      def = FACTIONS[f];
    if (a === "fabricate" && recipes.some((r) => r.id === p.recipeId)) {
      const owner = recipes.findIndex((r) => r.id === p.recipeId);
      if (reputation((s.civilizations || fresh()).people[owner]) < 40)
        return fail(
          "Conquiste 40 de reputação com " + FACTIONS[owner].name + ".",
        );
      return null;
    }
    if (!own) return null;
    if (s.guide?.active || s.expedition)
      return fail("Conclua a expedição antes de negociar.");
    if (a === "civVisit") {
      const planet = outpost(s);
      if (!planet)
        return fail(
          "Analise o primeiro mundo deste setor para localizar o posto.",
        );
      if (s.location.mode !== "docked")
        return fail("Desça ao mundo para visitar o posto.");
      if (person.visits.length >= 100)
        return fail("Todos os testemunhos desta aliança foram registrados.");
      if (person.visits.includes(planet.id))
        return fail("Este posto já compartilhou seu testemunho.");
      return { allowed: true, reason: "", cost: {} };
    }
    if (
      s.location.mode !== "orbit" ||
      s.location.stationId !== E.currentSystem(s).id
    )
      return fail("Atraque no entreposto desta civilização.");
    let cost = {};
    if (a === "civDonate") {
      if (person.donations >= 5 || rep >= 100)
        return fail("Sua contribuição já foi reconhecida.");
      cost = { credits: 100 };
    } else if (a === "civDeliver") {
      if (person.deliveries >= 5 || rep >= 100)
        return fail("As encomendas desta relação foram atendidas.");
      cost = { [def.material]: 2 };
    } else if (a === "civMission") {
      if (person.step === 0) cost = { ore: 6, crystals: 2 };
      else if (person.step === 1) {
        if (!person.visits.length)
          return fail(
            "Visite o posto no primeiro mundo analisado desta galáxia.",
          );
        cost = { data: 30 };
      } else if (person.step === 2) cost = { [def.material]: 3, data: 50 };
      else return fail("A história deste povo está concluída.");
    } else if (a === "civShip") {
      if (rep < 80) return fail("Requer 80 de reputação.");
      if (s.fleet.owned.includes(def.ship))
        return fail("Esta nave já pertence ao hangar.");
      cost = {
        credits: E.fleetCatalog.SHIPS.find((x) => x.id === def.ship).price,
      };
    } else if (a === "civPaint") {
      if (s.ship.color === def.color)
        return fail("Esta pintura já está aplicada.");
      if (rep < 60) return fail("Requer 60 de reputação.");
    } else return fail("Ação de civilização desconhecida.");
    for (const [key, n] of Object.entries(cost))
      if ((s.resources[key] || 0) < n)
        return fail(
          "Faltam " +
            (n - (s.resources[key] || 0)) +
            " " +
            (E.materials[key]?.name || key) +
            ".",
        );
    return { allowed: true, reason: "", cost };
  }
  E.preview = (s, a, p) => plan(s, a, p) || base.preview(s, a, p);
  E.dispatch = (s, a, p = {}) => {
    const q = plan(s, a, p);
    if (!a.startsWith("civ")) {
      if (q && !q.allowed) return { ok: false, message: q.reason };
      const seen = (s.civilizations || fresh()).seen.slice();
      const result = base.dispatch(s, a, p);
      if (!result.ok) return result;
      const c = ensure(s);
      const kind =
        a === "stationDock"
          ? "dock"
          : a === "expeditionExtract" &&
              Object.keys(result.reward || {}).some(
                (k) => E.materials?.[k]?.category === "Flora",
              )
            ? "harvest"
            : null;
      if (result.ok && kind && !s.guide?.active) {
        result.cinema = { kind, seen: seen.includes(kind) };
        if (!c.seen.includes(kind)) c.seen.push(kind);
      }
      return result;
    }
    if (!q.allowed) return { ok: false, message: q.reason };
    const n = JSON.parse(JSON.stringify(s)),
      i = faction(n),
      person = ensure(n).people[i],
      def = FACTIONS[i];
    for (const [key, value] of Object.entries(q.cost))
      n.resources[key] -= value;
    let message = "Reconhecimento recebido de " + def.name + ".";
    if (a === "civDonate") person.donations++;
    if (a === "civDeliver") person.deliveries++;
    if (a === "civMission") {
      person.step++;
      message = stories[i][person.step - 1];
    }
    if (a === "civVisit") {
      person.visits.push(E.currentPlanet(n).id);
      message = def.witness + " Leve o testemunho ao entreposto.";
    }
    if (a === "civShip") {
      n.fleet.owned.push(def.ship);
      if (n.fleet.offer?.ship === def.ship) n.fleet.offer = null;
      message = "Nave recebida no hangar.";
    }
    if (a === "civPaint") {
      n.ship.color = def.color;
      message = "Pintura de aliança aplicada.";
    }
    n.turn++;
    if (!E.validate(n))
      return { ok: false, message: "Não foi possível concluir a negociação." };
    E.commit(s, n);
    return { ok: true, message, event: a, reward: {}, cost: q.cost };
  };
  E.civilizationView = (s) => {
    const i = faction(s),
      p = ensure(s).people[i],
      rep = reputation(p),
      def = FACTIONS[i],
      planet = s.galaxy.planets[0];
    return {
      ...def,
      index: i,
      rep,
      step: p.step,
      planet,
      story: p.step ? stories[i][p.step - 1] : def.line,
      nextUnlock:
        [
          {
            at: 40,
            label: "Receita " + E.recipes.find((r) => r.id === def.recipe).name,
          },
          { at: 60, label: "Pintura de aliança" },
          {
            at: 80,
            label:
              "Acesso à compra da " +
              E.fleetCatalog.SHIPS.find((x) => x.id === def.ship).name,
          },
        ].find((x) => x.at > rep) || null,
      post: outpost(s),
      visited: planet && p.visits.includes(planet.id),
      actions: Object.fromEntries(
        ["Donate", "Deliver", "Mission", "Ship", "Paint", "Visit"].map((a) => [
          a,
          E.preview(s, "civ" + a),
        ]),
      ),
    };
  };
  E.civilizationCatalog = FACTIONS;
  E.validate = (s) => base.validate(s) && valid(s);
  E.create = (...args) => {
    const s = base.create(...args);
    s.civilizations = fresh();
    return s;
  };
  E.restore = (data) => {
    const s = base.restore(data);
    if (!s || !valid(s)) return null;
    ensure(s);
    return s;
  };
})(typeof window === "object" ? window : globalThis);
