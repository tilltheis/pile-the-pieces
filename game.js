var SHAPES = {
    'o': {
        name: 'o',
        size: 2,
        mask: [
            [1, 1],
            [1, 1]
        ]
    },
    't': {
        name: 't',
        size: 3,
        mask: [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ]
    },
    'z': {
        name: 'z',
        size: 3,
        mask: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    },
    's': {
        name: 's',
        size: 3,
        mask: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    'l': {
        name: 'l',
        size: 3,
        mask: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    'j': {
        name: 'j',
        size: 3,
        mask: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    'i': {
        name: 'i',
        size: 4,
        mask: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    }
};


var Field = function() {
    var self = this;

    var eventManager = new EventManager();
    this.registerCallback = eventManager.connect;
    this.unregisterCallback = eventManager.disconnect;

    this.blocks = [];
    this.width = 10;
    this.height = 20;

    this.reset = function() {
        var w = this.width, h = this.height;
        var blocks = this.blocks;

        var i, j;
        for (i = 0; i < h; ++i) {
            blocks[i] = [];
            blocks[i].length = w;
            for (j = 0; j < w; ++j) {
                blocks[i][j] = null;
            }
        }

        eventManager.emit('reset');
    };

    this.getFullRows = function() {
        var i, j, isFullRow;
        var rows = [];
        var blocks = this.blocks;
        var w = this.width, h = this.height;

        for (i = 0; i < h; ++i) {
            isFullRow = true;

            for (j = 0; j < w; ++j) {
                if (blocks[i][j] === null) {
                    isFullRow = false;
                    break;
                }
            }

            if (isFullRow) {
                rows.push(i);
            }
        }

    return rows;
    };


    this.clearRow = function(row) {
        var i, j;
    var w = this.width;
    var blocks = this.blocks;

        for (i = row; i > 0; --i) {
            for (j = 0; j < w; ++j) {
                blocks[i][j] = blocks[i - 1][j];
            }
        }

        for (j = 0; j < w; ++j) {
            blocks[0][j] = null;
        }

    eventManager.emit('clearRow');
    };

    
    (function() {
    eventManager.registerEvent('reset', self);
    eventManager.registerEvent('clearRow', self);

    self.reset();
    }());
};


var rotateShapeMask = function(mask, angle) {
    if (angle % 90 !== 0) {
        throw 'rotateShapeMask: Invalid angle argument (' + angle + ')';
    }

    angle = ((angle % 360) + 360) % 360;

    if (angle === 0) {
        return mask;
    }

    
    var i, y, x, translate;

    var size = mask.length;
    var newMask = [];

    newMask.length = size;
    for (i = 0; i < size; ++i) {
        newMask[i] = [];
        newMask[i].length = size;
    }


    switch (angle) {
    case 90:
        translate = function(x, y) {
            return mask[x][size - 1 - y];
        };
        break;
    case 180:
        translate = function(x, y) {
            return mask[size - 1 - y][size - 1 - x];
        };
        break;
    case 270: 
        translate = function(x, y) {
            return mask[size - 1 - x][y];
        };
        break;
    }

    // [0, 0] is the upper left corner
    for (y = 0; y < size; ++y) {
        for (x = 0; x < size; ++x) {
            newMask[y][x] = translate(x, y);
        }
    }

    return newMask;
};


var countFirstEmptyRowsOfShapeMask = function(mask) {
    var i, j;
    var size = mask.length;
    var count = 0;

    for (i = 0; i < size; ++i) {
        for (j = 0; j < size; ++j) {
            if (mask[i][j]) {
                return count;
            }
        }

        count += 1;
    }

    return count;
};


var Piece = function(field, shape) {
    var self = this;

    var eventManager = new EventManager();

    this.registerCallback = eventManager.connect;
    this.unregisterCallback = eventManager.disconnect;


    this.state = {
        position: {
            x: 0,
            y: 0
        },
        rotation: 0
    };

  
    this.rotate = function(direction) {
        if (direction !== 'left' && direction !== 'right') {
            throw 'Piece::canRotate: Invalid direction argument )' + direction + ')';
        }

        var angle = direction === 'left' ? 90 : -90;

        this.state.rotation = (this.state.rotation + angle) % 360;

        eventManager.emit('rotate');
    };
    
    this.canRotate = function(direction) {
        if (direction !== 'left' && direction !== 'right') {
            throw 'Piece::canRotate: Invalid direction argument (' + direction + ')';
        }

        var angle = direction === 'left' ? 90 : -90;

        var newState = {
            position: this.state.position, // object usage is safe because it's not modified
            rotation: this.state.rotation + angle
        };

        return !isCollision(newState);
    };

    this.move = function(direction) {
        switch (direction) {
        case 'left':  this.state.position.x -= 1; break;
        case 'right': this.state.position.x += 1; break;
        case 'down':  this.state.position.y += 1; break;
        default: throw 'Piece::canMove: Invalid direction argument (' + direction + ')';
        }

        eventManager.emit('move');
    };


    this.canMove = function(direction) {
        var oldPosition = this.state.position;

        var newState = {
            position: {
                x: oldPosition.x,
                y: oldPosition.y
            },
            rotation: this.state.rotation
        };

        switch (direction) {
        case 'left':  newState.position.x -= 1; break;
        case 'right': newState.position.x += 1; break;
        case 'down':  newState.position.y += 1; break;
        default: throw 'Piece::canMove: Invalid direction argument (' + direction + ')';
        }

        return !isCollision(newState);
    };

    this.hardDrop = function() {
        while (this.canMove('down')) {
            this.state.position.y += 1;
        }

        eventManager.emit('hardDrop');
    };

    this.mergeWithField = function() {
        var i, j, x, y;

        var mask = rotateShapeMask(shape.mask, this.state.rotation);

        var size = shape.size;
        var position = this.state.position;
        var blocks = field.blocks;
        var id = shape.name;

        for (i = 0; i < size; ++i) {
            for (j = 0; j < size; ++j) {
                if (mask[i][j]) {
                    y = position.y + i;
                    x = position.x + j;

                    if (y >= 0) { // could be hidden in the last round
                        blocks[y][x] = id;
                    }
                }
            }
        }

        eventManager.emit('mergeWithField');
    };



    var isCollision = function(state) {
        var i, j, x, y;

        var mask = rotateShapeMask(shape.mask, state.rotation);
        var size = shape.size;
        var blocks = field.blocks;
        var w = field.width, h = field.height;
        var position = state.position;
        var posX = position.x, posY = position.y;

        var numEmptyRows = countFirstEmptyRowsOfShapeMask(mask);

        for (i = 0; i < size; ++i) {
            for (j = 0; j < size; ++j) {
                if (mask[i][j]) {
                    y = posY + i;
                    x = posX + j;

                    if (x < 0 || x >= w ||
                        y >= h || // if y < 0 it's invisible
                        (y >= 0 && blocks[y][x] !== null))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    };



    (function() {
        var countLastEmptyRowsOfShapeMask = function(mask) {
            var i, j;
            var size = mask.length;
            var count = 0;

            for (i = size - 1; i >= 0; --i) {
                for (j = 0; j < size; ++j) {
                    if (mask[i][j]) {
                        return count;
                    }
                }

                count += 1;
            }

            return count;
        };

        var position = self.state.position;
        position.x = parseInt(field.width / 2 - shape.size / 2, 10);
        position.y = 0 - shape.size + countLastEmptyRowsOfShapeMask(shape.mask);

        eventManager.registerEvent('rotate', self);
        eventManager.registerEvent('move', self);
        eventManager.registerEvent('hardDrop', self);
        eventManager.registerEvent('mergeWithField', self);
    }());
};





var Game = function(field) {
    var self = this;

    var startLevel;

    var eventManager = new EventManager();

    this.registerCallback = eventManager.connect;
    this.unregisterCallback = eventManager.disconnect;


    this.state = {
        level: 1,
        state: 'idle',
        score: 0,
        currentShape: null,
        nextShape: null,
        currentPiece: null,
    };

    this.minDelayOnNewPiece = 0;


    this.start = function(level) {
        var state = this.state;

        level = parseInt(level, 10); // a string would result in miscalculations

        startLevel = level;

        state.level = level;
        state.state = 'running';
        state.score = 0;
        state.clearedLines = 0;
        state.nextShape = getRandomShape();

        field.reset();

        insertRandomPiece();

        runLoopTimer = setTimeout(runLoop, dropIntervalForLevel(level));

        eventManager.emit('stateChange');
        eventManager.emit('levelUp');
    };

    this.stop = function() {
        var state = this.state;

        clearTimeout(runLoopTimer);
        state.state = 'idle';
        eventManager.emit('stateChange');
    };

    this.togglePause = function() {
        var state = this.state;

        switch (state.state) {
        case 'running':
            state.state = 'paused';
            clearTimeout(runLoopTimer);
            break;

        case 'paused':
            state.state = 'running';
            runLoopTimer = setTimeout(runLoop, dropIntervalForLevel(state.level));
            break;

        default:
            throw 'Game::togglePause: Game is not running';
        }

        eventManager.emit('stateChange');
    };


    var runLoopTimer;
    var runLoop = function() {
        var state = self.state;
        var delay;

        if (!self.state.currentPiece.canMove('down')) {
            var currentPiece = state.currentPiece;

            // field full?
            var rotatedShapeMask =
                rotateShapeMask(state.currentShape.mask,
                                state.currentPiece.state.rotation);
            var numEmptyRows = countFirstEmptyRowsOfShapeMask(rotatedShapeMask);

            if (currentPiece.state.position.y < 0 - numEmptyRows) {
                self.stop();
                return;
            }


            currentPiece.mergeWithField();

            var fullRows = field.getFullRows();
            var numFullRows = fullRows.length;
            if (numFullRows > 0) {
                for (var i = 0; i < numFullRows; ++i) {
                    field.clearRow(fullRows[i]);
                }


                var mul = 0;

                switch (numFullRows) {
                case 1: mul = 40;   break;
                case 2: mul = 100;  break;
                case 3: mul = 300;  break;
                case 4: mul = 1200; break;
                };

                state.score += (state.level + 1) * mul + mul;
            }

            state.clearedLines += numFullRows;

            var oldLevel = state.level;
            state.level = startLevel + parseInt(state.clearedLines / 10, 10);

            if (state.level !== oldLevel) {
                eventManager.emit('levelUp');
            }

            insertRandomPiece();

            delay = dropIntervalForLevel(state.level);

            if (delay < self.minDelayOnNewPiece) {
                delay = self.minDelayOnNewPiece;
            }
        } else {
            state.currentPiece.move('down');
            delay = dropIntervalForLevel(state.level);
        }

        runLoopTimer = setTimeout(runLoop, delay);
    };



    var dropIntervalForLevel = function(level) {
        return 1000 * Math.pow(0.8, level/2);
    };


    var getRandomShape = function() {
        var names = 'ijlostz';
        var idx = parseInt(Math.random() * names.length, 10);
        return SHAPES[names[idx]];
    };

    var insertRandomPiece = function() {
        var state = self.state;

        var shape = state.nextShape;

        state.currentShape = shape;
        state.nextShape = getRandomShape();
        state.currentPiece = new Piece(field, shape);

        state.currentPiece.registerCallback('hardDrop', function() {
            clearTimeout(runLoopTimer);
            runLoop();
        });

        eventManager.emit('newPiece');
    };


    (function() {
        eventManager.registerEvent('stateChange', self);
        eventManager.registerEvent('levelUp', self);
        eventManager.registerEvent('newPiece', self);
    }());
};
