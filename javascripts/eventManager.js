/*
 Copyright (c) 2010 Till Theis, http://www.tilltheis.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/


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
