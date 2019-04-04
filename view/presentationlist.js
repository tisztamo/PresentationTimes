import {selectedToken} from "../model/token.js";
import {findPresentations, findRunningPresentation, startPresentation} from "../model/presentation.js";
import {app} from "../main.js";
import {clearListener, listenForTransactions} from "../model/chainevents.js";

export const PresentationList = Vue.component('presentation-list', {
    props: {
        host: Boolean,
        voteForRunning: Function
    },
    data: function () {
        return {
            presentations: [],
            runningPresentation: null
        }
    },
    methods: {
        update: function() {
            if (selectedToken) {
                findPresentations().then(presentations => {
                    this.presentations = presentations
                }).then(() => {
                    findRunningPresentation().then(running => {
                        this.runningPresentation = running
                    })
                })
            }
        },
        start: function(presentation) {
            startPresentation(presentation).then(() => {
                document.getElementById("bellSound").play()
                app.route("timer")
            })
        },
        vote: function() {
            this.$emit("vote")
        }
    },
    created: function() {
        this.txListeners = [];
        this.update()
        this.txListeners.push(listenForTransactions([selectedToken.id], this.update.bind(this)))
        findPresentations().then(presentations => {
            this.txListeners.push(listenForTransactions(presentations.map(p => p.id), this.update.bind(this)))
        })
    },
    beforeDestroy: function() {
        this.txListeners.forEach(clearListener)
    },
    template: `
<v-content>
    <v-container fluid>
        <div>
            <div v-if="runningPresentation">Running presentation:
                <div><b>{{ runningPresentation.asset.data.title }} - {{ runningPresentation.asset.data.presenterName }}</b></div> 
                <div>{{ runningPresentation.asset.data.abstract }}</div>
                 <v-btn v-if="voteForRunning" @click="vote()">Vote</v-btn>
            </div>
            --
            <ul>
                <li v-for="pres in presentations">
                    <div><b>{{ pres.asset.data.title }} - {{ pres.asset.data.presenterName }}</b></div> 
                    <div>{{ pres.asset.data.abstract }}</div>
                    <v-btn v-if="host" @click="start(pres)">Start</v-btn>
                </li>
            </ul>
    </div>
    </v-container>
</v-content>
    `
})
