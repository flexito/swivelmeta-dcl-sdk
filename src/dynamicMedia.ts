import { setUVsBasic, ui } from "./utilsLib";
import { clamp } from '@dcl/ecs-scene-utils'
// import * as ui from '@dcl/ui-scene-utils'

/**
 * TODO: Need to convert VideoScreen class to a MediaEntity to handle different types of media, not just videoScreen
 * TODO: Types of media: video, images
 * TODO: Detect if media is a video or image
 * TODO: Media Controls: Play/Pause, Mute/Unmute, Volume, Fullscreen, Close
 */


/**
 * DynamicMedia will automatically detect whether the media is a video or image and will handle the media accordingly
 * 
 * @param media - Texture | VideoClip - URL of the media to be displayed
 * @param shape - The shape of the media to be displayed
 * @param transform - The position, rotation, and scale of the media to be displayed
 * @param name - The name of the Entity, mainly used for debugging
 * @returns Entity
 * @public
 */
export class DynamicMedia extends Entity {
    public material: Material = new Material();
    public shape: Shape;
    public texture?: Texture | VideoTexture;
    public video?: VideoClip;
    private mediaType?: "video" | "image"

    constructor(
        media: Texture | VideoClip, 
        shape: Shape, 
        transform: TransformConstructorArgs,
        name?:string
    ) {
        super();
        engine.addEntity(this)
        
        this.name = name
        this.shape = shape
        this.shape.withCollisions = true
        this.shape.isPointerBlocker = true
        this.addComponent(shape)
        this.addComponent(transform)

        // log("Initializing DynamicMedia :: ", this.name)
        
        if( this.shape instanceof PlaneShape ) {
            this.shape.uvs = setUVsBasic(1, 1)
        }


        // Check the type of media
        if (media instanceof VideoClip) {
            // log('DynamicMedia :: Check Media Type :: Video');
            this.video = media
            this.texture = new VideoTexture(this.video);
            // log('DynamicMedia :: this.texture :: ', this.texture);
            this.texture.loop = true
            this.texture.volume = .5
            this.texture.play()

            this.mediaType = "video"
            this.addPausePlayVideo( this.mediaType )
            // log( 'DynamicMedia :: addPausePlayVideo :: ', this.name, this.getComponentOrNull(OnPointerDown) );
    

            if( this.shape instanceof PlaneShape ) {
                this.shape.uvs = setUVsBasic(-1, 1)
            }
            
        }
        else if (media instanceof Texture) {
            // log('DynamicMedia :: Check Media Type :: Image');
            this.mediaType = "image"
            this.texture = media
        }
        
        // set material properties
        this.material.albedoTexture = this.texture
        this.material.roughness = 1
        this.material.specularIntensity = 0
        this.material.metallic = 0
        this.material.transparencyMode = 1
        this.material.emissiveTexture = this.texture
        this.material.emissiveColor = Color3.White()
        this.material.emissiveIntensity = .5

        this.addComponent(this.material)
            
    }

    public initialize() {

    }

    public updateMedia( media: Texture | VideoClip ) {
        // Check the type of media
        if (media instanceof VideoClip) {

            // check if current media is a video
            if (this.texture instanceof VideoTexture) {
                this.texture.playing = false
                this.texture = undefined;
            }

            // log('DynamicMedia :: Check Media Type :: Video');
            this.video = media
            this.texture = new VideoTexture(this.video);
            // log('DynamicMedia :: this.texture :: ', this.texture);
            this.texture.loop = true
            this.texture.volume = .5
            this.texture.play()

            this.mediaType = "video"
            this.addPausePlayVideo( this.mediaType )

            this.material.albedoTexture = this.texture
            this.material.emissiveTexture = this.texture

            if( this.shape instanceof PlaneShape ) {
                this.shape.uvs = setUVsBasic(-1, 1)
            }
            
        }

        else if (media instanceof Texture) {
            // check if current media is a video
            if (this.texture instanceof VideoTexture) {
                this.texture.playing = false
                this.texture = undefined;

                this.removeComponent( OnPointerDown )
            }
            
            if( this.shape instanceof PlaneShape ) {
                this.shape.uvs = setUVsBasic(1, 1)
            }
            // log('DynamicMedia :: Check Media Type :: Image');
            this.mediaType = "image"

            this.texture = media
            this.material.albedoTexture = this.texture
            this.material.emissiveTexture = this.texture

        }

    }

    public addPausePlayVideo( mediaType: "video" | "image" ) {

        if ( mediaType === "video" ) {

            // add onPointerDown event to the entity
            this.addComponentOrReplace(
                new OnPointerDown(() => {
                    if ( this.texture instanceof VideoTexture ) {
                        this.texture.playing = !this.texture.playing;
                        // log('DynamicMedia :: this.texture.playing :: ', this.texture.playing);
                    }
                }, {
                    button: ActionButton.PRIMARY,
                    hoverText: "Play/Pause Video",
                    distance: 7
                })
            );

            // log( 'DynamicMedia :: addPausePlayVideo :: ', this.name, this.getComponentOrNull(OnPointerDown) );

        }

    }

