/**
 * @version: Swivel Meta SDK Version: 0.3.0
 * @author: Mark Fernandez
 * @company Swivel Meta
 * @desc: A suite of functions to interact with the Swivel Meta API
 */


 import { getUserData } from "@decentraland/Identity"
 import {
     getCurrentRealm,
     getPlatform,
     Platform,
 } from "@decentraland/EnvironmentAPI";
 import { signedFetch } from "@decentraland/SignedFetch";
 import { getParcel } from "@decentraland/ParcelIdentity";
 import { DynamicMedia } from "../entities/dynamicMedia";
 import { EnableDisable } from "./utilsLib";

/** 
 * Default Discord Hook Url, incase the user does not provide one
 * [ default url, backup ] used for testing
*/
const default_discordHookUrl = 'https://discord.com/api/webhooks/969637646303379456/AJFBuiVxj-l4ZesqY3vYIaUizncO2Vlf6hdyJMHf06YE_sRNfs1KnY7pfRSOJHzy2NQ8'; // DEV

 
//  const projectId: string = "MT-EC-DCL";
//  const debug: boolean = false;  // Set to true to enable debug mode
// const bInitDiscord: boolean = false; // initialize discord callback
/** 
 * bLoadOnEnter - 
 * When true, load the components everytime the user enters the scene. 
 * When false, only load the components once on scene enter and only if components are not already loaded. 
*/
// const bLoadOnEnter: boolean = false;
 // const bLoadOnEnter: boolean = true;
 
 
export interface VisitorData {
    display_name: string;
    email?: string;
    wallet_address: string;
    room_id: string;
    scene_id: string;
    space_time?:string;
    device?:{
        type: Platform;
        device_address: string;
        device_detail: string;
    }
}

interface ComponentData {
    component_type: string;
    description: string;
    name: string;
    parameters: Parameter[];
}

interface Parameter {
    default_value: string;
    description: string;
    edit_scope: string;
    name: string;
    type: string;
}

// Swivel Meta Config type, used to store the config data for all components
export type SwivelMetaConfig = { [key: string]: any };


export class SwivelMetaServices extends Entity {
    projectId: string;
    apiURL: string;
    startTime: Date;
    endTime?: Date;
    debug: boolean;

    discordHookURL: string = default_discordHookUrl;
    sceneName?: string;
    display_name?: string;
    wallet_address?: string;
    room_id?: string;
    guest?: boolean;
    platform?: string;
    realm?: string;
    parcels?: string;

    bInitializeDiscord: boolean; // initialize discord callback
    bLoadOnEnter: boolean; // load components on scene enter
    
    componentObjectPairs: { component: string; object: any }[] = [];
    once: boolean = true;

    constructor(
        projectId: string,
        debug: boolean = false,
        bInitializeDiscord: boolean = false,
        bLoadOnEnter: boolean = false
    ) {
        super();

        this.projectId = projectId;
        this.debug = debug;
        this.bInitializeDiscord = bInitializeDiscord;
        this.bLoadOnEnter = bLoadOnEnter;
        
        this.startTime = new Date();


        this.apiURL = "https://prod-swivelmeta.com/core2/query";
        

        this.InitializeSwivelMetaServices( projectId );
        this.InitializeVisitorData( projectId );

    }


    /**
     * @desc Initialize Swivel Meta SDK. This function will get the discordHookUrl from Swivel Meta API 
     * then add a listener to the scene which will ping your discord and send the user details to Swivel Meta Cloud
     * @param projectId - The project ID to fetch the config for
     */
    private async InitializeSwivelMetaServices( projectId: string ): Promise<void> {
    // check if bInitDiscord is false, if so, don't initialize discord
    if (!this.bInitializeDiscord) {
        log('InitializeSwivelMetaServices :: bInitDiscord is false, not initializing discord');
        return;
    }
    // Get Discord Hook URL
    try {
        if( await this.getDiscordCallbackUrl(projectId) ) {
            if ( this.debug ) log('Discord Hook URL ::', this.discordHookURL);
            this.addUserActivitiesListener(projectId);
        }
    } catch (error) { log('init_SM_SDK :: Failed to reach URL ::', error) }
    }


