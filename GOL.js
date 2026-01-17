/**
@author ertdfgcvb
@title  Golgol (Infinite & Active)
@desc   High-res GOL with Wrap-around and Auto-wandering spawner.

Features:
1.  Wrap-around (Toroidal surface)
2.  "Wandering Cursor": An automated emitter moves across the screen to keep it active.
3.  Clean visuals (No trails)
*/

export const settings = { fps: 60 };

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

export function pre(context, cursor, buffer) {
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
  if (cursor.pressed) {
    const cx = Math.floor(cursor.x);
    const cy = Math.floor(cursor.y * 2);
    const brush = 3;
    for (let y = cy - brush; y < cy + brush; y++) {
      for (let x = cx - brush; x < cx + brush; x++) {
        set(Math.random() > 0.5 ? 1 : 0, x, y, w, h, prev);
      }
    }
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
