import {app} from "../main.js";
import {autoGrant, findRunningPresentation, grantTime} from "../model/presentation.js";
import {getChainTimeMillis} from "../model/chain.js";

function twoDigit(num) {
    return num < 10 ? "0" + num : "" + num
}

function minsecs(totalsecs) {
    const mins = Math.floor(totalsecs / 60)
    const secs = totalsecs - mins * 60
    return twoDigit(mins) + ":" + twoDigit(secs)
}

export const TimerPage = Vue.component('timer-page', {
    data: function () {
        return {
            _interval: null,
            startTS: 0,
            grantedLength: 0,
            runningForSecs: 0,
            presentation: null
        }
    },
    computed: {
        timer: function() {
            return minsecs(this.runningForSecs)
        },
        granted: function() {
            return minsecs(this.grantedLength)
        },
        runnedOut: function() {
            return this.grantedLength + 3 < this.runningForSecs
        }
    },
    created: function() {
        this._interval = setInterval(this.step.bind(this), 1000)
        this.update()
    },
    beforeDestroy: function() {
        clearInterval(this._interval)
    },
    methods: {
        step: function() {
            this.runningForSecs = getChainTimeMillis() - this.startTS
            if (this.runningForSecs === this.grantedLength) {
                this.autoGrant()
            }
        },
        host: function () {
            app.route("")
        },
        autoGrant: function() {
            autoGrant(this.presentation, 2).then(result => {
                if (!result) {
                    console.log("No more time granted")
                    document.getElementById("bellSound").play()
                }
                this.update()
            })
        },
        update: function() {
            findRunningPresentation().then(presentation => {
                this.presentation = presentation
                this.grantedLength = presentation.metadata.grantedLength;
                this.startTS = presentation.metadata.startTS
            })
        }
    },
    template: `
<v-content>
    <v-container fluid>
        <div>
            <div class="display-4"><div v-bind:class="{ runnedOut: runnedOut }">{{timer}}</div></div>
            <div>Granted: {{granted}}</div>
            <v-btn @click="host()">Host view</v-btn>
        </div>
    </v-container>
</v-content>
`
})