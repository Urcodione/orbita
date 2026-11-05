(function (root) {
  "use strict";
  let active = null;
  function show(container, kind, state, short = false) {
    if (active || state.guide?.active) return;
    const reduced = root.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const el = document.createElement("section");
    el.className = "og-arrival " + kind;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute(
      "aria-label",
      kind === "dock" ? "Atracagem no entreposto" : "Colheita preservada",
    );
    const ship = state.fleet?.active || "andorinha";
    const biome = root.OrbitEngine.currentPlanet(state).biome;
    const sample = Object.keys(root.OrbitEngine.materials).find(
      (id) =>
        root.OrbitEngine.materials[id].category === "Flora" &&
        root.OrbitEngine.materials[id].biomes.includes(biome),
    );
    const src =
      root.OrbitIllustrations?.[ship === "andorinha" ? "ship" : "hull-" + ship];
    el.innerHTML =
      '<div class="og-arrival-scene" style="background-image:url(' +
      root.OrbitIllustrations["arrival-" + kind] +
      ')"></div>' +
      (kind === "dock"
        ? '<img alt="" src="' + src + '">'
        : '<span class="og-arrival-sample">' +
          (sample ? root.OrbitCommerce.art(sample) : "") +
          "</span>") +
      "<p>" +
      (kind === "dock"
        ? "Acoplagem concluída. Bem-vindo ao entreposto."
        : "A amostra está selada. Uma nova história viaja com você.") +
      '</p><button class="og-button">Continuar</button>';
    const previousFocus = document.activeElement;
    const siblings = [...container.children].map((node) => [node, node.inert]);
    let frame = 0;
    const close = () => {
      cancelAnimationFrame(frame);
      clearTimeout(active?.timer);
      el.remove();
      active = null;
      for (const [node, inert] of siblings)
        if (node.isConnected) node.inert = inert;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
    el.querySelector("button").onclick = close;
    if (
      kind === "harvest" &&
      biome !== "forest" &&
      root.OrbitIllustrations.landscapes
    ) {
      const canvas = document.createElement("canvas");
      canvas.className = "og-arrival-landscape";
      el.prepend(canvas);
      const image = new Image();
      image.src = root.OrbitIllustrations.landscapes;
      image.onload = () => {
        if (!el.isConnected) return;
        const panel =
          {
            desert: 1,
            ice: 2,
            crystal: 3,
            rogue: 3,
            volcanic: 4,
            magma: 4,
            toxic: 5,
            ocean: 6,
            gas: 7,
          }[biome] ?? 0;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        const ctx = canvas.getContext("2d"),
          pw = image.width / 2,
          ph = image.height / 4,
          start = performance.now();
        const draw = (now) => {
          if (!el.isConnected) return;
          const scale =
            Math.max(canvas.width / pw, canvas.height / ph) *
            (reduced ? 1 : 1.08 - 0.06 * Math.min(1, (now - start) / 4200));
          const w = pw * scale,
            h = ph * scale;
          ctx.drawImage(
            image,
            (panel % 2) * pw,
            Math.floor(panel / 2) * ph,
            pw,
            ph,
            (canvas.width - w) / 2,
            (canvas.height - h) / 2,
            w,
            h,
          );
          if (!reduced) frame = requestAnimationFrame(draw);
        };
        el.querySelector(".og-arrival-scene").hidden = true;
        draw(start);
      };
    }
    for (const [node] of siblings) node.inert = true;
    el.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        el.querySelector("button").focus();
      }
    });
    container.append(el);
    el.querySelector("button").focus({ preventScroll: true });
    active = {
      el,
      timer: setTimeout(close, reduced ? 500 : short ? 1400 : 4200),
    };
  }
  root.OrbitArrivalCinema = {
    show,
    close() {
      active?.el.querySelector("button").click();
    },
  };
})(window);
