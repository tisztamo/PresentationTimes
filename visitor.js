export function visitor() {
    const keys = document.location.search.substr("?visitor=".length).split(",")
    const visitor = {
        publicKey: keys[0],
        privatekey: keys[1]
    }
    console.log(visitor)
}