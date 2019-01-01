import {app} from "./main.js"
import {createIdentity} from "./chain.js"
import {selectedToken} from "./token.js"
import {QRCode} from "./lib/qrcode.js";
import {token} from "./host.js"

function createVisitor() {
    const visitor = createIdentity()
    return selectedToken.issue(visitor, 5 * 5).then(res => {
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
    <button @click="newVisitor()">New Visitor</button>
    <button @click="host()">Host View</button>
    <div id="qrcode"></div>
</div>
`
})