import {selectedToken,getOwnedTokens} from "./token";

export const VisitorPage = Vue.component('visitor-page', {
    data: function () {
        return {
            selectedToken,
            me: null
        }
    },
    created: function() {
        const keys = document.location.search.substr("?keys=".length).split(",")
        this.me = {
            publicKey: keys[0],
            privateKey: keys[1],
            tokens: null
        }
        getOwnedTokens(this.me.publicKey).then(ownedTokens => {
            this.me.tokens = ownedTokens
        })
    },
    methods: {
        vote: function() {
            alert(42)
        }
    },
    template: `
<div>
    <div v-if="me.tokens">Tokens: {{me.tokens.total}}</div>
    <div>{{me}}</div>
    <button @click="vote()">Vote</button>
</div>
`
})