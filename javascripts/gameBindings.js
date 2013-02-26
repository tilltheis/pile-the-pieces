/*
 Copyright (c) 2010 Till Theis, http://www.tilltheis.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/


 // variables to export
var setupGameBindings;
var setupGameStorage;


// use closure to prevent namespace pollution
(function() {

// CONSTANTS

var PX_PER_UNIT = 20;

var IMG_FOR_SHAPE = {}; // will be filled by setupGameBindings()

var PREVIEW_SHAPE_SIZE = {
    'i': { w: 4, h: 1 },
    'j': { w: 3, h: 2 },
    'l': { w: 3, h: 2 },
    'o': { w: 2, h: 2 },
    's': { w: 3, h: 2 },
    't': { w: 3, h: 2 },
    'z': { w: 3, h: 2 }
};



// FUNCTIONS (context independent)

var drawField = function(field, ctx) {
    var canvas = ctx.canvas;
    var oldWidth = canvas.width;
    canvas.width = 0;
    canvas.width = oldWidth;

    var blocks = field.blocks;
    var blocksLen = blocks.length;

    var y, x, len;
    var img;
    for (y = 0; y < blocksLen; ++y) {
    len = blocks[y].length;

        for (x = 0; x < len; ++x) {
            if (blocks[y][x] !== null) {
                img = IMG_FOR_SHAPE[blocks[y][x]];
                ctx.drawImage(img, x * PX_PER_UNIT, y * PX_PER_UNIT);
            }
        }
    }
};

var drawPiece = function(piece, shape, ctx) {
    var i, j, x, y;

    var mask = rotateShapeMask(shape.mask, piece.state.rotation);
    var size = shape.size;
    var pos = piece.state.position;
    var posX = pos.x, posY = pos.y;

    var img = IMG_FOR_SHAPE[shape.name];

    for (i = 0; i < size; ++i) {
        for (j = 0; j < size; ++j) {
            if (mask[i][j]) {
                y = posY + i;
                x = posX + j;

                if (y >= 0) { // could be partially hidden
                    ctx.drawImage(img, x * PX_PER_UNIT, y * PX_PER_UNIT);
                }
            }
        }
    }
};

var drawShadowPiece = function(field, piece, shape, ctx) {
    var shadowShape = clone(shape);
    shadowShape.name = 'shadow';

    var shadowPiece = new Piece(field, shadowShape);
    shadowPiece.state = clone(piece.state);
    shadowPiece.hardDrop();
    
    drawPiece(shadowPiece, shadowShape, ctx);
    drawPiece(piece, shape, ctx); // redraw possibly hidden piece
};

var drawPreviewShape = function(shape, ctx) {
    var size = PREVIEW_SHAPE_SIZE[shape.name];
    var mask = shape.mask;

    var numEmptyRows = [0, 0]; // 0: from top, 1: from left

    var i, j, l = shape.size;
    var tmpMask, isEmptyRow;

    for (var idx = 0; idx < 2; ++idx) {
        tmpMask = rotateShapeMask(mask, idx * 90);

        for (i = 0; i < l; ++i) {
            isEmptyRow = true;

            for (j = 0; j < l; ++j) {
                if (tmpMask[i][j]) {
                    isEmptyRow = false;
                    break;
                }
            }

            if (isEmptyRow) {
                numEmptyRows[idx] += 1;
            } else {
                break;
            }
        }

    }


    var xOffset = ((4 - size.w) / 2 - numEmptyRows[1]) * PX_PER_UNIT;
    var yOffset = ((4 - size.h) / 2 - numEmptyRows[0]) * PX_PER_UNIT;


    var img = IMG_FOR_SHAPE[shape.name];

    for (i = 0; i < l; ++i) {
        for (j = 0; j < l; ++j) {
            if (mask[i][j]) {
                ctx.drawImage(img, xOffset + j * PX_PER_UNIT, yOffset + i * PX_PER_UNIT);
            }
        }
    }
};





// EXPORT

setupGameStorage = function() {
    localStorage.highscore = localStorage.highscore || 0;
};

setupGameBindings = function(game, field, elements) {
    // VARS

    var gameState = game.state;

    var fieldCtx = elements.field.getContext('2d');
    var nextPieceCtx = elements.nextPiece.getContext('2d');



    // MISC

    var nextPieceCanvas = elements.nextPiece;
    nextPieceCanvas.width  = 4 * PX_PER_UNIT;
    nextPieceCanvas.height = 4 * PX_PER_UNIT;

    var fieldCanvas = elements.field;
    fieldCanvas.width = field.width * PX_PER_UNIT;
    fieldCanvas.height = field.height * PX_PER_UNIT;

    (function() {
        var names = ['i', 'j', 'l', 'o', 's', 't', 'z', 'shadow'];
        for (var i = 0, l = names.length; i < l; ++i) {
            IMG_FOR_SHAPE[names[i]] = elements[names[i] + 'PieceImg'];
        }
    }());


    
    // LOAD FROM STORAGE
    
    elements.highscore.innerHTML = stringifyNumber(localStorage.highscore);



    // GAME CONNECTIONS

    game.registerCallback('stateChange', function() {
        if (this.state.state === 'idle') {
            localStorage.highscore = Math.max(localStorage.highscore, gameState.score);
            
            elements.highscore.innerHTML = stringifyNumber(localStorage.highscore);
        }
    });

    game.registerCallback('stateChange', function() {
        elements.status.innerHTML = gameState.state.replace(/idle/, 'game over');

        elements.status.style.display = gameState.state === 'running' ? 'none' : 'block';
    });

    game.registerCallback('levelUp', function() {
        elements.level.innerHTML = gameState.level;
    });

    game.registerCallback('newPiece', function() {
        elements.score.innerHTML = stringifyNumber(gameState.score);
    });


    // setup connections for new pieces
    game.registerCallback('newPiece', function() {
        var piece = gameState.currentPiece;
        var shape = gameState.currentShape;

        var draw = function() {
            drawField(field, fieldCtx);
            drawPiece(piece, shape, fieldCtx);
        };

        piece.registerCallback('move', draw);
        piece.registerCallback('rotate', draw);
        piece.registerCallback('mergeWithField', function() {
            drawField(field, fieldCtx);
        });

        drawField(field, fieldCtx);
    });


    (function() {
        var htmlTimer = elements.elapsedTime;
        var duration = 0; // ms
        var durationTimerLoop = function() {
            var durationDate = new Date(duration);

            var min = durationDate.getMinutes();
            var sec = durationDate.getSeconds();
            var msec = durationDate.getMilliseconds();

            var pad = function(str) {
                return (str + '').length < 2 ? '0' + str : str;
            };

            htmlTimer.innerHTML = pad(min) + ':' + pad(sec) + ':' + (msec + '').substr(0,1) + ('0');

            duration += 100;
        };

        var durationTimer;


        game.registerCallback('stateChange', function() {
            switch (gameState.state) {
            case 'idle':
                duration = 0;
                // fall through
            case 'paused':
                clearInterval(durationTimer);
                break;

            case 'running':
                durationTimer = setInterval(durationTimerLoop, 100);
                break;
            }
        });
    }());


    // draw preview for next piece
    game.registerCallback('newPiece', function() {
        var oldWidth = nextPieceCanvas.width;
        nextPieceCanvas.width = 0;
        nextPieceCanvas.width = oldWidth;
        
        drawPreviewShape(gameState.nextShape, nextPieceCtx);
    });
    

    // draw shadow
    game.registerCallback('newPiece', function() {
        var piece = gameState.currentPiece;

        var draw = function() {
            drawShadowPiece(field, piece, gameState.currentShape, fieldCtx);
        };

        piece.registerCallback('rotate', draw);
        piece.registerCallback('move', draw);

        draw();
    });




    // FIELD CONNECTIONS

    field.registerCallback('clearRow', function() {
        drawField(field, fieldCtx);
    });

    field.registerCallback('clearRow', function() {
        var el = elements.clearedLines;
        el.innerHTML = parseInt(el.innerHTML, 10) + 1;
    });

};

}());
