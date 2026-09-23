/**
 * PRAVAONLINE — Unified Autodrome Specification & Single Source of Truth
 * 
 * Both 3D World (Three.js) and 2D Radar Map (SVG) consume this exact specification.
 * Any coordinate or dimension change here updates both 3D and 2D representations
 * with 100% mathematical consistency.
 */

import { EXERCISE_REGISTRY } from "./exerciseRegistry";
import type { ExerciseDefinition, LocalizedString } from "../types";

export interface Coordinate2D {
  x: number;
  y: number;
}

export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface RoadSegmentDefinition {
  id: string;
  name: string;
  start: Coordinate2D;
  end: Coordinate2D;
  width: number; // in 2D units
  hasCenterline?: boolean;
  hasCurbs?: boolean;
  hasYellowSensors?: boolean;
}

export interface BoundaryDefinition {
  id: string;
  type: "perimeter" | "island";
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  fillColor?: string;
  strokeColor?: string;
}

export interface SpecialZoneDefinition {
  id: string;
  type:
    | "start_box"
    | "pedestrian_crossing"
    | "estakada_ramp"
    | "turns_90"
    | "turnaround"
    | "zmeyka_slalom"
    | "parallel_parking"
    | "railway_crossing"
    | "tight_turnaround"
    | "garage_box"
    | "speed_braking"
    | "finish_box";
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  title: LocalizedString;
  inclinePercent?: number;
}

export interface SignDefinition {
  id: string;
  type: "speed_30" | "pedestrian" | "railway" | "stop";
  position: Coordinate2D;
  rotation: number; // radians
}

export interface TrafficLightDefinition {
  id: string;
  position: Coordinate2D;
  targetRoad: Coordinate2D;
}

export interface AutodromeSpecification {
  id: string;
  name: LocalizedString;
  dimensions: {
    width2D: number;
    height2D: number;
    scale3D: number;
    originX2D: number;
    originY2D: number;
  };
  to3D: (x2D: number, y2D: number, elevationY?: number) => Coordinate3D;
  to2D: (worldX: number, worldZ: number) => Coordinate2D;
  roads: RoadSegmentDefinition[];
  boundaries: BoundaryDefinition[];
  zones: SpecialZoneDefinition[];
  signs: SignDefinition[];
  trafficLights: TrafficLightDefinition[];
  exercises: ExerciseDefinition[];
}

const SCALE_FACTOR = 0.4;
const ORIGIN_X_2D = 300;
const ORIGIN_Y_2D = 250;

