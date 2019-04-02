import {selectedToken,getOwnedTokens,selectTokenById} from "../model/token.js"
import {setMe, me, getTransaction} from "../model/chain.js"
import {PresentationList} from "./presentationlist.js"
import {voteForRunning} from "../model/presentation.js";

export const VisitorPage = Vue.component('visitor-page', {
    data: function () {
        return {
            selectedToken,
            me: null,
            tokens: null,
            voteInProgress: false,
        }
    },
    created: function() {
        this.update()
    },
    methods: {
        vote: function() {
            this.voteInProgress = true
            voteForRunning()
                .finally(() => this.voteInProgress = false)
                .then(this.update.bind(this))
        },
        update: function() {
            this.me = me()
            getOwnedTokens(me().publicKey).then(ownedTokens => {
                this.tokens = ownedTokens
                return selectTokenById(this.tokens.transactions[0].asset.id)
            })
        },
    },
    template: `
<v-content>
    <v-container fluid>
        <div v-if="tokens">Tokens: {{tokens.total}}</div>
         <presentation-list></presentation-list>
        <v-btn v-if="!voteInProgress" @click="vote()">Vote</v-btn>
    </v-container>
</v-content>
`
})