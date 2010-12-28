// variables to export
var setupUserBindings;
var setupUserStorage;


// use closure to prevent namespace pollution
(function() {

// CONSTANTS

var KEY_CODES;

// Opera doesn't distinguish between numpad keys und normal numbers
if (window.opera) {
    KEY_CODES = {
        KP_0: 48,
        KP_1: 49,
        KP_2: 50,
        KP_3: 51,
        KP_4: 52,
        KP_5: 53,
        KP_6: 54,
        KP_7: 55,
        KP_8: 56,
        KP_9: 57
    };
} else {
    KEY_CODES = {
        KP_0: 96,
        KP_1: 97,
        KP_2: 98,
        KP_3: 99,
        KP_4: 100,
        KP_5: 101,
        KP_6: 102,
        KP_7: 103,
        KP_8: 104,
        KP_9: 105
    };
}

var ACTIONS = ['hardDrop', 'moveDown', 'moveLeft', 'moveRight', 'rotateLeft', 'rotateRight'];



// FUNCTIONS (context independent)

function keyCodeToChar(keyCode) {
    switch (keyCode) {
    case 32: return 'SPACE';
    case 37: return '\u2190'; // LEFTWARDS ARROW
    case 38: return '\u2191'; // UPWARDS ARROW
    case 39: return '\u2192'; // RIGHTWARDS ARROW
    case 40: return '\u2193'; // DOWNWARDS ARROW

    default:
        if (keyCode >= KEY_CODES.KP_0 && keyCode <= KEY_CODES.KP_9) {
            keyCode = keyCode - KEY_CODES.KP_0 + 48;
        }

        return String.fromCharCode(keyCode);
    }
}



// EXPORTS

setupUserStorage = function() {
    // accessing unsaved values may return null (Mozilla) or undefined (Webkit, Opera)
    if (!localStorage.hardDropKey) {
        localStorage.hardDropKey    = KEY_CODES.KP_2;
        localStorage.moveDownKey    = KEY_CODES.KP_1;
        localStorage.moveLeftKey    = KEY_CODES.KP_4;
        localStorage.moveRightKey   = KEY_CODES.KP_6;
        localStorage.rotateLeftKey  = KEY_CODES.KP_5;
        localStorage.rotateRightKey = KEY_CODES.KP_8;
    }

    localStorage.startLevel = localStorage.startLevel || 1;
};


setupUserBindings = function(game, elements) {

    // VARIABLES

    var inputManager = new InputManager(document);
    var gameState = game.state;
    


    // FUNCTIONS

    var loadKeyBindings = function() {
        var action, keyCode;
        for (var i = 0, l = ACTIONS.length; i < l; ++i) {
            action = ACTIONS[i];
            keyCode = localStorage[action + 'Key'];
            mapKeyBinding(keyCode, action);
        }
    };

    var bindingOptionsForAction = function(action) {
        var makeHardDropFunction = function() {
            return function() {
                gameState.currentPiece.hardDrop();
            };
        };

        var makePieceActionFunction = function(action, direction, onCannotPerform) {
            return function() {
                var piece = gameState.currentPiece;
                if (piece['can' + action.capitalized()](direction)) {
                    piece[action](direction);
                } else if (onCannotPerform) {
                    onCannotPerform();
                }
            };
        };

        
        var callbacks = {
            'hardDrop': makeHardDropFunction(),
            'moveDown': makePieceActionFunction('move', 'down', makeHardDropFunction()),
            'moveLeft': makePieceActionFunction('move', 'left'),
            'moveRight': makePieceActionFunction('move', 'right'),
            'rotateLeft': makePieceActionFunction('rotate', 'left'),
            'rotateRight': makePieceActionFunction('rotate', 'right')
        };


        var options = {};

        options.callback = callbacks[action];
        
        if (action.substr(0, 4) === 'move') {
            options.interval = 100;
        } else if (action.substr(0, 6) === 'rotate') {
            options.interval = 200;
        }

        return options;
    };


    var mapKeyBinding = function(keyCode, action) {
        var options = bindingOptionsForAction(action);

        try {
            inputManager.removeKeyListener(localStorage[action + 'Key']);
        } catch (e) {
            // no registered listener or no saved bindings
        }
        
        try {
            // will throw when key is already bound
            inputManager.addKeyListener(keyCode, options.callback, options.interval);
        } catch (e2) {
            inputManager.removeKeyListener(keyCode);
            inputManager.addKeyListener(keyCode, options.callback, options.interval);
        }

        localStorage[action + 'Key'] = keyCode;
    };


    var populateOptionsForm = function() {
        var i, len, input, keyCode;

        var controlEls = document.getElementsByClassName('control');

        len = controlEls.length;
        for (i = 0; i < len; ++i) {
            input = controlEls[i];
            keyCode = +localStorage[input.id]; // i.e. "moveDownKey"

            if (keyCode) { // can be 0
                input.value = keyCodeToChar(keyCode);
            }
        }

        elements.startLevel.value = localStorage.startLevel;
    };





    // LOAD FROM STORAGE

    populateOptionsForm();
    loadKeyBindings();
    game.minDelayOnNewPiece = 5 * bindingOptionsForAction('moveLeft').interval;

    

    // GAME CONNECTIONS

    game.registerCallback('stateChange', function() {
        var startStop = elements.startStop;
        var togglePause = elements.togglePause;

        switch (this.state.state) {
        case 'running':
            startStop.disabled = false;
            togglePause.disabled = false;
            startStop.innerHTML = 'Stop';
            togglePause.innerHTML = 'Pause';
            togglePause.focus();
            break;

        case 'paused':
            togglePause.innerHTML = 'Continue';
            break;

        case 'idle':
            togglePause.disabled = true;
            startStop.innerHTML = 'Start';
            startStop.focus();
        }
    });


    game.registerCallback('stateChange', function() {
        if (this.state.state === 'running') {
            inputManager.activate();
        } else {
            inputManager.deactivate();
        }
    });



    // DOM CONNECTIONS

    var controlInputEls = document.getElementsByClassName('control');
    for (i = 0; i < controlInputEls.length; ++i) {
        (function(el) {
            el.addEventListener('keydown', function(e) {
                var id = this.id;
                var action = id.substr(0, id.length - 3);

                var keyCode = e.keyCode;

                if (keyCode !== 9) { // tab
                    // don't change input box value
                    // but leave tab functionality intact
                    e.preventDefault();
                }

                // convert numpad numbers to normal numbers
                if (keyCode >= KEY_CODES.KP_0 && keyCode <= KEY_CODES.KP_9) {
                    keyCode = keyCode - KEY_CODES.KP_0 + 48; // '0' = 48
                }


                // only accept letters, numbers, spaces and arrow keys
                if ((keyCode < 48 || keyCode > 57) && // '0' = 48, '9' = 57
                    (keyCode < 65 || keyCode > 90) && // 'A' = 65, 'Z' = 90
                    (keyCode < 37 || keyCode > 40) && // <LEFT> = 37, <DOWN> = 40
                    keyCode !== 32)                   // ' ' = 32
                {
                    if (keyCode === 8 && this.value !== 'EMPTY') { // backspace
                        inputManager.removeKeyListener(localStorage[this.id]);
                        this.value = "EMPTY";

                        // '0' is not equal to false, therefore it won't be changed
                        // by setupUserStorage()
                        localStorage[this.id] = '0';
                    }

                    return;
                }


                var character = keyCodeToChar(keyCode);

                // opera always inserts the typed char into the field's value
                // (even though it's set '')
                if (window.opera) {
                    this.value = '';
                    var that = this;
                    setTimeout(function() { that.value = character; }, 0);
                } else {
                    this.value = character;
                }


                // convert all numbers to numpad numbers
                if (keyCode >= 48 && keyCode <= 57) { // '0' = 48, '9' = 57
                    keyCode = keyCode - 48 + KEY_CODES.KP_0;
                }


                mapKeyBinding(keyCode, action);
                

                // remove possible duplicate of the key (bound to another action)

                var len = controlInputEls.length;
                var value = this.value;
                var el;
                for (var i = 0; i < len; ++i) {
                    el = controlInputEls[i];

                    if (el.value === value && el.id !== id) {
                        el.value = 'EMPTY';
                        localStorage[el.id] = 0;

                        // there can only be one duplicate because this function
                        // will be called on every change
                        break;
                    }
                }
            }, false);


            el.addEventListener('keydown', function(e) {
                // dont interpret keystroke as game-play input
                e.stopPropagation();
            }, false);
        }(controlInputEls[i]));
    }



    elements.resetControls.addEventListener('click', function(e) {
        var key, keyCode;

        for (var i = 0, l = ACTIONS.length; i < l; ++i) {
            key = ACTIONS[i] + 'Key';
            keyCode = localStorage[key];
            
            if (keyCode !== '0') {
                // remove listener to not have multiple keys for the same action
                inputManager.removeKeyListener(keyCode);
            }

            delete localStorage[key];
        }

        setupUserStorage(); // will fill in default bindings
        populateOptionsForm();
        loadKeyBindings();
    }, false);

    
    
    elements.startStop.addEventListener('click', function() {
        if (gameState.state === 'idle') {
            var level = localStorage.startLevel;
            game.start(level);
            elements.level.innerHTML = level;
        } else {
            game.stop();
        }
    }, false);

    elements.togglePause.addEventListener('click', function() {
        game.togglePause();
    }, false);

    elements.startLevel.addEventListener('change', function() {
        var num = Math.min(Math.max(parseInt(this.value, 10), 1), 50);
        this.value = num;
        localStorage.startLevel = num;
    }, false);

    elements.resetHighscore.addEventListener('click', function() {
        localStorage.highscore = 0;
        gameState.highscore = 0;
        elements.highscore.innerHTML = '0';
    }, false);


    
    // activate after everything has been set up
    inputManager.activate();
};

}());
