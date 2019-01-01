import {HostPage} from "./host.js"
import {EntrancePage} from "./entrance.js";
import {VisitorPage} from "./visitor.js";

const NotFound = { template: '<p>Page not found</p>' }

const routes = {
    '': HostPage,
    'visitor': VisitorPage,
    'entrance': EntrancePage
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
