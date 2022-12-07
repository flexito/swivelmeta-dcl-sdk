## SDK Library

This project is currently UNDER DEVELOPMENT!!!

# Swivel Meta Decentraland SDK Documentation

Swivel Meta Decentraland SDK includes helpful solutions for speeding up the process for creating scenes in Decentraland.

## Install

To use any of the helpers provided by this library:

1. Install it as an npm package. Run this command in your scene's project folder:

   ```
   npm install npm i swivelmeta-dcl-sdk
   ```

2. Add this line at the start of your game.ts file, or any other TypeScript files that require it:

   ```ts
   import * as sm from "swivelmeta-dcl-sdk";
   ```

## Usage

### < use case 1 >

To do `dynamically change media`, add the `DynamicMedia` entity to your scene.

DynamicMedia requires three arguments when being constructed:

- `media`: either a Texture or VideoClip
- `shape`: shape of the dynamic media, works best with PlaneShape
- `transform`: the position, rotation, scale of the media

DynamicMedia can optionally also take the following argument:

- `name`: name of the entity. If not provided, the default value is `undefined`

This example uses DynamicMedia to `display a stream`:

```ts
import * as sm from "swivelmeta-dcl-sdk"

// Create entity, passing a VideoClip, a shape, transform, and a name
const mediaEntity = new DynamicMedia(
   new VideoClip("https://player.vimeo.com/external/552481870.m3u8?s=c312c8533f97e808fccc92b0510b085c8122a875"),
   new PlaneShape(),
   new Transform(),
   "mediaEntity"
)

```

<!-- > Note: Be aware that if < other use case >, MyAmazingComponent will < do some other thing >. -->

### < use case 2 > 

... Todo ...

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
