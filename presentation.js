import {getOwnedTokens, giveTokens, selectedToken} from "./token.js"
import {
    createIdentity,
    me,
    postTransaction,
    searchAssets,
    getTransaction,
    searchMetadata,
    populateWithAsset, listOutputs, getChainTimeMillis
} from "./chain.js"

const PRESENTATION_STARTED= "presentation_started"

export function findPresentations() {
    return searchAssets("xpresentation").then(assets => {
        return Promise.all(assets.filter(asset => {
            return asset.data.token === selectedToken.id
        }).map(asset => getTransaction(asset.id)))
    })
}

export function createPresentation(presenterName, title, abstract) {
    const presenter = createIdentity()
    const creator = me()
    const presentation = {
        type: 'xpresentation',
        presenterName,
        title,
        abstract,
        presenterPublicKey: presenter.publicKey,
        token: selectedToken.id,
    };
    const tx = BigchainDB.Transaction.makeCreateTransaction(
        presentation,
        {
            datetime: new Date().toString()
        },
        [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction
            .makeEd25519Condition(creator.publicKey))],
        creator.publicKey
    )

    return postTransaction(tx)
}

export function startPresentation(presentation, grantedLength = 30) {
    const timeStamp = getChainTimeMillis()
    const tx = BigchainDB.Transaction.makeTransferTransaction(
        [{tx: presentation, output_index: 0}],
        [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(me().publicKey))],
        {
            state: PRESENTATION_STARTED,
            startTS: timeStamp,
            ts: timeStamp,
            token: presentation.asset.data.token,
            grantedLength
        }
    )
    return postTransaction(tx)
}

export function grantTime(presentation, grantedLength = 20, usedTokens = 0) {
    const timeStamp =getChainTimeMillis()
    const tx = BigchainDB.Transaction.makeTransferTransaction(
        [{tx: presentation, output_index: 0}],
        [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(me().publicKey))],
        {
            state: PRESENTATION_STARTED,
            startTS: presentation.metadata.startTS,
            ts: timeStamp,
            token: presentation.asset.data.token,
            grantedLength: Number(presentation.metadata.grantedLength) + Number(grantedLength),
            usedTokens
        }
    )
    return postTransaction(tx)
}

export function autoGrant(presentation, neededNewTokens = 1, grantedLength = 20) {
    const presenterPublicKey = presentation.asset.data.presenterPublicKey
    return getOwnedTokens(presenterPublicKey).then(tokens => {
        if (tokens.total >= (presentation.metadata.usedTokens || 0) + neededNewTokens) {
            return grantTime(presentation, grantedLength, tokens.total)
        }
    })
}

export function findRunningPresentation() {
    return searchMetadata(PRESENTATION_STARTED).then(txs => {
        const filtered = txs.filter(tx => {
            return tx.metadata.token === selectedToken.id
        })
        let found = null
        let maxTS = -Infinity
        for (let i = 0; i < filtered.length; i++) {
            if (filtered[i].metadata.ts > maxTS) {
                found = filtered[i]
                maxTS = filtered[i].metadata.ts
            }
        }
        return found && maxTS > getChainTimeMillis() - found.metadata.grantedLength ? getTransaction(found.id) : null
    }).then(populateWithAsset)
}

export function voteForRunning() {
    return findRunningPresentation().then(running => {
        if (!running) {
            alert("No active presentation found")
            return
        }
        return giveTokens(selectedToken, running.asset.data.presenterPublicKey, 1)
    })
}