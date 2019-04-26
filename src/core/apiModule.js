var sdkApiApp = angular.module('ag.sdk.api', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library', 'ag.sdk.api.geo']);

/**
 * Active Flag API
 */
sdkApiApp.factory('activeFlagApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var host = configuration.getServer();

    return {
        getActiveFlags: function (purpose) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/active-flags' + (purpose ? '?purpose=' + purpose : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActiveFlagsByPage: function (params) {
            return pagingService.page(host + 'api/active-flags', params);
        },
        updateActiveFlag: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/active-flag/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        createActivity: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/activity', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActivities: function (id, type, params) {
            if (typeof type === 'object') {
                params = type;
                type = undefined;
            }

            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/activities' + (id ? '/' + id : '') + (type ? '/' + type : ''), params);
        },
        getDocumentActivities: function (id, params) {
            return pagingService.page(host + 'api/activities/document/' + id, params);
        },
        getOrganizationActivities: function (id, params) {
            return pagingService.page(host + 'api/activities/organization/' + id, params);
        },
        getActivity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/activity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteActivity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/activity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getCustomerLocations: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/customer-locations', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/customer-geodata?x1=' + southWestLng + '&y1=' + southWestLat + '&x2=' + northEastLng + '&y2=' + northEastLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayerBoundaries: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/guideline-sublayers?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getGroupCustomerLocations: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/customer-locations-group', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getGroupCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/customer-geodata-group?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmlandOverlaps: function (page) {
            return pagingService.page(host + 'api/aggregation/farmland-overlap', page);
        },
        getGuidelineExceptions: function (page) {
            return pagingService.page(host + 'api/aggregation/guideline-exceptions', page);
        },
        listBenefitAuthorisation: function() {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/report-benefit-authorisation', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        listCrossSelling: function(params) {
            return pagingService.page(host + 'api/aggregation/report-cross-selling', params);
        },
        searchProductionSchedules: function(query) {
            query = underscore.map(query, function (value, key) {
                return (underscore.isString(key) ? key.toLowerCase() : key) + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/aggregation/search-production-schedules' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        averageProductionSchedules: function(query) {
            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/aggregation/average-production-schedules', query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistinctProductionScheduleYears: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/aggregation/distinct-production-schedule-years' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistinctProductionScheduleEnterprises: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/aggregation/distinct-production-schedule-enterprises' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistinctProductionScheduleCategories: function() {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/aggregation/distinct-production-schedule-categories', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        mapReduce: function(query) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/aggregation/map-reduce', query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Agrista API
 */
sdkApiApp.factory('agristaApi', ['organizationApi', 'underscore', function (organizationApi, underscore) {
    return {
        getMerchants: function () {
            return organizationApi.searchOrganizations({type: 'merchant'});
        },
        searchMerchants: function (query) {
            return organizationApi.searchOrganizations(underscore.extend({type: 'merchant'}, query));
        },
        getMerchant: function (uuid) {
            return organizationApi.searchOrganization({type: 'merchant', uuid: uuid});
        }
    };
}]);

/**
 * Asset API
 */
sdkApiApp.factory('assetApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['liabilities', 'productionSchedules'];

    return {
        getAssets: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/assets' + (id ? '/' + id : ''), params);
        },
        createAsset: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/asset', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAsset: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/asset/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateAsset: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/asset/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachLiability: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/asset/' + id + '/liability', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachLiability: function (id, liabilityId) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/asset/' + id + '/liability/' + liabilityId + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteAsset: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/asset/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAttachment: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/asset/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getAttachmentUri: function (key) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/file-attachment/url?key=' + encodeURIComponent(key), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPDFPreviewImage: function (key) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/attachment/pdf/preview-image/' + encodeURIComponent(key), {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        searchCustomerNumber: function (customerNumber) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/benefit/search?customerNumber=' + customerNumber, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        linkCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/benefit/link', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        unlinkCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/benefit/unlink', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        authoriseCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/benefit/authorise', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        modifyAuthorisedCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/benefit/modify', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deauthoriseCustomerNumber: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/benefit/deauthorise', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        listMemberships: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/benefit/memberships', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Comparable API
 */
sdkApiApp.factory('comparableApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', 'underscore', 'uriEncodeQuery', function ($http, asJson, pagingService, promiseService, configuration, underscore, uriEncodeQuery) {
    var host = configuration.getServer();

    return {
        createComparable: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/comparable', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        aggregateComparables: function (query) {
            query = uriEncodeQuery(query, {
                resulttype: 'simple'
            });

            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/comparables/aggregate' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchComparables: function (query) {
            query = uriEncodeQuery(query, {
                resulttype: 'simple'
            });

            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/comparables/search' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getComparable: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/comparable/' + uuid, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateComparable: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/comparable/'+ dataCopy.uuid, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAttachment: function (uuid, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/comparable/' + uuid + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        useComparable: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/comparable/'+ uuid + '/use', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteComparable: function (uuid) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/comparable/'+ uuid + '/delete', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Data API
 */
sdkApiApp.factory('dataApi', ['$http', 'asJson', 'configuration', 'promiseService', 'underscore', 'uriEncodeQuery', function ($http, asJson, configuration, promiseService, underscore, uriEncodeQuery) {
    var host = configuration.getServer();

    return {
        aggregateAll: function (params) {
            params = uriEncodeQuery(params);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/data/aggregate-all' + (params.length ? '?' + params : ''), {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        exportFile: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/data/export-file', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        importFile: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/data/import-file', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        validateFile: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/data/validate-file', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['$http', 'asJson', 'configuration', 'pagingService', 'promiseService', 'uriEncodeQuery', function ($http, asJson, configuration, pagingService, promiseService, uriEncodeQuery) {
    var host = configuration.getServer(),
        removableFields = ['organization', 'origin', 'tasks'];

    return {
        getDocuments: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/documents' + (id ? '/' + id : ''), params);
        },
        createDocument: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDocument: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/document/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendDocument: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/' + id + '/send', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachDocument: function (id, documentId, params) {
            params = uriEncodeQuery(params);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/' + id + '/add/' + documentId + (params.length > 0 ? '?' + params : ''), {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachDocument: function (id, documentId, params) {
            params = uriEncodeQuery(params);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/' + id + '/remove/' + documentId + (params.length > 0 ? '?' + params : ''), {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateDocument: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteDocument: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAttachment: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getDocumentPdf: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/pdf/get', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        saveDocumentPdf: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/pdf/save', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        mergeDocumentPdfs: function (key, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/document/pdf/merge?key=' + key, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Enterprise Budget API
 */
sdkApiApp.factory('enterpriseBudgetApi', ['$http', 'asJson', 'httpRequestor', 'pagingService', 'promiseService', 'configuration', 'underscore', 'uriEncodeQuery', function ($http, asJson, httpRequestor, pagingService, promiseService, configuration, underscore, uriEncodeQuery) {
    var host = configuration.getServer();

    return {
        getEnterpriseBudgets: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/budgets' + (id ? '?sublayer=' + id : ''), page);
        },
        getAveragedBudgets: function(query) {
            query = uriEncodeQuery(query, {
                resulttype: 'simple'
            });

            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/budgets/averaged' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchEnterpriseBudgets: function (query) {
            return httpRequestor(host + 'api/budgets/search', query);
        },
        createEnterpriseBudget: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/budget', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudget: function (id, requesttype) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/budget/' + id + (requesttype ? '?requesttype=' + requesttype : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudgetPublishers: function (query) {
            query = uriEncodeQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/budget/publishers' + (query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudgetRegions: function (query) {
            query = uriEncodeQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/budget/regions' + (query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateEnterpriseBudget: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/budget/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        publishEnterpriseBudget: function (id, publishSettings) {
            publishSettings = publishSettings || {remote: 'agrista'};

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/budget/' + id + '/publish', publishSettings, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEnterpriseBudget: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/budget/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAttachment: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/budget/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        favoriteEnterpriseBudget: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/budget/' + id + '/favorite', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getExpenses: function (params) {
            var url = 'api/expenses';
            if(params) {
                if(params.key && (params.id !== undefined && params.id > -1)) {
                    url +=  '/' + params.key + '/' + params.id;
                    delete params.key;
                    delete params.id;
                }
            }
            return pagingService.page(host + url, params);
        },
        createExpense: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/expense', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateExpense: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/expense/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteExpense: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/expense/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getFarms: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/farms' + (id ? '/' + id : ''), params);
        },
        createFarm: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/farm/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarm: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarm: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farmer API
 */
sdkApiApp.factory('farmerApi', ['$http', 'asJson', 'configuration', 'organizationApi', 'pagingService', 'promiseService', 'taskApi', 'underscore', function ($http, asJson, configuration, organizationApi, pagingService, promiseService, taskApi, underscore) {
    var host = configuration.getServer();

    return {
        getFarmers: function (params) {
            return organizationApi.getOrganizations(underscore.chain(params)
                .defaults({type: 'farmer'})
                .value());
        },
        searchFarmers: function (query) {
            return organizationApi.searchOrganizations(query);
        },
        createFarmer: function (data, includeRemovable) {
            return organizationApi.createOrganization(underscore.defaults(data, {type: 'farmer'}), includeRemovable);
        },
        inviteFarmer: function (id) {
            return organizationApi.inviteOrganization(id);
        },
        getFarmer: function (id) {
            return organizationApi.getOrganization(id);
        },
        updateFarmer: function (data, includeRemovable) {
            return organizationApi.updateOrganization(data, includeRemovable);
        },
        uploadAttachment: function (id, data) {
            return organizationApi.uploadAttachment(id, data);
        },
        deleteFarmer: function (id) {
            return organizationApi.deleteOrganization(id);
        }
    };
}]);

/**
 * Farmland Value API
 */
sdkApiApp.factory('farmlandValueApi', ['$http', 'promiseService', 'configuration', 'underscore', function ($http, promiseService, configuration, underscore) {
    var host = configuration.getServer();

    return {
        getFarmlandValue: function (id, query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/farmland-value/' + id + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmlandValues: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/farmland-values' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farm Sale API
 */
sdkApiApp.factory('farmSaleApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['documents', 'organization'];

    return {
        createFarmSale: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm-sale', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmSales: function () {
            return pagingService.page(host + 'api/farm-sales');
        },
        searchFarmSales: function (params) {
            return pagingService.page(host + 'api/farm-sales/search', params);
        },
        getFarmSale: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/farm-sale/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarmSale: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm-sale/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarmSale: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm-sale/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachDocument: function (id, documentId) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm-sale/' + id + '/add/' + documentId, {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachDocument: function (id, documentId) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/farm-sale/' + id + '/remove/' + documentId, {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer(),
        removableFields = ['legalEntity'];

    return {
        getFinancials: function (id) {
            return promiseService.wrap(function (promise) {
                if (id !== undefined) {
                    $http.get(host + 'api/financials/' + id, {withCredentials: true}).then(function (res) {
                        promise.resolve(res.data);
                    }, promise.reject);
                } else {
                    promise.reject();
                }
            });
        },
        createFinancial: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/financial', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFinancial: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/financial/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFinancial: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/financial/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFinancial: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/financial/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getInvite: function (hash) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/invite/' + hash, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getLayerTypes: function () {
            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/layer/types', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getLayers: function (params) {
            return pagingService.page(host + 'api/layers', params);
        },
        getLayer: function (layerId) {
            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/layer/' + layerId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createLayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/layer', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateLayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/layer/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayers: function (params) {
            return pagingService.page(host + 'api/sublayers', params);
        },
        getSublayer: function (sublayerId) {
            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/sublayer/' + sublayerId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayersByLayer: function (layerId) {
            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/sublayers/' + layerId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createSublayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/sublayer', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateSublayer: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/sublayer/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteSublayer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/sublayer/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer(),
        removableFields = ['assets', 'financials'];

    return {
        getEntities: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/legalentities' + (id ? '/' + id : ''), params);
        },
        updateEntity: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/legalentity/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAttachment: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/legalentity/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getEntity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/legalentity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createEntity: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/legalentity', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEntity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/legalentity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachLiability: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/legalentity/' + id + '/liability', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachLiability: function (id, liabilityId) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/legalentity/' + id + '/liability/' + liabilityId + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        createLiability: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/liability', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateLiability: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/liability/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteLiability: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/liability/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getMapThemes: function (params) {
            params = underscore.map(underscore.defaults(params || {}, {resulttype: 'simple'}), function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(host + 'api/map-themes' + (params ? '?' + params : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createMapTheme: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/map-theme', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMapTheme: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/map-theme/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Merchant API
 */
sdkApiApp.factory('merchantApi', ['$http', 'asJson', 'organizationApi', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, asJson, organizationApi, pagingService, promiseService, configuration, underscore) {
    var host = configuration.getServer();

    return {
        getMerchants: function (params) {
            return organizationApi.getOrganizations(underscore.chain(params)
                .defaults({type: 'merchant'})
                .value());
        },
        searchMerchants: function (query) {
            return organizationApi.searchOrganizations({
                type: 'merchant',
                search: query
            });
        },
        searchByService: function (query, point, farmerId) {
            return organizationApi.getOrganizations(underscore.chain({type: 'merchant', service: query})
                .extend(point ? {
                    x: point[0],
                    y: point[1]
                } : {})
                .extend(farmerId ? {
                    organizationId: farmerId
                } : {})
                .value());
        },
        createMerchant: function (data) {
            return organizationApi.createOrganization(underscore.defaults(data, {type: 'merchant'}));
        },
        inviteMerchant: function (id) {
            return organizationApi.inviteOrganization(id);
        },
        inviteMerchantUser: function (id) {
            return organizationApi.inviteOrganizationUser(id);
        },
        registerMerchant: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/register/merchant', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchant: function (id, isUuid) {
            return organizationApi.getOrganization(id);
        },
        updateMerchant: function (data) {
            return organizationApi.updateOrganization(data);
        },
        uploadAttachment: function (id, data) {
            return organizationApi.uploadAttachment(id, data);
        },
        deleteMerchant: function (id) {
            return organizationApi.deleteOrganization(id);
        }
    };
}]);

/**
 * Notification API
 */
sdkApiApp.factory('notificationApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var host = configuration.getServer();

    return {
        getNotifications: function (params) {
            return pagingService.page(host + 'api/notifications', params);
        },
        createNotification: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/notification', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/notification/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        rejectNotification: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/notification/' + id + '/reject', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        acceptNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/notification/' + id + '/accept', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/notification/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Organization API
 */
sdkApiApp.factory('organizationApi', ['$http', 'asJson', 'httpRequestor', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, httpRequestor, pagingService, promiseService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['farms', 'legalEntities', 'pointsOfInterest'];

    return {
        createOrganization: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organization', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getOrganizations: function (params) {
            return pagingService.page(host + 'api/organizations', params);
        },
        getOrganization: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/organization/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getOrganizationDuplicates: function (id) {
            return httpRequestor(host + 'api/organization/' + id + '/duplicates');
        },
        searchOrganizations: function (params) {
            return pagingService.page(host + 'api/organizations/search', params);
        },
        searchOrganization: function (params) {
            return httpRequestor(host + 'api/organization/search', params);
        },
        inviteOrganization: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organization/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteOrganizationUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organization/' + id + '/invite-user', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        registerOrganization: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/register/organization', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateOrganization: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organization/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAttachment: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organization/' + id + '/attach', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        deleteOrganization: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organization/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        createOrganizationalUnit: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organizational-unit' + (data.type ? '/' + data.type.toLowerCase() : ''), asJson(data), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getOrganizationalUnits: function (params) {
            return pagingService.page(host + 'api/organizational-units', params);
        },
        getOrganizationalUnitBranches: function (params) {
            return pagingService.page(host + 'api/organizational-units/branches', params);
        },
        getOrganizationalUnitGroups: function (params) {
            return pagingService.page(host + 'api/organizational-units/groups', params);
        },
        getOrganizationalUnitRegions: function (params) {
            return pagingService.page(host + 'api/organizational-units/regions', params);
        },
        getOrganizationalUnit: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/organizational-unit/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateOrganizationalUnit: function (data) {
            var dataCopy = asJson(data, ['organization', 'users']);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organizational-unit/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteOrganizationalUnit: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/organizational-unit/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Point Of Interest API
 */
sdkApiApp.factory('pointOfInterestApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, pagingService, promiseService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['organization'];

    return {
        createPointOfInterest: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/point-of-interest', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPointOfInterest: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/point-of-interest/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchPointsOfInterest: function (params) {
            return pagingService.page(host + 'api/points-of-interest/search', params);
        },
        updatePointOfInterest: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/point-of-interest/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deletePointOfInterest: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/point-of-interest/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Product Demand API
 */
sdkApiApp.factory('productDemandApi', ['$http', 'asJson', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, asJson, pagingService, promiseService, configuration, underscore) {
    var host = configuration.getServer();

    return {
        getProductDemandAssumptions: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/demand-assumptions' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMapData: function (options) {
            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/demand-assumptions/map-data', options, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        addAssumptionGroup: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/demand-assumption', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateProductDemandAssumption: function (id, data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/demand-assumption/' + id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteProductDemandAssumption: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function(promise) {
                $http.post(host + 'api/demand-assumption/delete', dataCopy, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer(),
        removableFields = ['assets', 'budget', 'organization'];

    return {
        getProductionSchedules: function (id) {
            return pagingService.page(host + 'api/production-schedules' + (id ? '/' + id : ''));
        },
        createProductionSchedule: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/production-schedule', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getProductionSchedule: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/production-schedule/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateProductionSchedule: function (data, includeRemovable) {
            var dataCopy = asJson(data, (includeRemovable ? [] : removableFields));

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/production-schedule/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteProductionSchedule: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/production-schedule/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachAsset: function (id, assetId) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/production-schedule/' + id + '/add/' + assetId, {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        detachAsset: function (id, assetId) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/production-schedule/' + id + '/remove/' + assetId, {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        //todo: handle different report types
        getRoles: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/roles', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateRoleApps: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/role-apps', dataCopy, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getServices: function (params) {
            return pagingService.page(host + 'api/services', params);
        },
        getService: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/service/' + id, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getDocument: function (code) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/share/document/' + code, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getTags: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/tags', {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer(),
        removableFields = ['document', 'organization', 'subtasks'];

    return {
        getTasks: function (params) {
            return pagingService.page(host + 'api/tasks', params);
        },
        getManagerTasks: function (params) {
            return pagingService.page(host + 'api/tasks/manager', params);
        },
        searchTasks: function (params) {
            return pagingService.page(host + 'api/tasks/search', params);
        },
        createTask: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/task', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTask: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/task/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTask: function (data) {
            var dataCopy = asJson(data, removableFields);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/task/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTask: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/task/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getTeams: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/teams', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createTeam: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/team', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeam: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/team/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeamUsers: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/team/' + id + '/users', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTeam: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/team/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTeam: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/team/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        getUsers: function (params) {
            return pagingService.page(host + 'api/users', params);
        },
        getUsersByRole: function (id, role) {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/users/organization/' + id + '?rolename=' + role, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUsersPositions: function () {
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/users/positions', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createUser: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/user', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/user/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function (id, username) {
            if (username) {
                var param = '?username=' + username;
            }
            return promiseService.wrap(function (promise) {
                $http.get(host + 'api/user/' + id + (param ? param : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/user/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUserGroups: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/user/' + dataCopy.id + '/groups', dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/user/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
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
    var host = configuration.getServer();

    return {
        updateWorkload: function (data) {
            var dataCopy = asJson(data);

            return promiseService.wrap(function (promise) {
                $http.post(host + 'api/workload/' + dataCopy.id, dataCopy, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);
