'use strict';
const assert = require('node:assert/strict');
const E = require('./engine.js');
// Integration tests assemble prerequisites using the same public actions as the UI.
function prepareComponents(state, requirements) {
  for (const [id, amount] of Object.entries(requirements || {})) {
    const missing = Math.max(0, amount - (state.components[id] || 0));
    if (!missing) continue;
    const recipe = E.componentRecipes.find(item => item.id === id);
    prepareComponents(state, Object.fromEntries(Object.entries(recipe.components).map(([key, count]) => [key, count * missing])));
    const result = E.dispatch(state, 'craftComponent', { componentId: id, amount: missing });
    assert.equal(result.ok, true, 'craftComponent ' + id + ': ' + result.message);
    assert.equal(E.validate(state), true);
  }
}
function prepareRecipe(state, id) { prepareComponents(state, E.recipes.find(item => item.id === id).components); }
module.exports = { prepareComponents, prepareRecipe };
