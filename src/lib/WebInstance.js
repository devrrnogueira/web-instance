// @ts-check

import Queue from './Queue'
import Util from './Util'

let watchs = {}
let events = {}
let done = null
let timeout = 400
let responses = {}
let uuid = Util.uuid()
let master

sessionStorage.setItem('wi|', uuid)

const WebInstance = {
    ON_NODETYPE_CHANGED: 'nodetypechanged',
    NODE_MASTER: 'master',
    NODE_SLAVE: 'slave',
    
    uuid() {
        return uuid
    },

    timeout(ms) {
        timeout = ms
        return this
    },

    done(callback) {
        if (master) {
            callback(nodeType())
        } else {
            done = callback
        }

        return this
    },

    on(event, callback) {
        events[event] = callback
        return this
    },

    watch(key, callback) {
        watchs[key] = callback
        return this
    },

    send(name, message) {
        return send(name, message)
    },

    broadcast() {
        return send('__broadcast__')
    },

    exists(uuid) {
        return WebInstance
            .send('__exists__', uuid)
            .then(res => res.length > 0)
    }
}

WebInstance.on('__broadcast__', () => {
    return 'hi'
})

WebInstance.on('__get_master__', () => {
    if (master == uuid) {
        return true
    }
})

WebInstance.on('__exists__', ({message}) => {
    if (message == uuid) {
        return true
    }
})

WebInstance.on('__died__', (event) => {
    if (event.from == master) {
        setTimeout(chooseMaster, 100)
    }
})

WebInstance.watch('master', () => {
    let m = localStorage.getItem('master')

    if ( m != master) {
        master = m
        masterChanged()
    }
})

function masterChanged() {
    let fn = done || events[WebInstance.ON_NODETYPE_CHANGED]

    done = null
    fn && fn(nodeType())
}

function nodeType() {
    return uuid == master ? WebInstance.NODE_MASTER : WebInstance.NODE_SLAVE
}

function send(name, message, to = '', toMessage = '') {
    return new Promise((resolve) => {
        // coloca na fila e aguarda as respostas, timeout default é 400ms
        Queue.add(
            // start()
            () => {
                let event = Util.createEvent(name, message, to, toMessage)
                
                responses[event.id] = []

                // envia a mensagem para todas as outras instâncias
                Util.emit(event)
                
                // aguarda as outras intâncias responderem
                setTimeout(Queue.end, timeout)

                // event será passado como parâmetro no end()
                return event
            },

            // end(), event é o que o start retornou
            (event) => {
                let arr = responses[event.id]
                
                delete (responses[event.toMessage])
                resolve(arr)
                Queue.next()
            })
    })
}

/**
 * Quando eu receber mensagem
 * @param {{
 *      name: String
 *      id: String
 *      from: String
 *      to: String
 *      toMessage: String
 *      message: *
 * }} event 
 */
function onMessageReceived(event) {
    let response, evt
    let fn = events[event.name]

    if (fn) {
        response = fn(event)
        if (response !== undefined) {
            evt = Util.createEvent('__response__', response, event.from, event.id)
            Util.emit(evt)
        }
    }
}

function onResponseReceived(event) {
    let arr = responses[event.toMessage] || []
    arr.push(event)
}

// elege o master
async function chooseMaster() {
    let nodes
    
    master = localStorage.getItem('master') || uuid
    
    if (master != uuid) {
        nodes = await WebInstance.broadcast()
        
        // o mais antigo será o master, me incluo na lista
        nodes.push({from: uuid})
        master = nodes.reduce((value, item) => (item.from < value ? item.from : value), nodes[0].from)
    }

    localStorage.setItem('master', master)
    masterChanged()
}

function garbageCollection() {
    let tm = Date.now()
    
    Object.keys(localStorage).forEach(key => {
        let o
        if (key.startsWith('wi|')) {
            o = JSON.parse(localStorage.getItem(key))
            if (tm - o.tm > 800) {
                localStorage.removeItem(key)
            }
        }
    })
}

window.addEventListener('storage', ({key, newValue}) => {
    let event
    let fn = watchs[key]
    
    // tem alguém observando essa chave
    if (fn) {
        return fn(JSON.parse(newValue || 'null'))
    }

    // chave excluída ou não é uma mensagem da WebInstance
    if (!key || !key.startsWith('wi|') || newValue === null) {
        return
    }

    event = JSON.parse(newValue || '{}')

    if (event.toMessage) {
        onResponseReceived(event)
    } else {
        onMessageReceived(event)
    }
})

window.addEventListener('unload', function() {
    WebInstance.send('__died__')
})

chooseMaster()
setTimeout(garbageCollection, 10)

export default WebInstance