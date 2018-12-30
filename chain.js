export const API_PATH = 'https://test.bigchaindb.com/api/v1/'

const _me = createIdentity();

export function me() {
    return _me
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