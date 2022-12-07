import * as ui from '@dcl/ui-scene-utils'
import * as utils from '@dcl/ecs-scene-utils'

export { ui, utils }

export class EnableDisable {
    public bEnable: boolean;
    constructor( bEnable: boolean = true ) {
      this.bEnable = bEnable
    }
}

/**
 * Debug message displays a UI prompt with a message and a button to close it.
 * 
 * @param message - The message to be displayed in the UI prompt
 * @public
 */
export function debugMessage(message: string) {
    let prompt = new ui.OkPrompt(
        message,
        () => {
            log(`continue`)
        },
        'Continue',
        true
    );
    prompt.show();
}


/**
 * setTimeout is a function that allows you to delay the execution of a function, then removes the entity from the scene.
 * 
 * @param delay - The delay in milliseconds
 * @param callback - The callback function to be called after the delay is finished
 * @public
 */
export function setTimeout(delay: number, callback: () => void) {
    // create new entity
    const entity = new Entity();
    
    // add a timer component
    entity.addComponent(
        new utils.Delay(delay, () => {
            
            // when timer finishes call the callback function and destroy the entity
            callback();
            engine.removeEntity(entity);
        })
    )
}


/**
 * setUVsBasic is a function that allows you to set the UVs of a shape to a basic 0-1 UV space.
 * 
 * @param rows - The number of rows in the grid
 * @param cols - The number of columns in the grid
 * @returns - Returns an array of Vector2s that represent the UVs for a grid of rows and columns
 * @public
 */
export function setUVsBasic(rows: number, cols: number) {
    return [
      // North side of unrortated plane
      0, //lower-left corner
      0,
  
      cols, //lower-right corner
      0,
  
      cols, //upper-right corner
      rows,
  
      0, //upper left-corner
      rows,
  
      // South side of unrortated plane
      cols, // lower-right corner
      0,
  
      0, // lower-left corner
      0,
  
      0, // upper-left corner
      rows,
  
      cols, // upper-right corner
      rows,
    ]
}


/**
 * setCustomUVs is a function that allows you to set the UVs of a shape to a custom UV space with offsets.
 * 
 * @param rows - The number of rows in the grid
 * @param cols - The number of columns in the grid
 * @param offsetX - The offset the UVs in the X axis or the U axis
 * @param offsetY - The offset the UVs in the Y axis or the V axis
 * @returns - Returns an array of Vector2s that represent the UVs for a grid of rows and columns
 * @public
 */
export function setCustomUVs(rows: number, cols: number, offsetX?: number, offsetY?: number) {
    offsetX === undefined ? offsetX = 0 : offsetX;
    offsetY === undefined ? offsetY = 0 : offsetY = offsetY
    return [
        // North side of un-rotated plane
        0 + offsetX, //lower-left corner
        0 + offsetY,

        cols + offsetX, //lower-right corner
        0 + offsetY,

        cols + offsetX, //upper-right corner
        rows + offsetY,

        0 + offsetX, //upper left-corner
        rows + offsetY,

        // South side of un-rotated plane
        cols + offsetX, // lower-right corner
        0 + offsetY,

        0 + offsetX, // lower-left corner
        0 + offsetY,

        0 + offsetX, // upper-left corner
        rows + offsetY,

        cols + offsetX, // upper-right corner
        rows + offsetY,
    ]
}


/**
 * setBoxUVs is a function that allows you to set the UVs of a BoxShape, works with Atlas textures.
 * 
 * @param rows - The number of rows in the grid or Atlas texture
 * @param cols - The number of columns in the grid or Atlas texture
 * @returns - Returns an array of Vector2s that represent the UVs for a grid of rows and columns
 * @public
 */
export function setBoxUVs(rows: number, cols: number) {
    return [
// Top side of un-rotated box
        0, //lower-left corner
        0,

        cols, //lower-right corner
        0,

        cols, //upper-right corner
        rows,

        0, //upper left-corner
        rows,

// Bottom side of un-rotated box
        cols, // lower-right corner
        0,

        0, // lower-left corner
        0,

        0, // upper-left corner
        rows,

        cols, // upper-right corner
        rows,
        
// East side of un-rotated box
        0, // lower-left corner
        0,
        
        cols, // lower-right corner
        0,
        
        cols, // upper-right corner
        rows,
        
        0, // upper-left corner
        rows,
        
// West side of un-rotated box
        cols, // lower-right corner
        0,
        
        0, // lower-left corner
        0,
        
        0, // upper-left corner
        rows,
        
        cols, // upper-right corner
        rows,
        
// South side of un-rotated box
        cols, // lower-right corner
        0,

        0, // lower-left corner
        0,

        0, // upper-left corner
        rows,

        cols, // upper-right corner
        rows,

// North side of un-rotated box
        0, // lower-left corner
        0,

        cols, // lower-right corner
        0,

        cols, // upper-right corner
        rows,

        0, // upper-left corner
        rows,
        
    ]
}