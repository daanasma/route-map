import { readdirSync, writeFileSync } from 'fs';
import { promises as fsPromises } from 'fs'; // Using the promises API for fs
import path from 'path';
import sharp from 'sharp';

/**
 * Function to convert SVG files to PNG with a white background and a dark green circular border,
 * and store them in the specified directory.
 */
function convertSvgsToPng() {
  return {
    name: 'convert-svgs-to-png',
    apply: 'build',
    writeBundle() {
      return new Promise((resolve, reject) => {
        const svgDir = './node_modules/@mapbox/maki/icons'; // SVG directory (Maki icons)
        const outputDir = './public/icons'; // Output directory for PNG files
        const size = 20; // Size of the circle (diameter in pixels)
        const iconSize = 14; // Size of the icon inside the circle
        const backgroundColor = '#ffffff'; // White background color of the circle
        const borderColor = '#006400'; // Dark green border color for the circle
        const borderWidth = 2; // Width of the dark green circle border

        // Ensure the output directory exists asynchronously
        fsPromises.mkdir(outputDir, { recursive: true })
          .then(() => {
            console.log(`Directory created or already exists: ${outputDir}`);

            // Read all SVG files in the directory
            const svgFiles = readdirSync(svgDir).filter(file => file.endsWith('.svg'));

            // Process each SVG file and convert to PNG with a white background and dark green circular border
            Promise.all(svgFiles.map(async (file) => {
              const inputPath = path.join(svgDir, file);
              const outputPath = path.join(outputDir, file.replace('.svg', '.png'));

              try {
                // Read the SVG as a buffer
                const svgBuffer = await fsPromises.readFile(inputPath);

                // Create an SVG with a white background and dark green circular border
                const circleSvg = Buffer.from(
                  `<svg width="${size}" height="${size}">
                    <!-- Dark green border circle -->
                    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth / 2}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" />
                    <!-- White background circle -->
                    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}" fill="${backgroundColor}" />
                    <!-- Icon overlay -->
                    <image href="data:image/svg+xml;base64,${svgBuffer.toString('base64')}" x="${(size - iconSize) / 2}" y="${(size - iconSize) / 2}" width="${iconSize}" height="${iconSize}" />
                  </svg>`
                );

                // Convert to PNG with sharp
                await sharp(circleSvg)
                  .png()
                  .toFile(outputPath); // Output the PNG file with a circular background and border

                console.log(`Converted: ${file} -> ${outputPath}`);
              } catch (error) {
                console.error(`Error converting ${file}:`, error);
              }
            })).then(() => {
              resolve(); // Resolve after all conversions are done
            }).catch((error) => {
              reject(error); // Reject the promise if any error occurs
            });
          })
          .catch((err) => {
            console.error('Error creating directory:', err);
            reject(err); // Reject if directory creation fails
          });
      });
    }
  };
}

export default convertSvgsToPng;
