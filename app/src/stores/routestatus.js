// src/stores/counter.js
import { defineStore } from 'pinia';

export const useRouteInfoStore = defineStore('counter', {
  state: () => ({
    count: 0,
    stopId: null,      // New state for stopId
    segmentId: null,   // New state for segmentId
    urlReadyToUpdate: false,
    segmentData: null,
    stopData: null,
    maxSegmentId: 0,
    maxStopId: 0
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
      if (this.maxStopId) {
        if (this.stopId == this.maxStopId) {
          this.stopId = 1
          return
        }
      }
      this.calculateMaxIds()
      this.stopId++;
    },
    previousStop() {
      if (this.maxStopId) {
        if (this.stopId == 1) {
          this.stopId = this.maxStopId
          return
        }
      }
      else {
        this.calculateMaxIds()
      }
      this.stopId--;


      this.stopId--;
    },
    setStop(stopId) {
      this.stopId = stopId;
      console.log(`Set stop to store! ${stopId}`)
    },
    setSegment(segmentId) {
      this.segmentId = segmentId;
    },
    calculateMaxIds(){
      if (this.stopData) {
        this.maxStopId = this.stopData.features.length
      }
      if (this.segmentData) {
        this.maxSegmentId = this.stopData.features.length
      }
      console.log('Set max ids', 'maxStopId:', this.maxStopId, 'maxSegmentId:', this.maxSegmentId)
      console.log('this.stopId', this.stopId)
    },
        // Action to allow URL updates once the router is ready
    setUrlReadyToUpdate() {
      this.urlReadyToUpdate = true;
      console.log('URL is ready to update');
    },
  },
});
