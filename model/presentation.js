import {getOwnedTokens, giveTokens, selectedToken} from "./token.js"
import {
    createIdentity,
    me,
    postTransaction,
    searchAssets,
    getTransaction,
    searchMetadata,
    populateWithAsset,
    getChainTimeMillis, simpleOutput
} from "./chain.js"

const PRESENTATION_STARTED= "presentation_started"
const PRESENTATION = "presentation"

export function findPresentations() {
    return searchAssets(PRESENTATION).then(assets => {
        return Promise.all(assets.filter(asset => {
            return asset.data.token === selectedToken.id
        }).map(asset => getTransaction(asset.id)))
    })
}

export function createPresentation(presenterName, title, abstract) {
    const presenter = createIdentity()
    const creator = me()
    const presentation = {
        type: PRESENTATION,
        presenterName,
        title,
        abstract,
        presenterPublicKey: presenter.publicKey,
        token: selectedToken.id,
    }
    const tx = BigchainDB.Transaction.makeCreateTransaction(
        presentation,
        {
            datetime: new Date().toString()
        },
        [simpleOutput(creator.publicKey)],
        creator.publicKey
    )
    return postTransaction(tx)
}

export function startPresentation(presentation, grantedLength = 240) {
    const timeStamp = getChainTimeMillis()
    const tx = BigchainDB.Transaction.makeTransferTransaction(
        [{tx: presentation, output_index: 0}],
        [simpleOutput(me().publicKey)],
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
        [simpleOutput(me().publicKey)],
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

export function collectedVotesDuringLastPeriod(presentation) {
    const presenterPublicKey = presentation.asset.data.presenterPublicKey
    return getOwnedTokens(presenterPublicKey).then(tokens => {
        return tokens.total - (presentation.metadata.usedTokens || 0)
    })
}

export function autoGrant(presentation, neededNewTokens = 1, grantedLength = 60) {
    return collectedVotesDuringLastPeriod(presentation).then(tokens => {
        if (tokens >= neededNewTokens) {
            console.log("Granting " + grantedLength + " secs on " + tokens + " votes.")
            return grantTime(presentation, grantedLength, tokens + (presentation.metadata.usedTokens || 0))
        } else {
            console.log(String(tokens) + " votes are not enough...")
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