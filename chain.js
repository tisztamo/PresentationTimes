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
    return conn.getTransaction(txId)
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