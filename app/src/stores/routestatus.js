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
    maxSegmentId: null,
    maxStopId: null,
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
    console.log('nextStop called', {
      currentStopId: this.stopId,
      maxStopId: this.maxStopId
    });

    if (!this.maxStopId) {
      this.calculateMaxIds();
    }

    if (this.stopId === null) {
      this.setStop(1);
      return;
    }

    if (this.stopId >= this.maxStopId) {
      this.setStop(1);
    } else {
      this.setStop(Number(this.stopId) + 1);
    }
  },
  previousStop() {
    console.log('previousStop called', {
      currentStopId: this.stopId,
      maxStopId: this.maxStopId
    });

    if (!this.maxStopId) {
      this.calculateMaxIds();
    }

    if (this.stopId === null) {
      this.setStop(this.maxStopId);
      return;
    }

    if (this.stopId <= 1) {
      this.setStop(this.maxStopId);
    } else {
      this.setStop(Number(this.stopId) - 1);
    }
  },
  setStop(stopId) {
    console.debug(`Store: try setting stop id ${stopId} to store + activate!`, 'max:', this.maxStopId)
    this.stopId = Math.max(stopId, 1)
    if (this.maxStopId) {
      this.stopId = Math.min(Math.max(stopId, 1), this.maxStopId);
      console.debug(`Store: set stop id ${this.stopId} to store`)
    }

    if (this.stopData) {
      this.activeFeature = this.stopData.features[this.stopId - 1]
    }
    else {
      console.debug('Store: tried to set active Feature but there was no stopData in store.')
    }
  },

  setSegment(segmentId) {
    this.segmentId = segmentId;
  },
  setSegmentData(data) {
    this.segmentData = data;
    console.log('Store: set segmentdata:', this.segmentData)
    this.setRefreshNeeded(true);
  },
  setStopData(data) {
    this.stopData = data;
    console.log('Store: set stopdata:', this.stopData)
    this.setRefreshNeeded(true);
  },
    setRefreshNeeded(value) {
      if (typeof this.segmentData == 'object' && typeof this.stopData == 'object') {
        this.refreshNeeded = value;
        return
      }
      this.refreshNeeded = false;
    },
    calculateMaxIds() {
      if (this.stopData) {
        this.maxStopId = this.stopData.features.length
      }
      if (this.segmentData) {
        this.maxSegmentId = this.stopData.features.length
      }
      console.log('Store: Set max ids', 'maxStopId:', this.maxStopId, 'maxSegmentId:', this.maxSegmentId)
      console.log('Store: this.stopId', this.stopId)
    },
      // Action to allow URL updates once the router is ready
  setUrlReadyToUpdate() {
    this.urlReadyToUpdate = true;
    console.log('Store: URL is ready to update');
  },
  },
});
