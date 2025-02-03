import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import path, { resolve } from 'path';
import jsonminify from 'jsonminify';

function bundleRouteData() {
  return {
    name: 'bundle-route-data',
    apply: 'build',
    async writeBundle() {
      try {
        console.log("Start combining route.");

        // Load data files from the public/geojson/ directory
        const points = JSON.parse(readFileSync(resolve('public/geojson/stops.geojson'), 'utf8'));
        const lines = JSON.parse(readFileSync(resolve('public/geojson/route.geojson'), 'utf8'));
        const sequence = JSON.parse(readFileSync(resolve('public/geojson/route_info.json'), 'utf8'));

        const sequenceIds = new Set(sequence.sequence.map(entry => entry.id));

        const formatFeatures = (features) => features
          .map(feature => {
            const id = feature.properties?.id;
            return id ? { id, ...feature, properties: { ...feature.properties } } : feature;
          })
          .filter(feature => feature.id);

        const formattedPoints = formatFeatures(points.features);
        const formattedLines = formatFeatures(lines.features);

        const categorizeFeatures = (features) => features.reduce((acc, feature) => {
          const category = sequenceIds.has(feature.id) ? 'route' : 'extra';
          acc[category].push(feature);
          return acc;
        }, { route: [], extra: [] });

        const categorizedPoints = categorizeFeatures(formattedPoints);
        const categorizedLines = categorizeFeatures(formattedLines);

        const bundledData = {
          metadata: sequence.metadata,
          sequence: sequence.sequence,
          settings: sequence.settings,
          features: {
            route: {
              point: categorizedPoints.route,
              line: categorizedLines.route,
            },
            extra: {
              point: categorizedPoints.extra,
              line: categorizedLines.extra,
            }
          }
        };

        const outputPath = resolve('public/geojson', 'bundled_route_data.json');
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
        const dir = './public/geojson';
        const files = readdirSync(dir);

        // Loop through the files and minify them asynchronously
        Promise.all(files.map(async (file) => {
          const filePath = path.join(dir, file);
          if (['.geojson', '.json'].includes(path.extname(file))) {
            try {
              const content = readFileSync(filePath, 'utf8');
              const minifiedContent = jsonminify(content);
              const newFilename = `${filePath}.min`;

              // Remove existing .min file if it exists
              if (existsSync(newFilename)) {
                unlinkSync(newFilename);
                console.log(`Removed existing minified file: ${newFilename}`);
              }

              writeFileSync(newFilename, minifiedContent);
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
