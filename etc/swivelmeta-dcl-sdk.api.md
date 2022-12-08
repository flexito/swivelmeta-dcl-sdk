## API Report File for "swivelmeta-dcl-sdk"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="dcl" />

// @public
export function debugMessage(message: string): void;

// @public
export class DynamicMedia extends Entity {
    // Warning: (ae-forgotten-export) The symbol "MediaFile" needs to be exported by the entry point index.d.ts
    constructor(media: MediaFile, shape: Shape, transform: TransformConstructorArgs, name?: string);
    // (undocumented)
    addPausePlayVideo(mediaType: "video" | "image"): void;
    // Warning: (ae-forgotten-export) The symbol "infoData" needs to be exported by the entry point index.d.ts
    //
    // (undocumented)
    addUIPanel(info: infoData, image: Texture, imageSize: {
        Width: number;
        Height: number;
    }): void;
    // (undocumented)
    initialize(): void;
    // (undocumented)
    material: Material;
    // (undocumented)
    shape: Shape;
    // (undocumented)
    texture?: Texture | VideoTexture;
    // (undocumented)
    updateMedia(media: Texture | VideoClip): void;
    // (undocumented)
    video?: VideoClip;
}

// @public
export function setBoxUVs(rows: number, cols: number): number[];

// @public
export function setCustomUVs(rows: number, cols: number, offsetX?: number, offsetY?: number): number[];

// @public
export function setTimeout(delay: number, callback: () => void): void;

// @public
export function setUVsBasic(rows: number, cols: number): number[];

// (No @packageDocumentation comment for this package)

```