// src/stores/counter.js
import { defineStore } from 'pinia';

export const useRouteInfoStore = defineStore('counter', {
  state: () => ({
    count: 0,
    stopId: 0,      // New state for stopId
    segmentId: 0,   // New state for segmentId
    urlReadyToUpdate: false
  }),
  getters: {
    doubled: (state) => state.count * 2,
        // You can create custom getters for stopId or segmentId if needed
    stopSegmentInfo: (state) => {
      return { stopId: state.stopId, segmentId: state.segmentId };
    },
  },
  actions: {
    nextStop() {
      console.log(this.count);
      this.stopId++;
    },
    previousStop() {
      this.stopId--;
    },
    setStop(stopId) {
      this.stopId = stopId;
      console.log(`Set stop to store! ${stopId}`)
    },
    setSegment(segmentId) {
      this.segmentId = segmentId;
    },
        // Action to allow URL updates once the router is ready
    setUrlReadyToUpdate() {
      this.urlReadyToUpdate = true;
      console.log('URL is ready to update');
    },
  },
});
