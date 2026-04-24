const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
    const svg192 = fs.readFileSync(path.join(__dirname, 'icon-192.svg'));
    const svg512 = fs.readFileSync(path.join(__dirname, 'icon-512.svg'));

    console.log('Generating icon-192.png...');
    await sharp(svg192)
        .resize(192, 192)
        .png()
        .toFile(path.join(__dirname, 'icon-192.png'));

    console.log('Generating icon-512.png...');
    await sharp(svg512)
        .resize(512, 512)
        .png()
        .toFile(path.join(__dirname, 'icon-512.png'));

    console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
