
import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';
import mapConfig from '@/config/mapConfig.js'
import {defineStore} from 'pinia';
const {getFilePath} = useCorrectBasePath();


function isNumericNumber(str) {
  return !Number.isNaN(parseFloat(str));
}

export const useRouteInfoStore = defineStore('counter', {
    state: () => ({
        mapId: null, // the map
        theme: 'default',
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
        activeStep: null, // This is the index in the sequence. It is 1-based, so to get the actual data do - 1
        activeFeature: null,
        activeTopic: 'overview', // This can be 'overview', 'route' or 'extra'
        maxStepId: null,
        refreshNeeded: false,

    }),
    getters: {
        routeMetadata: (state) => state.routeData?.metadata,
        getFullRouteElevation: (state) => {
            if (!state.routeData || !state.routeData.features) return [];
            let accumulatedDistance = 0;
            return state.getFilteredAndSortedFeatures(feature => feature.type === 'line')
        .flatMap(feature => {
            const adjustedElevation = feature.elevation?.map(point => ({
                ...point,
                distance_along_line: point.distance_along_line + accumulatedDistance
            })) || [];

            if (adjustedElevation.length > 0) {
                accumulatedDistance = adjustedElevation[adjustedElevation.length - 1].distance_along_line;
            }

            return adjustedElevation;
        });
            },
        getFilteredAndSortedFeatures: (state) => (filterFn) => {
            if (!state.routeData || !state.routeData.features) return [];

            return state.routeData.features
                .filter(filterFn)
                .sort((a, b) => {
                    const aStep = a.properties?.route_sequence_id ?? Infinity;
                    const bStep = b.properties?.route_sequence_id ?? Infinity;
                    return aStep - bStep;
                });
        },
        getAllRouteFeatures: (state) => {
            return state.getFilteredAndSortedFeatures(feature => feature.topic === 'route');
        },
        getFilteredFeatures: (state) => (customFilter) => {
            return state.getFilteredAndSortedFeatures(customFilter);
        },
        getRouteFeatureFromStepId: (state) => () => {
            if (!state.routeData || !state.routeData.sequence) {
                console.log("Store: there is no route data so we cant get an active feature.")
                return null
            };
            const step = state.getAllRouteFeatures[state.activeStep -1];
            if (!step) return null;
            return step
            }
    },
    actions: {
        setMapId(id) {
          this.mapId = id;
          if (id in mapConfig.configuredRoutes) {
              this.setMapTheme(mapConfig.configuredRoutes[id].theme)
          }
        },
        setMapTheme(theme) {
            this.theme = theme
            document.documentElement.setAttribute("data-theme", theme);

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
                const response = await fetch(getFilePath(`map/${this.mapId}/geojson/bundled_route_data.json.min`));
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
            this.activeFeature = this.getRouteFeatureFromStepId(id)
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
