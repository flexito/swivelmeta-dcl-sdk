import { movePlayerTo } from "@decentraland/RestrictedActions";
import * as tokenGate from "./tokenGate";

// create class Teleporter and add functionality to teleport/move to another room
/**
 * Class used create a teleporter entity
 * that adds functionality to teleport/move a player to another location.
 * @public
 */
export class Teleporter extends Entity {
    public transform: TransformConstructorArgs
    public telePosition: Vector3
    public model?: GLTFShape
    public shape?: Shape
    public material?: Material
    public isTokenGated?: boolean = false
    public hoverText?: string = null

    // Allow each teleporter to look different
    constructor(
        /** 
        * @public
        * Transform: position, rotation, scale to be used for the teleporter.
        */
        transform: TransformConstructorArgs,
        /** 
        * @public
        * Position to be used for the teleporter.
        */
        telePosition: Vector3,
        /**
         * @public
         * Optional: Model to be used for the teleporter
         */
        model?: GLTFShape,
         /**
         * @public
         * Optional: Shape to be used for the teleporter
         */
        shape?: Shape,
         /**
         * @public
         * Optional: Material to be used for the teleporter.
         */
        material?: Material,
        /**
         * @public
         * Optional: Is this teleporter token gated? If so, it will be locked until player has collected the token.
         */
        isTokenGated?: boolean,
        /**
         * @public
         * Optional: The text to be displayed when the player hovers over the teleporter.
         */
        hoverText?: string
    )
    {
        super();
        engine.addEntity(this); // add the teleporter to the engine
        
        if (model) {
            this.addComponentOrReplace(model); // add the model to the teleporter
        }
        if (shape) {
            this.addComponentOrReplace(shape); // add the shape to the teleporter
            this.addComponentOrReplace(material); // add the material to the teleporter
        }
        this.addComponent(transform); // add the transform to the teleporter
        // this.addComponent(tokenGate.confirmSound); // add the confirm sound to the teleporter
        // this.addComponentOrReplace(tokenGate.errorSound); // add the deny sound to the teleporter


        // check if hover text is provided
        if (hoverText)
        {

            this.hoverText = hoverText // set the hover text to the teleporter
        
        }else if (!(hoverText) && isTokenGated) // if the teleporter is token gated and no hover text is provided, set the hover text to a default message
        {

            hoverText = "Enter VIP Room?"; // if the teleporter is token gated, set the hover text to "Enter VIP Room?"

        }else{

            hoverText = "Teleport"; // default hover text

        }

        if(isTokenGated){
            this.addComponent(
                new OnPointerDown(
                  () => {
                      log("Teleporter is token gated. Checking if player has token...");
                    tokenGate.checkTokens(telePosition, this);
                  },
                  {
                      button: ActionButton.SECONDARY,
                      hoverText: hoverText,
                      distance: 5
                  }
              )
              )
        }else{
            this.addComponent(
                new OnPointerDown(
                    () => {
                        movePlayerTo(telePosition) // move the player to the teleport position
                    },{
                        button: ActionButton.SECONDARY, // button to be used for the teleport
                        hoverText: hoverText, // text to be displayed when the player hovers over the teleporter
                    }))
                }
    }
}
    