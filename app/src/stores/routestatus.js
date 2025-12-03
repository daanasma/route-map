import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';
import mapConfig from '@/config/mapConfig.js'
import {defineStore} from 'pinia';
import { log } from '@/debug/debug.js';
import { metersToKm } from '@/utils/length.js';

const {getFilePath} = useCorrectBasePath();


export const useRouteInfoStore = defineStore('routeInfo', {
    state: () => ({
        mapId: null,
        theme: 'default',
        routeData: null,
        loading: false,
        activeStepId: null,  // Just store the ID, compute the rest
        activeTopic: null,
        refreshMapTrigger: 0, // when increased, can be used to trigger manual refreshes.
    }),

    getters: {
        routeMetadata: (state) => state.routeData?.metadata,
        routeSequence: (state) => state.routeData?.sequence,
        routeLengthKm() { // Gebruik een reguliere functie zodat 'this' correct gebonden is
            // 'this' verwijst naar de store-instantie, inclusief de 'routeMetadata' getter
            const meters = this.routeMetadata?.total_length_in_m ?? 0;
            return metersToKm(meters);
        },
        maxStepId: (state) => {
                    if (!state.routeData?.sequence) return null;
                    return Math.max(...state.routeData.sequence.map(s => s.route_step));
                },

        // Get current step data from sequence
        activeStepData: (state) => {
            if (!state.activeStepId || !state.routeSequence) return null;
            return state.routeSequence.find(s => s.route_step === state.activeStepId);
        },

        activeStepLengthKm() {
            const meters = this.activeStepData?.length_in_m ?? 0;
            return metersToKm(meters);
          },
        // Get all features that belong to route topic
        routeFeatures: (state) => {
            if (!state.routeData?.features) return [];
            return state.routeData.features
                .filter(f => f.topic === 'route')
                .sort((a, b) => {
                    const aStep = a.properties?.route_sequence_id ?? Infinity;
                    const bStep = b.properties?.route_sequence_id ?? Infinity;
                    return aStep - bStep;
                });
        },

        // Get features for active step
        activeStepFeatures: (state) => {
            if (!state.activeStepId) return [];
            return state.routeFeatures.filter(f => {
                const stepIds = f.properties?.route_sequence_id;
                if (Array.isArray(stepIds)) return stepIds.includes(state.activeStepId);
                return stepIds === state.activeStepId;
            });
        },

        // Full route elevation (if needed)
        fullRouteElevation: (state) => {
            if (!state.routeData?.features) return [];

            let accumulatedDistance = 0;
            return state.routeFeatures
                .filter(f => f.type === 'line')
                .flatMap(feature => {
                    const adjusted = feature.elevation?.map(point => ({
                        ...point,
                        distance_along_line: point.distance_along_line + accumulatedDistance
                    })) || [];

                    if (adjusted.length > 0) {
                        accumulatedDistance = adjusted[adjusted.length - 1].distance_along_line;
                    }
                    return adjusted;
                });
        },

        // General purpose filter - returns actual features (not wrapped)
        getFilteredFeatures: (state) => (filterFn) => {
            if (!state.routeData?.features) return [];

            return state.routeData.features
                .filter(filterFn)
                .sort((a, b) => {
                    const aStep = a.properties?.route_sequence_id ?? Infinity;
                    const bStep = b.properties?.route_sequence_id ?? Infinity;
                    return aStep - bStep;
                });
        },
    },

    actions: {
        triggerMapRefresh() {
            this.refreshMapTrigger ++
        },
        setMapId(id) {
            this.mapId = id;
            if (id in mapConfig.configuredRoutes) {
                this.setMapTheme(mapConfig.configuredRoutes[id].theme);
            }
        },

        setMapTheme(theme) {
            this.theme = theme;
            document.documentElement.setAttribute("data-theme", theme);
        },

        async loadRouteData() {
            this.loading = true;
            try {
                const response = await fetch(
                    getFilePath(`map/${this.mapId}/geojson/bundled_route_data.json`)
                );
                if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

                let rd = await response.json();
                this.routeData = rd
            } catch (error) {
                console.error('Error loading route data:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        setActiveStep(stepId) {
            this.activeStepId = stepId ? Number(stepId) : null;
            if (stepId) this.activeTopic = 'route';
        },

        setActiveTopic(topic) {
            this.activeTopic = topic;
        },

        nextStep() {
            if (!this.maxStepId) return;

            if (this.activeStepId === null || this.activeStepId >= this.maxStepId) {
                this.setActiveStep(1);
            } else {
                this.setActiveStep(this.activeStepId + 1);
            }
        },

        previousStep() {
            if (!this.maxStepId) return;

            if (this.activeStepId === null || this.activeStepId <= 1) {
                this.setActiveStep(this.maxStepId);
            } else {
                this.setActiveStep(this.activeStepId - 1);
            }
        },
    },
});
