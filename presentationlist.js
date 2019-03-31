import {selectedToken} from "./token.js";
import {findPresentations, findRunningPresentation, startPresentation} from "./presentation.js";
import {app} from "./main.js";
import {clearListener, listenForTransactions} from "./chainevents.js";

export const PresentationList = Vue.component('presentation-list', {
    props: {
        host: Boolean
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
                app.route("timer")
            })
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
    <div>
        <ul>
            <li v-for="pres in presentations">
                <div><b>{{ pres.asset.data.title }}</b> - {{ pres.asset.data.presenterName }}</div> 
                <div>{{ pres.asset.data.abstract }}</div> 
                <v-btn v-if="host" @click="start(pres)">Start</v-btn>
            </li>
        </ul>
        <div v-if="runningPresentation">Running presentation: {{ runningPresentation.asset.data.title }}</div>
    </div>
    `
})
