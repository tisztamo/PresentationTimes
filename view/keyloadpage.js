import {selectedToken, getOwnedTokens, selectTokenById, transferAllToNewIdentity} from "../model/token.js"
import {setMe, me, getTransaction} from "../model/chain.js"

export const KeyLoadPage = Vue.component('keyload-page', {
    data: function () {
        return {
            selectedToken,
            me: null,
            tokens: null,
            noTokensFound: false,
        }
    },
    created: function() {
        this.update()
    },
    methods: {
        update: function() {
            this.me = me()
            getOwnedTokens(me().publicKey).then(ownedTokens => {
                this.tokens = ownedTokens
                if (!ownedTokens.total) {
                    throw "Zero tokens!"
                }
                return selectTokenById(this.tokens.transactions[0].asset.id)
                    .then(transferAllToNewIdentity).then(() => {
                        document.location.href = document.location.pathname + '#keyloadresult'
                    })
            }).catch(() => this.noTokensFound = true)
        },
    },
    template: `
<v-content>
    <v-container fluid>
        <div v-if="tokens && !noTokensFound">Creating identity and transferrig {{tokens.total}} tokens...</div>
        <div v-if="noTokensFound">No tokens found, maybe QR code was already used</div>
    </v-container>
</v-content>
`
})