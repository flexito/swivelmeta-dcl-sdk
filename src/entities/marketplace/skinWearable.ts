export class SkinWearable extends Entity {
    constructor(model: GLTFShape, transform: Transform) {
        super()
        // engine.addEntity(this)
        this.addComponent(model)
        this.addComponent(transform)

        this.addComponent(new Animator())
        this.getComponent(Animator).addClip(
        new AnimationState('Run', { looping: true })
        )
        this.getComponent(Animator).addClip(
        new AnimationState('Idle', { looping: true })
        )
        this.getComponent(Animator).addClip(
        new AnimationState('LookAround', { looping: true })
        )
    }
    // Play running animation
    playRunning() {
        this.getComponent(Animator).getClip('Run').play()
    }
  
    // Play idle animation
    playIdle() {
        this.getComponent(Animator).getClip('Idle').play()
    }

    // Play look around animation
    playLookAround() {
        this.getComponent(Animator).getClip('LookAround').play()
    }
  }