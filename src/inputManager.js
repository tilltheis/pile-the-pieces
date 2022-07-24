/*
 Copyright (c) 2010 Till Theis, http://www.tilltheis.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/


 var InputManager = function(target) {
    var keyListeners = {}; // { keyCode: { callback: f, interval: ms, timer: null }, .. }

    this.addKeyListener = function(keyCode, callback, interval) {
        if (keyListeners[keyCode] !== undefined) {
            throw "InputManager::addKeyListener: Listener for keycode '" + keyCode + "' already registered";
        }


        keyListeners[keyCode] = {
            callback: callback,
            interval: interval,
            timer: null
        };
    };

    this.removeKeyListener = function(keyCode) {
        var obj = keyListeners[keyCode];

        if (obj === undefined) {
            throw "InputManager::removeKeyListener: No Listener for keycode '" + keyCode + "' registered";
        }

        // safe - even when no timeout is set
        clearTimeout(obj.timer);

        delete keyListeners[keyCode]; // delete the property (!not the object directly!)
    };

    this.activate = function() {
        target.addEventListener('keydown', keyDownListener, false);
        target.addEventListener('keyup', keyUpListener, false);
    };

    this.deactivate = function() {
        target.removeEventListener('keydown', keyDownListener, false);
        target.removeEventListener('keyup', keyUpListener, false);

        for (var i in keyListeners) {
            if (keyListeners.hasOwnProperty(i)) {
                clearTimeout(keyListeners[i].timer);
            }
        }
    };


    var keyDownListener = function(e) {
        e.preventDefault();

        var obj = keyListeners[e.keyCode];

        // can be triggered multiple times (before the keyup event)!
        // therefore we have to check the timer which will be set to null by keyUpListener()
        if (obj === undefined || obj.timer !== null) { 
            return;
        }

        obj.callback();

        var interval = obj.interval;
        if (interval !== undefined) {
            var f = function() {
                obj.callback();
                obj.timer = setTimeout(f, interval);
            };

            obj.timer = setTimeout(f, interval);
        }
    };


    var keyUpListener = function(e) {
        e.preventDefault();

        var obj = keyListeners[e.keyCode];

        // interval and timer are interchangeable
        if (obj === undefined || obj.timer === null) {
            return;
        }

        clearTimeout(obj.timer);
        obj.timer = null; // important indicator
    };
};
