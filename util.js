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


function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
};


function triggerEvent(target, eventType, optionalCanBubble, optionalCancelable) {
    var canBubble = undefined === optionalCanBubble ? true : optionalCanBubble;
    var cancelable = undefined === optionalCancelable ? true : optionalCancelable;
    var event = document.createEvent('Event');
    event.initEvent(eventType, canBubble, cancelable);
    target.dispatchEvent(event);
};


function stringifyNumber(num) {
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