    public addUIPanel( info: infoData, image: Texture, imageSize: {Width: number, Height: number} ) {
        let uiPanel = new infoPanel(info, image, imageSize)
        this.addComponentOrReplace( uiPanel )
        // add onPointerDown event to the entity
        this.addComponentOrReplace( new OnPointerDown( () => {
            uiPanel.openUI()
            },
            {
                button: ActionButton.PRIMARY,
                hoverText: 'Open Info Panel',
                distance: 7
            }
        ))
    }

}




/**
 * A Component that allows you to add a UI Info Panel to an Entity
 * @public
 * @param info - The data to be displayed in the UI Info Panel
 * @param image - The image to be displayed in the UI Info Panel
 * @param imageSize - The size of the image to be displayed in the UI Info Panel
 */
export class infoPanel extends ObservableComponent {
    public uiPanel: ui.CustomPrompt = new ui.CustomPrompt();
    public image:Texture;
    public imageSize: {Width: number, Height: number};
    public info: infoData;
    constructor( info: infoData, image: Texture, imageSize: {Width: number, Height: number} ) {
        super()
        this.info = info
        this.image = image
        this.imageSize = imageSize
    }

    public openUI(): void {
        this.uiPanel.show()


        
        // Add title Text UI
        const title = this.uiPanel.addText(this.info.title, -240, 190, Color4.Black(), 20);
        title.text.hTextAlign = 'left';
        title.text.font = ui.SFFont;
        title.text.outlineColor = Color4.Black();
        title.text.outlineWidth = .2;

        // Add Owner Text UI
        const ownerTitle = this.uiPanel.addText(`OWNER`, 30, 140, Color4.Gray(), 13);
        ownerTitle.text.hTextAlign = 'left';
        const owner = this.uiPanel.addText(`${this.info.owner}`, 30, 120, Color4.Black(), 13);
        owner.text.hTextAlign = 'left';
        owner.text.font = ui.SFFont;
        owner.text.outlineColor = Color4.Black();
        owner.text.outlineWidth = .05;

        // Add icon to UI
        const iconW = this.imageSize.Width
        const iconH = this.imageSize.Height

        // clamp icon size to keep the ratio of the the image
        let ratio: number
        let clampW = clamp(iconW, 0, 250)
        let clampH = clamp(iconH, 0, 250)

        if (iconW > iconH) {
            ratio = iconH/iconW
            clampH *= ratio
        } else {
            ratio = iconW/iconH
            clampW *= ratio
        }

        const icon = this.uiPanel.addIcon(this.image.src, 35, 0, clampW, clampH, {sourceWidth: iconW, sourceHeight: iconH});
        icon.image.hAlign = 'left';

        // Add Description Text UI
        const desTitle = this.uiPanel.addText('DESCRIPTION', 30, 80, Color4.Gray(), 13);
        desTitle.text.hTextAlign = 'left';
        const description = this.uiPanel.addText(this.info.description, 30, 60, Color4.Black(), 13);
        description.text.hTextAlign = 'left';
        description.text.vTextAlign = 'top';
        description.text.paddingLeft = 200;
        description.text.width = 500;
        description.text.textWrapping = true;
        // description.text.adaptWidth = true;
        description.text.paddingTop = 35;
        description.text.font = ui.SFFont;
        description.text.outlineColor = Color4.Black();
        description.text.outlineWidth = .05;

        this.info.description.slice(0, 20)
        
        
        // Add LINK button to UI
        const link = this.info.link;
        const linkText = this.info.linkText;

        const linkButton = this.uiPanel.addButton(`${linkText}`, 200, -170, () => {
            this.uiPanel.hide()
            // log(`${link} clicked`)
            openExternalURL(`https://${link}`)
        }, ui.ButtonStyles.RED);
        linkButton.label.fontSize = 13;
        linkButton.label.font = ui.SFHeavyFont;

        // Add CANCEL button to UI
        const cancelButton = this.uiPanel.addButton("CANCEL", 0, -170, () => {
            this.uiPanel.hide()
            // log("cancel clicked")
        }, ui.ButtonStyles.ROUNDBLACK);
        cancelButton.label.fontSize = 13;
        cancelButton.label.font = ui.SFHeavyFont;
    }

}


/**
 * @public
 * @param title - The title to be displayed in the UI
 * @param owner - The owner, if there is an owner of the image / video
 * @param description - The description of the object this will be displayed in the UI
 * @param link - The link URL that will be opened when the link button is clicked
 * @param linkText - The text for the link button
 */
type infoData = {
    title: string;
    description: string; 
    owner?: string;
    link?: string;
    linkText?: string; 
}