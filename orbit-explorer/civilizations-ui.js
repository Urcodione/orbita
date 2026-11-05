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
  function sheet(name, s) {
    if (name !== "civilizations" && name !== "alien-post") return null;
    const v = E.civilizationView(s);
    const button = (action, label) => {
      const costs = {
        Donate: { credits: 100 },
        Deliver: { [v.material]: 2 },
        Ship: { credits: E.fleetCatalog.SHIPS.find((ship) => ship.id === v.ship).price },
        Mission: [{ ore: 6, crystals: 2 }, { data: 30 }, { [v.material]: 3, data: 50 }][v.step] || {},
      };
      const q = v.actions[action],
        required = costs[action] || {},
        cost = Object.entries(required)
          .map(
            ([k, n]) =>
              n +
              " " +
              (E.materials[k]?.name ||
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
    if (name === "alien-post")
      return {
        title: "Posto alienígena",
        singleCard: true,
        header,
        html:
          '<img class="og-post-landscape" src="' +
          root.OrbitIllustrations["alien-post"] +
          '" alt="Posto sob o céu de um mundo distante"><p>' +
          esc(v.line) +
          "</p>" +
          button("Visit", "Uma voz preservada"),
      };
    return {
      title: v.name,
      header,
      html:
        '<div class="og-civ-cards"><article><p>' +
        esc(v.line) +
        "</p><strong>Aliança · " +
        v.step +
        "/3</strong><p>" +
        [
          "Restaurar as instalações · entregar 6 minério e 2 cristais.",
          "Ouvir o posto em " + esc(v.planet.name) + " e levar seu testemunho.",
          "Conectar a memória do posto ao Coro.",
          "Aliança concluída. Este povo faz parte da sua jornada.",
        ][v.step] +
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
    return v.post
      ? '<button class="og-civ-entry" data-action="alien-post">' +
          portrait(v.index) +
          "<span>Posto alienígena<small>" +
          (v.visited ? "Testemunho registrado" : "Ouvir este povo") +
          "</small></span></button>"
      : "";
  }
  root.OrbitCivilizationsUI = { entry, sheet, post };
})(window);
