import {app} from "../main.js"
import {createIdentity} from "../model/chain.js"
import {selectedToken,giveTokens} from "../model/token.js"
import {QRCode} from "../lib/qrcode.js";
import {clearListener, listenForTransactions} from "../model/chainevents.js";

function createVisitor() {
    const visitor = createIdentity()
    return giveTokens(selectedToken, visitor.publicKey, 5 * 5).then(res => {
        return visitor
    })
}

function createVisitorQR(visitor) {
    const target =  location.origin + location.pathname + "?keys=" + visitor.publicKey + "," + visitor.privateKey + "#keyload"
    console.log(target)
    document.getElementById("qrcode").innerHTML = '';
    const qrcode = new QRCode(document.getElementById("qrcode"), {
        text: target,
        width: 384,
        height: 384,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
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
    },
    beforeDestroy: function() {
        this.txListeners.forEach(clearListener)
    },
    methods: {
        newVisitor: function() {
            createVisitor().then(visitor => {
                createVisitorQR(visitor)
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
    <h3>Generate new code for every visitor!</h3>
    <div v-if="!selectedToken">No token found</div>
    <v-btn v-if="selectedToken" @click="newVisitor()">New Visitor</v-btn>
    <div id="qrcode" style="margin: 20px"></div>
    <v-btn @click="host()">Back to Host View</v-btn>
</div>
`
})