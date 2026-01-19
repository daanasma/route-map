import {useCorrectBasePath} from 'app/src/composables/useCorrectBasePath.js';
import mapConfig from 'app/src/config/mapConfig.js'
import {defineStore} from 'pinia';
import {log} from 'app/src/debug/debug.js';
import {metersToKm} from 'app/src/utils/length.js';
import {nextTick} from "vue";

const {getFilePath} = useCorrectBasePath();

function orderRouteLineFeatures(routeData) {
    console.log('routeData', routeData)
    if (!routeData?.features || !routeData?.sequence) return [];

    const routeFeatures = routeData.features.filter(f => f.topic === 'route');
    const featureById = {};
    routeFeatures.forEach(f => { featureById[f.id] = f; });
    console.log('routeFeatures', routeFeatures)

    const ordered = [];
    routeData.sequence.forEach(step => {
        step.features
            .filter(f => f.type === 'line')
            .forEach(f => {
                const feat = featureById[f.id];
                if (feat) ordered.push(feat);
            });
    });
    log('Store: Ordered route data - ', ordered)
    return ordered;
}


export const useRouteInfoStore = defineStore('routeInfo', {
    state: () => ({
        mapId: null,
        theme: 'default',
        routeData: null,
        loading: false,
        panelRightSide: true,
        activeStepId: null,  // Just store the ID, compute the rest
        activeFeatureId: null,
        activeTopic: null, // overview - route - featuredetail
        refreshMapTrigger: 0, // when increased, can be used to trigger manual refreshes.
        fullRouteElevation: null,
        appVersion: __APP_VERSION__
    }),

    getters: {
        routeMetadata: (state) => state.routeData?.metadata,
        routeSequence: (state) => state.routeData?.sequence,
        routeLengthKm() {
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

        activeFeatureData: (state) => {
            if (!state.activeFeatureId || !state.routeSequence) return null;
            return state.getFilteredFeatures().filter(s => String(s.id) === String(state.activeFeatureId));
        },

        activeStepLengthKm() {
            const meters = this.activeStepData?.length_in_m ?? 0;
            return metersToKm(meters);
        },

        // Get all features that belong to route topic
        routeFeatures: (state) => {
            if (!state.routeData?.features) return [];
            return state.routeData.features.filter(f => f.topic === 'route');
        },

        //todo clean this.

        // Get features for active step -> previous version (allowed for a feature that belongs to multiple steps)
        // activeStepFeatures: (state) => {
        //     if (!state.activeStepId) return [];
        //     return state.routeFeatures.filter(f => {
        //         const stepIds = f.properties?.route_sequence_id;
        //         if (Array.isArray(stepIds)) return stepIds.includes(state.activeStepId);
        //         return stepIds === state.activeStepId;
        //     });
        // },

        stepFeatures: (state) => (stepId) => {
            return state.routeFeatures.filter(
                f => f.properties?.route_sequence_id === stepId
            );
        },

        activeStepFeatures: (state) => {
            if (!state.activeStepId) return [];
            return state.stepFeatures(state.activeStepId);
        },

        featuresToFocus: (state) => {
            let relevantTopic = ['route', 'featuredetail'].includes(state.activeTopic);
            if (!relevantTopic) return [] // no highlighted features
            if (state.activeTopic === 'route') {
                return state.activeStepFeatures
            }
            else if (state.activeTopic === 'featuredetail') {
                return state.activeFeatureData
            }
        },

        // Access per-segment elevation simply by stepId
        segmentElevation: (state) => (stepId) => {
                const full = state.fullRouteElevation;
                if (!full || !full.byStep) return [];
                return full.byStep[stepId] ?? [];
            },

        // General purpose filter - returns actual features (not wrapped)
        getFilteredFeatures: (state) => (filterFn = () => true) => {
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
            this.refreshMapTrigger++
        },
        setMapId(id) {
            this.mapId = id;
            if (id in mapConfig.configuredRoutes) {
                this.setMapTheme(mapConfig.configuredRoutes[id].theme);
                this.setMapPanelOrder()
                // set
            }
        },

        setMapPanelOrder() {
            const rs = mapConfig.configuredRoutes[this.mapId].panelRightSide ?? true;
            this.panelRightSide = rs;
        },
        setMapTheme(theme) {
            this.theme = theme;
            document.documentElement.setAttribute("data-theme", theme);
        },

        async loadRouteData() {
            this.loading = true;
            log('loading for ')
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
                this.processElevationData();

            }
        },

        processElevationData() {
        const features = orderRouteLineFeatures(this.routeData);
        if (!features.length) {
            this.fullRouteElevation = null;
            return;
        }

        let accumulatedDistance = 0;
        let totalAscent = 0;
        let totalDescent = 0;
        let minElevation = Infinity;
        let maxElevation = -Infinity;

        const byStep = {};
        const data = [];

        features.forEach(feature => {
            log('feat', feature)
            const stepId = feature.properties?.route_sequence_id;
            const elevations = feature.elevation || [];

            elevations.forEach((point, idx) => {
                const prevPoint = data[data.length - 1];
                const distance = point.distance_along_line + accumulatedDistance;
                let grade = 0;

                if (prevPoint) {
                    const distChange = distance - prevPoint.distance_along_line;
                    const elevChange = point.elevation - prevPoint.elevation;
                    if (distChange > 0) grade = (elevChange / distChange) * 100;
                    if (elevChange > 0) totalAscent += elevChange;
                    else totalDescent += Math.abs(elevChange);
                }

                const enrichedPoint = {
                    ...point,
                    stepId,
                    distance_along_line: distance,
                    grade
                };

                if (!byStep[stepId]) byStep[stepId] = [];
                byStep[stepId].push(enrichedPoint);

                data.push(enrichedPoint);

                if (point.elevation != null) {
                    minElevation = Math.min(minElevation, point.elevation);
                    maxElevation = Math.max(maxElevation, point.elevation);
                }
            });

            if (elevations.length > 0) {
                accumulatedDistance = data[data.length - 1].distance_along_line;
            }
        });

        this.fullRouteElevation = {
            data,
            summary: {
                totalDistance: accumulatedDistance,
                totalAscent,
                totalDescent,
                minElevation,
                maxElevation
            },
            byStep
        };
                log('Processed elevation data.')

    },

        setActiveStep(stepId) {
            const oldStep = this.activeStepId;
            this.activeStepId = stepId ? Number(stepId) : null;
            if (stepId && (Number(stepId) !== Number(oldStep))) {
                console.log('------updating active topic to route. ', oldStep, '-->', stepId)
                this.setActiveTopic('route')
            };
        },

        setActiveFeature(featureId,) {
            log('Store: setting active feature', featureId)
            //this.activeStepId = stepId ? Number(stepId) : null; //todo get the actual step id from this feature
            this.activeFeatureId = featureId;
            if (featureId) this.setActiveTopic('featuredetail');
            },

        setActiveTopic(topic) {
            this.activeTopic = topic;
            log('Store: Finished setting active topic to ', topic)
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
