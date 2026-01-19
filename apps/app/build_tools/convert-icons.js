import {readdirSync, writeFileSync} from 'fs';
import {promises as fsPromises} from 'fs'; // Using the promises API for fs
import path from 'path';
import sharp from 'sharp';

import mapConfig from "../src/config/mapConfig.js";

/**
 * Function to convert SVG files to PNG with a white background and a dark green circular border,
 * and store them in the specified directory.
 */
async function convertSvgsToPng(outlineColor) {
        const svgDir = './node_modules/@mapbox/maki/icons'; // SVG directory (Maki icons)
        const outputDir = `./public/icons/${outlineColor.replace('#', 'c')}`; // Output directory for PNG files
        const size = 26; // Size of the circle (diameter in pixels)
        const iconSize = 16; // Size of the icon inside the circle
        const backgroundColor = '#ffffff'; // White background color of the circle
        const borderColor = outlineColor; // Dark green border color for the circle
        const borderWidth = 2; // Width of the dark green circle border
        console.log("Start making icons for ", outlineColor)


    console.log("Start making icons for", outlineColor);

    // Ensure output directory exists
    await fsPromises.mkdir(outputDir, { recursive: true });
    console.log(`Directory ready: ${outputDir}`);

    // Get unique icon names
    const iconIds = Array.from(new Set(Object.values(mapConfig.iconMap)));
    const svgFiles = iconIds.map(id => `${id}.svg`);

    // Validate existence
    for (const file of svgFiles) {
        const fullPath = path.join(svgDir, file);
        try {
            await fsPromises.access(fullPath);
        } catch {
            throw new Error(`Maki icon not found: ${file}`);
        }
    }

    // Convert all icons
    await Promise.all(svgFiles.map(async (file) => {
        const inputPath = path.join(svgDir, file);
        const outputPath = path.join(outputDir, file.replace('.svg', '.png'));

        let originalSvgContent = await fsPromises.readFile(inputPath, 'utf8');
        originalSvgContent = originalSvgContent.replace(/<\?xml.*?\?>/g, '').trim();

        const combinedSvg = `
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth / 2}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" />
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}" fill="${backgroundColor}" />
            <g transform="translate(${(size - iconSize) / 2}, ${(size - iconSize) / 2})">
              ${originalSvgContent} 
            </g>
          </svg>`;

        await sharp(Buffer.from(combinedSvg), { density: 300 })
            .sharpen()
            .toFile(outputPath);
    }));

    console.log(`All icons created for ${outlineColor}`);
}

function createMapIcons() {
    return {
        name: 'convert-all-svgs',
        apply: 'build',
        async writeBundle() {
            await convertSvgsToPng(mapConfig.mainColor);
            await convertSvgsToPng(mapConfig.poiColor)
            await convertSvgsToPng(mapConfig.hoverColor)
            await convertSvgsToPng(mapConfig.highLightColor)
        }
    }
}

export default createMapIcons;