    public async InitializeVisitorData( projectId: string ): Promise<void> {
        const player = await getUserData();
            if(player && player.userId) {
                // Send user details to SM Cloud
                const postBody = await this.getVisitorDataBody(projectId);
                await this.submitFetch( this.assembleVisitorData(postBody) );
                if ( this.debug ) log("onEnterSceneObservable :: assembleVisitorData ::", this.assembleVisitorData(postBody));
            }
    }


    private getDiscordCallbackUrl(projectName: string): Promise<string> {
        return new Promise(async (resolve) =>{
            const queryBody = `{
                    getProjectByUrlName(urlName: "${projectName}") {
                    discord_callback_url
                    }
                    }`
                        
            if ( this.debug ) log('queryBody: ', queryBody);
            await this.fetchQuery( queryBody )
            .then(response => response.json())
            .then(data => {
            const discordCallback = data.data.getProjectByUrlName.discord_callback_url;
                if ( this.debug ) log('getDiscordCallbackUrl :: data ::', discordCallback);
                if (discordCallback) {
                    this.discordHookURL = discordCallback;
                    if ( this.debug ) log('getDiscordCallbackUrl :: discordHookUrl ::', this.discordHookURL);
                    resolve(this.discordHookURL);
                }
            })
            .catch((error) => {
                if ( this.debug ) log('getDiscordCallbackUrl :: Error ::', error);
                this.discordHookURL = default_discordHookUrl; // set default_discord
            });
        });
        
    }


    /**
     * Creates a new fetch request to the Swivel Meta API
     * @param request - The request object to send to the API
     * @returns The payload for the request
 */
    private async fetchQuery( request: Object ) {
        return fetch(this.apiURL, 
            {
                method: "POST",
                headers: {
                    "Accept":  "application/json, text/plain, image/*, */*",
                },
                body: request.toString(),
        });
    }


