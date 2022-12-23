
/**
 * AirtableClient class for interacting with the Airtable API, which is used to track votes.
 * 
 * @param projectId Airtable project ID.
 * @param voterTable Airtable table ID for traking votes.
 * @param voterViews Airtable view IDs for isolating and identifying the number of votes per voteId.
 * @param counterTable Airtable table ID for keeping track of the count. This is used to keep track of the number of votes per voteId.
 * @param counterEntryField Airtable field ID for the counter table. This is field used to enter the number of votes per voteId.
 */
export class AirtableClient {
    projectId: string = 'appJbqbiBRfWW5TlP'; // project ID

    voterTable: string = 'tbllAWTcHOQMu59Sj'; // table ID for record tracking
    voterViews : string[] = [ "fields%5B%5D=fld7y7JC6P7NLTJPc&view=viwWdhuZCGUlBQNm0", "fields%5B%5D=fld7y7JC6P7NLTJPc&view=viwjh0v9wbuv5ktq7" ]
    voterFields: voterFields = 
      { 
        voteIdField: 'fld7y7JC6P7NLTJPc',
        walletAddressField: 'fldqtVTQTHSxr5EUg',
        displayNameField: 'fldxdgVbogYogGr5D',
        realmField: 'fldIjsaMMIoCzVZQm',
        dateField: 'fld01wJdNpGaaxGsN'
      }

    counterTable: string = 'tblELFxOW9NT48sRS'; // for keeping track of the count
    counterEntryField: string[] = [ "rec0lyUechkbmftzq", "reclxwMv1PSTEiJxJ" ]
  
    voterBase: string;
    countBase: string;
  
    constructor(
        { 
          projectId, 
          voterTable, 
          voterViews, 
          counterTable, 
          counterEntryField
        }: 
        {
          projectId?: string;
          voterTable?: string; 
          voterViews?: string[]; 
          counterTable?: string; 
          counterEntryField?: string[]; 
        }    
    ) {
      this.projectId = projectId ? projectId : this.projectId;
      this.voterTable = voterTable ? voterTable : this.voterTable;
      this.voterViews = voterViews ? voterViews : this.voterViews;
      this.counterTable = counterTable ? counterTable : this.counterTable;
      this.counterEntryField = counterEntryField ? counterEntryField : this.counterEntryField;

      this.voterBase = `https://api.airtable.com/v0/${this.projectId}/${this.voterTable}?`;
      this.countBase = `https://api.airtable.com/v0/${this.projectId}/${this.counterTable}`;

    }
  
    voterBody(voterData: voterObject) {
      const voteIdField = this.voterFields.voteIdField
      return {
        fields: {
          fld7y7JC6P7NLTJPc: voterData.voteId,
          fldqtVTQTHSxr5EUg: voterData.walletAddress,
          fldxdgVbogYogGr5D: voterData.displayName,
          fldIjsaMMIoCzVZQm: voterData.realm,
          fld01wJdNpGaaxGsN: voterData.date,
        },
      };
    }
  
    assemblePayload(Method?: string, Body?: {}, Headers?: { [index: string]: string }) {
      const header = Headers
        ? Headers
        : {
            Authorization: 'Bearer keyvlZgFCNiTJmi0P',
            Accept: 'application/json',
            'Content-Type': 'application/json',
          };
  
      return {
        method: Method,
        headers: header,
        body: JSON.stringify(Body),
      };
    }
  
    assembleUrl(base, payload?, view?) {
      return [`${base}`, payload];
    }
  
    async addVoter(voteID, walletAddress, displayName, realm, date) {
      const url = this.assembleUrl(
        this.voterBase,
        this.assemblePayload('POST', this.voterBody(voteID, walletAddress, displayName, realm, date))
      );
      const response = await fetch(url[0], url[1]);
      const json = await response.json();
  
      return response;
    }
  
    async updateCount(ID: number): Promise<string> {
        const getbase = ID === '1'
          ? `${this.voterBase}${this.voterView_1}`
          : `${this.voterBase}${this.voterView_2}`;
        // log(`getbase: ${getbase}`)
        const getPayload = this.assemblePayload('GET');
        const getUrl = this.assembleUrl(getbase, getPayload);
    
        const updateBase = ID === '1'
          ? `${this.countBase}/${this.recordID_1}?`
          : `${this.countBase}/${this.recordID_2}?`;
        // log(`update base: ${updateBase}`)
    
        // get the updated count
        const response = await fetch(getUrl[0], getUrl[1]);
        const json = await response.json();
        const updatedCount = json.records
          .map((x) => x.fields.VoteID)
          .length.toString();
        // log(`get response: `, updatedCount)
    
        // update the count
        const updatePayload = this.assemblePayload(
          'PATCH',
          {
            fields: {
              fldiKxv6dez2R3WG9: updatedCount,
            },
          },
          {
            Authorization: 'Bearer keyvlZgFCNiTJmi0P',
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
        );
        const updateUrl = this.assembleUrl(updateBase, updatePayload);
        // log(`update url: `, updateUrl)
        const updateResponse = await fetch(updateUrl[0], updateUrl[1]);
        const updateJson = await updateResponse.json();
    
        return updateJson;
    }
}

export type voterObject = {
    voteId: number,
    walletAddress: string,
    displayName: string,
    realm: string,
    date: string,
}

export interface voterFields {
    voteIdField: string,
    walletAddressField: string,
    displayNameField: string,
    realmField: string,
    dateField: string,
}