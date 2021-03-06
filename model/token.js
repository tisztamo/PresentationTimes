import {
    me,
    postTransaction,
    getTransaction,
    listOutputs,
    createIdentity,
    setMe,
    simpleOutput
} from "./chain.js"

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
        [simpleOutput(creator.publicKey, nTokens.toString())],
        creator.publicKey
    )

    return postTransaction(tx).then(res => {
        selectToken({
            id: res.id,
            tokensLeft: nTokens,
            creator: creator,
            createTx: res,
        })
        return selectedToken
    })
}

function findSourceTxForAmount(txs, amount) {
    return txs.find(tx => Number(tx.outputs[tx.ownerOutputIdx].amount) >= amount)
}

export function giveTokens(token, receiverPubKey, amount, metadata = null) {
   return getOwnedTokens(me().publicKey).then(ownedTokens => {
       const sourceTx = findSourceTxForAmount(ownedTokens.transactions, amount)
       const sourceAmount = Number(sourceTx.outputs[sourceTx.ownerOutputIdx].amount)
       if (sourceAmount < amount) {
           console.error("Source transaction does not contain " + amount + " tokens", sourceTx)
           return
       }
       const remaining = sourceAmount - amount;
       const outputs = []
       if (remaining > 0) {
           outputs.push(simpleOutput(me().publicKey, (remaining).toString()))
       }
       outputs.push(simpleOutput(receiverPubKey, amount.toString()))
       const tx = BigchainDB.Transaction.makeTransferTransaction(
            [{
                tx: sourceTx,// TODO: handle multiple unspent outputs (if needed)
                output_index: sourceTx.ownerOutputIdx
            }],
            outputs,
            metadata
        )

        return postTransaction(tx).then(tx => {
            token.tokensLeft -= amount
            selectToken(token)
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
export function transferAllToNewIdentity() {
    const newMe = createIdentity()
    return getOwnedTokens(me().publicKey).then(ownedTokens => {
       return giveTokens(selectedToken, newMe.publicKey, ownedTokens.total).then(() => {
           setMe(newMe)
       })
    })
}

export function selectToken(token) {
    selectedToken = token
    saveSelectedToken()
    return token
}

export function selectTokenById(tokenId) {
    return getTransaction(tokenId).then(createTx => {
        return selectToken({
            createTx,
            id: createTx.id,
            creator: { publicKey: createTx.inputs[0].owners_before[0] },
            tokensLeft: 'Unknown'
        })
    })
}

function saveSelectedToken() {
    localStorage.setItem("currentToken", JSON.stringify(selectedToken))
}

export function dropSelectedToken() {
    localStorage.removeItem("currentToken")
}

function loadSelectedToken() {
    const token = localStorage.getItem("currentToken")
    if (token) {
        selectToken(JSON.parse(token))
    }
}

loadSelectedToken()