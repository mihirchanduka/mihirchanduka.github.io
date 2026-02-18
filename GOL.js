/**
@author ertdfgcvb
@title  Golgol (Infinite & Active)
@desc   High-res GOL with Wrap-around and Auto-wandering spawner.

*/

export const settings = { fps: 30 };

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const EASTER_EGG_MOVE_MS = 1800;
const EASTER_EGG_HOLD_MS = 2200;

const GLYPHS = {
  " ": ["000", "000", "000", "000", "000"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "111"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["111", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  Q: ["111", "101", "101", "111", "001"],
  R: ["111", "101", "111", "110", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
};

const easterEgg = {
  active: false,
  pending: false,
  keyIndex: 0,
  listenerAttached: false,
  startTime: 0,
  sizeKey: "",
  particles: [],
};

// Safe set function with Wrap Around
function set(val, x, y, w, h, buf) {
  const xm = ((x % w) + w) % w;
  const ym = ((y % h) + h) % h;
  buf[ym * w + xm] = val;
}

// Safe get function with Wrap Around
function get(x, y, w, h, buf) {
  const xm = ((x % w) + w) % w;
  const ym = ((y % h) + h) % h;
  return buf[ym * w + xm];
}

let cols, rows;
const data = [];

function attachKonamiListener() {
  if (easterEgg.listenerAttached || typeof window === "undefined") return;

  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === KONAMI_CODE[easterEgg.keyIndex]) {
      easterEgg.keyIndex++;
      if (easterEgg.keyIndex === KONAMI_CODE.length) {
        easterEgg.pending = true;
        easterEgg.keyIndex = 0;
      }
      return;
    }
    easterEgg.keyIndex = key === KONAMI_CODE[0] ? 1 : 0;
  });

  easterEgg.listenerAttached = true;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
}

function collectAliveCells(buf, w, h) {
  const points = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (buf[y * w + x]) points.push({ x, y });
    }
  }
  return points;
}

function getLineWidth(text, spacing, spaceWidth) {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    const glyph = GLYPHS[ch] || GLYPHS[" "];
    width += ch === " " ? spaceWidth : glyph[0].length;
    if (i < text.length - 1) width += spacing;
  }
  return width;
}

function writeTextTargets(text, w, yOffset, spacing, spaceWidth) {
  const targets = [];
  const lineWidth = getLineWidth(text, spacing, spaceWidth);
  let cursorX = Math.max(0, Math.floor((w - lineWidth) / 2));

  for (const ch of text.toUpperCase()) {
    const glyph = GLYPHS[ch] || GLYPHS[" "];
    if (ch === " ") {
      cursorX += spaceWidth + spacing;
      continue;
    }

    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx] === "1") {
          targets.push({ x: cursorX + gx, y: yOffset + gy });
        }
      }
    }
    cursorX += glyph[0].length + spacing;
  }

  return targets;
}

function buildTextTargets(w, h) {
  let lines = ["TOUCH GRASS"];
  let spacing = 1;
  let spaceWidth = 2;

  let maxWidth = getLineWidth(lines[0], spacing, spaceWidth);
  if (maxWidth > w - 2) {
    lines = ["TOUCH", "GRASS"];
    spacing = 0;
    spaceWidth = 1;
    maxWidth = Math.max(
      getLineWidth(lines[0], spacing, spaceWidth),
      getLineWidth(lines[1], spacing, spaceWidth),
    );
  }

  const lineHeight = 5;
  const lineGap = lines.length > 1 ? 2 : 0;
  const totalHeight = lineHeight * lines.length + lineGap;
  const startY = Math.max(0, Math.floor((h - totalHeight) / 2));

  const targets = [];
  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * (lineHeight + lineGap);
    const lineTargets = writeTextTargets(lines[i], w, y, spacing, spaceWidth);
    for (const point of lineTargets) {
      if (point.x >= 0 && point.x < w && point.y >= 0 && point.y < h) {
        targets.push(point);
      }
    }
  }

  if (maxWidth <= 0 || targets.length === 0) {
    return [{ x: Math.floor(w / 2), y: Math.floor(h / 2) }];
  }
  return targets;
}

function prepareEasterEgg(prev, context, w, h) {
  const targets = buildTextTargets(w, h);
  const alive = collectAliveCells(prev, w, h);
  const particles =
    alive.length > 0 ? alive : [{ x: Math.floor(w / 2), y: Math.floor(h / 2) }];

  shuffle(particles);
  shuffle(targets);

  const MAX_PARTICLES = 4000;
  const capped = particles.slice(0, MAX_PARTICLES);
  easterEgg.particles = capped.map((source, i) => ({
    source,
    target: targets[i % targets.length],
  }));
  easterEgg.startTime = context.time;
  easterEgg.sizeKey = `${w}x${h}`;
  easterEgg.active = true;
}

