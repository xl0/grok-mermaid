// Pure SPA: nothing prerenders and nothing server-renders — every path is
// served by the adapter's fallback page and renders client-side, so a page
// never flashes prerendered content before the URL's state applies.
export const prerender = false;
export const ssr = false;
