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
	    clearTimeout(keyListeners[i].timer);
	}
    };

    
    var keyDownListener = function(e) {
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
	var obj = keyListeners[e.keyCode];

	// interval and timer are interchangeable
	if (obj === undefined || obj.timer === null) {
	    return;
	}

	clearTimeout(obj.timer);
	obj.timer = null; // important indicator
    };
};