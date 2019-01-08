export const API_PATH = 'https://test.bigchaindb.com/api/v1/'

let _me = null;
loadOrCreateMe()

export function me() {
    return _me
}

export function setMe(newMe) {
    _me = newMe
    localStorage.setItem("me", JSON.stringify(newMe))
}

export function recreateMe() {
    setMe(createIdentity())
}

function loadOrCreateMe() {
    if (document && document.location && document.location.search.startsWith("?keys=")) {
        const keys = document.location.search.substr("?keys=".length).split(",")
        setMe({
            publicKey: keys[0],
            privateKey: keys[1],
            tokens: null
        })
        return
    }
    const storedMe = localStorage.getItem("me")
    if (storedMe) {
        _me = JSON.parse(storedMe)
    } else {
        recreateMe()
    }
}

export function createIdentity() {
    return new BigchainDB.Ed25519Keypair()
}

let conn = new BigchainDB.Connection(API_PATH)

export function getTransaction(txId) {
    const cached = localStorage.getItem("txcache_" + txId)
    if (cached) {
        return Promise.resolve(JSON.parse(cached))
    }
    return conn.getTransaction(txId).then(tx => {
        if (tx && tx.id) {
            localStorage.setItem("txcache_" + tx.id, JSON.stringify(tx))
        }
        return tx
    })
}

export function postTransaction(tx) {
    const txSigned = BigchainDB.Transaction.signTransaction(tx, me().privateKey)
    return conn.postTransactionCommit(txSigned)
}

export function listOutputs(publicKey) {
    return conn.listOutputs(publicKey, false)
}

export function searchAssets(search) {
    return conn.searchAssets(search)
}

export function searchMetadata(search) {
    return conn.searchMetadata(search)
}

export function populateWithAsset(transferTx) {
    if (!transferTx) {
        return null
    }
    return getTransaction(transferTx.asset.id).then(assetTx => {
        assetTx.asset.id = transferTx.asset.id
        transferTx.asset = assetTx.asset
        return transferTx
    })
}

