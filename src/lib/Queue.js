// @ts-check

const Queue = {
    _list: [],
    _running: null,
    add(start, end = null) { 
        Queue._list.push({start, end})
        Queue.next()
    },
    next() {
        let task

        if (!Queue._running) {
            task = Queue._list[0] || null
            
            if (task) {
                task.result = task.start()
            }

            Queue._running = task
        }
    },
    end() {
        let task = Queue._running
        
        if (task) {
            Queue._running = null
            Queue._list.splice(0, 1)
            task.end && task.end(task.result)
        }
    }
}

export default Queue
