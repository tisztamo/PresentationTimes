import {selectedToken,getOwnedTokens,setSelectedTokenById} from "./token.js"
import {setMe, me, getTransaction} from "./chain.js"
import {PresentationList} from "./presentationlist.js"
import {voteForRunning} from "./presentation.js";

export const VisitorPage = Vue.component('visitor-page', {
    data: function () {
        return {
            selectedToken,
            me: null,
            tokens: null
        }
    },
    created: function() {
        this.me = me()
        getOwnedTokens(me().publicKey).then(ownedTokens => {
            this.tokens = ownedTokens
            return setSelectedTokenById(this.tokens.transactions[0].asset.id)
        })
    },
    methods: {
        vote: function() {
            voteForRunning()
        }
    },
    template: `
<div>
    <div v-if="tokens">Tokens: {{tokens.total}}</div>
     <presentation-list></presentation-list>
    <v-btn @click="vote()">Vote</v-btn>
</div>
`
})