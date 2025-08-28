// Converts a single hex colour into a nice 50→900 scale in RGB triplets (numbers 0–255)
// Lightweight, no deps; good enough for brand tints/shades.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#','');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHsl([r,g,b]: [number,number,number]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2*l - 1));
    switch(max){
      case r: h = ((g-b)/d + (g<b?6:0)); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h /= 6;
  }
  return [h*360, s, l];
}

function hslToRgb([h,s,l]: [number,number,number]): [number,number,number] {
  h/=360; const a = s * Math.min(l, 1 - l);
  const f = (n:number) => {
    const k = (n + h*12) % 12;
    const c = l - a * Math.max(Math.min(k-3, 9-k, 1), -1);
    return Math.round(255 * c);
  }
  return [f(0), f(8), f(4)];
}

function clamp01(x:number){ return Math.min(1, Math.max(0, x)); }

export function derivePalette(primaryHex: string): Record<string, [number,number,number]> {
  const rgb = hexToRgb(primaryHex);
  const [h,s,l] = rgbToHsl(rgb);

  // create scale by nudging lightness; keep saturation within bounds for readability
  const steps: Record<string, number> = {
    '50': 0.95, '100': 0.9, '200': 0.8, '300': 0.7, '400': 0.6,
    '500': l,   '600': 0.45, '700': 0.38, '800': 0.3, '900': 0.22,
  };

  const sat = clamp01(s < 0.25 ? 0.35 : s); // ensure some colour

  const out: Record<string, [number,number,number]> = {};
  for (const [k, light] of Object.entries(steps)) {
    out[k] = hslToRgb([h, sat, light]);
  }
  return out;
}