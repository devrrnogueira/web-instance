<template>
    <h3>{{nodeType === null ? 'Initializing...' : nodeType}} - {{uuid}}</h3>
    <button @click="doSendMessage">Send Message</button>
    <div>
        <div v-for="(item, index) in messages" :key="index" :class="item.type">
            {{item.message}}
        </div>
    </div>
</template>

<script>
import WebInstance from './lib/WebInstance'

export default {
    name: 'App',
    data: () => ({
        nodeType: null,
        uuid: null,
        messages: []
    }),
    
    created() {
        this.uuid = WebInstance.uuid()

        WebInstance
            .done((nodetype) => {
                this.nodeType = nodetype
            })
            .on(WebInstance.ON_NODETYPE_CHANGED, (nodetype) => {
                this.nodeType = nodetype
            })

        WebInstance.on('hi', (event) => {
            let message = `hi ${event.from}, my uuid is ${WebInstance.uuid()}`
            this.messages.push({message:event.message, type: 'received'})
            this.messages.push({message, type: 'sended'})
            return message
        })
    },

    methods: {
        doSendMessage() {
            let message = `hi i'm ${WebInstance.uuid()}`
            this.messages.push({message, type: 'sended'})

            WebInstance.send('hi', message)
                .then((responses) => {
                    if (responses.length == 0) {
                        this.messages.push({message:'no one answered you are alone', type: 'received'})
                    } else {
                        responses.forEach(event => {
                            this.messages.push({message:event.message, type: 'received'})
                        })
                    }
                })
        },
    }
}
</script>

<style>
    button{
        margin: 20px
    }

    .sended, .received{
        background: white;
        border: solid 1px #c5c5c5;
        padding: 8px;
        border-radius: 6px;
        margin: 4px;
        box-shadow: 2px 2px 4px #5252524a;
        font-size: 14px;
        font-family: monospace;
        max-width: 350px;
    }
    .sended {
        padding-right: 10px;
    }
    .received{
        text-align: right;
        background: #75dfd5;
        padding-left: 10px;
    }
</style>