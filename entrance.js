import { me, postTransaction, createIdentity, API_PATH } from "./chain.js"
import { tokenLaunch } from "./token.js"
import { QRCode } from "./lib/qrcode.js";

function prepareToken() {
    return tokenLaunch().then(token => {
            console.log("Token created: " + token.id)
            return token
        }
    )
}

function createVisitor(token) {
    const visitor = createIdentity()
    return token.issue(visitor, 5 * 5).then(res => {
        return visitor
    })
}

function createQR(visitor) {
    const target =  document.URL + "?visitor=" + visitor.publicKey + "," + visitor.privateKey
    console.log(target)
    var qrcode = new QRCode(document.getElementById("qrcode"), {
        text: target,
        width: 384,
        height: 384,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    })
}

export function entrance() {
    prepareToken().then(createVisitor).then(visitor => {
        createQR(visitor)
    })
}
