"use client";
import dynamic from "next/dynamic";
import React, { useCallback, useState, useEffect } from "react";

// Dynamically import react-p5 to avoid SSR issues
const Sketch = dynamic(() => import("react-p5"), { ssr: false });

interface GenerativeArtProps {
  name: string;
  date: string;
  signature: string;
  signerNumber: number;
  background?: 'paper' | 'white';
  onArtworkReady?: () => void;
}

// Add global flag for white background export
declare global {
  var __exportingForIPFS: boolean;
}

export default function GenerativeArt({ name, date, signature, signerNumber, background = 'paper', onArtworkReady }: GenerativeArtProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Hide p5.js loading text
  useEffect(() => {
    const hideLoadingText = () => {
      const loadingElements = document.querySelectorAll('div');
      loadingElements.forEach((el) => {
        if (el.textContent === 'Loading...' && el.style.position === 'absolute') {
          el.style.display = 'none';
        }
      });
    };
    
    // Run immediately and then every 100ms for the first 2 seconds
    hideLoadingText();
    const interval = setInterval(hideLoadingText, 100);
    setTimeout(() => clearInterval(interval), 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Convert signature to a numeric seed
  const hashToSeed = (sig: string) => {
    let hash = 0;
    for (let i = 0; i < sig.length; i++) {
      hash = (hash << 5) - hash + sig.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  // p5 preload
  const preload = useCallback((p5: any) => {
    p5.manifestoTextImg = p5.loadImage('/generative-art/images/manifesto-text.png');
    p5.iconPngPaths = [
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
    p5.iconPngImgs = p5.iconPngPaths.map((path: string) => p5.loadImage(`/generative-art/${path}`));
    p5.paperBgImg = p5.loadImage('/generative-art/images/paperbackground.jpg');
    p5.videoCondRegular = p5.loadFont('/generative-art/fonts/VideoCond-Regular.ttf');
    p5.videoCondLight = p5.loadFont('/generative-art/fonts/VideoCond-Light.ttf');
    p5.argentPixelItalic = p5.loadFont('/generative-art/fonts/ArgentPixelCF-Italic.ttf');
    p5.profesorRegular = p5.loadFont('/generative-art/fonts/Professor-Regular.ttf');
    
    // Hide any p5.js loading text
    setTimeout(() => {
      const loadingElements = document.querySelectorAll('div');
      loadingElements.forEach((el) => {
        if (el.textContent === 'Loading...' && el.style.position === 'absolute') {
          el.style.display = 'none';
        }
      });
    }, 100);
  }, []);

  // Helper functions (moved from sketch.js)
  function generateStaticIcons(p5: any, ART_W: number, ART_H: number, iconPngImgs: any[]) {
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
      // Check for buffer spacing
      let ok = true;
      for (let p of icons) {
        if (p5.dist(x, y, p.x, p.y) < (s + p.s)/2 + buffer) ok = false;
      }
      // Check if at least part of the icon is inside the art block
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

  function drawStaticIcons(p5: any, icons: any[], MARGIN_LEFT: number, MARGIN_TOP: number, iconPngImgs: any[]) {
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

  function drawDotField(
    p5: any,
    {
      baseColor,
      noiseSeedOffset,
      minSize,
      maxSize,
      density,
      contrast,
      blend,
    }: {
      baseColor: any;
      noiseSeedOffset: number;
      minSize: number;
      maxSize: number;
      density: number;
      contrast: number;
      blend: any;
    },
    ART_W: number,
    ART_H: number,
    seed: number
  ) {
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

  // p5 setup
  const setup = useCallback((p5: any, canvasParentRef: any) => {
    // Art block dimensions
    const CANVAS_W = 1700;
    const CANVAS_H = 2200;
    const ART_W = 1428;
    const ART_H = 1785;
    const MARGIN_BOTTOM = 279;
    const MARGIN_TOP = (CANVAS_H - ART_H - MARGIN_BOTTOM);
    const MARGIN_LEFT = (CANVAS_W - ART_W) / 2;
    p5.createCanvas(CANVAS_W, CANVAS_H).parent(canvasParentRef);
    p5.pixelDensity(1);
    p5.noSmooth();
    const seed = hashToSeed(signature);
    p5.randomSeed(seed);
    p5.noiseSeed(seed);
    p5.staticIcons = generateStaticIcons(p5, ART_W, ART_H, p5.iconPngImgs);
    p5.CANVAS_W = CANVAS_W;
    p5.CANVAS_H = CANVAS_H;
    p5.ART_W = ART_W;
    p5.ART_H = ART_H;
    p5.MARGIN_BOTTOM = MARGIN_BOTTOM;
    p5.MARGIN_TOP = MARGIN_TOP;
    p5.MARGIN_LEFT = MARGIN_LEFT;
    p5.seed = seed;
    p5.artworkDrawn = false; // Flag to track if artwork has been drawn
  }, [signature]);

  // p5 draw
  const draw = useCallback((p5: any) => {
    const CANVAS_W = p5.CANVAS_W;
    const CANVAS_H = p5.CANVAS_H;
    const ART_W = p5.ART_W;
    const ART_H = p5.ART_H;
    const MARGIN_BOTTOM = p5.MARGIN_BOTTOM;
    const MARGIN_TOP = p5.MARGIN_TOP;
    const MARGIN_LEFT = p5.MARGIN_LEFT;
    const seed = p5.seed;
    const staticIcons = p5.staticIcons;
    const signerCount = signerNumber;
    p5.imageMode(p5.CORNER);
    if (background === 'white') {
      p5.background(255);
    } else {
      p5.image(p5.paperBgImg, 0, 0, CANVAS_W, CANVAS_H);
    }
    p5.push();
    p5.translate(MARGIN_LEFT, MARGIN_TOP);
    p5.drawingContext.save();
    p5.drawingContext.beginPath();
    p5.drawingContext.rect(0, 0, ART_W, ART_H);
    p5.drawingContext.clip();
    let baseDensity = p5.map(signerCount, 1, 1000, 80, 120, true);
    drawDotField(p5, {
      baseColor: p5.color(255, 232, 0),
      noiseSeedOffset: 0,
      minSize: 2,
      maxSize: 24,
      density: baseDensity,
      contrast: 2.2,
      blend: p5.BLEND
    }, ART_W, ART_H, seed);
    if (signerCount > 25) {
      drawDotField(p5, {
        baseColor: p5.color(136, 137, 138, 120),
        noiseSeedOffset: 1000,
        minSize: 0,
        maxSize: 18,
        density: baseDensity,
        contrast: 2.0,
        blend: p5.MULTIPLY
      }, ART_W, ART_H, seed);
    }
    if (signerCount > 50) {
      drawDotField(p5, {
        baseColor: p5.color(94, 200, 229, 180),
        noiseSeedOffset: 2000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0,
        blend: p5.MULTIPLY
      }, ART_W, ART_H, seed);
    }
    if (signerCount > 100) {
      drawDotField(p5, {
        baseColor: p5.color(255, 75, 128, 180),
        noiseSeedOffset: 3000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0,
        blend: p5.MULTIPLY
      }, ART_W, ART_H, seed);
    }
    if (signerCount > 250) {
      drawDotField(p5, {
        baseColor: p5.color(68, 214, 44, 180),
        noiseSeedOffset: 4000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0,
        blend: p5.MULTIPLY
      }, ART_W, ART_H, seed);
    }
    if (signerCount > 500) {
      drawDotField(p5, {
        baseColor: p5.color(255, 116, 119, 180),
        noiseSeedOffset: 5000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0,
        blend: p5.MULTIPLY
      }, ART_W, ART_H, seed);
    }
    if (signerCount > 1000) {
      drawDotField(p5, {
        baseColor: p5.color(130, 216, 213, 180),
        noiseSeedOffset: 6000,
        minSize: 1,
        maxSize: 16,
        density: baseDensity,
        contrast: 2.0,
        blend: p5.MULTIPLY
      }, ART_W, ART_H, seed);
    }
    drawDotField(p5, {
      baseColor: p5.color(0, 40),
      noiseSeedOffset: 3000,
      minSize: 0,
      maxSize: 10,
      density: baseDensity,
      contrast: 3.0,
      blend: p5.DARKEST
    }, ART_W, ART_H, seed);
    drawStaticIcons(p5, staticIcons, MARGIN_LEFT, MARGIN_TOP, p5.iconPngImgs);
    p5.imageMode(p5.CORNER);
    p5.tint(255, 255, 255, 140);
    p5.image(p5.manifestoTextImg, 0, 0, ART_W, ART_H);
    p5.noTint();
    p5.drawingContext.restore();
    p5.pop();
    // Centered text block with more space below artwork
    p5.push();
    p5.textAlign(p5.CENTER);
    p5.textSize(48);
    p5.fill(0);
    p5.textFont(p5.videoCondRegular);
    p5.text("THE DIGITAL MAVERICK MANIFESTO", CANVAS_W / 2, CANVAS_H - 200);
    p5.textSize(32);
    p5.textFont(p5.argentPixelItalic);
    let sigLine = `Signed by ${name} on ${date}`;
    p5.text(sigLine, CANVAS_W / 2, CANVAS_H - 150);
    p5.textSize(28);
    p5.textFont(p5.videoCondLight);
    p5.fill(180);
    p5.text(signature, CANVAS_W / 2, CANVAS_H - 100);
    p5.pop();
    // Draw token ID/total at bottom right under artwork
    p5.textAlign(p5.RIGHT);
    p5.textSize(40);
    p5.fill(0);
    p5.textFont(p5.profesorRegular);
    p5.text(`#${signerNumber}`, MARGIN_LEFT + ART_W - 10, MARGIN_TOP + ART_H + 40);
    
    // Call onArtworkReady after the first draw cycle is complete
    if (!p5.artworkDrawn) {
      p5.artworkDrawn = true;
      setIsLoading(false);
      onArtworkReady?.();
    }
  }, [name, date, signature, signerNumber, background, onArtworkReady]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <img src="/images/loading-black.gif" alt="Loading" className="w-8 h-8 mx-auto mb-2" />
            <div className="font-videocond text-lg">Generating artwork...</div>
          </div>
        </div>
      )}
      <Sketch preload={preload} setup={setup} draw={draw} />
    </div>
  );
}

// Helper to load an image as a Promise
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Helper to load a font as a Promise
function loadFont(name: string, url: string): Promise<void> {
  const font = new FontFace(name, `url(${url})`);
  return font.load().then((loaded) => {
    (document as any).fonts.add(loaded);
  });
}

// Main drawing function for print/download
export async function drawGenerativeArtToCanvas({
  ctx,
  name,
  date,
  signature,
  signerNumber,
  width = 1700,
  height = 2200,
  whiteBackground = false,
}: {
  ctx: CanvasRenderingContext2D,
  name: string,
  date: string,
  signature: string,
  signerNumber: number,
  width?: number,
  height?: number,
  whiteBackground?: boolean,
}) {
  // Load assets
  const [manifestoTextImg, paperBgImg, ...iconImgs] = await Promise.all([
    loadImage('/generative-art/images/manifesto-text.png'),
    loadImage('/generative-art/images/paperbackground.jpg'),
    ...Array.from({length: 46}, (_, i) => loadImage(`/generative-art/images/${i+1}.png`))
  ]);
  await loadFont('VideoCond', '/generative-art/fonts/VideoCond-Regular.ttf');
  await loadFont('VideoCondLight', '/generative-art/fonts/VideoCond-Light.ttf');

  // Set up
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background
  if (whiteBackground) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.drawImage(paperBgImg, 0, 0, width, height);
  }

  // Art block dimensions (match p5)
  const ART_W = 1428;
  const ART_H = 1785;
  const MARGIN_BOTTOM = 279;
  const MARGIN_TOP = (height - ART_H - MARGIN_BOTTOM);
  const MARGIN_LEFT = (width - ART_W) / 2;

  // Use the same seed calculation as p5.js version
  const hashToSeed = (sig: string) => {
    let hash = 0;
    for (let i = 0; i < sig.length; i++) {
      hash = (hash << 5) - hash + sig.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  // Draw icons (random, but deterministic by signature)
  function seededRandom(seed: number) {
    let x = Math.sin(seed++) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }
  const seed = hashToSeed(signature);
  const rand = seededRandom(seed);

  // Place icons (simplified version of p5.js algorithm)
  const numIcons = Math.floor(rand() * 5) + 7;
  for (let i = 0; i < numIcons; i++) {
    const iconIdx = Math.floor(rand() * iconImgs.length);
    const s = 600 + rand() * 300;
    const x = MARGIN_LEFT + rand() * (ART_W - s);
    const y = MARGIN_TOP + rand() * (ART_H - s);
    const rot = (rand() - 0.5) * Math.PI / 8;
    ctx.save();
    ctx.translate(x + s/2, y + s/2);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.28;
    ctx.drawImage(iconImgs[iconIdx], -s/2, -s/2, s, s);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Dot field (simplified version - should match p5.js algorithm)
  const baseDensity = Math.min(Math.max(signerNumber, 1), 1000) * 0.04 + 80; // map(signerNumber, 1, 1000, 80, 120)
  for (let i = 0; i < baseDensity * 10; i++) {
    const x = MARGIN_LEFT + rand() * ART_W;
    const y = MARGIN_TOP + rand() * ART_H;
    const r = 2 + rand() * 22;
    ctx.fillStyle = "rgba(255,232,0,0.7)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Manifesto text image
  ctx.drawImage(manifestoTextImg, MARGIN_LEFT + 40, MARGIN_TOP + 40, ART_W - 80, 400);

  // Name, date, signature
  ctx.font = "48px VideoCond";
  ctx.fillStyle = "#111";
  ctx.fillText(name, MARGIN_LEFT + 60, MARGIN_TOP + ART_H - 120);
  ctx.font = "32px VideoCondLight";
  ctx.fillText(date, MARGIN_LEFT + 60, MARGIN_TOP + ART_H - 60);
  ctx.font = "24px VideoCondLight";
  ctx.fillText(signature, MARGIN_LEFT + 60, MARGIN_TOP + ART_H - 20);

  ctx.restore();
}
