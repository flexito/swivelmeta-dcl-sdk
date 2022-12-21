import { getUserAccount } from "@decentraland/EthereumController";
import * as eth from 'eth-connect'
import * as ui from '@dcl/ui-scene-utils'
import { createComponents, delay} from '../marketplace/components/index'
import { debugLog } from "src/utils/utilsLib";


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
    donationMessage: string = "DonationName"

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
     * debug is a boolean that determines whether or not debug messages will be displayed.
     * @type {boolean}
     * @default false
     */
    debug: boolean = false


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
        donationMessage?: string
    ) {
        super()
        engine.addEntity(this)

        this.uiPanel = new ui.CustomPrompt(
            ui.PromptStyles.DARKLARGE,
            400,
            200,
            true
        )

        this.model = model;
        this.position = position;
        this.defaultDonationAmount;
        this.receivingWalletAddress = receivingWalletAddress;
        donationMessage !== undefined ? this.donationMessage = donationMessage : this.donationMessage = "DonationName";

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

    /**
     * initialize is an async function that initializes the DonationBox and its components.
     * @async
     */
    public async initialize(): Promise<void> {
        debugLog(this.debug, "Initializing DonationBox")
        let currentBalance: any;
        let balance: any;
        

        // Initialize the mana component
        const { mana } = await createComponents();
        this.mana = mana;


        // Get the user's address and balance
        this.fromAddress = await getUserAccount();
        balance = await mana.balance();
        currentBalance = +eth.fromWei(balance, "ether");
        debugLog(this.debug, 'user balance: ',currentBalance, 'MANA');
        this.balance = currentBalance;
        

        // Get the mana contract
        const { manaConfig } = await mana.getContract();
        // debugLog("manaConfig: ", manaConfig)

        // get the allowance amount
        const allowance = await mana.isApproved(manaConfig.address)
        debugLog(this.debug, "allowance :", allowance);
        debugLog(this.debug, "balance :", eth.fromWei(balance, "ether"), "MANA");

    };


    /**
     * openUI is a function that creates the UI elements and opens the UI panel when the DonationBox is used.
     */
    public openUI(): void {
        // Show the donation UI
        this.uiPanel.show()


        // Set the default donation amount
        let tipAmountText = this.defaultDonationAmount.toString();


        // Add text to UI panel
        const defaultText = this.uiPanel.addText(`${this.donationMessage}`, 0, 80, Color4.White(), 30);
        defaultText.text.hAlign = "center"
        defaultText.text.vAlign = "center"


        // Add input box to UI for mana tip tip
        const tipAmountInput = this.uiPanel.addTextBox(0, 0, tipAmountText,
            (e: any) => {
                tipAmountText = e;
                debugLog(this.debug, "tipAmountText: ", tipAmountText)
            }
        )
        tipAmountInput.fillInBox.hAlign = "center";
        tipAmountInput.fillInBox.textWrapping = true;
        tipAmountInput.fillInBox.width = 200;
        tipAmountInput.fillInBox.onTextSubmit.callback = ( e:any ) => {
            tipAmountText = e.text;
            debugLog(this.debug, "tipAmountText: ", tipAmountText)
        }


        // Add MANA text next to input box
        const manaText = this.uiPanel.addText("MANA", 140, 15, Color4.White(), 20)
        manaText.text.vAlign = "center"
        manaText.text.hAlign = "center"


        // Add DONATE button to UI
        const donateButton = this.uiPanel.addButton("DONATE", -100, -60, () => {
            this.tipAmount = +tipAmountText;
            debugLog(this.debug, "tipAmount: ", this.tipAmount)
            this.makeDonation(this.tipAmount);
            this.uiPanel.hide()
        }, ui.ButtonStyles.ROUNDGOLD)
        debugLog(this.debug, "tipButton.image.width: ", donateButton.image.width)


        // Add CANCEL button to UI
        const cancelButton = this.uiPanel.addButton("CANCEL", 100, -60, () => {
            this.uiPanel.hide()
            debugLog(this.debug, "transaction cancelled")
        }, ui.ButtonStyles.RED)


    };


    /**
     * makeDonation is an async function that makes a donation to the receiving wallet address.
     * @param tipAmount The amount of MANA to be donated.
     * @returns  Once the donation has been made, the function opens a UI panel with a success message and the transaction hash.
     */
    public async makeDonation(tipAmount: number): Promise<void> {
        debugLog(this.debug, "makeDonation: ", tipAmount)

        

        // get MANA contract
        const { manaConfig } = await this.mana.getContract();

        // CHECK IF USER HAS GIVEN PERMISSION TO TRANSFER MANA
        const allowance = await this.mana.isApproved(manaConfig.address)
        debugLog(this.debug, "allowance :", allowance);

        // CHECK IF USER HAS ENOUGH MONEY
        if (+tipAmount > +this.balance) {
            new ui.OkPrompt("Sorry, you do not have enough MANA", undefined, undefined, true);
            return;
        }


        // CHECK IF USER HAS GIVEN PERMISSION TO TRANSFER MANA
        // debugLog( +tipAmount > 0 && +tipAmount > +allowance )
        if ( +tipAmount > 0 && +tipAmount > +allowance ) {

            // Prompt user to authorize MANA transfer
            new ui.OptionPrompt(
                "Approve MANA",
                "Authorize the MANA contract to operate MANA on your behalf",

                // Approve Action
                async () => {
                    const custom = new ui.CustomPrompt("dark", undefined, 200);
                    custom.addText("Please wait.\nThe transaction is being processed", 0, 50, undefined, 20);
            
                    await this.mana.approve(manaConfig.address, tipAmount).catch(() => {});
                    await delay(3000);
                    custom.hide();


                    // run makeDonation again, this time skipping the MANA AUTHORIZATION
                    this.makeDonation(tipAmount);
                    // return, once transaction is complete or cancelled
                    return;
                },

                // Reject Action
                async () => {
                    await delay(200);
                    debugLog(this.debug, "reject, new prompt");
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
                    
                    const res = await this.mana.sendMana(this.receivingWalletAddress, +eth.toWei(tipAmount, "ether"));
                    
                    custom.hide();
                    
                    debugLog(this.debug, 'res: ',res);
                    if (res) {
                        debugLog(this.debug, "Donation made")
                        debugLog(this.debug, `https://polygonscan.com/tx/${res}`);
                        new ui.OptionPrompt(
                            "Donation successful!",
                            '',
                            () => {},
                            () => {
                                const newBalance = this.balance - tipAmount;
                                debugLog(this.debug, 'new user balance: ',newBalance, 'MANA')
                                
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
            )
        }
    }
}