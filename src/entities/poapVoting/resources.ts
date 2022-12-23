import { 
    openDialogSound,
    closeDialogSound,
    coinSound,
    PlayOpenSound,
    PlayCloseSound,
    PlayCoinSound
} from './sounds'



export default {
    dispenser: {
        dispenserShape: new GLTFShape('resources/models/dispenser.glb'),
        dispenserAnimator: new Animator(),
        dispenserAnims: {
            'Idle_POAP': new AnimationState('Idle_POAP', { looping: true }),
            'Action_POAP': new AnimationState('Action_POAP', { looping: false }),
        }
    },
    button: {
        buttonShape: new GLTFShape('resources/models/button.glb'),
        buttonAnimator: new Animator(),
        buttonAnims: {
            'Button_Action' : new AnimationState('Button_Action', { looping: false }),
        }
    },
    sounds: {
        openDialogSound,
        closeDialogSound,
        coinSound,
        PlayOpenSound,
        PlayCloseSound,
        PlayCoinSound
    }

}