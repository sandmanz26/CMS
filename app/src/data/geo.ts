// Sales territories, cities and a schematic outline of Indonesia for the territory map.
// Coordinates are [longitude, latitude]. Island shapes are intentionally simplified.

/** `center` is where the area bubble is drawn — dense Java areas are nudged into the sea (north/south alternately) so bubbles don't overlap. */
export type Area = { id: string; name: string; short: string; center: [number, number]; cities: string[]; label?: "above" | "below" }

export const areas: Area[] = [
  { id: "jkt", name: "Greater Jakarta", short: "Jakarta", center: [106.4, -4.9], cities: ["Jakarta", "Tangerang", "Bekasi", "Bogor"], label: "above" },
  { id: "wjv", name: "West Java", short: "W. Java", center: [107.6, -8.6], cities: ["Bandung", "Cirebon"] },
  { id: "cjv", name: "Central Java & Yogyakarta", short: "C. Java", center: [110.0, -5.3], cities: ["Semarang", "Yogyakarta", "Solo"], label: "above" },
  { id: "ejv", name: "East Java", short: "E. Java", center: [112.5, -9.1], cities: ["Surabaya", "Malang"] },
  { id: "bnt", name: "Bali & Nusa Tenggara", short: "Bali–NT", center: [119.6, -7.1], cities: ["Denpasar", "Mataram", "Kupang"], label: "above" },
  { id: "nsm", name: "North Sumatra & Aceh", short: "N. Sumatra", center: [98.4, 3.2], cities: ["Medan", "Banda Aceh"] },
  { id: "ssm", name: "Central & South Sumatra", short: "S. Sumatra", center: [102.8, -1.8], cities: ["Pekanbaru", "Padang", "Palembang", "Bandar Lampung"] },
  { id: "kal", name: "Kalimantan", short: "Kalimantan", center: [114.2, -0.8], cities: ["Balikpapan", "Samarinda", "Pontianak", "Banjarmasin"] },
  { id: "sul", name: "Sulawesi", short: "Sulawesi", center: [120.6, -2.4], cities: ["Makassar", "Manado", "Palu"] },
  { id: "pap", name: "Maluku & Papua", short: "Maluku–Papua", center: [132.5, -3.2], cities: ["Ambon", "Jayapura"] },
]
export const areaById = (id: string) => areas.find((a) => a.id === id)
export const areaOfCity = (city: string) => areas.find((a) => a.cities.includes(city))!

export const cityCoords: Record<string, [number, number]> = {
  Jakarta: [106.82, -6.2], Tangerang: [106.63, -6.18], Bekasi: [107.0, -6.24], Bogor: [106.8, -6.6],
  Bandung: [107.6, -6.91], Cirebon: [108.55, -6.73], Semarang: [110.42, -6.99], Yogyakarta: [110.37, -7.8], Solo: [110.82, -7.57],
  Surabaya: [112.75, -7.25], Malang: [112.63, -7.98], Denpasar: [115.22, -8.65], Mataram: [116.1, -8.58], Kupang: [123.6, -10.17],
  Medan: [98.67, 3.6], "Banda Aceh": [95.32, 5.55], Pekanbaru: [101.45, 0.51], Padang: [100.36, -0.95], Palembang: [104.75, -2.98],
  "Bandar Lampung": [105.26, -5.43], Balikpapan: [116.83, -1.27], Samarinda: [117.15, -0.5], Pontianak: [109.33, -0.03],
  Banjarmasin: [114.59, -3.32], Makassar: [119.43, -5.15], Manado: [124.84, 1.47], Palu: [119.87, -0.9], Ambon: [128.18, -3.7], Jayapura: [140.7, -2.53],
}

/** Map projection: simple equirectangular over the archipelago bounds. */
export const MAP = { minLon: 94, maxLon: 142, maxLat: 7, minLat: -11.5, scale: 20 }
export const MAP_W = (MAP.maxLon - MAP.minLon) * MAP.scale
export const MAP_H = (MAP.maxLat - MAP.minLat) * MAP.scale
export const project = ([lon, lat]: [number, number]): [number, number] => [(lon - MAP.minLon) * MAP.scale, (MAP.maxLat - lat) * MAP.scale]

