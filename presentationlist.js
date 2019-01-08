import {selectedToken} from "./token.js";
import {findPresentations, findRunningPresentation, startPresentation} from "./presentation.js";
import {app} from "./main.js";

export const PresentationList = Vue.component('presentation-list', {
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
                {{ pres.asset.data.title }} <v-btn @click="start(pres)">Start</v-btn>
            </li>
        </ul>
        Running presentation: {{ runningPresentation }}
    </div>
    `
})
