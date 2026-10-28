// Stylised outline of Germany + Austria + Switzerland (lon, lat), clockwise from the north-west.
const OUTLINE: [number, number][] = [
  [8.4, 55.05], [9.5, 54.85], [10.0, 54.75], [10.9, 54.4], [11.5, 54.0], [12.4, 54.4], [13.3, 54.65],
  [14.2, 53.95], [14.3, 53.0], [14.6, 52.4], [14.7, 51.6], [15.0, 51.0], [14.5, 50.9], [13.9, 50.8],
  [12.9, 50.4], [12.2, 50.25], [12.4, 49.8], [13.2, 49.2], [13.8, 48.77], [14.7, 48.6], [15.0, 49.0],
  [16.0, 48.75], [16.9, 48.7], [17.15, 48.1], [16.9, 47.7], [16.5, 47.4], [16.4, 46.9], [15.9, 46.65],
  [15.0, 46.6], [14.5, 46.4], [13.7, 46.5], [13.0, 46.55], [12.3, 46.85], [12.0, 47.0], [11.1, 46.9],
  [10.5, 46.9], [10.4, 46.55], [10.1, 46.25], [9.3, 46.3], [9.0, 45.85], [8.5, 46.05], [8.3, 46.4],
  [7.6, 45.95], [7.0, 45.9], [6.8, 46.15], [6.1, 46.2], [6.2, 46.5], [6.9, 47.0], [7.0, 47.35],
  [7.5, 47.6], [7.6, 48.0], [7.8, 48.5], [8.2, 48.95], [7.1, 49.1], [6.4, 49.45], [6.1, 50.1],
  [6.1, 50.75], [5.95, 51.0], [6.0, 51.8], [6.8, 51.95], [7.0, 52.6], [7.1, 53.3], [8.0, 53.6],
  [8.5, 53.5], [8.6, 53.95], [8.9, 54.2], [8.7, 54.9]
];

export const MAP_W = 900;
export const MAP_H = 1160;
const S = 120;
export const project = (lon: number, lat: number): [number, number] => [(lon - 5.5) * 0.64 * S + 4, (55.3 - lat) * S + 4];

export const outlinePoints = OUTLINE.map(([lon, lat]) => project(lon, lat));
export const outlinePath = 'M' + outlinePoints.map((p) => p.join(',')).join(' L') + ' Z';

const inside = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = outlinePoints.length - 1; i < outlinePoints.length; j = i++) {
    const [xi, yi] = outlinePoints[i];
    const [xj, yj] = outlinePoints[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

export const DOTS: {x: number; y: number}[] = [];
const STEP = 20;
for (let y = 10; y < MAP_H; y += STEP) {
  for (let x = 10 + (Math.round(y / STEP) % 2) * (STEP / 2); x < MAP_W; x += STEP) {
    if (inside(x, y)) DOTS.push({x, y});
  }
}
