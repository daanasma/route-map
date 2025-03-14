import {readdirSync, writeFileSync} from 'fs';
import {promises as fsPromises} from 'fs'; // Using the promises API for fs
import path from 'path';
import sharp from 'sharp';

import mapConfig from "../src/config/mapConfig.js";

/**
 * Function to convert SVG files to PNG with a white background and a dark green circular border,
 * and store them in the specified directory.
 */
function convertSvgsToPng(outlineColor) {
    return new Promise((resolve, reject) => {
        const svgDir = './node_modules/@mapbox/maki/icons'; // SVG directory (Maki icons)
        const outputDir = `./public/icons/${outlineColor.replace('#', 'c')}`; // Output directory for PNG files
        const size = 26; // Size of the circle (diameter in pixels)
        const iconSize = 16; // Size of the icon inside the circle
        const backgroundColor = '#ffffff'; // White background color of the circle
        const borderColor = outlineColor; // Dark green border color for the circle
        const borderWidth = 2; // Width of the dark green circle border
        console.log("Start making icons for ", outlineColor)

        // Ensure the output directory exists asynchronously
        fsPromises.mkdir(outputDir, {recursive: true})
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
                        let originalSvgContent = await fsPromises.readFile(inputPath, 'utf8');

// Remove any XML declaration
                        originalSvgContent = originalSvgContent.replace(/<\?xml.*?\?>/g, '').trim();

// Construct a new SVG with the background and embedded icon
                        const combinedSvg = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth / 2}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}" fill="${backgroundColor}" />
    <g transform="translate(${(size - iconSize) / 2}, ${(size - iconSize) / 2})">
      ${originalSvgContent} 
    </g>
  </svg>`;

                        await sharp(Buffer.from(combinedSvg), {density: 300}) // Use higher density
                            .sharpen()
                            .toFile(outputPath);

                    // console.log(`Converted: ${file} -> ${outputPath}`);
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

function createMapIcons() {
    return {
        name: 'convert-all-svgs',
        apply: 'build',
        async writeBundle() {

            convertSvgsToPng(mapConfig.mainColor);
            convertSvgsToPng(mapConfig.poiColor)
        }
    }
}

export default createMapIcons;
