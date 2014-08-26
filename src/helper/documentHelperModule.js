var sdkHelperDocumentApp = angular.module('ag.sdk.helper.document', ['ag.sdk.helper.task', 'ag.sdk.library']);

sdkHelperDocumentApp.provider('documentHelper', function () {
    var _docTypes = [];
    var _documentMap = {};

    var _pluralMap = function (item, count) {
        return (count != 1 ? (item.lastIndexOf('y') == item.length - 1 ? item.substr(0, item.length - 1) + 'ies' : item + 's') : item);
    };

    this.registerDocuments = function (docs) {
        if ((docs instanceof Array) === false) docs = [docs];

        angular.forEach(docs, function (doc) {
            if (_docTypes.indexOf(doc.docType) === -1) {
                _docTypes.push(doc.docType);
            }

            // Allow override of document
            doc.deletable = (doc.deletable === true);
            doc.state = doc.state || 'document.' + doc.docType.replace(' ', '-');
            _documentMap[doc.docType] = doc;
        });
    };

    this.getDocument = function (docType) {
        return _documentMap[docType];
    };

    this.$get = ['$filter', '$injector', 'taskHelper', 'underscore', function ($filter, $injector, taskHelper, underscore) {
        var _listServiceMap = function (item) {
            if (_documentMap[item.docType]) {
                var docMap = _documentMap[item.docType];
                var map = {
                    id: item.id || item.__id,
                    title: (item.documentId ? item.documentId : ''),
                    subtitle: (item.author ? 'By ' + item.author + ' on ': 'On ') + $filter('date')(item.createdAt),
                    docType: item.docType,
                    group: docMap.title
                };

                if (item.organization && item.organization.name) {
                    map.title = item.organization.name;
                    map.subtitle = (item.documentId ? item.documentId : '');
                }

                if (item.data && docMap && docMap.listServiceMap) {
                    if (docMap.listServiceMap instanceof Array) {
                        docMap.listServiceMap = $injector.invoke(docMap.listServiceMap);
                    }

                    docMap.listServiceMap(map, item);
                }

                return map;
            }
        };

        var _listServiceWithTaskMap = function (item) {
            if (_documentMap[item.docType]) {
                var map = _listServiceMap(item);
                var parentTask = underscore.findWhere(item.tasks, {type: 'parent'});

                if (map && parentTask) {
                    map.status = {
                        text: parentTask.status,
                        label: taskHelper.getTaskLabel(parentTask.status)
                    }
                }

                return map;
            }
        };

        return {
            listServiceMap: function () {
                return _listServiceMap;
            },
            listServiceWithTaskMap: function () {
                return _listServiceWithTaskMap;
            },
            filterDocuments: function (documents) {
                return underscore.filter(documents, function (document) {
                    return (_documentMap[document.docType] !== undefined);
                });
            },
            pluralMap: function (item, count) {
                return _pluralMap(item, count);
            },

            documentTypes: function () {
                return _docTypes;
            },
            documentTitles: function () {
                return underscore.pluck(_documentMap, 'title');
            },

            getDocumentTitle: function (docType) {
                return (_documentMap[docType] ? _documentMap[docType].title : undefined);
            },
            getDocumentState: function (docType) {
                return (_documentMap[docType] ? _documentMap[docType].state : undefined);
            },
            getDocumentMap: function (docType) {
                return _documentMap[docType];
            }
        }
    }]
});
