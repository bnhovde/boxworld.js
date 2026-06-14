// Built-in UI icons, inlined as data URIs so the engine has no required image
// assets. Authors only host their own game sprites.
const toDataUri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;

// The "continue" glyph shown in the dialogue box.
const ENTER_SVG = `<svg width="160" height="100" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg"><g><rect width="155" height="20" transform="matrix(-1 0 0 1 155 40)" fill="black"/><rect width="20" height="60" transform="matrix(-1 0 0 1 160 0)" fill="black"/><rect width="20" height="100" transform="matrix(-1 0 0 1 60 0)" fill="black"/><rect width="40" height="60" transform="matrix(-1 0 0 1 60 20)" fill="black"/></g></svg>`;

// The "!" bubble shown over nearby interactive entities.
const ATTENTION_SVG = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="55" width="100" height="125" fill="white"/><rect x="90" y="135" width="20" height="20" fill="black"/><rect x="90" y="95" width="20" height="20" fill="black"/><rect x="90" y="75" width="20" height="20" fill="black"/><rect x="90" y="180" width="20" height="20" fill="white"/></svg>`;

export const ENTER_ICON = toDataUri(ENTER_SVG);
export const ATTENTION_ICON = toDataUri(ATTENTION_SVG);
