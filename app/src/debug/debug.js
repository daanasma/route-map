import { useSettingsStore } from '../stores/settings.js';

export function log(...args) {
  const settingsStore = useSettingsStore();
  if (!settingsStore.isDebugMode) return;
  const stack = new Error().stack;
  const callerLine = stack.split('\n')[2]; // 2nd line is the direct caller
  const location = callerLine ? callerLine.trim() : '';

  console.log('[DEBUG]',  ...args, location);
}
