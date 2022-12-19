import { clamp } from '@dcl/ecs-scene-utils'
import * as ui from '@dcl/ui-scene-utils'

export type infoData = {
    title?: string, 
    description?: string, 
    link?: string, 
    linkText?: string, 
    owner?: string 
}


export class ThumbnailClick extends Entity{
    public material:Material
    public planeShape:PlaneShape
    public image:Texture
    public imageSize: {Width: number, Height: number}
    public info?: infoData
    public uiPanel: ui.CustomPrompt


    constructor(_image:Texture, _transform:TransformConstructorArgs, _alphaImage?:Texture, info?: infoData){
        super()        

        this.planeShape = new PlaneShape()
        this.planeShape.withCollisions = false
        this.planeShape.isPointerBlocker = true
        this.material = new Material()
        this.material.albedoTexture = _image
        this.material.specularIntensity = 0
        this.material.metallic = 0
        this.material.roughness = 1
        this.image = _image
        this.material.transparencyMode = 1

        if(_alphaImage)
            this.material.alphaTexture = _alphaImage

        //UV flip
        this.planeShape.uvs = [
            0,0,          
            1,0,          
            1,1,          
            0,1,
          //----
            1,0,          
            0,0,
            0,1,
            1,1,
        ]
        
        this.addComponent(this.planeShape)
        this.addComponent(this.material)
        this.addComponent(new Transform(
        {
            position: (_transform.position?.clone()) || Vector3.Zero(),
            rotation: (_transform.rotation?.clone()) || Quaternion.Zero(),
            scale: _transform.scale?.clone() || Vector3.One(),
        }
        ))

        if( info !== undefined ) 
        {
            this.info = info;
            
            this.addComponent( new OnPointerDown( () => {
                log('click')
                this.openUI()
                },
                {
                    button: ActionButton.PRIMARY,
                    hoverText: 'Open Image info',
                    distance: 7
                } )
            )
        }

        // this.addComponent( new OnPointerDown( () => {
        //     log('click')
        //     this.openUI()
        //     },
        //     {
        //         button: ActionButton.PRIMARY,
        //         hoverText: 'Open Image info',
        //         distance: 7
        //     } )
        // )

    
        this.uiPanel = new ui.CustomPrompt(
            ui.PromptStyles.LIGHTLARGE,
            650,
            425,
            true
        )

        
        

        //engine.addEntity(this)

    }

    public updateImage(texture:Texture): void {
        this.material.albedoTexture = texture
    }


    public openUI(): void {
        if(this.info === undefined) return;

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
            log(`${link} clicked`)
            openExternalURL(`https://${link}`)
        }, ui.ButtonStyles.RED);
        linkButton.label.fontSize = 13;
        linkButton.label.font = ui.SFHeavyFont;

        // Add CANCEL button to UI
        const cancelButton = this.uiPanel.addButton("CANCEL", 0, -170, () => {
            this.uiPanel.hide()
            log("cancel clicked")
        }, ui.ButtonStyles.ROUNDBLACK);
        cancelButton.label.fontSize = 13;
        cancelButton.label.font = ui.SFHeavyFont;

    }
}