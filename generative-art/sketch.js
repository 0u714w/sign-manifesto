// ==== CONFIG ==== //
let signerCount = 10000; // replace with dynamic input or API later
let seed = 0;

// Art block dimensions
const CANVAS_W = 1700;
const CANVAS_H = 2200;
const ART_W = 1428;
const ART_H = 1785;
const MARGIN_BOTTOM = 279;
const MARGIN_TOP = (CANVAS_H - ART_H - MARGIN_BOTTOM);
const MARGIN_LEFT = (CANVAS_W - ART_W) / 2;


// Load manifesto text image
let manifestoTextImg;
// Load paper background image
let paperBgImg;


// Load fonts
let videoCondRegular;
let videoCondLight;
let argentPixelItalic;
let profesorRegular;


// ==== PNG ICON OVERLAY ==== //
let iconPngPaths = [
  'images/smileyface.png',
  'images/starburst.png',
  'images/globe.png',
  'images/lightningbolt.png',
  'images/prism.png',
  'images/hurricane.png',
  'images/atom.png',
  'images/circle.png',
  'images/starburstsolid.png',
  'images/ring.png',
  'images/squiggle.png',
  'images/football.png',
  'images/wave.png',
  'images/spiral.png',
  'images/mushroom.png',
  'images/glitchsmiley.png',
  'images/pill.png',
  'images/striped.png',
  'images/shades.png',
  'images/disc.png',
  'images/planet.png',
  'images/headphones.png',
  'images/headphones2.png',
  'images/cd.png',
  'images/bottle.png',
  'images/1.png',
  'images/2.png',
  'images/3.png',
  'images/4.png',
  'images/5.png',
  'images/6.png',
  'images/7.png',
  'images/8.png',
  'images/9.png',
  'images/10.png',
  'images/11.png',
  'images/12.png',
  'images/13.png',
  'images/14.png',
  'images/15.png',
  'images/16.png',
  'images/17.png',
  'images/18.png',
  'images/19.png',
  'images/20.png',
  'images/21.png',
  'images/22.png',
  'images/23.png',
  'images/24.png',
  'images/25.png',
  'images/26.png',
  'images/27.png',
  'images/28.png',
  'images/29.png',
  'images/30.png',
  'images/31.png',
  'images/32.png',
  'images/33.png',
  'images/34.png',
  'images/35.png',
  'images/36.png',
  'images/37.png',
  'images/38.png',
  'images/39.png',
  'images/40.png',
  'images/41.png',
  'images/42.png',
  'images/43.png',
  'images/44.png',
  'images/45.png',
  'images/46.png',
];
let iconPngImgs = [];

/*
// Store the generated icon set and their animation state globally
let animatedIcons = null;
*/

let staticIcons = null;

