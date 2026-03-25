/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface BodyMeasurements {
  height?: string;
  weight?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  bodyType?: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

export interface SavedOutfit {
  id: string;
  name: string;
  layers: OutfitLayer[];
  thumbnailUrl: string;
  createdAt: number;
}