function stampBrush(buf, cx, cy, radius, w, h, chance = 0.5) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (Math.random() < chance) {
        set(1, x, y, w, h, buf);
      }
    }
  }
}

export function pre(context, cursor, buffer) {
  attachKonamiListener();

  // Init or Resize
  if (cols != context.cols || rows != context.rows) {
    cols = context.cols;
    rows = context.rows;
    const len = context.cols * context.rows * 2;

    data[0] = new Uint8Array(len);
    data[1] = new Uint8Array(len);

    // Initial Random Noise
    for (let i = 0; i < len; i++) {
      data[0][i] = Math.random() > 0.5 ? 1 : 0;
      data[1][i] = data[0][i];
    }
  }

  const prev = data[context.frame % 2];
  const curr = data[(context.frame + 1) % 2];
  const w = cols;
  const h = rows * 2;

  if (easterEgg.pending) {
    easterEgg.pending = false;
    prepareEasterEgg(prev, context, w, h);
  }

  if (easterEgg.active) {
    const sizeKey = `${w}x${h}`;
    if (sizeKey !== easterEgg.sizeKey) {
      prepareEasterEgg(prev, context, w, h);
    }

    const elapsed = context.time - easterEgg.startTime;
    const totalDuration = EASTER_EGG_MOVE_MS + EASTER_EGG_HOLD_MS;
    if (elapsed >= totalDuration) {
      easterEgg.active = false;
      prev.set(curr);
    } else {
      curr.fill(0);
      const t = Math.min(1, elapsed / EASTER_EGG_MOVE_MS);
      const ease = 1 - Math.pow(1 - t, 3);

      for (const particle of easterEgg.particles) {
        const x = Math.round(
          particle.source.x + (particle.target.x - particle.source.x) * ease,
        );
        const y = Math.round(
          particle.source.y + (particle.target.y - particle.source.y) * ease,
        );
        set(1, x, y, w, h, curr);
      }

      return;
    }
  }

  // --- AUTOMATED WANDERING SPAWNER ---
  // Moves in a smooth wave pattern to ensure constant activity
  const t = context.time * 2;
  const autoX = Math.floor((Math.sin(t) * 0.4 + 0.5) * w);
  const autoY = Math.floor((Math.cos(t * 1.3) * 0.4 + 0.5) * h);

  // Inject life at the auto-cursor position
  const s = 2; // Brush size
  for (let dy = -s; dy <= s; dy++) {
    for (let dx = -s; dx <= s; dx++) {
      // 50% chance to spawn a cell within the brush area
      if (Math.random() > 0.5) {
        set(1, autoX + dx, autoY + dy, w, h, prev);
      }
    }
  }

  // --- MOUSE INTERACTION ---
  // Hover creates a subtle trail, click-drag creates a stronger burst.
  const cx = Math.floor(cursor.x);
  const cy = Math.floor(cursor.y * 2);
  const px = Math.floor(cursor.p.x);
  const py = Math.floor(cursor.p.y * 2);

  const moved = cx !== px || cy !== py;
  if (moved) {
    const dx = cx - px;
    const dy = cy - py;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);

    for (let i = 0; i <= steps; i++) {
      const tStep = i / steps;
      const mx = Math.floor(px + dx * tStep);
      const my = Math.floor(py + dy * tStep);
      stampBrush(prev, mx, my, 1, w, h, 0.3);
    }
  }

  if (cursor.pressed) {
    stampBrush(prev, cx, cy, 3, w, h, 0.7);
  }

  // --- SIMULATION LOOP ---
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const current = get(x, y, w, h, prev);
      const neighbors =
        get(x - 1, y - 1, w, h, prev) +
        get(x, y - 1, w, h, prev) +
        get(x + 1, y - 1, w, h, prev) +
        get(x - 1, y, w, h, prev) +
        get(x + 1, y, w, h, prev) +
        get(x - 1, y + 1, w, h, prev) +
        get(x, y + 1, w, h, prev) +
        get(x + 1, y + 1, w, h, prev);

      const idx = y * w + x;
      if (current == 1) {
        curr[idx] = neighbors == 2 || neighbors == 3 ? 1 : 0;
      } else {
        curr[idx] = neighbors == 3 ? 1 : 0;
      }
    }
  }
}

export function main(coord, context, buffer) {
  const curr = data[(context.frame + 1) % 2];
  const w = context.cols;
  const idx = coord.x + coord.y * 2 * w;

  // Get values
  const upper = curr[idx];
  const lower = curr[idx + w];

  if (upper && lower) return "█";
  if (upper) return "▀";
  if (lower) return "▄";

  return " ";
}
