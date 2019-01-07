import {selectedToken} from "./token.js";
import {findPresentations} from "./presentation.js";

export const PresentationList = Vue.component('presentation-list', {
    data: function () {
        return {
            presentations: []
        }
    },
    methods: {
        update: function() {
            if (selectedToken) {
                findPresentations().then(presentations => {
                    this.presentations = presentations
                })
            }
        }
    },
    created: function() {
        this.update()
    },
    template: `
        <ul>
            <li v-for="pres in presentations">
                {{ pres.title }}
            </li>
        </ul>
    `
})
