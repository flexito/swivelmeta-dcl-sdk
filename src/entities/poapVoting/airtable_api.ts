const baseID = 'appJbqbiBRfWW5TlP' // project ID
const tableVotes = 'tbllAWTcHOQMu59Sj' // table ID for record tracking
const voterView_1 = 'fields%5B%5D=fld7y7JC6P7NLTJPc&view=viwWdhuZCGUlBQNm0'
const voterView_2 = 'fields%5B%5D=fld7y7JC6P7NLTJPc&view=viwjh0v9wbuv5ktq7'
const tableCount = 'tblELFxOW9NT48sRS' // for keeping track of the count
const recordID_1 = 'rec9Drd4KgkD5e3JH' // record ID for VOTE_ID 1
const recordID_2 = 'recYTOkptzJCzVFLl' // record ID for VOTE_ID 2


var voterBase = `https://api.airtable.com/v0/${baseID}/${tableVotes}?`
const countBase = `https://api.airtable.com/v0/${baseID}/${tableCount}`

function voterBody(voteID, walletAddress, displayName, realm, date) {
    return {"fields": {
        "fld7y7JC6P7NLTJPc": voteID,
        "fldqtVTQTHSxr5EUg": walletAddress,
        "fldxdgVbogYogGr5D": displayName,
        "fldIjsaMMIoCzVZQm": realm,
        "fld01wJdNpGaaxGsN": date,
      }}
}

function assemblePayload(
    Method?: string,
    Body?: {},
    Headers?: {[index: string]: string},
){
    const header: {} = Headers 
    ? Headers 
    : { 'Authorization': 'Bearer keyvlZgFCNiTJmi0P',
        'Accept': 'application/json',
        'Content-Type': 'application/json' }

    return {
        method: Method,
        headers: header,
        body: JSON.stringify(Body)
    }
}

function assembleUrl(
    base,
    payload?,
    view?,
) {
    return ([`${base}`, payload])
}



export async function addVoter(
    voteID,
    walletAddress,
    displayName,
    realm,
    date
) { 
    let url = assembleUrl(
        voterBase, 
        assemblePayload(
            'POST', 
            voterBody(voteID, walletAddress, displayName, realm, date)
        )
    )
    let response = await fetch(url[0], url[1])
    let json = await response.json()

    return response
}


export async function updateCount(
    ID: '1' | '2',
): Promise<string> {
    const getbase = ID === '1' 
    ? `${voterBase}${voterView_1}`
    : `${voterBase}${voterView_2}`
    // log(`getbase: ${getbase}`)
    const getPayload = assemblePayload('GET')
    const getUrl = assembleUrl(getbase, getPayload)
    
    const updateBase = ID === '1'
    ? `${countBase}/${recordID_1}?`
    : `${countBase}/${recordID_2}?`
    // log(`update base: ${updateBase}`)
    
    // get the updated count
    let response = await fetch(getUrl[0], getUrl[1])
    let json = await response.json()
    const updatedCount = json.records.map(x => x.fields.VoteID).length.toString()
    // log(`get response: `, updatedCount)
    
    // update the count
    const updatePayload = assemblePayload(
        'PATCH', { 
            "fields": {
                "fldiKxv6dez2R3Wwa": updatedCount
            }
        }
    )
    const updateUrl = assembleUrl(updateBase, updatePayload)
    response = await fetch(updateUrl[0], updateUrl[1])
    // log(`update response: `, response)
    return updatedCount
}

