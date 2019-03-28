var sdkHelperDocumentApp = angular.module('ag.sdk.helper.document', ['ag.sdk.helper.task', 'ag.sdk.library']);

sdkHelperDocumentApp.provider('documentRegistry', ['underscore', function (underscore) {
    var registry = {};

    this.get = function (docType) {
        return registry[docType];
    };

    this.register = function (documents) {
        documents = (underscore.isArray(documents) ? documents : [documents]);

        underscore.each(documents, function (document) {
            registry[document.docType] = underscore.defaults(document, {
                deletable: false,
                state: 'document.details'
            });
        });
    };

    this.$get = [function () {
        return {
            filter: function (documents) {
                return underscore.reject(documents, function (document) {
                    return !underscore.isUndefined(registry[document.docType]);
                });
            },
            get: function (docType) {
                return registry[docType];
            },
            getProperty: function (type, prop, defaultValue) {
                return (registry[type] && !underscore.isUndefined(registry[type][prop]) ? registry[type][prop] : defaultValue);
            },
            getProperties: function (prop) {
                return underscore.pluck(registry, prop);
            }
        }
    }];
}]);
