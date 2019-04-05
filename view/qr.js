import {QRCode} from "../lib/qrcode.js";

export function createQR(identity) {
    const target =  location.origin + location.pathname + "?keys=" + identity.publicKey + "," + identity.privateKey + "#keyload"
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