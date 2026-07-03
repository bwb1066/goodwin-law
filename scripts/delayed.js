import { getMetadata } from './aem.js';

// Brand Concierge widget. Configuration is driven entirely by AEM DA page
// metadata (concierge-url / concierge-key / concierge-site), so authors can
// enable/point the widget without a code change. The widget is served from the
// consolidated gizmo repo and renders its own trigger + styles.
const WIDGET_URL = 'https://bwb1066.github.io/brand-concierge/widget/brand-concierge.js';
const WIDGET_BASE = WIDGET_URL.replace(/[^/]+$/, '');

async function loadConcierge() {
  const supabaseUrl = getMetadata('concierge-url');
  const anonKey = getMetadata('concierge-key');
  const siteKey = getMetadata('concierge-site');
  // No concierge metadata on this page → nothing to load.
  if (!supabaseUrl || !anonKey || !siteKey) return;

  // eslint-disable-next-line import/no-unresolved
  const { init } = await import(WIDGET_URL);
  init({
    supabaseUrl,
    anonKey,
    siteKey,
    widgetBase: WIDGET_BASE,
    showTrigger: true,
    triggerStyle: 'tab',
  });
}

loadConcierge();
