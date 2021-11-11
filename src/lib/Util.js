// @ts-check

const uuid = sessionStorage.getItem('wi|') || String(Date.now())
const uuidKey = `wi|${uuid}`

const Util = {
    messagesResponse: [],

    uuid() {
        return uuid
    },

    generateMessageId() {
        return `${Date.now()}${parseInt(String(Math.random() * 10000))}`
    },

    createEvent(name, message, to = '', toMessage = '') {
        return {
            id: this.generateMessageId(),
            tm: Date.now(),
            from: uuid,
            name,
            to,
            toMessage,
            message
        }
    },

    emit(event) {
        localStorage.setItem(uuidKey, JSON.stringify(event))
    }
}

export default Util