// This file exists solely for TypeScript path resolution.
// At runtime, Metro bundler automatically resolves:
//   MapPicker.native.tsx  →  iOS & Android
//   MapPicker.web.tsx     →  Web
// TypeScript uses this file for type-checking only.
export { default, MapPreview, MapThumbnail } from "./MapPicker.web";
export type { Coord } from "./MapPicker.web";

