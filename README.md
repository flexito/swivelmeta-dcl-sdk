# SwivelMeta Decentraland SDK Library

### This project is currently UNDER DEVELOPMENT!!!

# SwivelMeta Decentraland SDK Documentation

SwivelMeta Decentraland SDK includes helpful solutions for speeding up the process for creating scenes in Decentraland.


## Install

To use any of the helpers provided by this library:

1. Install it as an npm package. Run this command in your scene's project folder:

   ```
   npm install npm i swivelmeta-dcl-sdk
   ```

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Add this line at the start of your `game.ts` file, or any other TypeScript files that require it:

```ts
import {
   SwivelMetaServices,
   DynamicMedia, 
   debugMessage, 
   setTimeout, 
   setUVsBasic, 
   setCustomUVs, 
   setBoxUVs 
} from "swivelmeta-dcl-sdk"

const projectId = "Your Project ID Here" // Example: "SM-DCL-3891"
const bInitDiscord = false; // initialize discord callback
const bLoadOnEnter = true; // load media on entering the scene

SMService = new SwivelMetaServices(projectId, false, bInitDiscord, bLoadOnEnter)
```

4. In your TypeScript file, write `sm.` and let the suggestions of your IDE show the available helpers.


## DynamicMedia

### Usages

Allows you to `dynamically change media`, add the `DynamicMedia` entity to your scene.

DynamicMedia requires three arguments when being constructed:

- `media`: either a Texture or VideoClip
- `shape`: shape of the dynamic media, works best with PlaneShape
- `transform`: the position, rotation, scale of the media

DynamicMedia can optionally also take the following argument:

- `name`: name of the entity. If not provided, the default value is `undefined`

This example uses DynamicMedia to `display a stream`:

```ts
import {
    SwivelMetaServices,
    DynamicMedia, 
    debugMessage, 
    setTimeout, 
    setUVsBasic, 
    setCustomUVs, 
    setBoxUVs 
} from "swivelmeta-dcl-sdk"


// Create entity, passing a VideoClip, a shape, transform, and a name
const mediaEntity = new DynamicMedia(
   new VideoClip("https://player.vimeo.com/external/552481870.m3u8?s=c312c8533f97e808fccc92b0510b085c8122a875"),
   new PlaneShape(),
   new Transform(),
   "mediaEntity"
)

/** 
 * An array of objects that contain the component name and the entity to update
 * @param {string} component - name of the component to pull data from
 * @param {Entity} object - entity to update
*/
const compEntityPairs =   [
  { component: "metaTrekkersVideo", object: FisrtFloorVideo },
  { component: "infoPanel", object: infoPanel },
  { component: "bEnablePoapClaim", object: bEnablePoapClaim },
  { component: "dynamicMedia2", object: dynamicMediaEntity2 },
]

SMService.updateMediaOnSceneLoad(compEntityPairs)
SMService.updateMediaOnSceneEnter(compEntityPairs)
```

<!-- > Note: Be aware that if < other use case >, MyAmazingComponent will < do some other thing >. -->

## SwivelMeta Services

Allows you to `use SwivelMeta services` in your scene. A class with a suite of functions to interact with the Swivel Meta API. Which includes:

- Dynamically changing media in your scene using data from the Swivel Meta API.
- Sending Discord messages to a channel using data captured from your scene.
- Capturing data from your scene and sending it to the Swivel Meta Analytics API.
- and more to come...

### Usages

... Todo ...

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
