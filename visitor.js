import {listOutputs,getTransaction} from "./chain.js";

export function visitor() {
    const keys = document.location.search.substr("?visitor=".length).split(",")
    const visitor = {
        publicKey: keys[0],
        privatekey: keys[1],
        tokens: []
    }
    listOutputs(visitor.publicKey).then(outputs => {
        Promise.all(outputs.map(output => getTransaction(output.transaction_id))).then(txs => {
            if (txs.length !== 1) {
                console.warn("Should have exactly one tx with unspent output, but found: ", txs)
            }
            const amount = txs[0].outputs[1].amount
            visitor.tokens.push({
                amount,
                id: txs[0].id,
            })
            document.getElementById("tokens").innerText=amount;
            return visitor
        })
    })
}

export function vote() {

}