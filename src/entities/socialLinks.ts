import * as ui from '@dcl/ui-scene-utils'
import { socialMedia } from '../../game'


let count = 0;
const offset = 40
for (let social in socialMedia) {
    const socialMediaIcon = socialMedia[social].icon
    const socialMediaLink = socialMedia[social].link

    const socialUI = new ui.MediumIcon(
        socialMediaIcon, 
        -200 - (count * offset), 60,
        32, 32,
        { sourceWidth: 128, sourceHeight: 128 }
    )

    // socialUI.addComponent(new OnPointerDown(() => {
        socialUI.image.onClick = ( new OnPointerDown(() => {
        // log(`clicked ${socialMediaLink}`)
        openExternalURL(`https://${socialMediaLink}`)
    }, 
    {
        button: ActionButton.PRIMARY,
        hoverText: ''
    }))

    socialUI.image.hAlign = 'right'
    socialUI.image.vAlign = 'top'
    socialUI.image.paddingTop = 0
    socialUI.image.paddingBottom = 0
    socialUI.image.paddingLeft = 0
    socialUI.image.paddingRight = 0
    socialUI.image.isPointerBlocker = true
    socialUI.show()

    count++;
}