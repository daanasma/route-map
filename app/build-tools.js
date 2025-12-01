import {readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync} from 'fs';
import path, {resolve} from 'path';
// import jsonminify from 'jsonminify';
import createMapIcons from "./build_tools/convert-icons.js";
import configuredRoutes from "../app/src/config/mapConfig.js"
import mapConfig from "../app/src/config/mapConfig.js";

function bundleRouteData(routeId) {
    console.log("Start combining route. ID: ", routeId);

    const path = `src/data/${routeId}/geojson/`
    // Load data files
    const points = JSON.parse(readFileSync(resolve(path, `points.geojson`), 'utf8'));
    const lines = JSON.parse(readFileSync(resolve(path, `route_with_elevation.geojson`), 'utf8'));
    const sequenceData = JSON.parse(readFileSync(resolve(path, `route_info.json`), 'utf8'));
    const formatFeature = (feature, type) => {
            const id = feature.properties?.id;
            const key = `${id}_${type}`;
            // Check if the exact id and type exist in sequenceMap
            const sequenceEntry = sequenceMap.get(key);

            const routeStep = sequenceEntry?.route_step ?? null;
            const topic = routeStep ? 'route' : 'extra';

            return {
                id: id + (type === 'point' ? 100000 : 200000),
                type,
                topic,
                properties: {
                    ...feature.properties,
                    route_sequence_id: routeStep
                },
                elevation: feature.elevation,
                geometry: feature.geometry,
                images: listImages(routeId, type, id),
            };
        };

    // Map sequence for quick lookup
    const sequenceMap = new Map();

    sequenceData.sequence.forEach((step, stepIndex) => {
        step.features.forEach(f => {
            const key = `${f.id}_${f.type}`;

            // only set if not yet present
            if (!sequenceMap.has(key)) {
                sequenceMap.set(key, {
                    route_step: stepIndex + 1
                });
            }
        });
    });

    const features = [];
    // Process all points
    points.features.forEach(feature => {
        if (feature.properties?.to_publish || sequenceMap.has(feature.properties.id)) {
            features.push(formatFeature(feature, 'point'));
        }
    });

    // Process all lines
    lines.features.forEach(feature => {
        if (feature.properties?.to_publish || sequenceMap.has(feature.properties.id)) {
            features.push(formatFeature(feature, 'line'));
        }
    });

    const bundledData = {
        metadata: sequenceData.metadata,
        sequence: sequenceData.sequence, // Keep sequence for reference
        settings: sequenceData.settings,
        features, // Let client sort if needed
    };
    ;

    const outputPath = resolve(path, 'bundled_route_data.json');
    writeFileSync(outputPath, JSON.stringify(bundledData, null, 2), {encoding: 'utf8'});
    console.log(`Bundled route data written to: ${outputPath}`);
}

function bundleRouteDataAllRoutes(routeLimitation) {
    return {
        name: 'bundle-route-data',
        apply: 'build',
        async writeBundle() {
            try {
                Object.entries(mapConfig.configuredRoutes).forEach(([key, value]) => {
                    let routeId = key
                    console.log("Start possibly bundling: ", routeId)
                    if ((!routeLimitation) || (routeLimitation == routeId)) {
                        console.log('-> Yes.Bundle it')
                        bundleRouteData(routeId)
                    } else {
                        console.log("-> Skipping this route for now.")
                    }
                })
            } catch (error) {
                console.error('Error bundling route data:', error);
            }
        }
    }
}

function minifyJsonFiles(routeLimitation) {
    return {
        name: 'minify-json',
        apply: 'build',
        writeBundle() {
            Object.entries(mapConfig.configuredRoutes).forEach(([routeId]) => {
                if (!routeLimitation || routeLimitation === routeId) {
                    const dir = `./src/data/${routeId}/geojson`;
                    const outputDir = `./dist/map/${routeId}/geojson`;

                    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

                    const files = readdirSync(dir).filter(f => ['.geojson', '.json'].includes(path.extname(f)));
                    files.forEach(file => {
                        try {
                            const filePath = path.join(dir, file);
                            const content = readFileSync(filePath, 'utf8');
                            const minifiedContent = JSON.stringify(JSON.parse(content));
                            writeFileSync(path.join(outputDir, file), minifiedContent);
                            console.log(`Minified and copied: ${file} -> ${outputDir}`);
                        } catch (error) {
                            console.error(`Error processing ${file}:`, error);
                        }
                    });
                }
            });
        }
    };
}


/**
 * Helper function to list image files for a feature type and ID.
 */
function listImages(routeId, type, id) {
    const directoryPath = resolve(`public/map/${routeId}/img/${type}/${id}`);
    try {
        return readdirSync(directoryPath)
            .filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file))
            .map(file => `${routeId}/img/${type}/${id}/${file}`);
    } catch (error) {
        console.warn(`No images found for ${type} ${id}: ${error.message}`);
        return [];
    }
}


export default function buildPlugins(options = {}) {
    const {routeLimitation = false} = options;
    console.log("Start building datasets with routelimitation: ", routeLimitation);
    console.log(routeLimitation);
    return [bundleRouteDataAllRoutes(routeLimitation),
        minifyJsonFiles(routeLimitation),
        createMapIcons()
    ];
}