function generateStaticIcons() {
  let maxIcons = iconPngImgs.length;
  let numIcons = min(int(random(7, 12)), maxIcons);
  let iconIndices = shuffle([...Array(maxIcons).keys()]).slice(0, numIcons);
  let icons = [];
  let tries = 0;
  let buffer = 10;
  let used = 0;
  while (icons.length < numIcons && tries < 400) {
    let s = random(600, 900);
    let x = random(-s/3, ART_W + s/3);
    let y = random(-s/3, ART_H - 80 + s/3);
    let rot = random(-PI/16, PI/16);
    // Check for buffer spacing
    let ok = true;
    for (let p of icons) {
      if (dist(x, y, p.x, p.y) < (s + p.s)/2 + buffer) ok = false;
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
  staticIcons = icons;
}

function drawStaticIcons() {
  if (!staticIcons) return;
  for (let p of staticIcons) {
    push();
    translate(MARGIN_LEFT + p.x, MARGIN_TOP + p.y);
    rotate(p.rot);
    imageMode(CENTER);
    tint(255, 70); // Lower opacity
    image(iconPngImgs[p.idx], 0, 0, p.s, p.s);
    noTint(); // Reset tint for other drawing
    pop();
  }
}

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  pixelDensity(1);
  noSmooth();
  // noLoop(); // REMOVE noLoop to allow animation
  randomSeed(seed);
  noiseSeed(seed);
  generateStaticIcons();
}

function draw() {
  imageMode(CORNER);
  image(paperBgImg, 0, 0, CANVAS_W, CANVAS_H);
  push();
  translate(MARGIN_LEFT, MARGIN_TOP);
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, 0, ART_W, ART_H);
  drawingContext.clip();

  // Vary density with signerCount, but keep dot sizes fixed
  let baseDensity = map(signerCount, 1, 1000, 80, 120, true);

  // Layer 1: Yellow halftone field (high density, big dots)
  drawDotField({
    baseColor: color(255, 232, 0),
    noiseSeedOffset: 0,
    minSize: 2,
    maxSize: 24,
    density: baseDensity,
    contrast: 2.2,
    blend: BLEND
  });

  // Layer 2: Black halftone field (if signerCount > 25)
  if (signerCount > 25) {
    drawDotField({
      baseColor: color(136, 137, 138, 120),
      noiseSeedOffset: 1000,
      minSize: 0,
      maxSize: 18,
      density: baseDensity,
      contrast: 2.0,
      blend: MULTIPLY
    });
  }

  // Layer 3: Electric aqua (if signerCount > 50)
  if (signerCount > 50) {
    drawDotField({
      baseColor: color(94, 200, 229, 180),
      noiseSeedOffset: 2000,
      minSize: 1,
      maxSize: 16,
      density: baseDensity,
      contrast: 2.0,
      blend: MULTIPLY
    });
  }

  // Layer 4: Hot pink (if signerCount > 100)
  if (signerCount > 100) {
    drawDotField({
      baseColor: color(255, 75, 128, 180),
      noiseSeedOffset: 3000,
      minSize: 1,
      maxSize: 16,
      density: baseDensity,
      contrast: 2.0,
      blend: MULTIPLY
    });
  }

  // Layer 5: Acid green (if signerCount > 250)
  if (signerCount > 250) {
    drawDotField({
      baseColor: color(68, 214, 44, 180),
      noiseSeedOffset: 4000,
      minSize: 1,
      maxSize: 16,
      density: baseDensity,
      contrast: 2.0,
      blend: MULTIPLY
    });
  }

  // Layer 6: Coral pink (if signerCount > 500)
  if (signerCount > 500) {
    drawDotField({
      baseColor: color(255, 116, 119, 180),
      noiseSeedOffset: 5000,
      minSize: 1,
      maxSize: 16,
      density: baseDensity,
      contrast: 2.0,
      blend: MULTIPLY
    });
  }

  // Layer 7: Mint (if signerCount > 1000)
  if (signerCount > 1000) {
    drawDotField({
      baseColor: color(130, 216, 213, 180),
      noiseSeedOffset: 6000,
      minSize: 1,
      maxSize: 16,
      density: baseDensity,
      contrast: 2.0,
      blend: MULTIPLY
    });
  }

  // Subtle black accent/noise layer for extra texture
  drawDotField({
    baseColor: color(0, 40),
    noiseSeedOffset: 3000,
    minSize: 0,
    maxSize: 10,
    density: baseDensity,
    contrast: 3.0,
    blend: DARKEST
  });

  drawStaticIcons();

  /*
  // Overlay PNG icons
  drawPngIcons();
*/
  // Draw manifesto text as top layer
  imageMode(CORNER);
  tint(255, 255, 255, 140);
  image(manifestoTextImg, 0, 0, ART_W, ART_H);
  noTint();
/*
  drawingContext.restore();
  pop();

  // Centered text block with more space below artwork
  push();
  textAlign(CENTER);
  textSize(48);
  fill(0);
  textFont(videoCondRegular);
  text("THE DIGITAL MAVERICK MANIFESTO", CANVAS_W / 2, CANVAS_H - 200);
  
  textSize(32);
  textFont(argentPixelItalic);
  let sigLine = "Signed by John Doe on January 1, 2024";
  text(sigLine, CANVAS_W / 2, CANVAS_H - 150);
  
  textSize(28);
  textFont(videoCondLight);
  fill(180);
  text("0xE450637a5b515D5Bb09D2B75CB4ca89700Cc410C", CANVAS_W / 2, CANVAS_H - 100);
  pop();

  // Draw token ID/total at bottom right under artwork
  textAlign(RIGHT);
  textSize(40);
  fill(0);
  textFont(profesorRegular);
  text('69/420', MARGIN_LEFT + ART_W - 10, MARGIN_TOP + ART_H + 40);
  */

  drawingContext.restore();
  pop();

  // Centered text block with more space below artwork
  push();
  textAlign(CENTER);
  textSize(48);
  fill(0);
  textFont(videoCondRegular);
  text("THE DIGITAL MAVERICK MANIFESTO", CANVAS_W / 2, CANVAS_H - 200);
  
  textSize(32);
  textFont(argentPixelItalic);
  let sigLine = "Signed by Debbie Soon on May 21, 2025";
  text(sigLine, CANVAS_W / 2, CANVAS_H - 150);
  
  textSize(28);
  textFont(videoCondLight);
  fill(180);
  text("0xE450637a5b515D5Bb09D2B75CB4ca89700Cc410C", CANVAS_W / 2, CANVAS_H - 100);
  pop();

  // Draw token ID/total at bottom right under artwork
  textAlign(RIGHT);
  textSize(40);
  fill(0);
  textFont(profesorRegular);
  text('#69', MARGIN_LEFT + ART_W - 10, MARGIN_TOP + ART_H + 40);
}

