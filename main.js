import {entrance} from "./entrance.js";
import {visitor} from "./visitor.js";

if (document.location.search.indexOf("visitor") === -1) {
    document.body.classList.add("entrance")
    entrance()
} else {
    visitor()
    document.body.classList.add("visitor")
}