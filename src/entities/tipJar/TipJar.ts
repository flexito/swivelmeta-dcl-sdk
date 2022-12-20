import { getUserAccount } from "@decentraland/EthereumController";
import * as eth from 'eth-connect'
import * as ui from '@dcl/ui-scene-utils'
import { createComponents, delay} from '../marketplace/components/index'



/**
 * DonationBox is a class that allows users to donate MANA to a specified wallet address.
 * @class DonationBox
 * @extends Entity
*/
export class DonationBox extends Entity {

    /**
     * receivingWalletAddress is a variable that holds the address of the wallet that will receive the funds.
     * @type {string}
    */
    receivingWalletAddress: string
    /**
     * defaultDonationAmount is the default amount that will be used for donations
     * if no other amount is specified.
     * @type {number}
     * @default 0.1 MANA
    */
    defaultDonationAmount: number = 0.1
    /**
     * tipAmount is a number representing the amount of tip to be added to a bill.
     * @type {number}
    */ 
    tipAmount: number
    /**
     * fromAddress is the address of the user that is donating.
     * @type {string}
     */
    fromAddress: string
    /**
     * position is the position, rotation, and scale of the DonationBox in the scene.
     * @type {TransformConstructorArgs}
     */
    position: TransformConstructorArgs
    /**
     * uiPanel is the UI panel that will be displayed when the DonationBox is used.
     * @type {ui.CustomPrompt}
     */
    uiPanel: ui.CustomPrompt
    /**
     * donationName is the name of the user/entity that will receive the donation.
     * @type {string}
     * @default "DonationName"
     */
    donationName: string = "DonationName"

    /**
     * mana is the mana component that will be used to send the donation.
     */
    private mana: any;
    /**
     * balance is the current balance of the user. Displayed in BigNumber format.
     * @type {number}
     */
    balance: number

    /**
     * model is the GLTFShape that will be used for the DonationBox.
     * @type {GLTFShape}
     */
    model: GLTFShape

    /**
     * hoverText is the text that will be displayed when the user hovers over the DonationBox.
     * @type {string}
     * @default "Donate"
     */
    hoverText: string = "Donate"

    /**
     * actionButton is the button that will be used to interact with the DonationBox.
     * @type {ActionButton}
     * @default ActionButton.PRIMARY
     */
    actionButton: ActionButton = ActionButton.PRIMARY

    /**
     * actionDistance is the distance at which the user can interact with the DonationBox.
     * @type {number}
     * @default 7
     */
    actionDistance: number = 7


    /**
     * The constructor of the DonationBox class.
     * @param model The GLTFShape that will be used for the DonationBox.
     * @param position The position, rotation, and scale of the DonationBox in the scene.
     * @param receivingWalletAddress The address of the wallet that will receive the funds.
     */
    constructor(
        model: GLTFShape,
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

        this.model = model;
        this.position = position;
        this.defaultDonationAmount;
        this.receivingWalletAddress = receivingWalletAddress;

        this.addComponent(this.model)
        this.addComponent(this.position)

        this.initialize();

        this.addComponent(new OnPointerDown(
            () => {
                this.openUI();
            },
            {
                button: this.actionButton,
                hoverText: this.hoverText,
                distance: this.actionDistance
            }
        ))
    }

    public async initialize(): Promise<void> {
        log("Initializing DonationBox")
        const { mana } = await createComponents();
        let currentBalance: any;
        let balance: any;

        this.mana = mana;
        this.fromAddress = await getUserAccount();
        
        balance = await mana.balance();
        currentBalance = +eth.fromWei(balance, "ether");
        log('user balance: ',currentBalance, 'MANA');

        this.balance = currentBalance;

        const { manaConfig } = await mana.getContract();
        // log("manaConfig: ", manaConfig)

        const allowance = await mana.isApproved(manaConfig.address)
        log("allowance :", allowance);
        // log(balance, allowance);
        log(eth.fromWei(balance, "ether"), allowance);

    };

    public openUI(): void {
        this.uiPanel.show()
        let tipAmountText = this.defaultDonationAmount.toString();

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
        const { manaConfig } = await this.mana.getContract();

        const allowance = await this.mana.isApproved(manaConfig.address)
        log("allowance :", allowance);

        // CHECK IF USER HAS ENOUGH MONEY
        if (+tipAmount > +this.balance) {
            new ui.OkPrompt("Sorry, you do not have enough MANA", undefined, undefined, true);
            return;
        }


        // CHECK IF USER HAS GIVEN PERMISSION TO TRANSFER MANA
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

            // TRANSFER MANA FROM USER TO THE TIP RECEIVING_WALLET_ADDRESS
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