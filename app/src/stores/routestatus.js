
import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';
import {defineStore} from 'pinia';
const {getFilePath} = useCorrectBasePath();

function isNumericNumber(str) {
  return !Number.isNaN(parseFloat(str));
}

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
        // --------------------
        routeData: null,
        loading: false,
        error: null,
        activeStep: null, // This is the index in the sequence. It is 1-based, so to get the actual data do - 1
        activeFeature: null,
        activeTopic: 'overview', // This can be 'overview', 'route' or 'extra'
        maxStepId: null,
        refreshNeeded: false,

    }),
    getters: {
        doubled: (state) => state.count * 2,
        // You can create custom getters for stopId or segmentId if needed
        stopSegmentInfo: (state) => {
            return {stopId: state.stopId, segmentId: state.segmentId};
        },
        routeMetadata: (state) => state.routeData?.metadata,
        orderedFeatures: (state) => state.routeData?.features,
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
            console.debug(`Store: try setting stop id ${stopId} to store + activate!`, 'max:', this.maxStopId, "topic:", this.activeTopic)
            if (this.activeTopic === 'overview' && stopId === null) {
                this.stopId = stopId;
                return
            }
            this.stopId = Math.max(stopId, 1)
            if (this.maxStopId) {
                this.stopId = Math.min(Math.max(stopId, 1), this.maxStopId);
                console.debug(`Store: set stop id ${this.stopId} to store`)
            }

            if (this.stopData) {
                this.activeFeature = this.stopData.features[this.stopId - 1]
            } else {
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
        async loadRouteData() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch(getFilePath('geojson/bundled_route_data.json.min'));
                if (!response.ok) {
                    throw new Error(`Failed to fetch route data: ${response.status}`);
                }
                this.routeData = await response.json();
            } catch (error) {
                this.error = error.message;
                console.error('Error loading route data:', error);
            } finally {
                this.loading = false;
                console.log("Store: loaded all data", this.routeData)
                this.maxStepId = this.routeData.sequence.length
                if (this.activeStep) {
                    console.log('Store. After data load. There is a step', this.activeStep, 'Setting active feature!')
                    this.setActiveRouteFeatureFromStepId(this.activeStep)
                }
            }
        },
        setActiveFeature(topic, geomType, id) {
            console.log("setActiveFeature", this.routeData.features[topic][geomType])
          this.activeFeature = this.routeData.features[topic][geomType].find(feature => feature.id === id) || null;
          if (this.activeFeature) {
            this.setActiveTopic(topic);
          }
        },
        setActiveRouteFeatureFromStepId(stepId, topic) {
            if (stepId)  {
                const sequenceInfo = this.routeData.sequence[stepId - 1]
                console.log("--> Setting active feature to ", sequenceInfo)
                this.setActiveFeature('route', sequenceInfo.type, sequenceInfo.id)
            }
            else {
                this.activeFeature = null;
            }
        },
        setActiveStep(stepId) {
            console.log("Setting Active step to ", stepId)
            this.activeStep = Number(stepId);
            if (this.routeData) {
                this.setActiveRouteFeatureFromStepId(stepId);
            }

        },
        setActiveStepFromFeature(id, geomType, topic) {
            const sequence = this.routeData.sequence;
            // Ensure the sequence is valid and has entries
            if (!sequence || !Array.isArray(sequence)) {
                console.error("Invalid sequence data");
                return null;
            }
            // Iterate through the sequence to find a match
            const matchingEntry = sequence.find(entry => {
                return entry.id === id && entry.type === geomType && (topic==='route' ? true : entry.extra);
            });
              // Find the index of the matching entry in the sequence array
              const position = sequence.findIndex(entry => {
                return entry.id === id && entry.type === geomType && (topic==='route' ? true : entry.extra);
              });

            console.log("setActiveStepFromFeature : ", position, matchingEntry)
            this.setActiveStep(position + 1);

            // Return the found sequence ID or null if not found
            return matchingEntry ? matchingEntry.id : null;
        },
        setActiveTopic(newtopic) {
          this.activeTopic = newtopic
            // if (newtopic === 'overview') {
            //     this.setActiveStep(null)
            // }
        },
        nextStep() {
            console.log('nextStep called', {
                activeStep: this.activeStep,
                maxStepId: this.maxStepId
            });

            if (this.activeStep === null || this.activeStep >= this.maxStepId) {
                this.setActiveStep(1);
            }
            else {
                this.setActiveStep(this.activeStep + 1);
            }
        },
        previousStep() {
            console.log('previousStep called', {
                activeStep: this.activeStep,
                maxStepId: this.maxStepId
            });

            if (this.activeStep === null || this.activeStep <= 1) {
                this.setActiveStep(this.maxStepId);
            }

            else {
                this.setActiveStep(this.activeStep - 1);
            }
        },
        setRefreshNeeded() {
            if (this.routeData) {
                this.refreshNeeded = true;
                return
            }
            this.refreshNeeded = false;
        },


    },
});
