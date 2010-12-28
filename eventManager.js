var EventManager = function() {
    var events = {}; // { eventName: { callbacks: [f], context: object }, .. }

    this.connect = function(event, callback) {
        assertEvent('connect', event);
        assertCallback('connect', callback);

        var callbacks = events[event].callbacks;

        if (callbacks.indexOf(callback) !== -1) {
            throw "EventManager::connect: Specified callback is already connected with event '" + event + "'";
        }

        events[event].callbacks.push(callback);
    };

    this.disconnect = function(event, callback) {
        assertEvent('disconnect', event);
        assertCallback('disconnect', callback);

        var e = events[event];
        var callbacks = e.callbacks;
        var idx = callbacks.indexOf(callback);

        if (idx === -1) {
            throw "EventManager::disconnect: Specified callback '" + callback + "' not connected with event '" + event + "'";
        }

        callbacks.splice(idx, 1);
    };

    this.emit = function(event) {
        assertEvent('emit', event);

        var args = Array.prototype.slice.call(arguments, 1, arguments.length);

        var e = events[event];
        var callbacks = e.callbacks;

        for (var i = 0; i < callbacks.length; ++i) {
            callbacks[i].apply(e.context, args);
        }
    };

    this.registerEvent = function(event, optionalContext) {
        if (event in events) {
            throw "EventManager::registerEvent: Event '" + event + "' is already registered";
        }

        events[event] = {
            callbacks: [],
            context: optionalContext || window
        };
    };

    this.unregisterEvent = function(event) {
        assertEvent('unregisterEvent', event);

        delete events[event];
    };


    var assertEvent = function(method, event) {
        if (!(event in events)) {
            throw "EventManager::" + method + ": Unknown event '" + event + "'";
        }
    };

    var assertCallback = function(method, callback) {
        if (typeof callback !== 'function') {
            throw "EventManager::" + method + ": Callback must be a function";
        }
    };
};
