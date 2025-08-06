import { NextApiRequest, NextApiResponse } from 'next';
import { chromium } from 'playwright-core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, date, signature, signerNumber, isMobile = false, whiteBackground = false } = req.body;

    if (!name || !date || !signature || !signerNumber) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Launch browser with appropriate chromium
    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();
    
    // Set viewport based on device
    const width = isMobile ? 850 : 1700;
    const height = isMobile ? 1100 : 2200;
    await page.setViewportSize({ width, height });

    // Create HTML page with p5.js and our artwork code
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <script>
          // Copy the exact functions from GenerativeArt.tsx
          function hashToSeed(sig) {
            let hash = 0;
            for (let i = 0; i < sig.length; i++) {
              hash = (hash << 5) - hash + sig.charCodeAt(i);
              hash |= 0;
            }
            return Math.abs(hash);
          }

          function generateStaticIcons(p5, ART_W, ART_H, iconPngImgs) {
            let maxIcons = iconPngImgs.length;
            let numIcons = Math.min(p5.int(p5.random(7, 12)), maxIcons);
            let iconIndices = p5.shuffle([...Array(maxIcons).keys()]).slice(0, numIcons);
            let icons = [];
            let tries = 0;
            let buffer = 10;
            let used = 0;
            while (icons.length < numIcons && tries < 400) {
              let s = p5.random(600, 900);
              let x = p5.random(-s/3, ART_W + s/3);
              let y = p5.random(-s/3, ART_H - 80 + s/3);
              let rot = p5.random(-p5.PI/16, p5.PI/16);
              let ok = true;
              for (let p of icons) {
                if (p5.dist(x, y, p.x, p.y) < (s + p.s)/2 + buffer) ok = false;
              }
              let visible = (
                x + s/2 > 0 && x - s/2 < ART_W &&
                y + s/2 > 0 && y - s/2 < ART_H
              );
              if (ok && visible) {
                icons.push({x, y, s, rot, idx: iconIndices[used]});
                used++;
              }
              tries++;
            }
            return icons;
          }

          function drawStaticIcons(p5, icons, MARGIN_LEFT, MARGIN_TOP, iconPngImgs) {
            if (!icons) return;
            for (let p of icons) {
              p5.push();
              p5.translate(MARGIN_LEFT + p.x, MARGIN_TOP + p.y);
              p5.rotate(p.rot);
              p5.imageMode(p5.CENTER);
              p5.tint(255, 70);
              p5.image(iconPngImgs[p.idx], 0, 0, p.s, p.s);
              p5.noTint();
              p5.pop();
            }
          }

          function drawDotField(p5, options, ART_W, ART_H, seed) {
            const { baseColor, noiseSeedOffset, minSize, maxSize, density, contrast, blend } = options;
            p5.blendMode(blend);
            let cols = density,
              rows = p5.int((cols * ART_H) / ART_W);
            let cellW = ART_W / cols,
              cellH = ART_H / rows;
            for (let i = 0; i < cols; i++) {
              for (let j = 0; j < rows; j++) {
                let x = i * cellW + cellW / 2;
                let y = j * cellH + cellH / 2;
                let n = p5.noise(
                  i * 0.09 + noiseSeedOffset,
                  j * 0.09 + noiseSeedOffset,
                  seed * 0.01 + noiseSeedOffset
                );
                n = Math.pow(n, contrast);
                let s = p5.map(n, 0, 1, minSize, maxSize);
                p5.fill(baseColor);
                p5.noStroke();
                p5.ellipse(x, y, s, s);
              }
            }
            p5.blendMode(p5.BLEND);
          }

          // Main sketch
          let p5Instance;
          
          function setup() {
            const CANVAS_W = ${width};
            const CANVAS_H = ${height};
            const ART_W = ${isMobile ? 714 : 1428};
            const ART_H = ${isMobile ? 892 : 1785};
            const MARGIN_BOTTOM = ${isMobile ? 139 : 279};
            const MARGIN_TOP = (CANVAS_H - ART_H - MARGIN_BOTTOM);
            const MARGIN_LEFT = (CANVAS_W - ART_W) / 2;
            
            p5Instance = createCanvas(CANVAS_W, CANVAS_H);
            pixelDensity(1);
            noSmooth();
            
            const seed = hashToSeed('${signature}');
            randomSeed(seed);
            noiseSeed(seed);
            
            // Store variables for draw function
            window.ART_W = ART_W;
            window.ART_H = ART_H;
            window.MARGIN_TOP = MARGIN_TOP;
            window.MARGIN_LEFT = MARGIN_LEFT;
            window.seed = seed;
            window.signerNumber = ${signerNumber};
            window.name = '${name}';
            window.date = '${date}';
            window.signature = '${signature}';
            window.whiteBackground = ${whiteBackground};
            
            // Load assets
            loadAssets();
          }

          async function loadAssets() {
            // Load manifesto text
            window.manifestoTextImg = loadImage('/generative-art/images/manifesto-text.png');
            
            // Load paper background
            window.paperBgImg = loadImage('/generative-art/images/paperbackground.jpg');
            
            // Load icon images
            window.iconPngPaths = [
              'images/smileyface.png', 'images/starburst.png', 'images/globe.png', 'images/lightningbolt.png',
              'images/prism.png', 'images/hurricane.png', 'images/atom.png', 'images/circle.png',
              'images/starburstsolid.png', 'images/ring.png', 'images/squiggle.png', 'images/football.png',
              'images/wave.png', 'images/spiral.png', 'images/mushroom.png', 'images/glitchsmiley.png',
              'images/pill.png', 'images/striped.png', 'images/shades.png', 'images/disc.png',
              'images/planet.png', 'images/headphones.png', 'images/headphones2.png', 'images/cd.png',
              'images/bottle.png', 'images/1.png', 'images/2.png', 'images/3.png', 'images/4.png',
              'images/5.png', 'images/6.png', 'images/7.png', 'images/8.png', 'images/9.png', 'images/10.png',
              'images/11.png', 'images/12.png', 'images/13.png', 'images/14.png', 'images/15.png', 'images/16.png',
              'images/17.png', 'images/18.png', 'images/19.png', 'images/20.png', 'images/21.png', 'images/22.png',
              'images/23.png', 'images/24.png', 'images/25.png', 'images/26.png', 'images/27.png', 'images/28.png',
              'images/29.png', 'images/30.png', 'images/31.png', 'images/32.png', 'images/33.png', 'images/34.png',
              'images/35.png', 'images/36.png', 'images/37.png', 'images/38.png', 'images/39.png', 'images/40.png',
              'images/41.png', 'images/42.png', 'images/43.png', 'images/44.png', 'images/45.png', 'images/46.png',
            ];
            
            window.iconPngImgs = window.iconPngPaths.map(path => loadImage('/generative-art/' + path));
            
            // Generate static icons
            window.staticIcons = generateStaticIcons(window.ART_W, window.ART_H, window.iconPngImgs);
            
            // Start drawing
            draw();
          }

          function draw() {
            const ART_W = window.ART_W;
            const ART_H = window.ART_H;
            const MARGIN_TOP = window.MARGIN_TOP;
            const MARGIN_LEFT = window.MARGIN_LEFT;
            const seed = window.seed;
            const staticIcons = window.staticIcons;
            const signerCount = window.signerNumber;
            const name = window.name;
            const date = window.date;
            const signature = window.signature;
            const whiteBackground = window.whiteBackground;
            
            imageMode(CORNER);
            
            if (whiteBackground) {
              background(255);
            } else {
              image(window.paperBgImg, 0, 0, width, height);
            }
            
            push();
            translate(MARGIN_LEFT, MARGIN_TOP);
            drawingContext.save();
            drawingContext.beginPath();
            drawingContext.rect(0, 0, ART_W, ART_H);
            drawingContext.clip();
            
            let baseDensity = map(signerCount, 1, 1000, 80, 120, true);
            
            drawDotField({
              baseColor: color(255, 232, 0),
              noiseSeedOffset: 0,
              minSize: 2,
              maxSize: 24,
              density: baseDensity,
              contrast: 2.2,
              blend: BLEND
            }, ART_W, ART_H, seed);
            
            if (signerCount > 25) {
              drawDotField({
                baseColor: color(136, 137, 138, 120),
                noiseSeedOffset: 1000,
                minSize: 0,
                maxSize: 18,
                density: baseDensity,
                contrast: 2.0,
                blend: MULTIPLY
              }, ART_W, ART_H, seed);
            }
            
            if (signerCount > 50) {
              drawDotField({
                baseColor: color(94, 200, 229, 180),
                noiseSeedOffset: 2000,
                minSize: 1,
                maxSize: 16,
                density: baseDensity,
                contrast: 2.0,
                blend: MULTIPLY
              }, ART_W, ART_H, seed);
            }
            
            if (signerCount > 100) {
              drawDotField({
                baseColor: color(255, 75, 128, 180),
                noiseSeedOffset: 3000,
                minSize: 1,
                maxSize: 16,
                density: baseDensity,
                contrast: 2.0,
                blend: MULTIPLY
              }, ART_W, ART_H, seed);
            }
            
            if (signerCount > 250) {
              drawDotField({
                baseColor: color(68, 214, 44, 180),
                noiseSeedOffset: 4000,
                minSize: 1,
                maxSize: 16,
                density: baseDensity,
                contrast: 2.0,
                blend: MULTIPLY
              }, ART_W, ART_H, seed);
            }
            
            if (signerCount > 500) {
              drawDotField({
                baseColor: color(255, 116, 119, 180),
                noiseSeedOffset: 5000,
                minSize: 1,
                maxSize: 16,
                density: baseDensity,
                contrast: 2.0,
                blend: MULTIPLY
              }, ART_W, ART_H, seed);
            }
            
            if (signerCount > 1000) {
              drawDotField({
                baseColor: color(130, 216, 213, 180),
                noiseSeedOffset: 6000,
                minSize: 1,
                maxSize: 16,
                density: baseDensity,
                contrast: 2.0,
                blend: MULTIPLY
              }, ART_W, ART_H, seed);
            }
            
            drawDotField({
              baseColor: color(0, 40),
              noiseSeedOffset: 3000,
              minSize: 0,
              maxSize: 10,
              density: baseDensity,
              contrast: 3.0,
              blend: DARKEST
            }, ART_W, ART_H, seed);
            
            drawStaticIcons(staticIcons, MARGIN_LEFT, MARGIN_TOP, window.iconPngImgs);
            
            imageMode(CORNER);
            tint(255, 255, 255, 140);
            image(window.manifestoTextImg, 0, 0, ART_W, ART_H);
            noTint();
            
            drawingContext.restore();
            pop();
            
            // Centered text block
            push();
            textAlign(CENTER);
            textSize(${isMobile ? 24 : 48});
            fill(0);
            text("THE DIGITAL MAVERICK MANIFESTO", width / 2, height - ${isMobile ? 100 : 200});
            textSize(${isMobile ? 16 : 32});
            let sigLine = \`Signed by \${name} on \${date}\`;
            text(sigLine, width / 2, height - ${isMobile ? 75 : 150});
            textSize(${isMobile ? 14 : 28});
            fill(180);
            text(signature, width / 2, height - ${isMobile ? 50 : 100});
            pop();
            
            // Draw token ID
            textAlign(RIGHT);
            textSize(${isMobile ? 20 : 40});
            fill(0);
            text(\`#\${signerCount}\`, MARGIN_LEFT + ART_W - 10, MARGIN_TOP + ART_H + ${isMobile ? 20 : 40});
            
            // Signal that artwork is ready
            window.artworkReady = true;
          }
        </script>
      </body>
      </html>
    `;

    // Set the HTML content
    await page.setContent(html);

    // Wait for artwork to be ready
    await page.waitForFunction(() => (window as any).artworkReady === true, { timeout: 30000 });

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    await browser.close();

    // Return the PNG buffer
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', screenshot.length.toString());
    res.send(screenshot);

  } catch (error) {
    console.error('Error generating artwork with Playwright:', error);
    res.status(500).json({ 
      error: 'Failed to generate artwork', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 