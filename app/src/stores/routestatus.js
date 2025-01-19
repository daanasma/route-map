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
    maxStopId: 0,
    activeTopic: 'overview',
    activeFeature: null,
    refreshNeeded: false,
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
          this.setStop(1)
          return
        }
      }
      this.calculateMaxIds()
      this.setStop(Number(this.stopId) + 1, 1)
    },

    previousStop() {
      if (this.maxStopId) {
        if (this.stopId == 1) {
          this.setStop(this.maxStopId)
          return
        }
      }
      else {
        this.calculateMaxIds()
      }
      this.setStop(Number(this.stopId) - 1)
      },

    setStop(stopId) {
      this.stopId = Math.min(Math.max(stopId, 1), this.maxStopId);
      if (this.stopData) {
        this.activeFeature = this.stopData.features[this.stopId-1]
      }
      else {
        console.log('tried to set active Feature but there was no stopData in store.')
      }
      console.log(`Set stop to store! ${this.stopId}`)
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
