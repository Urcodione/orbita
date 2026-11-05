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
    return {
      title: v.name,
      header,
      html:
        '<div class="og-civ-cards"><article><p>' +
        esc(v.line) +
        "</p><strong>Aliança · " +
        v.step +
        "/3</strong><p>" +
        esc(v.objective.text) +
        " · " +
        Math.min(v.objective.done, v.objective.total) +
        "/" +
        v.objective.total +
        "</p>" +
        (v.step < 3 ? button("Mission", esc(v.missions[v.step])) : "") +
        "</article>" +
        button("Deliver", "Encomenda · 2 " + E.materials[v.material].name) +
        button("Donate", "Apoio aos postos") +
        "<article><strong>40 · Receita exclusiva</strong><p>" +
        esc(E.recipes.find((r) => r.id === v.recipe).name) +
        "</p><small>" +
        (v.rep >= 40
          ? "Disponível na oficina."
          : "Ganhe reputação para liberar na oficina.") +
        "</small></article>" +
        button("Paint", "60 · Pintura de aliança") +
        button(
          "Ship",
          "80 · " + E.fleetCatalog.SHIPS.find((x) => x.id === v.ship).name,
        ) +
        "</div>",
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
    sheet,
    post,
    select(tab) {
      if (["Visit", "Restore", "Exchange"].includes(tab)) postTab = tab;
    },
  };
})(window);
