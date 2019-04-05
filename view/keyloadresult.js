
export const KeyLoadResultPage = Vue.component('keyload-page', {
    created: function() {
        setTimeout(() => {
            document.location.href = document.location.pathname + '?x=1#visitor'
        }, 500)
    },
    template: `
<v-content>
    <v-container fluid>
        <div>Identity generated, starting app...</div>
    </v-container>
</v-content>
`
})