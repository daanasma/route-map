
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
        orderedRouteFeatures: null,
        loading: false,
        error: null,
        activeStep: null, // This is the index in the sequence. It is 1-based, so to get the actual data do - 1
        activeFeature: null,
        activeTopic: 'overview', // This can be 'overview', 'route' or 'extra'
        maxStepId: null,
        refreshNeeded: false,

    }),
    getters: {
        stopSegmentInfo: (state) => {
            return {stopId: state.stopId, segmentId: state.segmentId};
        },
        routeMetadata: (state) => state.routeData?.metadata,
        orderedFeatures: (state) => state.routeData?.features,
        getFilteredFeatures: (state) => (
            filterTopic = null,
            filterFeatureType = null) => {
            if (!state.routeData || !state.routeData.features) return [];
            return state.routeData.features.filter(feature => {
                const topicMatch = !filterTopic || feature.topic === filterTopic;
                const typeMatch = !filterFeatureType || feature.type === filterFeatureType;
                return topicMatch && typeMatch;
            });
        },
        getAllRouteFeatures: (state) => {
          if (!state.routeData || !state.routeData.features) return [];
          return state.routeData.features.filter(feature => feature.topic === 'route');
        },
        getRouteFeatureFromStepId: (state) => () => {
            if (!state.routeData || !state.routeData.sequence) {
                console.log("Store: there is no route data so we cant get an active feature.")
                return null
            };
            const step = state.routeData.features[state.activeStep -1];
            if (!step) return null;
            return step
            }
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
                    console.log('Store. After data load. There is a step (', this.activeStep, ') Setting active feature!')
                    this.setActiveRouteFeatureFromStepId(this.activeStep)
                }
            }
        },
        setActiveFeature(topic, geomType, id) {
            this.activeFeature = this.getRouteFeatureFromStepId(2)
            console.log("active", this.activeFeature)
           //  console.log("setActiveFeature", this.routeData.features[topic][geomType])
           // = this.routeData.features[topic][geomType].find(feature => feature.id === id) || null;
          if (this.activeFeature) {
            this.setActiveTopic(topic);
          }
        },
        setActiveRouteFeatureFromStepId(stepId) {
            if (stepId)  {
                this.activeFeature = this.getRouteFeatureFromStepId(stepId)
                this.setActiveTopic('route')
            }
            else {
                this.activeFeature = null;
            }
        },
        setActiveStep(stepId) {
            console.log("Start setting Active step to ", stepId)
            this.activeStep = Number(stepId);
            this.setActiveRouteFeatureFromStepId(stepId);
        },
        setActiveTopic(newtopic, refreshneeded) {
          this.activeTopic = newtopic
            if (refreshneeded === true) {
                console.log("Refreshneeded")
                this.setRefreshNeeded()
            }
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
