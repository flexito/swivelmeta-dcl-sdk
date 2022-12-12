# SwivelMeta Decentraland SDK Library

### This project is currently UNDER DEVELOPMENT!!!

# SwivelMeta Decentraland SDK Documentation

SwivelMeta Decentraland SDK includes helpful solutions for speeding up the process for creating scenes in Decentraland.


## Install

To use any of the helpers provided by this library:

1. Install it as an npm package. Run this command in your scene's project folder:

   ```
   dcl install swivelmeta-dcl-sdk
   ```

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Add this line at the start of your `game.ts` file, or any other TypeScript files that require it:

```ts
import * as sm from "node_modules/swivelmeta-dcl-sdk/dist/index"

const projectId = "Your Project ID Here" // Example: "SM-DCL-3891"
const bInitDiscord = false; // initialize discord callback
const bLoadOnEnter = true; // load media on entering the scene

SMService = new sm.SwivelMetaServices(projectId, false, bInitDiscord, bLoadOnEnter)
```

4. In your TypeScript file, write `sm.` and let the suggestions of your IDE show the available helpers.

5. Additionally you can add these lines at the start of your `game.ts` file. This will allow you to use the helpers without the `sm.` prefix:

```ts

import {
    SwivelMetaServices,
    DynamicMedia, 
    debugMessage, 
    setTimeout, 
    setUVsBasic, 
    setCustomUVs, 
    setBoxUVs 
} from "node_modules/swivelmeta-dcl-sdk/dist/index"

```

6. If you want to import using a shorter path you can add this to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "paths": {
      "swivelmeta-dcl-sdk": [
        "node_modules\\swivelmeta-dcl-sdk\\dist\\index.d.ts"
      ]
    }
  }
}
```

#### EXAMPLE:
```ts
import * as sm from "swivelmeta-dcl-sdk"
```

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
} from "node_modules/swivelmeta-dcl-sdk/dist/index"


// Create entity, passing a VideoClip, a shape, transform, and a name
const mediaEntity = new DynamicMedia(
   new VideoClip("https://player.vimeo.com/external/552481870.m3u8?s=c312c8533f97e808fccc92b0510b085c8122a875"),
   new PlaneShape(),
   new Transform(),
   "mediaEntity"
)

// Update the mediaEntity with a new VideoClip
mediaEntity.updateMedia(new VideoClip("https://player.vimeo.com/external/example-2.m3u8"))

// Update the mediaEntity with a new Texture
mediaEntity.updateMedia(new Texture("https://example.com/example-2.png"))
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
1. Dynamically change media in your scene when the scene loads.

```ts
import {
    SwivelMetaServices,
    DynamicMedia, 
    debugMessage, 
    setTimeout, 
    setUVsBasic, 
    setCustomUVs, 
    setBoxUVs 
} from "node_modules/swivelmeta-dcl-sdk/dist/index"


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

SMService = new SwivelMetaServices(projectId, false, bInitDiscord, bLoadOnEnter)

SMService.updateMediaOnSceneLoad(compEntityPairs)
```

2. Dynamically change media in your scene when a user enters the scene.

```ts
SMService = new SwivelMetaServices(projectId, false, bInitDiscord, bLoadOnEnter)

SMService.updateMediaOnSceneEnter(compEntityPairs)
```

3. Dynamically change media in your scene when the scene loads and when a user enters the scene. Useful when trying to refresh the scene without having to refresh the webpage.
   
```ts
SMService = new SwivelMetaServices(projectId, false, bInitDiscord, bLoadOnEnter)

SMService.updateMediaOnSceneLoad(compEntityPairs)
SMService.updateMediaOnSceneEnter(compEntityPairs)
```
## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.