    private async submitFetch( postBody: any ){
        try {
            let response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    "Accept":  "application/json, text/plain, image/*, */*",
                    // 'Content-Type': 'application/json'
                },
                body: postBody.toString()
            })
            .then(response => response.json())
            .then(data => { log(data) })
            // log(`submitSignedFetch :: Response :: `, response);
            // log(response.json());
        } catch (error) {
            if ( this.debug ) log(`submitSignedFetch :: Error :: ${error}`);
        }
        
    }


    /**
     * Fetches the config data from the Swivel Meta API
     * @param projectId - The project ID to fetch the config for
     * @returns The config data in JSON format
 */
    private async getConfigData( projectId: string ) {
        const request = 
        `{
            getProjectByUrlName(urlName: "${projectId}") {
                config
            }
        }`

        return this.fetchQuery(request)
        .then((response) => response.json())
        .then((res) => {
            if (res.data) { return res.data; } 
            else { return res; }
        }).catch((error) => log(error));
    }


    // Send discord notification
    private sendDiscordNotification(requestData: any) {
        return new Promise((resolve) => {
            executeTask(async () => {
                try {
                    const payload = {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    }
                    await fetch(this.discordHookURL, payload);
                    resolve('sent');
                } catch (error) {
                    if ( this.debug ) log('sendDiscordNotification :: Failed to reach URL ::', error)
                }
            }).catch((error) => {
                if ( this.debug ) log('sendDiscordNotification :: Error ::', error)
            })
        })
    }


    // Send discord notification of transferring tip amount
    private transferringTipNotificationDiscord(amount: any, address: string) {
        let message = `${this.getCurrentUtcEpochTime()}Tip of ${amount} MANA transferring to ${address}`;
        let params = {
            content: message
        };
        this.sendDiscordNotification(params)
    }

    // Send discord notification of successfully transaction completion
    private transferTipCompletionNotificationDiscord(address: string) {
        let message = `${this.getCurrentUtcEpochTime()}Tip successfully transferred to ${address}`;
        let params = {
            content: message
        };
        this.sendDiscordNotification(params)
    }

    // Send discord notification
    private generalNotificationDiscord(message: any) {
        message = this.getCurrentUtcEpochTime().concat(message);
        let params = {
            content: message
        };
        this.sendDiscordNotification(params)
    }

    // get current date and time
    public getCurrentUtcEpochTime() {
        let currentTimeStamp = Math.round(Date.now() / 1000);
        // Here discord message syntax <t: epochtime :f>
        // t = define for time zone
        // f = define for format  [format can be = f,F,R,D,d,T,t]
        return `<t:${currentTimeStamp}:D><t:${currentTimeStamp}:T> | `;
    }


    // Send user details notification
    public async sendUserDetailsNotification(operationType: any, userId: any): Promise<void> {
        let userData: any = await getUserData();
        let message: any;
        // If entered and left user's id same as current logged In user's id then only send notification
        if (userData && userData.userId === userId) {
            message = `${userData.displayName}`;
            if (userData.publicKey) {
                message = message.concat(` (${userData.publicKey})`);
            }

            message = message.concat(` ${operationType} `);
            if (message) {
                this.generalNotificationDiscord(message)
            }
        }
    }

    // Create user dashboard
    public addUserActivitiesListener(projectId: string): void {
        if ( this.debug ) log("ActivitiesListener initialized");
        // Event when avatar enters scene
        onEnterSceneObservable.add(async (avatar) => {
            const player = await getUserData();
            if(player && player.userId === avatar.userId) {
                // Send user details to SM Cloud
                const postBody = await this.getVisitorDataBody(projectId);

                // User detail notification
                this.sendUserDetailsNotification(`Entered into scene | ${postBody.room_id}`, avatar.userId);
                if ( this.debug ) log("Entered into scene", avatar.userId);
            };

            
        })

        // Event when avatar leaves scene
        onLeaveSceneObservable.add(async (avatar) => {
            // User detail notification
            this.sendUserDetailsNotification("Left scene", avatar.userId);
            if ( this.debug ) log("Left scene", avatar.userId);
        })

        // Event when avatar connects
        onPlayerConnectedObservable.add((avatar) => {
            if ( this.debug ) log("new avatar connected :: ", avatar.userId);
        })

        // Event when avatar disconnects -- other connected players got this event
        onPlayerDisconnectedObservable.add((avatar) => {
            // log("avatar disconnected: ", avatar.userId)
            this.sendUserDetailsNotification("Disconnected", avatar.userId);
        })
    }

    private async getVisitorDataBody(projectId: string): Promise<VisitorData> {
        let userData: any = await getUserData();
        let realm = await getCurrentRealm();
        let parcel = await getParcel();
        let roomId = parcel.land.sceneJsonData.scene.base;
        let platform = await getPlatform()

        let visitorData: VisitorData = {
            display_name: userData.displayName,
            wallet_address: userData.publicKey !== null ? userData.publicKey : "",
            room_id: `${realm?.displayName} | ${roomId}`,
            scene_id: projectId,
            device: {
                type: platform,
                device_address:"",
                device_detail: ""
            }
        }

        if ( this.debug ) log("visitorData :: ", visitorData);
        return visitorData;
    }

    private assembleVisitorData( visitor: VisitorData ) {
        
        return `mutation {
            createVisitor(visitor:{
            
            display_name: "${visitor.display_name}",
            email: "",
            wallet_address: "${visitor.wallet_address}",
            room_id: "${visitor.room_id}",
            scene_id: "${visitor.scene_id}",
            space_time: null,
            device: {
            type: "${visitor.device?.type}",
            device_address: "${visitor.device?.device_address}",
            device_detail: "${visitor.device?.device_detail}",
            }

            })
            {
            visitor_id
            }
            }`
            
    }

    private async parseConfigData(): Promise<SwivelMetaConfig> {
        return new Promise( async (resolve, reject) => {
            let debug = false
            if ( this.debug ) debug = this.debug;
            try {
                // fetch the config data
                const result = await this.getConfigData( this.projectId )
                .then( res => JSON.parse(res.getProjectByUrlName.config) )
                .then( config => { if ( config ) return config } )
            
                if ( debug ) log("Swivel Meta Config Data: ", result)
                // return the config data
                const config = result ? result.sm_config_pack.components as SwivelMetaConfig : undefined;
                debug ? log("components :: ", config ) : null 
                log("components :: ", config )

                resolve( config );
            } catch (error) {
                reject( error );
            }
        })
    }

    public async updateMediaOnSceneLoad( assign: { component: string; object: any }[], debug?: boolean ): Promise<void> {
        this.componentObjectPairs = assign;
        let Components: SwivelMetaConfig;
        if ( this.debug ) debug = this.debug;

        // fetch and parse the Config Data
        Components = await this.parseConfigData();
    
        // assign the components to the corresponding entities
        for (let element of assign ){
        // assign.forEach(element => {
            const currentComp = Components[element.component]; // current component from the config data
            const currentMedia = currentComp["parameters"][0].default_value; // current value from the current component
            const currentEntity = element.object; // current entity from the scene
    
            if ( debug ) log("updateMediaOnSceneLoad :: currentMedia :: ", currentMedia);
            if ( debug ) log("updateMediaOnSceneLoad :: currentEntity.name :: ", currentEntity.name);
            if ( debug ) log("updateMediaOnSceneLoad :: element.component :: ", currentComp);
            if ( currentMedia === "" ) continue; // skip this iteration and continue loop, if the current media is empty
    
            // check if the current object is an entity
            if ( currentEntity instanceof Entity ) {
                // check the component type and assign the value to the corresponding component
                if ( currentComp["component_type"] === "dynamic-media" ){
                    if( currentEntity instanceof DynamicMedia ){
                        // boolean to check if the media is a video
                        const bVideoType: boolean = currentMedia.endsWith(".mp4") || currentMedia.endsWith(".webm") || currentMedia.endsWith(".ogg") || currentMedia.endsWith(".m3u8") ? true : false;

                        currentEntity.video !== undefined ? currentEntity.video : currentEntity.video = new VideoClip("");
                        const temp_currentEntity_texture = currentEntity.texture instanceof Texture ? currentEntity.texture.src.split("/") : [""];
                        const temp_currentMedia = currentMedia.split("/");
                        // exit current forEach loop if the current media is already assigned to the entity
                        if ( ( !this.bLoadOnEnter && currentEntity.video.url === currentMedia ) ||
                        ( !this.bLoadOnEnter && currentEntity.texture instanceof Texture && temp_currentEntity_texture[temp_currentEntity_texture.length - 1] === temp_currentMedia[temp_currentMedia.length - 1] ) )
                        { continue };
                        
                        // LOGGING
                        bVideoType && debug
                        ?
                        log("------------ BEFORE UPDATE ------------\n", currentEntity.name, "\n currentMedia: ", currentMedia, "\n currentEntity.video.url: ", currentEntity.video.url)
                        :
                        currentEntity.texture instanceof Texture ?
                        log("------------ BEFORE UPDATE ------------\n", currentEntity.name, "\n currentMedia: ", temp_currentMedia[temp_currentMedia.length - 1], "\n currentEntity.texture.src: ", temp_currentEntity_texture[temp_currentEntity_texture.length - 1])
                        : 
                        null;
                        
                        
                        
                        // assign the current media to the entity
                        if ( bVideoType ) currentEntity.updateMedia( new VideoClip(currentMedia) ); // MEDIA_TYPE IS A VIDEO
                        else currentEntity.updateMedia( new Texture(currentMedia) ); // MEDIA_TYPE IS A TEXTURE
                        
                        // LOGGING
                        bVideoType && debug
                        ?
                        log("------------ AFTER UPDATE ------------\n", currentEntity.name, "\n currentMedia: ", currentMedia, "\n currentEntity.video.url: ", currentEntity.video.url) 
                        :
                        currentEntity.texture instanceof Texture 
                        ?
                        log("------------ AFTER UPDATE ------------\n", currentEntity.name, "\n currentMedia: ", temp_currentMedia[temp_currentMedia.length - 1], "\n currentEntity.texture.src: ", temp_currentEntity_texture[temp_currentEntity_texture.length - 1]) 
                        : 
                        null;
                    };
                } 
                // check if the component type is a dynamic link
                else if ( currentComp["component_type"] === "dynamic-link" ) {
                    // check if the current entity has a OnPointerDown component
                    if ( currentEntity.getComponentOrNull(OnPointerDown) !== null ) {
                        // Current Media is a URL with Decentraland Coordinates
                        if ( currentMedia.search("decentraland") !== -1 ){ 
                            // get the position
                            var position = currentMedia.split("/?")[1].split("&")[0].split("=")[1].split("%2C") 
                            
                            // set OnPointerDown callback to teleport to a parcel location
                            if( position ) { 
                                currentEntity.getComponent(OnPointerDown).callback = () => { teleportTo(`${position[0]},${position[1]}`); };
                                // set hover text
                                currentEntity.getComponent(OnPointerDown).hoverText = `TeleportTo: ${position[0]}, ${position[1]}`;
                            }
                        } 
                        // Current Media is a URL
                        else if ( currentMedia.startsWith("https://") || currentMedia.startsWith("http://") ) 
                        {
                            // set OnPointerDown callback to open URL
                            currentEntity.getComponent(OnPointerDown).callback = () => { openExternalURL(currentMedia); };
                            // set hover text
                            currentEntity.getComponent(OnPointerDown).hoverText = currentMedia.split("/")[ currentMedia.split("/").length - 1 ]; // set the hover text to the last part of the URL
                            // currentEntity.getComponentOrNull(OnPointerDown).hoverText = currentMedia.split("/")[2]; // set the hover text to the domain name
        
                        } 
                        // Current Media contains Decentraland Coordinates
                        else if ( Number( currentMedia.split(",")[0] ) != NaN ) {
                            position = currentMedia.split(",") // get the position
                            // set OnPointerDown callback to teleport to a parcel location
                            currentEntity.getComponent(OnPointerDown).callback = () => { teleportTo(`${position[0]},${position[1]}`); };
                            // set hover text
                            currentEntity.getComponent(OnPointerDown).hoverText = `TeleportTo: ${position[0]}, ${position[1]}`;
                        }
        
                    };
                };
            } // end of if ( currentEntity instanceof Entity )
            
            else { 
                // switch case for the current entity
                switch ( (typeof currentMedia).toString() ) {
                    // if the current entity is a string
                    case "string":
                        
                        const bCurrentMedia: boolean = currentMedia.toLowerCase() == "true" || currentMedia.toLowerCase() == "t" || currentMedia.toLowerCase() == "1"
                        ? true : currentMedia.toLowerCase() === "false" || currentMedia.toLowerCase() === "f" || currentMedia.toLowerCase() == "0" ? false : true;
                        // log("typeof currentMedia: " , typeof currentMedia, bCurrentMedia)
                        if ( currentComp.name.startsWith("Enable") || bCurrentMedia ) {
                            if ( currentEntity instanceof EnableDisable ){
                                currentEntity.bEnable = bCurrentMedia
                                log("currentEntity: ", currentEntity)
                            }
                        }
                        
                        break;
                }
            }

        }
        // ); // end of forEach loop
        
    }

    public async updateMediaOnSceneEnter( assign: { component: string; object: any }[] ) {
        let count = 0;
        onEnterSceneObservable.add( async () => {
            if ( count > 0 ){
                this.debug ? log("updateMediaOnSceneEnter :: bSceneUpdateOnParcelEnter :: UPDATE ENTITIES ON SCENE ENTER") : null;
                await this.updateMediaOnSceneLoad( assign, this.debug );
            }
            this.debug ? log("updateMediaOnSceneEnter :: bSceneUpdateOnParcelEnterCount :: ", count) : null;
        log("updateMediaOnSceneEnter :: bSceneUpdateOnParcelEnterCount :: ", count)
            count++;
        });

    }

}


 /**

 // create a new instance of the class
 export const SMService = new SwivelMetaServices(
     projectId,
     debug
 );

*/
