import {ReconnectingWebSocket} from "./lib/reconnecting-websocket.js"
import {getTransaction, WS_BASE_URL} from "./chain.js"

const WS_URL = WS_BASE_URL + "streams/valid_transactions"

const listeners = new Map()
let websocket = null

function initWebSocket()
{
    websocket = new ReconnectingWebSocket(WS_URL)
    websocket.onmessage = wsMessageHandler
}

function wsMessageHandler(message) {
    const transactionRef = JSON.parse(message.data)
    const interestedListeners = listeners.get(transactionRef.asset_id)
    if (!interestedListeners) {
        return
    }
    getTransaction(transactionRef.transaction_id).then(transaction => {
        interestedListeners.forEach(listener => {
            listener.handler(transaction)
        })
    })
}

function addListener(listener) {
    listener.assetIds.forEach(assetId => {
        listeners.has(assetId) || listeners.set(assetId, [])
        listeners.get(assetId).push(listener)
    })
    return listener
}

export function listenForTransactions(assetIds, handler) {
    if (!websocket) initWebSocket()
    return addListener({
        assetIds,
        handler,
        id: String(Date.now()) + Math.random(),
    })
}

export function clearListener(listener) {
    listener.assetIds.forEach(assetId => {
        const idx = listeners.get(assetId).indexOf(listener)
        if (idx !== -1) {
            listeners.get(assetId).splice(idx, 1)
        }
    })
}