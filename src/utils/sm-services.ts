/**
 * @version: Swivel Meta SDK Version: 0.3.0
 * @author: Mark Fernandez
 * @company Swivel Meta
 * @desc: A suite of functions to interact with the Swivel Meta API
 */


 import { getUserData, UserData } from "@decentraland/Identity"
 import {
     getCurrentRealm,
     getPlatform,
     Platform,
 } from "@decentraland/EnvironmentAPI";
 import { getParcel } from "@decentraland/ParcelIdentity";
 import { DynamicMedia } from "../entities/dynamicMedia";
 import { EnableDisable } from "./utilsLib";



/** 
 * Default Discord Hook Url, incase the user does not provide one
 * [ default url, backup ] used for testing
*/
const fallback_discordHookUrl = 'https://discord.com/api/webhooks/969637646303379456/AJFBuiVxj-l4ZesqY3vYIaUizncO2Vlf6hdyJMHf06YE_sRNfs1KnY7pfRSOJHzy2NQ8';
 
 

/**
 * Swivel Meta Services, a class used to interact with Swivel Meta API. 
 * Allows you to fetch data from Swivel Meta API, update components, and send user data to Swivel Meta Cloud for analytics.
 * 
 * @param projectId - The project ID to fetch data from Swivel Meta API.
 * @param debug - Enable/Disable debug mode.
 * @param bInitializeDiscord - Enable/Disable discord callback.
 * @param bLoadOnEnter - Enable/Disable loading components when a user enters the scene.
 * @public
 */
export class SwivelMetaServices extends Entity {
    private apiURL: string;
    public projectId: string;
    public startTime: Date;
    public endTime?: Date;
    public debug: boolean;

    private discordHookURL: string = fallback_discordHookUrl;

    public userData: UserData;
    public sceneName?: string;
    public display_name?: string;
    public wallet_address?: string;
    public room_id?: string;
    public guest?: boolean;
    public platform?: string;
    public realm?: string;
    public parcels?: string;

    // initialize discord callback
    public bInitializeDiscord: boolean;
    // load components on scene enter
    public  bLoadOnEnter: boolean;
    
