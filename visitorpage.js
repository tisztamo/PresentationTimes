import {selectedToken,getOwnedTokens} from "./token.js";
import {setMe,me} from "./chain.js";

export const VisitorPage = Vue.component('visitor-page', {
    data: function () {
        return {
            selectedToken,
            me: null,
            tokens: null
        }
    },
    created: function() {
        const keys = document.location.search.substr("?keys=".length).split(",")
        setMe({
            publicKey: keys[0],
            privateKey: keys[1],
            tokens: null
        })
        this.me = me()
        getOwnedTokens(me().publicKey).then(ownedTokens => {
            this.tokens = ownedTokens
        })
    },
    methods: {
        vote: function() {
            alert(42)
        }
    },
    template: `
<div>
    <div v-if="tokens">Tokens: {{tokens.total}}</div>
    <v-btn @click="vote()">Vote</v-btn>
</div>
`
})