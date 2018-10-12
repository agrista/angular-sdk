var sdkApiApp = angular.module('ag.sdk.api', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library', 'ag.sdk.api.geo']);

/**
 * Active Flag API
 */
sdkApiApp.factory('activeFlagApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getActiveFlags: function (purpose) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/active-flags' + (purpose ? '?purpose=' + purpose : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActiveFlagsByPage: function (params) {
            return pagingService.page(_host + 'api/active-flags', params);
        },
        updateActiveFlag: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/active-flag/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

/**
 * Activity API
 */
sdkApiApp.factory('activityApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getActivities: function (id, type, params) {
            if (typeof type === 'object') {
                params = type;
                type = undefined;
            }

            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/activities' + (id ? '/' + id : '') + (type ? '/' + type : ''), params);
        },
        createActivity: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/activity', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActivity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/activity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteActivity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/activity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Aggregation API
 */
sdkApiApp.factory('aggregationApi', ['$http', 'configuration', 'promiseService', 'pagingService', 'underscore', function ($http, configuration, promiseService, pagingService, underscore) {
    // TODO: Refactor so that the aggregationApi can be extended for downstream platforms
    var _host = configuration.getServer();

    return {
        getCustomerLocations: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-locations', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-geodata?x1=' + southWestLng + '&y1=' + southWestLat + '&x2=' + northEastLng + '&y2=' + northEastLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayerBoundaries: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/guideline-sublayers?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getGroupCustomerLocations: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-locations-group', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getGroupCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-geodata-group?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmlandOverlaps: function (page) {
            return pagingService.page(_host + 'api/aggregation/farmland-overlap', page);
        },
        getGuidelineExceptions: function (page) {
            return pagingService.page(_host + 'api/aggregation/guideline-exceptions', page);
        },
        listBenefitAuthorisation: function() {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/report-benefit-authorisation', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        listCrossSelling: function(params) {
            return pagingService.page(_host + 'api/aggregation/report-cross-selling', params);
        },
        searchProductionSchedules: function(query) {
            query = underscore.map(query, function (value, key) {
                return (underscore.isString(key) ? key.toLowerCase() : key) + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/aggregation/search-production-schedules' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        averageProductionSchedules: function(query) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/aggregation/average-production-schedules', query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistinctProductionScheduleYears: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/aggregation/distinct-production-schedule-years' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistinctProductionScheduleEnterprises: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/aggregation/distinct-production-schedule-enterprises' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistinctProductionScheduleCategories: function() {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/distinct-production-schedule-categories', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        mapReduce: function(query) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/aggregation/map-reduce', query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Agrista API
 */
sdkApiApp.factory('agristaApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getMerchants: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/agrista/providers', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchMerchants: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/agrista/providers' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchant: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/agrista/provider/' + uuid, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Asset API
 */
sdkApiApp.factory('assetApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getAssets: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/assets' + (id ? '/' + id : ''), params);
        },
        createAsset: function (data, includeDependencies) {
            var dataCopy = asJson(data, (includeDependencies ? [] : ['liabilities', 'productionSchedules']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAsset: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/asset/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateAsset: function (data, includeDependencies) {
            var dataCopy = asJson(data, (includeDependencies ? [] : ['liabilities', 'productionSchedules']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachLiability: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/liability', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachLiability: function (id, liabilityId) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/liability/' + liabilityId + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteAsset: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAssetAttachments: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        }
    };
}]);

/**
 * Attachment API
 */
sdkApiApp.factory('attachmentApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getAttachmentUri: function (key) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/file-attachment/url?key=' + encodeURIComponent(key), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPDFPreviewImage: function (key) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/attachment/pdf/preview-image/' + encodeURIComponent(key), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Benefit API
 */
sdkApiApp.factory('benefitApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        searchCustomerNumber: function (customerNumber) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/benefit/search?customerNumber=' + customerNumber, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        linkCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/link', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        unlinkCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/unlink', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        authoriseCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/authorise', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        modifyAuthorisedCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/modify', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deauthoriseCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/deauthorise', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        listMemberships: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/benefit/memberships', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Comparable API
 */
sdkApiApp.factory('comparableApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, asJson, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    function uriEncodeQuery (query) {
        return underscore.chain(query)
            .defaults({
                resulttype: 'simple'
            })
            .map(function (value, key) {
                return key + '=' + encodeURIComponent(value);
            })
            .value().join('&');
    }

    return {
        createComparable: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        aggregateComparables: function (query) {
            query = uriEncodeQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/comparables/aggregate' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchComparables: function (query) {
            query = uriEncodeQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/comparables/search' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getComparable: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/comparable/' + uuid, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateComparable: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ dataCopy.uuid, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadComparableAttachments: function (uuid, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/' + uuid + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        useComparable: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ uuid + '/use', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteComparable: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ uuid + '/delete', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Data API
 */
sdkApiApp.factory('dataApi', ['$http', 'asJson', 'configuration', 'promiseService', 'underscore', function ($http, asJson, configuration, promiseService, underscore) {
    var _host = configuration.getServer();

    function uriEncodeQuery (query) {
        return underscore.map(query || {}, function (value, key) {
            return key + '=' + encodeURIComponent(value);
        }).join('&');
    }

    return {
        aggregateAll: function (params) {
            params = uriEncodeQuery(params);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/aggregate-all' + (params.length ? '?' + params : ''), {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        exportFile: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/export-file', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        importFile: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/import-file', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        validateFile: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/validate-file', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getDocuments: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/documents' + (id ? '/' + id : ''), params);
        },
        createDocument: function (data) {
            var dataCopy = asJson(data, ['organization', 'origin', 'tasks']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDocument: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/document/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendDocument: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/send', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        relateDocuments: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/relate', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateDocument: function (data) {
            var dataCopy = asJson(data, ['organization', 'origin', 'tasks']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteDocument: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadDocumentAttachments: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getDocumentPdf: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/pdf/get', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        saveDocumentPdf: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/pdf/save', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        mergeDocumentPdfs: function (key, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/pdf/merge?key=' + key, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Enterprise Budget API
 */
sdkApiApp.factory('enterpriseBudgetApi', ['$http', 'asJson', 'httpRequestor', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, asJson, httpRequestor, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    function uriEncodeQuery (query, defaults) {
        return underscore.chain(query)
            .defaults(defaults || {})
            .map(function (value, key) {
                return key + '=' + encodeURIComponent(value);
            })
            .value().join('&');
    }

    return {
        getEnterpriseBudgets: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/budgets' + (id ? '?sublayer=' + id : ''), page);
        },
        getAveragedBudgets: function(query) {
            query = uriEncodeQuery(query, {
                resulttype: 'simple'
            });

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budgets/averaged' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchEnterpriseBudgets: function (query) {
            return httpRequestor(_host + 'api/budgets/search', query);
        },
        createEnterpriseBudget: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudget: function (id, requesttype) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budget/' + id + (requesttype ? '?requesttype=' + requesttype : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudgetPublishers: function (query) {
            query = uriEncodeQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budget/publishers' + (query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudgetRegions: function (query) {
            query = uriEncodeQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budget/regions' + (query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateEnterpriseBudget: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        publishEnterpriseBudget: function (id, publishSettings) {
            publishSettings = publishSettings || {remote: 'agrista'};

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + id + '/publish', publishSettings, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEnterpriseBudget: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadEnterpriseBudgetAttachments: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        favoriteEnterpriseBudget: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + id + '/favorite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }

    };
}]);

/**
 * Expense API
 */
sdkApiApp.factory('expenseApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getExpenses: function (params) {
            var url = 'api/expenses';
            if(params) {
                if(params.key && (params.id != undefined && params.id > -1)) {
                    url += '/' + params.id + '/' + params.key;
                    delete params.key;
                    delete params.id;
                }
            }
            return pagingService.page(_host + url, params);
        },
        updateExpense: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/expense/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farm API
 */
sdkApiApp.factory('farmApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarms: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farms' + (id ? '/' + id : ''), params);
        },
        createFarm: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/farm/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarm: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarm: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farmer API
 */
sdkApiApp.factory('farmerApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarmers: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farmers' + (id ? '/' + id : ''), params);
        },
        searchFarmers: function (query) {
            return promiseService.wrap(function (promise) {
                // search by name,
                if(typeof query === 'string') {
                    $http.get(_host + 'api/farmers?search=' + query, {withCredentials: true}).then(function (res) {
                        promise.resolve(res.data);
                    }, promise.reject);
                }
                // search by ids,
                else if(typeof query === 'object' && query.ids) {
                    $http.get(_host + 'api/farmers?ids=' + query.ids, {withCredentials: true}).then(function (res) {
                        promise.resolve(res.data);
                    }, promise.reject);
                }
            });
        },
        createFarmer: function (data, includeDependencies) {
            var dataCopy = asJson(data, (includeDependencies ? [] : ['farms', 'legalEntities']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteFarmer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/farmer/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarmer: function (data, includeDependencies) {
            var dataCopy = asJson(data, (includeDependencies ? [] : ['farms', 'legalEntities']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarmer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        hasOutstandingRequest: function (ids) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmers/with-open-request?ids=' + ids, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAssignedMerchant: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/farmer/' + id + '/assigned-merchant', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farmland Value API
 */
sdkApiApp.factory('farmlandValueApi', ['$http', 'promiseService', 'configuration', 'underscore', function ($http, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getFarmlandValue: function (id, query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmland-value/' + id + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmlandValues: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmland-values' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Financial API
 */
sdkApiApp.factory('financialApi', ['$http', 'asJson', 'promiseService', 'configuration', function ($http, asJson, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFinancials: function (id) {
            return promiseService.wrap(function (promise) {
                if (id !== undefined) {
                    $http.get(_host + 'api/financials/' + id, {withCredentials: true}).then(function (res) {
                        promise.resolve(res.data);
                    }, promise.reject);
                } else {
                    promise.reject();
                }
            });
        },
        createFinancial: function (data) {
            var dataCopy = asJson(data, ['legalEntity']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/financial', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFinancial: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/financial/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFinancial: function (data) {
            var dataCopy = asJson(data, ['legalEntity']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/financial/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFinancial: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/financial/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Invite API
 */
sdkApiApp.factory('inviteApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getInvite: function (hash) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/invite/' + hash, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Layers API
 */
sdkApiApp.factory('layerApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getLayerTypes: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/layer/types', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getLayers: function (params) {
            return pagingService.page(_host + 'api/layers', params);
        },
        getLayer: function (layerId) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/layer/' + layerId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createLayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/layer', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateLayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/layer/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayers: function (params) {
            return pagingService.page(_host + 'api/sublayers', params);
        },
        getSublayer: function (sublayerId) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/sublayer/' + sublayerId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayersByLayer: function (layerId) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/sublayers/' + layerId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createSublayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/sublayer', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateSublayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/sublayer/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteSublayer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/sublayer/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Legal Entity API
 */
sdkApiApp.factory('legalEntityApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getEntities: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/legalentities' + (id ? '/' + id : ''), params);
        },
        updateEntity: function (data, includeDependencies) {
            var dataCopy = asJson(data, (includeDependencies ? [] : ['assets', 'financials']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadEntityAttachments: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getEntity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/legalentity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createEntity: function (data, includeDependencies) {
            var dataCopy = asJson(data, (includeDependencies ? [] : ['assets', 'financials']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEntity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDuplicateEntity: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/legalentity/duplicates', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachLiability: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/liability', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachLiability: function (id, liabilityId) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/liability/' + liabilityId + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Liability API
 */
sdkApiApp.factory('liabilityApi', ['$http', 'asJson', 'promiseService', 'configuration', function ($http, asJson, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        updateLiability: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/liability/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Map Theme API
 */
sdkApiApp.factory('mapThemeApi', ['$http', 'asJson', 'promiseService', 'configuration', 'underscore', function ($http, asJson, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getMapThemes: function (params) {
            params = underscore.map(underscore.defaults(params || {}, {resulttype: 'simple'}), function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/map-themes' + (params ? '?' + params : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createMapTheme: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/map-theme', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMapTheme: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/map-theme/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Merchant API
 */
sdkApiApp.factory('merchantApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getMerchants: function (params) {
            return pagingService.page(_host + 'api/merchants', params);
        },
        searchMerchants: function (query) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchants?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchByService: function (query, point, farmerId) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchants/services?search=' + query + (point ? '&x=' + point[0] + '&y=' + point[1] : '') + (farmerId ? '&farmerId=' + farmerId : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createMerchant: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchant: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchantUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/invite-user', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        registerMerchant: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/register/merchant', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchant: function (id, isUuid) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchant/' + id + (isUuid ? '?uuid=true' : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchantActivities: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchant/' + id + '/activities', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMerchant: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadMerchantAttachments: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        deleteMerchant: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Notification API
 */
sdkApiApp.factory('notificationApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getNotifications: function (params) {
            return pagingService.page(_host + 'api/notifications', params);
        },
        createNotification: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/notification/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        rejectNotification: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification/' + id + '/reject', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        acceptNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification/' + id + '/accept', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Organizational Unit API
 */
sdkApiApp.factory('organizationalUnitApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        createOrganizationalUnit: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/organizational-unit' + (data.type ? '/' + data.type.toLowerCase() : ''), asJson(data), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getOrganizationalUnits: function (params) {
            return pagingService.page(_host + 'api/organizational-units', params);
        },
        getOrganizationalUnitBranches: function (params) {
            return pagingService.page(_host + 'api/organizational-units/branches', params);
        },
        getOrganizationalUnitGroups: function (params) {
            return pagingService.page(_host + 'api/organizational-units/groups', params);
        },
        getOrganizationalUnitRegions: function (params) {
            return pagingService.page(_host + 'api/organizational-units/regions', params);
        },
        getOrganizationalUnit: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/organizational-unit/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateOrganizationalUnit: function (data) {
            var dataCopy = asJson(data, ['organization', 'users']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/organizational-unit/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteOrganizationalUnit: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/organizational-unit/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Market Assumptions API
 */
sdkApiApp.factory('productDemandApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, asJson, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getProductDemandAssumptions: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/demand-assumptions' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMapData: function (options) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumptions/map-data', options, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        addAssumptionGroup: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumption', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateProductDemandAssumption: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumption/' + id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteProductDemandAssumption: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumption/delete', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Production Schedule API
 */
sdkApiApp.factory('productionScheduleApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getProductionSchedules: function (id) {
            return pagingService.page(_host + 'api/production-schedules' + (id ? '/' + id : ''));
        },
        createProductionSchedule: function (data) {
            var dataCopy = asJson(data, ['asset', 'budget', 'organization']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/production-schedule', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getProductionSchedule: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/production-schedule/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateProductionSchedule: function (data) {
            var dataCopy = asJson(data, ['asset', 'budget', 'organization']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/production-schedule/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteProductionSchedule: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/production-schedule/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Role API
 */
sdkApiApp.factory('roleApi', ['$http', 'asJson', 'promiseService', 'configuration', function ($http, asJson, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        //todo: handle different report types
        getRoles: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/roles', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateRoleApps: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/role-apps', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Service API
 */
sdkApiApp.factory('serviceApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getServices: function (params) {
            return pagingService.page(_host + 'api/services', params);
        },
        getService: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/service/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);


/**
 * Share API
 */
sdkApiApp.factory('shareApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getDocument: function (code) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/share/document/' + code, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Tag API
 */
sdkApiApp.factory('tagApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTags: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/tags', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

/**
 * Task API
 */
sdkApiApp.factory('taskApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTasks: function (params) {
            return pagingService.page(_host + 'api/tasks', params);
        },
        getManagerTasks: function (params) {
            return pagingService.page(_host + 'api/tasks/manager', params);
        },
        createTask: function (data) {
            var dataCopy = asJson(data, ['document', 'organization', 'subtasks']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTask: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/task/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTask: function (data) {
            var dataCopy = asJson(data, ['document', 'organization', 'subtasks']);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTask: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Team API
 */
sdkApiApp.factory('teamApi', ['$http', 'asJson', 'promiseService', 'configuration', function ($http, asJson, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTeams: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/teams', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createTeam: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeam: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/team/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeamUsers: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/team/' + id + '/users', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTeam: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTeam: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * User API
 */
sdkApiApp.factory('userApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getUsers: function (params) {
            return pagingService.page(_host + 'api/users', params);
        },
        getUsersByRole: function (id, role) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/users/farmer/' + id + '?rolename=' + role, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUsersPositions: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/users/positions', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createUser: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function (id, username) {
            if (username) {
                var param = '?username=' + username;
            }
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/user/' + id + (param ? param : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUserGroups: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + dataCopy.id + '/groups', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Workload API
 */
sdkApiApp.factory('workloadApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        updateWorkload: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/workload/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);