function drawDotField({baseColor, noiseSeedOffset, minSize, maxSize, density, contrast, blend}) {
  blendMode(blend);
  let cols = density, rows = int(cols * ART_H / ART_W);
  let cellW = ART_W / cols, cellH = ART_H / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * cellW + cellW/2;
      let y = j * cellH + cellH/2;
      let n = noise(i*0.09 + noiseSeedOffset, j*0.09 + noiseSeedOffset, seed*0.01 + noiseSeedOffset);
      // Nonlinear mapping for higher contrast
      n = pow(n, contrast);
      let s = map(n, 0, 1, minSize, maxSize);
      fill(baseColor);
      noStroke();
      ellipse(x, y, s, s);
    }
  }
  blendMode(BLEND);
}

/*
function generateAnimatedIcons() {
  let maxIcons = iconPngImgs.length;
  let numIcons = min(int(random(7, 12)), maxIcons);
  let iconIndices = shuffle([...Array(maxIcons).keys()]).slice(0, numIcons);
  let icons = [];
  let tries = 0;
  let buffer = 10;
  let used = 0;
  while (icons.length < numIcons && tries < 400) {
    let s = random(600, 900);
    let x = random(-s/3, ART_W + s/3);
    let y = random(-s/3, ART_H - 80 + s/3);
    let rot = random(-PI/16, PI/16);
    // Check for buffer spacing
    let ok = true;
    for (let p of icons) {
      if (dist(x, y, p.x, p.y) < (s + p.s)/2 + buffer) ok = false;
    }
    // Check if at least part of the icon is inside the art block
    let visible = (
      x + s/2 > 0 && x - s/2 < ART_W &&
      y + s/2 > 0 && y - s/2 < ART_H
    );
    if (ok && visible) {
      // Assign a unique, slightly faster and less variable rotation speed
      let baseSpeed = random(0.018, 0.025); // slightly faster, less variance
      let speed = random([1, -1]) * baseSpeed;
      // Assign a gentle random drift for floating
      let dx = random(-3, 3); // pixels per frame, even faster drift
      let dy = random(-3, 3);
      icons.push({x, y, s, rot, idx: iconIndices[used], speed, dx, dy});
      used++;
    }
    tries++;
  }
  animatedIcons = icons;
}

function drawPngIcons() {
  if (!animatedIcons) return;
  for (let p of animatedIcons) {
    // Animate rotation
    p.rot += p.speed;
    // Animate floating
    p.x += p.dx;
    p.y += p.dy;
    // Wrap around art area (allow overflow for bold look, but keep at least part visible)
    let minX = -p.s/3, maxX = ART_W + p.s/3;
    let minY = -p.s/3, maxY = ART_H - 80 + p.s/3;
    if (p.x - p.s/2 > maxX) p.x = minX - p.s/2 + 1;
    if (p.x + p.s/2 < minX) p.x = maxX + p.s/2 - 1;
    if (p.y - p.s/2 > maxY) p.y = minY - p.s/2 + 1;
    if (p.y + p.s/2 < minY) p.y = maxY + p.s/2 - 1;
    push();
    translate(p.x, p.y);
    rotate(p.rot);
    imageMode(CENTER);
    blendMode(MULTIPLY);
    tint(0, 0, 0, 80);
    image(iconPngImgs[p.idx], 0, 0, p.s, p.s);
    blendMode(BLEND);
    pop();
  }
}
*/
function generateNew() {
  seed = floor(random(100000));
  randomSeed(seed);
  noiseSeed(seed);
  generateStaticIcons(); // Regenerate static icon positions
  redraw();
}

function preload() {
  manifestoTextImg = loadImage('images/manifesto-text.png');
  // If you are not using icons, you can comment out the next line:
  iconPngImgs = iconPngPaths.map(path => loadImage(path));
  paperBgImg = loadImage('images/paperbackground.jpg');
  
  // Load fonts
  videoCondRegular = loadFont('fonts/VideoCond-Regular.ttf');
  videoCondLight = loadFont('fonts/VideoCond-Light.ttf');
  argentPixelItalic = loadFont('fonts/ArgentPixelCF-Italic.ttf');
  profesorRegular = loadFont('fonts/Professor-Regular.ttf');
}