type Ring = [number, number][]
export const islands: { name: string; area?: string; ring: Ring }[] = [
  { name: "Sumatra", ring: [[95.3, 5.6], [96.4, 5.2], [97.6, 5.1], [98.7, 3.8], [99.9, 2.9], [100.9, 2.1], [101.5, 1.7], [102.5, 1.3], [103.4, 0.6], [103.8, -0.4], [104.5, -1.0], [104.9, -2.3], [105.9, -3.0], [106.0, -3.9], [105.8, -5.2], [105.6, -5.9], [104.6, -5.9], [103.9, -5.0], [102.3, -3.9], [101.3, -2.7], [100.4, -1.3], [99.7, 0.0], [98.8, 1.6], [97.6, 2.7], [96.2, 4.1], [95.2, 5.1]] },
  { name: "Bangka", ring: [[105.2, -1.6], [106.2, -1.9], [106.8, -2.9], [106.0, -3.1], [105.4, -2.4]] },
  { name: "Java", ring: [[105.2, -6.8], [105.9, -6.0], [106.8, -6.05], [107.6, -6.2], [108.6, -6.7], [109.5, -6.85], [110.4, -6.95], [111.0, -6.4], [111.6, -6.7], [112.6, -6.9], [112.8, -7.2], [114.0, -7.6], [114.45, -7.8], [114.4, -8.7], [113.3, -8.3], [112.0, -8.3], [110.4, -8.1], [109.0, -7.75], [107.5, -7.6], [106.4, -7.4], [105.5, -6.9]] },
  { name: "Madura", ring: [[112.7, -6.9], [114.1, -6.9], [114.0, -7.15], [112.75, -7.2]] },
  { name: "Bali", ring: [[114.45, -8.1], [115.15, -8.05], [115.7, -8.35], [115.2, -8.85], [114.55, -8.4]] },
  { name: "Lombok", ring: [[115.85, -8.25], [116.6, -8.25], [116.7, -8.85], [116.0, -8.9]] },
  { name: "Sumbawa", ring: [[116.8, -8.4], [117.6, -8.15], [118.7, -8.3], [119.1, -8.6], [118.3, -8.85], [117.1, -8.9]] },
  { name: "Flores", ring: [[119.8, -8.5], [121.0, -8.3], [122.6, -8.15], [123.0, -8.4], [121.8, -8.85], [120.2, -8.85]] },
  { name: "Sumba", ring: [[119.0, -9.4], [120.2, -9.35], [120.8, -10.15], [119.6, -9.9]] },
  { name: "Timor", ring: [[123.5, -10.1], [124.5, -9.2], [125.4, -8.6], [127.2, -8.4], [126.0, -9.0], [124.3, -10.0], [123.6, -10.4]] },
  { name: "Borneo", ring: [[109.6, 1.95], [110.6, 1.6], [111.5, 2.6], [113.0, 3.2], [114.0, 4.6], [115.4, 5.0], [116.0, 6.0], [116.8, 7.0], [117.7, 6.4], [118.6, 5.4], [119.2, 5.1], [118.2, 4.4], [117.7, 3.4], [117.9, 2.2], [118.9, 1.0], [117.6, 0.6], [117.5, -0.6], [116.9, -1.3], [116.4, -2.6], [116.2, -3.6], [115.6, -4.0], [114.6, -3.6], [113.0, -3.1], [111.8, -3.5], [110.2, -2.9], [110.0, -1.6], [109.3, -0.8], [109.0, 0.6], [109.1, 1.4]] },
  { name: "Sulawesi", ring: [[119.85, 0.2], [120.1, 0.75], [121.0, 1.3], [123.0, 1.0], [124.2, 0.8], [125.25, 1.5], [124.85, 1.7], [123.9, 1.0], [122.4, 0.6], [121.2, 0.5], [120.3, 0.2], [120.4, -0.9], [121.6, -0.9], [123.0, -0.9], [123.4, -0.95], [122.3, -1.4], [121.3, -1.9], [122.4, -3.3], [123.1, -4.5], [122.6, -5.4], [121.4, -4.7], [121.0, -3.4], [120.3, -2.9], [120.4, -5.5], [119.5, -5.6], [119.3, -4.1], [119.0, -3.2], [119.4, -2.4], [119.5, -1.0], [119.8, -0.4]] },
  { name: "Halmahera", ring: [[127.8, 2.2], [128.3, 1.0], [128.9, 1.3], [128.2, 0.4], [128.9, -0.1], [128.2, -0.9], [127.6, -0.4], [127.7, 1.1]] },
  { name: "Seram", ring: [[127.9, -2.9], [129.4, -2.8], [130.9, -3.1], [130.6, -3.6], [128.9, -3.4], [128.0, -3.4]] },
  { name: "Buru", ring: [[125.9, -3.1], [126.9, -3.1], [127.2, -3.6], [126.3, -3.8]] },
  { name: "Papua", ring: [[130.9, -0.9], [131.9, -0.4], [132.9, -0.4], [134.1, -0.9], [134.3, -2.2], [135.4, -3.3], [136.9, -2.3], [137.9, -1.5], [139.0, -2.0], [140.7, -2.4], [141.0, -2.6], [141.0, -9.1], [140.1, -8.3], [139.0, -8.1], [138.0, -8.4], [137.7, -7.2], [136.0, -4.8], [134.6, -4.2], [133.2, -4.1], [132.6, -3.4], [132.0, -2.9], [133.3, -2.4], [132.3, -2.2], [131.3, -1.5]] },
]

export const ringPath = (ring: Ring) => ring.map((p, i) => `${i ? "L" : "M"}${project(p).map((v) => v.toFixed(1)).join(" ")}`).join("") + "Z"
