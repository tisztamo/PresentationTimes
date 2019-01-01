import {tokenLaunch} from "./token.js"
import {app} from "./main.js"

export const HostPage = Vue.component('host-page', {
    data: function () {
        return {
            token: null
        }
    },
    methods: {
        createToken: function() {
            return tokenLaunch().then(t => {
                this.token = t
                console.log("Token created: " + t.id)
            })
        },
        entrance: function() {
            app.route("entrance")
        }
    },
    template: `
<div>
    <button @click="createToken()">Create Token</button>
    <div v-if="token">Token: {{token.id}}</div>
    <button @click="entrance()" v-if="token">Entrance View</button>
</div>
`
})