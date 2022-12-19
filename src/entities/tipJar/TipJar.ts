// import * as crypto from '@dcl/crypto-scene-utils'
import { getUserAccount } from "@decentraland/EthereumController";
import * as eth from 'eth-connect'
import * as l2 from '@dcl/l2-scene-utils'
import { matic } from '@dcl/l2-scene-utils'


// import * as utils from '@dcl/ecs-scene-utils'
import * as ui from '@dcl/ui-scene-utils'
import { getUserData, UserData } from "@decentraland/Identity"

// import { createMANAComponent } from '../marketplace/components/mana'
import { createComponents, Providers, delay} from '../marketplace/components/index'
// import {  } from '../marketplace/components/market'

let tipBoxModel = new GLTFShape("resources/models/tipjar/tip_jar.glb");
let defaultTransactionAmount = 0.1;

export class TipBox extends Entity {
    receivingWalletAddress: string
    defaultAmount: number
    tipAmount: number
    fromAddress: string
    position: TransformConstructorArgs
    uiPanel: ui.CustomPrompt
    donationName: string = "MetaTrekkers";

    mana: any;
    balance: number




    constructor(
        position: TransformConstructorArgs,
        receivingWalletAddress: string,
    ) {
        super()
        engine.addEntity(this)

        this.uiPanel = new ui.CustomPrompt(
            ui.PromptStyles.DARKLARGE,
            800,
            400,
            true
        )

        this.position = position;
        this.defaultAmount = defaultTransactionAmount;
        this.receivingWalletAddress = receivingWalletAddress;

        this.addComponent(tipBoxModel)
        this.addComponent(this.position)

        this.initialize();

        this.addComponent(new OnPointerDown(
            () => {
                this.openUI();
            },
            {
                button: ActionButton.PRIMARY,
                hoverText: "Donate",
                distance: 7
            }
        ))
    }

    public async initialize(): Promise<void> {
        log("Initializing TipBox")
        const { mana, store } = await createComponents();
        let currentBalance: any;
        let balance: any;

        this.mana = mana;
        this.fromAddress = await getUserAccount();

        // // Get current balance of user
        // currentBalance = await matic.balance(this.fromAddress);
        // log("currentBalance: ", currentBalance)
        
        balance = await mana.balance();
        currentBalance = +eth.fromWei(balance, "ether")
        log('user balance: ',currentBalance, 'MANA')
        // log('user balance big: ', +balance, 'MANA')

        this.balance = currentBalance;

        const { contract, manaConfig } = await mana.getContract();
        // log("mana contract: ", contract)
        // log("manaConfig: ", manaConfig)

        const allowance = await mana.isApproved(manaConfig.address)
        log("allowance :", allowance);
        // log(balance, allowance);
        log(eth.fromWei(balance, "ether"), allowance);

    };

    public openUI(): void {
        this.uiPanel.show()
        let posY = 120;
        let tipAmountText = this.defaultAmount.toString();

        // Add text to UI
        let defaultText = this.uiPanel.addText(`Donate to ${this.donationName}`, 0, 100, Color4.White(), 30);
        defaultText.text.hAlign = "center"
        defaultText.text.vAlign = "center"

        // Add input box to UI for mana tip tip
        const tipAmountInput = this.uiPanel.addTextBox(0, -30, tipAmountText, (e: any) => {
            tipAmountText = e;
            log("tipAmountText: ", tipAmountText)
        })
        tipAmountInput.fillInBox.hAlign = "center";
        tipAmountInput.fillInBox.textWrapping = true;
        this.uiPanel.addText("MANA", 200, -17.5, Color4.White(), 20)

        // Add TIP button to UI
        const tipButton = this.uiPanel.addButton("DONATE", 0, -100, () => {
            this.tipAmount = +tipAmountText;
            log("tipAmount: ", this.tipAmount)
            this.makeDonation(this.tipAmount);
            this.uiPanel.hide()
        }, ui.ButtonStyles.ROUNDGOLD)


        // Add CANCEL button to UI
        const cancelButton = this.uiPanel.addButton("CANCEL", 0, -150, () => {
            this.uiPanel.hide()
            log("transaction cancelled")
        }, ui.ButtonStyles.RED)


    };

    public async makeDonation(tipAmount: number): Promise<void> {
        log("makeDonation: ", tipAmount)
        // log("makeDonation BIG: ", +eth.toWei(tipAmount, "ether"))

        

        // get MANA contract
        const { contract, manaConfig } = await this.mana.getContract();

        const allowance = await this.mana.isApproved(manaConfig.address)
        log("allowance :", allowance);

        // TODO: CHECK IF USER HAS ENOUGH MONEY
        if (+tipAmount > +this.balance) {
            new ui.OkPrompt("Sorry, you do not have enough MANA", undefined, undefined, true);
            return;
        }


        // TODO: CHECK IF USER HAS GIVEN PERMISSION TO TRANSFER MANA
        log( +tipAmount > 0 && +tipAmount > +allowance )
        if ( +tipAmount > 0 && +tipAmount > +allowance ) {

            new ui.OptionPrompt(
                "Approve MANA",
                "Authorize the MANA contract to operate MANA on your behalf",
                // Approve Action
                async () => {
                    const custom = new ui.CustomPrompt("dark", undefined, 200);
                    custom.addText("Please wait.\nThe transaction is being processed", 0, 50, undefined, 20);
                    // const loading = new ui.LoadingIcon(undefined, 0, -120);
            
                    await this.mana.approve(manaConfig.address, tipAmount).catch(() => {});
                    await delay(3000);
                    custom.hide();
                    // loading.hide();


                    // run makeDonation again, this time skipping the MANA AUTHORIZATION
                    this.makeDonation(tipAmount);
                    // return, once transaction is complete or cancelled
                    return;
                },
                // Reject Action
                async () => {
                    await delay(200);
                    log("reject, new prompt");
                    new ui.OkPrompt(
                        "You need to authorize the Mana contract to be able to send MANA",
                        undefined,
                        undefined,
                        true
                    );
                },

                // UI Options
                "Authorize",
                "Reject",
                true
            );

            // return if transaction is cancelled
            return;
        }

        if ( +tipAmount > 0) {

            // TODO: TRANSFER MANA FROM USER TO THE TIP RECEIVING_WALLET_ADDRESS
            new ui.OptionPrompt(
                "",
                `You are about send ${tipAmount} MANA`,
                async () => {
                    const custom = new ui.CustomPrompt("dark", undefined, 200);
                    custom.addText("Please wait.\nThe donation transaction is being processed", 0, 50, undefined, 20);
                    // const loading = new ui.LoadingIcon(undefined, 0, -120);
                    
                    const res = await this.mana.sendMana(this.receivingWalletAddress, +eth.toWei(tipAmount, "ether"));
                    
                    custom.hide();
                    // loading.hide();
                    
                    log('res: ',res);
                    if (res) {
                        log("Donation made")
                        log(`https://polygonscan.com/tx/${res}`);
                        new ui.OptionPrompt(
                            "Donation successful!",
                            '',
                            () => {},
                            () => {
                                const newBalance = this.balance - tipAmount;
                                log('new user balance: ',newBalance, 'MANA')
                                
                                openExternalURL(`https://polygonscan.com/tx/${res}`);
                            },
                            "Ok",
                            "PolygonScan",
                            true
                            );
                    } else {
                        new ui.OkPrompt("Donation failed.\nPlease try again.", undefined, undefined, true);
                    }
                },
                undefined,
                "Ok",
                "Cancel",
                true
            );
        }
    };
            

}