// Browser tests hand the game a journey the way a reopened game finds one: in its own save slot (voyage-services.js).
const KEY = 'orbita-explorador-v1';
// Every page load of this page starts from this journey (a game reopened on it).
function seed(page, content) {
  return page.addInitScript(([key, value]) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [KEY, content]);
}
// Swap the journey of an open page: stop the running game (so its last save cannot overwrite the slot), write, reload.
async function load(page, content) {
  await page.evaluate(([key, value]) => { window.orbitApp?.destroy(); localStorage.setItem(key, JSON.stringify(value)); }, [KEY, content]);
  await page.reload();
  await page.waitForFunction(() => window.orbitApp);
}
// The latest save the game wrote, in the shape of an exported journey.
function last(page) {
  return page.evaluate(key => { const text = localStorage.getItem(key); return text ? { privateContent: JSON.parse(text) } : null; }, KEY);
}
module.exports = { seed, load, last };
