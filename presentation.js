import {selectedToken} from "./token.js"
import {createIdentity, me, postTransaction,searchAssets} from "./chain.js"

export function findPresentations() {
    return searchAssets("presentation").then(assets => {
        return assets.filter(asset => {
            return asset.data.token === selectedToken.id
        }).map(asset => asset.data)
    })
}

export function createPresentation(presenterName, title, abstract) {
    const presenter = createIdentity()
    const creator = me()
    const presentation = {
        type: 'presentation',
        presenterName,
        title,
        abstract,
        presenterPublicKey: presenter.publicKey,
        token: selectedToken.id,
        startTS: null
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

    return postTransaction(tx).then(res => presentation)
}