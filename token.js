import {me, postTransaction, getTransaction, listOutputs} from "./chain.js"

export let selectedToken = null

export function tokenLaunch(nTokens=1000000) {
    const creator = me()
    const tx = BigchainDB.Transaction.makeCreateTransaction({
            token: 'BPNT Time Token',
            number_tokens: nTokens
        },
        {
            datetime: new Date().toString()
        },
        [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction
            .makeEd25519Condition(creator.publicKey), nTokens.toString())],
        creator.publicKey
    )

    return postTransaction(tx).then(res => {
        selectedToken = {
            id: res.id,
            tokensLeft: nTokens,
            creator: creator,
            createTx: res,
        }
        saveSelectedToken()
        return selectedToken
    })
}

export function giveTokens(token, receiverPubKey, amount, metadata = null) {
   return getOwnedTokens(me().publicKey).then(ownedTokens => {
       const sourceTx = ownedTokens.transactions[0]
       const sourceAmount = Number(sourceTx.outputs[sourceTx.ownerOutputIdx].amount)
       if (sourceAmount < amount) {
           console.error("Source transaction does not contain " + amount + " tokens", sourceTx)
           return
       }
       const tx = BigchainDB.Transaction.makeTransferTransaction(
            [{
                tx: sourceTx,// TODO: handle multiple unspent outputs (if needed)
                output_index: sourceTx.ownerOutputIdx
            }],
            [BigchainDB.Transaction.makeOutput(
                BigchainDB.Transaction
                    .makeEd25519Condition(me().publicKey),
                (sourceAmount - amount).toString()),
                BigchainDB.Transaction.makeOutput(
                    BigchainDB.Transaction
                        .makeEd25519Condition(receiverPubKey),
                    amount.toString())
            ],
            metadata
        )

        return postTransaction(tx).then(tx => {
            token.tokensLeft -= amount
            selectedToken = token //TODO don't do this, persist separately
            saveSelectedToken()
            return tx
        })
    })
}

//TODO filter by token type
export function getOwnedTokens(publicKey) {
    return listOutputs(publicKey).then(outputs => {
        return Promise.all(outputs.map(output => getTransaction(output.transaction_id))).then(txs => {
            let total = 0;
            for (let i = 0; i < outputs.length; i++) {
                txs[i].ownerOutputIdx = outputs[i].output_index
                txs[i].ownerOutput = txs[i].outputs[outputs[i].output_index]
                total += Number(txs[i].ownerOutput.amount)
            }
            return {
                total,
                transactions: txs
            }
        })
    })
}

export function setSelectedTokenById(tokenId) {
    return getTransaction(tokenId).then(createTx => {
        selectedToken = {
            createTx,
            id: createTx.id,
            creator: { publicKey: createTx.inputs[0].owners_before[0] },
            tokensLeft: 'Unknown'
        }
        saveSelectedToken()
    })
}

export function saveSelectedToken() {
    localStorage.setItem("currentToken", JSON.stringify(selectedToken))
}

export function dropSelectedToken() {
    localStorage.removeItem("currentToken")
}

function loadSelectedToken() {
    const token = localStorage.getItem("currentToken")
    if (token) {
        selectedToken = JSON.parse(token)
    }
}

loadSelectedToken()