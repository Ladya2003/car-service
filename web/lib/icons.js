const paths = {
  'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
  'arrow-left':'<path d="m12 5-7 7 7 7M5 12h14"/>',
  'arrow-right':'<path d="m12 5 7 7-7 7M5 12h14"/>',
  'arrow-down':'<path d="m5 12 7 7 7-7M12 5v14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM9 12h6M9 16h4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2"/>',
  settings:'<path d="m9 3-1 3-3 1-2 4 2 2v4l4 3 3-1 3 1 4-3v-4l2-2-2-4-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
  diagnostics:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M6 11h3l2-4 2 7 2-3h3"/>',
  oil:'<path d="M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  brakes:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M18 5h3v8h-3M5 5l2 2M4 12h2M6 18l2-2M12 4v2M12 18v2"/>',
  tire:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m12 7 0 4m5 1h-4m-1 5v-4m-5-1h4"/>',
  alignment:'<rect x="3" y="5" width="4" height="14" rx="1"/><rect x="17" y="5" width="4" height="14" rx="1"/><path d="M7 8h10M7 16h10M12 5v14"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.5 1.7c-.9.7-2.6 1.2-2.6 3.3M12 17h.01"/>',
  'circle-check':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  circle:'<circle cx="12" cy="12" r="8"/>',
  send:'<path d="m21 3-7 18-4-8-8-4 19-6ZM10 13 21 3"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};
const glyphs={'↗':'arrow-up-right','←':'arrow-left','→':'arrow-right','↓':'arrow-down','✓':'check','☰':'menu','↻':'refresh','▤':'clipboard','▦':'calendar','⚙':'settings','⌁':'diagnostics','◉':'oil','⊕':'brakes','◎':'tire','⌖':'alignment','●':'circle-check','○':'circle','×':'close'};
export function iconMarkup(name){if(!paths[name])throw new Error('Unknown icon: '+name);return '<svg class="ui-icon" data-icon="'+name+'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[name]+'</svg>';}
export function icon(name){return new DOMParser().parseFromString(iconMarkup(name),'image/svg+xml').documentElement;}
export function iconText(text){const parts=String(text).split(/([↗←→↓✓☰↻▤▦⚙⌁◉⊕◎⌖●○×]|^\+\s)/u);return parts.filter(Boolean).map(part=>glyphs[part]?icon(glyphs[part]):/^\+\s$/.test(part)?icon('plus'):document.createTextNode(part));}
export function iconifyMarkup(html){return html.split(/(<[^>]*>)/g).map(part=>part.startsWith('<')?part:part.replace(/[↗←→↓✓☰↻▤▦⚙⌁◉⊕◎⌖●○×]/gu,glyph=>iconMarkup(glyphs[glyph]))).join('');}