    public componentObjectPairs: ComponentObjectPairs[] = [];
    public once: boolean = true;

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
        this.InitializeVisitorData();

    }


    /**
     * Initialize Swivel Meta SDK. This function will get the discordHookUrl from Swivel Meta API 
     * then add a listener to the scene which will ping your discord and send the user details to Swivel Meta Cloud
     * 
     * @param projectId - The project ID to fetch the configuration for.
     */
    private async InitializeSwivelMetaServices( projectId: string ): Promise<void> {
        // Get userData
        this.userData = await getUserData();

        // check if bInitDiscord is false, if so, don't initialize discord
        if (!this.bInitializeDiscord) {
            log('InitializeSwivelMetaServices :: \nbInitDiscord is false, skipping discord initialization!');
            return;
        }

        // Get Discord Hook URL
        try {
            if( await this.getDiscordCallbackUrl(projectId) ) {
                this.debugLog('Discord Hook URL ::', this.discordHookURL);
                this.addUserActivitiesListener();
            }
        } catch (error) {
            // LOGGING
            this.debugLog(
                'InitializeSwivelMetaServices :: Failed to reach URL ::\n', 
                error
            );
            
            // THROW ERROR
            throw new Error(
                `InitializeSwivelMetaServices :: Failed to get discord hook URL ::
                \n${error}`
            );
        }
    }


    /**
     * Add a listener to the scene which will ping your discord and send the user details to Swivel Meta Cloud.
     * 
     * @public
     */
    public async InitializeVisitorData(): Promise<void> {
        const player = this.userData;
            if(player && player.userId) {
                // Send user details to SM Cloud
                const postBody = await this.getVisitorDataBody();
                // Assemble visitor data into a JSON object
                const assembledBody = this.assembleVisitorData(postBody);
                // Send visitor data to Swivel Meta Cloud
                await this.submitFetch( assembledBody );
                this.debugLog("onEnterSceneObservable :: assembleVisitorData ::", assembledBody);
            }
    }


    /**
     * Get the Discord Hook URL from Swivel Meta API.
     * 
     * @param projectName - The project ID to pull the Discord Callback Url for.
     * @returns Promise<string> - The Discord Hook URL.
     */
    private getDiscordCallbackUrl(projectName: string): Promise<string> {
        return new Promise(async (resolve) =>{
            // Assembly query body
            const queryBody = `{
                    getProjectByUrlName(urlName: "${projectName}") {
                    discord_callback_url
                    }
                    }`
                        
            this.debugLog('getDiscordCallbackUrl :: queryBody :: ', queryBody);

            // Fetch discord callback url and process response
            await this.fetchQuery( queryBody )
            .then(response => response.json())
            .then(data => {

                const discordCallback = data.data.getProjectByUrlName.discord_callback_url;

                if (discordCallback === "") { 
                    this.discordHookURL = fallback_discordHookUrl
                    return resolve(this.discordHookURL);
                };
                
                this.discordHookURL = discordCallback;
                this.debugLog('getDiscordCallbackUrl :: discordHookUrl ::', this.discordHookURL);
                resolve(this.discordHookURL);
                
            })
            .catch((error) => {
                this.debugLog('getDiscordCallbackUrl :: Error ::', error);
                this.discordHookURL = fallback_discordHookUrl; // set default_discord
                throw new Error("Couldn't initialize discord callback! Setting discordHookURL to a fallback value.")
            });
        });
        
    }


    /**
     * Creates a new fetch request to the Swivel Meta API. Used to query the API for data.
     * 
     * @param request - The request object to send to the API.
     * @returns - The payload for the request.
    */
    private async fetchQuery( request: Object ): Promise<Response> {
        return fetch(
            this.apiURL, 
            {
                method: "POST",
                headers: {
                    Accept:  "application/json, text/plain, image/*, */*",
                    Origin: "https://play.decentraland.org",
                    ContentType: "application/json",
                },
                body: request.toString(),
            });
    }

    /** Use Decentraland built in fetch function to fetch data from the Swivel API.
     * Url: https://prod-swivelmeta.com/core2/query
     * Method: POST
     * Allow Headers: Accept, Origin
     * Origin: https://play.decentraland.org
    */


    /**
     * Send a request to the Swivel Meta Analytics to store the visitor data.
     * 
     * @param postBody - The body of the request to send to the Swivel Meta API.
     */
    private async submitFetch( postBody: any ): Promise<boolean>{
        try {

            const response = await fetch(
                this.apiURL, {
                method: 'POST',
                headers: {
                    "Accept":  "application/json, text/plain, image/*, */*",
                    // 'Content-Type': 'application/json'
                },
                body: postBody.toString()
            })
            .then(response => response.json()) // parse JSON from request
            .then(data => { this.debugLog(data); return true; }) // log the result
            .catch((error) => { this.debugLog(error); return false; }) // log any errors

            return response;

        } catch (error) {
            this.debugLog(`submitSignedFetch :: Error :: ${error}`);
            try {
                throw new Error(`submitSignedFetch :: Error :: ${error}`);
            } catch (error) {
                log(error);
            }
            return false;
        }
        
    }


    /**
     * Fetches the config data from the Swivel Meta API.
     * @param projectId - The project ID to fetch the config for.
     * @returns - The config data in JSON format.
 */
    private async getConfigData( projectId: string ) {
        // Assemble request to get config data
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
        }).catch((error) => {
            log(error)
            try {
                throw new Error(`getConfigData :: Error :: ${error}`);
            } catch (error) {
                log(error)
            }
        });
    }



    /**
     * Send a notification to the Discord webhook.
     * 
     * @param requestData - The data to send to the Discord webhook.
     */
    private sendDiscordNotification(requestData: any): Promise<any> {
        return new Promise(async (resolve): Promise<void> => {
            try {
                const payload = {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                }
                const response = await fetch(this.discordHookURL, payload);
                this.debugLog('sendDiscordNotification :: response ::', response);
                resolve('sent');
                // resolve(response);
            } catch (error) {
                this.debugLog('sendDiscordNotification :: Failed to reach URL ::', error)
                // try to throw error
                try {
                    throw new Error(`sendDiscordNotification :: Failed to reach URL :: ${error}`);
                } catch (error) {
                    log(error);
                }
            }
        })
    }


    /**
     * Send discord notification of the amount of MANA being transferred and the wallet address receiving the MANA.
     * 
     * @param amount - The amount of MANA to transferred.
     * @param address - The wallet address receiving the MANA.
     */
    private transferringTipNotificationDiscord(amount: any, address: string): void {
        let message = `${this.getCurrentUtcEpochTime()}Tip of ${amount} MANA transferring to ${address}`;
        let params = {
            content: message
        };
        this.sendDiscordNotification(params)
    }


    /**
     * Send discord notification of successfully transaction completion
     * 
     * @param address - The wallet address that received the MANA.
     */
    private transferTipCompletionNotificationDiscord(address: string): void {
        let message = `${this.getCurrentUtcEpochTime()}Tip successfully transferred to ${address}`;
        let params = {
            content: message
        };
        this.sendDiscordNotification(params)
    }


    /**
     * Send a general notification to the Discord webhook. This is used for sending miscellaneous notifications.
     * 
     * @param message - The message to send to the Discord webhook.
     */
    private generalNotificationDiscord(message: any): void {
        message = this.getCurrentUtcEpochTime().concat(message);
        let params = {
            content: message
        };
        this.sendDiscordNotification(params)
    }


    /**
     * Get the current date and time in UTC epoch time format.
     * 
     * @returns - The current date and time in UTC epoch time format.
     */
    public getCurrentUtcEpochTime(): string {
        let currentTimeStamp = Math.round(Date.now() / 1000);
        // Here discord message syntax <t: epochtime :f>
        // t = define for time zone
        // f = define for format  [format can be = f,F,R,D,d,T,t]
        return `<t:${currentTimeStamp}:D><t:${currentTimeStamp}:T> \n`;
    }



    /**
     * Send a notification to the Discord webhook with the user's details and the action/activity they performed.
     * 
     * @param operationType - The operation type to send to the Discord webhook. This could be 'entered' or 'left' the scene or claiming a POAP.
     * @param userId - The user ID to send to the Discord webhook.
     */
    public async sendUserDetailsNotification(operationType: any, userId: any): Promise<void> {
        const userData = this.userData;
        let message: any;

        // If entered and left user's id same as current logged In user's id then only send notification
        if (userData && userData.userId === userId) {
            message = `DisplayName: ${userData.displayName}\n`;
            if (userData.publicKey) {
                message = message.concat(`Address: (${userData.publicKey}) \n`);
            }

            message = message.concat(`Message: \n${operationType}`);
            if (message) {
                this.generalNotificationDiscord(message)
            }
        }
    }

    /**
     * Add the listener for the user's activities. Like when the user enters the scene or leaves the scene.
     * 
     * @public
     */
    public addUserActivitiesListener(): void {
        if ( this.debug ) log("ActivitiesListener initialized");
        
        // Event when avatar enters scene
        onEnterSceneObservable.add(async (avatar) => {
            const player = this.userData;

            if(player && player.userId === avatar.userId) {

                // Send user details to SM Cloud
                const postBody = await this.getVisitorDataBody();

                // split room id
                const splitRoomId = postBody.room_id.split(' | ');
                const currentRealm = splitRoomId[0]
                const dclParcel = splitRoomId[1].split(',');



                // User detail notification
                this.sendUserDetailsNotification(
                    `
                    Entered into scene | ${postBody.room_id} | \n 
                    https://play.decentraland.org/?position=${dclParcel[0]}%2C${dclParcel[0]}&realm=${currentRealm}
                    `,
                    avatar.userId
                );
                this.debugLog("Entered into scene", avatar.userId);
            };
        })

        // Event when avatar leaves scene
        onLeaveSceneObservable.add(async (avatar) => {
            // User detail notification
            this.sendUserDetailsNotification("Left scene", avatar.userId);
            this.debugLog("Left scene", avatar.userId);
        })

        // Event when avatar connects
        onPlayerConnectedObservable.add((avatar) => {
            this.debugLog("new avatar connected :: ", avatar.userId);
        })

        // Event when avatar disconnects -- other connected players got this event
        onPlayerDisconnectedObservable.add((avatar) => {
            this.sendUserDetailsNotification("Disconnected", avatar.userId);
        })
    }

    /**
     * Get scene and user details to assemble into a visitor data object. Used for sending visitor data to Swivel Meta Analytics.
     * 
     * @returns VisitorData - The data object that contains all the visitor data that is collected.
     */
    private async getVisitorDataBody(): Promise<VisitorData> {
        let userData: any = this.userData;
        let realm = await getCurrentRealm();
        let parcel = await getParcel();
        let roomId = parcel.land.sceneJsonData.scene.base;
        let platform = await getPlatform()

        let visitorData: VisitorData = {
            display_name: userData.displayName,
            wallet_address: userData.publicKey !== null ? userData.publicKey : "",
            room_id: `${realm?.displayName} | ${roomId}`,
            scene_id: this.projectId,
            device: {
                type: platform,
                device_address:"",
                device_detail: ""
            }
        }

        this.debugLog("visitorData :: ", visitorData);
        return visitorData;
    }

    /**
     * Assembles visitor data to be sent to Swivel Meta Analytics Service.
     * 
     * @param visitor - Data of the user and scene details.
     * @returns - Stringified visitor data.
     * 
     */
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


    /**
     * Get the Swivel Meta Config Data from the Swivel Meta API.
     * 
     * @returns - Swivel Meta Config Data
     * @throws - Error if the config data is undefined.
     * 
     * @public
     */
    public async parseConfigData(): Promise<SwivelMetaConfig> {
        return new Promise( async (resolve, reject) => {
            
            try {
                // fetch the config data
                const result = await this.getConfigData( this.projectId )
                .then( res => JSON.parse(res.getProjectByUrlName.config) )
                .then( config => { if ( config ) return config } )
            
                this.debugLog("Swivel Meta Config Data: ", result)

                // return the config data
                const config = result.sm_config_pack.components as SwivelMetaConfig;

                // check if the config data is undefined
                if ( config === undefined ) {
                    reject( "Swivel Meta Config Data is undefined" )
                    throw new Error("Swivel Meta Config Data is undefined")
                }

                this.debugLog("Swivel Meta Components Data :: ", config ) 
                resolve( config );

            } catch (error) {
                reject( error );
            }
        })
    }

    /**
     * This function is used to update the media when the scene load.
     * 
     * @param assign - The pairing of, components to be assigned to the entities.
     * @param debug - Debug mode, default is false.
     * 
     * @example //Usage example
     * const componentEntityPairs = [ { component: "mainVideoScreen", object: videoScreen }, { component: "ExampleComponent2", object: ExampleDynamicMedia2 } ];
     * updateMediaOnSceneLoad( componentEntityPairs );
     * 
     * @public
     */
    public async updateMediaOnSceneLoad( assign: { component: string; object: any }[], debug: boolean = false ): Promise<void> {
        this.componentObjectPairs = assign;
        let Components: SwivelMetaConfig;
        if ( this.debug ) debug = this.debug;

        // fetch and parse the Config Data
        Components = await this.parseConfigData();
    
        // assign the components to the corresponding entities
        for (let element of assign ){
            // current component from the config data
            const currentComp = Components[element.component];
            // current value from the current component
            const currentMedia = currentComp["parameters"][0].default_value;
            // current entity from the scene
            const currentEntity = element.object;
    
            this.debugLog("updateMediaOnSceneLoad :: currentMedia :: ", currentMedia);
            this.debugLog("updateMediaOnSceneLoad :: currentEntity.name :: ", currentEntity.name);
            this.debugLog("updateMediaOnSceneLoad :: element.component :: ", currentComp);
            
            // skip this iteration and continue loop, if the current media is empty
            if ( currentMedia === "" ) continue;
    
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
                        
                        //** LOGGING */
                        if( bVideoType )
                        {
                            this.debugLog(
                                "------------ BEFORE UPDATE ------------\n", 
                                currentEntity.name, "\n currentMedia: ", 
                                currentMedia, 
                                "\n currentEntity.video.url: ", 
                                currentEntity.video.url
                            )
                        }
                        if ( currentEntity.texture instanceof Texture )
                        {
                            this.debugLog(
                                "------------ BEFORE UPDATE ------------\n", 
                                currentEntity.name, "\n currentMedia: ", 
                                temp_currentMedia[temp_currentMedia.length - 1], 
                                "\n currentEntity.texture.src: ", 
                                temp_currentEntity_texture[temp_currentEntity_texture.length - 1]
                            )
                        }

                        
                        
                        
                        // assign the current media to the entity
                        if ( bVideoType ) currentEntity.updateMedia( new VideoClip(currentMedia) ); // MEDIA_TYPE IS A VIDEO
                        else currentEntity.updateMedia( new Texture(currentMedia) ); // MEDIA_TYPE IS A TEXTURE
                        
                        //** LOGGING */ 
                        if( bVideoType )
                        {
                            this.debugLog(
                                "------------ AFTER UPDATE ------------\n", 
                                currentEntity.name, "\n currentMedia: ", 
                                currentMedia, "\n currentEntity.video.url: ", 
                                currentEntity.video.url
                            ) 
                        }
                        if ( currentEntity.texture instanceof Texture )
                        { 
                            this.debugLog(
                                "------------ AFTER UPDATE ------------\n", 
                                currentEntity.name, 
                                "\n currentMedia: ", 
                                temp_currentMedia[temp_currentMedia.length - 1], 
                                "\n currentEntity.texture.src: ", 
                                temp_currentEntity_texture[temp_currentEntity_texture.length - 1]
                            ) 
                        } 
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
                        // Check if Current Media contains Decentraland Coordinates
                        else if ( isNaN( currentMedia.split(",")[0] ) ) {
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
                // log("typeof currentMedia: " , typeof currentMedia, bCurrentMedia)
                // switch case for the current entity
                switch ( (typeof currentMedia).toString() ) {
                    // if the current entity is a string
                    case "string":
                        
                        const bCurrentMedia: boolean = 
                        currentMedia.toLowerCase() === "true" || 
                        currentMedia.toLowerCase() === "t" || 
                        currentMedia.toLowerCase() == '1'
                        ? true 
                        : 
                        currentMedia.toLowerCase() === "false" || 
                        currentMedia.toLowerCase() === "f" || 
                        currentMedia.toLowerCase() == "0" 
                        ? false : true;
                        
                        if ( currentComp.name.startsWith("Enable") || bCurrentMedia ) {
                            if ( currentEntity instanceof EnableDisable ){
                                currentEntity.bEnable = bCurrentMedia
                                this.debugLog("currentEntity: ", currentEntity)
                            }
                        }
                        
                        break;
                    
                    default:
                        this.debugLog("updateMediaOnSceneLoad :: default :: ", currentMedia, currentComp.name);
                        break;
                }
            }

        }
        // ); // end of forEach loop
        
    }

    /**
     * Update the DynamicMedia when a user enters the parcel.
     * 
     * @param assign - The pairing of, components to be assigned to the entities.
     * 
     * @example //Usage example
     * const componentEntityPairs = [
     *  { component: "mainVideoScreen", object: videoScreen }
     *  { component: "ExampleComponent2", object: ExampleDynamicMedia2 }
     * ];
     * updateMediaOnSceneEnter( componentEntityPairs );
     * 
     * @public
     */
    public async updateMediaOnSceneEnter( assign: { component: string; object: any }[] ) {
        let count = 0;
        onEnterSceneObservable.add( async () => {
            if ( count > 0 ){
                this.debugLog("updateMediaOnSceneEnter :: bSceneUpdateOnParcelEnter :: UPDATE ENTITIES ON SCENE ENTER");
                await this.updateMediaOnSceneLoad( assign, this.debug );
            }
            this.debugLog("updateMediaOnSceneEnter :: bSceneUpdateOnParcelEnterCount :: ", count);
            count++;
        });

    }

    /**
     * A function to log debug messages. Only logs if the debug flag is set to true.
     */
    private debugLog( message: string, ...args: any[] ) {
        if ( this.debug ) {
            log(message, ...args);
        }
    }

}


/**
 * @fileoverview - This file contains the types for the Swivel Meta Config.
 */


/**
 * The VisitorData type, used to store the data for a visitor.
 */
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

/**
 * The ComponentData type, used to store the data for a component.
 */
interface ComponentData {
    component_type: string;
    description: string;
    name: string;
    parameters: Parameter[];
}

/**
 * The Parameter type, used to store the parameters for a component.
 */
interface Parameter {
    default_value: string;
    description: string;
    edit_scope: string;
    name: string;
    type: string;
}

/**
 * ComponentObjectPairs is a type that is used to store the pairing of a component to an object.
 */
interface ComponentObjectPairs {
    component: string;
    object: any;
}


/**
 * The Swivel Meta Config type, used to store the meta data for the Swivel Config.
 */
export type SwivelMetaConfig = { [key: string]: any };