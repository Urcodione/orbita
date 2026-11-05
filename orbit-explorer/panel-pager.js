(function () {
  'use strict';
  // Pages preserve the real controls and split content at semantic boundaries.
  const containers = '.og-lab,.og-module-list,.og-comparison,.og-facts,.og-system-metrics,.og-system-operations,.og-requirements,.og-instructions,.og-lab-fit-rows,.og-catalog-list,.og-xeno-collection,.og-fleet-list,.og-xeno-modules,.og-xeno-hints,.og-xeno-runes,.og-xeno-tools,.og-record-list,.og-record-stats,.og-civ-cards';
  function wrapLike(parent, child) {
    const wrapper = parent.cloneNode(false);
    wrapper.removeAttribute('id');
    wrapper.append(child);
    return wrapper;
  }
  function split(node) {
    if (node.matches?.('table')) {
      const rows = [...node.querySelectorAll('tbody>tr')];
      if (rows.length > 1) return rows.map(row => {
        const table = node.cloneNode(false);
        for (const header of node.querySelectorAll(':scope>caption,:scope>thead')) table.append(header.cloneNode(true));
        const body = document.createElement('tbody'); body.append(row); table.append(body); return table;
      });
    }
    if (node.children?.length > 1 && !node.matches('button,select,form,.og-circuit,.og-module-head,.og-name-form,.og-paints,.og-lab-type-row')) {
      return [...node.children].map(child => wrapLike(node, child));
    }
    if (node.children?.length === 1 && !node.matches('button,select,form')) {
      const parts = split(node.firstElementChild);
      if (parts.length > 1) return parts.map(child => wrapLike(node, child));
    }
    if (node.matches?.('p,li') && node.textContent.length > 160) {
      const words = node.textContent.split(/\s+/), mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid), words.slice(mid)].map(part => { const copy = node.cloneNode(false); copy.textContent = part.join(' '); return copy; });
    }
    return [node];
  }
  function flatten(node) {
    if (!node.matches?.(containers)) return [node];
    return [...node.children].flatMap(child => flatten(child).map(part => wrapLike(node, part)));
  }
  function mount(content, controls, requested = 0) {
    const height = content.clientHeight;
    const queue = [...content.children].flatMap(flatten), pages = [];
    content.replaceChildren();
    const make = () => { const page = document.createElement('div'); page.className = 'og-page-body'; content.append(page); pages.push(page); return page; };
    let page = make(), attempts = 0;
    // Fast path: most panels fit on one page. Measure once instead of forcing a layout after every appended node.
    page.append(...queue);
    if (page.scrollHeight <= height + 1) queue.length = 0;
    else page.replaceChildren();
    while (queue.length && attempts++ < 600) {
      const node = queue.shift(); page.append(node);
      if (page.scrollHeight <= height + 1) continue;
      node.remove();
      if (page.children.length) { page.hidden = true; page = make(); queue.unshift(node); continue; }
      const parts = split(node);
      if (parts.length > 1) { queue.unshift(...parts); continue; }
      page.append(node);
    }
    const index = Math.max(0, Math.min(requested, pages.length - 1));
    pages.forEach((item, i) => { item.hidden = i !== index; });
    controls.querySelector('.og-page-status').textContent = (index + 1) + ' / ' + pages.length;
    controls.querySelector('[data-sheet-page="-1"]').disabled = index === 0;
    controls.querySelector('[data-sheet-page="1"]').disabled = index === pages.length - 1;
    controls.classList.toggle('is-single', pages.length === 1);
    content.dataset.page = index;
    content.dataset.pages = pages.length;
    return index;
  }
  window.OrbitPanelPager = { mount };
})();
