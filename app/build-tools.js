import {readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync} from 'fs';
import path, {resolve} from 'path';
import jsonminify from 'jsonminify';
import createMapIcons from "./build_tools/convert-icons.js";
import configuredRoutes from "../app/src/config/mapConfig.js"
import mapConfig from "../app/src/config/mapConfig.js";

function bundleRouteData(routeId) {
    console.log("Start combining route. ID: ", routeId);

    const path = `src/data/${routeId}/geojson/`
    // Load data files
    const points = JSON.parse(readFileSync(resolve(path, `stops.geojson`), 'utf8'));
    const lines = JSON.parse(readFileSync(resolve(path, `route_with_elevation.geojson`), 'utf8'));
    const sequenceData = JSON.parse(readFileSync(resolve(path, `route_info.json`), 'utf8'));

    // Map sequence for quick lookup
    const sequenceMap = new Map(sequenceData.sequence.map((entry, index) => [
        `${entry.id}_${entry.type}`, // Unique key based on ID + type
        {type: entry.type, route_step: index + 1}
    ]));
    const formatFeature = (feature, type) => {
        const id = feature.properties?.id;

        // Check if the exact id and type exist in sequenceMap
        const sequenceEntry = sequenceMap.get(`${id}_${type}`);
        const routeStep = sequenceEntry ? sequenceEntry.route_step : null;
        const topic = routeStep ? 'route' : 'extra';

        return {
            id: id + (type === 'point' ? 100000 : 200000),
            type,
            topic,
            properties: {...feature.properties, route_sequence_id: routeStep},
            elevation: feature.elevation,
            geometry: feature.geometry,
            images: listImages(routeId, type, id),
        };
    };

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
    writeFileSync(outputPath, JSON.stringify(bundledData, null, 2), { encoding: 'utf8' });
    console.log(`Bundled route data written to: ${outputPath}`);
}

function bundleRouteDataAllRoutes() {
    return {
        name: 'bundle-route-data',
        apply: 'build',
        async writeBundle() {
            try {
                Object.entries(mapConfig.configuredRoutes).forEach(([key, value]) => {
                    let routeId = key
                    console.log("bundling: ", routeId)
                    bundleRouteData(routeId)
                })
            } catch (error) {
                console.error('Error bundling route data:', error);
            }
        }
    }
}

function minifyJsonFiles() {
    return {
        name: 'minify-json',
        apply: 'build',
        writeBundle() {
            return new Promise((resolve, reject) => {
                Object.entries(mapConfig.configuredRoutes).forEach(([key, value]) => {
                    let routeId = key
                    console.log("minify route: ", routeId)

                    const dir = `./src/data/${routeId}/geojson`;
                    const outputDir = `./dist/map/${routeId}/geojson`;
                    console.log("dir : ", dir)
                    const files = readdirSync(dir);
                    if (!existsSync(outputDir)) {
                        mkdirSync(outputDir, {recursive: true});
                    }
                    console.log("start minifying files: ", files)
                    // Loop through the files and minify them asynchronously
                    Promise.all(files.map(async (file) => {
                        const filePath = path.join(dir, file);
                        const newFilePath = path.join(outputDir, `${file}.min`);
                        if (['.geojson', '.json'].includes(path.extname(file))) {
                            try {
                                const content = readFileSync(filePath, 'utf8');
                                const minifiedContent = jsonminify(content);
                                console.log('minified content')
                                writeFileSync(newFilePath, minifiedContent);
                                console.log(`Minified: ${file}`);
                            } catch (error) {
                                console.error(`Error minifying file ${file}:`, error);
                            }
                        }
                    })).then(() => {
                        resolve();  // Ensure the build continues only after minification is done
                    }).catch((error) => {
                        reject(error); // Reject the promise if something goes wrong
                    });
                });
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


export default function buildPlugins() {
    return [bundleRouteDataAllRoutes(), minifyJsonFiles(), createMapIcons()
    ];
}
