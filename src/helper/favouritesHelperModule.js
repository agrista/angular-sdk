var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', function(documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            date: item.date
        };

        if (typeof item.actor === 'object') {
            // User is the actor
            if (item.actor.name) {
                map.title = item.actor.name;
                map.subtitle = item.actor.name;
            }
            else {
                map.title = item.actor.firstName + ' ' + item.actor.lastName;
                map.subtitle = item.actor.firstName + ' ' + item.actor.lastName;
            }
            if (item.company) {
                map.title += ' (' + item.company + ')';
                map.subtitle += ' (' + item.company + ')';
            }

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

        map.referenceId = item.referenceType == 'farmer' ? item.organization.id : item[item.referenceType + 'Id'];

        if (item.referenceType == 'farmer') {
            if (item.action == 'invite') {
                map.subtitle += item.organization.name + ' to create an Agrista account';
            } else if (item.action == 'register') {
                map.subtitle += 'your request to join Agrista';
            } else if (item.action == 'create') {
                map.subtitle += 'a customer portfolio for ' + item.organization.name;
            } else if (item.action == 'register') {
                map.subtitle += 'on Agrista';
            } else {
                map.subtitle += 'the portfolio of ' + item.organization.name;
            }

            map.referenceState = 'customer.details';
        } else if (item.referenceType == 'document' && item[item.referenceType] !== undefined) {
            map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + item[item.referenceType].docType;
            map.referenceState = documentHelper.getDocumentState(item[item.referenceType].docType);
            if (item.organization && item.organization.name) {
                map.subtitle = item.action == 'share' ? map.subtitle + ' with ' : map.subtitle + ' for ';
                map.subtitle += item.organization.name;
            }
        } else {
            map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
        }

        return map;
    };

    var _getActionVerb = function (action) {
        return _actionVerbMap[action] || (action.indexOf('e') == action.length - 1 ? action + 'd' : action + 'ed');
    };

    var _getReferenceArticle = function (reference) {
        return _referenceArticleMap[reference] || 'a'
    };

    var _actionVerbMap = {
        'register': 'accepted',
        'create': 'created',
        'decline': 'declined',
        'delete': 'deleted',
        'invite': 'invited',
        'reject': 'rejected',
        'review': 'reviewed',
        'update': 'updated'
    };

    var _referenceArticleMap = {
        'asset register': 'an',
        'document': 'a',
        'farmer': 'a',
        'team': 'a',
        'farm valuation': 'a'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        getActionVerb: _getActionVerb,
        getReferenceArticle: _getReferenceArticle
    }
}]);

sdkHelperFavouritesApp.factory('notificationHelper', ['taskHelper', 'documentHelper', function (taskHelper, documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            title: item.sender,
            subtitle: _notificationMap[item.notificationType].title,
            state: _notificationState(item.notificationType, item.dataType)
        };

        if (item.dataType == 'task') {
            map.subtitle += ' ' + taskHelper.getTaskTitle(item.sharedData.todo);
        } else if (item.dataType == 'document') {
            map.subtitle +=  ' ' + documentHelper.getDocumentTitle(item.sharedData.docType);
        }

        map.subtitle += ' ' + item.dataType + (item.organization == null ? '' : ' for ' + item.organization.name);

        return map;
    };

    var _notificationState = function (notificationType, dataType) {
        var state = (_notificationMap[notificationType] ? _notificationMap[notificationType].state : 'view');

        return ('notification.' + state + '-' + dataType);
    };

    var _notificationMap = {
        'import': {
            title: 'Import',
            state: 'import'
        },
        'view': {
            title: 'View',
            state: 'view'
        },
        'reject': {
            title: 'Reassign',
            state: 'manage'
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
