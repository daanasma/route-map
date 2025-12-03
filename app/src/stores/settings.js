// stores/settings.js
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    isDebugMode: false,
  }),
  actions: {
    // Deze actie wordt extern aangeroepen
    setDebugMode(isEnabled) {
      this.isDebugMode = isEnabled;
      // Sla op in sessionStorage voor persistentie over reloads
      sessionStorage.setItem('appDebugMode', String(isEnabled));
      console.log('Set debug mode: ', isEnabled)

    },
    // Initialiseer bij app-start vanuit storage/env
    initializeFromStorage() {
        console.log('init from storage')
        const envDebug = import.meta.env.VITE_DEBUG === 'true';
        const storedDebug = sessionStorage.getItem('appDebugMode') === 'true';
        this.isDebugMode = envDebug || storedDebug;
    }
  },
});
