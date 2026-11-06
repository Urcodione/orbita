(function (root) {
  "use strict";
  const E = root.OrbitEngine;
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const portrait = (i) =>
    '<span class="og-civ-portrait" style="background-position:' +
    i * 50 +
    '% 0%" aria-hidden="true"></span>';
  function entry(s) {
    const v = E.civilizationView(s);
    return (
      '<button class="og-civ-entry" data-action="civilizations">' +
      portrait(v.index) +
      "<span>" +
      esc(v.name) +
      "<small>Relações · " +
      v.rep +
      "/100</small></span></button>"
    );
  }
  function gardenPanel(s, v, header) {
    const g = E.auralGardenView(s);
    const action = !g.unlocked
      ? "civRestore"
      : g.planted
        ? "civHarvest"
        : "civPlant";
    const q = !g.unlocked ? v.actions.Restore : g.planted ? g.harvest : g.plant;
    const title = !g.unlocked
      ? "Viveiro adormecido"
      : g.ready
        ? "Colheita pronta"
        : g.planted
          ? "Cultivo em crescimento"
          : "Viveiro restaurado";
    const description = !g.unlocked
      ? "Recupere a irrigação para liberar seu canteiro."
      : g.planted
        ? "Extraia com coleta em dois locais diferentes."
        : "Um canteiro por vez. Rendimento de 3 samambaias-lume.";
    const costs = [
      ...Object.entries(q.cost || {}).map(([id, n]) => ({
        id,
        n,
        owned: s.resources[id] || 0,
        name: E.materials[id]?.name || "Lumes",
      })),
      ...Object.entries(q.components || {}).map(([id, n]) => ({
        id,
        n,
        owned: s.components[id] || 0,
        name: E.componentRecipes.find((r) => r.id === id).name,
      })),
    ];
    const costHtml = costs
      .map(
        (c) =>
          "<span><b>−" +
          c.n +
          " " +
          esc(c.name) +
          "</b><small>Estoque: " +
          c.owned +
          "</small></span>",
      )
      .join("");
    const caption = !g.unlocked
      ? "Restaurar viveiro"
      : g.planted
        ? "Colher 3 plantas"
        : "Preparar cultivo";
    return {
      title: "Viveiro Aural",
      singleCard: true,
      header,
      html:
        '<article class="og-garden-card ' +
        (g.unlocked ? "is-alive" : "") +
        '"><figure><img src="' +
        root.OrbitIllustrations[
          g.unlocked ? "aural-restored" : "aural-dormant"
        ] +
        '" alt="' +
        title +
        '">' +
        (g.unlocked
          ? '<i class="og-garden-pollen" aria-hidden="true"></i>'
          : "") +
        "<figcaption>" +
        title +
        "</figcaption></figure><p>" +
        description +
        "</p>" +
        (g.planted
          ? '<div class="og-garden-progress"><progress value="' +
            g.progress +
            '" max="2"></progress><b>' +
            g.progress +
            "/2 extrações</b></div>"
          : "") +
        '<div class="og-garden-costs">' +
        costHtml +
        "</div><small>" +
        (g.unlocked
          ? "Colhidas: " +
            g.harvests * 3 +
            " plantas · manutenção transforma cada planta em até 12 O₂."
          : "Recompensa: cultivo de plantas para oxigênio.") +
        '</small><button class="og-button" data-action="' +
        action +
        '" ' +
        (q.allowed ? "" : "disabled") +
        ">" +
        caption +
        "</button>" +
        (!q.allowed
          ? '<small role="status">' + esc(q.reason) + "</small>"
          : "") +
        "</article>",
    };
  }
  let servicePlanet = 0;
  function servicePanel(s, v, header) {
    const survey = v.index === 1,
      view = E.civilizationServiceView(s);
    const planets = s.galaxy.planets;
    servicePlanet = Math.min(servicePlanet, planets.length - 1);
    const p = planets[servicePlanet],
      report = E.civilizationReport(s, p.id);
    const reasons = new Set();
    const offer = (action, label, payload, art) => {
      const q = E.preview(s, action, payload);
      const showReason = !q.allowed && !reasons.has(q.reason);
      reasons.add(q.reason);
      return (
        '<div class="og-service-offer">' +
        art +
        "<div><b>" +
        esc(label) +
        "</b><small>" +
        (action === "civSurvey" ? "12 Lumes + 6 dados" : "1 liga + 12 Lumes") +
        '</small></div><button class="og-button" data-action="' +
        action +
        '" ' +
        (payload.planetId
          ? 'data-planet="' + payload.planetId + '"'
          : 'data-component="' + payload.componentId + '"') +
        " " +
        (q.allowed ? "" : "disabled") +
        ' aria-label="' +
        esc(label) +
        '">' +
        (survey ? "Ler" : "Recuperar") +
        "</button></div>" +
        (showReason
          ? '<small class="og-service-reason">' + esc(q.reason) + "</small>"
          : "")
      );
    };
    return {
      title: survey ? "Observatório Veyra" : "Recuperadora Thar",
      singleCard: true,
      header,
      html:
        '<article class="og-service-card"><img class="og-service-scene" src="' +
        root.OrbitIllustrations[survey ? "room4" : "room0"] +
        '" alt="' +
        (survey ? "Sala de leitura de sinais" : "Bancada de recuperação") +
        '"><small>' +
        (survey
          ? "O farol compara sinais antes da sua viagem."
          : "O posto recupera componentes de ligas. Restam " +
            view.remaining +
            "/3 nesta galáxia.") +
        "</small>" +
        (!v.activity.restored
          ? "<p>Restaure a instalação na aba Instalação para liberar este serviço.</p>"
          : survey
            ? '<div class="og-service-selector"><button data-service-step="-1" aria-label="Mundo anterior" ' +
              (servicePlanet === 0 ? "disabled" : "") +
              ">‹</button><b>" +
              esc(p.name) +
              "<small>" +
              (servicePlanet + 1) +
              "/" +
              planets.length +
              '</small></b><button data-service-step="1" aria-label="Próximo mundo" ' +
              (servicePlanet === planets.length - 1 ? "disabled" : "") +
              ">›</button></div>" +
              (report
                ? '<div class="og-service-report"><b>' +
                  esc(report.biome) +
                  "</b><span>" +
                  report.temperature +
                  " °C · radiação " +
                  report.radiation +
                  " · clima " +
                  report.weather +
                  "/100</span><small>" +
                  esc(report.signal) +
                  "</small>" +
                  (report.resource
                    ? "<small>Possível ocorrência: " +
                      esc(report.resource) +
                      ". Confirme em campo.</small>"
                    : "") +
                  "<small>Leitura remota permanente. Não substitui análise e equipamentos.</small></div>"
                : offer(
                    "civSurvey",
                    "Ler este mundo",
                    { planetId: p.id },
                    root.OrbitArt.icon("scanner"),
                  )) +
              "<small>Estoque: " +
              s.resources.credits +
              " Lumes · " +
              s.resources.data +
              " dados</small>"
            : "<small>Estoque: " +
              (s.components.alloy || 0) +
              " ligas · " +
              s.resources.credits +
              " Lumes</small>" +
              ["prism", "circuit", "seal"]
                .map((id) =>
                  offer(
                    "civReclaim",
                    E.componentRecipes.find((x) => x.id === id).name +
                      " · " +
                      (s.components[id] || 0),
                    { componentId: id },
                    root.OrbitCommerce.symbol(id),
                  ),
                )
                .join("")) +
        "</article>",
    };
  }
  let allianceTab = "Jornada",
    rewardIndex = 0;
  let postTab = "Visit";
  function sheet(name, s) {
    if (name !== "civilizations" && name !== "alien-post") return null;
    const v = E.civilizationView(s);
    const button = (action, label) => {
      const costs = {
        Donate: { credits: 100 },
        Deliver: { [v.material]: 2 },
        Ship: {
          credits: E.fleetCatalog.SHIPS.find((ship) => ship.id === v.ship)
            .price,
        },
        Restore: v.operation.cost,
        Exchange: { [v.operation.material]: v.operation.amount },
        Mission:
          [
            { ore: 6, crystals: 2 },
            { data: 30 },
            { [v.material]: 3, data: 50 },
          ][v.step] || {},
      };
      const q = v.actions[action],
        required = costs[action] || {},
        cost = Object.entries({
          ...required,
          ...(action === "Restore" ? v.operation.components : {}),
        })
          .map(
            ([k, n]) =>
              n +
              " " +
              (E.materials[k]?.name ||
                E.componentRecipes.find((r) => r.id === k)?.name ||
                { credits: "Lumes", data: "dados" }[k] ||
                k),
          )
          .join(" · ");
      return (
        '<article class="og-civ-offer"><strong>' +
        label +
        "</strong><small>" +
        esc(cost || "Reconhecimento pela jornada") +
        '</small><button class="og-button" data-action="civ' +
        action +
        '" ' +
        (q.allowed ? "" : "disabled") +
        ">" +
        {
          Donate: "Contribuir",
          Deliver: "Entregar",
          Mission: "Concluir etapa",
          Ship: "Comprar nave",
          Paint: "Aplicar pintura",
          Visit: "Ouvir testemunho",
          Restore: "Restaurar",
          Exchange: "Trocar pela receita",
        }[action] +
        "</button>" +
        (!q.allowed ? "<small>" + esc(q.reason) + "</small>" : "") +
        "</article>"
      );
    };
    const header =
      '<div class="og-civ-header">' +
      portrait(v.index) +
      "<div><b>" +
      esc(v.speaker) +
      "</b><small>" +
      v.rep +
      '/100 de reputação</small><progress value="' +
      v.rep +
      '" max="100"></progress></div></div>';
    if (name === "alien-post") {
      const tabs =
        '<div class="og-post-tabs" role="group" aria-label="Atividades do posto">' +
        [
          ["Visit", "Contato"],
          ["Restore", v.index === 0 ? "Viveiro" : "Instalação"],
          ["Exchange", "Troca"],
          ...(v.index
            ? [["Service", v.index === 1 ? "Leituras" : "Recuperar"]]
            : []),
        ]
          .map(
            ([id, label]) =>
              '<button data-civ-tab="' +
              id +
              '" aria-pressed="' +
              (postTab === id) +
              '">' +
              label +
              "</button>",
          )
          .join("") +
        "</div>";
      if (postTab === "Service" && v.index)
        return servicePanel(s, v, header + tabs);
      if (v.index === 0 && postTab === "Service") postTab = "Restore";
      if (v.index === 0 && postTab === "Restore")
        return gardenPanel(s, v, header + tabs);
      const labels = {
        Visit: "Uma voz preservada",
        Restore: v.operation.title,
        Exchange: v.exchangeRecipe.name,
      };
      const detail = {
        Visit: v.visited ? v.witness : v.line,
        Restore: v.activity.restored
          ? v.operation.repair
          : "Use componentes da oficina para recuperar esta instalação. Conta para a aliança.",
        Exchange:
          "Troca única. Receba uma receita permanente para fabricar na oficina.",
      };
      const quote = v.actions[postTab];
      const costs = Object.entries(quote.cost || {})
        .map(
          ([id, n]) =>
            "<span>" +
            root.OrbitCommerce.art(id) +
            "<b>" +
            (s.resources[id] || 0) +
            " / " +
            n +
            "</b><small>" +
            esc(E.materials[id]?.name || id) +
            "</small></span>",
        )
        .join("");
      const parts = Object.entries(quote.components || {})
        .map(
          ([id, n]) =>
            "<span>" +
            root.OrbitCommerce.symbol(id) +
            "<b>" +
            (s.components[id] || 0) +
            " / " +
            n +
            "</b><small>" +
            esc(E.componentRecipes.find((r) => r.id === id).name) +
            "</small></span>",
        )
        .join("");
      return {
        title: "Posto alienígena",
        singleCard: true,
        header: header + tabs,
        html:
          '<img class="og-post-landscape" src="' +
          root.OrbitIllustrations[
            v.index === 0
              ? v.activity.restored
                ? "aural-restored"
                : "aural-dormant"
              : "alien-post"
          ] +
          '" alt="Posto sob o céu de um mundo distante"><p>' +
          esc(detail[postTab]) +
          '</p><div class="og-post-costs">' +
          costs +
          parts +
          "</div>" +
          (postTab === "Exchange"
            ? '<div class="og-post-recipe">' +
              root.OrbitArt.icon(v.exchangeRecipe.type) +
              "<small>" +
              esc(v.exchangeRecipe.description) +
              "</small></div>"
            : "") +
          button(postTab, labels[postTab]),
      };
    }
    const tabs =
      '<div class="og-post-tabs" aria-label="Aliança">' +
      ["Jornada", "Recompensas", "Apoio"]
        .map(
          (t) =>
            '<button data-alliance-tab="' +
            t +
            '" aria-pressed="' +
            (allianceTab === t) +
            '">' +
            t +
            "</button>",
        )
        .join("") +
      "</div>";
    const next = v.nextUnlock;
    const progress =
      '<div class="og-alliance-next"><small>' +
      (next
        ? "Próximo · " + esc(next.label)
        : "Todos os benefícios de reputação liberados") +
      '</small><progress value="' +
      v.rep +
      '" max="' +
      (next ? next.at : 100) +
      '"></progress><b>' +
      (next ? next.at - v.rep + " pontos restantes" : "100% dos desbloqueios") +
      "</b></div>";
    let body = "";
    if (allianceTab === "Jornada")
      body =
        '<div class="og-alliance-story"><small>O Coro · ' +
        esc(v.name) +
        "</small><p>" +
        esc(v.story) +
        '</p></div><div class="og-alliance-goal"><b>' +
        (v.step < 3 ? esc(v.missions[v.step]) : "Aliança concluída") +
        " · " +
        v.step +
        "/3</b><p>" +
        esc(v.objective.text) +
        '</p><progress value="' +
        Math.min(v.objective.done, v.objective.total) +
        '" max="' +
        v.objective.total +
        '"></progress><small>' +
        Math.min(v.objective.done, v.objective.total) +
        "/" +
        v.objective.total +
        " · " +
        (v.step < 3
          ? "Concluir etapa: +20 reputação"
          : "Serviços do posto permanecem disponíveis") +
        "</small></div>" +
        (v.step < 3 ? button("Mission", "Entrega no entreposto") : "");
    else if (allianceTab === "Apoio")
      body =
        "<small>Encomendas: +15 reputação · apoio: +10. Cada opção tem limite de cinco contribuições.</small>" +
        button(
          "Deliver",
          "2 " +
            E.materials[v.material].name +
            " · estoque " +
            (s.resources[v.material] || 0),
        ) +
        button("Donate", "Apoiar · saldo " + s.resources.credits + " Lumes");
    else {
      const ship = E.fleetCatalog.SHIPS.find((x) => x.id === v.ship),
        recipe = E.recipes.find((r) => r.id === v.recipe);
      const labels = ["Receita", "Pintura", "Nave"];
      body =
        '<div class="og-post-tabs">' +
        labels
          .map(
            (t, i) =>
              '<button data-alliance-reward="' +
              i +
              '" aria-pressed="' +
              (rewardIndex === i) +
              '">' +
              t +
              "</button>",
          )
          .join("") +
        '</div><div class="og-alliance-reward">' +
        root.OrbitArt.icon(
          rewardIndex === 0
            ? recipe.type
            : rewardIndex === 1
              ? "shield"
              : "engine",
        ) +
        "<b>" +
        esc(
          rewardIndex === 0
            ? recipe.name
            : rewardIndex === 1
              ? "Cores de " + v.name
              : ship.name,
        ) +
        "</b><small>Requer " +
        [40, 60, 80][rewardIndex] +
        " de reputação</small></div>" +
        (rewardIndex === 0
          ? "<p>" +
            esc(recipe.description) +
            "</p><small>" +
            (v.rep >= 40
              ? "Receita liberada na oficina. A fabricação consome ingredientes."
              : "A receita será liberada automaticamente ao atingir 40.") +
            "</small>"
          : rewardIndex === 1
            ? button("Paint", "Pintura de aliança")
            : button(
                "Ship",
                "Desbloqueio permite comprar · saldo " +
                  s.resources.credits +
                  " Lumes",
              ));
    }
    return {
      title: v.name,
      singleCard: true,
      header: header + tabs,
      html:
        '<article class="og-alliance-panel">' + progress + body + "</article>",
    };
  }

  function post(s) {
    const v = E.civilizationView(s);
    const g = v.index === 0 ? E.auralGardenView(s) : null;
    return v.post
      ? '<button class="og-civ-entry" data-action="alien-post">' +
          portrait(v.index) +
          "<span>Posto alienígena<small>" +
          (g?.ready
            ? "Colheita pronta"
            : g?.planted
              ? "Viveiro · " + g.progress + "/2"
              : g?.unlocked
                ? "Viveiro disponível"
                : v.visited
                  ? "Testemunho registrado"
                  : "Ouvir este povo") +
          "</small></span></button>"
      : "";
  }
  root.OrbitCivilizationsUI = {
    entry,
    selectAlliance(tab) {
      if (["Jornada", "Recompensas", "Apoio"].includes(tab)) allianceTab = tab;
    },
    selectReward(i) {
      if (Number.isInteger(i) && i >= 0 && i < 3) rewardIndex = i;
    },
    shiftService(n) {
      servicePlanet = Math.max(0, servicePlanet + n);
    },
    sheet,
    post,
    select(tab) {
      if (["Visit", "Restore", "Exchange", "Service"].includes(tab))
        postTab = tab;
    },
  };
})(window);
