# web-instance
Manager the instances of a web page open multiple tabs/windows

## Install
```
npm install web-instance
```

### Usage
``` javascript
import WebInstance from 'web-instance'

// The basic
WebInstance
    .done((nodetype, status) => {
        console.log(nodetype) // master or slave
        console.log(status) // online or offline
    })
    .nextTick(() => {
        // this function will be called every x miliseconds, only while online
        // check WebInstance.tickMs
    })
    .on(WebInstance.ON_NODETYPE_CHANGED, (nodetype) => {
        console.log(nodetype) // master or slave
    })
    .on(WebInstance.ON_CONNECTION_STATUS, (status) => {
        console.log(status) // online or offline
    })

// Listening to a specific message
WebInstance
    .on('hi', (event) => {
        console.log('received', event.message)

        // Response
        return `hi ${event.from}, my uuid is ${WebInstance.uuid()}`
    })

// Listening to a localStorage key
    .watch('key', (event) => {
        console.log('value of key is', event.message)
    })

// Sending message
WebInstance
    .send('hi', `hi i'm ${WebInstance.uuid()}`)
    .then(responses => {
        // responses is an Array with all responses
        console.log('responses from "hi" message', responses)
    })

// Outhers methods
WebInstance.broadcast()    // return all nodes (Promisse)
WebInstance.exists('uuid') // return true if uuid exists (Promisse)
WebInstance.timeout(400)   // set timeout for responses, default is 400ms

```
