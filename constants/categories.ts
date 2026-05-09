export const CATEGORIES = ["Food", "Items", "Tips"] as const;
export type Category = (typeof CATEGORIES)[number];
