// Determine debug mode from env or URL param
const debug = Boolean(
  import.meta.env.VITE_DEBUG === 'true' ||
  new URLSearchParams(window.location.search).get('debug') === '1'
);

export function log(...args) {
  if (!debug) return;

  const stack = new Error().stack;
  const callerLine = stack.split('\n')[2]; // 2nd line is the direct caller
  const location = callerLine ? callerLine.trim() : '';

  console.log('[DEBUG]',  ...args, location);
}
