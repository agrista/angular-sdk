var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', 'underscore',
    function (documentHelper, underscore) {
        var _listServiceMap = function(item) {
            var map = {
                id: item.id || item.$id,
                date: item.date
            };

            if (typeof item.actor === 'object') {
                // User is the actor
                if (item.actor.displayName) {
                    map.title = item.actor.displayName;
                    map.subtitle = item.actor.displayName;
                }
                else {
                    map.title = item.actor.firstName + ' ' + item.actor.lastName;
                    map.subtitle = item.actor.firstName + ' ' + item.actor.lastName;
                }

                if (item.actor.position) {
                    map.title += ' (' + item.actor.position + ')';
                }

                map.profilePhotoSrc = item.actor.profilePhotoSrc;
            } else if (item.organization) {
                // Organization is the actor
                map.title = item.organization.name;
                map.subtitle = item.organization.name;
            } else {
                // Unknown actor
                map.title = 'Someone';
                map.subtitle = 'Someone';
            }

            map.subtitle += ' ' + _getActionVerb(item.action) + ' ';
            map.referenceId = (underscore.contains(['farmer', 'merchant', 'user'], item.referenceType) ? item.organization.id : item[item.referenceType + 'Id']);

            if (item.referenceType === 'document' && !underscore.isUndefined(item[item.referenceType])) {
                map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + documentHelper.getDocumentTitle(item[item.referenceType].docType) + ' ' + item.referenceType;
                map.referenceState = 'document.details';
            } else if (item.referenceType === 'farmer' && !underscore.isUndefined(item.organization)) {
                if (item.action === 'invite') {
                    map.subtitle += item.organization.name + ' to create an Agrista account';
                } else if (item.action === 'register') {
                    map.subtitle += 'the request to join Agrista';
                } else if (item.action === 'create') {
                    map.subtitle += 'a customer portfolio for ' + item.organization.name;
                }

                map.referenceState = 'customer.details';
            } else if (item.referenceType === 'task' && !underscore.isUndefined(item[item.referenceType])) {
                map.subtitle += 'the ' + taskHelper.getTaskTitle(item[item.referenceType].todo) + ' ' + item.referenceType;
                map.referenceState = documentHelper.getTaskState(item[item.referenceType].todo);
            } else if (item.referenceType === 'merchant' && !underscore.isUndefined(item.organization)) {
                if (item.action === 'invite') {
                    map.subtitle += item.organization.name + ' to create an Agrista account';
                    map.referenceState = 'merchant';
                } else if (item.action === 'register') {
                    map.subtitle += 'the request to join Agrista';
                    map.referenceState = 'merchant';
                } else if (item.action === 'create') {
                    map.subtitle += 'a merchant portfolio for ' + item.organization.name;
                    map.referenceState = 'merchant';
                } else if (item.action === 'decline') {
                    map.subtitle += 'a task for ' + item.organization.name;
                } else {
                    map.subtitle += 'the portfolio of ' + item.organization.name;
                }
            } else if (item.referenceType === 'user' && !underscore.isUndefined(item.organization)) {
                if (item.action === 'invite') {
                    map.subtitle += item.organization.name + ' to create a user';
                } else if (item.action === 'register') {
                    map.subtitle += 'the request to create a user';
                }
            } else {
                map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
            }

            if (item.actor && underscore.contains(['document', 'task'], item.referenceType) && item.organization && item.organization.name) {
                map.subtitle += ' ' + _getActionPreposition(item.action) + ' ' + item.organization.name;
            }

            return map;
        };

        var _getActionPreposition = function (action) {
            return _actionPrepositionExceptionMap[action] || 'for';
        };

        var _getActionVerb = function (action) {
            var vowels = ['a', 'e', 'i', 'o', 'u'];

            return _actionVerbExceptionMap[action] || (action.lastIndexOf('e') === action.length - 1 ? action + 'd' : action.lastIndexOf('y') === action.length - 1 ? (vowels.indexOf(action.substr(action.length - 1, action.length)) === -1 ? action.substr(0, action.length - 1)  + 'ied' : action + 'ed') : action + 'ed');
        };

        var _getReferenceArticle = function (reference) {
            var vowels = ['a', 'e', 'i', 'o', 'u'];

            return _referenceArticleExceptionMap[reference] || (vowels.indexOf(reference.substr(0, 1)) !== -1 ? 'an' : 'a');
        };

        var _actionPrepositionExceptionMap = {
            'share': 'of',
            'sent': 'to'
        };

        var _actionVerbExceptionMap = {
            'register': 'accepted',
            'sent': 'sent'
        };

        var _referenceArticleExceptionMap = {
            'asset register': 'an'
        };

        return {
            listServiceMap: function() {
                return _listServiceMap;
            },
            getActionVerb: _getActionVerb,
            getReferenceArticle: _getReferenceArticle
        }
    }]);

sdkHelperFavouritesApp.factory('notificationHelper', [function () {
    var _listServiceMap = function(item) {
        return {
            id: item.id || item.$id,
            title: item.sender,
            subtitle: item.message,
            state: _notificationState(item.notificationType, item.dataType)
        };
    };

    var _notificationState = function (notificationType, dataType) {
        var state = (_notificationMap[notificationType] ? _notificationMap[notificationType].state : 'view');

        return ('notification.' + state + '-' + dataType);
    };

    var _notificationMap = {
        'reassign': {
            title: 'Reassign',
            state: 'manage'
        },
        'import': {
            title: 'Import',
            state: 'import'
        },
        'view': {
            title: 'View',
            state: 'view'
        },
        'reject': {
            title: 'Rejected',
            state: 'view'
        },
        'review': {
            title: 'Review',
            state: 'view'
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },

        getNotificationState: function (notificationType, dataType) {
            return _notificationState(notificationType, dataType);
        },
        getNotificationTitle: function (notificationType) {
            return (_notificationMap[notificationType] ? _notificationMap[notificationType].title : '')
        }
    }
}]);
