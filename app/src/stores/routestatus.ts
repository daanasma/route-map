// src/stores/counter.ts
import { defineStore } from 'pinia';

// Define the state type
interface CounterState {
  count: number;
}

export const useRouteStatusStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 0,
  }),
  getters: {
    doubled: (state:any): number => state.count * 2,
  },
  actions: {
    increment() {
      console.log(this.count)
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
});
