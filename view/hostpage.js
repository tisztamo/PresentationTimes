import {me, recreateMe} from "../model/chain.js"
import {tokenLaunch, selectedToken, dropSelectedToken} from "../model/token.js"
import {app} from "../main.js"
import {createPresentation} from "../model/presentation.js"
import {createQR} from "./qr.js";

export const HostPage = Vue.component('host-page', {
    data: function () {
        return {
            token: selectedToken,
            presenterName: null,
            title: null,
            abstract: null
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
        },
        timer: function() {
            app.route("timer")
        },
        newIdentity: function() {
            if (window.confirm("Are you sure to create new identity?")) {
                recreateMe()
                dropSelectedToken()
                location.reload()
            }
        },
        addPresentation: function() {
            createPresentation(this.presenterName, this.title, this.abstract).then(pres =>
            {
                document.location.reload()
            })
        },
        clone: function() {
            createQR(me())
        }
    },
    template: `
  <v-content>
    <v-container fluid>
    <div>
        <v-btn v-if="!token" @click="createToken()">Create Token</v-btn>
        <div>
            <span v-if="token">Token: {{token.id}}</span>
            <a href="" @click="newIdentity()">New Identity</a>
        </div>
        <v-btn @click="entrance()" v-if="token">Entrance View</v-btn>
        <v-btn @click="timer()" v-if="token">Timer View</v-btn>
        <div v-if="token">
            <h3>Presentations</h3>
            <presentation-list host="true"></presentation-list>
            <h3>Create Presentation</h3>
            <v-form>
                <v-text-field v-model="presenterName" placeholder="Presenter" single-line></v-text-field>
                <v-text-field v-model="title" placeholder="Title"></v-text-field>
                <v-textarea v-model="abstract" placeholder="Abstract"></v-textarea>
                <v-btn v-if="title" @click="addPresentation()">Create Presentation</v-btn>        
            </v-form>
        </div>
        <v-btn @click="clone()">Clone identity</v-btn>        
        <div id="qrcode" style="margin: 20px"></div>        
    </div>
    </v-container>
</v-content>
`
})