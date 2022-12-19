import * as crypto from "@dcl/crypto-scene-utils"
import * as ui from "@dcl/ui-scene-utils"
import { movePlayerTo } from "@decentraland/RestrictedActions";

// Config

// Example token from the contract: https://opensea.io/assets/0x6b47e7066c7db71aa04a1d5872496fe05c4c331f/2
// Contract address on Etherscan: https://etherscan.io/address/0x6b47e7066c7db71aa04a1d5872496fe05c4c331f

// MetaTrekker NFT Tokens for Gate Access
//0xdddadd4dc4004fbad85b6b9bf4efd60c037f9deb //Trekker bot NFT token
//0xca5160d703ca05df98899bff14f5d110aa4d2c2e //Trekker God
//0xbc32395daf1db98545d14421c9c98aee0d468a61 //MetaTrekker


// Check player's wallet to see if they're holding any tokens relating to that contract address
export async function checkTokens(telePosition, entity) {
    // Sounds
    const confirmSound = new AudioSource(new AudioClip("resources/sounds/confirm.mp3"))
    const errorSound = new AudioSource(new AudioClip("resources/sounds/error.mp3"))

    
    crypto.avatar.itemsInInventory(
        [
            "urn:decentraland:matic:collections-v2:0xdddadd4dc4004fbad85b6b9bf4efd60c037f9deb:0",
            "urn:decentraland:matic:collections-v2:0xca5160d703ca05df98899bff14f5d110aa4d2c2e:0",
            "urn:decentraland:matic:collections-v2:0xbc32395daf1db98545d14421c9c98aee0d468a61:0"
        ]
      )
      .then((inventory) => {
        log("INVENTORY: ", inventory)
        if (inventory) {
            // play sound
            log("PLAYING CONFIRM SOUND")
            entity.addComponentOrReplace(confirmSound)
            confirmSound.playOnce()
            confirmSound.volume = 1
            
            new ui.OkPrompt(
                'Thanks for being a MetaTrekker NFT holder! Enjoy VIP upstairs!',
            () => {
                movePlayerTo(telePosition)
            },
            'Awesome!'
            )
        } else {
            // play sound
            log("PLAYING ERROR SOUND")
            entity.addComponentOrReplace(errorSound)
            errorSound.playOnce()
            errorSound.volume = 1
            
            new ui.OptionPrompt(
                'You need a MetaTrekker NFT first!',
                'Get your MetaTrekker NFT today! \nThen join us upstairs in VIP!\n \nMouse click "Im in!" to get your MetaTrekker NFT!',
                () => {
                    openExternalURL("https://market.decentraland.org/accounts/0x86edb92e217605dbecf606548e48daaf1b817da1?assetType=item&section=wearables")
                },
                () => {
                },
                'Im in!',
                'Ill miss out'
                )
            }
        })
        }
        
        