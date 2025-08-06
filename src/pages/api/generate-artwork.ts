import { NextApiRequest, NextApiResponse } from 'next';
import { Canvas, CanvasRenderingContext2D, Image } from 'skia-canvas';
import fs from 'fs';
import path from 'path';

// Helper function to convert signature to seed (same as client-side)
function hashToSeed(sig: string): number {
  let hash = 0;
  for (let i = 0; i < sig.length; i++) {
    hash = (hash << 5) - hash + sig.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Simple noise function (approximation of p5.js noise)
function noise(x: number, y: number, z: number): number {
  const hash = (x * 12.9898 + y * 78.233 + z * 37.719) % 1;
  return Math.sin(hash * Math.PI) * 0.5 + 0.5;
}

// Seeded random function
function seededRandom(seed: number) {
  let x = Math.sin(seed++) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

// Generate static icons (same algorithm as client-side)
function generateStaticIcons(ART_W: number, ART_H: number, seed: number) {
  const rand = seededRandom(seed);
  const maxIcons = 46;
  const numIcons = Math.min(Math.floor(rand() * 5) + 7, maxIcons);
  const iconIndices = Array.from({length: maxIcons}, (_, i) => i)
    .sort(() => rand() - 0.5)
    .slice(0, numIcons);
  
  const icons = [];
  let tries = 0;
  const buffer = 10;
  let used = 0;
  
  while (icons.length < numIcons && tries < 400) {
    const s = 600 + rand() * 300;
    const x = rand() * (ART_W + s) - s/3;
    const y = rand() * (ART_H - 80 + s) - s/3;
    const rot = (rand() - 0.5) * Math.PI / 8;
    
    // Check for buffer spacing
    let ok = true;
    for (const p of icons) {
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist < (s + p.s) / 2 + buffer) ok = false;
    }
    
    // Check if at least part of the icon is inside the art block
    const visible = (
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

// Draw dot field (same algorithm as client-side)
function drawDotField(
  ctx: CanvasRenderingContext2D,
  options: {
    baseColor: string;
    noiseSeedOffset: number;
    minSize: number;
    maxSize: number;
    density: number;
    contrast: number;
  },
  ART_W: number,
  ART_H: number,
  seed: number,
  MARGIN_LEFT: number,
  MARGIN_TOP: number
) {
  const { baseColor, noiseSeedOffset, minSize, maxSize, density, contrast } = options;
  
  const cols = density;
  const rows = Math.floor((cols * ART_H) / ART_W);
  const cellW = ART_W / cols;
  const cellH = ART_H / rows;
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = MARGIN_LEFT + i * cellW + cellW / 2;
      const y = MARGIN_TOP + j * cellH + cellH / 2;
      const n = noise(
        i * 0.09 + noiseSeedOffset,
        j * 0.09 + noiseSeedOffset,
        seed * 0.01 + noiseSeedOffset
      );
      const adjustedNoise = Math.pow(n, contrast);
      const s = minSize + adjustedNoise * (maxSize - minSize);
      
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, date, signature, signerNumber, isMobile = false, whiteBackground = false } = req.body;

    if (!name || !date || !signature || !signerNumber) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Set canvas size based on device
    const CANVAS_W = isMobile ? 850 : 1700;
    const CANVAS_H = isMobile ? 1100 : 2200;
    const ART_W = isMobile ? 714 : 1428;
    const ART_H = isMobile ? 892 : 1785;
    const MARGIN_BOTTOM = isMobile ? 139 : 279;
    const MARGIN_TOP = (CANVAS_H - ART_H - MARGIN_BOTTOM);
    const MARGIN_LEFT = (CANVAS_W - ART_W) / 2;

    // Create canvas
    const canvas = new Canvas(CANVAS_W, CANVAS_H);
    const ctx = canvas.getContext('2d');

    // Set seed
    const seed = hashToSeed(signature);
    const rand = seededRandom(seed);

    // Load assets (using public paths)
    const publicDir = path.join(process.cwd(), 'public');
    
    // Load images using Image class
    const manifestoTextImg = new Image();
    manifestoTextImg.src = path.join(publicDir, 'generative-art/images/manifesto-text.png');
    await new Promise((resolve, reject) => {
      manifestoTextImg.onload = resolve;
      manifestoTextImg.onerror = reject;
    });
    
    const paperBgImg = new Image();
    paperBgImg.src = path.join(publicDir, 'generative-art/images/paperbackground.jpg');
    await new Promise((resolve, reject) => {
      paperBgImg.onload = resolve;
      paperBgImg.onerror = reject;
    });
    
    // Load icon images
    const iconPaths = [
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
    
    const iconImgs = await Promise.all(
      iconPaths.map(async (iconPath) => {
        const img = new Image();
        img.src = path.join(publicDir, 'generative-art', iconPath);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        return img;
      })
    );

    // Draw background
    if (whiteBackground) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.drawImage(paperBgImg, 0, 0, CANVAS_W, CANVAS_H);
    }

    // Generate static icons
    const staticIcons = generateStaticIcons(ART_W, ART_H, seed);

    // Draw art content
    ctx.save();
    ctx.translate(MARGIN_LEFT, MARGIN_TOP);
    ctx.beginPath();
    ctx.rect(0, 0, ART_W, ART_H);
    ctx.clip();

    // Calculate base density
    const baseDensity = Math.min(Math.max(signerNumber, 1), 1000) * 0.04 + 80;

    // Layer 1: Yellow halftone field
    drawDotField(ctx, {
      baseColor: 'rgba(255, 232, 0, 0.7)',
      noiseSeedOffset: 0,
      minSize: 2,
      maxSize: 24,
      density: baseDensity,
      contrast: 2.2
    }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);

    // Layer 2: Gray (if signerCount > 25)
    if (signerNumber > 25) {
      drawDotField(ctx, {
        baseColor: 'rgba(136, 137, 138, 0.47)',
        noiseSeedOffset: 1000,
        minSize: 0,
        maxSize: 18,
        density: baseDensity,
        contrast: 2.0
      }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);
    }

    // Layer 3: Electric aqua (if signerCount > 50)
    if (signerNumber > 50) {
      drawDotField(ctx, {
        baseColor: 'rgba(94, 200, 229, 0.7)',
        noiseSeedOffset: 2000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0
      }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);
    }

    // Layer 4: Hot pink (if signerCount > 100)
    if (signerNumber > 100) {
      drawDotField(ctx, {
        baseColor: 'rgba(255, 75, 128, 0.7)',
        noiseSeedOffset: 3000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0
      }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);
    }

    // Layer 5: Acid green (if signerCount > 250)
    if (signerNumber > 250) {
      drawDotField(ctx, {
        baseColor: 'rgba(68, 214, 44, 0.7)',
        noiseSeedOffset: 4000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0
      }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);
    }

    // Layer 6: Coral pink (if signerCount > 500)
    if (signerNumber > 500) {
      drawDotField(ctx, {
        baseColor: 'rgba(255, 116, 119, 0.7)',
        noiseSeedOffset: 5000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0
      }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);
    }

    // Layer 7: Teal (if signerCount > 1000)
    if (signerNumber > 1000) {
      drawDotField(ctx, {
        baseColor: 'rgba(130, 216, 213, 0.7)',
        noiseSeedOffset: 6000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0
      }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);
    }

    // Layer 8: Dark overlay
    drawDotField(ctx, {
      baseColor: 'rgba(0, 0, 0, 0.16)',
      noiseSeedOffset: 3000,
      minSize: 0,
      maxSize: 10,
      density: baseDensity,
      contrast: 3.0
    }, ART_W, ART_H, seed, MARGIN_LEFT, MARGIN_TOP);

    // Draw static icons
    for (const icon of staticIcons) {
      ctx.save();
      ctx.translate(MARGIN_LEFT + icon.x, MARGIN_TOP + icon.y);
      ctx.rotate(icon.rot);
      ctx.globalAlpha = 0.28;
      ctx.drawImage(iconImgs[icon.idx], -icon.s/2, -icon.s/2, icon.s, icon.s);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Draw manifesto text
    ctx.globalAlpha = 0.55;
    ctx.drawImage(manifestoTextImg, 0, 0, ART_W, ART_H);
    ctx.globalAlpha = 1;

    ctx.restore();

    // Draw text at bottom
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `${isMobile ? 24 : 48}px Arial`;
    ctx.fillStyle = '#000';
    ctx.fillText('THE DIGITAL MAVERICK MANIFESTO', CANVAS_W / 2, CANVAS_H - (isMobile ? 100 : 200));
    
    ctx.font = `${isMobile ? 16 : 32}px Arial`;
    const sigLine = `Signed by ${name} on ${date}`;
    ctx.fillText(sigLine, CANVAS_W / 2, CANVAS_H - (isMobile ? 75 : 150));
    
    ctx.font = `${isMobile ? 14 : 28}px Arial`;
    ctx.fillStyle = '#666';
    ctx.fillText(signature, CANVAS_W / 2, CANVAS_H - (isMobile ? 50 : 100));

    // Draw token ID
    ctx.textAlign = 'right';
    ctx.font = `${isMobile ? 20 : 40}px Arial`;
    ctx.fillStyle = '#000';
    ctx.fillText(`#${signerNumber}`, MARGIN_LEFT + ART_W - 10, MARGIN_TOP + ART_H + (isMobile ? 20 : 40));
    
    ctx.restore();

    // Convert to PNG buffer
    const pngBuffer = await canvas.toBuffer('png');

    // Return the PNG buffer
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pngBuffer.length.toString());
    res.send(pngBuffer);

  } catch (error) {
    console.error('Error generating artwork:', error);
    res.status(500).json({ 
      error: 'Failed to generate artwork', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 