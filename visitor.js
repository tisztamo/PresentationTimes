import {listOutputs,getTransaction} from "./chain.js";

export function visitor() {
    const keys = document.location.search.substr("?visitor=".length).split(",")
    const visitor = {
        publicKey: keys[0],
        privatekey: keys[1]
    }
    listOutputs(visitor.publicKey).then(outputs => {
        Promise.all(outputs.map(output => getTransaction(output.transaction_id))).then(txs => {
            if (txs.length !== 1) {
                console.warn("Should have exactly one tx with unspent output, but found: ", txs)
            }
            document.getElementById("tokens").innerText=txs[0].outputs[1].amount;
        })
    })
}