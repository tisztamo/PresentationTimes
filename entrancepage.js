import {app} from "./main.js"
import {createIdentity} from "./chain.js"
import {selectedToken,giveTokens} from "./token.js"
import {QRCode} from "./lib/qrcode.js";

function createVisitor() {
    const visitor = createIdentity()
    return giveTokens(selectedToken, visitor.publicKey, 5 * 5).then(res => {
        return visitor
    })
}

function createVisitorQR(visitor) {
    const target =  location.origin + location.pathname + "?keys=" + visitor.publicKey + "," + visitor.privateKey + "#visitor"
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
            selectedToken
        }
    },
    methods: {
        newVisitor: function() {
            createVisitor().then(visitor => {
                createVisitorQR(visitor)
            })
        },
        host: function() {
            app.route("")
        }
    },
    template: `
<div>
    <div v-if="selectedToken">Token: {{selectedToken.id}}</div>
    <v-btn @click="newVisitor()">New Visitor</v-btn>
    <v-btn @click="host()">Host View</v-btn>
    <div id="qrcode" style="margin: 20px"></div>
</div>
`
})