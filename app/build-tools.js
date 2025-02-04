import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync} from 'fs';
import path, { resolve } from 'path';
import jsonminify from 'jsonminify';

// function bundleRouteData() {
//   return {
//     name: 'bundle-route-data',
//     apply: 'build',
//     async writeBundle() {
//       try {
//         console.log("Start combining route.");
//
//         // Load data files from the public/geojson/ directory
//         const points = JSON.parse(readFileSync(resolve('src/data/geojson/stops.geojson'), 'utf8'));
//         const lines = JSON.parse(readFileSync(resolve('src/data/geojson/route.geojson'), 'utf8'));
//         const sequence = JSON.parse(readFileSync(resolve('src/data/geojson/route_info.json'), 'utf8'));
//
//         const sequenceIds = new Set(sequence.sequence.map(entry => entry.id));
//
//         const formatFeatures = (features) => features
//           .map(feature => {
//             const id = feature.properties?.id;
//             return id ? { id, ...feature, properties: { ...feature.properties } } : feature;
//           })
//           .filter(feature => feature.id);
//
//         const formattedPoints = formatFeatures(points.features);
//         const formattedLines = formatFeatures(lines.features);
//
//         const categorizeFeatures = (features) => features.reduce((acc, feature) => {
//           const category = sequenceIds.has(feature.id) ? 'route' : 'extra';
//           acc[category].push(feature);
//           return acc;
//         }, { route: [], extra: [] });
//
//         const categorizedPoints = categorizeFeatures(formattedPoints);
//         const categorizedLines = categorizeFeatures(formattedLines);
//
//         const bundledData = {
//           metadata: sequence.metadata,
//           sequence: sequence.sequence,
//           settings: sequence.settings,
//           features: {
//             route: {
//               point: categorizedPoints.route,
//               line: categorizedLines.route,
//             },
//             extra: {
//               point: categorizedPoints.extra,
//               line: categorizedLines.extra,
//             }
//           }
//         };
//
//         const outputPath = resolve('src/data/geojson', 'bundled_route_data.json');
//         writeFileSync(outputPath, JSON.stringify(bundledData, null, 2));
//         console.log(`Bundled route data written to: ${outputPath}`);
//       } catch (error) {
//         console.error('Error bundling route data:', error);
//       }
//     }
//   };
// }
function bundleRouteData() {
  return {
    name: 'bundle-route-data',
    apply: 'build',
    async writeBundle() {
  try {
    console.log("Start combining route.");

    // Load data files
    const points = JSON.parse(readFileSync(resolve('src/data/geojson/stops.geojson'), 'utf8'));
    const lines = JSON.parse(readFileSync(resolve('src/data/geojson/route.geojson'), 'utf8'));
    const sequenceData = JSON.parse(readFileSync(resolve('src/data/geojson/route_info.json'), 'utf8'));

    const sequenceOrder = sequenceData.sequence.map((entry, index) => ({
      ...entry,
      route_step: index + 1,
    }));

    const formatFeature = (feature, type, topic, routeStep) => ({
      id: feature.properties?.id + (type === 'point' ? 100000 : 200000),
        type,
      topic,

      properties: { ...feature.properties,
      route_sequence_id: routeStep || null},
      geometry: feature.geometry,
    });

    const features = [];
    const pointsById = Object.fromEntries(points.features.map(f => [f.properties?.id, f]));
    const linesById = Object.fromEntries(lines.features.map(f => [f.properties?.id, f]));

    sequenceOrder.forEach(({ id, type, route_step }) => {
      const dataset = type === 'point' ? pointsById : linesById;
      const feature = dataset[id];

      if (feature) {
        features.push(
          formatFeature(
            feature,
            type,
            sequenceData.sequence.some(e => e.id === id) ? 'route' : 'extra',
            route_step
          )
        );
      }
    });

    const bundledData = {
      metadata: sequenceData.metadata,
      sequence: sequenceOrder,
      settings: sequenceData.settings,
      features,
    };

    const outputPath = resolve('src/data/geojson', 'bundled_route_data.json');
    writeFileSync(outputPath, JSON.stringify(bundledData, null, 2));
    console.log(`Bundled route data written to: ${outputPath}`);
  } catch (error) {
    console.error('Error bundling route data:', error);
      }
    }
  };
}


function minifyJsonFiles() {
  return {
    name: 'minify-json',
    apply: 'build',
    writeBundle() {
      return new Promise((resolve, reject) => {
        const dir = './src/data/geojson';
        const outputDir = './dist/geojson';
        const files = readdirSync(dir);
        if (!existsSync(outputDir)){
            mkdirSync(outputDir);
}
        // Loop through the files and minify them asynchronously
        Promise.all(files.map(async (file) => {
          const filePath = path.join(dir, file);
          const newFilePath = path.join(outputDir, `${file}.min`);
          if (['.geojson', '.json'].includes(path.extname(file))) {
            try {
              const content = readFileSync(filePath, 'utf8');
              const minifiedContent = jsonminify(content);


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
    }
  };
}
export default function buildPlugins() {
  return [bundleRouteData(), minifyJsonFiles()];
}
