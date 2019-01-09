import {app} from "./main.js";
import {autoGrant, findRunningPresentation, grantTime} from "./presentation.js";

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
            this.runningForSecs = Math.round(Date.now() / 1000) - this.startTS
            if (this.runningForSecs === this.grantedLength) {
                this.autoGrant()
            }
        },
        host: function () {
            app.route("")
        },
        autoGrant: function() {
            autoGrant(this.presentation, 1).then(this.update.bind(this))
        },
        grantTime: function() {
            if (this.presentation) {
                grantTime(this.presentation).then(this.update.bind(this))
            }
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
<div>
    <div class="display-4">{{timer}}</div>
    <div>Granted: {{granted}}</div>
    <v-btn @click="host()">Host view</v-btn>
    <v-btn @click="autoGrant()">Grant Time</v-btn>
</div>
`
})