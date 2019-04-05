import {app} from "../main.js"
import {createIdentity} from "../model/chain.js"
import {selectedToken,giveTokens} from "../model/token.js"
import {clearListener, listenForTransactions} from "../model/chainevents.js";
import {createQR} from "./qr.js";

function createVisitor() {
    const visitor = createIdentity()
    return giveTokens(selectedToken, visitor.publicKey, 11).then(res => {
        return visitor
    })
}

export const EntrancePage = Vue.component('entrance-page', {
    data: function () {
        return {
            selectedToken,
            txListeners: [],
            lastVisitorPubKey: null
        }
    },
    created: function() {
        this.txListeners.push(listenForTransactions([selectedToken.id], (tx) => {
            if (tx.inputs[0].owners_before[0] == this.lastVisitorPubKey) {
                this.newVisitor()
            }
        }))
        this.newVisitor()
    },
    beforeDestroy: function() {
        this.txListeners.forEach(clearListener)
    },
    methods: {
        newVisitor: function() {
            createVisitor().then(visitor => {
                createQR(visitor)
                this.lastVisitorPubKey = visitor.publicKey
            })
        },
        host: function() {
            app.route("")
        }
    },
    template: `
  <v-content>
    <v-container fluid>
<div>
    <div v-if="!selectedToken">No token found</div>
    <div id="qrcode" style="margin: 20px"></div>
    <v-btn v-if="selectedToken" @click="newVisitor()">New Visitor</v-btn>
    <v-btn @click="host()">Back to Host View</v-btn>
</div>
`
})