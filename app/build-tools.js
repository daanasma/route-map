import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync} from 'fs';
import path, { resolve } from 'path';
import jsonminify from 'jsonminify';
import createMapIcons from "./build_tools/convert-icons.js";

function bundleRouteData() {
  return {
    name: 'bundle-route-data',
    apply: 'build',
    async writeBundle() {
  try {
    console.log("Start combining route.");

    // Load data files
    const points = JSON.parse(readFileSync(resolve('src/data/geojson/stops.geojson'), 'utf8'));
    const lines = JSON.parse(readFileSync(resolve('src/data/geojson/route_with_elevation.geojson'), 'utf8'));
    const sequenceData = JSON.parse(readFileSync(resolve('src/data/geojson/route_info.json'), 'utf8'));

    // Map sequence for quick lookup
const sequenceMap = new Map(sequenceData.sequence.map((entry, index) => [
  `${entry.id}_${entry.type}`, // Unique key based on ID + type
  { type: entry.type, route_step: index + 1 }
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
        properties: { ...feature.properties, route_sequence_id: routeStep },
        geometry: feature.geometry,
        images: listImages(type, id),
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


      /**
       * Helper function to list image files for a feature type and ID.
       */
      function listImages(type, id) {
        const directoryPath = resolve(`public/img/${type}/${id}`);
        try {
          return readdirSync(directoryPath)
            .filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file))
            .map(file => `${type}/${id}/${file}`);
        } catch (error) {
          console.warn(`No images found for ${type} ${id}: ${error.message}`);
          return [];
        }
      }


export default function buildPlugins() {
  return [bundleRouteData(), minifyJsonFiles(), createMapIcons()
  ];
}
