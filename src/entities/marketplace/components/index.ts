import * as ui from '@dcl/ui-scene-utils'
import { getUserAccount } from "@decentraland/EthereumController";
import * as eth from "eth-connect";
import * as dclTx from "decentraland-transactions";
import { getProvider, Provider } from "@decentraland/web3-provider";
import { createMANAComponent } from './mana';
import { createMarketComponent } from "./market";
import * as utils from "@dcl/ecs-scene-utils";





export async function createComponents(){
    /* 
    * A Provider to reads from the blockchain.
    * refers to the network you are connected to and therefore where the meta transaction will be signed 
    */
    const provider = await getProvider();
    
    /* 
    * Responsible for passing messages to providers. It's also responsible for polling the ethereum node for incoming messages. 
    */
    const requestManager: any = new eth.RequestManager(provider); 
    
    /* 
    * Allows clients to interact with the node. Where the meta transaction will be executed 
    */
    const metaProvider: any = new eth.WebSocketProvider("wss://rpc-mainnet.matic.quiknode.pro");
    
    /* 
    * User account to interact with the node
    */
    const fromAddress = await getUserAccount();
    log("fromAddress: ", fromAddress);
    
    /* 
    * An Operator that submits blockchain transactions on the behalf of the user. 
    * A meta transaction is a regular Ethereum transaction that embeds another transaction within the actual transaction.
    */
    const metaRequestManager: any = new eth.RequestManager(metaProvider);
    
    const providers = {
    provider,
    requestManager,
    metaProvider,
    metaRequestManager,
    fromAddress,
    };

    const mana = await createMANAComponent(providers);
    const store = await createMarketComponent(providers);
    return {mana, store}
}


export async function buy(collectionId: string, blockchainId: number, price: number) {
    log("buy", collectionId, blockchainId, price);
    
        // -- MATIC BUY FUNCTION

        //* -- Create Providers to connect to Ethereum blockchain and transact using Matic
        const { mana, store } = await createComponents();
        const storeContract = dclTx.getContract(dclTx.ContractName.CollectionStore, 137);
        log("address: ",storeContract.address)
        log("abi: ",storeContract.abi)
        log("chainId: ", storeContract.chainId)
        //* -- Get user balance
        const balance = await mana.balance();
        log("balance :", balance);
        const allowance = await mana.isApproved(storeContract.address)
        // .then(res => {log("res :", res); return res;});

        log("allowance :", allowance);
        log(balance, allowance);
        log(eth.fromWei(balance, "ether"), allowance);

        // TODO: CHECK IF USER HAS ENOUGH MONEY
        if (+price > +balance) {
            new ui.OkPrompt("Sorry, you do not have enough MANA", undefined, undefined, true);
            return;
        }

        // TODO: CHECK IF MARKETPLACE HAS PERMISSION TO BUY
        log(+price > 0 && +price > +allowance);
        if (+price > 0 && +price > +allowance) {
            log("Authorize the Store contract to operate MANA");
            new ui.OptionPrompt(
                "Approve MANA",
                "Authorize the Store contract to operate MANA on your behalf",
                async () => {
                const custom = new ui.CustomPrompt("dark", undefined, 200);
                custom.addText("Please wait.\nThe transaction is being processed", 0, 50, undefined, 20);
                const loading = new ui.LoadingIcon(undefined, 0, -120);
        
                await mana.approve(storeContract.address).catch(() => {});
                await delay(3000);
                custom.hide();
                loading.hide();
                buy(collectionId, blockchainId, price);
                return;
                },
                async () => {
                await delay(200);
                log("reject, new prompt");
                new ui.OkPrompt(
                    "You need to authorize the Store contract to be able to buy this item",
                    undefined,
                    undefined,
                    true
                );
                },
                "Authorize",
                "Reject",
                true
            );
            return;
        }

        //* -- CHECK IF THE ITEM IS FREE
        if (+price === 0) {
            new ui.OptionPrompt(
                `You are about to get an item for free`,
                "",
                async () => {
                const custom = new ui.CustomPrompt("dark", undefined, 200);
                custom.addText("Please wait.\nThe transaction is being processed", 0, 50, undefined, 20);
                const loading = new ui.LoadingIcon(undefined, 0, -120);
        
                const res = await store.buy(collectionId, blockchainId.toString(), price.toString());
        
                custom.hide();
                loading.hide();
                log(res);
                if (res) {
                    new ui.OptionPrompt(
                    "Purchased succeed!",
                    "You will need to refresh the page to see the wearable in your backpack.",
                    () => {},
                    () => {
                        log(`https://polygonscan.com/tx/${res}`);
                        openExternalURL(`https://polygonscan.com/tx/${res}`);
                    },
                    "Ok",
                    "PolygonScan",
                    true
                    );
        
                } else {
                    new ui.OkPrompt("Purchased failed.\nPlease try again.", undefined, undefined, true);
                }
                },
                undefined,
                "Ok",
                "Cancel",
                true
                );
            } else {
            new ui.OptionPrompt(
                "",
                `You are about to buy an item for ${eth.fromWei(price, "ether")} MANA`,
                async () => {
                const custom = new ui.CustomPrompt("dark", undefined, 200);
                custom.addText("Please wait.\nThe transaction is being processed", 0, 50, undefined, 20);
                const loading = new ui.LoadingIcon(undefined, 0, -120);
        
                const res = await store.buy(collectionId, blockchainId.toString(), price.toString());
        
                custom.hide();
                loading.hide();
        
                log(res);
                if (res) {
                    new ui.OptionPrompt(
                    "Purchased succeed!",
                    "You will need to refresh the page to see the wearable in your backpack.",
                    () => {},
                    () => {
                        log(`https://polygonscan.com/tx/${res}`);
                        openExternalURL(`https://polygonscan.com/tx/${res}`);
                    },
                    "Ok",
                    "PolygonScan",
                    true
                    );
                } else {
                    new ui.OkPrompt("Purchased failed.\nPlease try again.", undefined, undefined, true);
                }
                },
                undefined,
                "Ok",
                "Cancel",
                true
            );
            }
        
            return {
            balance: eth.fromWei(balance, "ether"),
            allowance: eth.fromWei(allowance, "ether"),
            };
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const ent = new Entity();
      engine.addEntity(ent);
      ent.addComponent(
        new utils.Delay(ms, () => {
          resolve();
          if (ent.isAddedToEngine()) engine.removeEntity(ent);
        })
      );
    });
}

export type Providers = {
    provider: Provider;
    requestManager: eth.RequestManager;
    metaProvider: Provider;
    metaRequestManager: eth.RequestManager;
    fromAddress: string;
  };