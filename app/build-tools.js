import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import jsonminify from 'jsonminify';

// export function bundleRouteData() {
//   return {
//     name: 'bundle-route-data',
//     apply: 'build',
//     buildStart() {
//       try {
//         console.log("start combining route.")
//         // Load data files from the public/geojson/ directory
//         const points = JSON.parse(readFileSync(resolve('public/geojson/stops.geojson'), 'utf8'));
//         const lines = JSON.parse(readFileSync(resolve('public/geojson/route.geojson'), 'utf8'));
//         const sequence = JSON.parse(readFileSync(resolve('public/geojson/route_info.json'), 'utf8'));
//
//         // Helper function to find the feature by ID and type (stop or segment)
//         const findFeature = (id, type, features) => {
//           const a =  features.find(f => f.properties.id === id)
//           return a
//         };
//
//
//         // Combine stops and segments based on the sequence
//         const orderedFeatures = sequence.sequence.map(entry => {
//           console.log(entry)
//           const { id, type } = entry;
//
//           let feature = null;
//
//           // Find the correct feature depending on the type
//           if (type === 'stop') {
//             feature = findFeature(id, 'stop', points.features);
//           } else if (type === 'segment') {
//             feature = findFeature(id, 'segment', lines.features);
//           }
//
//           // If a feature is found, add a new 'id' field in the format 'type_id'
//
//           return feature || null;
//         }).filter(Boolean); // Filter out any null entries in case of missing data
//
//         // Create the final bundled data
//         const bundledData = {
//           metadata: sequence.metadata,
//           sequence: sequence.sequence,
//           settings: sequence.settings,
//           features: {
//             route: {
//               points: '',
//               lines: ''
//             },
//             extra: {
//               points: '',
//               lines: ''
//             }
//           }
//         };
//
//         // Write the bundled data to geojson
//         const outputPath = resolve('public/geojson', 'bundled_route_data.json');
//         writeFileSync(outputPath, JSON.stringify(bundledData, null, 2));
//
//         console.log(`Bundled route data written to: ${outputPath}`);
//       } catch (error) {
//         console.error('Error bundling route data:', error);
//       }
//     }
//   };
// }


export function bundleRouteData() {
  return {
    name: 'bundle-route-data',
    apply: 'build',
    buildStart() {
      try {
        console.log("Start combining route.");

        // Load data files from the public/geojson/ directory
        const points = JSON.parse(readFileSync(resolve('public/geojson/stops.geojson'), 'utf8'));
        const lines = JSON.parse(readFileSync(resolve('public/geojson/route.geojson'), 'utf8'));
        const sequence = JSON.parse(readFileSync(resolve('public/geojson/route_info.json'), 'utf8'));

        // Extract sequence IDs for efficient lookup
        const sequenceIds = new Set(sequence.sequence.map(entry => entry.id));

        // Helper function to extract and format features
        const formatFeatures = (features, type) => {
          return features.map(feature => {
            // Extract ID from properties and move it to the top level
            const id = feature.properties?.id;
            return id ? { id, ...feature, properties: { ...feature.properties } } : feature;
          }).filter(feature => feature.id);
        };

        // Format and separate route and extra features
        const formattedPoints = formatFeatures(points.features, 'point');
        const formattedLines = formatFeatures(lines.features, 'line');

        const categorizeFeatures = (features) => {
          return features.reduce((acc, feature) => {
            const category = sequenceIds.has(feature.id) ? 'route' : 'extra';
            acc[category].push(feature);
            return acc;
          }, { route: [], extra: [] });
        };

        // Categorize points and lines
        const categorizedPoints = categorizeFeatures(formattedPoints);
        const categorizedLines = categorizeFeatures(formattedLines);

        // Create the final bundled data
        const bundledData = {
          metadata: sequence.metadata,
          sequence: sequence.sequence,
          settings: sequence.settings,
          features: {
            route: {
              point: categorizedPoints.route,
              line: categorizedLines.route
            },
            extra: {
              point: categorizedPoints.extra,
              line: categorizedLines.extra
            }
          }
        };

        // Write the bundled data to geojson
        const outputPath = resolve('public/geojson', 'bundled_route_data.json');
        writeFileSync(outputPath, JSON.stringify(bundledData, null, 2));

        console.log(`Bundled route data written to: ${outputPath}`);
      } catch (error) {
        console.error('Error bundling route data:', error);
      }
    }
  };
}

export function minifyJsonfilesInDirectory() {
  return {
      name: 'minify-json', // Plugin to minify GeoJSON files
      apply: 'build', // Apply this during the build process
      generateBundle() {
        // Specify the folder containing your GeoJSON files
        const dir = './public/geojson';
        const files = fs.readdirSync(dir);
        // Loop through the files in the geojson folder and minify them
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          if (['.geojson', '.json'].includes(path.extname(file))) {
            const content = fs.readFileSync(filePath, 'utf8');
            const minifiedContent = jsonminify(content); // Minify the content
            const newFilename = `${filePath}.min`
            // Remove existing .min file if it exists
            if (fs.existsSync(newFilename)) {
              fs.unlinkSync(newFilename);
              console.log(`Removed existing minified file: ${newFilename}`);
            }
            fs.writeFileSync(newFilename, minifiedContent); // Write back the minified content`
            console.log(`Minified: ${file}`);
          }
        });
      },
    }

}
