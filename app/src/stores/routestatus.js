// src/stores/counter.js
import { defineStore } from 'pinia';

export const useRouteStatusStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    doubled: (state) => state.count * 2,
  },
  actions: {
    increment() {
      console.log(this.count);
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
});
