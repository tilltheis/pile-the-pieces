/*
 Copyright (c) 2010 Till Theis, http://www.tilltheis.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/


 if (!String.prototype.capitalized) {
    String.prototype.capitalized = function() {
        return this.replace(/(\w)(\w*)\b/g, function($0, $1, $2) {
            return $1.toUpperCase() + $2.toLowerCase();
        });
    };
}



if (!document.getElementsByClassName) {
    if (!Element.prototype.hasClassName) {
        Element.prototype.hasClassName = function(cl) {
            return (new RegExp('(^| )' + cl + '( |$)')).test(this.className);
        };
    }

    document.getElementsByClassName = function(cl) {
        var input = document.getElementsByTagName('*');
        var output = [];

        for (var i = 0; i < input.length; ++i) {
            if (input[i].hasClassName(cl)) {
                output[output.length] = input[i];
            }
        }

        return output;
    };
}


var clone = function(obj){
    if(obj === null || typeof(obj) != 'object') {
        return obj;
    }

    var temp = obj.constructor(); // changed

    for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
            temp[key] = clone(obj[key]);
        }
    }

    return temp;
};


var triggerEvent = function(target, eventType, optionalCanBubble, optionalCancelable) {
    var canBubble = undefined === optionalCanBubble ? true : optionalCanBubble;
    var cancelable = undefined === optionalCancelable ? true : optionalCancelable;
    var event = document.createEvent('Event');
    event.initEvent(eventType, canBubble, cancelable);
    target.dispatchEvent(event);
};


var stringifyNumber = function(num) {
    var inStr = num + '';
    var outStr = '';

    var len = inStr.length;
    for (var i = len - 1, j = 1; i >= 0; --i, ++j) {
        outStr = inStr.charAt(i) + outStr;

        if (j % 3 === 0 && j !== len) {
            outStr = '.' + outStr;
        }
    }

    return outStr;
};
