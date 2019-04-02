import {HostPage} from "./view/hostpage.js"
import {EntrancePage} from "./view/entrancepage.js"
import {VisitorPage} from "./view/visitorpage.js"
import {TimerPage} from "./view/timerpage.js"

const NotFound = { template: '<p>Page not found</p>' }

const routes = {
    '': HostPage,
    'visitor': VisitorPage,
    'entrance': EntrancePage,
    'timer': TimerPage
}

export const app = new Vue({
    el: '#app',
    data: {
        currentRoute: window.location.hash.substr(1)
    },
    methods: {
        route: function(newRoute) {
            history.pushState(null, "", '#' + newRoute)
            this.currentRoute = newRoute
        }
    },
    computed: {
        ViewComponent () {
            return routes[this.currentRoute] || NotFound
        }
    },
    render (h) { return h(this.ViewComponent) }
})
