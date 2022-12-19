import * as dclTx from "decentraland-transactions";

// export const allCollections = async () => {
//   return fetchGraph({
//     operationName: "Wearables",
//     variables: {
//       first: 1000,
//       skip: 0,
//     },
//     query: `query Wearables($first: Int, $skip: Int) {\ncollections(first: $first, skip: $skip) {\nid\nname\nisApproved\nminters\nowner\nurn\nitems {\nimage\nprice\nrarity\navailable\nmaxSupply\nblockchainId\nurn\n}\n}\n}`,
//   })
//     .then((r) => r.json())
//     .then((r) => {
//       if (r.data) {
//         return r.data;
//       } else {
//         return r;
//       }
//     })
//     .catch((error) => log(error));
// };

// export const storeCollections = async (
//   storeAddress: string = dclTx.getContract(dclTx.ContractName.CollectionStore, 137).address.toLowerCase(),
//   isApproved: boolean = true
// ) => {
//   const result = await fetchGraph({
//     operationName: "Wearables",
//     variables: {
//       first: 1000,
//       skip: 0,
//       storeAddress: storeAddress,
//     },
//     query: `query Wearables($first: Int, $skip: Int, $storeAddress: String) {\ncollections(first: $first, skip: $skip, where:{minters_contains:["${storeAddress}"], isApproved: ${isApproved}}) {\nid\nname\nisApproved\nowner\nurn\nitems {\nmetadata{wearable{name}}\nimage\nprice\nrarity\navailable\nmaxSupply\nblockchainId\nurn\n}\n}\n}`,
//   });
//   const json = await result.json();
//   log(json);
//   return json.data as { collections: Collections };
// };

export const collection = async (collectionURN: string, network?: "matic" | "eth", test: boolean = false) => {
  const result = await fetchGraph({
    operationName: "Wearables",
    variables: {
      first: 1,
      skip: 0,
      urn: collectionURN,
    },
    query: `query Wearables($first: Int, $skip: Int, $urn: String) {\ncollections(first: $first, skip: $skip, where:{urn: $urn}) {\nid\nname\nisApproved\nowner\nurn\nitems {\nmetadata{wearable{name}}\nimage\nprice\nrarity\navailable\nmaxSupply\nblockchainId\nurn\n}\n}\n}`,
  }, 
  network, test);
  const json = await result.json();
//   log("fetch collectionURN: ", json);
  if (json.data) {
    return json.data.collections[0];
  } else {
    return undefined;
  }
};

// export const item = async (itemURN: string) => {
//   return fetchGraph({
//     operationName: "Wearables",
//     variables: {
//       first: 1000,
//       skip: 0,
//       urn: itemURN,
//     },
//     query: `query Wearables($first: Int, $skip: Int, $urn: String) {\nitems(first: $first, skip: $skip, where:{urn: $urn}) {\nimage\nprice\nrarity\navailable\nmaxSupply\nblockchainId\nurn\n}\n}`,
//   })
//     .then((r) => r.json())
//     .then((r) => {
//       if (r.data) {
//         return r.data;
//       } else {
//         return r;
//       }
//     })
//     .catch((error) => log(error));
// };

async function fetchGraph(
    request: Object, 
    network?: "matic" | "eth",
    test: boolean = false,
) {
    let url = network === "matic" ? 
    "https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet" :
    "https://thegraph.com/explorer/subgraph/decentraland/collections-ethereum-mainnet";

    if (test) {
        url = network === "matic" ? 
        "https://thegraph.com/explorer/subgraph/decentraland/collections-matic-mumbai" : 
        "https://thegraph.com/explorer/subgraph/decentraland/collections-ethereum-ropsten";
    }
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export type Collection = {
  id: string;
  items: {
    available: string;
    blockchainId: string;
    image: string;
    maxSupply: string;
    price: string;
    rarity: string;
    urn: string;
    metadata: { wearable: { name: string } };
  }[];
  name: string;
  owner: string;
  urn: string;
};

export type Collections = Array<Collection>;