export const AUTODROME_SPEC: AutodromeSpecification = {
  id: "tashkent_central_ypx",
  name: {
    uzl: "Toshkent Markaziy YPX Avtodromi",
    uzc: "Тошкент Марказий ЙПХ Автодроми",
    ru: "Ташкентский Центральный Автодром УБДД",
  },
  dimensions: {
    width2D: 600,
    height2D: 500,
    scale3D: SCALE_FACTOR,
    originX2D: ORIGIN_X_2D,
    originY2D: ORIGIN_Y_2D,
  },
  to3D: (x2D: number, y2D: number, elevationY: number = 0): Coordinate3D => {
    return {
      x: (x2D - ORIGIN_X_2D) * SCALE_FACTOR,
      y: elevationY,
      z: (y2D - ORIGIN_Y_2D) * SCALE_FACTOR,
    };
  },
  to2D: (worldX: number, worldZ: number): Coordinate2D => {
    return {
      x: worldX / SCALE_FACTOR + ORIGIN_X_2D,
      y: worldZ / SCALE_FACTOR + ORIGIN_Y_2D,
    };
  },

  // Contiguous Road Network connecting all 12 stations seamlessly
  roads: [
    // 1. South Straight (Stations 1, 2, 3)
    {
      id: "road_south_straight",
      name: "South Straight",
      start: { x: 50, y: 440 },
      end: { x: 370, y: 440 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    // 2. South-East Connecting Turns (Station 4)
    {
      id: "road_se_turn_1",
      name: "90 Deg Turn North",
      start: { x: 370, y: 440 },
      end: { x: 370, y: 380 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    {
      id: "road_se_turn_2",
      name: "90 Deg Turn East",
      start: { x: 370, y: 380 },
      end: { x: 430, y: 380 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    {
      id: "road_se_turn_3",
      name: "90 Deg Turn North Connector",
      start: { x: 430, y: 380 },
      end: { x: 430, y: 340 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    // 3. East Straight & Slalom (Stations 5, 6, 7)
    {
      id: "road_east_straight",
      name: "East Straight (Slalom & Parallel)",
      start: { x: 520, y: 340 },
      end: { x: 520, y: 75 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    // 4. North Straight (Stations 8, 9, 10)
    {
      id: "road_north_straight",
      name: "North Straight (Railway & Garage)",
      start: { x: 520, y: 75 },
      end: { x: 80, y: 75 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    // 5. West Straight (Stations 11, 12)
    {
      id: "road_west_straight",
      name: "West Straight (Braking & Finish)",
      start: { x: 80, y: 75 },
      end: { x: 80, y: 440 },
      width: 35,
      hasCenterline: true,
      hasCurbs: true,
      hasYellowSensors: true,
    },
    // 6. Central Infield Connector Road
    {
      id: "road_center_connector",
      name: "Central Connector Road",
      start: { x: 240, y: 75 },
      end: { x: 240, y: 440 },
      width: 28,
      hasCenterline: true,
      hasCurbs: false,
      hasYellowSensors: true,
    },
  ],

  // Boundaries & Lawn Islands
  boundaries: [
    // Outer Arena Perimeter Walls
    {
      id: "arena_outer_wall",
      type: "perimeter",
      x: 20,
      y: 20,
      width: 560,
      height: 460,
      borderRadius: 16,
      strokeColor: "#1e293b",
    },
    // West Infield Grass Lawn Island
    {
      id: "lawn_island_west",
      type: "island",
      x: 110,
      y: 110,
      width: 105,
      height: 290,
      borderRadius: 12,
      fillColor: "#0f291e",
      strokeColor: "#166534",
    },
    // East Infield Grass Lawn Island
    {
      id: "lawn_island_east",
      type: "island",
      x: 275,
      y: 110,
      width: 210,
      height: 290,
      borderRadius: 12,
      fillColor: "#0f291e",
      strokeColor: "#166534",
    },
  ],

  // Special Dedicated Exercise Zones
  zones: [
    {
      id: "zone_start",
      type: "start_box",
      bounds: { minX: 40, maxX: 120, minY: 420, maxY: 460 },
      title: { uzl: "Start", uzc: "Старт", ru: "Старт" },
    },
    {
      id: "zone_pedestrian",
      type: "pedestrian_crossing",
      bounds: { minX: 140, maxX: 210, minY: 420, maxY: 460 },
      title: { uzl: "Piyodalar o'tish joyi", uzc: "Пиёдалар ўтиш жойи", ru: "Пешеходный переход" },
    },
    {
      id: "zone_estakada",
      type: "estakada_ramp",
      bounds: { minX: 250, maxX: 350, minY: 420, maxY: 460 },
      inclinePercent: 16,
      title: { uzl: "Estakada (16%)", uzc: "Эстакада (16%)", ru: "Эстакада (16%)" },
    },
    {
      id: "zone_turns_90",
      type: "turns_90",
      bounds: { minX: 350, maxX: 450, minY: 360, maxY: 460 },
      title: { uzl: "90° burilishlar", uzc: "90° бурилишлар", ru: "Повороты 90°" },
    },
    {
      id: "zone_turnaround",
      type: "turnaround",
      bounds: { minX: 410, maxX: 470, minY: 310, maxY: 370 },
      title: { uzl: "Qaytish joyi", uzc: "Қайтиш жойи", ru: "Разворот" },
    },
    {
      id: "zone_zmeyka",
      type: "zmeyka_slalom",
      bounds: { minX: 480, maxX: 540, minY: 180, maxY: 310 },
      title: { uzl: "Ilon izi (Zmeyka)", uzc: "Илон изи (Змейка)", ru: "Змейка" },
    },
    {
      id: "zone_parallel_parking",
      type: "parallel_parking",
      bounds: { minX: 490, maxX: 550, minY: 80, maxY: 170 },
      title: { uzl: "Parallel parkovka", uzc: "Параллел парковка", ru: "Параллельная парковка" },
    },
    {
      id: "zone_railway",
      type: "railway_crossing",
      bounds: { minX: 430, maxX: 500, minY: 55, maxY: 95 },
      title: { uzl: "Temir yo'l kechuvi", uzc: "Темир йўл кечуви", ru: "Ж/Д переезд" },
    },
    {
      id: "zone_tight_turnaround",
      type: "tight_turnaround",
      bounds: { minX: 310, maxX: 370, minY: 55, maxY: 120 },
      title: { uzl: "Tor joyda qayrilib olish", uzc: "Тор жойда қайрилиб олиш", ru: "Разворот в узком месте" },
    },
    {
      id: "zone_garage",
      type: "garage_box",
      bounds: { minX: 180, maxX: 240, minY: 55, maxY: 150 },
      title: { uzl: "Garajga orqaga kirish", uzc: "Гаражга орқага кириш", ru: "Въезд в бокс задним ходом" },
    },
    {
      id: "zone_speed_braking",
      type: "speed_braking",
      bounds: { minX: 60, maxX: 100, minY: 120, maxY: 280 },
      title: { uzl: "Favqulodda tormozlanish", uzc: "Фавқулодда тормозланиш", ru: "Экстренное торможение" },
    },
    {
      id: "zone_finish",
      type: "finish_box",
      bounds: { minX: 60, maxX: 100, minY: 370, maxY: 440 },
      title: { uzl: "Finish", uzc: "Финиш", ru: "Финиш" },
    },
  ],

  // Road Signs
  signs: [
    { id: "sign_pedestrian", type: "pedestrian", position: { x: 140, y: 458 }, rotation: 0 },
    { id: "sign_estakada_stop", type: "stop", position: { x: 290, y: 458 }, rotation: 0 },
    { id: "sign_railway", type: "railway", position: { x: 445, y: 56 }, rotation: Math.PI },
    { id: "sign_speed_30", type: "speed_30", position: { x: 62, y: 140 }, rotation: Math.PI / 2 },
    { id: "sign_finish_stop", type: "stop", position: { x: 62, y: 430 }, rotation: Math.PI / 2 },
  ],

  // Traffic Lights
  trafficLights: [
    { id: "tl_pedestrian", position: { x: 140, y: 458 }, targetRoad: { x: 150, y: 440 } },
    { id: "tl_railway", position: { x: 445, y: 56 }, targetRoad: { x: 450, y: 75 } },
  ],

  // 12 Uzbekistan YPX Exercises with exact coordinates
  exercises: EXERCISE_REGISTRY,
};
