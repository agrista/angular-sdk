var sdkIdApp = angular.module('ag.sdk.id', ['ag.sdk.utilities']);

sdkIdApp.factory('objectId', ['localStore', function(localStore) {
    /*
     *
     * Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
     * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
     * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
     * This software is not distributed under version 3 or later of the GPL.
     *
     * Version 1.0.1-dev
     *
     */

    /**
     * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
     * and converts between that format and the standard 24 character representation.
     */
    var ObjectId = (function () {
        var increment = 0;
        var pid = Math.floor(Math.random() * (32767));
        var machine = Math.floor(Math.random() * (16777216));

        // Get local stored machine id
        var mongoMachineId = parseInt(localStore.getItem('mongoMachineId'));

        if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
            machine = Math.floor(localStore.getItem('mongoMachineId'));
        }

        // Just always stick the value in.
        localStore.setItem('mongoMachineId', machine);

        function ObjId() {
            if (!(this instanceof ObjectId)) {
                return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
            }

            if (typeof (arguments[0]) == 'object') {
                this.timestamp = arguments[0].timestamp;
                this.machine = arguments[0].machine;
                this.pid = arguments[0].pid;
                this.increment = arguments[0].increment;
            }
            else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
                this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                    this.machine = Number('0x' + arguments[0].substr(8, 6)),
                    this.pid = Number('0x' + arguments[0].substr(14, 4)),
                    this.increment = Number('0x' + arguments[0].substr(18, 6))
            }
            else if (arguments.length == 4 && arguments[0] != null) {
                this.timestamp = arguments[0];
                this.machine = arguments[1];
                this.pid = arguments[2];
                this.increment = arguments[3];
            }
            else {
                this.timestamp = Math.floor(new Date().valueOf() / 1000);
                this.machine = machine;
                this.pid = pid;
                this.increment = increment++;
                if (increment > 0xffffff) {
                    increment = 0;
                }
            }
        };
        return ObjId;
    })();

    ObjectId.prototype.getDate = function () {
        return new Date(this.timestamp * 1000);
    };

    ObjectId.prototype.toArray = function () {
        var strOid = this.toString();
        var array = [];
        var i;
        for(i = 0; i < 12; i++) {
            array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
        }
        return array;
    };

    /**
     * Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
     */
    ObjectId.prototype.toString = function () {
        var timestamp = this.timestamp.toString(16);
        var machine = this.machine.toString(16);
        var pid = this.pid.toString(16);
        var increment = this.increment.toString(16);
        return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
            '000000'.substr(0, 6 - machine.length) + machine +
            '0000'.substr(0, 4 - pid.length) + pid +
            '000000'.substr(0, 6 - increment.length) + increment;
    };

    ObjectId.prototype.toBase64String = function() {
        return window.btoa(this.toString());
    };

    return function() {
        return new ObjectId();
    };
}]);

sdkIdApp.factory('generateUUID', function () {
    function GenerateUUID () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    return function() {
        return GenerateUUID();
    };
});
