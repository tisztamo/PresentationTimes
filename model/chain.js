export const API_BASE_URL = 'https://test.bigchaindb.com/api/v1/'
export const WS_BASE_URL = 'wss://test.bigchaindb.com:443/api/v1/'

let conn = new BigchainDB.Connection(API_BASE_URL)
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

export function createIdentity() {
    return new BigchainDB.Ed25519Keypair()
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

export function simpleOutput(publicKey, amount) {
    return BigchainDB.Transaction.makeOutput(
        BigchainDB.Transaction.makeEd25519Condition(publicKey), amount)
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

function filetime_to_unixtimems(ft) {
    const epoch_diff = 116444736000000000;
    const rate_diff = 10000;
    return Math.round((ft - epoch_diff) / rate_diff);
}

const syncedTS = {
    serverTS: 0,
    clientTS: 0
}

export function synchChainTime() {
    const beforeTS = Date.now()
    let clientTS = 0
    fetch("http://worldclockapi.com/api/json/utc/now").then(response => {
        clientTS = Math.round((Date.now() + beforeTS) / 2)
        return response.json()
    }).then(data => {
        syncedTS.serverTS = filetime_to_unixtimems(Number(data.currentFileTime))
        syncedTS.clientTS = clientTS
    })
}
synchChainTime()

export function getChainSynchedTS() {
    return Date.now() - syncedTS.clientTS + syncedTS.serverTS
}

export function getChainTimeMillis() {
    return Math.round(getChainSynchedTS() / 1000)
}