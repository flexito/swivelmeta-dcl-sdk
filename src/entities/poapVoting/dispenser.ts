import * as utils from '@dcl/ecs-scene-utils'
import * as UI from '@dcl/ui-scene-utils'
import * as boothUI from './ui'

import { getUserData, UserData } from '@decentraland/Identity'
import { getCurrentRealm, Realm } from '@decentraland/EnvironmentAPI'
import { PlayCloseSound } from './sounds'
import { signedFetch } from '@decentraland/SignedFetch'
import { addVoter, updateCount } from './airtable_api'
import { EnableDisable, debugMessage } from "../../index";


export const sceneMessageBus = new MessageBus()
export const bEnablePoapClaim = new EnableDisable() // defaults to true, this is the class that handles the enable/disable of the POAP claim
const timeDelay = 1 *60 *1000 // Delay before being able to claim a POAP in milliseconds


/**
 *
 * @param {TransformConstructorArgs} transform position, rotation and scale of the booth
 * @param {string} djName Name of the DJ Users are voting for
 * @param { 1 | 2 } djID  ID of the DJ, used for counting the votes
 * @param {string} poapServer server to use
 * @param {string} eventUUID ID of the event
 *
 */
export function createDispenser(
  transform: TranformConstructorArgs,
  djName: string,
  djID: '1' | '2',
  eventUUID: string,
  poapServer?: string
) {
  const createdTime = new Date()
  const serverURL: string = poapServer
    ? poapServer
    : 'poap-api.decentraland.org'

  let alreadyAttempted: boolean = false

  let count: string = '0';

  const entity = new Entity()
  engine.addEntity(entity)
  // eventUUID = eventUUID
  // djName = djName
  // djID = djID

  // entity.addComponent(new GLTFShape('resources/models/POAP_booth_design.glb'))
  entity.addComponent(new Transform(transform))

  // const idleAnim = new AnimationState('Idle_POAP', { looping: true })
  // entity.addComponent(new Animator())
  // entity.getComponent(Animator).addClip(idleAnim)
  // entity
  //   .getComponent(Animator)
  //   .addClip(new AnimationState('Action_POAP', { looping: false }))
  // idleAnim.play()


  const counterText = new Entity();
  counterText.setParent(entity);
  counterText.addComponent(new Transform({
  position: new Vector3(0, 3, 0),
  rotation: Quaternion.Euler(0, 180, 0),
  scale: new Vector3(1, 1, 1)
  }));
  counterText.addComponent(new TextShape(count));
  counterText.getComponent(TextShape).color = Color3.Red();

  const djText = new Entity();
  djText.setParent(entity);
  djText.addComponent(new Transform({
  position: new Vector3(0, 4, 0),
  rotation: Quaternion.Euler(0, 180, 0),
  scale: new Vector3(.25, .25, .25)
  }));
  djText.addComponent(new TextShape(djName));
  djText.getComponent(TextShape).color = Color3.White();


  const button = new Entity()
  button.addComponent(new GLTFShape('resources/models/POAP_booth_design_button.glb'))
  // button.addComponent(new BoxShape())
  // button.addComponent(new Animator())
  // button
  //   .getComponent(Animator)
  //   .addClip(new AnimationState('Button_Action', { looping: false }))
  button.setParent(entity)
  
  button.addComponent(
    new OnPointerDown(
      async (_e) => {
        // button.getComponent(Animator).getClip('Button_Action').play()
        //sceneMessageBus.emit('activatePoap', {})
        
        if ( !bEnablePoapClaim.bEnable ) { // If the POAP claim is disabled, then return and do nothing
          debugMessage("Voting hasn't started yet."); 
          return; 
        } 

        // This triggers that POAP claim event
        void await makeTransaction(); 
        
        // Testing
        // void await TestAirtableCalls();
        
      },
      { button: ActionButton.PRIMARY, hoverText: 'Get Attendance Token' }
    )
  )
  engine.addEntity(button)


  // update count every 30 seconds
  entity.addComponentOrReplace(new utils.Interval(30 * 1000, async () => {
    counterText.getComponent(TextShape).value = await updateCount(djID)
    log('Updating count')
    }))


  // sceneMessageBus.on('activatePoap', () => {
  //   activate()
  // })


  /*// function activate(): void {
  //   const anim = entity.getComponent(Animator)

  //   anim.getClip('Action_POAP').play()

  //   entity.addComponentOrReplace(
  //     new utils.Delay(4000, () => {
  //       anim.getClip('Action_POAP').stop()

  //       anim.getClip('Idle_POAP').play()
  //     })
  //   )
  // }*/

  async function getCaptcha(): Promise<string> {
    const captchaUUIDQuery = await signedFetch(`https://${serverURL}/captcha`, {
      method: 'POST'
    })
    const json = JSON.parse(captchaUUIDQuery.text)
    return json.data.uuid
  }

  async function makeTransaction() {
    const userData = await getUserData()

    // no wallet
    if (!userData || !userData.hasConnectedWeb3) {
      log('no wallet')
      PlayCloseSound()

      boothUI.metamask()
      return
    }


    // Delay timer before claiming
      if (+createdTime > (new Date().setMinutes(new Date().getMinutes() - (timeDelay/1000)/60) )) {
      PlayCloseSound()
      boothUI.timerBeforeClaim(createdTime, timeDelay)
      return
    }


    if (alreadyAttempted) {
      // already attempted
      PlayCloseSound()
      boothUI.alreadyClaimed()
      return
    }

    alreadyAttempted = true
    const realm = await getCurrentRealm()

    try {
      const captchaUUID = await getCaptcha()
      const captchaResult = await boothUI.captcha(serverURL, captchaUUID)
      log("captcha result: ", captchaResult)
      if (captchaResult === undefined) {
        alreadyAttempted = false
        let prompt = new UI.OkPrompt(
            `Oops, there was an error with Captcha: \n"${captchaResult}",`,
            () => {
              log(`continue`)
            },
            'Ok',
            true
        )
        return
      }
      const response = await claimCall(captchaResult, userData, realm)
      log(response)
      log("Claim Call response: ",response.status)
      const json = await response.json()
      log("JSON log: ", json)
      if (response.status === 200) { // success on claiming POAP
        
        // Send data to Airtable
        log('Adding Voter!')
        let res = await addVoter(djID, userData.publicKey, userData.displayName, realm.displayName, new Date().toISOString().split('T')[0])
        
        switch (res.status) {
          
          case 200:
            let prompt = new UI.OkPrompt(
                "Congrats! You placed your vote!",
                () => {
                  log(`continue`)
                },
                'Awesome!',
                true
            );
            log(res.statusText);
            counterText.getComponent(TextShape).value = await updateCount(djID);
            break
          
          case 429:
            // add delay then try again
            new utils.Delay(30 * 1000, async () => {
              res = await addVoter(djID, userData.publicKey, userData.displayName, realm.displayName, new Date().toISOString().split('T')[0])
              log(res.status)

              if (res.status === 200) {
                //!**   Add an actual UI that requires the next button to be pressed!   **!/
                let prompt = new UI.OkPrompt(
                        "Congrats! You placed your vote!",
                        () => {
                          log(`continue`)
                        },
                        'Awesome!',
                        true
                )}
            });
            counterText.getComponent(TextShape).value = await updateCount(djID);
            break
          
          default:
            log(res.statusText);
            let promptDefault = new UI.OkPrompt(
                `Oops, there was an error: \n"${res.statusText}",`,
                () => { },
                'Ok',
                true
            )
            break

        }

        // show UI success message
        boothUI.viewSuccessMessage(
          json.data.event.name,
          json.data.event.image_url,
          1024,
          1024
        )
        /* sceneMessageBus.emit('activatePoap', {})
        // activate() // Play claim animation */

      /*} if (response.status === 500) { // error on claiming POAP
        let errorPrompt = new UI.OkPrompt(
            `Oops, there was an error with Captcha: \n"${response.statusText}",`,
            () => { },
            'Ok',
            true
        )
        UI.displayAnnouncement(`Oops, there was an error with Captcha: "${response.statusText}",`, 3)*/

      } else {
        PlayCloseSound()
        switch (json.error) {
          case 'Address already claimed a code for this event':
            let errorPrompt = new UI.OkPrompt(
                `You already claimed this event`,
                () => { },
                'Ok',
                true
            )
            break

          default:
            alreadyAttempted = false;
            let defaultPrompt = new UI.OkPrompt(
                `Oops, there was an error: \n"${json.error}"`,
                () => { },
                'Ok',
                true
            )
            break
        }
      }
      
    } catch {
      alreadyAttempted = false
      log('Error fetching from POAP server ', serverURL)
      let defaultPrompt = new UI.OkPrompt(
          'Error fetching from POAP server. Try Again.',
          () => { },
          'Ok',
          true
      )
    }

    return
  }

  async function claimCall(
    captchaResult: string,
    userData: UserData,
    realm: Realm
  ) {
    const response = await fetch(`https://${serverURL}/claim/${eventUUID}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        address: userData.publicKey,
        catalyst: realm.domain,
        room: realm.room,
        captcha: captchaResult
      })
    })
    return response
  }
  
  
  // -- TESTING FUNCTION -- //
  async function TestAirtableCalls() {
    const userData = await getUserData()
    const realm = await getCurrentRealm()
    
    
    // Send data to Airtable
    log('Adding Voter!')
    let res = await addVoter(djID, userData.publicKey, userData.displayName, realm.displayName, new Date().toISOString().split('T')[0])

    switch (res.status) {
      case 200: //Add voter to Airtable, successful.
        let prompt = new UI.OkPrompt(
            "Congrats! You placed your vote!",
            () => {
              log(`continue`)
            },
            'Awesome!',
            true
        );
        log(res.status);
        counterText.getComponent(TextShape).value = await updateCount(djID);
        break

      case 429: // Too many calls to Airtable.
        // add delay then try again
        new utils.Delay(30 * 1000, async () => {
          res = await addVoter(djID, userData.publicKey, userData.displayName, realm.displayName, new Date().toISOString().split('T')[0])
          log(res.status)

          if (res.status === 200) {
            //!**   Add an actual UI that requires the next button to be pressed!   **!/
            let prompt = new UI.OkPrompt(
                "Congrats! You placed your vote!",
                () => {
                  log(`continue`)
                },
                'Awesome!',
                true
            )}
        });
        counterText.getComponent(TextShape).value = await updateCount(djID);
        break

      default:
        log(res.statusText);
        let promptDefault = new UI.OkPrompt(
            `Oops, there was an error: \n"${res.statusText}",`,
            () => { },
            'Ok',
            true
        )
        break

    }
  }

  return entity
}
