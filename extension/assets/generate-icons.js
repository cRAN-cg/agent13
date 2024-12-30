import { promises as fs } from 'fs';
import { createCanvas, loadImage } from 'canvas';

class IconGenerator {
    static #SIZES = [16, 32, 48, 128];

    async #loadSvg() {
        const svgContent = await fs.readFile('icon.svg', 'utf8');
        return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    }

    async #generateIcon(size, svgDataUrl) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        const img = await loadImage(svgDataUrl);
        ctx.drawImage(img, 0, 0, size, size);
        
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(`icon${size}.png`, buffer);
    }

    async generate() {
        try {
            const svgDataUrl = await this.#loadSvg();
            
            await Promise.all(
                IconGenerator.#SIZES.map(size => 
                    this.#generateIcon(size, svgDataUrl)
                )
            );

        } catch (error) {
            console.error('Error generating icons:', error);
            process.exit(1);
        }
    }
}

// Run the generator
const generator = new IconGenerator();
generator.generate();
