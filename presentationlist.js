import {selectedToken} from "./token.js";
import {findPresentations, findRunningPresentation, startPresentation} from "./presentation.js";
import {app} from "./main.js";

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
        this.update()
    },
    template: `
    <div>
        <ul>
            <li v-for="pres in presentations">
                <div><b>{{ pres.asset.data.title }}</b> {{ pres.asset.data.presenter }}</div> 
                <div>{{ pres.asset.data.abstract }}</div> 
                <v-btn v-if="host" @click="start(pres)">Start</v-btn>
            </li>
        </ul>
        <div v-if="runningPresentation">Running presentation: {{ runningPresentation.asset.data.title }}</div>
    </div>
    `
})
