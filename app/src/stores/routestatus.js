import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';
import mapConfig from '@/config/mapConfig.js'
import {defineStore} from 'pinia';
import {log} from '@/debug/debug.js';
import {metersToKm} from '@/utils/length.js';
import {nextTick} from "vue";

const {getFilePath} = useCorrectBasePath();

function orderRouteFeatures(routeData) {
    console.log('ORDERING -------------', routeData)
    console.log('ORDERING -------------', (!routeData?.features || !routeData?.sequence))
    if (!routeData?.features || !routeData?.sequence) return [];

    const routeFeatures = routeData.features.filter(f => f.topic === 'route');
    const featureById = {};
    routeFeatures.forEach(f => { featureById[f.id] = f; });

    const ordered = [];
    routeData.sequence.forEach(step => {
        step.features
            .filter(f => f.type === 'line')
            .forEach(f => {
                const feat = featureById[f.id];
                if (feat) ordered.push(feat);
            });
    });
    console.log('orrdered - ', ordered)
    return ordered;
}

export const useRouteInfoStore = defineStore('routeInfo', {
    state: () => ({
        mapId: null,
        theme: 'default',
        routeData: null,
        loading: false,
        activeStepId: null,  // Just store the ID, compute the rest
        activeTopic: null,
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

        activeStepLengthKm() {
            const meters = this.activeStepData?.length_in_m ?? 0;
            return metersToKm(meters);
        },

        // Get all features that belong to route topic
        routeFeatures: (state) => {
            if (!state.routeData?.features) return [];
            return state.routeData.features.filter(f => f.topic === 'route');
        },

        // Only line features, fully ordered by step and line within step
    // Line features ordered by step and by the order in sequence[].features
        orderedRouteFeatures: (state) => orderRouteFeatures(state.routeData),

        // Get features for active step
        activeStepFeatures: (state) => {
            if (!state.activeStepId) return [];
            return state.routeFeatures.filter(f => {
                const stepIds = f.properties?.route_sequence_id;
                if (Array.isArray(stepIds)) return stepIds.includes(state.activeStepId);
                return stepIds === state.activeStepId;
            });
        },

        // Full route elevation with cumulative distance, grade, ascent/descent, min/max

        // fullRouteElevation: (state) => {
        //     const features = state.orderedRouteFeatures;
        //     if (!features.length) return { data: [], summary: {}, byStep: {} };
        //
        //     let accumulatedDistance = 0;
        //     let totalAscent = 0;
        //     let totalDescent = 0;
        //     let minElevation = Infinity;
        //     let maxElevation = -Infinity;
        //
        //     const byStep = {};
        //     const data = [];
        //
        //     features.forEach(feature => {
        //         const stepId = feature.properties?.route_sequence_id;
        //         const elevations = feature.elevation || [];
        //
        //         elevations.forEach((point, idx) => {
        //             const prevPoint = data[data.length - 1];
        //             const distance = point.distance_along_line + accumulatedDistance;
        //             let grade = 0;
        //
        //             if (prevPoint) {
        //                 const distChange = distance - prevPoint.distance_along_line;
        //                 const elevChange = point.elevation - prevPoint.elevation;
        //                 if (distChange > 0) grade = (elevChange / distChange) * 100;
        //                 if (elevChange > 0) totalAscent += elevChange;
        //                 else totalDescent += Math.abs(elevChange);
        //             }
        //
        //             const enrichedPoint = {
        //                 ...point,
        //                 stepId,
        //                 distance_along_line: distance,
        //                 grade
        //             };
        //
        //             if (!byStep[stepId]) byStep[stepId] = [];
        //             byStep[stepId].push(enrichedPoint);
        //
        //             data.push(enrichedPoint);
        //
        //             if (point.elevation != null) {
        //                 minElevation = Math.min(minElevation, point.elevation);
        //                 maxElevation = Math.max(maxElevation, point.elevation);
        //             }
        //         });
        //
        //         if (elevations.length > 0) {
        //             accumulatedDistance = data[data.length - 1].distance_along_line;
        //         }
        //     });
        //     return {
        //         data,
        //         summary: {
        //             totalDistance: accumulatedDistance,
        //             totalAscent,
        //             totalDescent,
        //             minElevation,
        //             maxElevation
        //         },
        //         byStep
        //     };
        // },

        // Access per-segment elevation simply by stepId
            segmentElevation: (state) => (stepId) => {
                const full = state.fullRouteElevation;
                if (!full || !full.byStep) return [];
                return full.byStep[stepId] ?? [];
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
            this.refreshMapTrigger++
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
                this.processElevationData();

            }
        },

        processElevationData() {
            console.log('this.-------------------------------------------')
            console.log('this.routeData', this.routeData)
        const features = orderRouteFeatures(this.routeData);
        if (!features.length) {
            this.fullRouteElevation = null;
            alert('nofeat')
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
