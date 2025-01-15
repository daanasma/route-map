// src/stores/counter.js
import { defineStore } from 'pinia';

export const useRouteStatusStore = defineStore('counter', {
  state: () => ({
    count: 0,
    stopId: null,      // New state for stopId
    segmentId: null,   // New state for segmentId
  }),
  getters: {
    doubled: (state) => state.count * 2,
        // You can create custom getters for stopId or segmentId if needed
    stopSegmentInfo: (state) => {
      return { stopId: state.stopId, segmentId: state.segmentId };
    },
  },
  actions: {
    increment() {
      console.log(this.count);
      this.count++;
    },
    decrement() {
      this.count--;
    },
    setStop(stopId) {
      this.stopId = stopId;
      console.log(`Set stop to store! ${stopId}`)
    },
    setSegment(segmentId) {
      this.segmentId = segmentId;
    },
  },
});
