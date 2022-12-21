import { buy } from './components/index';
import * as ui from '@dcl/ui-scene-utils'
import * as mfetch from './components/fetch'
import * as colors from "./resources/colors"
import * as models from "./resources/models";
import * as eth from "eth-connect";
import * as utils from '@dcl/ecs-scene-utils'
import { SkinWearable } from "./skinWearable";
import { getUserData, UserData } from "@decentraland/Identity"



const testNetwork = false; // currently does not work
let user: UserData | null;
executeTask(async () => {
    // get the player data
    user = await getUserData();
    // log("user: ", user);
})

// create a tag for the wearables
@Component("Wearable")
export class Wearable {}


const wearableModelTransform = new Transform({
  // position: new Vector3(13, 0, 4),
  position: new Vector3(0, -0.88, -0.1),
  // scale: new Vector3(0, 0, 0)
})
let skin = new SkinWearable(
  models.TrekkerGod,
  wearableModelTransform
);



export let players: { userId: string }[] = [];


enum WearableBodyShape {
    MALE = 'urn:decentraland:off-chain:base-avatars:BaseMale',
    FEMALE = 'urn:decentraland:off-chain:base-avatars:BaseFemale'
  }
  
  
  /**
  //  * TODO: Use nftAddress and assetId to get the wearable data from the server
   * 
  //  * TODO: Add BUY button which initiates the buy functionality
   * 
  //  * TODO: Add PREVIEW button which initiates the Avatar Swap so users can preview the wearable
   * 
   * TODO IF TIME ALLOWS: Ability to swap the wearable in real time between collections using arrow icons or keys
   * 
   */
  
  export class wearableAvatar extends Entity {
    transform: TranformConstructorArgs;
    avatar: Entity;

    wearableData: any
    network: any;
    wearableCollection: any;

    buyButton: Entity;
    buyButtonText: TextShape;
    buyButtonTextRoot: Entity;
    previewButton: Entity;
    previewButtonText: TextShape;
    previewButtonTextRoot: Entity;

    hideAvatarEntity: Entity;
    wearableModel: GLTFShape | SkinWearable;

  
    constructor(
        transform: TranformConstructorArgs,
        wearableCollection: string,
        wearableModel: GLTFShape,
        network: "matic" | "eth" = "matic",
        hideTry: boolean = false,
        hideBuy: boolean = false,
    ) {
        super();
        // add a tag to the class
        this.addComponent(new Wearable)
        this.addComponent(models.wearablePlatform)
        this.addComponent(new Animator());
        this.getComponent(Animator).addClip(
            new AnimationState('Platform_Idle', { looping: true })
        );
        this.getComponent(Animator).getClip('Platform_Idle').play()
        engine.addEntity(this)
        
        const parent = new Entity()
        engine.addEntity(parent)
        parent.setParent(this)

        this.transform = transform;
        this.network = network;
        this.wearableModel = wearableModel;
        this.wearableCollection = wearableCollection;


        this.addComponent(new Transform(this.transform));
        
        // this.getWearableData();



        //** -- AVATAR SHAPE -- **/
        this.avatar = new Entity("avatar")
        this.avatar.addComponent(wearableModel)
        this.avatar.addComponent(new Transform({
            position: new Vector3(0, .25, 0),
            rotation: Quaternion.Euler(0, 0, 0),
            scale: new Vector3(1, 1, 1)
        }))
        this.avatar.setParent(parent)
        
        

        //** -- BUY BUTTON -- **/
        this.buyButton = new Entity("buyButton")
        this.buyButton.addComponent(new Transform({
            position: new Vector3(-.5, 1, 0),
            rotation: Quaternion.Euler(0, 180, 0),
            scale: new Vector3(1, 1, 1),
        }))
        this.buyButton.addComponent(models.buyButtonShape)
        
        // Animation Setup
        this.buyButton.addComponent(new Animator());
        this.buyButton.getComponent(Animator).addClip(new AnimationState('button_idle', { looping: true }));
        this.buyButton.getComponent(Animator).getClip('button_idle').play();
        
        if ( !hideTry ) {
          this.buyButton.setParent(parent);
        }

        this.buyButtonTextRoot = new Entity("buyButtonTextRoo");
        this.buyButtonText = new TextShape();

        this.buyButtonText.color = Color3.FromHexString("#FFFFFF");
        this.buyButtonText.color = Color3.FromHexString("#FFB626");
        this.buyButtonText.font = new Font(Fonts.SanFrancisco_Heavy);
        this.buyButtonText.hTextAlign = "center";

        this.buyButtonTextRoot.addComponent(this.buyButtonText);
        this.buyButtonTextRoot.addComponent(
          new Transform({
              position: new Vector3(
                0, 
                0.0, 
                // -0.05
              ),
              scale: new Vector3(0.1, 0.1, 0.1),
          })
        );

        this.buyButtonTextRoot.setParent(this.buyButton);
        this.buyButtonText.value = "BUY";


        
        //** -- PREVIEW BUTTON -- **/
        this.previewButton = new Entity("previewButton");
        this.previewButton.addComponent(new Transform({
            position: new Vector3(.5, 1, 0),
            rotation: Quaternion.Euler(0, 180, 0),
            scale: new Vector3(1, 1, 1),
        }));
        this.previewButton.addComponent(models.buyButtonShape);
        
        // Animation Setup
        this.previewButton.addComponent(new Animator());
        this.previewButton.getComponent(Animator).addClip(new AnimationState('button_idle', { looping: true }));
        this.previewButton.getComponent(Animator).getClip('button_idle').play();
        
        if ( !hideTry ) {
          this.previewButton.setParent(parent);
        }

        this.previewButtonTextRoot = new Entity("previewButtonTextRoot");
        this.previewButtonText = new TextShape();

        this.previewButtonText.color = Color3.FromHexString("#FFFFFF");
        this.previewButtonText.color = Color3.FromHexString("#FFB626"); 
        this.previewButtonText.font = new Font(Fonts.SanFrancisco_Heavy);
        this.previewButtonText.hTextAlign = "center";

        this.previewButtonTextRoot.addComponent(this.previewButtonText);
        this.previewButtonTextRoot.addComponent(
        new Transform({
            position: new Vector3(0, 0.0,
                // -0.05
            ),
            scale: new Vector3(0.1, 0.1, 0.1),
        })
        );

        this.previewButtonTextRoot.setParent(this.previewButton);
        this.previewButtonText.value = "TRY";



        //**  -- HIDE AVATAR ENTITY -- **/
        let offsetX = 0; let offsetY = 2; let offsetZ = 0;
        let offsetPos = new Vector3(offsetX, offsetY, offsetZ);
        
        let hideParent = new Entity();
        this.hideAvatarEntity = new Entity("hideAvatarEntity");
        this.hideAvatarEntity.setParent(hideParent);
        if (this.hideAvatarEntity.isAddedToEngine()) {
            engine.removeEntity(this.hideAvatarEntity);
        }
        this.hideAvatarEntity.addComponent(new Transform({
          position: new Vector3(
            this.transform.position?.x == undefined ? offsetPos.x : (this.transform.position.x + offsetPos.x), 
            this.transform.position?.y == undefined ? offsetPos.y : (this.transform.position.y + offsetPos.y), 
            this.transform.position?.z == undefined ? offsetPos.z : (this.transform.position.z + offsetPos.z),
          ),
          rotation: this.transform.rotation,
        }));

        
        
        //**  -- AVATAR MODIFIER AREA COMPONENT -- **//
        this.hideAvatarEntity.addComponentOrReplace(
          new AvatarModifierArea({
              area: { box: new Vector3(8, 3, 8) },
              modifiers: [AvatarModifiers.HIDE_AVATARS],
              excludeIds: []
          })
        );
        //**  -- AVATAR MODIFIER AREA COMPONENT -- **//


        
        //**  -- TRIGGER COMPONENT -- **//
        // Create to show avatar trigger
        this.hideAvatarEntity.addComponent(
          new utils.TriggerComponent(
            new utils.TriggerBoxShape(new Vector3(8, 3, 8), Vector3.Zero()),
            {
              onCameraEnter: () => {
                
              },
              onCameraExit: () => {
                if(this.getComponent(utils.ToggleComponent).isOn()) {
                this.getComponent(utils.ToggleComponent).toggle();
                }
              }, 
              // enableDebug: true
            }
          )
        )
        //**  -- END TRIGGER COMPONENT -- **//
        


        //**  -- TOGGLE STATE -- **//
        this.addComponent(
          new utils.ToggleComponent(utils.ToggleState.Off, value => {
            if (value == utils.ToggleState.On) {
                //set color to green
                engine.addEntity(this.hideAvatarEntity);
                engine.addEntity(skin);
                engine.removeEntity(this.previewButton);
                skin.getComponent(Transform).scale.setAll(1)
                skin.setParent(Attachable.AVATAR);
                
                // engine.removeEntity(this.avatar);

            } else {
                skin.getComponent(Transform).scale.setAll(0)
                skin.setParent(null);
                engine.removeEntity(this.hideAvatarEntity)
                engine.removeEntity(skin)
                engine.addEntity(this.previewButton);

                // engine.addEntity(this.avatar);
            }
          }))
          //**  -- END TOGGLE STATE -- **//

          this.getWearableData();


    }
    
    
    //* -- FUNCTIONS -- */ 
    async getWearableData(){
      log("Getting Wearable Data...")
        this.wearableData = await mfetch.collection(this.wearableCollection, this.network, testNetwork)

        let _collection = this.wearableData
        let _item = _collection.items[0]
        let _metadata = _item.metadata
        
        
        // -- BUY BUTTON
        if (_item.available > 1){
            this.buyButton.addComponentOrReplace(
                new OnPointerDown(
                 () => {
                    this.infoPrompt(this.wearableData);
                },
                {
                    button: ActionButton.SECONDARY,
                    hoverText: "BUY WEARABLE",
                }
                )
            );

        } else {
            this.buyButton.addComponentOrReplace(
                new OnPointerDown( () => {}, {
                    button: ActionButton.PRIMARY,
                    hoverText: "OUT OF STOCK",
                })
            );
        }



        // -- PREVIEW BUTTON
        this.previewButton.addComponentOrReplace(
            new OnPointerDown(
                async () => {
                  
                    if(user === null){
                        
                        user = await getUserData();
                        // log("user: ", user);
                        
                    }else {

                        let excludeIds = this.hideAvatarEntity.getComponent(AvatarModifierArea).excludeIds;

                        // loop through the players in the scene and add them to the list of excludeIds
                        players.forEach(player => {
                            if (excludeIds?.filter(userId => userId === player.userId).length === 0) {
                                excludeIds?.push(player.userId);

                            } else {
                                // excludeIds?.push(player.userId); 
                            }

                        });

                        // get the current player index in the list of excludeIds
                        let indexOfObj = excludeIds?.filter(userId => userId === user?.userId)
                        
                        // check if indexOfObj is undefined, if it is then make and empty array else make an array with the indexOfObj
                        indexOfObj = indexOfObj === undefined ? [] : indexOfObj;
                        // log("indexOfObj: ", indexOfObj[0])
                        // log("index: ", excludeIds?.indexOf(indexOfObj[0]))

                        // Check if the excludeIds array has the current player's userId, if it does then remove it from the array
                        if (excludeIds?.indexOf(indexOfObj[0]) !== -1) {
                            excludeIds?.splice(players.indexOf({"userId": indexOfObj[0]}), 1);
                            // log("excludeIds: ", excludeIds)
                        }
                    }


                  
                  this.avatarSwap();
                  // log("try");
                },
                {
                    button: ActionButton.SECONDARY,
                    hoverText: "TRY WEARABLE",
                    // distance: 6
        }));

        log("Wearable Avatar Setup Complete!")


    }
    
    avatarSwap() {
        // log("avatarSwap")
        engine.getComponentGroup(Wearable).entities.forEach(entity => {
            if (entity.uuid !== this.uuid) {
                if ( entity.getComponent(utils.ToggleComponent).isOn() ) {
                    // log(entity.uuid);
                    entity.getComponent(utils.ToggleComponent).toggle();
                }
            }
        });
   
        skin.addComponentOrReplace(this.wearableModel);
        // log("model: ",skin.getComponent(GLTFShape).src)
        this.getComponent(utils.ToggleComponent).toggle()
    }


    infoPrompt(wearableData: any){
        let _collection = wearableData
        let _item = _collection.items[0]
        let _metadata = _item.metadata
        let _owner = _collection.owner;



        let ownerShort = `${_owner.substring(0, 5).concat('....')}${_owner.slice(-4)}`
        let thumbnail = new Texture(_item.image);
        // log("icon: ", thumbnail);
        // log("image: ",_item.image)
        

        let prompt = new ui.CustomPrompt(ui.PromptStyles.DARK, 400, 600)
        prompt.name = "wearableInfoPrompt";


        // -- TEXT
        let tRarity = prompt.addText(`${_item.rarity.toUpperCase()}`, 0, 275); 
        tRarity.text.font = ui.SFHeavyFont; 
        
        let tName = prompt.addText(`${_metadata.wearable.name.toUpperCase()}`, 0, 255);
        
        let tOwner = prompt.addText(`OWNER \n${ownerShort}`, -125, -50); 
        tOwner.text.hTextAlign = "left"; 
        tOwner.text.color = Color4.Gray();
        
        let tCollection = prompt.addText(`COLLECTION \n${_collection.name.toUpperCase()}`, -125, -100); 
        tCollection.text.hTextAlign = "left"; 
        tCollection.text.color = Color4.Gray();
        
        let tAvailable = prompt.addText(`AVAILABLE: ${_item.available}/${_item.maxSupply}`, 0, -145); 
        tAvailable.text.hTextAlign = "center"; 
        tAvailable.text.color = Color4.Black(); 
        tAvailable.text.font = ui.SFHeavyFont;
        
        let tPrice = prompt.addText(`PRICE: ${eth.fromWei(_item.price, "ether")} MANA`, 0, -180); 
        tPrice.text.hTextAlign = "center"; 
        tPrice.text.color = Color4.Red(); 
        tPrice.text.font = ui.SFHeavyFont; 
        tPrice.text.fontSize = 25;
        
        
        log("price fromWei: ",eth.fromWei(_item.price, "ether"))

        
        switch (_item.rarity) {
            case "common": {
              tRarity.text.color = colors.commonColor.toColor4(1);
              break;
            }
            case "uncommon": {
              tRarity.text.color = colors.uncommonColor.toColor4(1);
              break;
            }
            case "rare": {
              tRarity.text.color = colors.rareColor.toColor4(1);
              break;
            }
            case "epic": {
              tRarity.text.color = colors.epicColor.toColor4(1);
              break;
            }
            case "legendary": {
              tRarity.text.color = colors.legendaryColor.toColor4(1);
              break;
            }
            case "mythic": {
              tRarity.text.color = colors.mythicColor.toColor4(1);
              break;
            }
            case "unique": {
              tRarity.text.color = colors.uniqueColor.toColor4(1);
              break;
            }
        }
        

        // -- ICON
        let icon = prompt.addIcon(_item.image, 0, 100, 256, 256, {sourceWidth: 512, sourceHeight: 512, sourceLeft: 0, sourceTop: 0}); 
        icon.image.sizeInPixels = true;
        icon.image.hAlign = "center";
        icon.image.vAlign = "center";

        // -- BUTTONS
        let bBuy = prompt.addButton(
            'Buy',
            100,
            -250,
            () => {
              log('Buy button clicked');
              buy(_collection.id, _item.blockchainId, _item.price);
              prompt.hide()
            },
            ui.ButtonStyles.E
          )
          
          let bCancel = prompt.addButton(
            'Cancel',
            -100,
            -250,
            () => {
              log('Cancel button clicked');
              prompt.hide()
            },
            ui.ButtonStyles.F
          )


    }
    
  }

    
// Check if player is moving
const currentPosition = new Vector3()

class CheckPlayerIsMovingSystem implements ISystem {
  update() {
    if (currentPosition.equals(Camera.instance.feetPosition)) {
      skin.playIdle()
    } else {
      currentPosition.copyFrom(Camera.instance.feetPosition)
      skin.playRunning()
    }
  }
}
engine.addSystem(new CheckPlayerIsMovingSystem())
