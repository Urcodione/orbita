(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const number = value => Math.round(Number(value) || 0);
  const types = {
    engine: { name: 'Motor', hint: 'Autonomia de voo' },
    warp: { name: 'Dobra', hint: 'Rotas entre galáxias' },
    life: { name: 'Suporte de vida', hint: 'Ar e atmosfera' },
    shield: { name: 'Escudo', hint: 'Proteções especializadas' },
    scanner: { name: 'Scanner', hint: 'Leitura e descoberta' },
    arm: { name: 'Coletor', hint: 'Recursos e amostras' },
    cargo: { name: 'Depósito', hint: 'Carga da expedição' },
    survival: { name: 'Sobrevivência', hint: 'Exploração e retorno' }
  };
  const resourceNames = { ore: 'Minério', crystals: 'Cristais', data: 'Pesquisa', credits: 'Lumes', fuel: 'Combustível', oxygen: 'Oxigênio', warpFuel: 'Células de dobra' };
  const resourceSources = { ore: 'Veios minerais', crystals: 'Depósitos de cristais', data: 'Análises e arquivos', credits: 'Recompensas de expedição' };
  const capNames = { heat: 'Calor', cold: 'Frio', radiation: 'Radiação', pressure: 'Pressão', toxicity: 'Filtragem', gas: 'Sonda atmosférica', liquid: 'Submersão' };
  const drawing = {
    engine: '<path d="M12 5h12v10l5 13H7l5-13Z"/><path d="M12 10h12M11 20h14M12 31l-2 4m6-4v5m4-5 2 4"/>',
    warp: '<ellipse cx="18" cy="18" rx="14" ry="7" transform="rotate(-45 18 18)"/><ellipse cx="18" cy="18" rx="14" ry="7" transform="rotate(45 18 18)"/><circle cx="18" cy="18" r="3"/>',
    life: '<rect x="5" y="8" width="11" height="22" rx="5"/><rect x="20" y="8" width="11" height="22" rx="5"/><path d="M8 8V5h5v3m10 0V5h5v3M5 21h11m4 0h11M16 14h4"/>',
    shield: '<path d="m18 3 13 5v11c0 7-13 14-13 14S5 26 5 19V8Z"/><path d="m18 9 7 4v6l-7 7-7-7v-6Z"/>',
    scanner: '<path d="M9 8a14 14 0 0 0 19 19L9 8Z"/><path d="m18 18 9-9M24 7l5 5M16 27v6m-6 0h13"/><path d="M21 3a12 12 0 0 1 12 12"/>',
    arm: '<path d="M5 30h9v-8l8-6 4 3 6-7-4-7-7 3 1 8M9 22v-8l8-8"/><circle cx="9" cy="14" r="3"/><path d="m26 7-3 6 5 3"/>',
    cargo: '<path d="m4 11 14-7 14 7v16l-14 7-14-7Z"/><path d="m4 11 14 7 14-7M18 18v16M11 8l14 7v6"/>',
    survival: '<rect x="5" y="9" width="26" height="22" rx="5"/><path d="M13 9V5h10v4m-5 6v10m-5-5h10M5 15h4m18 0h4"/>',
    alloy: '<path d="m5 14 9-9 17 4-9 10-17-5Zm0 0v9l17 8 9-10V9M22 19v12"/>',
    prism: '<path d="m18 3 12 12-6 16H12L6 15 18 3Zm0 0-6 12 6 16 6-16L18 3ZM6 15h24"/>',
    circuit: '<rect x="9" y="9" width="18" height="18" rx="3"/><path d="M14 4v5m8-5v5m-8 18v5m8-5v5M4 14h5m-5 8h5m18-8h5m-5 8h5M14 14h8v8h-8Z"/>',
    seal: '<path d="m18 4 12 7v14l-12 7-12-7V11Z"/><circle cx="18" cy="18" r="7"/><path d="M18 4v7m12 14-6-4M6 25l6-4"/>',
    'field-core': '<path d="m18 3 13 8v15l-13 8-13-8V11Z"/><ellipse cx="18" cy="18" rx="5" ry="10"/><path d="m5 11 13 7 13-7M18 18v16"/>',
    battery: '<rect x="9" y="7" width="18" height="26" rx="4"/><path d="M14 7V3h8v4m-3 6-6 9h7l-3 7"/>',
    components: '<path d="m4 12 8-5 8 5v9l-8 5-8-5Z"/><path d="m19 20 7-4 7 4v8l-7 4-7-4ZM12 7v9m-8-4 8 4 8-4M26 16v8m-7-4 7 4 7-4"/>'
  };
  function icon(id, className = '', recipe) {
    if(['alloy','prism','circuit','seal','field-core','battery'].includes(id))return root.OrbitCommerce.symbol(id).replace('class="og-purpose-art"',`class="og-purpose-art og-lab-icon og-component-art ${esc(className)}" data-part="${esc(id)}"`);

    if(window.OrbitArt?.types.includes(id))return window.OrbitArt.icon(id,'og-lab-icon '+className,recipe);
    return `<svg class="og-lab-icon og-component-art ${esc(className)}" data-part="${esc(id)}" viewBox="0 0 36 38" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${drawing[id] || drawing.components}</svg>`;
  }
  let activeState=null;
  const recipes = () => (root.OrbitEngine.recipes || []).filter(recipe=>!recipe.mission||root.OrbitEngine.campaignView?.(activeState)?.unlockedRecipes.includes(recipe.id));
  const components = () => root.OrbitEngine.componentRecipes || [];
  const component = id => components().find(item => item.id === id);
  function capabilities(recipe) {
    return Object.entries(recipe.capabilities || {}).filter(([, value]) => !!value).slice(0, 4).map(([key, value]) => {
      const amount = typeof value === 'boolean' ? '' : ` ${key === 'cold' ? '−' : ''}${number(value)}${({ heat: ' °C', cold: ' °C', radiation: ' rad', pressure: ' atm', toxicity: '%' })[key] || ''}`;
      return `<span>${esc((capNames[key] || key) + amount)}</span>`;
    }).join('');
  }
  function stock(state) {
    return `<div class="og-lab-stock" aria-label="Materiais disponíveis">${['ore', 'crystals', 'data', 'credits'].map(key => `<div data-stock="${key}" aria-label="${resourceNames[key]}: ${number(state.resources[key])}"><span class="og-stock-figure" aria-hidden="true">${key==='data'?root.OrbitCommerce.symbol('research'):key==='credits'?root.OrbitCommerce.symbol('currency'):root.OrbitCommerce.art(key)}</span><strong>${number(state.resources[key])}</strong><small>${resourceNames[key]}</small></div>`).join('')}</div>`;
  }
  function goBack(label) {
    return `<button class="og-lab-back" data-lab-back="previous"><span aria-hidden="true">←</span> ${esc(label)}</button>`;
  }
  const block = (html, extra = '') => `<div class="og-page-block ${extra}">${html}</div>`;
  function panelTabs(lab, isPart = false) {
    const current = lab.panel === 'effect' ? 'effect' : 'recipe';
    return `<div class="og-lab-tabs" role="group" aria-label="Detalhes da receita"><button data-lab-view="recipe" aria-pressed="${current === 'recipe'}">Receita</button><button data-lab-view="effect" aria-pressed="${current === 'effect'}">${isPart ? 'Usos da peça' : 'Efeito na nave'}</button></div>`;
  }
  function inventoryCount(state, recipe) {
    const equipped = Object.values(state.equipped).some(item => item.recipeId === recipe.id);
    const stored = state.inventory.filter(item => item.recipeId === recipe.id).length;
    return equipped ? 'Instalado na nave' : stored ? `${stored} no inventário` : '';
  }
  function entries(recipe) {
    return [
      ...(recipe.questItem?[{id:recipe.questItem,quantity:1,isPart:false,isQuest:true}]:[]),
      ...Object.entries(recipe.components || {}).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ id, quantity, isPart: true })),
      ...Object.entries(recipe.cost || {}).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ id, quantity, isPart: !!component(id) }))
    ];
  }
  function parentRecipe(lab) {
    const previous = lab.history?.[lab.history.length - 1];
    return previous?.page === 'component' ? component(previous.componentId) : previous?.page === 'recipe' ? recipes().find(item => item.id === previous.recipeId) : null;
  }
  function costLabel(recipe, amount) {
    return entries(recipe).map(({ id, quantity, isPart }) => `${quantity * amount} ${isPart ? component(id)?.name || id : resourceNames[id] || id}`).join(' · ');
  }
  function batchInfo(state, recipe, lab) {
    const parent = parentRecipe(lab), need = parent?.components?.[recipe.id];
    const amount = need ? Math.max(0, need - number(state.components?.[recipe.id])) : 0;
    return amount && amount <= 20 ? { amount, parent, preview: root.OrbitEngine.preview(state, 'craftComponent', { componentId: recipe.id, amount }) } : null;
  }
  function recipeProgress(state, recipe) {
    const parts = Object.entries(recipe.components || {});
    const total = parts.reduce((sum, [, quantity]) => sum + quantity, 0);
    const ready = parts.reduce((sum, [id, quantity]) => sum + Math.min(quantity, number(state.components?.[id])), 0);
    if (!total) return '';
    return `<div class="og-lab-progress"><span>${ready === total ? 'Peças prontas para montagem' : 'Preparação das peças'}<strong>${ready} / ${total}</strong></span><progress value="${ready}" max="${total}" aria-label="${ready} de ${total} peças prontas"></progress></div>`;
  }
  function fitPreview(state, recipe) {
    if (!root.OrbitEngine.compareModule) return '';
    const candidate = { ...recipe, id: 'lab-preview', recipeId: recipe.id, level: 1, origin: 'workshop' };
    const comparison = root.OrbitEngine.compareModule({ ...state, inventory: [...state.inventory, candidate] }, candidate.id);
    const value = (v, unit) => typeof v === 'boolean' ? v ? 'Sim' : 'Não' : `${String(v).replace('.', ',')}${unit ? ' ' + unit : ''}`;
    const rows = comparison.rows.filter(row => row.better !== 'neutral');
    return block(`<p class="og-lab-effect-label">${esc(comparison.label)} <span>INSTALADO → NOVO</span></p>`) + rows.map(row => block(`<div class="og-lab-fit-row is-${row.better}"><span>${esc(row.label)}</span><strong><i>${esc(value(row.before, row.unit))}</i><b aria-hidden="true"> → </b>${esc(value(row.after, row.unit))}</strong></div>`)).join('') + (rows.length ? '' : block('<p class="og-lab-note">Mesmo desempenho do módulo instalado.</p>')) + comparison.opens.map(item => block(`<p class="og-lab-world is-up">Libera exploração: <strong>${esc(item.name)}</strong></p>`)).join('') + comparison.closes.map(item => block(`<p class="og-lab-world is-down">Perde acesso: <strong>${esc(item.name)}</strong></p>`)).join('') + block('<p class="og-lab-note">Fabricar guarda o módulo no inventário. A troca é confirmada separadamente.</p>');
  }
  function ingredientRows(state, recipe) {
    return entries(recipe).map(({ id, quantity, isPart, isQuest }) => {
      const part = isPart ? component(id) : null,quest=isQuest?root.OrbitEngine.campaignView(state)?.items.find(item=>item.id===id):null;
      if(quest)return block(`<div class="og-lab-ingredient ${quest.owned?'is-ready':'is-missing'}">${root.OrbitCampaignUI.icon(quest)}<span><strong>${esc(quest.name)}</strong><small>Unique · préservé</small></span><strong>${quest.owned?1:0} / 1</strong></div>`.replace('Unique · préservé','Único · protegido'));
      const owned = number(isPart ? state.components?.[id] : state.resources[id]);
      const missing = Math.max(0, quantity - owned), name = part?.name || resourceNames[id] || root.OrbitEngine.materials?.[id]?.name || id;
      const tag = part ? 'button' : 'div';
      const missingText = `${missing === 1 ? 'Falta' : 'Faltam'} ${missing}`;
      return block(`<${tag} class="og-lab-ingredient ${missing ? 'is-missing' : 'is-ready'}" data-ingredient="${esc(id)}" ${part ? `data-lab-component="${esc(id)}" aria-label="${esc(name)}: ${owned} disponíveis, ${quantity} ${quantity === 1 ? 'necessário' : 'necessários'}. ${missing ? missingText + '. ' : ''}Ver receita."` : ''}><span class="og-lab-ingredient-name">${part ? icon(id) : (['ore','crystals','oxygen','fuel'].includes(id)?root.OrbitCommerce.art(id):`<i class="og-lab-material" data-material="${esc(id)}" aria-hidden="true"></i>`)}<span><strong>${esc(name)}</strong><small>${part ? missing ? 'Toque para fabricar' : 'Ver receita da peça' : resourceSources[id] || 'Material coletado'}</small></span></span><span class="og-lab-quantity"><strong>${owned}<i> / ${quantity}</i></strong><small>${missing ? missingText : 'Disponível'}${part ? ' ›' : ''}</small></span></${tag}>`);
    }).join('');
  }
  function operationButton(state, recipe, isPart, lab) {
    const action = isPart ? 'craftComponent' : 'fabricate';
    const payload = isPart ? { componentId: recipe.id } : { recipeId: recipe.id };
    const preview = root.OrbitEngine.preview(state, action, payload);
    const batch = isPart ? batchInfo(state, recipe, lab) : null;
    const status = preview.allowed ? 'Ingredientes disponíveis' : preview.reason || 'Prepare os ingredientes que faltam.';
    const single = `<button class="og-button ${batch ? 'secondary' : 'primary'} og-lab-craft" data-action="${action}" ${isPart ? 'data-component' : 'data-recipe'}="${esc(recipe.id)}" ${preview.allowed ? '' : 'disabled'} aria-label="${esc(`Fabricar ${isPart ? '1 peça' : recipe.name}${preview.allowed ? '' : '. ' + status}`)}">${isPart ? 'Montar peça' : 'Montar módulo'}</button>`;
    const complete = batch ? `<button class="og-button primary og-lab-craft" data-action="craftComponent" data-component="${esc(recipe.id)}" data-amount="${batch.amount}"  ${batch.preview.allowed ? '' : 'disabled'} title="${esc(batch.preview.reason || costLabel(recipe, batch.amount))}">Montar ${batch.amount} · concluir ingrediente</button>` : '';
    const full=!isPart&&state.inventory.length>=root.OrbitEngine.stats(state).cargoCapacity;
    return `<div class="og-lab-footer">${full?`<div class="og-capacity-tools"><button data-action="modules">♻ Liberar encaixe no estoque</button><button data-module-focus="cargo">▣ Examinar depósito</button></div>`:''}<p class="${preview.allowed ? 'og-lab-ready' : 'og-lab-missing'}" role="status">${esc(status)}</p><div class="og-lab-craft-actions ${batch ? 'has-batch' : ''}">${complete || single}</div></div>`;
  }
  function homePage(state) {
    const choices = Object.entries(types);
    const rows = [];
    const signal=root.OrbitEngine.campaignView?.(state),current=signal?.active?.claimed&&recipes().find(r=>r.id===signal.active.recipeId);
    if(current)rows.push(block(`<button class="og-lab-recipe og-quest-recipe" data-lab-recipe="${esc(current.id)}"><span class="og-lab-recipe-meta">RECEITA DO CORO<span>Ver ingredientes ›</span></span>${icon(current.type,'',current)}<strong>${esc(current.name)}</strong><small>12,5% de resistência dimensional · peça única</small></button>`));
    for (let index = 0; index < choices.length; index += 2) rows.push(block(choices.slice(index, index + 2).map(([type, item]) => `<button class="og-lab-type" data-lab-type="${type}">${icon(type)}<span><strong>${item.name}</strong><small>${item.hint}</small></span></button>`).join(''), 'og-lab-types'));
    return rows.join('');
  }
  function typePage(state, lab) {
    const catalog = recipes().filter(item => item.type === lab.type);
    const cards = catalog.map(recipe => {
      const ready = root.OrbitEngine.preview(state, 'fabricate', { recipeId: recipe.id }).allowed;
      const owned = inventoryCount(state, recipe);
      return `<button class="og-lab-recipe" data-lab-recipe="${esc(recipe.id)}"><span class="og-lab-recipe-meta">${esc(root.OrbitEngine.rarities[recipe.rarity]?.name || 'Especialista')}<span class="${ready ? 'is-ready' : ''}">${ready ? 'Pode fabricar' : 'Ver receita'} ›</span></span>${icon(recipe.type,'',recipe)}<strong>${esc(recipe.name)}</strong><span class="og-lab-description">${esc(recipe.description)}</span>${owned ? `<small class="og-lab-owned">${esc(owned)}</small>` : ''}</button>`;
    });
    return cards.length ? root.OrbitCommerce.pairs(cards) : block('<p>Nenhuma receita disponível nesta categoria.</p>');
  }
  function recipePage(state, lab, recipe) {
    if (lab.panel === 'effect') return block(`<p class="og-lab-description">${esc(recipe.description)}</p>${capabilities(recipe) ? `<div class="og-lab-capabilities">${capabilities(recipe)}</div>` : ''}`) + fitPreview(state, recipe);
    return block(`${recipeProgress(state, recipe)}<div class="og-lab-recipe-label"><span>INGREDIENTES</span><span>ESTOQUE / NECESSÁRIO</span></div>`) + '<div class="og-recipe-ingredients">'+ingredientRows(state, recipe)+'</div>';
  }
  function componentsPage(state) {
    const catalog = components(), rows = [];
    for (let index = 0; index < catalog.length; index += 2) rows.push(block(catalog.slice(index, index + 2).map(part => `<button class="og-lab-component" data-lab-component="${esc(part.id)}">${icon(part.id)}<span><strong>${esc(part.name)}</strong><small>${number(state.components?.[part.id])} em estoque · ${root.OrbitEngine.componentVolume?.(part.id)||1} vol./un.</small></span><b aria-hidden="true">›</b></button>`).join(''), 'og-lab-component-pair'));
    return rows.join('');
  }
  function componentPage(state, lab, part) {
    if (lab.panel === 'effect') {
      const usedBy = recipes().filter(item => item.components?.[part.id]);
      const usedInParts = components().filter(item => item.components?.[part.id]);
      return block(`<p class="og-lab-description">${esc(part.description)}</p>`) + block('<p class="og-lab-recipe-label">RECEITAS QUE USAM ESTA PEÇA</p>') + [...usedInParts, ...usedBy].map(item => block(`<p class="og-lab-use">${esc(item.name)} <span>× ${number(item.components[part.id])}</span></p>`)).join('');
    }
    const batch = batchInfo(state, part, lab);
    return block(`<div class="og-lab-recipe-label"><span>PARA FABRICAR 1 PEÇA</span><span>ESTOQUE / NECESSÁRIO</span></div>`) + ingredientRows(state, part) + (batch ? block(`<p class="og-lab-batch-note">Faltam <strong>${batch.amount}</strong> para ${esc(batch.parent.name)}.</p><p class="og-lab-note">Custo de ${batch.amount}: ${esc(costLabel(part, batch.amount))}</p>${batch.preview.allowed ? '' : `<p class="og-lab-missing">${esc(batch.preview.reason)}</p>`}`) : '');
  }
  function compactIdentity(id, name, caption, backLabel, recipe) {
    return `<div class="og-lab-identity">${backLabel ? `<button class="og-lab-back is-icon" data-lab-back="previous" aria-label="Voltar para ${esc(backLabel)}">←</button>` : ''}${icon(id,'',recipe)}<div><small>${esc(caption)}</small><h3>${esc(name)}</h3></div></div>`;
  }
  function render(state, lab = {}) {
    activeState=state;
    let page = lab.page || 'home', header = '', content = '', footer = '';
    const recipe = recipes().find(item => item.id === lab.recipeId), part = component(lab.componentId);
    if (page === 'recipe' && !recipe || page === 'component' && !part) page = 'home';
    if (page === 'type') {
      const type = types[lab.type] || types.engine;
      header = compactIdentity(lab.type, type.name, type.hint);
      content = typePage(state, lab);
    } else if (page === 'recipe') {
      header = compactIdentity(recipe.type, recipe.name, root.OrbitEngine.rarities[recipe.rarity]?.name || 'Especialista', null,recipe);
      content = block(panelTabs(lab)) + recipePage(state, lab, recipe);
      footer = operationButton(state, recipe, false, lab);
    } else if (page === 'components') {
      header = '';
      content = componentsPage(state);
    } else if (page === 'component') {
      header = compactIdentity(part.id, part.name, `${number(state.components?.[part.id])} em estoque · ${root.OrbitEngine.componentVolume?.(part.id)||1} vol./un.`);
      content = block(`<p class="og-component-purpose">${esc(part.description||'Componente para montagem de módulos.')}</p>`) + componentPage(state, lab, part);
      footer = operationButton(state, part, true, lab);
    } else {
      content = homePage(state);
      footer = '';
    }
    if(page==='recipe'||page==='component'){const list=page==='recipe'?recipes().filter(r=>r.type===recipe.type):components(),selected=page==='recipe'?recipe:part,index=list.findIndex(r=>r.id===selected.id),attr=page==='recipe'?'data-lab-recipe':'data-lab-component';header+=`<div class="og-object-switch"><button data-lab-switch="true" ${attr}="${esc(list[Math.max(0,index-1)].id)}" ${index===0?'disabled':''} aria-label="Cartão anterior">${root.OrbitJourney.cosmicArrow()}<small>Anterior</small></button><span>${index+1} / ${list.length}</span><button data-lab-switch="true" ${attr}="${esc(list[Math.min(list.length-1,index+1)].id)}" ${index===list.length-1?'disabled':''} aria-label="Próximo cartão">${root.OrbitJourney.cosmicArrow(true)}<small>Próximo</small></button></div>`;}
    return { singleCard:page==='component'||(page==='recipe'&&lab.panel!=='effect'),cardKind:page==='component'?'component':page==='recipe'?'recipe':undefined, title: page === 'components' || page === 'component' ? 'Componentes' : 'Construir módulos', header: `<div class="og-lab-fixed">${header}</div>`, html: `<div class="og-lab" data-lab-page="${esc(page)}">${content}</div>`, footer };
  }
  function record(lab) {
    return { page: lab.page || 'home', type: lab.type || null, recipeId: lab.recipeId || null, componentId: lab.componentId || null, returnRecipeId: lab.returnRecipeId || null, panel: lab.panel || 'recipe' };
  }
  function handle(control, lab) {
    const data = control?.dataset;
    if (!data || !lab) return false;
    if (!('labType' in data || 'labRecipe' in data || 'labComponent' in data || 'labBack' in data || 'labTarget' in data || 'labView' in data)) return false;
    if (data.labView) {
      if (!['recipe', 'effect'].includes(data.labView)) return false;
      lab.panel = data.labView;
      return true;
    }
    if (data.labTarget) {
      const target = recipes().find(item => item.id === data.labTarget);
      if (!target) return false;
      const index = (lab.history || []).findLastIndex(item => item.page === 'recipe' && item.recipeId === target.id);
      lab.history = index >= 0 ? lab.history.slice(0, index) : [{ page: 'home' }, { page: 'type', type: target.type }];
      Object.assign(lab, { page: 'recipe', type: target.type, recipeId: target.id, componentId: null, returnRecipeId: target.id, panel: 'recipe' });
      return true;
    }
    if (data.labBack) {
      const previous = Array.isArray(lab.history) ? lab.history.pop() : null;
      if (previous) Object.assign(lab, previous);
      else Object.assign(lab, { page: 'home', type: null, recipeId: null, componentId: null, returnRecipeId: null, history: [], panel: 'recipe' });
      return true;
    }
    const old = record(lab);
    lab.panel = 'recipe';
    if (data.labType) {
      if (data.labType !== 'components' && !types[data.labType]) return false;
      Object.assign(lab, { page: data.labType === 'components' ? 'components' : 'type', type: data.labType === 'components' ? null : data.labType, recipeId: null, componentId: null, returnRecipeId: null });
    } else if (data.labRecipe) {
      const recipe = recipes().find(item => item.id === data.labRecipe);
      if (!recipe) return false;
      Object.assign(lab, { page: 'recipe', type: recipe.type, recipeId: recipe.id, componentId: null, returnRecipeId: recipe.id });
    } else if (data.labComponent) {
      if (!component(data.labComponent)) return false;
      Object.assign(lab, { page: 'component', componentId: data.labComponent, returnRecipeId: lab.returnRecipeId || (lab.page === 'recipe' ? lab.recipeId : null) });
    }
    if(!data.labSwitch)lab.history = [...(Array.isArray(lab.history) ? lab.history : []), old].slice(-12);
    return true;
  }
  function afterCraft(state, lab, options = {}) {
    if (!options.returnToRecipe || lab.page !== 'component' || !parentRecipe(lab)) return false;
    return handle({ dataset: { labBack: 'previous' } }, lab);
  }
  root.OrbitWorkshop = { render, handle, afterCraft, icon };
})(typeof window === 'object' ? window : globalThis);
