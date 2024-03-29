/*
 Copyright (c) 2010 Till Theis, http://www.tilltheis.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/


 // variables to export
var setupUserBindings;
var setupUserStorage;


// use closure to prevent namespace pollution
(function() {

// CONSTANTS

var KEY_CODES = {
    KP_0: 96,
    KP_1: 97,
    KP_2: 98,
    KP_3: 99,
    KP_4: 100,
    KP_5: 101,
    KP_6: 102,
    KP_7: 103,
    KP_8: 104,
    KP_9: 105,
    UP:   38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    SPACE: 32,
    A:    65,
    D:    68,
    I:    73,
    J:    74,
    K:    75,
    L:    76,
    M:    77,
    S:    83,
    W:    87,
    COMMA: 188
};

// Opera doesn't distinguish between numpad keys und normal numbers
if (window.opera) {
    KEY_CODES.KP_0 = 48;
    KEY_CODES.KP_1 = 49;
    KEY_CODES.KP_2 = 50;
    KEY_CODES.KP_3 = 51;
    KEY_CODES.KP_4 = 52;
    KEY_CODES.KP_5 = 53;
    KEY_CODES.KP_6 = 54;
    KEY_CODES.KP_7 = 55;
    KEY_CODES.KP_8 = 56;
    KEY_CODES.KP_9 = 57;
}



var ACTIONS = ['hardDrop', 'moveDown', 'moveLeft', 'moveRight', 'rotateLeft', 'rotateRight'];


var KEY_LAYOUTS = {
    numpad: {
        hardDropKey:    KEY_CODES.KP_2,
        moveDownKey:    KEY_CODES.KP_1,
        moveLeftKey:    KEY_CODES.KP_4,
        moveRightKey:   KEY_CODES.KP_6,
        rotateLeftKey:  KEY_CODES.KP_5,
        rotateRightKey: KEY_CODES.KP_8
    },
    notebook: {
        hardDropKey:    KEY_CODES.COMMA,
        moveDownKey:    KEY_CODES.M,
        moveLeftKey:    KEY_CODES.J,
        moveRightKey:   KEY_CODES.L,
        rotateLeftKey:  KEY_CODES.K,
        rotateRightKey: KEY_CODES.I
    },
    arrows: {
        hardDropKey:    KEY_CODES.SPACE,
        moveDownKey:    KEY_CODES.DOWN,
        moveLeftKey:    KEY_CODES.LEFT,
        moveRightKey:   KEY_CODES.RIGHT,
        rotateLeftKey:  0,
        rotateRightKey: KEY_CODES.UP
    },
    wasd: {
        hardDropKey:    KEY_CODES.SPACE,
        moveDownKey:    KEY_CODES.S,
        moveLeftKey:    KEY_CODES.A,
        moveRightKey:   KEY_CODES.D,
        rotateLeftKey:  0,
        rotateRightKey: KEY_CODES.W
    }
};



// FUNCTIONS (context independent)

var keyCodeToChar = function(keyCode) {
    switch (keyCode) {
    case  32: return 'SPACE';
    case  37: return '\u2190'; // LEFTWARDS ARROW
    case  38: return '\u2191'; // UPWARDS ARROW
    case  39: return '\u2192'; // RIGHTWARDS ARROW
    case  40: return '\u2193'; // DOWNWARDS ARROW
    case 188: return ',';
    case 189: return '-';
    case 190: return '.';
    case 191: return '/';

    default:
        if (keyCode >= KEY_CODES.KP_0 && keyCode <= KEY_CODES.KP_9) {
            keyCode = keyCode - KEY_CODES.KP_0 + 48;
        }

        // assume alphabetical letter or digit
        return String.fromCharCode(keyCode);
    }
};

var storeKeyLayout = function(layout) {
    for (var key in layout) {
        if (layout.hasOwnProperty(key)) {
            localStorage[key] = layout[key];
        }
    }
};



// EXPORTS

setupUserStorage = function() {
    var defaultKeyLayout = 'arrows';

    // accessing unsaved values may return null (Mozilla) or undefined (Webkit, Opera)
    if (-1 !== [null, undefined].indexOf(localStorage.hardDropKey)) {
        storeKeyLayout(KEY_LAYOUTS[defaultKeyLayout]);
    }

    localStorage.keyLayout = localStorage.keyLayout || defaultKeyLayout;
    localStorage.startLevel = localStorage.startLevel || 1;
    localStorage.gameSeed = localStorage.gameSeed || '';
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
            'hardDrop':    makeHardDropFunction(),
            'moveDown':    makePieceActionFunction('move', 'down', makeHardDropFunction()),
            'moveLeft':    makePieceActionFunction('move', 'left'),
            'moveRight':   makePieceActionFunction('move', 'right'),
            'rotateLeft':  makePieceActionFunction('rotate', 'left'),
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

        elements[localStorage.keyLayout + 'KeyLayout'].selected = true;

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
        elements.gameSeed.value = localStorage.gameSeed;
    };


    var useCustomKeyLayout = function() {
        elements.customKeyLayout.selected = true;
        localStorage.keyLayout = 'custom';
    };

    var usePredefinedKeyLayout = function(name) {
        clearKeyListeners();

        storeKeyLayout(KEY_LAYOUTS[name]);
        localStorage.keyLayout = name;

        loadKeyBindings();
        populateOptionsForm();
    };





    // LOAD FROM STORAGE

    populateOptionsForm();
    loadKeyBindings();

    

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

    var setupControlInputConnections = function(el) {
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
                (keyCode < 188 || keyCode > 191) && // ',', '-', '.', '/'
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


            // this is no default key layout any longer
            useCustomKeyLayout();


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
                    // is called on every change
                    break;
                }
            }
        }, false);


        el.addEventListener('keydown', function(e) {
            // dont interpret keystroke as game-play input
            e.stopPropagation();
        }, false);
    };

    var controlInputEls = document.getElementsByClassName('control');
    for (i = 0; i < controlInputEls.length; ++i) {
        setupControlInputConnections(controlInputEls[i]);
    }



    var clearKeyListeners = function() {
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
    };




    elements.keyLayouts.addEventListener('change', function() {
        if (this.value === 'custom') {
            useCustomKeyLayout();
        } else {
            usePredefinedKeyLayout(this.value);
        }
    }, false);

    
    
    elements.startStop.addEventListener('click', function() {
        if (gameState.state === 'idle') {
            var level = parseInt(localStorage.startLevel, 10);
            var seed = localStorage.gameSeed || null;
            game.start(level, seed);
            elements.level.innerHTML = level;
        } else {
            game.stop();
        }
    }, false);

    elements.togglePause.addEventListener('click', function() {
        game.togglePause();
    }, false);

    elements.openSettings.addEventListener('click', function() {
        game.pause();
        elements.settings.style.display = 'block';
    }, false);

    elements.closeSettings.addEventListener('click', function() {
        elements.settings.style.display = 'none';
    }, false);

    elements.startLevel.addEventListener('change', function() {
        var num = Math.min(Math.max(parseInt(this.value, 10), 1), 21);
        if (Number.isNaN(num)) num = 1;
        this.value = num;
        localStorage.startLevel = num;
    }, false);

    elements.gameSeed.addEventListener('change', function() {
        this.value = this.value.trim();
        localStorage.gameSeed = this.value;
    }, false);

    elements.resetHighscore.addEventListener('click', function() {
        localStorage.highscore = 0;
        gameState.highscore = 0;
        elements.highscore.innerHTML = '0';
    }, false);



    // setup touch
    (function() {
        var isBetween = function(val, lower, upper, unit) {
            if (unit === undefined) {
                unit = 1;
            }

            return val > lower*unit && val <= upper*unit;
        };

        var direction = function(xDiff, yDiff) {
            var theta = Math.atan2(yDiff, xDiff);

            if (isBetween(theta, -0.75, -0.25, Math.PI)) {
                return 'up';
            } else if (isBetween(theta, -0.25, 0.25, Math.PI)) {
                return 'right';
            } else if (isBetween(theta, 0.25, 0.75, Math.PI)) {
                return 'down';
            } else {
                return 'left';
            }
        };

        var complementDir = function(dir) {
            switch (dir) {
            case 'up':    return 'down';
            case 'down':  return 'up';
            case 'left':  return 'right';
            case 'right': return 'left';
            default: throw 'complementDir(): invalid direction';
            }
        };

        var doRotation = function(touchDir) {
            if (lastRotatetionDir === undefined && lastTouchDir === 'up' && touchDir === 'down') {
                isRotation = false;
                return;
            }

            var rotationDir;

            if (lastRotatetionDir !== undefined && lastTouchDir === complementDir(touchDir)) {
                rotationDir = complementDir(lastRotatetionDir);
            } else {

                if (lastTouchDir === 'up' || lastTouchDir === 'down') {
                    if (touchDir === 'left' || touchDir === 'right') {
                        if (lastTouchDir === 'up') {
                            rotationDir = touchDir;
                        } else {
                            rotationDir = touchDir === 'left' ? 'right' : 'left';
                        }
                    }
                } else {
                    if (touchDir === 'up' || touchDir === 'down') {
                        if (lastTouchDir === 'left') {
                            rotationDir = touchDir === 'up' ? 'right' : 'left';
                        } else {
                            rotationDir = touchDir === 'up' ? 'left' : 'right';
                        }
                    }
                }

            }


            if (rotationDir !== undefined) {
                lastRotatetionDir = rotationDir;
                actions['rotate' + rotationDir.capitalized()]();
            }
        };


        var canvas = document;

        var firstStartTime;
        var startCoords;
        var startTime;
        var isRotation;
        var lastTouchDir;
        var lastRotatetionDir;
        var lastStartCoords;
        var lastStartTime;

        var actions = {
            moveLeft:    bindingOptionsForAction('moveLeft').callback,
            moveRight:   bindingOptionsForAction('moveRight').callback,
            moveDown:    bindingOptionsForAction('moveDown').callback,
            hardDrop:    bindingOptionsForAction('hardDrop').callback,
            rotateLeft:  bindingOptionsForAction('rotateLeft').callback,
            rotateRight: bindingOptionsForAction('rotateRight').callback
        };

        canvas.ontouchstart = function(e) {
            if (game.state.state !== 'running') {
                return;
            }

            if (e.touches.length === 1) {
                startCoords = [e.touches[0].pageX, e.touches[0].pageY];
                firstStartTime = new Date();
                startTime = firstStartTime;
                lastStartTime = undefined;
                isRotation = false;
                lastTouchDir = 'up'; // neutral
                lastRotatetionDir = undefined;
            }
        };

        canvas.ontouchend = function() {
            if (game.state.state !== 'running' || isRotation) {
                return;
            }

            // don't accidentally drop current piece when it was meant for the previous piece
            var aMomentAgo = new Date(new Date().getTime() - 250);
            if (
                lastTouchDir === "down" && 0.5 < (startCoords[1] - lastStartCoords[1]) / (startTime - lastStartTime) &&
                (firstStartTime >= game.state.currentPiece.createdAt || game.state.currentPiece.createdAt < aMomentAgo)
            ) {
                actions.hardDrop();
            } else if (lastStartTime === undefined && firstStartTime >= game.state.currentPiece.createdAt) {
                doRotation('right');
            }
        };

        canvas.ondblclick = function(e) {
            // disable touble tap to zoom on ios safari
            e.preventDefault();
        }

        canvas.ontouchmove = function(e) {
            if (game.state.state !== 'running' || e.touches.length !== 1) {
                return;
            }

            var touch = e.touches[0];
            coords = [touch.pageX, touch.pageY];



            var xDiff = coords[0] - startCoords[0];
            var yDiff = coords[1] - startCoords[1];

            var threshold = 20;
            if (Math.abs(xDiff) >= threshold ||
                Math.abs(yDiff) >= threshold)
            {
                var dir = direction(xDiff, yDiff);

                if (dir === 'up') {
                    isRotation = true;
                }


                if (isRotation) {
                    doRotation(dir);
                } else {
                    actions['move' + dir.capitalized()]();
                }

                lastTouchDir = dir;

                lastStartCoords = startCoords;
                startCoords = coords;
                lastStartTime = startTime;
                startTime = new Date();
            }
        };
    }());



    
    // activate after everything has been set up
    inputManager.activate();
};

}());
