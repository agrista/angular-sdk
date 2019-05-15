var sdkApiGeoApp = angular.module('ag.sdk.api.geo', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library']);


/**
 * PIP Geo API
 */
sdkApiGeoApp.factory('pipGeoApi', ['$http', 'configuration', 'pagingService', 'promiseService', 'underscore', 'uriEncodeQuery', function ($http, configuration, pagingService, promiseService, underscore, uriEncodeQuery) {
    var _host = configuration.getServer();

    function trimQuery (query) {
        return underscore.omit(query, function (value) {
            return (value == null || value == '');
        });
    }

    function uriEncodeTrimmedQuery (query) {
        return uriEncodeQuery(trimQuery(query));
    }

    return {
        getAdminRegion: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/admin-region' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchAdminRegions: function (params) {
            return pagingService.page(_host + 'api/geo/admin-regions', trimQuery(params));
        },
        getColorMap: function (query) {
            var params = uriEncodeTrimmedQuery(underscore.pick(query, ['type']));

            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/geo/color-map' + (params ? '?' + params : ''),  underscore.omit(query, ['type']), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistrict: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/district' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/farm' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchFarms: function (params) {
            return pagingService.page(_host + 'api/geo/farms', trimQuery(params));
        },
        getField: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/field' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPortion: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/portion' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchPortions: function (params) {
            return pagingService.page(_host + 'api/geo/portions', trimQuery(params));
        },
        getProvince: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/province' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayer: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/geo/sublayer' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

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
sdkApiApp.factory('farmSaleApi', ['$http', 'asJson', 'httpRequestor', 'pagingService', 'promiseService', 'configuration', function ($http, asJson, httpRequestor, pagingService, promiseService, configuration) {
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
        getFarmSales: function (params) {
            return pagingService.page(host + 'api/farm-sales', params);
        },
        aggregateFarmSales: function (params) {
            return httpRequestor(host + 'api/farm-sales/aggregate', params);
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

var sdkAuthorizationApp = angular.module('ag.sdk.authorization', ['ag.sdk.config', 'ag.sdk.utilities', 'satellizer']);

sdkAuthorizationApp.factory('authorizationApi', ['$http', 'promiseService', 'configuration', 'underscore', function($http, promiseService, configuration, underscore) {
    var _host = configuration.getServer();
    
    return {
        requestReset: function(email) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/request-reset', {email: email}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        confirmReset: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/confirm-reset', data).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        authorize: function (provider, data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/' + provider, data, {skipAuthorization: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        refresh: function (refreshToken) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/refresh-token', {refresh_token: refreshToken}, {skipAuthorization: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        changePassword: function (oldPassword, newPassword) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'auth/change-password', {password: oldPassword, newPassword: newPassword}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/me').then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/me', underscore.omit(data, 'profilePhotoSrc')).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        logout: function() {
            return $http.post(_host + 'logout', {});
        }
    };
}]);

sdkAuthorizationApp.provider('authorization', ['$httpProvider', function ($httpProvider) {
    // TODO: make read-only
    var _userRoles = {
        open: 1,
        user: 2,
        admin: 4
    };
    var _accessLevels = {
        open: (_userRoles.open | _userRoles.user | _userRoles.admin),
        user: (_userRoles.user | _userRoles.admin),
        admin: (_userRoles.admin)
    };

    var _defaultUser = {
        email: '',
        role: _userRoles.open
    };

    var _lastError,
        _tokens,
        _expiry = {
            expiresIn: 60
        };

    // Intercept any HTTP responses that are not authorized
    $httpProvider.interceptors.push(['$injector', '$log', '$rootScope', 'localStore', 'moment', 'promiseService', function ($injector, $log, $rootScope, localStore, moment, promiseService) {
        var _requestQueue = [];

        function queueRequest (config) {
            var queueItem = {
                config: config,
                defer: promiseService.defer()
            };

            _requestQueue.push(queueItem);

            return queueItem.defer.promise;
        }

        function resolveQueue (token) {
            while (_requestQueue.length > 0) {
                var queueItem = _requestQueue.shift();

                if (token) {
                    queueItem.config.headers['Authorization'] = 'Bearer ' + token;
                }

                queueItem.defer.resolve(queueItem.config);
            }
        }

        return {
            request: function (config) {
                if (config.skipAuthorization || config.headers['Authorization']) {
                    _expiry.lastRequest = moment();

                    return config;
                }

                if (_tokens && _tokens.refresh_token && _preReauthenticate(_expiry)) {
                    if (_requestQueue.length === 0) {
                        var $auth = $injector.get('$auth'),
                            authorizationApi = $injector.get('authorizationApi');

                        authorizationApi.refresh(_tokens.refresh_token).then(function (res) {
                            if (res) {
                                _processExpiry(res);

                                $auth.setToken(res.access_token);
                                localStore.setItem('tokens', res);
                                _tokens = res;
                            }

                            resolveQueue(res && res.access_token);
                        }, function () {
                            resolveQueue();
                        });
                    }

                    return queueRequest(config);
                }

                return config;
            },
            responseError: function (err) {
                $log.debug(err);

                if (err.status === 401) {
                    $rootScope.$broadcast('authorization::unauthorized', err);
                } else if (err.status === 403) {
                    $rootScope.$broadcast('authorization::forbidden', err);
                }

                return promiseService.reject(err);
            }
        }
    }]);

    var _preAuthenticate = ['promiseService', function (promiseService) {
        return function () {
            return promiseService.wrap(function (promise) {
                promise.resolve();
            });
        }
    }], _preReauthenticate = function () {
        return true;
    };

    var _processExpiry = ['moment', function (moment) {
        return function (data) {
            if (data) {
                if (data.expires_at) {
                    _expiry.expiresAt = data.expires_at;
                    _expiry.expiresIn = moment(_expiry.expiresAt).diff(moment(), 's');
                } else if (data.expires_in) {
                    _expiry.expiresIn = data.expires_in;
                    _expiry.expiresAt = moment().add(_expiry.expiresIn, 's').unix();
                }
            }
        }
    }];

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        setPreAuthenticate: function (fn) {
            _preAuthenticate = fn;
        },

        setPreReauthenticate: function (fn) {
            _preReauthenticate = fn;
        },

        $get: ['$auth', '$injector', '$log', '$rootScope', '$timeout', 'authorizationApi', 'localStore', 'promiseService', 'underscore',
            function ($auth, $injector, $log, $rootScope, $timeout, authorizationApi, localStore, promiseService, underscore) {
                var _user = _getUser(),
                    _authenticationPromise;

                _tokens = localStore.getItem('tokens');

                if (_processExpiry instanceof Array) {
                    _processExpiry = $injector.invoke(_processExpiry);
                }

                if (_preAuthenticate instanceof Array) {
                    _preAuthenticate = $injector.invoke(_preAuthenticate);
                }

                _processExpiry(_tokens);

                $rootScope.$on('authorization::unauthorized', function () {
                    localStore.removeItem('user');
                    localStore.removeItem('tokens');
                    $auth.removeToken();
                    _tokens = undefined;
                });

                function _getUser () {
                    return localStore.getItem('user') || _defaultUser;
                }

                function _setUser (user) {
                    user = user || _defaultUser;

                    if (user.role === undefined) {
                        user.role = (user.accessLevel === 'admin' ? _userRoles.admin : _userRoles.user);
                    }

                    localStore.setItem('user', user);

                    return user;
                }

                function _postAuthenticateSuccess (res) {
                    if (res && res.data) {
                        _processExpiry(res.data);

                        $auth.setToken(res.data.access_token);
                        localStore.setItem('tokens', res.data);
                        _tokens = res.data;
                    }

                    return authorizationApi.getUser();
                }

                function _postGetUserSuccess (promise) {
                    return function (res) {
                        _lastError = undefined;
                        _user = _setUser(res);
                        promise.resolve(_user);

                        $rootScope.$broadcast('authorization::login', _user);
                    }
                }

                function _postError (promise) {
                    return function (err) {
                        $log.error(err);

                        _lastError = {
                            code: err.status,
                            type: 'error',
                            message: err.data && err.data.message || 'Unable to Authenticate. Please try again.'
                        };

                        localStore.removeItem('user');
                        promise.reject({
                            data: _lastError
                        });
                    }
                }

                function isLoggedIn () {
                    return (_accessLevels.user & _user.role) !== 0;
                }

                return {
                    userRole: _userRoles,
                    accessLevel: _accessLevels,
                    lastError: function () {
                        return _lastError;
                    },
                    currentUser: function () {
                        return _user;
                    },
                    setAuthentication: function (authentication) {
                        _authenticationPromise = promiseService
                            .wrap(function (promise) {
                                if (underscore.has(authentication, 'code')) {
                                    _preAuthenticate(authentication)
                                        .then(function () {
                                            return authorizationApi.authorize(authentication.provider, authentication)
                                        }, promiseService.throwError)
                                        .then(function (response) {
                                            return _postAuthenticateSuccess({data: response});
                                        }, promiseService.throwError)
                                        .then(_postGetUserSuccess(promise), _postError(promise));
                                } else {
                                    _postAuthenticateSuccess({data: authentication})
                                        .then(_postGetUserSuccess(promise), _postError(promise));
                                }
                            });

                        return _authenticationPromise;
                    },
                    waitForAuthentication: function () {
                        return promiseService.wrap(function (promise) {
                            if (_authenticationPromise) {
                                _authenticationPromise.then(function () {
                                    if (isLoggedIn()) {
                                        promise.resolve(_user);
                                    } else {
                                        promise.reject();
                                    }
                                }, promise.reject);
                            } else if (isLoggedIn()) {
                                promise.resolve(_user);
                            } else {
                                promise.reject();
                            }
                        });
                    },
                    getAuthenticationResponse: function () {
                        return _tokens;
                    },
                    hasApp: function (appName) {
                        return _user && _user.userRole &&
                            underscore.some(_user.userRole.apps, function (app) {
                                return app.name === appName;
                            });
                    },
                    isAdmin: function () {
                        return _user && (_user.accessLevel === 'admin' || (_user.userRole && _user.userRole.name === 'Admin'));
                    },
                    isAllowed: function (level) {
                        return (level & _user.role) !== 0;
                    },
                    isLoggedIn: isLoggedIn,
                    login: function (email, password) {
                        var credentials = {
                            email: email,
                            password: password
                        };

                        _authenticationPromise = promiseService.wrap(function (promise) {
                            return _preAuthenticate(credentials)
                                .then(function () {
                                    return $auth.login(credentials);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });

                        return _authenticationPromise;
                    },
                    authenticate: function (name, data) {
                        _authenticationPromise = promiseService.wrap(function (promise) {
                            return _preAuthenticate(data)
                                .then(function () {
                                    return $auth.authenticate(name, data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });

                        return _authenticationPromise;
                    },
                    requestReset: authorizationApi.requestReset,
                    confirmReset: function (data) {
                        return promiseService.wrap(function (promise) {
                            authorizationApi.confirmReset(data).then(function (res) {
                                if (_tokens) {
                                    _tokens.confirmed = true;
                                    localStore.setItem('tokens', _tokens);
                                }

                                promise.resolve(res);
                            }, promise.reject);
                        });
                    },
                    changePassword: function (oldPassword, newPassword) {
                        return authorizationApi.changePassword(oldPassword, newPassword);
                    },
                    changeUserDetails: function (userDetails) {
                        return authorizationApi.updateUser(userDetails).then(function (result) {
                            _user = _setUser(result);

                            $rootScope.$broadcast('authorization::user-details__changed', _user);

                            return result;
                        });
                    },
                    register: function (data) {
                        _authenticationPromise = promiseService.wrap(function (promise) {
                            return _preAuthenticate(data)
                                .then(function () {
                                    return $auth.signup(data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });

                        return _authenticationPromise;
                    },
                    logout: function () {
                        return authorizationApi.logout().then(function () {
                            $auth.logout();
                            localStore.removeItem('user');
                            localStore.removeItem('tokens');
                            _tokens = undefined;
                            _user = _getUser();

                            $rootScope.$broadcast('authorization::logout');

                            return _user;
                        });
                    }
                }
            }]
    }
}]);

var sdkConfigApp = angular.module('ag.sdk.config', []);

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
sdkConfigApp.provider('configuration', ['$httpProvider', function($httpProvider) {
    var _version = '';
    var _host = 'local';

    var _modules = [];
    var _servers = {
        local: '',
        testing: 'https://dev-enterprise.agrista.com/',
        staging: 'https://staging-enterprise.agrista.com/',
        production: 'https://enterprise.agrista.com/'
    };

    var _hasModule = function (name) {
        return (_modules.indexOf(name) !== -1);
    };

    var _addModule = function (name) {
        if (_hasModule(name) == false) {
            _modules.push(name);
        }
    };

    var _getServer = function (stripTrailingSlash) {
        var server = _servers[_host];

        if (stripTrailingSlash && server.lastIndexOf('/') === server.length - 1) {
            server = server.substr(0, server.length - 1);
        }

        return server;
    };

    return {
        addModule: _addModule,
        hasModule: _hasModule,

        setServers: function(servers) {
            angular.forEach(servers, function (host, name) {
                if (host.lastIndexOf('/') !== host.length - 1) {
                    host += '/';
                }

                _servers[name] = host;
            });

            this.useHost(_host, _version);
        },
        setVersion: function (version) {
            if (version) {
                _version = version;
            }
        },
        getServer: _getServer,
        useHost: function(host, version, cCallback) {
            if (typeof version === 'function') {
                cCallback = version;
                version = _version;
            }

            _version = version || _version;

            if (_servers[host] !== undefined) {
                _host = host;

                // Enable cross domain
                $httpProvider.defaults.useXDomain = true;
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
            }

            if (typeof cCallback === 'function') {
                cCallback(_servers[_host]);
            }
        },
        $get: function() {
            return {
                addModule: _addModule,
                hasModule: _hasModule,

                getVersion: function() {
                    return _version;
                },
                getHost: function() {
                    return _host;
                },
                getServer: _getServer
            }
        }
    }
}]);
var sdkEditorApp = angular.module('ag.sdk.editor', ['ag.sdk.library']);

sdkEditorApp.factory('enterpriseEditor', ['underscore', function (underscore) {
    function EnterpriseEditor (enterprises) {
        this.enterprises = underscore.map(enterprises || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            category: undefined,
            item: undefined
        }
    }

    EnterpriseEditor.prototype.addEnterprise = function (enterprise) {
        enterprise = enterprise || this.selection.item;

        if (!underscore.isUndefined(enterprise) && this.enterprises.indexOf(enterprise) === -1) {
            this.enterprises.push(enterprise);
            this.selection.item = undefined;
        }
    };

    EnterpriseEditor.prototype.removeEnterprise = function (item) {
        if (underscore.isString(item)) {
            item = this.enterprises.indexOf(item);
        }

        if (item !== -1) {
            this.enterprises.splice(item, 1);
        }
    };

    return function (enterprises) {
        return new EnterpriseEditor(enterprises);
    }
}]);

sdkEditorApp.factory('serviceEditor', ['underscore', function (underscore) {
    function ServiceEditor (/**Array=*/availableServices, /**Array=*/services) {
        availableServices = availableServices || [];

        this.services = underscore.map(services || [], function (item) {
            return (item.serviceType ? item.serviceType : item);
        });

        this.selection = {
            list: availableServices,
            mode: (availableServices.length === 0 ? 'add' : 'select'),
            text: undefined
        };
    }

    ServiceEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode === 'select' ? 'add' : 'select');
            this.selection.text = undefined;
        }
    };

    ServiceEditor.prototype.addService = function (service) {
        service = service || this.selection.text;

        if (!underscore.isUndefined(service) && this.services.indexOf(service) === -1) {
            this.services.push(service);
            this.selection.text = undefined;
        }
    };

    ServiceEditor.prototype.removeService = function (indexOrService) {
        if (underscore.isString(indexOrService)) {
            indexOrService = this.services.indexOf(indexOrService);
        }

        if (indexOrService !== -1) {
            this.services.splice(indexOrService, 1);
        }
    };

    return function (/**Array=*/availableServices, /**Array=*/services) {
        return new ServiceEditor(availableServices, services);
    }
}]);

sdkEditorApp.factory('teamEditor', ['underscore', function (underscore) {
    function TeamEditor (/**Array=*/availableTeams, /**Array=*/teams) {
        availableTeams = availableTeams || [];
        teams = teams || [];

        this.teams = underscore.map(teams, function (item) {
            return (item.name ? item.name : item);
        });

        this.teamsDetails = angular.copy(teams);

        this.filterList = function () {
            var instance = this;
            instance.selection.list = underscore.reject(availableTeams, function (item) {
                return underscore.contains(instance.teams, (item.name ? item.name : item));
            })
        };

        this.selection = {
            mode: (availableTeams.length === 0 ? 'add' : 'select'),
            text: undefined
        };

        this.filterList();
    }

    TeamEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            this.selection.mode = (this.selection.mode === 'select' ? 'add' : 'select');
            this.selection.text = undefined;
        }
    };

    TeamEditor.prototype.addTeam = function (team) {
        team = team || this.selection.text;

        if (!underscore.isUndefined(team) && this.teams.indexOf(team) === -1) {
            this.teams.push(team);
            this.teamsDetails.push(underscore.findWhere(this.selection.list, {name: team}));
            this.selection.text = undefined;
            this.filterList();
        }
    };

    TeamEditor.prototype.removeTeam = function (indexOrTeam) {
        if (underscore.isString(indexOrTeam)) {
            indexOrTeam = this.teams.indexOf(indexOrTeam);
        }

        if (indexOrTeam !== -1) {
            this.teams.splice(indexOrTeam, 1);
            this.teamsDetails.splice(indexOrTeam, 1);
            this.selection.text = undefined;
            this.filterList();
        }
    };

    return function (/**Array=*/availableTeams, /**Array=*/teams) {
        return new TeamEditor(availableTeams, teams);
    };
}]);

var sdkGeospatialApp = angular.module('ag.sdk.geospatial', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkGeospatialApp.factory('sphericalHelper', [function () {
    var RADIUS = 6378137,
        FLATTENING = 1/298.257223563,
        POLAR_RADIUS = 6356752.3142;

    var heading = function(from, to) {
        var y = Math.sin(Math.PI * (from[0] - to[0]) / 180) * Math.cos(Math.PI * to[1] / 180);
        var x = Math.cos(Math.PI * from[1] / 180) * Math.sin(Math.PI * to[1] / 180) -
            Math.sin(Math.PI * from[1] / 180) * Math.cos(Math.PI * to[1] / 180) * Math.cos(Math.PI * (from[0] - to[0]) / 180);
        return 180 * Math.atan2(y, x) / Math.PI;
    };

    var distance = function(from, to) {
        var sinHalfDeltaLon = Math.sin(Math.PI * (to[0] - from[0]) / 360);
        var sinHalfDeltaLat = Math.sin(Math.PI * (to[1] - from[1]) / 360);
        var a = sinHalfDeltaLat * sinHalfDeltaLat +
            sinHalfDeltaLon * sinHalfDeltaLon * Math.cos(Math.PI * from[1] / 180) * Math.cos(Math.PI * to[1] / 180);
        return 2 * RADIUS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    var radial = function(from, tc_deg, d_m, wrap) {
        var tc = rad(tc_deg);
        var d = d_m / RADIUS;

        var lon1 = rad(from[0]),
            lat1 = rad(from[1]);

        var lat = Math.asin(
            Math.sin(lat1) *
            Math.cos(d) +
            Math.cos(lat1) *
            Math.sin(d) *
            Math.cos(tc));

        var dlon = Math.atan2(
            Math.sin(tc) *
            Math.sin(d) *
            Math.cos(lat1),
            Math.cos(d) -
            Math.sin(lat1) *
            Math.sin(lat));

        var lon;
        if (wrap) {
            lon = (lon1 - dlon + Math.PI) %
                (2 * Math.PI) - Math.PI;
        } else {
            lon = (lon1 - dlon + Math.PI) - Math.PI;
        }

        return [deg(lon), deg(lat)];
    };

    var rad = function (val) {
        return val * (Math.PI / 180);
    };

    var deg = function (val) {
        return val * (180 / Math.PI);
    };

    return {
        RADIUS: RADIUS,
        heading: heading,
        distance: distance,
        radial: radial,
        rad: rad,
        deg: deg
    };
}]);

sdkGeospatialApp.factory('areaHelper', ['sphericalHelper', function (sphericalHelper) {
    var polygonArea = function (area, coords) {
        if (coords && coords.length > 0) {
            area += Math.abs(ringArea(coords[0]));
            for (var i = 1; i < coords.length; i++) {
                area -= Math.abs(ringArea(coords[i]));
            }
        }

        return area;
    };

    var ringArea = function (coords) {
        var p1, p2, p3, lowerIndex, middleIndex, upperIndex, i,
            area = 0,
            coordsLength = coords.length;

        if (coordsLength > 2) {
            for (i = 0; i < coordsLength; i++) {
                if (i === coordsLength - 2) {// i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength -1;
                    upperIndex = 0;
                } else if (i === coordsLength - 1) {// i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else { // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i+1;
                    upperIndex = i+2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];
                area += (sphericalHelper.rad(p3[0]) - sphericalHelper.rad(p1[0])) * Math.sin(sphericalHelper.rad(p2[1]));
            }

            // WGS84 radius
            area = area * sphericalHelper.RADIUS * sphericalHelper.RADIUS / 2;
        }

        return area;
    };

    return {
        polygon: polygonArea,
        ring: ringArea
    };
}]);

sdkGeospatialApp.factory('geoJSONHelper', ['areaHelper', 'objectId', 'topologyHelper', 'underscore', function (areaHelper, objectId, topologyHelper, underscore) {
    function GeojsonHelper(json, properties) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json, properties);
        }

        this.addGeometry(json, properties);
    }

    function recursiveCoordinateFinder (bounds, coordinates) {
        if (coordinates) {
            if (angular.isArray(coordinates[0])) {
                angular.forEach(coordinates, function(coordinate) {
                    recursiveCoordinateFinder(bounds, coordinate);
                });
            } else if (angular.isArray(coordinates)) {
                bounds.push([coordinates[1], coordinates[0]]);
            }
        }
    }

    function geometryArea (area, geojson) {
        if (geojson.type) {
            switch (geojson.type) {
                case 'Polygon':
                    return areaHelper.polygon(0, geojson.coordinates);
                case 'MultiPolygon':
                    return underscore.reduce(geojson.coordinates, areaHelper.polygon, area);
                case 'GeometryCollection':
                    return underscore.reduce(geojson.geometries, geometryArea, area);
            }
        }

        return area;
    }

    function getGeometry (instance) {
        return instance._json && (instance._json.type === 'Feature' ?
                instance._json.geometry :
                (instance._json.type !== 'FeatureCollection' ?
                        instance._json : {
                            type: 'GeometryCollection',
                            geometries: underscore.pluck(instance._json.features, 'geometry')
                        }
                )
        );
    }

    function geometryRelation (instance, relation, geometry) {
        var geom1 = topologyHelper.readGeoJSON(getGeometry(instance)),
            geom2 = topologyHelper.readGeoJSON(geometry);

        return (geom1 && geom2 && geom1[relation] ? geom1[relation](geom2) : false);
    }

    GeojsonHelper.prototype = {
        getJson: function () {
            return this._json;
        },
        getType: function () {
            return this._json.type;
        },
        getGeometryType: function () {
            return (this._json.geometry ? this._json.geometry.type : this._json.type);
        },
        getArea: function () {
            var area = (this._json ? geometryArea(0, this._json) : 0),
                yards = (area * 1.19599);

            return {
                m_sq: area,
                ha: (area * 0.0001),
                mi_sq: (yards / 3097600),
                acres: (yards / 4840),
                yd_sq: yards
            };
        },
        getBounds: function () {
            var bounds = [];

            if (this._json) {
                var features = this._json.geometries || this._json.features || [this._json];

                angular.forEach(features, function(feature) {
                    var geometry = feature.geometry || feature;

                    recursiveCoordinateFinder(bounds, geometry.coordinates);
                });
            }

            return bounds;
        },
        getBoundingBox: function (bounds) {
            bounds = bounds || this.getBounds();

            var lat1 = 0, lat2 = 0,
                lng1 = 0, lng2 = 0;

            angular.forEach(bounds, function(coordinate, index) {
                if (index === 0) {
                    lat1 = lat2 = coordinate[0];
                    lng1 = lng2 = coordinate[1];
                } else {
                    lat1 = (lat1 < coordinate[0] ? lat1 : coordinate[0]);
                    lat2 = (lat2 < coordinate[0] ? coordinate[0] : lat2);
                    lng1 = (lng1 < coordinate[1] ? lng1 : coordinate[1]);
                    lng2 = (lng2 < coordinate[1] ? coordinate[1] : lng2);
                }
            });

            return [[lat1, lng1], [lat2, lng2]];
        },
        /**
         * Geometry Editing
         */
        geometry: function () {
            return topologyHelper.readGeoJSON(getGeometry(this));
        },
        difference: function (geometry) {
            var geom = topologyHelper.readGeoJSON(getGeometry(this));
            this._json = topologyHelper.writeGeoJSON(geom.difference(geometry));
            return this;
        },
        manipulate: function (geojson, relation) {
            if (geojson) {
                this._json = (this._json ? topologyHelper.writeGeoJSON(geometryRelation(this, relation, geojson)) : geojson);
            }

            return this;
        },
        /**
         * Geometry Relations
         */
        contains: function (geojson) {
            return geometryRelation(this, 'contains', geojson);
        },
        within: function (geojson) {
            return geometryRelation(this, 'within', geojson);
        },
        /**
         * Get Center
         */
        getCenter: function () {
            var geom = topologyHelper.readGeoJSON(getGeometry(this)),
                coord = (geom ? geom.getCentroid().getCoordinate() : geom);

            return (coord ? [coord.x, coord.y] : coord);
        },
        getCenterAsGeojson: function () {
            var geom = topologyHelper.readGeoJSON(getGeometry(this));

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        },
        getProperty: function (name) {
            return (this._json && this._json.properties ? this._json.properties[name] : undefined);
        },
        setCoordinates: function (coordinates) {
            if (this._json && this._json.type !== 'FeatureCollection') {
                if (this._json.geometry) {
                    this._json.geometry.coordinates = coordinates;
                } else {
                    this._json.coordinates = coordinates;
                }
            }
        },
        addProperties: function (properties) {
            var _this = this;

            if (this._json && properties) {
                if (_this._json.type !== 'FeatureCollection' && _this._json.type !== 'Feature') {
                    _this._json = {
                        type: 'Feature',
                        geometry: _this._json,
                        properties: properties
                    };
                } else {
                    _this._json.properties = _this._json.properties || {};

                    angular.forEach(properties, function(property, key) {
                        _this._json.properties[key] = property;
                    });
                }
            }

            return _this;
        },
        addGeometry: function (geojson, properties) {
            if (geojson) {
                if (this._json === undefined) {
                    this._json = geojson;

                    this.addProperties(properties);
                } else {
                    if (this._json.type !== 'GeometryCollection' && this._json.type !== 'FeatureCollection' && this._json.type !== 'Feature') {
                        this._json = {
                            type: 'GeometryCollection',
                            geometries: [this._json]
                        };
                    }

                    if (this._json.type === 'Feature') {
                        this._json.properties = underscore.defaults(this._json.properties || {}, {
                            featureId: objectId().toString()
                        });

                        this._json = {
                            type: 'FeatureCollection',
                            features: [this._json]
                        };
                    }

                    if (this._json.type === 'FeatureCollection') {
                        if (geojson.type === 'Feature') {
                            this._json.features.push(geojson);
                        } else {
                            this._json.features.push({
                                type: 'Feature',
                                geometry: geojson,
                                properties: underscore.defaults(properties || {}, {
                                    featureId: objectId().toString()
                                })
                            });
                        }
                    }

                    if (this._json.type === 'GeometryCollection') {
                        if (geojson.type === 'Feature') {
                            this._json.features.push(geojson.geometry);
                        } else {
                            this._json.geometries.push(geojson);
                        }
                    }
                }
            }

            return this;
        },
        formatGeoJson: function (geoJson, toType) {
            // TODO: REFACTOR
            //todo: maybe we can do the geoJson formation to make it standard instead of doing the validation.
            if (toType.toLowerCase() === 'point') {
                switch (geoJson && geoJson.type && geoJson.type.toLowerCase()) {
                    // type of Feature
                    case 'feature':
                        if (geoJson.geometry && geoJson.geometry.type && geoJson.geometry.type === 'Point') {
                            return geoJson.geometry;
                        }
                        break;
                    // type of FeatureCollection
                    case 'featurecollection':
                        break;
                    // type of GeometryCollection
                    case 'geometrycollection':
                        break;
                    // type of Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
                    default:
                        break;
                }
            }

            return geoJson;
        },
        validGeoJson: function (geoJson, typeRestriction) {
            // TODO: REFACTOR
            var validate = true;
            if(!geoJson || geoJson.type === undefined || typeof geoJson.type !== 'string' || (typeRestriction && geoJson.type.toLowerCase() !== typeRestriction)) {
                return false;
            }

            // valid type, and type matches the restriction, then validate the geometry / features / geometries / coordinates fields
            switch (geoJson.type.toLowerCase()) {
                // type of Feature
                case 'feature':
                    break;
                // type of FeatureCollection
                case 'featurecollection':
                    break;
                // type of GeometryCollection
                case 'geometrycollection':
                    break;
                // type of Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
                default:
                    if(!geoJson.coordinates || !geoJson.coordinates instanceof Array) {
                        return false;
                    }
                    var flattenedCoordinates = _.flatten(geoJson.coordinates);
                    flattenedCoordinates.forEach(function(element) {
                        if (typeof element !== 'number') {
                            validate = false;
                        }
                    });
                    break;
            }

            return validate;
        }
    };

    return function (json, properties) {
        return new GeojsonHelper(json, properties);
    }
}]);

sdkGeospatialApp.factory('topologyHelper', ['topologySuite', function (topologySuite) {
    var geometryFactory = new topologySuite.geom.GeometryFactory(),
        geoJSONReader = new topologySuite.io.GeoJSONReader(geometryFactory),
        geoJSONWriter = new topologySuite.io.GeoJSONWriter(geometryFactory);

    return {
        getGeometryFactory: function () {
            return geometryFactory;
        },
        getGeoJSONReader: function () {
            return geoJSONReader;
        },
        getGeoJSONWriter: function () {
            return geoJSONWriter;
        },
        readGeoJSON: function (geojson) {
            return (geojson ? geoJSONReader.read(geojson) : undefined);
        },
        writeGeoJSON: function (geometry) {
            return (geometry ? geoJSONWriter.write(geometry) : undefined);
        }
    };
}]);
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

var sdkLibraryApp = angular.module('ag.sdk.library', []);

/**
 * This module includes other required third party libraries
 */
sdkLibraryApp.constant('bigNumber', window.BigNumber);

sdkLibraryApp.constant('underscore', window._);

sdkLibraryApp.constant('md5', window.md5);

sdkLibraryApp.constant('moment', window.moment);

sdkLibraryApp.constant('topologySuite', window.jsts);

sdkLibraryApp.constant('naturalSort', window.naturalSort);

var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

sdkMonitorApp.config(['$provide', function ($provide) {
    $provide.decorator('$log', ['$delegate', '$filter', 'logStore', 'moment', 'underscore', function ($delegate, $filter, logStore, moment, underscore) {
        function prepareLogLevelFunction (log, level) {
            var levelFunction = log[level];

            log[level] = function () {
                var args = [].slice.call(arguments),
                    caller = (arguments.callee && arguments.callee.caller && arguments.callee.caller.name.length > 0 ? arguments.callee.caller.name + ' :: ' : ''),
                    output = (underscore.isObject(args[0]) ? (typeof args[0].toString === 'function' ? args[0].toString() : '\n' + $filter('json')(args[0])) : args[0]);

                args[0] = moment().format('YYYY-MM-DDTHH:mm:ss.SSS') + underscore.lpad(' [' + level.toUpperCase() + '] ', 7, ' ') +  caller + output;

                logStore.log(level, args[0]);
                levelFunction.apply(null, args);
            };
        }

        prepareLogLevelFunction($delegate, 'log');
        prepareLogLevelFunction($delegate, 'info');
        prepareLogLevelFunction($delegate, 'warn');
        prepareLogLevelFunction($delegate, 'debug');
        prepareLogLevelFunction($delegate, 'error');

        return $delegate;
    }]);
}]);

sdkMonitorApp.provider('logStore', [function () {
    var _items = [],
        _defaultConfig = {
            maxItems: 1000
        },
        _config = _defaultConfig;

    return {
        config: function (config) {
            _config = config;
        },
        $get: ['underscore', function (underscore) {
            _config = underscore.defaults(_config, _defaultConfig);

            return {
                log: function (level, entry) {
                    var item = {
                        level: level,
                        entry: entry
                    };

                    _items.splice(0, 0, item);

                    if (_items.length > _config.maxItems) {
                        _items.pop();
                    }
                },
                clear: function () {
                    _items = [];
                },
                list: function () {
                    return _items;
                }
            }
        }]
    };
}]);

sdkMonitorApp.factory('promiseMonitor', ['$log', 'safeApply', function ($log, safeApply) {
    function PromiseMonitor(callback) {
        if (!(this instanceof PromiseMonitor)) {
            return new PromiseMonitor(callback);
        }

        var _stats = {
            total: 0,
            complete: 0,
            resolved: 0,
            rejected: 0,
            percent: 0
        };

        var _completePromise = function () {
            _stats.complete++;
            _stats.percent = (100.0 / _stats.total) * _stats.complete;

            $log.debug('MONITOR TOTAL: ' + _stats.total + ' COMPLETE: ' + _stats.complete + ' PERCENT: ' + _stats.percent);

            safeApply(function () {
                if (_stats.complete == _stats.total) {
                    callback({type: 'complete', percent: _stats.percent, stats: _stats});
                } else {
                    callback({type: 'progress', percent: _stats.percent, stats: _stats});
                }
            });
        };

        return {
            stats: function () {
                return _stats;
            },
            clear: function () {
                _stats = {
                    total: 0,
                    complete: 0,
                    resolved: 0,
                    rejected: 0,
                    percent: 0
                };
            },
            add: function (promise) {
                _stats.total++;

                promise.then(function (res) {
                    _stats.resolved++;

                    _completePromise();
                }, function (err) {
                    _stats.rejected++;

                    safeApply(function () {
                        callback({type: 'error'}, err);
                    });

                    _completePromise();
                });

                return promise;
            }
        };
    }

    return function (callback) {
        return new PromiseMonitor(callback);
    }
}]);

var sdkUtilitiesApp = angular.module('ag.sdk.utilities', ['ngCookies', 'ag.sdk.id']);

sdkUtilitiesApp.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function (fn) {
        if ($rootScope.$$phase) {
            fn();
        } else {
            $rootScope.$apply(fn);
        }
    };
}]);

sdkUtilitiesApp.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});

sdkUtilitiesApp.factory('dataMapService', [function() {
    return function(items, mapping, excludeId) {
        var mappedItems = [];

        if (items instanceof Array === false) {
            items = (items !== undefined ? [items] : []);
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var mappedItem;

            if (typeof mapping === 'function') {
                mappedItem = mapping(item);
            } else {
                mappedItem = {};

                for (var key in mapping) {
                    if (mapping.hasOwnProperty(key)) {
                        mappedItem[key] = item[mapping[key]];
                    }
                }
            }

            if (mappedItem instanceof Array) {
                mappedItems = mappedItems.concat(mappedItem);
            } else if (typeof mappedItem === 'object') {
                if (excludeId !== true) {
                    mappedItem.id = mappedItem.id || item.id;
                }

                mappedItems.push(mappedItem);
            } else if (mappedItem !== undefined) {
                mappedItems.push(mappedItem);
            }
        }

        return mappedItems;
    }
}]);

sdkUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', 'generateUUID', 'underscore', 'uriQueryFormatArrays', function($rootScope, $http, promiseService, dataMapService, generateUUID, underscore, uriQueryFormatArrays) {
    var _listId = generateUUID();

    return {
        initialize: function(requestor, dataMap, itemStore, options) {
            if (typeof itemStore == 'object') {
                options = itemStore;
                itemStore = dataMap;
                dataMap = undefined;
            }

            if (typeof dataMap == 'object') {
                options = dataMap;
                itemStore = undefined;
                dataMap = undefined;
            }

            _listId = generateUUID();
            itemStore = itemStore || function (data) {
                $rootScope.$broadcast('paging::items', data);
            };

            var _pagingDefaults = _.defaults(options || {}, {
                limit: 50,
                resulttype: 'simple'
            });

            var _scroll = {
                page: _.clone(_pagingDefaults),
                busy: false,
                complete: false,
                disabled: function () {
                    return (_scroll.busy || _scroll.complete || (_scroll.searching !== undefined && _scroll.searching.complete));
                },
                search: function (query) {
                    if (query && query.length > 0) {
                        if (_scroll.searching === undefined || (_scroll.searching.complete === false || _scroll.searching.search !== query)) {
                            _scroll.searching = _.defaults({
                                search: query
                            }, _pagingDefaults);
                        }

                        _scroll.request();
                    } else {
                        delete _scroll.searching;
                    }
                },
                request: function (params) {
                    return promiseService.wrap(function (promise) {
                        if (_scroll.disabled()) {
                            promise.reject();
                        } else {
                            var currentListId = _listId;

                            params = params || (_scroll.searching ? _scroll.searching : _scroll.page);

                            _scroll.busy = true;
                            delete params.complete;

                            requestor(params).then(function(res) {
                                if (params.search === undefined) {
                                    _scroll.page.offset = (_scroll.page.offset === undefined ? res.length : _scroll.page.offset + res.length);
                                    _scroll.complete = (res.length !== _scroll.page.limit);
                                } else {
                                    _scroll.searching = params;
                                    _scroll.searching.offset = (_scroll.searching.offset === undefined ? res.length : _scroll.searching.offset + res.length);
                                    _scroll.searching.complete = (res.length !== _scroll.searching.limit);
                                }

                                _scroll.busy = false;

                                if (dataMap) {
                                    res = dataMapService(res, dataMap);
                                }

                                if (currentListId === _listId) {
                                    itemStore(res);
                                }

                                promise.resolve(res);
                            }, function (err) {
                                _scroll.complete = true;
                                _scroll.busy = false;

                                promise.reject(err);
                            });
                        }
                    });
                }
            };

            return _scroll;
        },
        page: function(endPoint, params) {
            return promiseService.wrap(function(promise) {
                var _handleResponse = function (res) {
                    promise.resolve(res.data);
                };

                if (underscore.isUndefined(params)) {
                    $http.get(endPoint, {withCredentials: true}).then(_handleResponse, promise.reject);
                } else if (underscore.isString(params)) {
                    $http.get(params, {withCredentials: true}).then(_handleResponse, promise.reject);
                } else {
                    var httpRequest = (underscore.isObject(params.resulttype) ? {
                        method: 'POST',
                        url: endPoint,
                        data: params.resulttype,
                        params: uriQueryFormatArrays(underscore.omit(params, 'resulttype')),
                        withCredentials: true
                    } : {
                        method: 'GET',
                        url: endPoint,
                        params: uriQueryFormatArrays(params),
                        withCredentials: true
                    });

                    $http(httpRequest).then(_handleResponse, promise.reject);
                }
            });
        }
    };
}]);

sdkUtilitiesApp.factory('apiPager', ['pagingService', 'promiseService', function (pagingService, promiseService) {
    return function (initializeFn, params) {
        return promiseService.wrap(function (promise) {
            var results = [];
            var paging = pagingService.initialize(initializeFn, function (items) {
                results = results.concat(items);

                if (paging.complete) {
                    promise.resolve(results);
                } else {
                    paging.request().catch(promise.reject);
                }
            }, params);

            paging.request().catch(promise.reject);
        });
    }
}]);

sdkUtilitiesApp.factory('httpRequestor', ['$http', 'underscore', 'uriQueryFormatArrays', function ($http, underscore, uriQueryFormatArrays) {
    return function (url, params) {
        params = params || {};

        return $http(underscore.extend(underscore.isObject(params.resulttype) ? {
            method: 'POST',
            data: params.resulttype,
            params: uriQueryFormatArrays(underscore.omit(params, 'resulttype'))
        } : {
            method: 'GET',
            params: uriQueryFormatArrays(params)
        }, {
            url: url,
            withCredentials: true
        })).then(function (result) {
            return result.data;
        });
    }
}]);

sdkUtilitiesApp.filter('parenthesizeProps', ['underscore', function (underscore) {
    return function (text, allProps, separator) {
        var closingParentheses = text.lastIndexOf(')'),
            propsString = underscore.chain(allProps)
                .compact()
                .map(function (props) {
                    return props.split(', ');
                })
                .flatten()
                .reject(function (prop) {
                    return s.include(text, prop);
                })
                .value()
                .join(separator || ', ');

        return (propsString.length === 0 ? text :
            (closingParentheses === -1 ?
                text + ' (' + propsString + ')' :
                text.substr(0, closingParentheses) + ', ' + propsString + text.substr(closingParentheses)));
    }
}]);

sdkUtilitiesApp.factory('promiseService', ['$timeout', '$q', 'safeApply', function ($timeout, $q, safeApply) {
    var _defer = function() {
        var deferred = $q.defer();

        return {
            resolve: function (response) {
                safeApply(function () {
                    deferred.resolve(response);
                });

            },
            reject: function (response) {
                safeApply(function () {
                    deferred.reject(response);
                });

            },
            promise: deferred.promise
        }
    };

    var _chainAll = function (action, list) {
        var deferred = $q.defer();
        var chain = deferred.promise;
        var results = [];

        action(list);

        var chainItem = function(item) {
            return chain.then(function (result) {
                if (result instanceof Array) {
                    results = results.concat(result);
                } else if (result) {
                    results.push(result);
                }

                return (item ? item() : results);
            }, function (err) {
                throw err;
            });
        };

        angular.forEach(list, function (item) {
            chain = chainItem(item);
        });

        deferred.resolve();

        return chainItem();
    };

    var _wrapAll = function (action, list) {
        action(list);

        return $q.all(list);
    };

    return {
        all: $q.all,
        reject: $q.reject,
        resolve: $q.resolve,
        chain: function (action) {
            return _chainAll(action, []);
        },
        wrap: function(action) {
            var deferred = _defer();

            $timeout(function () {
                action(deferred);
            }, 0);

            return deferred.promise;
        },
        wrapAll: function (action) {
            return _wrapAll(action, []);
        },
        arrayWrap: function (action) {
            return _wrapAll(action, []);
        },
        objectWrap: function (action) {
            return _wrapAll(action, {});
        },
        throwError: function (err) {
            throw err;
        },
        defer: _defer
    }
}]);

sdkUtilitiesApp.factory('localStore', ['$cookieStore', '$window', function ($cookieStore, $window) {
    return {
        setItem: function (key, value) {
            if ($window.localStorage) {
                $window.localStorage.setItem(key, JSON.stringify(value));
            } else {
                $cookieStore.put(key, value);
            }
        },
        getItem: function (key, defaultValue) {
            if ($window.localStorage) {
                return JSON.parse($window.localStorage.getItem(key)) || defaultValue;
            } else {
                return $cookieStore.get(key) || defaultValue;
            }
        },
        removeItem: function (key) {
            if ($window.localStorage) {
                $window.localStorage.removeItem(key);
            } else {
                $cookieStore.remove(key);
            }
        }
    }
}]);

sdkUtilitiesApp.factory('colorHash', [function () {
    function hashCode (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    return function (str) {
        var c = (hashCode(str) & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return '#' + ('00000'.substring(0, 6 - c.length)) + c;
    };
}]);

sdkUtilitiesApp.filter('round', [function () {
    return function (value, precision) {
        precision = precision || 2;

        return Number(Math.round(value + 'e' + precision) + 'e-' + precision);
    };
}]);

sdkUtilitiesApp.factory('asJson', ['deepCopy', 'underscore', function (deepCopy, underscore) {
    function omitFn (omit) {
        return function (object) {
            var json = (underscore.isFunction(object.asJSON) ? object.asJSON(omit) : deepCopy(object));

            return (omit ? underscore.omit(json, omit) : json);
        }
    }

    return function (object, omit) {
        return (underscore.isArray(object) ? underscore.map(object, omitFn(omit)) : omitFn(omit)(object));
    }
}]);

sdkUtilitiesApp.factory('sortJson', ['underscore', function (underscore) {
    function sortJson(json) {
        var keys = underscore.keys(json).sort();

        return underscore.object(keys, underscore.map(keys, function (key) {
            return sortValue(json[key]);
        }))
    }

    function sortValue (value) {
        return (underscore.isUndefined(value) ? null :
            (underscore.isObject(value) && !underscore.isArray(value) ? sortJson(value) : value));
    }

    return sortValue;
}]);

sdkUtilitiesApp.factory('md5Json', ['md5String', 'sortJson', function (md5String, sortJson) {
    function compact (json) {
        return (json ? JSON.stringify(json) : json);
    }

    return function (json) {
        return md5String(compact(sortJson(json)));
    };
}]);

sdkUtilitiesApp.factory('md5String', ['md5', function (md5) {
    return function (str) {
        return (str ? md5(str.toLowerCase().replace(' ', '')) : str);
    };
}]);

sdkUtilitiesApp.factory('deepCopy', [function () {
    return function (object) {
        return JSON.parse(JSON.stringify(object));
    }
}]);

sdkUtilitiesApp.factory('safeMath', ['bigNumber', function (bigNumber) {
    bigNumber.config({ERRORS: false});

    return {
        chain: function (value) {
            return new bigNumber(value || 0);
        },
        plus: function (valueA, valueB) {
            return new bigNumber(valueA || 0).plus(valueB || 0).toNumber();
        },
        minus: function (valueA, valueB) {
            return new bigNumber(valueA || 0).minus(valueB || 0).toNumber();
        },
        dividedBy: function (valueA, valueB) {
            return (valueB ? new bigNumber(valueA || 0).dividedBy(valueB).toNumber() : 0);
        },
        times: function (valueA, valueB) {
            return new bigNumber(valueA || 0).times(valueB || 0).toNumber();
        },
        round: function (value, precision) {
            return new bigNumber(value || 0).round(precision).toNumber();
        }
    };
}]);

sdkUtilitiesApp.factory('safeArrayMath', ['safeMath', 'underscore', function (safeMath, underscore) {
    function sortArrays (arrayA, arrayB) {
        arrayA = arrayA || [];
        arrayB = arrayB || [];

        return {
            short: (arrayA.length <= arrayB.length ? arrayA : arrayB),
            long: (arrayA.length > arrayB.length ? arrayA : arrayB)
        }
    }

    function performOperation (arrayA, arrayB, operatorFn) {
        var paddedArrayB = arrayB.concat(arrayB.length >= arrayA.length ? [] :
            underscore.range(arrayA.length - arrayB.length).map(function () {
                return 0;
            }));

        return underscore.reduce(paddedArrayB, function (totals, value, index) {
            totals[index] = operatorFn(totals[index], value);
            return totals;
        }, angular.copy(arrayA));
    }

    function performSortedOperation (arrayA, arrayB, operatorFn) {
        var arrays = sortArrays(arrayA, arrayB);

        return underscore.reduce(arrays.short, function (totals, value, index) {
            totals[index] = operatorFn(totals[index], value);
            return totals;
        }, angular.copy(arrays.long));
    }

    function reduce (array, initialValue, fnName) {
        fnName = fnName || 'plus';
        return underscore.reduce(array || [], function (total, value) {
            return safeMath[fnName](total, value);
        }, initialValue || 0);
    }

    return {
        count: function (array) {
            return underscore.reduce(array, function (total, value) {
                return safeMath.plus(total, (underscore.isNumber(value) && !underscore.isNaN(value) && value > 0 ? 1 : 0));
            }, 0);
        },
        plus: function (arrayA, arrayB) {
            return performSortedOperation(arrayA, arrayB, safeMath.plus);
        },
        minus: function (arrayA, arrayB) {
            return performOperation(arrayA, arrayB, safeMath.minus);
        },
        dividedBy: function (arrayA, arrayB) {
            return performOperation(arrayA, arrayB, safeMath.dividedBy);
        },
        times: function (arrayA, arrayB) {
            return performSortedOperation(arrayA, arrayB, safeMath.times);
        },
        reduce: function (array, initialValue) {
            return reduce(array, initialValue);
        },
        reduceOperator: function (array, fnName, initialValue) {
            return reduce(array, initialValue, fnName);
        },
        reduceProperty: function (array, property, initialValue) {
            return underscore.chain(array || [])
                .pluck(property)
                .reduce(function(total, value) {
                    return safeMath.plus(total, value);
                }, initialValue || 0)
                .value();
        },
        negate: function (array) {
            return underscore.map(array, function (value) {
                return safeMath.times(value, -1);
            });
        },
        round: function (array, precision) {
            return underscore.map(array, function (value) {
                return safeMath.round(value, precision);
            });
        }
    };
}]);

sdkUtilitiesApp.factory('uriQueryFormatArrays', ['underscore', function (underscore) {
    return function (query) {
        return underscore.mapObject(query, function (value) {
            return (underscore.isArray(value) ? value.join(',') : value);
        });
    }
}]);

sdkUtilitiesApp.factory('uriEncodeQuery', ['underscore', function (underscore) {
    return function (query, defaults) {
        return underscore.chain(query || {})
            .defaults(defaults || {})
            .map(function (value, key) {
                return key + '=' + encodeURIComponent(value);
            })
            .value().join('&');
    }
}]);
var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetValuationHelper', ['Asset', 'underscore', function (Asset, underscore) {
    var _listServiceMap = function (item) {
        return {
            title: item.organization.name,
            subtitle: 'Valued at ' + item.currency + ' ' + item.assetValue,
            date: item.date
        };
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        calculateAssetValue: function (asset) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                asset.data.assetValue = asset.data.quantity * (asset.data.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(asset.data.totalStock) == false) {
                asset.data.assetValue = asset.data.totalStock * (asset.data.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(asset.data.expectedYield) == false) {
                asset.data.assetValue = asset.data.expectedYield * (asset.data.unitValue || 0);
            } else if (asset.type == 'improvement') {
                asset.data.valuation = asset.data.valuation || {};
                asset.data.valuation.replacementValue = asset.data.size * ((asset.data.valuation && asset.data.valuation.constructionCost) || 0);
                asset.data.valuation.totalDepreciation = underscore.reduce(['physicalDepreciation', 'functionalDepreciation', 'economicDepreciation', 'purchaserResistance'], function (total, type) {
                    return isNaN(asset.data.valuation[type]) ? total : total * (1 - asset.data.valuation[type]);
                }, 1);

                asset.data.assetValue = Math.round((asset.data.valuation.replacementValue || 0) * Math.min(asset.data.valuation.totalDepreciation, 1));
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                asset.data.assetValue = asset.data.size * (asset.data.unitValue || 0);
            }

            asset.data.assetValue = Math.round(asset.data.assetValue * 100) / 100;
        },
        getApplicableGuidelines: function (guidelines, asset, field) {
            var assetLandUse = Asset.landClassesByType[asset.type] || [];
            var chain = underscore.chain(guidelines).filter(function(item) {
                return (assetLandUse.indexOf(item.assetClass) !== -1);
            });

            if (asset.type === 'cropland') {
                chain = chain.filter(function (item) {
                    return (field.irrigated ?
                        (asset.data.waterSource ? (item.waterSource && item.waterSource.indexOf(asset.data.waterSource) !== -1) : item.category === 'Potential Irrigable Land') :
                        (item.assetClass === 'Cropland' && (item.soilPotential === undefined || item.soilPotential === field.croppingPotential)));
                });
            } else if (asset.type === 'pasture' || asset.type === 'wasteland') {
                chain = chain.where({assetClass: field.landUse}).filter(function (item) {
                    return ((asset.data.crop === undefined && item.crop === undefined) || (item.crop !== undefined && item.crop.indexOf(asset.data.crop) !== -1)) &&
                        ((field.terrain === undefined && item.terrain === undefined) || item.terrain === field.terrain);
                });
            } else if (asset.type === 'permanent crop') {
                var establishedDate = moment(asset.data.establishedDate);
                var monthsFromEstablished = moment().diff(establishedDate, 'months');

                chain = chain.filter(function (item) {
                    return (item.crop && item.crop.indexOf(asset.data.crop) !== -1) &&
                        (!asset.data.irrigation || item.irrigationType === undefined ||
                            item.irrigationType.indexOf(asset.data.irrigation) !== -1) &&
                        (item.minAge === undefined || monthsFromEstablished >= item.minAge) &&
                        (item.maxAge === undefined || monthsFromEstablished < item.maxAge);
                });
            } else if (asset.type === 'plantation') {
                chain = chain.filter(function (item) {
                    return (item.crop === undefined || item.crop.indexOf(asset.data.crop) !== -1);
                });
            } else if (asset.type === 'water right') {
                chain = chain.filter(function (item) {
                    return (item.waterSource === undefined || item.waterSource.indexOf(asset.data.waterSource) !== -1);
                });
            }

            return chain.value();
        }
    }
}]);

var sdkHelperAttachmentApp = angular.module('ag.sdk.helper.attachment', ['ag.sdk.library']);

sdkHelperAttachmentApp.provider('attachmentHelper', ['underscore', function (underscore) {
    var _options = {
        defaultImage: 'img/camera.png',
        fileResolver: function (uri) {
            return uri;
        }
    };

    this.config = function (options) {
        _options = underscore.defaults(options || {}, _options);
    };

    this.$get = ['$injector', 'promiseService', function ($injector, promiseService) {
        if (underscore.isArray(_options.fileResolver)) {
            _options.fileResolver = $injector.invoke(_options.fileResolver);
        }

        var _getResizedAttachment = function (attachments, size, defaultImage, types) {
            attachments =(underscore.isArray(attachments) ? attachments : [attachments]);
            types = (underscore.isUndefined(types) || underscore.isArray(types) ? types : [types]);
            defaultImage = defaultImage || _options.defaultImage;

            var src = underscore.chain(attachments)
                .filter(function (attachment) {
                    return (underscore.isUndefined(types) || underscore.contains(types, attachment.type)) &&
                        (underscore.isString(attachment.base64) || (attachment.sizes && attachment.sizes[size]));
                })
                .map(function (attachment) {
                    return (underscore.isString(attachment.base64) ?
                        'data:' + (attachment.mimeType || 'image') + ';base64,' + attachment.base64 :
                        attachment.sizes[size].src);
                })
                .last()
                .value();

            return (src ? _options.fileResolver(src) : defaultImage);
        };

        return {
            findSize: function (obj, size, defaultImage, types) {
                return _getResizedAttachment((obj.data && obj.data.attachments ? obj.data.attachments : []), size, defaultImage, types);
            },
            getSize: function (attachments, size, defaultImage, types) {
                return _getResizedAttachment((attachments ? attachments : []), size, defaultImage, types);
            },
            getThumbnail: function (attachments, defaultImage, types) {
                return _getResizedAttachment((attachments ? attachments : []), 'thumb', defaultImage, types);
            },
            resolveUri: function (uri) {
                return _options.fileResolver(uri);
            }
        };
    }];
}]);

sdkHelperAttachmentApp.factory('resizeImageService', ['promiseService', 'underscore', function (promiseService, underscore) {
    return function (imageOrUri, options) {
        var _processImage = function (image) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            options = underscore.defaults(options || {}, {
                width: 80,
                height: 80,
                center: true,
                crop: true,
                output: 'image/png'
            });

            canvas.width = options.width;
            canvas.height = options.height;

            if (options.crop) {
                var sX = 0, sY = 0;
                var scaleToHeight = (((options.width * image.height) / options.height) > image.width);

                var sW = (scaleToHeight ? Math.floor(image.width) : Math.floor((options.width * image.height) / options.height));
                var sH = (scaleToHeight ? Math.floor((options.height * image.width) / options.width) : Math.floor(image.height));

                if (options.center) {
                    sX = (scaleToHeight ? 0 : Math.floor((sW - options.width) / 2));
                    sY = (scaleToHeight ? Math.floor((sH - options.height) / 2) : 0);
                }

                ctx.drawImage(image, sX, sY, sW, sH, 0, 0, options.width, options.height);
            } else {
                ctx.drawImage(image, 0, 0, options.width, options.height);
            }

            return canvas.toDataURL(options.output, 1);
        };

        return promiseService.wrap(function (promise) {
            if (typeof imageOrUri == 'string') {
                var image = new Image();

                image.onload = function () {
                    promise.resolve(_processImage(image));
                };

                image.src = imageOrUri;
            } else {
                promise.resolve(_processImage(imageOrUri));
            }
        });
    };
}]);
var sdkHelperCropInspectionApp = angular.module('ag.sdk.helper.crop-inspection', ['ag.sdk.helper.document', 'ag.sdk.library']);

sdkHelperCropInspectionApp.factory('cropInspectionHelper', ['underscore', function(underscore) {
    var _approvalTypes = ['Approved', 'Not Approved', 'Not Planted'];

    var _commentTypes = ['Crop amendment', 'Crop re-plant', 'Insurance coverage discontinued', 'Multi-insured', 'Other', 'Without prejudice', 'Wrongfully reported'];

    var _growthStageTable = [
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'R16', 'R17', 'R18'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
        ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']
    ];

    var _growthStageCrops = {
        'Barley': _growthStageTable[1],
        'Bean': _growthStageTable[5],
        'Bean (Broad)': _growthStageTable[5],
        'Bean (Dry)': _growthStageTable[5],
        'Bean (Sugar)': _growthStageTable[5],
        'Bean (Green)': _growthStageTable[5],
        'Bean (Kidney)': _growthStageTable[5],
        'Canola': _growthStageTable[7],
        'Cotton': _growthStageTable[6],
        'Grain Sorghum': _growthStageTable[3],
        'Maize': _growthStageTable[0],
        'Maize (White)': _growthStageTable[0],
        'Maize (Yellow)': _growthStageTable[0],
        'Soya Bean': _growthStageTable[2],
        'Sunflower': _growthStageTable[4],
        'Wheat': _growthStageTable[1],
        'Wheat (Durum)': _growthStageTable[1]
    };

    var _inspectionTypes = {
        'emergence inspection': 'Emergence Inspection',
        'hail inspection': 'Hail Inspection',
        //'harvest inspection': 'Harvest Inspection',
        //'preharvest inspection': 'Pre Harvest Inspection',
        'progress inspection': 'Progress Inspection'
    };

    var _moistureStatusTypes = ['Dry', 'Moist', 'Wet'];

    var _seedTypeTable = [
        ['Maize Commodity', 'Maize Hybrid', 'Maize Silo Fodder']
    ];

    var _seedTypes = {
        'Maize': _seedTypeTable[0],
        'Maize (White)': _seedTypeTable[0],
        'Maize (Yellow)': _seedTypeTable[0]
    };

    var _policyTypes = ['Hail', 'Multi Peril'];

    var _policyInspections = {
        'Hail': ['emergence inspection', 'hail inspection'],
        'Multi Peril': underscore.keys(_inspectionTypes)
    };

    var _problemTypes = {
        disease: 'Disease',
        fading: 'Fading',
        uneven: 'Uneven',
        other: 'Other',
        root: 'Root',
        shortage: 'Shortage',
        weed: 'Weed'
    };

    var _flowerTypes = {
        'Dry Bean': 'pod',
        'Grain Sorghum': 'panicle',
        'Maize (White)': 'ear',
        'Maize (Yellow)': 'ear',
        'Sunflower': 'flower',
        'Wheat': 'spikelet',
        'Soya Bean': 'pod'
    };

    return {
        approvalTypes: function () {
            return _approvalTypes;
        },
        commentTypes: function () {
            return _commentTypes;
        },
        inspectionTitles: function () {
            return _inspectionTypes;
        },
        inspectionTypes: function () {
            return underscore.keys(_inspectionTypes);
        },
        moistureStatusTypes: function () {
            return _moistureStatusTypes;
        },
        policyTypes: function () {
            return _policyTypes;
        },
        policyInspectionTypes: function (policyType) {
            return _policyInspections[policyType] || [];
        },
        problemTypes: function () {
            return _problemTypes;
        },

        getFlowerType: function (crop) {
            return _flowerTypes[crop] || '';
        },
        getGrowthStages: function (crop) {
            return _growthStageCrops[crop] || _growthStageTable[0];
        },
        getSeedTypes:function (crop) {
            return _seedTypes[crop];
        },
        getInspectionTitle: function (type) {
            return _inspectionTypes[type] || '';
        },
        getProblemTitle: function (type) {
            return _problemTypes[type] || '';
        },
        getSampleArea: function (asset, zone) {
            return (_flowerTypes[asset.data.crop] === 'spikelet' ?
                (zone && zone.plantedInRows === true ? '3m' : 'm²') :
                (_flowerTypes[asset.data.crop] === 'pod' ? '3m' : '10m'));
        },

        hasSeedTypes: function (crop) {
            return _seedTypes[crop] !== undefined;
        },

        calculateProgressYield: function (asset, samples, pitWeight, realization) {
            pitWeight = pitWeight || 0;
            realization = (realization === undefined ? 100 : realization);

            var reduceSamples = function (samples, prop) {
                return (underscore.reduce(samples, function (total, sample) {
                    return (sample[prop] ? total + sample[prop] : total);
                }, 0) / samples.length) || 0
            };

            var zoneYields = underscore.map(asset.data.zones, function (zone, index) {
                var zoneSamples = underscore.where(samples, {zone: index});
                var total = {
                    coverage: (zone.size / asset.data.plantedArea),
                    heads: reduceSamples(zoneSamples, 'heads'),
                    weight: reduceSamples(zoneSamples, 'weight')
                };

                if (_flowerTypes[asset.data.crop] === 'spikelet') {
                    total.yield = (total.weight * total.heads) / ((asset.data.irrigated ? 3000 : 3500) * (zone.inRows ? zone.rowWidth * 3 : 1));
                } else if (_flowerTypes[asset.data.crop] === 'pod') {
                    total.pods = reduceSamples(zoneSamples, 'pods');
                    total.seeds = reduceSamples(zoneSamples, 'seeds');
                    total.yield = (pitWeight * total.seeds * total.pods * total.heads) / (zone.rowWidth * 300);
                } else {
                    total.yield = (total.weight * total.heads) / (zone.rowWidth * 1000);
                }

                total.yield *= (realization / 100);

                return total;
            });

            return {
                zones: zoneYields,
                flower: _flowerTypes[asset.data.crop],
                yield: underscore.reduce(zoneYields, function (total, item) {
                    return total + (item.coverage * item.yield);
                }, 0)
            };
        }
    }
}]);

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

var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentRegistry', 'underscore',
    function (documentRegistry, underscore) {
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
                map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + documentRegistry.getProperty(item[item.referenceType].docType, 'title', '') + ' ' + item.referenceType;

                map.referenceState = documentRegistry.getProperty(item[item.referenceType].docType, 'state');
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
                map.referenceState = taskHelper.getTaskState(item[item.referenceType].todo);
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

var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.authorization', 'ag.sdk.utilities', 'ag.sdk.interface.list', 'ag.sdk.library']);

sdkHelperTaskApp.provider('taskHelper', ['underscore', function (underscore) {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = item.documentKey;
        var mappedItems = underscore.chain(item.subtasks)
            .filter(function (task) {
                return (task.type === 'child' && _validTaskStatuses.indexOf(task.status) !== -1);
            })
            .map(function (task) {
                return {
                    id: task.id || item.$id,
                    title: item.organization.name,
                    subtitle: _getTaskTitle(task.todo, task),
                    todo: task.todo,
                    groupby: title,
                    status: {
                        text: task.status || ' ',
                        label: _getStatusLabelClass(task.status)
                    }
                }
            })
            .value();

        return (mappedItems.length ? mappedItems : undefined);
    };

    var _parentListServiceMap = function (item) {
        return {
            id: item.documentId,
            title: item.organization.name,
            subtitle: item.documentKey,
            status: {
                text: item.status || ' ',
                label: _getStatusLabelClass(item.status)
            }
        };
    };

    var _taskTodoMap = {};

    var _getTaskState = function (taskType) {
        return (_taskTodoMap[taskType] ? _taskTodoMap[taskType].state : undefined);
    };

    var _getTaskTitle = function (taskType, task) {
        var taskMap = _taskTodoMap[taskType];

        return (taskMap !== undefined ? (typeof taskMap.title === 'string' ? taskMap.title : taskMap.title(task)) : undefined);
    };

    var _getStatusTitle = function (taskStatus) {
        return _taskStatusTitles[taskStatus] || taskStatus || ' ';
    };

    var _getActionTitle = function (taskAction) {
        return _taskActionTitles[taskAction] || taskAction || ' ';
    };

    var _getStatusLabelClass = function (status) {
        switch (status) {
            case 'in progress':
            case 'in review':
                return 'label-warning';
            case 'done':
                return 'label-success';
            default:
                return 'label-default';
        }
    };

    var _taskStatusTitles = {
        'backlog': 'Backlog',
        'assigned': 'Assigned',
        'in progress': 'In Progress',
        'in review': 'In Review',
        'done': 'Done',
        'archive': 'Archived'
    };

    var _taskActionTitles = {
        'accept': 'Accept',
        'decline': 'Decline',
        'assign': 'Assign',
        'start': 'Start',
        'complete': 'Complete',
        'approve': 'Approve',
        'reject': 'Reject',
        'release': 'Release'
    };

    /*
     * Provider functions
     */
    this.addTasks = function (tasks) {
        _taskTodoMap = underscore.extend(_taskTodoMap, tasks);
    };

    this.$get = ['authorization', 'listService', 'dataMapService', function (authorization, listService, dataMapService) {
        return {
            listServiceMap: function() {
                return _listServiceMap;
            },
            parentListServiceMap: function() {
                return _parentListServiceMap;
            },

            getTaskState: _getTaskState,
            getTaskTitle: _getTaskTitle,
            getTaskStatusTitle: _getStatusTitle,
            getTaskActionTitle: _getActionTitle,
            getTaskLabel: _getStatusLabelClass,

            taskStatusTitles: function () {
                return _taskStatusTitles;
            },
            filterTasks: function (tasks, excludeStatus) {
                excludeStatus = excludeStatus || [];

                return underscore.filter(tasks, function (task) {
                    return (_getTaskState(task.todo) !== undefined && !underscore.contains(excludeStatus, task.status));
                });
            },
            updateListService: function (id, todo, tasks, organization) {
                var currentUser = authorization.currentUser();
                var task = underscore.findWhere(tasks, {id: id});

                listService.addItems(dataMapService({
                    id: task.parentTaskId,
                    documentKey: task.documentKey,
                    type: 'parent',
                    todo: todo,
                    organization: organization,
                    subtasks : underscore.filter(tasks, function (task) {
                        return (task && task.assignedTo === currentUser.username);
                    })
                }, _listServiceMap));

                if (task && _validTaskStatuses.indexOf(task.status) === -1) {
                    listService.removeItems(task.id);
                }
            }
        }
    }];
}]);

sdkHelperTaskApp.factory('taskWorkflowHelper', ['underscore', function (underscore) {
    var taskActions = ['accept', 'decline', 'start', 'assign', 'complete', 'approve', 'reject', 'release'],
        taskActionsMap = {
            accept: ['backlog', 'assigned', 'in progress', 'in review', 'complete'],
            decline: ['assigned'],
            start: ['assigned', 'in progress'],
            assign: ['backlog', 'assigned', 'in progress', 'in review'],
            complete: ['assigned', 'in progress'],
            approve: ['in review'],
            reject: ['assigned', 'in review'],
            release: ['done']
        },
        taskTypeActions = {
            parent: {
                complete: ['in progress'],
                reject: ['done'],
                release: ['done']
            },
            child: taskActionsMap,
            external: taskActionsMap
        };

    return {
        canChangeToState: function (task, action) {
            return (underscore.contains(taskActions, action) ?
                (taskTypeActions[task.type] && taskTypeActions[task.type][action] ?
                taskTypeActions[task.type][action].indexOf(task.status) !== -1 : false) : true);
        }
    }
}]);

var sdkHelperUserApp = angular.module('ag.sdk.helper.user', []);

sdkHelperUserApp.provider('userHelper', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['listServiceMap', function (listServiceMap) {
        var _languageList = ['English'];

        return {
            listServiceMap: function() {
                return listServiceMap('user');
            },
            languageList: function() {
                return _languageList;
            }
        }
    }];

    listServiceMapProvider.add('user', [function () {
        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.firstName + ' ' + item.lastName,
                subtitle: item.position,
                teams: item.teams
            }
        };
    }]);
}]);

var sdkInterfaceGeocledianApp = angular.module('ag.sdk.interface.geocledian', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkInterfaceGeocledianApp.provider('geocledianService', ['underscore', function (underscore) {
    var _defaultConfig = {
        key: '46552fa9-6a5v-2346-3z67-s4b8556cxvwp',
        layers: ['vitality', 'visible'],
        url: 'https://geocledian.com/agknow/api/v3/',
        source: 'sentinel2'
    };

    this.config = function (options) {
        _defaultConfig = underscore.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$http', 'moment', 'promiseService', 'underscore',
        function ($http, moment, promiseService, underscore) {
            function GeocledianService () {
                this.ids = [];
                this.dates = [];
                this.parcels = [];
            }

            GeocledianService.prototype = {
                config: _defaultConfig,
                createParcel: function (data) {
                    return promiseService.wrap(function (promise) {
                        $http.post(_defaultConfig.url + 'parcels', underscore.extend({key: _defaultConfig.key}, data))
                            .then(function (result) {
                                if (result && result.data && underscore.isNumber(result.data.id)) {
                                    promise.resolve(result.data);
                                } else {
                                    promise.reject();
                                }
                            }, promise.reject);
                    });
                },
                addParcel: function (parcelId) {
                    return addParcel(this, parcelId);
                },
                getDates: function () {
                    return underscore.chain(this.parcels)
                        .pluck('date')
                        .uniq()
                        .sortBy(function (date) {
                            return moment(date)
                        })
                        .value();
                },
                getParcels: function (query) {
                    if (typeof query != 'object') {
                        query = {'parcel_id': query};
                    }

                    return underscore.where(this.parcels, query);
                },
                getParcelImageUrl: function (parcel, imageType) {
                    return _defaultConfig.url + parcel[imageType || 'png'] + '?key=' + _defaultConfig.key;
                }
            };

            function addParcel (instance, parcelId) {
                return promiseService.wrapAll(function (promises) {
                    var parcels = instance.getParcels(parcelId);

                    if (parcelId && parcels && parcels.length == 0) {
                        instance.ids.push(parcelId);

                        underscore.each(_defaultConfig.layers, function (layer) {
                            promises.push(addParcelType(instance, parcelId, layer));
                        });
                    } else {
                        underscore.each(parcels, function (parcel) {
                            promises.push(parcel);
                        });
                    }
                });
            }

            function addParcelType (instance, parcelId, type) {
                return $http.get(_defaultConfig.url + 'parcels/' + parcelId + '/' + type + '?key=' + _defaultConfig.key + (_defaultConfig.source ? '&source=' + _defaultConfig.source : '')).then(function (result) {
                    if (result && result.data && result.data.content) {
                        instance.parcels = instance.parcels.concat(underscore.map(result.data.content, function (parcel) {
                            return underscore.extend(parcel, {
                                type: type
                            });
                        }));
                    }
                });
            }

            return function () {
                return new GeocledianService();
            }
        }];
}]);
var sdkInterfaceListApp = angular.module('ag.sdk.interface.list', ['ag.sdk.id']);

sdkInterfaceListApp.factory('listService', ['$rootScope', 'objectId', function ($rootScope, objectId) {
    var _button,
        _groupby,
        _infiniteScroll,
        _search,
        _title;

    var _items = [];
    var _activeItemId;

    var _defaultButtonClick = function() {
        $rootScope.$broadcast('list::button__clicked');
    };

    var _setButton = function (button) {
        if (_button !== button) {
            if (typeof button === 'object') {
                _button = button;
                _button.click = _button.click || _defaultButtonClick;
            } else {
                _button = undefined;
            }

            $rootScope.$broadcast('list::button__changed', _button);
        }
    };

    var _setGroupby = function (groupby) {
        if (_groupby !== groupby) {
            if (groupby !== undefined) {
                _groupby = groupby;
            } else {
                _groupby = undefined;
            }

            $rootScope.$broadcast('list::groupby__changed', _groupby);
        }
    };

    var _setScroll = function (infinite) {
        if (_infiniteScroll !== infinite) {
            if (infinite !== undefined) {
                _items = [];
                _infiniteScroll = infinite;
            } else {
                _infiniteScroll = undefined;
            }

            $rootScope.$broadcast('list::scroll__changed', _infiniteScroll);
        }
    };

    var _setSearch = function (search) {
        if (_search !== search) {
            if (search !== undefined) {
                _search = search;
            } else {
                _search = undefined;
            }

            $rootScope.$broadcast('list::search__changed', _search);
        }
    };

    var _setTitle = function (title) {
        if (_title !== title) {
            _title = (title ? title : undefined);

            $rootScope.$broadcast('list::title__changed', _title);
        }
    };

    var _setActiveItem = function(id) {
        _activeItemId = id;

        if (_items instanceof Array) {
            for (var i = 0; i < _items.length; i++) {
                _items[i].active = false;

                if (id !== undefined) {
                    if (_items[i].id == id) {
                        _items[i].active = true;
                    }
                    else if (_items[i].type == id) {
                        _items[i].active = true;
                    }
                }
            }
        } else {
            for (var itemKey in _items) {
                if (_items.hasOwnProperty(itemKey)) {
                    _items[itemKey].active = (itemKey == id);
                }
            }
        }
    };

    var _getActiveItem = function() {
        if (_items instanceof Array) {
            for (var i = 0; i < _items.length; i++) {
                if (_items[i].id == _activeItemId) {
                    return _items[i];
                }
            }
        } else {
            for (var itemKey in _items) {
                if (_items.hasOwnProperty(itemKey) && itemKey == _activeItemId) {
                    return _items[itemKey];
                }
            }
        }

        return null;
    };

    $rootScope.$on('$onTransitionSuccess', function (event, transition) {
        var params = transition.params() || {};

        if (params.id) {
            _setActiveItem(params.id);
        } else {
            _setActiveItem(params.type);
        }
    });

    $rootScope.$on('list::item__selected', function(event, args) {
        if (typeof args == 'object') {
            if(args.id) {
                _setActiveItem(args.id);
            } else {
                _setActiveItem(args.type);
            }
        } else {
            _setActiveItem(args);
        }
    });

    return {
        /* CONFIG */
        config: function(config) {
            if (config.reset) {
                _button = undefined;
                _groupby = undefined;
                _infiniteScroll = undefined;
                _search = undefined;
                _title = undefined;

                _items = [];
                _activeItemId = undefined;
            }

            _setButton(config.button);
            _setGroupby(config.groupby);
            _setScroll(config.infiniteScroll);
            _setSearch(config.search);
            _setTitle(config.title);
        },
        button: function(button) {
            if (arguments.length == 1) {
                _setButton(button);
            }
            return _button;
        },
        groupby: function(groupby) {
            if (arguments.length == 1) {
                _setGroupby(groupby);
            }

            return _groupby;
        },
        /**
         *
         * @param {Object} infinite
         * @param {function} infinite.request
         * @param {boolean} infinite.busy
         * @returns {*}
         */
        infiniteScroll: function(infinite) {
            if (arguments.length == 1) {
                _setScroll(infinite);
            }

            return _infiniteScroll;
        },
        search: function(search) {
            if (arguments.length == 1) {
                _setSearch(search);
            }

            return _search;
        },
        title: function(title) {
            if(arguments.length == 1) {
                _setTitle(title);
            }

            return _title;
        },

        /* ITEMS */
        items: function(items) {
            if (items !== undefined) {
                _items = angular.copy(items);
                _activeItemId = undefined;

                $rootScope.$broadcast('list::items__changed', _items);
            }

            return _items;
        },
        length: function () {
            return _items.length;
        },
        addItems: function(items, top) {
            if (items !== undefined) {
                if ((items instanceof Array) === false) {
                    items = [items];
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    item.id = item.id || objectId().toBase64String();

                    if (_items instanceof Array) {
                        var found = false;

                        for (var x = 0; x < _items.length; x++) {
                            if (item.id == _items[x].id) {
                                _items[x] = item;
                                _items[x].active = (_activeItemId !== undefined && _activeItemId == item.id);
                                found = true;

                                break;
                            }
                        }

                        if (found == false) {
                            if (top === true) {
                                _items.unshift(item);
                            } else {
                                _items.push(item);
                            }
                        }
                    } else {
                        _items[item.id] = item;
                        _items[item.id].active = (_activeItemId !== undefined && _activeItemId == item.id);
                    }
                }

                $rootScope.$broadcast('list::items__changed', _items);
            }
        },
        removeItems: function(ids) {
            if (ids !== undefined) {
                if ((ids instanceof Array) === false) {
                    ids = [ids];
                }

                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];

                    if (_items instanceof Array) {
                        for (var x = 0; x < _items.length; x++) {
                            if (id == _items[x].id) {
                                _items.splice(x, 1);

                                if (id == _activeItemId && _items.length) {
                                    var next = (_items[x] ? _items[x] : _items[x - 1]);
                                    $rootScope.$broadcast('list::item__selected', next);
                                }

                                break;
                            }
                        }
                    } else {
                        delete _items[id];
                    }
                }

                if (_items instanceof Array && _items.length == 0) {
                    $rootScope.$broadcast('list::items__empty');
                }

                $rootScope.$broadcast('list::items__changed', _items);
            }
        },
        selectFirstItem: function() {
            $rootScope.$broadcast('list::selectFirst__requested');
        },
        setActiveItem: function(id) {
            _setActiveItem(id);
        },
        getActiveItem: function() {
            return _getActiveItem();
        },
        updateLabel: function(item) {
            $rootScope.$broadcast('list::labels__changed', item);
        }
    }
}]);

sdkInterfaceListApp.provider('listServiceMap', function () {
    var types = {};

    this.add = function (type, fnOrArray) {
        types[type] = fnOrArray;
    };

    this.$get = ['$injector', function ($injector) {
        function noType (item) {
            return item;
        }

        function getType (type) {
            if (type && types[type] && types[type] instanceof Array) {
                types[type] = $injector.invoke(types[type]);
            }

            return types[type];
        }

        return function (type, defaultType) {
            return getType(type) || getType(defaultType) || noType;
        }
    }];
});

var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.config', 'ag.sdk.geospatial', 'ag.sdk.library']);

sdkInterfaceMapApp.provider('mapMarkerHelper', ['underscore', function (underscore) {
    var _createMarker = function (name, state, options) {
        return underscore.defaults(options || {}, {
            iconUrl: 'img/icons/' + name + '.' + (state ? state : 'default') + '.png',
            shadowUrl: 'img/icons/' + name + '.shadow.png',
            iconSize: [48, 48],
            iconAnchor: [22, 42],
            shadowSize: [73, 48],
            shadowAnchor: [22, 40],
            labelAnchor: [12, -24]
        });
    };

    var _getMarker = this.getMarker = function (name, state, options) {
        if (typeof state == 'object') {
            options = state;
            state = 'default';
        }

        return  _createMarker(name, state, options);
    };

    var _getMarkerStates = this.getMarkerStates = function (name, states, options) {
        var markers = {};

        if (typeof name === 'string') {
            angular.forEach(states, function(state) {
                markers[state] = _createMarker(name, state, options);
            });
        }

        return markers;
    };

    this.$get = function() {
        return {
            getMarker: _getMarker,
            getMarkerStates: _getMarkerStates
        }
    };
}]);

sdkInterfaceMapApp.provider('mapStyleHelper', ['mapMarkerHelperProvider', 'underscore', function (mapMarkerHelperProvider, underscore) {
    var _markerIcons = {
        asset: mapMarkerHelperProvider.getMarkerStates('asset', ['default', 'success', 'error']),
        marker: mapMarkerHelperProvider.getMarkerStates('marker', ['default', 'success', 'error'])
    };

    var _mapStyles = {
        foreground: {
            district: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.6
                }
            },
            farmland: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "blue",
                    fillOpacity: 0.3
                }
            },
            field: {
                icon: 'success',
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.8
                }
            },
            crop: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.8
                }
            },
            improvement: {
                icon: 'success',
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#808080",
                    fillOpacity: 0.8
                }
            },
            cropland: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.8
                }
            },
            pasture: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.8
                }
            },
            'permanent-crop': {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.8
                }
            },
            plantation: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.8
                }
            },
            marker: {
                icon: _markerIcons.marker.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            search: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#f7b2bf",
                    fillOpacity: 0.8,
                    dashArray: "5,5"
                }
            }
        },
        background: {
            district: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.2
                }
            },
            farmland: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "blue",
                    fillOpacity: 0.1
                }
            },
            field: {
                icon: 'default',
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.4
                }
            },
            crop: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.4
                }
            },
            improvement: {
                icon: 'default',
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#c0c0c0",
                    fillOpacity: 0.4
                }
            },
            cropland: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.4
                }
            },
            pasture: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.4
                }
            },
            'permanent-crop': {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.4
                }
            },
            plantation: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.4
                }
            },
            marker: {
                icon: _markerIcons.marker.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.5,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            }
        }
    };

    var _getStyle = this.getStyle = function (composition, layerName, label) {
        layerName = underscore.slugify(layerName);
        var mapStyle = angular.copy(_mapStyles[composition] && _mapStyles[composition][layerName] || _mapStyles[composition || 'background']['marker']);

        if (typeof mapStyle.icon === 'string') {
            if (_markerIcons[layerName] === undefined) {
                _markerIcons[layerName] = mapMarkerHelperProvider.getMarkerStates(layerName, ['default', 'success', 'error']);
            }

            mapStyle.icon = _markerIcons[layerName][mapStyle.icon];
        }

        if (typeof label === 'object') {
            mapStyle.label = label;
        }

        return mapStyle;
    };

    var _setStyle = this.setStyle = function(composition, layerName, style) {
        _mapStyles[composition] = _mapStyles[composition] || {};
        _mapStyles[composition][layerName] = style;
    };

    var _setStyles = this.setStyles = function (styles) {
        underscore.each(styles, function (composition, compositionKey) {
            _mapStyles[compositionKey] = _mapStyles[compositionKey] || {};

            underscore.each(composition, function (style, styleKey) {
                _mapStyles[compositionKey][styleKey] = underscore.chain(_mapStyles[compositionKey][styleKey] || {})
                    .extend(style)
                    .value();
            });
        });
    };

    this.$get = function() {
        return {
            getStyle: _getStyle,
            setStyle: _setStyle,
            setStyles: _setStyles
        }
    };
}]);

/**
 * Maps
 */
sdkInterfaceMapApp.provider('mapboxServiceCache', [function () {
    var _store = {
        config: {},
        instances: {}
    };

    function getConfig () {
        return _store.config;
    }

    function setConfig (config) {
        _store.config = config;
    }

    function getInstance (id) {
        return _store.instances[id];
    }

    function setInstance (id, instance) {
        _store.instances[id] = instance;
    }

    function resetInstances () {
        _store.instances = {};
    }

    this.getConfig = getConfig;
    this.setConfig = setConfig;

    this.$get = [function() {
        return {
            getConfig: getConfig,
            setConfig: setConfig,

            getInstance: getInstance,
            setInstance: setInstance,
            resetInstances: resetInstances
        }
    }];
}]);

sdkInterfaceMapApp.provider('mapboxService', ['mapboxServiceCacheProvider', 'underscore', function (mapboxServiceCacheProvider, underscore) {
    mapboxServiceCacheProvider.setConfig({
        init: {
            delay: 200
        },
        options: {
            attributionControl: true,
            layersControl: true,
            scrollWheelZoom: false,
            zoomControl: true
        },
        layerControl: {
            baseTile: 'Agriculture',
            baseLayers: {
                'Agriculture': {
                    template: 'agrista.f9f5628d',
                    type: 'mapbox'
                },
                'Satellite (Vivid)': {
                    template: 'https://{s}.tiles.mapbox.com/styles/v1/digitalglobe/cinvynyut001db4m6xwd5cz1f/tiles/{z}/{x}/{y}?access_token={accessToken}',
                    type: 'tileLayer',
                    options: {
                        accessToken: 'pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqcjh1NzE4azA1MDU0M3N5ZGQ0eWZieGYifQ.G690aJi4WHE_gTVtN6-E2A'
                    }
                },
                'Satellite (Recent)': {
                    template: 'https://{s}.tiles.mapbox.com/styles/v1/digitalglobe/ciode6t5k0081aqm7k06dod4v/tiles/{z}/{x}/{y}?access_token={accessToken}',
                    type: 'tileLayer',
                    options: {
                        accessToken: 'pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNqcjh1NzE4azA1MDU0M3N5ZGQ0eWZieGYifQ.G690aJi4WHE_gTVtN6-E2A'
                    }
                },
                'Land Cover': {
                    template: 'https://maps.agrista.com/za/wms?',
                    type: 'wms',
                    options: {
                        attribution: "&copy; 2019 Agrista, DAFF",
                        crs: L.CRS.EPSG4326,
                        format: 'image/png',
                        layers: 'za:land_cover',
                        version: '1.1.0'
                    }
                },
                'Hybrid': {
                    template: 'agrista.01e3fb18',
                    type: 'mapbox'
                },
                'Light': {
                    template: 'agrista.e7367e07',
                    type: 'mapbox'
                },
                'Production Regions': {
                    template: 'agrista.87ceb2ab',
                    type: 'mapbox'
                }
            },
            overlays: {}
        },
        controls: {},
        events: {},
        view: {
            coordinates: [-29.0003409534,25.0839009251],
            zoom: 5.1
        },
        bounds: {},
        leafletLayers: {},
        layers: {},
        geojson: {}
    });
    
    this.config = function (options) {
        mapboxServiceCacheProvider.setConfig(underscore.defaults(options || {}, mapboxServiceCacheProvider.getConfig()));
    };

    this.$get = ['$rootScope', '$timeout', 'mapboxServiceCache', 'objectId', 'safeApply', function ($rootScope, $timeout, mapboxServiceCache, objectId, safeApply) {
        /**
        * @name MapboxServiceInstance
        * @param id
        * @constructor
        */
        function MapboxServiceInstance(id, options) {
            var _this = this;

            _this._id = id;
            _this._ready = false;
            _this._options = options;
            _this._show = _this._options.show || false;

            _this._config = angular.copy(mapboxServiceCache.getConfig());
            _this._requestQueue = [];

            $rootScope.$on('mapbox-' + _this._id + '::init', function () {
                $timeout(function () {
                    _this.dequeueRequests();
                    _this._ready = true;
                }, _this._config.init.delay || 0);
            });

            $rootScope.$on('mapbox-' + _this._id + '::destroy', function () {
                _this._ready = false;

                if (_this._options.persist !== true) {
                    _this._config = angular.copy(mapboxServiceCache.getConfig());
                }
            });
        }

        MapboxServiceInstance.prototype = {
            getId: function () {
                return this._id;
            },
            isReady: function () {
                return this._ready;
            },
            
            /*
             * Reset
             */
            reset: function () {
                this._config = angular.copy(mapboxServiceCache.getConfig());

                $rootScope.$broadcast('mapbox-' + this._id + '::reset');
            },
            clearLayers: function () {
                this.removeOverlays();
                this.removeGeoJSON();
                this.removeLayers();
            },

            /*
             * Queuing requests
             */
            enqueueRequest: function (event, data, handler) {
                handler = handler || angular.noop;

                if (this._ready) {
                    $rootScope.$broadcast(event, data);

                    handler();
                } else {
                    this._requestQueue.push({
                        event: event,
                        data: data,
                        handler: handler
                    });
                }
            },
            dequeueRequests: function () {
                if (this._requestQueue.length) {
                    do {
                        var request = this._requestQueue.shift();

                        $rootScope.$broadcast(request.event, request.data);

                        request.handler();
                    } while(this._requestQueue.length);
                }
            },

            /*
             * Display
             */
            shouldShow: function() {
                return this._show;
            },
            hide: function() {
                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::hide', {}, function () {
                    _this._show = false;
                });
            },
            show: function() {
                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::show', {}, function () {
                    _this._show = true;
                });
            },
            invalidateSize: function() {
                this.enqueueRequest('mapbox-' + this._id + '::invalidate-size', {});
            },

            /*
             * Options
             */
            getOptions: function () {
                return this._config.options;
            },
            setOptions: function (options) {
                var _this = this;

                angular.forEach(options, function(value, key) {
                    _this._config.options[key] = value;
                });
            },

            /*
             * Map
             */
            getMapCenter: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-center', handler);
            },
            getMapBounds: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-bounds', handler);
            },
            getMapControl: function(control, handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-control', {
                    control: control,
                    handler: handler
                });
            },

            /*
             * Layer Control
             */
            getBaseTile: function () {
                return this._config.layerControl.baseTile;
            },
            setBaseTile: function (tile) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::set-basetile', tile, function () {
                    _this._config.layerControl.baseTile = tile;
                });
            },

            getBaseLayers: function () {
                return this._config.layerControl.baseLayers;
            },
            setBaseLayers: function (layers) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::set-baselayers', layers, function () {
                    _this._config.layerControl.baseLayers = layers;
                });
            },
            addBaseLayer: function (name, layer, show) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::add-baselayer', {
                    name: name,
                    layer: layer,
                    show: show
                }, function () {
                    _this._config.layerControl.baseLayers[name] = layer;
                });
            },

            getOverlays: function () {
                return this._config.layerControl.overlays;
            },
            addOverlay: function (layerName, name) {
                if (layerName && this._config.layerControl.overlays[layerName] == undefined) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + _this._id + '::add-overlay', {
                        layerName: layerName,
                        name: name || layerName
                    }, function () {
                        _this._config.layerControl.overlays[layerName] = name;
                    });
                }
            },
            removeOverlay: function (layerName) {
                if (layerName && this._config.layerControl.overlays[layerName]) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-overlay', layerName, function () {
                        delete _this._config.layerControl.overlays[layerName];
                    });
                }
            },
            removeOverlays: function () {
                var _this = this;
                
                angular.forEach(_this._config.layerControl.overlays, function(overlay, name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-overlay', name, function () {
                        delete _this._config.layerControl.overlays[name];
                    });
                });
            },

            /*
             * Controls
             */
            getControls: function () {
                return this._config.controls;
            },
            addControl: function (controlName, options) {
                var _this = this;
                var control = {
                    name: controlName,
                    options: options
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::add-control', control, function () {
                    _this._config.controls[controlName] = control;
                });
            },
            showControls: function () {
                this.enqueueRequest('mapbox-' + this._id + '::show-controls');
            },
            hideControls: function () {
                this.enqueueRequest('mapbox-' + this._id + '::hide-controls');
            },
            removeControl: function (control) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::remove-control', control, function () {
                    delete _this._config.controls[control];
                });
            },

            /*
             * Event Handlers
             */
            getEventHandlers: function () {
                return this._config.events;
            },
            addEventHandler: function (events, handler) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function (event) {
                    _this.removeEventHandler(event);

                    var eventHandler = (event !== 'click' ? handler : function (e) {
                        var clickLocation = e.originalEvent.x + ',' + e.originalEvent.y;

                        if (!_this.lastClick || _this.lastClick !== clickLocation) {
                            safeApply(function () {
                                handler(e);
                            });
                        }

                        _this.lastClick = clickLocation;
                    });

                    _this.enqueueRequest('mapbox-' + _this._id + '::add-event-handler', {
                        event: event,
                        handler: eventHandler
                    }, function () {
                        _this._config.events[event] = eventHandler;
                    });
                });
            },
            removeEventHandler: function (events) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function (event) {
                    if (_this._config.events[event] !== undefined) {
                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-event-handler', {
                            event: event,
                            handler: _this._config.events[event]
                        }, function () {
                            delete _this._config.events[event];
                        });
                    }
                });
            },
            addLayerEventHandler: function (event, layer, handler) {
                var _this = this;

                layer.on(event, (event !== 'click' ? handler : function (e) {
                    var clickLocation = e.originalEvent.x + ',' + e.originalEvent.y;

                    if (!_this.lastClick || _this.lastClick !== clickLocation) {
                        safeApply(function () {
                            handler(e);
                        });
                    }

                    _this.lastClick = clickLocation;
                }));
            },

            /*
             * View
             */
            getView: function () {
                return {
                    coordinates: this._config.view.coordinates,
                    zoom: this._config.view.zoom
                }
            },
            setView: function (coordinates, zoom) {
                if (coordinates instanceof Array) {
                    var _this = this;
                    var view = {
                        coordinates: coordinates,
                        zoom: zoom || _this._config.view.zoom
                    };

                    _this.enqueueRequest('mapbox-' + _this._id + '::set-view', view, function () {
                        _this._config.view = view;
                    });
                }
            },
            getBounds: function () {
                return this._config.bounds;
            },
            setBounds: function (coordinates, options) {
                var _this = this;
                var bounds = {
                    coordinates: coordinates,
                    options: options || {
                        reset: false
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::set-bounds', bounds, function () {
                    _this._config.bounds = bounds;
                });
            },
            panBy: function (coordinates, options) {
                this.enqueueRequest('mapbox-' + this._id + '::pan-by', {
                    coordinates: coordinates,
                    options: options
                });
            },
            panTo: function (coordinates, options) {
                this.enqueueRequest('mapbox-' + this._id + '::pan-to', {
                    coordinates: coordinates,
                    options: options
                });
            },
            zoomTo: function (coordinates, zoom, options) {
                this.enqueueRequest('mapbox-' + this._id + '::zoom-to', {
                    coordinates: coordinates,
                    zoom: zoom,
                    options: options
                });
            },

            /*
             * Layers
             */
            createLayer: function (name, type, options, handler) {
                if (typeof options === 'function') {
                    handler = options;
                    options = {};
                }

                var _this = this;
                var layer = {
                    name: name,
                    type: type,
                    options: options,
                    handler: function (layer) {
                        _this._config.leafletLayers[name] = layer;

                        if (typeof handler === 'function') {
                            handler(layer);
                        }
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::create-layer', layer, function () {
                    _this._config.layers[name] = layer;
                });
            },
            getLayer: function (name) {
                return this._config.leafletLayers[name];
            },
            getLayers: function () {
                return this._config.layers;
            },
            addLayer: function (name, layer) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::add-layer', name, function () {
                    _this._config.leafletLayers[name] = layer;
                });
            },
            removeLayer: function (names) {
                if ((names instanceof Array) === false) names = [names];

                var _this = this;

                angular.forEach(names, function (name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', name, function () {
                        delete _this._config.layers[name];
                        delete _this._config.leafletLayers[name];
                    });
                });
            },
            removeLayers: function () {
                var _this = this;
                
                angular.forEach(this._config.layers, function(layer, name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', name, function () {
                        delete _this._config.layers[name];
                        delete _this._config.leafletLayers[name];
                    });
                });
            },
            showLayer: function (name) {
                this.enqueueRequest('mapbox-' + this._id + '::show-layer', name);
            },
            hideLayer: function (name) {
                this.enqueueRequest('mapbox-' + this._id + '::hide-layer', name);
            },
            fitLayer: function (name, options) {
                this.enqueueRequest('mapbox-' + this._id + '::fit-layer', {
                    name: name,
                    options: options || {
                        reset: false
                    }
                });
            },

            /*
             * GeoJson
             */
            getGeoJSON: function () {
                return this._config.geojson;
            },
            getGeoJSONFeature: function (layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    return this._config.geojson[layerName][featureId];
                }

                return null;
            },
            getGeoJSONLayer: function (layerName) {
                if (this._config.geojson[layerName]) {
                    return this._config.geojson[layerName];
                }

                return null;
            },
            addGeoJSON: function(layerName, geojson, options, properties, onAddCallback) {
                if (typeof properties == 'function') {
                    onAddCallback = properties;
                    properties = {};
                }

                var _this = this;

                properties = underscore.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    handler: function (layer, feature, featureLayer) {
                        _this._config.leafletLayers[layerName] = layer;
                        _this._config.leafletLayers[properties.featureId] = featureLayer;

                        if (typeof onAddCallback == 'function') {
                            onAddCallback(feature, featureLayer);
                        }
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::add-geojson', data, function () {
                    _this._config.geojson[layerName] = _this._config.geojson[layerName] || {};
                    _this._config.geojson[layerName][properties.featureId] = data;
                });

                return properties.featureId;
            },
            removeGeoJSONFeature: function(layerName, featureId) {
                var _this = this;

                _this.enqueueRequest('mapbox-' + this._id + '::remove-geojson-feature', {
                    layerName: layerName,
                    featureId: featureId
                }, function () {
                    if (_this._config.geojson[layerName]) {
                        delete _this._config.geojson[layerName][featureId];
                    }
                });
            },
            removeGeoJSONLayer: function(layerNames) {
                if ((layerNames instanceof Array) === false) layerNames = [layerNames];

                var _this = this;

                angular.forEach(layerNames, function(layerName) {
                    if (_this._config.geojson[layerName]) {
                        angular.forEach(_this._config.geojson[layerName], function(childLayer, childName) {
                            _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', childName, function () {
                                delete _this._config.leafletLayers[childName];
                                delete _this._config.geojson[layerName][childName];
                            });
                        });

                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-geojson-layer', layerName, function () {
                            delete _this._config.leafletLayers[layerName];
                            delete _this._config.geojson[layerName];
                        });
                    }
                });
            },
            removeGeoJSON: function() {
                var _this = this;

                angular.forEach(_this._config.geojson, function(layer, name) {
                    angular.forEach(layer, function(childLayer, childName) {
                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', childName, function () {
                            delete _this._config.leafletLayers[childName];
                            delete _this._config.geojson[name][childName];
                        });
                    });

                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-geojson-layer', name, function () {
                        delete _this._config.leafletLayers[name];
                        delete _this._config.geojson[name];
                    });
                });
            },

            /*
             * Editing
             */
            editingOn: function (layerName, controls, controlOptions, styleOptions, addLayer) {
                if (typeof controlOptions == 'string') {
                    controlOptions = {
                        exclude: (controlOptions == 'exclude')
                    }
                }

                this.enqueueRequest('mapbox-' + this._id + '::edit-on', {layerName: layerName, controls: controls, controlOptions: controlOptions, styleOptions: styleOptions, addLayer: addLayer});
            },
            editingUpdate: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-update');
            },
            editingClear: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-clear');
            },
            editingOff: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-off');
            },

            /*
             * Picking
             */
            pickPortionOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-portion-on');
            },
            pickDistrictOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-district-on');
            },
            pickFieldOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-field-on');
            },
            defineFarmOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-on');
            },
            defineServiceAreaOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-service-area-on');
            },
            defineFieldGroupOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-on');
            },
            featureClickOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-on');
            },
            pickPortionOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-portion-off');
            },
            pickDistrictOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-district-off');
            },
            pickFieldOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-field-off');
            },
            defineFarmOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-off');
            },
            defineServiceAreaOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-service-area-off');
            },
            defineFieldGroupOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-off');
            },
            featureClickOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-off');
            },

            /*
             * Sidebar
             */
            enableSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::enable-sidebar');
            },
            showSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-show');
            },
            hideSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-hide');
            },
            toggleSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-toggle');
            }
        };

        /*
         * Get or create a MapboxServiceInstance
         */
        return function (id, options) {
            options = options || {};

            var instance = mapboxServiceCache.getInstance(id);

            if (instance === undefined) {
                instance = new MapboxServiceInstance(id, options);
                mapboxServiceCache.setInstance(id, instance);
            }

            if (options.clean === true) {
                instance.reset();
            }

            return instance;
        };
    }];
}]);

/**
 * mapbox
 */
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', '$log', '$timeout', 'configuration', 'mapboxService', 'geoJSONHelper', 'mapStyleHelper', 'objectId', 'sphericalHelper', 'underscore', function ($rootScope, $http, $log, $timeout, configuration, mapboxService, geoJSONHelper, mapStyleHelper, objectId, sphericalHelper, underscore) {
    var _instances = {};
    
    function Mapbox(attrs, scope) {
        var _this = this;
        _this._id = attrs.id;

        _this._optionSchema = {};
        _this._editing = false;
        _this._editableLayer;
        _this._editableFeature = L.featureGroup();
        _this._featureClickable;

        _this._geoJSON = {};
        _this._layers = {};
        _this._controls = {};
        _this._layerControls = {
            baseTile: '',
            baseLayers: {},
            overlays: {}
        };
        _this._draw = {
            exclude: false,
            addLayer: true,
            options: {},
            controls: {}
        };

        // Init
        attrs.delay = attrs.delay || 0;

        $timeout(function () {
            _this.mapInit();
            _this.addListeners(scope);

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::init', _this._map);
        }, attrs.delay);
    }

    /*
     * Config
     */
    Mapbox.prototype.mapInit = function() {
        // Setup mapboxServiceInstance
        var _this = this;
        _this._mapboxServiceInstance = mapboxService(_this._id);

        // Setup map
        var view = _this._mapboxServiceInstance.getView();
        var options = _this._mapboxServiceInstance.getOptions();

        L.mapbox.accessToken = options.accessToken;

        _this._map = L.map(_this._id, options).setView(view.coordinates, view.zoom);

        _this._map.whenReady(function () {
            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::ready', _this._map);
        });

        _this._map.on('baselayerchange', function (event) {
            _this._layerControls.baseTile = event.name;
        });

        _this._editableFeature = L.featureGroup();
        _this._editableFeature.addTo(_this._map);

        _this.setEventHandlers(_this._mapboxServiceInstance.getEventHandlers());
        _this.addControls(_this._mapboxServiceInstance.getControls());
        _this.setBounds(_this._mapboxServiceInstance.getBounds());
        _this.resetLayers(_this._mapboxServiceInstance.getLayers());
        _this.resetGeoJSON(_this._mapboxServiceInstance.getGeoJSON());
        _this.resetLayerControls(_this._mapboxServiceInstance.getBaseTile(), _this._mapboxServiceInstance.getBaseLayers(), _this._mapboxServiceInstance.getOverlays());

        _this._map.on('draw:drawstart', _this.onDrawStart, _this);
        _this._map.on('draw:editstart', _this.onEditStart, _this);
        _this._map.on('draw:deletestart', _this.onDrawStart, _this);
        _this._map.on('draw:drawstop', _this.onDrawStop, _this);
        _this._map.on('draw:editstop', _this.onEditStop, _this);
        _this._map.on('draw:deletestop', _this.onDrawStop, _this);
    };

    Mapbox.prototype.addListeners = function (scope) {
        scope.hidden = !this._mapboxServiceInstance.shouldShow();
        
        var _this = this;
        var id = this._mapboxServiceInstance.getId();

        scope.$on('mapbox-' + id + '::get-center', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getCenter());
            }
        });

        scope.$on('mapbox-' + id + '::get-bounds', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getBounds());
            }
        });

        scope.$on('mapbox-' + id + '::get-control', function (event, args) {
            if (typeof args.handler === 'function') {
                args.handler(_this._controls[args.control]);
            }
        });

        // Destroy mapbox directive
        scope.$on('$destroy', function () {
            delete _instances[id];

            _this.mapDestroy();

            _this.broadcast('mapbox-' + id + '::destroy');
        });

        // Layer Controls
        scope.$on('mapbox-' + id + '::set-basetile', function (event, args) {
            _this.setBaseTile(args);
        });

        scope.$on('mapbox-' + id + '::set-baselayers', function (event, args) {
            _this.setBaseLayers(args);
        });

        scope.$on('mapbox-' + id + '::add-baselayer', function (event, args) {
            _this.addBaseLayer(args.layer, args.name, args.show);
        });

        scope.$on('mapbox-' + id + '::add-overlay', function (event, args) {
            _this.addOverlay(args.layerName, args.name);
        });

        scope.$on('mapbox-' + id + '::remove-overlay', function (event, args) {
            _this.removeOverlay(args);
        });

        // Controls
        scope.$on('mapbox-' + id + '::add-control', function (event, args) {
            _this.addControls({control: args});
        });

        scope.$on('mapbox-' + id + '::remove-control', function (event, args) {
            _this.removeControl(args);
        });

        scope.$on('mapbox-' + id + '::show-controls', function (event, args) {
            _this.showControls(args);
        });

        scope.$on('mapbox-' + id + '::hide-controls', function (event, args) {
            _this.hideControls(args);
        });

        // Event Handlers
        scope.$on('mapbox-' + id + '::add-event-handler', function (event, args) {
            _this.addEventHandler(args.event, args.handler);
        });

        scope.$on('mapbox-' + id + '::remove-event-handler', function (event, args) {
            _this.removeEventHandler(args.event, args.handler);
        });

        // View
        scope.$on('mapbox-' + id + '::set-view', function (event, args) {
            _this.setView(args);
        });

        scope.$on('mapbox-' + id + '::set-bounds', function (event, args) {
            _this.setBounds(args);
        });

        scope.$on('mapbox-' + id + '::pan-by', function (event, args) {
            _this.panBy(args);
        });

        scope.$on('mapbox-' + id + '::pan-to', function (event, args) {
            _this.panTo(args);
        });

        scope.$on('mapbox-' + id + '::zoom-to', function (event, args) {
            _this.zoomTo(args);
        });

        // Layers
        scope.$on('mapbox-' + id + '::create-layer', function (event, args) {
            if (typeof args.handler === 'function') {
                args.handler(_this.createLayer(args.name, args.type, args.options));
            }
        });

        scope.$on('mapbox-' + id + '::add-layer', function (event, args) {
            _this.addLayer(args);
        });

        scope.$on('mapbox-' + id + '::remove-layer', function (event, args) {
            _this.removeLayer(args);
        });

        scope.$on('mapbox-' + id + '::show-layer', function (event, args) {
            _this.showLayer(args);
        });

        scope.$on('mapbox-' + id + '::hide-layer', function (event, args) {
            _this.hideLayer(args);
        });

        scope.$on('mapbox-' + id + '::fit-layer', function (event, args) {
            _this.fitLayer(args);
        });

        // GeoJSON
        scope.$on('mapbox-' + id + '::add-geojson', function (event, args) {
            _this.addGeoJSONFeature(args);
        });

        scope.$on('mapbox-' + id + '::remove-geojson-feature', function (event, args) {
            _this.removeGeoJSONFeature(args);
        });

        scope.$on('mapbox-' + id + '::remove-geojson-layer', function (event, args) {
            _this.removeGeoJSONLayer(args);
        });

        // Visibility
        scope.$on('mapbox-' + id + '::hide', function (event, args) {
            scope.hidden = true;
        });

        scope.$on('mapbox-' + id + '::show', function (event, args) {
            scope.hidden = false;
        });

        scope.$on('mapbox-' + id + '::invalidate-size', function (event, args) {
            _this._map.invalidateSize();
        });

        // Editing
        scope.$on('mapbox-' + id + '::edit-on', function(events, args) {
            _this.setOptionSchema(args.styleOptions);
            _this.makeEditable(args.layerName, args.addLayer, true);
            _this.setDrawControls(args.controls, args.controlOptions);
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-update', function(events, args) {
            _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-clear', function(events, args) {
            _this.cleanEditable();
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-off', function(events, args) {
            _this.makeEditable(undefined, {}, true);
            _this.updateDrawControls();
        });

        // Picking
        scope.$on('mapbox-' + id + '::pick-portion-on', function(event, args) {
            _this._map.on('click', _this.pickPortion, _this);
        });

        scope.$on('mapbox-' + id + '::pick-district-on', function(event, args) {
            _this._map.on('click', _this.pickDistrict, _this);
        });

        scope.$on('mapbox-' + id + '::pick-field-on', function(event, args) {
            _this._map.on('click', _this.pickField, _this);
        });

        scope.$on('mapbox-' + id + '::define-farm-on', function(event, args) {
            _this._map.on('click', _this.defineNewFarm, _this);
        });

        scope.$on('mapbox-' + id + '::define-service-area-on', function(event, args) {
            _this._map.on('click', _this.defineServiceArea, _this);
        });

        scope.$on('mapbox-' + id + '::define-field-group-on', function(event, args) {
            _this._map.on('click', _this.defineFieldGroup, _this);
        });

        scope.$on('mapbox-' + id + '::feature-click-on', function(event, args) {
            _this._featureClickable = true;
        });

        scope.$on('mapbox-' + id + '::pick-portion-off', function(event, args) {
            _this._map.off('click', _this.pickPortion, _this);
        });

        scope.$on('mapbox-' + id + '::pick-field-off', function(event, args) {
            _this._map.off('click', _this.pickField, _this);
        });

        scope.$on('mapbox-' + id + '::pick-district-off', function(event, args) {
            _this._map.off('click', _this.pickDistrict, _this);
        });

        scope.$on('mapbox-' + id + '::define-farm-off', function(event, args) {
            _this._map.off('click', _this.defineNewFarm, _this);
        });

        scope.$on('mapbox-' + id + '::define-service-area-off', function(event, args) {
            _this._map.off('click', _this.defineServiceArea, _this);
        });

        scope.$on('mapbox-' + id + '::define-field-group-off', function(event, args) {
            _this._map.off('click', _this.defineFieldGroup, _this);
        });

        scope.$on('mapbox-' + id + '::feature-click-off', function(event, args) {
            _this._featureClickable = false;
        });

        scope.$on('mapbox-' + id + '::enable-sidebar', function(event, args) {
            var sidebar = L.control.sidebar('sidebar', {closeButton: true, position: 'right'});
            _this._sidebar = sidebar;
            _this._map.addControl(sidebar);
        });

        // Sidebar
        scope.$on('mapbox-' + id + '::sidebar-show', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.show();
            }
        });

        scope.$on('mapbox-' + id + '::sidebar-hide', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.hide();
            }
        });

        scope.$on('mapbox-' + id + '::sidebar-toggle', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.toggle();
            }
        });
    };

    Mapbox.prototype.mapDestroy = function () {
        if (this._map) {
            for (var layer in this._map._layers) {
                if (this._map._layers.hasOwnProperty(layer)) {
                    this._map.removeLayer(this._map._layers[layer]);
                }
            }

            this._map.remove();
            this._map = null;
        }

        this._optionSchema = {};
        this._editing = false;
        this._editableLayer = null;
        this._editableFeature = null;

        this._geoJSON = {};
        this._layers = {};
        this._layerControls = {
            baseTile: '',
            baseLayers: {},
            overlays: {}
        };
        this._draw = {
            exclude: false,
            addLayer: true,
            options: {},
            controls: {}
        };
    };

    Mapbox.prototype.broadcast = function (event, data) {
        $log.debug(event);
        $rootScope.$broadcast(event, data);
    };

    /*
     * Reset
     */
    Mapbox.prototype.resetLayerControls = function (baseTile, baseLayers, overlays) {
        this._layerControls.baseTile = baseTile;

        try {
            this.map.removeControl(this._layerControls.control);
        } catch(exception) {}

        this.setBaseLayers(baseLayers);
        this.setOverlays(overlays);
    };

    Mapbox.prototype.resetLayers = function (layers) {
        var _this = this;

        angular.forEach(_this._layers, function (layer, name) {
            _this._map.removeLayer(layer);

            delete _this._layers[name];
        });

        angular.forEach(layers, function (layer, name) {
            if (typeof layer.handler === 'function') {
                layer.handler(_this.createLayer(name, layer.type, layer.options));
            }
        });
    };

    Mapbox.prototype.resetGeoJSON = function (geojson) {
        var _this = this;

        angular.forEach(_this._geoJSON, function (layer, name) {
            if (_this._layers[name]) {
                _this._map.removeLayer(_this._layers[name]);

                delete _this._layers[name];
            }
        });

        angular.forEach(geojson, function(layer) {
            _this.addGeoJSONLayer(layer);
        });
    };

    /*
     * Layer Controls
     */
    Mapbox.prototype.setBaseTile = function (baseTile) {
        var _this = this,
            _hasBaseTile = false;

        if (_this._layerControls.baseTile !== baseTile) {
            angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
                if (_this._map.hasLayer(baselayer.layer)) {
                    _this._map.removeLayer(baselayer.layer);
                }
                if (name === baseTile) {
                    _hasBaseTile = true;
                }
            });

            if (_hasBaseTile) {
                _this._layerControls.baseTile = baseTile;
            }

            angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
                if (name === _this._layerControls.baseTile) {
                    _this._map.addLayer(baselayer.layer);
                }
            });
        }
    };

    Mapbox.prototype.setBaseLayers = function (layers) {
        var _this = this;
        var options = _this._mapboxServiceInstance.getOptions();

        if (_this._layerControls.control === undefined) {
            _this._layerControls.control = L.control.layers({}, {});

            if (options.layersControl) {
                _this._map.addControl(_this._layerControls.control);
            }
        }

        angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
            if (layers[name] === undefined) {
                _this._layerControls.control.removeLayer(baselayer.layer);
            } else if (baselayer.layer === undefined) {
                _this.addBaseLayer(baselayer, name);
            }
        });

        angular.forEach(layers, function (baselayer, name) {
            if (_this._layerControls.baseLayers[name] === undefined) {
                _this.addBaseLayer(baselayer, name);
            } else {
                baselayer =  _this._layerControls.baseLayers[name];

                if (name === _this._layerControls.baseTile) {
                    baselayer.layer.addTo(_this._map);
                }
            }
        });
    };

    Mapbox.prototype.addBaseLayer = function (baselayer, name, show) {
        if (this._layerControls.baseLayers[name] === undefined) {
            if (baselayer.type === 'mapbox') {
                baselayer.layer = L.mapbox.tileLayer(baselayer.template, baselayer.options);
            } else if (typeof L[baselayer.type] === 'function') {
                baselayer.layer = L[baselayer.type](baselayer.template, baselayer.options);
            } else if (typeof L.tileLayer[baselayer.type] === 'function') {
                baselayer.layer = L.tileLayer[baselayer.type](baselayer.template, baselayer.options);
            }

            if (baselayer.layer) {
                if (name === this._layerControls.baseTile || show) {
                    baselayer.layer.addTo(this._map);
                }

                this._layerControls.baseLayers[name] = baselayer;
                this._layerControls.control.addBaseLayer(baselayer.layer, name);
            }
        }
    };

    Mapbox.prototype.setOverlays = function (overlays) {
        var _this = this;

        angular.forEach(_this._layerControls.overlays, function (overlay, name) {
            if (overlays[name] === undefined) {
                _this.removeOverlay(name, overlay);
            }
        });

        angular.forEach(overlays, function (name, layerName) {
            _this.addOverlay(layerName, name);
        });
    };

    Mapbox.prototype.addOverlay = function (layerName, name) {
        var layer = this._layers[layerName];
        name = name || layerName;

        if (this._layerControls.control && layer) {
            if (this._layerControls.overlays[layerName] === undefined) {
                this._layerControls.overlays[layerName] = layer;

                this._layerControls.control.addOverlay(layer, name);
            }
        }
    };

    Mapbox.prototype.removeOverlay = function (name, overlay) {
        var layer = overlay || this._layers[name];

        if (this._layerControls.control && layer) {
            this._layerControls.control.removeLayer(layer);

            delete this._layerControls.overlays[name];
        }
    };

    /*
     * Controls
     */
    Mapbox.prototype.addControls = function (controls) {
        var _this = this;

        angular.forEach(controls, function (control) {
            if (typeof L.control[control.name] == 'function') {
                _this.removeControl(control.name);

                _this._controls[control.name] = L.control[control.name](control.options);
                _this._map.addControl(_this._controls[control.name]);
            }
        });
    };

    Mapbox.prototype.showControls = function () {
        var _this = this;

        if (_this._layerControls.control) {
            _this._map.addControl(_this._layerControls.control);
        }

        angular.forEach(_this._controls, function (control, key) {
            control.addTo(_this._map);
            delete _this._controls[key];
        });
    };

    Mapbox.prototype.hideControls = function () {
        var _this = this;

        if (_this._layerControls.control) {
            _this._layerControls.control.remove();
        }

        angular.forEach(_this._map.options, function (option, key) {
            if (option === true && _this._map[key] && typeof _this._map[key].disable == 'function') {
                _this._controls[key] = _this._map[key];
                _this._map[key].remove();
            }
        });
    };

    Mapbox.prototype.removeControl = function (control) {
        if (this._controls[control]) {
            this._map.removeControl(this._controls[control]);
            delete this._controls[control];
        }
    };

    /*
     * Event Handlers
     */
    Mapbox.prototype.setEventHandlers = function (handlers) {
        var _this = this;

        angular.forEach(handlers, function (handler, event) {
            _this.addEventHandler(event, handler);
        });
    };

    Mapbox.prototype.addEventHandler = function (event, handler) {
        this._map.on(event, handler);
    };

    Mapbox.prototype.removeEventHandler = function (event, handler) {
        this._map.off(event, handler);
    };

    /*
     * View
     */
    Mapbox.prototype.setView = function (view) {
        if (this._map && view !== undefined) {
            this._map.setView(view.coordinates, view.zoom);
        }
    };

    Mapbox.prototype.setBounds = function (bounds) {
        if (this._map && bounds.coordinates) {
            if (bounds.coordinates instanceof Array) {
                if (bounds.coordinates.length > 1) {
                    this._map.fitBounds(bounds.coordinates, bounds.options);
                } else if (bounds.coordinates.length == 1) {
                    this._map.fitBounds(bounds.coordinates.concat(bounds.coordinates), bounds.options);
                }
            } else {
                this._map.fitBounds(bounds.coordinates, bounds.options);
            }
        }
    };

    Mapbox.prototype.panBy = function (pan) {
        if (this._map && pan.coordinates) {
            this._map.panBy(pan.coordinates, pan.options);
        }
    };

    Mapbox.prototype.panTo = function (pan) {
        if (this._map && pan.coordinates) {
            this._map.panTo(pan.coordinates, pan.options);
        }
    };

    Mapbox.prototype.zoomTo = function (view) {
        if (this._map && view.coordinates && view.zoom) {
            this._map.setZoomAround(view.coordinates, view.zoom, view.options);
        }
    };

    /*
     * Layers
     */
    Mapbox.prototype.createLayer = function (name, type, options) {
        type = type || 'featureGroup';

        options = underscore.defaults(options || {},  {
            enabled: true
        });

        if (this._layers[name] === undefined) {
            if (type == 'featureGroup' && L.featureGroup) {
                this._layers[name] = L.featureGroup(options);
            } else if (type == 'layerGroup' && L.layerGroup) {
                this._layers[name] = L.layerGroup(options);
            } else if (type == 'markerClusterGroup' && L.markerClusterGroup) {
                this._layers[name] = L.markerClusterGroup(options);
            }

            if (this._layers[name] && options.enabled) {
                this._layers[name].addTo(this._map);
            }
        }

        return this._layers[name];
    };

    Mapbox.prototype.addLayer = function (name) {
        var layer = this._mapboxServiceInstance.getLayer(name),
            added = false;

        if (layer) {
            added = (this._layers[name] == undefined);
            this._layers[name] = layer;
            this._map.addLayer(layer);
        }

        return added;
    };

    Mapbox.prototype.addLayerToLayer = function (name, layer, toLayerName) {
        var toLayer = this._layers[toLayerName];
        
        if (toLayer) {
            if (this._layers[name]) {
                toLayer.removeLayer(layer);
            }

            this._layers[name] = layer;
            toLayer.addLayer(layer);

            return true;
        }

        return false;
    };

    Mapbox.prototype.removeLayer = function (name) {
        var layer = this._layers[name],
            removed = false;

        if (layer) {
            removed = (this._layers[name] != undefined);
            this.removeOverlay(name);
            this._map.removeLayer(layer);

            delete this._layers[name];
        }

        return removed;
    };

    Mapbox.prototype.removeLayerFromLayer = function (name, fromLayerName) {
        var fromLayer = this._layers[fromLayerName],
            layer = this._layers[name],
            removed = false;

        if (fromLayer && layer) {
            removed = (this._layers[name] != undefined);
            fromLayer.removeLayer(layer);

            delete this._layers[name];
        }

        return removed;
    };

    Mapbox.prototype.showLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer) == false) {
            this._map.addLayer(layer);

            if (layer.eachLayer) {
                layer.eachLayer(function (item) {
                    if (item.bindTooltip && item.feature && item.feature.properties && item.feature.properties.label) {
                        item.bindTooltip(item.feature.properties.label.message, item.feature.properties.label.options);
                    }
                });
            }
        }
    };

    Mapbox.prototype.hideLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer)) {
            this._map.removeLayer(layer);
        }
    };

    Mapbox.prototype.fitLayer = function (args) {
        if (args.name) {
            var layer = this._layers[args.name];

            if (layer && this._map.hasLayer(layer)) {
                var bounds = layer.getBounds();

                this._map.fitBounds(bounds, args.options);
            }
        }
    };

    /*
     * GeoJSON
     */
    Mapbox.prototype.addGeoJSONLayer = function (data) {
        var _this = this;

        angular.forEach(data, function(item) {
            _this.addGeoJSONFeature(item);
        });
    };

    Mapbox.prototype.makeIcon = function (data) {
        if (data instanceof L.Class) {
            return data;
        } else {
            if (data.type && L[data.type]) {
                return (L[data.type].icon ? L[data.type].icon(data) : L[data.type](data));
            } else {
                return L.icon(data);
            }
        }
    };

    Mapbox.prototype.addLabel = function (labelData, feature, layer) {
        var _this = this;
        var geojson = geoJSONHelper(feature);

        if (typeof labelData === 'object' && feature.geometry.type !== 'Point') {
            labelData.options = labelData.options || {};

            var label = new L.Tooltip(labelData.options);
            label.setContent(labelData.message);
            label.setLatLng(geojson.getCenter().reverse());

            if (labelData.options.permanent == true) {
                label.addTo(_this._map);

                layer.on('add', function () {
                    label.addTo(_this._map);
                });
                layer.on('remove', function () {
                    _this._map.removeLayer(label);
                });
            } else {
                layer.on('mouseover', function () {
                    label.addTo(_this._map);
                });
                layer.on('mouseout', function () {
                    _this._map.removeLayer(label);
                });
            }
        }
    };

    Mapbox.prototype.addGeoJSONFeature = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName, item.type, item.options);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var geojsonOptions = (item.options ? angular.copy(item.options) : {});

        if (geojsonOptions.icon) {
            geojsonOptions.icon = _this.makeIcon(geojsonOptions.icon);
        }

        L.geoJson(geojson.getJson(), {
            style: geojsonOptions.style,
            pointToLayer: function(feature, latlng) {
                var marker;
                // add points as circles
                if(geojsonOptions.radius) {
                    marker = L.circleMarker(latlng, geojsonOptions);
                }
                // add points as markers
                else {
                    marker = L.marker(latlng, geojsonOptions);
                }

                if (geojsonOptions.label) {
                    marker.bindPopup(geojsonOptions.label.message, geojsonOptions.label.options);
                }

                return marker;
            },
            onEachFeature: function(feature, layer) {
                var added = _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);
                _this.addLabel(geojsonOptions.label, feature, layer);

                if (added && typeof item.handler === 'function') {
                    item.handler(_this._layers[item.layerName], feature, layer);
                }

                if (_this._featureClickable && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                    // highlight polygon on click
                    layer.on('click', function(e) {
                        if(feature && feature.properties) {
                            if(feature.properties.highlighted) {
                                feature.properties.highlighted = false;
                                layer.setStyle({color: layer.options.fillColor || 'blue', opacity: layer.options.fillOpacity || 0.4});
                            } else {
                                feature.properties.highlighted = true;
                                layer.setStyle({color: 'white', opacity: 1, fillColor: layer.options.fillColor || 'blue', fillOpacity: layer.options.fillOpacity || 0.4});
                            }
                        }

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::polygon-clicked', {properties: feature.properties, highlighted: feature.properties.highlighted});
                    });
                }
            }
        });
    };

    Mapbox.prototype.removeGeoJSONFeature = function (data) {
        if (this._geoJSON[data.layerName] && this._geoJSON[data.layerName][data.featureId]) {
            this.removeLayerFromLayer(data.featureId, data.layerName);
            
            delete this._geoJSON[data.layerName][data.featureId];
        }
    };

    Mapbox.prototype.removeGeoJSONLayer = function (layerName) {
        if (this._geoJSON[layerName]) {
            this.removeLayer(layerName);

            delete this._geoJSON[layerName];
        }
    };

    /*
     * Edit
     */
    Mapbox.prototype.makeEditable = function (editable, addLayer, clean) {
        var _this = this;

        if (clean == true) {
            _this.cleanEditable();
        }

        if(editable && _this._layers[editable]) {
            _this._layers[editable].eachLayer(function(layer) {
                _this._layers[editable].removeLayer(layer);
                _this._editableFeature.addLayer(layer);
            });
        }
        _this._editableLayer = editable;
        _this._draw.addLayer = (addLayer == undefined ? true : addLayer);
    };

    Mapbox.prototype.cleanEditable = function () {
        var _this = this;

        _this._editableFeature.eachLayer(function(layer) {
            _this._editableFeature.removeLayer(layer);
        });
    };

    Mapbox.prototype.resetEditable = function () {
        var _this = this;

        if (_this._editableFeature) {
            _this._editableFeature.eachLayer(function(layer) {
                _this._editableFeature.removeLayer(layer);

                if (_this._layers[_this._editableLayer]) {
                    _this._layers[_this._editableLayer].addLayer(layer);
                }
            });

            _this._editableFeature = L.featureGroup();
            _this._editableFeature.addTo(_this._map);
        }
    };

    Mapbox.prototype.setDrawControls = function (controls, controlOptions) {
        this._draw.controlOptions = controlOptions || this._draw.controlOptions || {};
        this._draw.controls = {};

        if(controls instanceof Array && typeof L.Control.Draw == 'function') {
            this._draw.controls.circle = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: (controls.indexOf('circle') == -1 ? false : {
                        showRadius: true,
                        feet: false,
                        metric: true
                    }),
                    marker: false
                }
            });

            this._draw.controls.polyline = new L.Control.Draw({
                draw: {
                    polyline: (controls.indexOf('polyline') != -1),
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: false
                }
            });

            this._draw.controls.polygon = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: (controls.indexOf('polygon') == -1 ? false : {
                        allowIntersection: false,
                        showArea: true,
                        metric: true
                    }),
                    rectangle: false,
                    circle: false,
                    marker: false
                }
            });

            this._draw.controls.marker = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: (controls.indexOf('marker') == -1 ? false : {
                        icon: (this._optionSchema.icon ? L.icon(this._optionSchema.icon) : L.Icon.Default())
                    })
                }
            });

            this._draw.controls.editor = new L.Control.Draw({
                draw: false,
                edit: {
                    featureGroup: this._editableFeature,
                    remove: (this._draw.controlOptions.nodelete != true)
                }
            });
        }
    };

    Mapbox.prototype.setOptionSchema = function (options) {
        this._optionSchema = options || {};
    };

    Mapbox.prototype.updateDrawControls = function () {
        try {
            this._map.removeControl(this._draw.controls.circle);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.polygon);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.polyline);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.marker);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.editor);
        } catch(exception) {}

        try {
            this._map.off('draw:created', this.onDrawn, this);
            this._map.off('draw:edited', this.onEdited, this);
            this._map.off('draw:deleted', this.onDeleted, this);
        } catch(exception) {}

        // Draw controls
        if(this._editableFeature.getLayers().length > 0) {
            this._map.on('draw:edited', this.onEdited, this);
            this._map.on('draw:deleted', this.onDeleted, this);

            if(this._draw.controls.editor) {
                this._draw.controls.editor = new L.Control.Draw({
                    draw: false,
                    edit: {
                        featureGroup: this._editableFeature,
                        remove: (this._draw.controlOptions.nodelete != true)
                    }
                });

                this._map.addControl(this._draw.controls.editor);
            }
        }

        if (this._editableLayer && (this._editableFeature.getLayers().length == 0 || this._draw.controlOptions.multidraw)) {
            var controlRequirement = {
                circle: true,
                polygon: true,
                polyline: true,
                marker: true
            };

            this._editableFeature.eachLayer(function(layer) {
                if(layer.feature && layer.feature.geometry && layer.feature.geometry.type) {
                    switch(layer.feature.geometry.type) {
                        case 'LineString':
                            controlRequirement.polyline = false;
                            break;
                        case 'Polygon':
                            controlRequirement.circle = false;
                            controlRequirement.polygon = false;
                            break;
                        case 'Point':
                            controlRequirement.marker = false;
                            break;
                    }
                }
            });

            if (this._draw.controlOptions.exclude) {
                if(controlRequirement.circle) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(controlRequirement.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(controlRequirement.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(controlRequirement.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            } else {
                if(this._draw.controls.circle) {
                    this._map.addControl(this._draw.controls.circle);
                }

                if(this._draw.controls.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(this._draw.controls.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(this._draw.controls.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            }
        }
    };

    /*
     * Picking
     */
    Mapbox.prototype.pickPortion = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/portion' + params)
                .success(function (portion) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, portion.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey});

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                    }

                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineNewFarm = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/portion' + params)
                .success(function (portion) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, portion.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey, portion: portion});

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.pickDistrict = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/district' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        var districtOptions = mapStyleHelper.getStyle('background', 'district');
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, districtOptions, {featureId: district.sgKey});

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineServiceArea = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/district' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        var districtOptions = mapStyleHelper.getStyle('background', 'district');
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, districtOptions, {featureId: district.sgKey, districtName: district.name});

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.pickField = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/field' + params)
                .success(function (field) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, field.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, {});

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineFieldGroup = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/field' + params)
                .success(function (field) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, field.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, { });

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.onDrawStart = function (e) {
       this._editing = true;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawStop = function (e) {
        this._editing = false;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawn = function (e) {
        var _this = this;
        var geojson = {
            type: 'Feature',
            geometry: {},
            properties: {
                featureId: objectId().toString()
            }
        };

        var _getCoordinates = function (latlngs, geojson) {
            var polygonCoordinates = [];

            angular.forEach(latlngs, function(latlng) {
                polygonCoordinates.push([latlng.lng, latlng.lat]);
            });

            // Add a closing coordinate if there is not a matching starting one
            if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                polygonCoordinates.push(polygonCoordinates[0]);
            }

            // Add area
            if (geojson.properties.area !== undefined) {
                var geodesicArea = L.GeometryUtil.geodesicArea(latlngs);
                var yards = (geodesicArea * 1.19599);

                geojson.properties.area.m_sq += geodesicArea;
                geojson.properties.area.ha += (geodesicArea * 0.0001);
                geojson.properties.area.mi_sq += (yards / 3097600);
                geojson.properties.area.acres += (yards / 4840);
                geojson.properties.area.yd_sq += yards;
            }

            return polygonCoordinates;
        };

        var _circleToPolygon = function (circle, geojson) {
            var center = circle._latlng,
                radius = circle._mRadius,
                vertices = Math.max(16, Math.ceil(radius / 5)),
                angularRadius = radius / sphericalHelper.RADIUS * 180 / Math.PI,
                latlngs = [];

            for (var i = 0; i < vertices + 1; i++) {
                latlngs.push(sphericalHelper.radial(
                    [center.lng, center.lat],
                    (i / vertices) * 360, radius).reverse());
            }

            if (angularRadius > (90 - center.lat)) {
                latlngs.push([latlngs[0][0], center.lng + 180],
                    [90, center.lng + 180],
                    [90, center.lng - 180],
                    [latlngs[0][0], center.lng - 180]);
            }

            if (angularRadius > (90 + center.lat)) {
                latlngs.splice((vertices >> 1) + 1, 0,
                    [latlngs[(vertices >> 1)][0], center.lng - 180],
                    [-90, center.lng - 180],
                    [-90, center.lng + 180],
                    [latlngs[(vertices >> 1)][0], center.lng + 180]);
            }

            return _getCoordinates(L.polygon(latlngs)._latlngs[0], geojson);
        };

        switch (e.layerType) {
            case 'circle':
            case 'polygon':
                geojson.geometry = {
                    type: 'Polygon',
                    coordinates: []
                };

                geojson.properties.area = {
                    m_sq: 0,
                    ha: 0,
                    mi_sq: 0,
                    acres: 0,
                    yd_sq: 0
                };

                if (e.layerType === 'polygon') {
                    angular.forEach(e.layer._latlngs, function (latlngs) {
                        geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
                    });
                } else {
                    geojson.geometry.coordinates.push(_circleToPolygon(e.layer, geojson));
                }

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'polyline':
                geojson.geometry = {
                    type: 'LineString',
                    coordinates: []
                };

                angular.forEach(e.layer._latlngs, function(latlng) {
                    geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                });

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'marker':
                geojson.geometry = {
                    type: 'Point',
                    coordinates: [e.layer._latlng.lng, e.layer._latlng.lat]
                };

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
        }

        this._editing = false;

        if (this._draw.addLayer) {
            this._mapboxServiceInstance.addGeoJSON(this._editableLayer, geojson, this._optionSchema, geojson.properties);
            this.makeEditable(this._editableLayer);
            this.updateDrawControls();
        }
    };

    Mapbox.prototype.onEditStart = function (e) {
        this._editing = true;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onEditStop = function (e) {
        this._editing = false;
        this.resetEditable();
        this.makeEditable(this._editableLayer);
        this.updateDrawControls();

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onEdited = function (e) {
        var _this = this;

        e.layers.eachLayer(function(layer) {
            var geojson = {
                type: 'Feature',
                geometry: {
                    type: layer.feature.geometry.type
                },
                properties: {
                    featureId: layer.feature.properties.featureId
                }
            };

            if (_this._draw.controls.polygon.options.draw.polygon.showArea) {
                geojson.properties.area = {
                    m_sq: 0,
                    ha: 0,
                    mi_sq: 0,
                    acres: 0,
                    yd_sq: 0
                };
            }

            var _getCoordinates = function (latlngs, geojson) {
                var polygonCoordinates = [];

                angular.forEach(latlngs, function(latlng) {
                    polygonCoordinates.push([latlng.lng, latlng.lat]);
                });

                // Add a closing coordinate if there is not a matching starting one
                if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                    polygonCoordinates.push(polygonCoordinates[0]);
                }

                // Add area
                if (geojson.properties.area !== undefined) {
                    var geodesicArea = L.GeometryUtil.geodesicArea(latlngs);
                    var yards = (geodesicArea * 1.19599);

                    geojson.properties.area.m_sq += geodesicArea;
                    geojson.properties.area.ha += (geodesicArea * 0.0001);
                    geojson.properties.area.mi_sq += (yards / 3097600);
                    geojson.properties.area.acres += (yards / 4840);
                    geojson.properties.area.yd_sq += yards;
                }

                return polygonCoordinates;
            };

            switch(layer.feature.geometry.type) {
                case 'Point':
                    geojson.geometry.coordinates = [layer._latlng.lng, layer._latlng.lat];

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'Polygon':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function (latlngs) {
                        geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
                    });

                    if (geojson.geometry.coordinates.length > 1) {
                        geojson.geometry.type = 'MultiPolygon';
                        geojson.geometry.coordinates = [geojson.geometry.coordinates];
                    }

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'MultiPolygon':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function (latlngs, index) {
                        geojson.geometry.coordinates.push([]);
                        angular.forEach(latlngs, function (latlngs) {
                            geojson.geometry.coordinates[index].push(_getCoordinates(latlngs, geojson));
                        });
                    });

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'LineString':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                    });

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
            }
        });
    };

    // may delete one or two geometry at most (field label & field shape)
    Mapbox.prototype.onDeleted = function (e) {
        var _this = this;

        var _removeLayer = function (layer) {
            _this._editableFeature.removeLayer(layer);

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted', layer.feature.properties.featureId);
        };

        if(e.layers.getLayers().length > 0) {
            // Layer is within the editableFeature
            e.layers.eachLayer(function(deletedLayer) {
                if (deletedLayer.feature !== undefined) {
                    _removeLayer(deletedLayer);
                } else {
                    _this._editableFeature.eachLayer(function (editableLayer) {
                        if (editableLayer.hasLayer(deletedLayer)) {
                            _removeLayer(editableLayer);
                        }
                    });
                }
            });
        } else {
            // Layer is the editableFeature
            _this._editableFeature.clearLayers();

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted');
        }

        _this.updateDrawControls();
    };
    
    return {
        restrict: 'E',
        template: '<div class="map" ng-hide="hidden" ng-transclude></div>',
        replace: true,
        transclude: true,
        link: function (scope, element, attrs) {
            if (_instances[attrs.id] === undefined) {
                _instances[attrs.id] = new Mapbox(attrs, scope);
            }
        },
        controller: function ($scope, $attrs) {
            this.getMap = function () {
                return _instances[$attrs.id]._map;
            };
        }
    }
}]);

sdkInterfaceMapApp.directive('mapboxControl', ['$rootScope', function ($rootScope) {
    var _positions = {
        topleft: '.leaflet-top.leaflet-left',
        topright: '.leaflet-top.leaflet-right',
        bottomleft: '.leaflet-bottom.leaflet-left',
        bottomright: '.leaflet-bottom.leaflet-right'
    };

    function addListeners(scope, element) {
        var parent = element.parent();

        $rootScope.$on('mapbox-' + parent.attr('id') + '::init', function (event, map) {
            element.on('click', function (e) {
                if (e.originalEvent) {
                    e.originalEvent._stopped = true;
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                }
            });

            element.on('mouseover', function () {
                map.dragging.disable();
            });

            element.on('mouseout', function () {
                map.dragging.enable();
            });

            parent.find('.leaflet-control-container ' + _positions[scope.position]).prepend(element);

            scope.hidden = false;
        });
    }

    return {
        restrict: 'E',
        require: '^mapbox',
        replace: true,
        transclude: true,
        scope: {
            position: '@'
        },
        template: '<div class="leaflet-control"><div class="leaflet-bar" ng-hide="hidden" ng-transclude></div></div>',
        link: function (scope, element, attrs) {
            scope.hidden = true;
        },
        controller: function($scope, $element) {
            addListeners($scope, $element);
        }
    }
}]);


var sdkInterfaceNavigiationApp = angular.module('ag.sdk.interface.navigation', ['ag.sdk.authorization', 'ag.sdk.library']);

sdkInterfaceNavigiationApp.provider('navigationService', ['underscore', function (underscore) {
    var _registeredApps = {};
    var _groupedApps = [];

    var _groupOrder = {
        'Favourites': 1,
        'Assets': 2,
        'Apps': 3,
        'Administration': 4
    };

    var _buttons = {
        left: [],
        right: []
    };

    var _sortItems = function (a, b) {
        return a.order - b.order;
    };

    var _registerApps = this.registerApps = function(apps) {
        apps = (apps instanceof Array ? apps : [apps]);

        angular.forEach(apps, function (app) {
            app = underscore.defaults(app, {
                id: app.title,
                order: 100,
                group: 'Apps',
                include: function (app, roleApps) {
                    return (roleApps.indexOf(app.id) !== -1);
                }
            });

            if (app.title && app.state) {
                _registeredApps[app.title] = app;
            }
        });
    };

    this.$get = ['$rootScope', '$state', 'authorization', 'promiseService', function ($rootScope, $state, authorization, promiseService) {
        var _slim = false;
        var _footerText = '';

        // Private functions
        var _allowApp = function (app) {
            var group = underscore.findWhere(_groupedApps, {title: app.group});

            // Find if the group exists
            if (group === undefined) {
                // Add the group
                group = {
                    title: app.group,
                    order: _groupOrder[app.group] || 100,
                    items: []
                };

                _groupedApps.push(group);
                _groupedApps = _groupedApps.sort(_sortItems);
            }

            // Find if the app exists in the group
            var groupItem = underscore.findWhere(group.items, {id: app.id});

            if (groupItem === undefined) {
                // Add the app to the group
                app.active = $state.includes(app.state);

                group.items.push(app);
                group.items = group.items.sort(_sortItems);

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                $rootScope.$broadcast('navigation::app__allowed', app);
            }
        };

        var _revokeApp = function (app) {
            var group = underscore.findWhere(_groupedApps, {title: app.group});

            if (group !== undefined) {
                group.items = underscore.reject(group.items, function (item) {
                    return item.id === app.id;
                });

                if (group.items.length === 0) {
                    _groupedApps = underscore.reject(_groupedApps, function (item) {
                        return item.title === group.title;
                    });
                }

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                $rootScope.$broadcast('navigation::app__revoked', app);
            }
        };

        var _revokeAllApps = function () {
            _groupedApps = [];

            $rootScope.$broadcast('navigation::items__changed', _groupedApps);
        };

        var _updateUserApps = function (currentUser) {
            var authUser = currentUser || authorization.currentUser();
            var roleApps = (authUser.userRole ? underscore.pluck(authUser.userRole.apps, 'name') : []);
            var orgServices = (authUser.organization ? underscore.pluck(authUser.organization.services, 'serviceType') : []);

            _revokeAllApps();

            angular.forEach(_registeredApps, function (app) {
                if (typeof app.include == 'function' && app.include(app, roleApps, orgServices) || app.include === true) {
                    _allowApp(app);
                }
            });
        };

        var _setButtons = function (position, buttons) {
            if (buttons) {
                if ((buttons instanceof Array) === false) {
                    _buttons[position].push(buttons);
                } else {
                    _buttons[position] = buttons;
                }

                $rootScope.$broadcast('navigation::' + position + '-buttons__changed', _buttons[position]);
                $rootScope.$broadcast('navigation::buttons__changed');
            }
        };

        // Event handlers
        $rootScope.$on('$onTransitionSuccess', function () {
            angular.forEach(_groupedApps, function (app) {
                angular.forEach(app.items, function (item) {
                    item.active = $state.includes(item.state);
                });
            });
        });

        $rootScope.$on('authorization::login', function (event, currentUser) {
            _updateUserApps(currentUser);
        });

        $rootScope.$on('authorization::unauthorized', function () {
            _revokeAllApps();
        });

        $rootScope.$on('authorization::logout', function () {
            _revokeAllApps();
        });

        _updateUserApps();

        // Public functions
        return {
            getApp: function (id) {
                return underscore.findWhere(_registeredApps, {id: id});
            },
            getGroupedApps: function () {
                return _groupedApps;
            },
            renameApp: function (id, title) {
                var app = underscore.findWhere(_registeredApps, {id: id});

                if (app) {
                    app.title = title;

                    $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                }
            },
            selectItem: function (item) {
                return promiseService.wrap(function (promise) {
                    var app = underscore.findWhere(_registeredApps, {id: item.id});

                    if (app) {
                        $rootScope.$broadcast('navigation::item__selected', app);

                        $state.go(app.state, app.params).then(promise.resolve, promise.reject);
                    } else {
                        promise.reject();
                    }
                });
            },
            /*
             * App registration
             */
            registerApps: function (apps) {
                _registerApps(apps);
            },
            unregisterApps: function () {
                _registeredApps = {};
                _groupedApps = [];
            },
            allowApp: function (appName) {
                if (_registeredApps[appName]) {
                    _allowApp(_registeredApps[appName]);
                }
            },
            revokeApp: function (appName) {
                if (_registeredApps[appName]) {
                    _revokeApp(_registeredApps[appName]);
                }
            },
            /*
             * Control slim toggle
             */
            toggleSlim: function () {
                _slim = !_slim;

                $rootScope.$broadcast('navigation::slim__changed', _slim);
            },
            isSlim: function () {
                return _slim;
            },
            /*
             * Setting navigation sidebar footer
             */
            footerText: function (text) {
                if (text !== undefined) {
                    _footerText = text;

                    $rootScope.$broadcast('navigation::footerText', _footerText);
                }

                return _footerText;
            },

            /*
             * Buttons
             */
            leftButtons: function (/**Array=*/buttons) {
                _setButtons('left', buttons);

                return _buttons.left;
            },
            rightButtons: function (/**Array=*/buttons) {
                _setButtons('right', buttons);

                return _buttons.right;
            }
        }
    }];
}]);

var sdkInterfaceUiApp = angular.module('ag.sdk.interface.ui', []);

sdkInterfaceUiApp.directive('busy', [function() {
    return {
        restrict: 'A',
        template: '<button ng-click="onClick($event)" ng-disabled="disabled() || isBusy" ng-class="getBusyClass()">\n    <span ng-if="isBusy">\n        <span class="spinner"><i ng-show="icon" ng-class="icon"></i></span> {{ text }}\n    </span>\n    <span ng-if="!isBusy" ng-transclude></span>\n</button>',
        replace: true,
        transclude: true,
        scope: {
            busy: '&',
            busyIcon: '@',
            busyText: '@',
            busyClass: '@',
            busyDisabled: '&'
        },
        link: function(scope, element, attrs) {
            scope.isBusy = false;
            scope.icon = scope.busyIcon || 'glyphicon glyphicon-refresh';
            scope.text = (attrs.busyText !== undefined ? scope.busyText : 'Saving');
            scope.disabled = scope.busyDisabled || function () {
                return false;
            };

            scope.getBusyClass = function () {
                return (scope.isBusy && scope.icon ? 'has-spinner active' : '') + (scope.isBusy && scope.busyClass ? ' ' + scope.busyClass : '');
            };

            scope.onClick = function (event) {
                var pendingRequests = 0;
                var promise = scope.busy();

                event.preventDefault();
                event.stopPropagation();

                scope.isBusy = true;

                if (typeof promise === 'object' && typeof promise.finally === 'function') {
                    promise.finally(function () {
                        scope.isBusy = false;
                    });
                } else {
                    var deregister = scope.$on('http-intercepted', function (event, args) {
                        pendingRequests = (args == 'request' ? pendingRequests + 1 : pendingRequests - 1);
                        if (scope.isBusy && pendingRequests == 0) {
                            deregister();
                            scope.isBusy = false;
                        }
                    });
                }
            };
        }
    }
}]);

sdkInterfaceUiApp.directive('dynamicName', function() {
    return {
        restrict: 'A',
        require: '?form',
        link: function(scope, element, attrs, controller) {
            var formCtrl = (controller != null) ? controller :  element.parent().controller('form');
            var currentElementCtrl = formCtrl[element.attr('name')];

            if (formCtrl && currentElementCtrl) {
                element.attr('name', attrs.name);
                formCtrl.$removeControl(currentElementCtrl);
                currentElementCtrl.$name = attrs.name;
                formCtrl.$addControl(currentElementCtrl);
            }
        }
    }
});

sdkInterfaceUiApp.directive('defaultSrc', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('error', function() {
                element.attr("src", attrs.defaultSrc);
            });
        }
    };
}]);

sdkInterfaceUiApp.filter('location', ['$filter', function ($filter) {
    return function (value, abs) {
        var geometry = value && value.geometry || value,
            coords = (geometry && geometry.coordinates ? {lng: geometry.coordinates[0], lat: geometry.coordinates[1]} : geometry);

        return ((coords ? ($filter('number')(abs ? Math.abs(coords.lat) : coords.lng, 3) + (abs ? '° ' + (coords.lat >= 0 ? 'N' : 'S') : '') + ', '
        + $filter('number')(abs ? Math.abs(coords.lng) : coords.lat, 3) + (abs ? '° ' + (coords.lng <= 0 ? 'W' : 'E') : '')) : '')
        + (value && value.properties && value.properties.accuracy ? ' at ' + $filter('number')(value.properties.accuracy, 2) + 'm' : ''));
    };
}]);

sdkInterfaceUiApp.filter('floor', ['$filter', function ($filter) {
    return function (value) {
        return $filter('number')(Math.floor(value), 0);
    };
}]);

sdkInterfaceUiApp.filter('htmlEncode', [function () {
    return function (text) {
        return (text || '').replace(/[\u00A0-\u9999<>&'"]/gim, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }
}]);

sdkInterfaceUiApp.filter('newlines', ['$filter', '$sce', function ($filter, $sce) {
    return function(msg, isXHTML) {
        return $sce.trustAsHtml($filter('htmlEncode')(msg).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ (isXHTML === undefined || isXHTML ? '<br />' : '<br>') +'$2'));
    }
}]);

sdkInterfaceUiApp.filter('unsafe', ['$sce', function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    }
}]);

sdkInterfaceUiApp.directive('locationFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                var viewValue = '';
                if (value !== undefined) {
                    viewValue = $filter('location')(value, (attrs.locationFormatter === 'true'));

                    if (attrs.ngChange) {
                        scope.$eval(attrs.ngChange);
                    }
                }

                return viewValue;
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('dateFormatter', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$formatters.push(function (value) {
                return (value !== undefined ? $filter('date')(new Date(value), attrs['dateFormat'] || 'yyyy-MM-dd') : '');
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('dateParser', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return (value !== undefined ? $filter('date')(new Date(value), attrs['dateFormat'] || 'yyyy-MM-dd') : '');
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('inputNumber', ['$filter', function ($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var _max = (attrs.max ? parseFloat(attrs.max) : false);
            var _min = (attrs.min ? parseFloat(attrs.min) : false);
            var _round = (attrs.round ? parseInt(attrs.round) : false);

            ngModel.$formatters.push(function (value) {
                return (_round === false ? value : $filter('number')(value, _round));
            });

            ngModel.$parsers.push(function (value) {
                var isNan = isNaN(value) || isNaN(parseFloat(value));

                ngModel.$setValidity('number', isNan === false);

                if (isNan === false) {
                    var float = parseFloat(value);

                    ngModel.$setValidity('range', (_min === false || float >= _min) && (_max === false || float <= _max));
                    return float;
                } else {
                    return undefined;
                }
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('inputDate', ['moment', function (moment) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var format = attrs.dateFormat || 'YYYY-MM-DD';

            ngModel.$formatters.length = 0;
            ngModel.$parsers.length = 0;

            ngModel.$formatters.push(function (modelValue) {
                if (modelValue) {
                    return moment(modelValue).format(format);
                } else {
                    return modelValue;
                }
            });

            ngModel.$parsers.push(function (value) {
                if (value) {
                    var date = (typeof value == 'string' ? moment(value, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], true) : moment(value));

                    if (date && typeof date.isValid == 'function' && date.isValid()) {
                        ngModel.$setValidity('date-format', true);
                        return (typeof value == 'string' ? date.format('YYYY-MM-DD') : date);
                    } else {
                        ngModel.$setValidity('date-format', false);
                        return value;
                    }
                }
            });
        }
    };
}]);

sdkInterfaceUiApp.directive('sparkline', ['$window', 'underscore', function ($window, underscore) {
    return {
        restrict: 'A',
        template: '<div class="sparkline"></div>',
        replace: true,
        scope: {
            sparkline: '=',
            sparklineText: '='
        },
        link: function ($scope, $element, $attrs) {
            var d3 = $window.d3,
                element = $element[0],
                width = $attrs.width || element.clientWidth,
                xExtent = $attrs.xExtent,
                height = $attrs.height || element.clientHeight,
                yExtent = $attrs.yExtent || 100,
                interpolate = $attrs.interpolate || 'step-before',
                svg = d3.select(element).append('svg').attr('width', width).attr('height', height),
                text = svg.append('text').attr('class', 'sparkline-text').attr('x', width / 2).attr('y', (height / 2) + 5),
                area = svg.append('path').attr('class', 'sparkline-area'),
                line = svg.append('path').attr('class', 'sparkline-line');

            var xFn = d3.scale.linear().range([0, width]),
                yFn = d3.scale.linear().range([height, 0]);

            var areaFn = d3.svg.area()
                .interpolate(interpolate)
                .x(getDimension(xFn, 'x'))
                .y0(height)
                .y1(getDimension(yFn, 'y'));

            var lineFn = d3.svg.line()
                .interpolate(interpolate)
                .x(getDimension(xFn, 'x'))
                .y(getDimension(yFn, 'y'));

            $scope.$watchCollection('sparkline', function () {
                renderChart();
            });

            $scope.$watch('sparklineText', function () {
                text.text(function () {
                    return $scope.sparklineText;
                });
            });

            function getDimension (fn, field) {
                return function (d) {
                    return fn(d[field]);
                }
            }

            function renderChart () {
                $scope.data = underscore.map($scope.sparkline, function (data) {
                    return (underscore.isArray(data) ? {
                        x: (underscore.isNumber(data[0]) ? data[0] : 0),
                        y: (underscore.isNumber(data[1]) ? data[1] : 0)
                    } : {
                        x: (underscore.isNumber(data.x) ? data.x : 0),
                        y: (underscore.isNumber(data.y) ? data.y : 0)
                    });
                });

                // Pad first element
                $scope.data.unshift({x: -1, y: underscore.first($scope.data).y});

                xFn.domain(xExtent && xExtent != 0 ? [0, xExtent] : d3.extent($scope.data, function (d) {
                    return d.x;
                }));

                yFn.domain(yExtent && yExtent != 0 ? [0, yExtent] : [0, d3.max($scope.data, function (d) {
                    return d.y;
                })]);

                area.attr('d', areaFn($scope.data));
                line.attr('d', lineFn($scope.data));
            }
        }
    }
}]);

var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.field', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('AssetBase', ['Base', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Base, computedProperty, inheritModel, Liability, Model, moment, privateProperty, readOnlyProperty, safeMath, underscore) {
        function AssetBase (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = generateKey(this, legalEntity, farm);

                return this.assetKey;
            });

            computedProperty(this, 'hasGeometry', function () {
                return !underscore.isUndefined(this.data.loc);
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilities, function (total, liability) {
                    return safeMath.plus(total, liability.totalLiabilityInRange(rangeStart, rangeEnd));
                }, 0);
            });

            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'attachments', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assetKey = attrs.assetKey;
            this.legalEntityId = attrs.legalEntityId;
            this.type = attrs.type;

            this.liabilities = underscore.map(attrs.liabilities, Liability.newCopy);
        }

        function generateKey (instance, legalEntity, farm) {
            return  (legalEntity ? 'entity.' + legalEntity.uuid : '') +
                (instance.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (instance.data.fieldName ? '-fi.' + instance.data.fieldName : '') +
                (instance.data.crop ? '-c.' + instance.data.crop : '') +
                (instance.type === 'crop' && instance.data.plantedDate ? '-pd.' + moment(instance.data.plantedDate).format('YYYY-MM-DD') : '') +
                (underscore.contains(['permanent crop', 'plantation'], instance.type) && instance.data.establishedDate ? '-ed.' + moment(instance.data.establishedDate).format('YYYY-MM-DD') : '') +
                (instance.type === 'cropland' && instance.data.irrigated ? '-i.' + instance.data.irrigation : '') +
                (instance.type === 'farmland' && instance.data.sgKey ? '-' + instance.data.sgKey : '') +
                (underscore.contains(['improvement', 'livestock', 'vme'], instance.type) ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.name ? '-n.' + instance.data.name : '') +
                    (instance.data.purpose ? '-p.' + instance.data.purpose : '') +
                    (instance.data.model ? '-m.' + instance.data.model : '') +
                    (instance.data.identificationNo ? '-in.' + instance.data.identificationNo : '') : '') +
                (instance.type === 'stock' ?
                    (instance.data.type ? '-t.' + instance.data.type : '') +
                    (instance.data.category ? '-c.' + instance.data.category : '') +
                    (instance.data.product ? '-pr.' + instance.data.product : '') : '') +
                (instance.data.waterSource ? '-ws.' + instance.data.waterSource : '') +
                (instance.type === 'other' ? (instance.data.name ? '-n.' + instance.data.name : '') : '');
        }

        inheritModel(AssetBase, Model.Base);

        readOnlyProperty(AssetBase, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'stock': 'Stock',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Homestead & Wasteland',
            'water right': 'Water Rights'
        });

        readOnlyProperty(AssetBase, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, AssetBase.assetTypes));

        privateProperty(AssetBase, 'getAssetKey', function (asset, legalEntity, farm) {
            return generateKey(asset, legalEntity, farm);
        });

        privateProperty(AssetBase, 'getTypeTitle', function (type) {
            return AssetBase.assetTypes[type] || '';
        });

        privateProperty(AssetBase, 'getTitleType', function (title) {
            var keys = underscore.keys(AssetBase.assetTypes);

            return keys[underscore.values(AssetBase.assetTypes).indexOf(title)];
        });

        AssetBase.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(AssetBase.assetTypesWithOther)
                }
            }
        });

        return AssetBase;
    }]);

sdkModelAsset.factory('AssetGroup', ['Asset', 'AssetFactory', 'computedProperty', 'inheritModel', 'Model', 'privateProperty', 'safeMath', 'underscore',
    function (Asset, AssetFactory, computedProperty, inheritModel, Model, privateProperty, safeMath, underscore) {
        function AssetGroup (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            this.assets = [];

            privateProperty(this, 'addAsset', function (asset) {
                addAsset(this, asset);
            });

            privateProperty(this, 'adjustProperty', function (property, value) {
                adjustProperty(this, property, value);
            });

            privateProperty(this, 'availableCrops', function (field) {
                return (field && field.landUse ? Asset.cropsByLandClass[field.landUse] : Asset.cropsByType[this.type]) || [];
            });

            computedProperty(this, 'hasGeometry', function () {
                return underscore.some(this.assets, function (asset) {
                    return !underscore.isUndefined(asset.data.loc);
                });
            });

            privateProperty(this, 'recalculate', function () {
                recalculate(this);
            });

            underscore.each(attrs.assets, this.addAsset, this);
        }

        inheritModel(AssetGroup, Model.Base);

        var commonProps = ['areaUnit', 'unitValue'];

        var dataProps = {
            'crop': ['crop', 'irrigated', 'irrigation'],
            'cropland': ['crop', 'croppingPotential', 'irrigated', 'irrigation'],
            'improvement': ['category', 'type'],
            'pasture': ['condition', 'crop', 'grazingCapacity', 'irrigated', 'irrigation', 'terrain'],
            'permanent crop': ['condition', 'crop', 'establishedDate', 'establishedYear', 'irrigated', 'irrigation'],
            'plantation': ['condition', 'crop', 'establishedDate', 'establishedYear', 'irrigated', 'irrigation'],
            'water right': ['waterSource']
        };

        function addAsset (instance, asset) {
            asset = (AssetFactory.isInstanceOf(asset) ? asset : AssetFactory.new(asset));

            if (underscore.isUndefined(instance.type) || instance.type === asset.type) {
                instance.type = asset.type;
                instance.assets = underscore.chain(instance.assets)
                    .reject(function (item) {
                        return item.assetKey === asset.assetKey;
                    })
                    .union([asset])
                    .value();

                underscore.each(commonProps, setPropFromAsset(instance, asset));
                underscore.each(dataProps[instance.type], setPropFromAsset(instance, asset));

                instance.recalculate();
            }
        }

        function setPropFromAsset (instance, asset) {
            return function (prop) {
                if (!underscore.isUndefined(asset.data[prop])) {
                    instance.data[prop] = asset.data[prop];
                }
            }
        }

        function adjustProperty (instance, property, value) {
            underscore.each(instance.assets, function (asset) {
                if (asset.data[property] !== instance.data[property]) {
                    asset.data[property] = instance.data[property];
                    asset.data.assetValue = safeMath.times(asset.data.unitValue, asset.data.size);
                    asset.$dirty = true;
                }
            });
        }

        function recalculate (instance) {
            instance.data = underscore.extend(instance.data, underscore.reduce(instance.assets, function (totals, asset) {
                totals.size = safeMath.plus(totals.size, asset.data.size);
                totals.assetValue = safeMath.plus(totals.assetValue, (asset.data.assetValue ? asset.data.assetValue : safeMath.times(asset.data.unitValue, asset.data.size)));
                totals.unitValue = (totals.size > 0 ? safeMath.dividedBy(totals.assetValue, totals.size) : totals.unitValue || asset.data.unitValue || 0);

                return totals;
            }, {}));

            instance.data.assetValue = (instance.data.size && instance.data.unitValue ?
                safeMath.times(instance.data.unitValue, instance.data.size) :
                instance.data.assetValue);
        }

        return AssetGroup;
    }]);

sdkModelAsset.factory('Asset', ['AssetBase', 'attachmentHelper', 'Base', 'computedProperty', 'Field', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, attachmentHelper, Base, computedProperty, Field, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function Asset (attrs) {
            AssetBase.apply(this, arguments);

            privateProperty(this, 'generateUniqueName', function (categoryLabel, assets) {
                this.data.name = generateUniqueName(this, categoryLabel, assets);
            });

            privateProperty(this, 'getAge', function (asOfDate) {
                return (this.data.establishedDate ? moment(asOfDate).diff(this.data.establishedDate, 'years', true) : 0);
            });

            privateProperty(this, 'getCategories', function () {
                return Asset.categories[this.type] || [];
            });

            privateProperty(this, 'getCustomTitle', function (props, options) {
                return getCustomTitle(this, props, options);
            });

            privateProperty(this, 'getTitle', function (withField, farm) {
                return getTitle(this, withField, farm);
            });

            privateProperty(this, 'isFieldApplicable', function (field) {
                return isFieldApplicable(this, field);
            });

            privateProperty(this, 'clean', function () {
                if (this.type === 'vme') {
                    this.data.quantity = (this.data.identificationNo && this.data.identificationNo.length > 0 ? 1 : this.data.quantity);
                    this.data.identificationNo = (this.data.quantity !== 1 ? '' : this.data.identificationNo);
                } else if (this.type === 'cropland') {
                    this.data.equipped = (this.data.irrigated ? this.data.equipped : false);
                }
            });

            computedProperty(this, 'thumbnailUrl', function () {
                return getThumbnailUrl(this);
            });

            computedProperty(this, 'age', function () {
                return (this.data.establishedDate ? moment().diff(this.data.establishedDate, 'years', true) : 0);
            });

            computedProperty(this, 'title', function () {
                return getTitle(this, true);
            });

            computedProperty(this, 'description', function () {
                return this.data.description || '';
            });

            computedProperty(this, 'fieldName', function () {
                return this.data.fieldName;
            });

            computedProperty(this, 'size', function () {
                return (this.type !== 'farmland' ? this.data.size : this.data.area);
            });

            computedProperty(this, 'farmRequired', function () {
                return farmRequired(this);
            });

            privateProperty(this, 'unitSize', function (unit) {
                return convertValue(this, unit, (this.type !== 'farmland' ? 'size' : 'area'));
            });

            privateProperty(this, 'unitValue', function (unit) {
                return (this.data.valuePerHa ?
                    convertUnitValue(this, unit, 'ha', 'valuePerHa') :
                    convertValue(this, unit, 'unitValue'));
            });

            // Crop
            privateProperty(this, 'availableCrops', function (field) {
                return (field && field.landUse ? Asset.cropsByLandClass[field.landUse] : Asset.cropsByType[this.type]) || [];
            });

            computedProperty(this, 'crop', function () {
                return this.data.crop;
            });

            computedProperty(this, 'establishedDate', function () {
                return this.data.establishedDate;
            });

            computedProperty(this, 'plantedDate', function () {
                return this.data.plantedDate;
            });

            // Value / Liability
            computedProperty(this, 'liquidityTypeTitle', function () {
                return (this.data.liquidityType && this.assetTypes[this.data.liquidityType]) || '';
            });

            privateProperty(this, 'incomeInRange', function (rangeStart, rangeEnd) {
                var income = {};

                if (this.data.sold === true && this.data.salePrice && moment(this.data.soldDate, 'YYYY-MM-DD').isBetween(rangeStart, rangeEnd)) {
                    income['Sales'] = this.data.salePrice;
                }

                return income;
            });

            privateProperty(this, 'totalIncomeInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.incomeInRange(rangeStart, rangeEnd), function (total, value) {
                    return safeMath.plus(total, value);
                }, 0);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.farmId = attrs.farmId;

            if (!this.data.valuePerHa && this.data.assetValue && this.size) {
                this.data.valuePerHa = safeMath.dividedBy(this.data.assetValue, this.size);
                this.$dirty = true;
            }

            if (!this.data.unitValue && this.data.valuePerHa) {
                this.data.unitValue = this.data.valuePerHa;
                this.data.areaUnit = 'ha';
                this.$dirty = true;
            }
        }

        var unitConversions = {
            'sm/ha': function (value) {
                return safeMath.dividedBy(value, 10000);
            },
            'ha/sm': function (value) {
                return safeMath.times(value, 10000);
            }
        };

        function convertValue (instance, toUnit, prop) {
            var unit = instance.data.areaUnit || 'ha';

            return convertUnitValue(instance, toUnit, unit, prop);
        }

        function convertUnitValue (instance, toUnit, unit, prop) {
            var unitConversion = unitConversions[unit + '/' + toUnit],
                value = instance.data[prop];

            return (unit === toUnit ? value : unitConversion && unitConversion(value));
        }

        inheritModel(Asset, AssetBase);

        function categoryMapper (keys) {
            return function (items) {
                return underscore.object(underscore.first(keys, items.length), items);
            }
        }

        readOnlyProperty(Asset, 'categories', {
            improvement: underscore.map([
                ['Airport', 'Hangar'],
                ['Airport', 'Helipad'],
                ['Airport', 'Runway'],
                ['Poultry', 'Hatchery'],
                ['Aquaculture', 'Pond'],
                ['Aquaculture', 'Net House'],
                ['Aviary'],
                ['Beekeeping'],
                ['Borehole'],
                ['Borehole', 'Equipped'],
                ['Borehole', 'Pump'],
                ['Borehole', 'Windmill'],
                ['Poultry', 'Broiler House'],
                ['Poultry', 'Broiler House - Atmosphere'],
                ['Poultry', 'Broiler House - Semi'],
                ['Poultry', 'Broiler House - Zinc'],
                ['Building', 'Administrative'],
                ['Building'],
                ['Building', 'Commercial'],
                ['Building', 'Entrance'],
                ['Building', 'Lean-to'],
                ['Building', 'Outbuilding'],
                ['Building', 'Gate'],
                ['Cold Storage'],
                ['Commercial', 'Coffee Shop'],
                ['Commercial', 'Sales Facility'],
                ['Commercial', 'Shop'],
                ['Commercial', 'Bar'],
                ['Commercial', 'Café'],
                ['Commercial', 'Restaurant'],
                ['Commercial', 'Factory'],
                ['Commercial', 'Tasting Facility'],
                ['Commercial', 'Cloth House'],
                ['Compost', 'Preparing Unit'],
                ['Crocodile Dam'],
                ['Crop Processing', 'Degreening Room'],
                ['Crop Processing', 'Dehusking Facility'],
                ['Crop Processing', 'Drying Facility'],
                ['Crop Processing', 'Drying Tunnels'],
                ['Crop Processing', 'Sorting Facility'],
                ['Crop Processing', 'Drying Oven'],
                ['Crop Processing', 'Drying Racks'],
                ['Crop Processing', 'Crushing Plant'],
                ['Crop Processing', 'Nut Cracking Facility'],
                ['Crop Processing', 'Nut Factory'],
                ['Dairy'],
                ['Dairy', 'Pasteurising Facility'],
                ['Dairy', 'Milking Parlour'],
                ['Dam'],
                ['Dam', 'Filter'],
                ['Dam', 'Trout'],
                ['Domestic', 'Chicken Coop'],
                ['Domestic', 'Chicken Run'],
                ['Domestic', 'Kennels'],
                ['Domestic', 'Gardening Facility'],
                ['Education', 'Conference Room'],
                ['Education', 'Classroom'],
                ['Education', 'Crèche'],
                ['Education', 'School'],
                ['Education', 'Training Facility'],
                ['Equipment', 'Air Conditioner'],
                ['Equipment', 'Gantry'],
                ['Equipment', 'Oven'],
                ['Equipment', 'Pump'],
                ['Equipment', 'Pumphouse'],
                ['Equipment', 'Scale'],
                ['Feed Mill'],
                ['Feedlot'],
                ['Fencing'],
                ['Fencing', 'Electric'],
                ['Fencing', 'Game'],
                ['Fencing', 'Perimeter'],
                ['Fencing', 'Security'],
                ['Fencing', 'Wire'],
                ['Fuel', 'Tanks'],
                ['Fuel', 'Tank Stand'],
                ['Fuel', 'Fuelling Facility'],
                ['Grain Mill'],
                ['Greenhouse'],
                ['Infrastructure'],
                ['Irrigation', 'Sprinklers'],
                ['Irrigation'],
                ['Laboratory'],
                ['Livestock Handling', 'Auction Facility'],
                ['Livestock Handling', 'Cages'],
                ['Livestock Handling', 'Growing House'],
                ['Livestock Handling', 'Pens'],
                ['Livestock Handling', 'Shelter'],
                ['Livestock Handling', 'Breeding Facility'],
                ['Livestock Handling', 'Culling Shed'],
                ['Livestock Handling', 'Dipping Facility'],
                ['Livestock Handling', 'Elephant Enclosures'],
                ['Livestock Handling', 'Feed Troughs/Dispensers'],
                ['Livestock Handling', 'Horse Walker'],
                ['Livestock Handling', 'Maternity Shelter/Pen'],
                ['Livestock Handling', 'Quarantine Area'],
                ['Livestock Handling', 'Rehab Facility'],
                ['Livestock Handling', 'Shearing Facility'],
                ['Livestock Handling', 'Stable'],
                ['Livestock Handling', 'Surgery'],
                ['Livestock Handling', 'Treatment Area'],
                ['Livestock Handling', 'Weaner House'],
                ['Livestock Handling', 'Grading Facility'],
                ['Livestock Handling', 'Inspection Facility'],
                ['Logistics', 'Handling Equipment'],
                ['Logistics', 'Handling Facility'],
                ['Logistics', 'Depot'],
                ['Logistics', 'Loading Area'],
                ['Logistics', 'Loading Shed'],
                ['Logistics', 'Hopper'],
                ['Logistics', 'Weigh Bridge'],
                ['Meat Processing', 'Abattoir'],
                ['Meat Processing', 'Deboning Room'],
                ['Meat Processing', 'Skinning Facility'],
                ['Mill'],
                ['Mushrooms', 'Cultivation'],
                ['Mushrooms', 'Sweat Room'],
                ['Nursery ', 'Plant'],
                ['Nursery ', 'Plant Growing Facility'],
                ['Office'],
                ['Packaging Facility'],
                ['Paddocks', 'Camp'],
                ['Paddocks', 'Kraal'],
                ['Paddocks'],
                ['Piggery', 'Farrowing House'],
                ['Piggery', 'Pig Sty'],
                ['Processing', 'Bottling Facility'],
                ['Processing', 'Flavour Shed'],
                ['Processing', 'Processing Facility'],
                ['Recreation', 'Viewing Area'],
                ['Recreation', 'BBQ'],
                ['Recreation', 'Clubhouse'],
                ['Recreation', 'Event Venue'],
                ['Recreation', 'Gallery'],
                ['Recreation', 'Game Room'],
                ['Recreation', 'Gazebo'],
                ['Recreation', 'Gymnasium'],
                ['Recreation', 'Jacuzzi'],
                ['Recreation', 'Judging Booth'],
                ['Recreation', 'Museum'],
                ['Recreation', 'Play Area'],
                ['Recreation', 'Pool House'],
                ['Recreation', 'Pottery Room'],
                ['Recreation', 'Racing Track'],
                ['Recreation', 'Salon'],
                ['Recreation', 'Sauna'],
                ['Recreation', 'Shooting Range'],
                ['Recreation', 'Spa Facility'],
                ['Recreation', 'Squash Court'],
                ['Recreation', 'Swimming Pool'],
                ['Recreation'],
                ['Religious', 'Church'],
                ['Residential', 'Carport'],
                ['Residential', 'Driveway'],
                ['Residential', 'Flooring'],
                ['Residential', 'Paving'],
                ['Residential', 'Roofing'],
                ['Residential', 'Water Feature'],
                ['Residential', 'Hall'],
                ['Residential', 'Balcony'],
                ['Residential', 'Canopy'],
                ['Residential', 'Concrete Surface'],
                ['Residential', 'Courtyard'],
                ['Residential', 'Covered'],
                ['Residential', 'Deck'],
                ['Residential', 'Mezzanine'],
                ['Residential', 'Parking Area'],
                ['Residential', 'Patio'],
                ['Residential', 'Porch'],
                ['Residential', 'Porte Cochere'],
                ['Residential', 'Terrace'],
                ['Residential', 'Veranda'],
                ['Residential', 'Walkways'],
                ['Residential', 'Rondavel'],
                ['Residential', 'Accommodation Units'],
                ['Residential', 'Boma'],
                ['Residential', 'Bungalow'],
                ['Residential', 'Bunker'],
                ['Residential', 'Cabin'],
                ['Residential', 'Chalet'],
                ['Residential', 'Community Centre'],
                ['Residential', 'Dormitory'],
                ['Residential', 'Dwelling'],
                ['Residential', 'Flat'],
                ['Residential', 'Kitchen'],
                ['Residential', 'Lapa'],
                ['Residential', 'Laundry Facility'],
                ['Residential', 'Locker Room'],
                ['Residential', 'Lodge'],
                ['Residential', 'Shower'],
                ['Residential', 'Toilets'],
                ['Residential', 'Room'],
                ['Residential', 'Cottage'],
                ['Residential', 'Garage'],
                ['Roads', 'Access Roads'],
                ['Roads', 'Gravel'],
                ['Roads', 'Tarred'],
                ['Security', 'Control Room'],
                ['Security', 'Guardhouse'],
                ['Security', 'Office'],
                ['Shade Nets'],
                ['Silo'],
                ['Sports', 'Arena'],
                ['Sports', 'Tennis Court'],
                ['Staff', 'Hostel'],
                ['Staff', 'Hut'],
                ['Staff', 'Retirement Centre'],
                ['Staff', 'Staff Building'],
                ['Staff', 'Canteen'],
                ['Staff', 'Dining Facility'],
                ['Storage', 'Truck Shelter'],
                ['Storage', 'Barn'],
                ['Storage', 'Dark Room'],
                ['Storage', 'Bin Compartments'],
                ['Storage', 'Machinery'],
                ['Storage', 'Saddle Room'],
                ['Storage', 'Shed'],
                ['Storage', 'Chemicals'],
                ['Storage', 'Tools'],
                ['Storage', 'Dry'],
                ['Storage', 'Equipment'],
                ['Storage', 'Feed'],
                ['Storage', 'Fertilizer'],
                ['Storage', 'Fuel'],
                ['Storage', 'Grain'],
                ['Storage', 'Hides'],
                ['Storage', 'Oil'],
                ['Storage', 'Pesticide'],
                ['Storage', 'Poison'],
                ['Storage', 'Seed'],
                ['Storage', 'Zinc'],
                ['Storage', 'Sulphur'],
                ['Storage'],
                ['Storage', 'Vitamin Room'],
                ['Sugar Mill'],
                ['Tanks', 'Water'],
                ['Timber Mill'],
                ['Trench'],
                ['Utilities', 'Battery Room'],
                ['Utilities', 'Boiler Room'],
                ['Utilities', 'Compressor Room'],
                ['Utilities', 'Engine Room'],
                ['Utilities', 'Generator'],
                ['Utilities', 'Power Room'],
                ['Utilities', 'Pumphouse'],
                ['Utilities', 'Transformer Room'],
                ['Utilities'],
                ['Vacant Area'],
                ['Vehicles', 'Transport Depot'],
                ['Vehicles', 'Truck Wash'],
                ['Vehicles', 'Workshop'],
                ['Walls'],
                ['Walls', 'Boundary'],
                ['Walls', 'Retaining'],
                ['Walls', 'Security'],
                ['Warehouse'],
                ['Water', 'Reservoir'],
                ['Water', 'Tower'],
                ['Water', 'Purification Plant'],
                ['Water', 'Reticulation Works'],
                ['Water', 'Filter Station'],
                ['Wine Cellar', 'Tanks'],
                ['Wine Cellar'],
                ['Wine Cellar', 'Winery'],
                ['Wine Cellar', 'Barrel Maturation Room']
            ], categoryMapper(['category', 'subCategory'])),
            livestock: underscore.map([
                ['Cattle', 'Phase A Bulls', 'Breeding'],
                ['Cattle', 'Phase B Bulls', 'Breeding'],
                ['Cattle', 'Phase C Bulls', 'Breeding'],
                ['Cattle', 'Phase D Bulls', 'Breeding'],
                ['Cattle', 'Heifers', 'Breeding'],
                ['Cattle', 'Bull Calves', 'Breeding'],
                ['Cattle', 'Heifer Calves', 'Breeding'],
                ['Cattle', 'Tollies 1-2', 'Breeding'],
                ['Cattle', 'Heifers 1-2', 'Breeding'],
                ['Cattle', 'Culls', 'Breeding'],
                ['Cattle', 'Bulls', 'Dairy'],
                ['Cattle', 'Dry Cows', 'Dairy'],
                ['Cattle', 'Lactating Cows', 'Dairy'],
                ['Cattle', 'Heifers', 'Dairy'],
                ['Cattle', 'Calves', 'Dairy'],
                ['Cattle', 'Culls', 'Dairy'],
                ['Cattle', 'Bulls', 'Slaughter'],
                ['Cattle', 'Cows', 'Slaughter'],
                ['Cattle', 'Heifers', 'Slaughter'],
                ['Cattle', 'Weaners', 'Slaughter'],
                ['Cattle', 'Calves', 'Slaughter'],
                ['Cattle', 'Culls', 'Slaughter'],
                ['Chickens', 'Day Old Chicks', 'Broilers'],
                ['Chickens', 'Broilers', 'Broilers'],
                ['Chickens', 'Hens', 'Layers'],
                ['Chickens', 'Point of Laying Hens', 'Layers'],
                ['Chickens', 'Culls', 'Layers'],
                ['Game', 'Game', 'Slaughter'],
                ['Goats', 'Rams', 'Slaughter'],
                ['Goats', 'Breeding Ewes', 'Slaughter'],
                ['Goats', 'Young Ewes', 'Slaughter'],
                ['Goats', 'Kids', 'Slaughter'],
                ['Horses', 'Horses', 'Breeding'],
                ['Pigs', 'Boars', 'Slaughter'],
                ['Pigs', 'Breeding Sows', 'Slaughter'],
                ['Pigs', 'Weaned pigs', 'Slaughter'],
                ['Pigs', 'Piglets', 'Slaughter'],
                ['Pigs', 'Porkers', 'Slaughter'],
                ['Pigs', 'Baconers', 'Slaughter'],
                ['Pigs', 'Culls', 'Slaughter'],
                ['Ostriches', 'Breeding Stock', 'Slaughter'],
                ['Ostriches', 'Slaughter Birds > 3 months', 'Slaughter'],
                ['Ostriches', 'Slaughter Birds < 3 months', 'Slaughter'],
                ['Ostriches', 'Chicks', 'Slaughter'],
                ['Rabbits', 'Rabbits', 'Slaughter'],
                ['Sheep', 'Rams', 'Breeding'],
                ['Sheep', 'Young Rams', 'Breeding'],
                ['Sheep', 'Ewes', 'Breeding'],
                ['Sheep', 'Young Ewes', 'Breeding'],
                ['Sheep', 'Lambs', 'Breeding'],
                ['Sheep', 'Wethers', 'Breeding'],
                ['Sheep', 'Culls', 'Breeding'],
                ['Sheep', 'Rams', 'Slaughter'],
                ['Sheep', 'Ewes', 'Slaughter'],
                ['Sheep', 'Lambs', 'Slaughter'],
                ['Sheep', 'Wethers', 'Slaughter'],
                ['Sheep', 'Culls', 'Slaughter']
            ], categoryMapper(['category', 'subCategory', 'purpose'])),
            stock: underscore.map([
                ['Animal Feed', 'Lick', 'kg'],
                ['Indirect Costs', 'Fuel', 'l'],
                ['Indirect Costs', 'Water', 'l'],
                ['Preharvest', 'Seed', 'kg'],
                ['Preharvest', 'Plant Material', 'each'],
                ['Preharvest', 'Fertiliser', 't'],
                ['Preharvest', 'Fungicides', 'l'],
                ['Preharvest', 'Lime', 't'],
                ['Preharvest', 'Herbicides', 'l'],
                ['Preharvest', 'Pesticides', 'l']
            ], categoryMapper(['category', 'subCategory', 'unit'])),
            vme: underscore.map([
                ['Vehicles', 'LDV'],
                ['Vehicles', 'LDV (Double Cab)'],
                ['Vehicles', 'LDV (4-Wheel)'],
                ['Vehicles', 'LDV (Double Cab 4-Wheel)'],
                ['Vehicles', 'Truck'],
                ['Vehicles', 'Truck (Double Differential)'],
                ['Vehicles', 'Truck (Horse)'],
                ['Vehicles', 'Truck (Semi-trailer)'],
                ['Vehicles', 'Truck (Timber Trailer)'],
                ['Vehicles', 'Truck (Cane Trailer)'],
                ['Machinery', 'Tractor'],
                ['Machinery', 'Tractor (4-Wheel)'],
                ['Machinery', 'Tractor (Orchard)'],
                ['Machinery', 'Tractor (Orchard, 4-Wheel)'],
                ['Machinery', 'Road Grader'],
                ['Machinery', 'Front-end Loader'],
                ['Machinery', 'Bulldozer'],
                ['Machinery', 'Forklift'],
                ['Machinery', 'Borehole Machine'],
                ['Machinery', 'Loader (Cane)'],
                ['Machinery', 'Loader (Timber)'],
                ['Machinery', 'Harvester (Maize Combine)'],
                ['Machinery', 'Harvester (Wheat Combine)'],
                ['Machinery', 'Electric Motor'],
                ['Machinery', 'Internal Combustion Engine'],
                ['Machinery', 'Irrigation Pump'],
                ['Machinery', 'Irrigation Pump (Electrical)'],
                ['Machinery', 'Irrigation Pump (Internal Combustion Engine) '],
                ['Equipment', 'Ripper'],
                ['Equipment', 'Ripper (Sugar Cane)'],
                ['Equipment', 'Ripper (Heavy Duty)'],
                ['Equipment', 'Ripper (Auto Reset)'],
                ['Equipment', 'Plough'],
                ['Equipment', 'Plough (Moldboard)'],
                ['Equipment', 'Plough (Disc)'],
                ['Equipment', 'Plough (Chisel)'],
                ['Equipment', 'Plough (Bulldog)'],
                ['Equipment', 'Harrow'],
                ['Equipment', 'Harrow (Offset Disc)'],
                ['Equipment', 'Harrow (Hydraulic Offset)'],
                ['Equipment', 'Harrow (Offset Trailer)'],
                ['Equipment', 'Harrow (Tandem Disc)'],
                ['Equipment', 'Harrow (Rotary)'],
                ['Equipment', 'Harrow (Power)'],
                ['Equipment', 'Ridger'],
                ['Equipment', 'Ridger (Disc)'],
                ['Equipment', 'Ridger (Shear)'],
                ['Equipment', 'Tiller'],
                ['Equipment', 'Tiller (S-Shank)'],
                ['Equipment', 'Tiller (C-Shank)'],
                ['Equipment', 'Tiller (Vibro-flex)'],
                ['Equipment', 'Tiller (Otma)'],
                ['Equipment', 'Cultivator'],
                ['Equipment', 'Cultivator (Shank Tiller)'],
                ['Equipment', 'Cultivator (Vibro Tiller)'],
                ['Equipment', 'Planter'],
                ['Equipment', 'Planter (Single Kernel)'],
                ['Equipment', 'Planter (Seed Drill)'],
                ['Equipment', 'Planter (Wheat)'],
                ['Equipment', 'Planter (Potato)'],
                ['Equipment', 'Vegetable Transplanter'],
                ['Equipment', 'Fine Seed Seeder'],
                ['Equipment', 'Land Roller'],
                ['Equipment', 'Spreader (Fertiliser)'],
                ['Equipment', 'Spreader (Manure)'],
                ['Equipment', 'Spreader (Lime)'],
                ['Equipment', 'Mist Blower'],
                ['Equipment', 'Boom Sprayer'],
                ['Equipment', 'Boom Sprayer (Mounted)'],
                ['Equipment', 'Boom Sprayer (Trailer)'],
                ['Equipment', 'Mower'],
                ['Equipment', 'Mower (Conditioner)'],
                ['Equipment', 'Slasher'],
                ['Equipment', 'Haymaker'],
                ['Equipment', 'Hay Rake'],
                ['Equipment', 'Hay Baler'],
                ['Equipment', 'Hay Baler (Square)'],
                ['Equipment', 'Hay Baler (Round)'],
                ['Equipment', 'Bale Handler'],
                ['Equipment', 'Bale Handler (Round)'],
                ['Equipment', 'Bale Handler (Wrapper)'],
                ['Equipment', 'Bale Handler (Shredder)'],
                ['Equipment', 'Harvester (Combine Trailer)'],
                ['Equipment', 'Harvester (Forage)'],
                ['Equipment', 'Harvester (Forage Chop)'],
                ['Equipment', 'Harvester (Forage Flail)'],
                ['Equipment', 'Harvester (Thresher)'],
                ['Equipment', 'Harvester (Potato Lifter)'],
                ['Equipment', 'Harvester (Potato Sorter)'],
                ['Equipment', 'Harvester (Groundnut Picker)'],
                ['Equipment', 'Harvester (Groundnut Sheller)'],
                ['Equipment', 'Harvester (Groundnut Lifter)'],
                ['Equipment', 'Hammer Mill'],
                ['Equipment', 'Feed Mixer'],
                ['Equipment', 'Roller Mill'],
                ['Equipment', 'Grain Pump'],
                ['Equipment', 'Grain Grader'],
                ['Equipment', 'Grain Drier'],
                ['Equipment', 'Grader (Rear Mounted)'],
                ['Equipment', 'Dam Scoop'],
                ['Equipment', 'Post Digger'],
                ['Equipment', 'Trailer'],
                ['Equipment', 'Trailer (Tip)'],
                ['Equipment', 'Trailer (4-Wheel)'],
                ['Equipment', 'Trailer (Water Cart)'],
                ['Equipment', 'Trailer (Cane)'],
                ['Equipment', 'Trailer (Cane Truck)'],
                ['Equipment', 'Trailer (Timber)'],
                ['Equipment', 'Trailer (Timber Truck)']
            ], categoryMapper(['category', 'subCategory']))
        });

        readOnlyProperty(Asset, 'landClassesByType', {
            'crop': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Vegetables'],
            'cropland': [
                'Cropland',
                'Cropland (Emerging)',
                'Cropland (Irrigated)',
                'Cropland (Smallholding)',
                'Vegetables'],
            'farmland': [],
            'improvement': [
                'Built-up',
                'Residential',
                'Structures (Handling)',
                'Structures (Processing)',
                'Structures (Retail)',
                'Structures (Storage)',
                'Utilities'
            ],
            'livestock': [
                'Grazing',
                'Grazing (Bush)',
                'Grazing (Fynbos)',
                'Grazing (Shrubland)',
                'Planted Pastures'],
            'pasture': [
                'Grazing',
                'Grazing (Bush)',
                'Grazing (Fynbos)',
                'Grazing (Shrubland)',
                'Planted Pastures'],
            'permanent crop': [
                'Greenhouses',
                'Orchard',
                'Orchard (Shadenet)',
                'Vineyard'],
            'plantation': [
                'Forest',
                'Pineapple',
                'Plantation',
                'Plantation (Smallholding)',
                'Sugarcane',
                'Sugarcane (Emerging)',
                'Sugarcane (Irrigated)',
                'Tea'],
            'vme': [],
            'wasteland': [
                'Non-vegetated',
                'Wasteland'],
            'water right': [
                'Water',
                'Water (Seasonal)',
                'Wetland']
        });

        var _croplandCrops = [
            'Barley',
            'Bean',
            'Bean (Broad)',
            'Bean (Dry)',
            'Bean (Sugar)',
            'Bean (Green)',
            'Bean (Kidney)',
            'Beet',
            'Broccoli',
            'Butternut',
            'Cabbage',
            'Canola',
            'Carrot',
            'Cassava',
            'Cauliflower',
            'Cotton',
            'Cowpea',
            'Grain Sorghum',
            'Groundnut',
            'Leek',
            'Lucerne',
            'Maize',
            'Maize (White)',
            'Maize (Yellow)',
            'Oats',
            'Onion',
            'Peanut',
            'Pearl Millet',
            'Potato',
            'Pumpkin',
            'Rapeseed',
            'Rice',
            'Rye',
            'Soya Bean',
            'Sunflower',
            'Sweet Corn',
            'Sweet Potato',
            'Teff',
            'Tobacco',
            'Triticale',
            'Turnip',
            'Wheat',
            'Wheat (Durum)'
        ];
        var _croplandIrrigatedCrops = [
            'Maize (Irrigated)',
            'Soya Bean (Irrigated)',
            'Teff (Irrigated)',
            'Wheat (Irrigated)'
        ];
        var _croplandAllCrops = underscore.union(_croplandCrops, _croplandIrrigatedCrops).sort(naturalSort);
        var _grazingCrops = [
            'Bahia-Notatum',
            'Birdsfoot Trefoil',
            'Bottle Brush',
            'Buffalo',
            'Buffalo (Blue)',
            'Buffalo (White)',
            'Bush',
            'Carribean Stylo',
            'Clover',
            'Clover (Arrow Leaf)',
            'Clover (Crimson)',
            'Clover (Persian)',
            'Clover (Red)',
            'Clover (Rose)',
            'Clover (Strawberry)',
            'Clover (Subterranean)',
            'Clover (White)',
            'Cocksfoot',
            'Common Setaria',
            'Dallis',
            'Eragrostis',
            'Kikuyu',
            'Lucerne',
            'Lupin',
            'Lupin (Narrow Leaf)',
            'Lupin (White)',
            'Lupin (Yellow)',
            'Medic',
            'Medic (Barrel)',
            'Medic (Burr)',
            'Medic (Gama)',
            'Medic (Snail)',
            'Medic (Strand)',
            'Multispecies Pasture',
            'Phalaris',
            'Rescue',
            'Rhodes',
            'Russian Grass',
            'Ryegrass',
            'Ryegrass (Hybrid)',
            'Ryegrass (Italian)',
            'Ryegrass (Westerwolds)',
            'Serradella',
            'Serradella (Yellow)',
            'Silver Leaf Desmodium',
            'Smuts Finger',
            'Soutbos',
            'Tall Fescue',
            'Teff',
            'Veld',
            'Weeping Lovegrass'
        ];
        var _perennialCrops = [
            'Almond',
            'Apple',
            'Apricot',
            'Avocado',
            'Banana',
            'Barberry',
            'Berry',
            'Bilberry',
            'Blackberry',
            'Blueberry',
            'Cherry',
            'Citrus',
            'Cloudberry',
            'Coconut',
            'Coffee',
            'Date',
            'Fig',
            'Gooseberry',
            'Grapefruit',
            'Guava',
            'Hazelnut',
            'Kiwi Fruit',
            'Kumquat',
            'Lemon',
            'Lime',
            'Litchi',
            'Macadamia Nut',
            'Mandarin',
            'Mango',
            'Mulberry',
            'Nectarine',
            'Olive',
            'Orange',
            'Papaya',
            'Peach',
            'Pear',
            'Prickly Pear',
            'Pecan Nut',
            'Persimmon',
            'Pistachio Nut',
            'Plum',
            'Pomegranate',
            'Protea',
            'Prune',
            'Raspberry',
            'Rooibos',
            'Roses',
            'Strawberry',
            'Walnut',
            'Wineberry'
        ];
        var _plantationCrops = [
            'Aloe',
            'Bluegum',
            'Eucalyptus',
            'Hops',
            'Pine',
            'Pineapple',
            'Tea',
            'Timber',
            'Sisal',
            'Sugarcane',
            'Sugarcane (Irrigated)',
            'Wattle'
        ];
        var _vegetableCrops = [
            'Chicory',
            'Chili',
            'Garlic',
            'Lentil',
            'Melon',
            'Olive',
            'Onion',
            'Pea',
            'Pumpkin',
            'Quince',
            'Strawberry',
            'Tomato',
            'Watermelon',
            'Carrot',
            'Beet',
            'Cauliflower',
            'Broccoli',
            'Leek',
            'Butternut',
            'Cabbage',
            'Rapeseed'
        ];
        var _vineyardCrops = [
            'Currant',
            'Grape',
            'Grape (Bush Vine)',
            'Grape (Red)',
            'Grape (Table)',
            'Grape (White)',
            'Raisin'
        ];

        readOnlyProperty(Asset, 'cropsByLandClass', {
            'Cropland': _croplandCrops,
            'Cropland (Emerging)': _croplandCrops,
            'Cropland (Irrigated)': _croplandIrrigatedCrops,
            'Cropland (Smallholding)': _croplandCrops,
            'Forest': ['Pine', 'Timber'],
            'Grazing': _grazingCrops,
            'Grazing (Bush)': ['Bush'],
            'Grazing (Fynbos)': _grazingCrops,
            'Grazing (Shrubland)': _grazingCrops,
            'Greenhouses': [],
            'Orchard': _perennialCrops,
            'Orchard (Shadenet)': _perennialCrops,
            'Pineapple': ['Pineapple'],
            'Plantation': _plantationCrops,
            'Plantation (Smallholding)': _plantationCrops,
            'Planted Pastures': _grazingCrops,
            'Sugarcane': ['Sugarcane'],
            'Sugarcane (Emerging)': ['Sugarcane'],
            'Sugarcane (Irrigated)': ['Sugarcane (Irrigated)'],
            'Tea': ['Tea'],
            'Vegetables': _vegetableCrops,
            'Vineyard': _vineyardCrops
        });

        readOnlyProperty(Asset, 'cropsByType', {
            'crop': _croplandAllCrops,
            'cropland': _croplandAllCrops,
            'livestock': _grazingCrops,
            'pasture': _grazingCrops,
            'permanent crop': underscore.union(_perennialCrops, _vineyardCrops),
            'plantation': _plantationCrops
        });

        readOnlyProperty(Asset, 'liquidityTypes', {
            'long-term': 'Long-term',
            'medium-term': 'Movable',
            'short-term': 'Current'
        });

        readOnlyProperty(Asset, 'liquidityCategories', {
            'long-term': ['Fixed Improvements', 'Investments', 'Land', 'Other'],
            'medium-term': ['Breeding Stock', 'Vehicles, Machinery & Equipment', 'Other'],
            'short-term': ['Crops & Crop Products', 'Cash on Hand', 'Debtors', 'Short-term Investments', 'Prepaid Expenses', 'Production Inputs', 'Life Insurance', 'Livestock Products', 'Marketable Livestock', 'Negotiable Securities', 'Other']
        });

        readOnlyProperty(Asset, 'conditions', ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor']);

        readOnlyProperty(Asset, 'seasons', ['Cape', 'Summer', 'Fruit', 'Winter']);

        privateProperty(Asset, 'farmRequired', function (type) {
            return farmRequired(type)
        });

        privateProperty(Asset, 'getCropsByLandClass', function (landClass) {
            return Asset.cropsByLandClass[landClass] || [];
        });

        privateProperty(Asset, 'getDefaultCrop', function (landClass) {
            return (underscore.size(Asset.cropsByLandClass[landClass]) === 1 ? underscore.first(Asset.cropsByLandClass[landClass]) : undefined);
        });

        privateProperty(Asset, 'getCustomTitle', function (asset, props, options) {
            return getCustomTitle(asset, props, options);
        });

        privateProperty(Asset, 'getThumbnailUrl', function (asset) {
            return getThumbnailUrl(asset);
        });

        privateProperty(Asset, 'getTitle', function (asset, withField, farm) {
            return getTitle(asset, withField, farm);
        });

        privateProperty(Asset, 'listServiceMap', function (asset, metadata) {
            return listServiceMap(asset, metadata);
        });

        function getDefaultProps (instance) {
            switch (instance.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return ['plantedArea', 'crop', 'fieldName', 'farmName'];
                case 'farmland':
                    return [['label', 'portionLabel', 'portionNumber']];
                case 'cropland':
                    return ['typeTitle', function (instance) {
                        return (instance.data.irrigation ?
                            instance.data.irrigation + ' irrigated' :
                            (instance.data.irrigated ?
                                'Irrigated (' + (instance.data.equipped ? 'equipped' : 'unequipped') + ')':
                                'Non irrigable'))
                    }, 'waterSource', 'fieldName', 'farmName'];
                case 'livestock':
                    return ['type', 'category'];
                case 'pasture':
                    return [function (instance) {
                        return (instance.data.intensified ?
                            (instance.data.crop ? instance.data.crop + ' intensified ' : 'Intensified ') + instance.type :
                            'Natural Grazing');
                    }, 'fieldName', 'farmName'];
                case 'stock':
                    return ['category'];
                case 'vme':
                    return ['category', 'model'];
                case 'wasteland':
                    return ['typeTitle'];
                case 'water source':
                case 'water right':
                    return ['waterSource', 'fieldName', 'farmName'];
                default:
                    return [['name', 'category', 'typeTitle']];
            }
        }

        function getProps (instance, props, options) {
            return underscore.chain(props)
                .map(function (prop) {
                    if (underscore.isArray(prop)) {
                        return underscore.first(getProps(instance, prop, options));
                    } else if (underscore.isFunction(prop)) {
                        return prop(instance, options);
                    } else {
                        switch (prop) {
                            case 'age':
                                var years = moment(options.asOfDate).diff(instance.data.establishedDate, 'years');
                                return instance.data.establishedDate && (years === 0 ? 'Established' : years + ' year' + (years === 1 ? '' : 's'));
                            case 'defaultTitle':
                                return getProps(instance, getDefaultProps(instance), options);
                            case 'farmName':
                                return options.withFarm && options.field && options.field[prop];
                            case 'fieldName':
                                return options.withField && instance.data[prop];
                            case 'croppingPotential':
                                return options.field && options.field[prop] && options.field[prop] + ' Potential';
                            case 'landUse':
                                return options.field && options.field[prop];
                            case 'area':
                            case 'plantedArea':
                            case 'size':
                                return instance.data[prop] && safeMath.round(instance.data[prop], 2) + 'ha';
                            case 'portionNumber':
                                return (instance.data.portionNumber ? 'Ptn. ' + instance.data.portionNumber : 'Rem. extent of farm');
                            case 'typeTitle':
                                return Asset.assetTypes[instance.type];
                            default:
                                return instance.data[prop];
                        }
                    }
                })
                .compact()
                .uniq()
                .value();
        }

        function getCustomTitle (instance, props, options) {
            options = underscore.defaults(options || {}, {
                separator: ', '
            });

            return underscore.flatten(getProps(instance, props || getDefaultProps(instance), options)).join(options.separator);
        }

        function getThumbnailUrl (instance) {
            return attachmentHelper.findSize(this, 'thumb', 'img/camera.png');
        }
        
        function getTitle (instance, withField, farm) {
            return getCustomTitle(instance, getDefaultProps(instance), {
                farm: farm,
                withFarm: !underscore.isUndefined(farm),
                field: farm && underscore.findWhere(farm.data.fields, {fieldName: instance.data.fieldName}),
                withField: withField
            });
        }
        
        function listServiceMap (instance, metadata) {
            var map = {
                id: instance.id || instance.$id,
                type: instance.type,
                updatedAt: instance.updatedAt
            };

            if (instance.data) {
                map.title = getTitle(instance, true);
                map.groupby = instance.farmId;
                map.thumbnailUrl = attachmentHelper.findSize(instance, 'thumb', 'img/camera.png');

                switch (instance.type) {
                    case 'crop':
                        map.subtitle = (instance.data.plantedDate ? 'Planted: ' + moment(instance.data.plantedDate).format('YYYY-MM-DD') : '');
                        map.size = instance.data.size;
                        break;
                    case 'cropland':
                    case 'pasture':
                    case 'wasteland':
                    case 'water right':
                        map.subtitle = (instance.data.size !== undefined ? 'Area: ' + safeMath.round(instance.data.size, 2) + 'ha' : 'Unknown area');
                        map.size = instance.data.size;
                        break;
                    case 'farmland':
                        map.subtitle = (instance.data.area !== undefined ? 'Area: ' + safeMath.round(instance.data.area, 2) + 'ha' : 'Unknown area');
                        map.size = instance.data.area;
                        break;
                    case 'permanent crop':
                    case 'plantation':
                        map.subtitle = (instance.data.establishedDate ? 'Established: ' + moment(instance.data.establishedDate).format('YYYY-MM-DD') : '');
                        map.size = instance.data.size;
                        break;
                    case 'improvement':
                        map.subtitle = instance.data.type + (instance.data.category ? ' - ' + instance.data.category : '') + (instance.data.size !== undefined ? ' (' + safeMath.round(instance.data.size, 2) + 'm²)' : '');
                        map.summary = (instance.data.description || '');
                        break;
                    case 'livestock':
                        map.subtitle = (instance.data.breed ? instance.data.breed + ' for ' : 'For ') + instance.data.purpose;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                    case 'stock':
                        map.groupby = instance.type;
                        break;
                    case 'vme':
                        map.subtitle = 'Quantity: ' + instance.data.quantity;
                        map.summary = (instance.data.description || '');
                        map.groupby = instance.data.type;
                        break;
                }
            }

            if (metadata) {
                map = underscore.extend(map, metadata);
            }

            return map;
        }

        function generateUniqueName (instance, categoryLabel, assets) {
            categoryLabel = categoryLabel || '';

            var assetCount = underscore.chain(assets)
                .where({type: instance.type})
                .reduce(function(assetCount, asset) {
                    if (asset.data.name) {
                        var index = asset.data.name.search(/\s+[0-9]+$/),
                            name = asset.data.name,
                            number;

                        if (index !== -1) {
                            name = name.substr(0, index);
                            number = parseInt(asset.data.name.substring(index).trim());
                        }

                        if (categoryLabel && name === categoryLabel && (!number || number > assetCount)) {
                            assetCount = number || 1;
                        }
                    }

                    return assetCount;
                }, -1)
                .value();

            return categoryLabel + (assetCount + 1 ? ' ' + (assetCount + 1) : '');
        }

        function isFieldApplicable (instance, field) {
            return underscore.contains(Asset.landClassesByType[instance.type], Field.new(field).landUse);
        }

        function farmRequired (type) {
            return underscore.contains(['crop', 'farmland', 'cropland', 'improvement', 'pasture', 'permanent crop', 'plantation', 'wasteland', 'water right'], type);
        }

        Asset.validates({
            assetKey: {
                required: true
            },
            crop: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'permanent crop', 'plantation'], instance.type);
                },
                inclusion: {
                    in: function (value, instance) {
                        return Asset.cropsByType[instance.type];
                    }
                }
            },
            establishedDate: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['permanent crop', 'plantation'], instance.type);
                },
                format: {
                    date: true
                }
            },
            farmId: {
                requiredIf: function (value, instance) {
                    return farmRequired(instance.type);
                },
                numeric: true
            },
            fieldName: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'cropland', 'pasture', 'permanent crop', 'plantation'], instance.type);
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            plantedDate: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop'], instance.type);
                },
                format: {
                    date: true
                }
            },
            size: {
                requiredIf: function (value, instance) {
                    return underscore.contains(['crop', 'cropland', 'pasture', 'permanent crop', 'plantation', 'wasteland', 'water right'], instance.type);
                },
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Asset.assetTypesWithOther)
                }
            }
        });

        return Asset;
    }]);

sdkModelAsset.provider('AssetFactory', function () {
    var instances = {};

    this.add = function (type, modelName) {
        instances[type] = modelName;
    };

    this.$get = ['$injector', 'Asset', function ($injector, Asset) {
        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                if (typeof instances[attrs.type] === 'string') {
                    instances[attrs.type] = $injector.get(instances[attrs.type]);
                }

                return instances[attrs.type][fnName](attrs);
            }

            return Asset[fnName](attrs);
        }

        return {
            isInstanceOf: function (asset) {
                return (asset ?
                    (instances[asset.type] ?
                        asset instanceof instances[asset.type] :
                        asset instanceof Asset) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});


var sdkModelCrop = angular.module('ag.sdk.model.crop', ['ag.sdk.model.asset']);

sdkModelCrop.provider('Crop', ['AssetFactoryProvider', function (AssetFactoryProvider) {
    this.$get = ['Base', 'asJson', 'Asset', 'computedProperty', 'inheritModel', 'privateProperty', 'naturalSort', 'readOnlyProperty', 'safeMath', 'underscore',
        function (Base, asJson, Asset, computedProperty, inheritModel, privateProperty, naturalSort, readOnlyProperty, safeMath, underscore) {
            function Crop (attrs) {
                Asset.apply(this, arguments);

                Base.initializeObject(this.data, 'inspections', []);
                Base.initializeObject(this.data, 'problems', []);
                Base.initializeObject(this.data, 'season', 'Unknown');
                Base.initializeObject(this.data, 'zones', []);

                computedProperty(this, 'flower', function () {
                    return flowerTypes[this.data.crop] || POD;
                });

                computedProperty(this, 'problems', function () {
                    return this.data.problems;
                });

                computedProperty(this, 'zones', function () {
                    return this.data.zones;
                });

                privateProperty(this, 'addProblem', function (problem) {
                    addItem(this, 'problems', problem);
                });

                privateProperty(this, 'addZone', function (zone) {
                    addItem(this, 'zones', zone);
                });

                privateProperty(this, 'removeProblem', function (problem) {
                    removeItem(this, 'problems', problem);
                });

                privateProperty(this, 'removeZone', function (zone) {
                    removeItem(this, 'zones', zone);
                });

                this.type = 'crop';
            }

            inheritModel(Crop, Asset);

            function addItem (instance, dataStore, item) {
                if (item) {
                    instance.data[dataStore] = underscore.chain(instance.data[dataStore])
                        .reject(underscore.identity({uuid: item.uuid}))
                        .union([asJson(item)])
                        .value()
                        .sort(function (a, b) {
                            return naturalSort(a.createdAt, b.createdAt);
                        });

                    updatePlantedArea(instance);
                    instance.$dirty = true;
                }
            }

            function removeItem (instance, dataStore, item) {
                if (item) {
                    instance.data[dataStore] = underscore.reject(instance.data[dataStore], underscore.identity({uuid: item.uuid}));
                    updatePlantedArea(instance);
                    instance.$dirty = true;
                }
            }

            function updatePlantedArea (instance) {
                instance.data.plantedArea = underscore.reduce(instance.zones, function (total, zone) {
                    return safeMath.plus(total, zone.size);
                }, 0);
            }

            var EAR = 'ear',
                FLOWER = 'flower',
                POD = 'pod',
                PANICLE = 'panicle',
                SPIKELET = 'spikelet';

            var flowerTypes = {
                'Dry Bean': POD,
                'Grain Sorghum': PANICLE,
                'Maize': EAR,
                'Maize (White)': EAR,
                'Maize (Yellow)': EAR,
                'Sunflower': FLOWER,
                'Wheat': SPIKELET,
                'Soya Bean': POD
            };

            Crop.validates(underscore.defaults({
                type: {
                    required: true,
                    equal: {
                        to: 'crop'
                    }
                }
            }, Asset.validations));

            return Crop;
        }];

    AssetFactoryProvider.add('crop', 'Crop');
}]);

sdkModelCrop.factory('CropProblem', ['generateUUID', 'inheritModel', 'Model', 'moment', 'readOnlyProperty', 'underscore',
    function (generateUUID, inheritModel, Model, moment, readOnlyProperty, underscore) {
        function CropProblem (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.createdAt = attrs.createdAt || moment().format('YYYY-MM-DD');
            this.description = attrs.description;
            this.loc = attrs.loc;
            this.size = attrs.size;
            this.type = attrs.type;
            this.uuid = attrs.uuid || generateUUID();
        }

        inheritModel(CropProblem, Model.Base);

        readOnlyProperty(CropProblem, 'problemTypes', [
            'Disease',
            'Fading',
            'Uneven',
            'Other',
            'Root',
            'Shortage',
            'Weed']);

        CropProblem.validates({
            description: {
                requiredIf: function (value, instance) {
                    return instance.type === 'Other';
                },
                length: {
                    min: 0,
                    max: 255
                }
            },
            type: {
                required: true,
                inclusion: {
                    in: CropProblem.problemTypes
                }
            },
            uuid: {
                format: {
                    uuid: true
                }
            }
        });

        return CropProblem;
    }]);

sdkModelCrop.factory('CropZone', ['computedProperty', 'generateUUID', 'inheritModel', 'Model', 'moment', 'naturalSort', 'readOnlyProperty', 'underscore',
    function (computedProperty, generateUUID, inheritModel, Model, moment, naturalSort, readOnlyProperty, underscore) {
        function CropZone (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'cultivars', function () {
                return CropZone.cultivarsByCrop[this.crop] || [];
            });

            computedProperty(this, 'growthStages', function () {
                return cropGrowthStages[this.crop] || growthStages[0];
            });

            computedProperty(this, 'leavesPerPlant', function () {
                return cultivarLeaves[this.cultivar] || 22;
            }, {
                enumerable: true
            });

            computedProperty(this, 'typeRequired', function () {
                return s.include(this.crop, 'Maize');
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.createdAt = attrs.createdAt || moment().format('YYYY-MM-DD');
            this.crop = attrs.crop;
            this.cultivar = attrs.cultivar;
            this.emergenceDate = attrs.emergenceDate;
            this.growthStage = attrs.growthStage;
            this.inRows = attrs.inRows;
            this.loc = attrs.loc;
            this.plantsHa = attrs.plantsHa;
            this.rowWidth = attrs.rowWidth;
            this.seedProvider = attrs.seedProvider;
            this.size = attrs.size;
            this.type = attrs.type;
            this.uuid = attrs.uuid || generateUUID();
        }

        inheritModel(CropZone, Model.Base);

        var AFGRI = 'Afgri',
            ARGICOL = 'Agricol',
            AGRIOCARE = 'Agriocare',
            ALL_GROW = 'All-Grow Seed',
            CAPSTONE = 'Capstone',
            DELALB_MONSANTO = 'Dekalb (Monsanto)',
            DELTA_SEED = 'Delta Seeds',
            DRY_BEAN = 'Dry Bean Seed Pty (Ltd)',
            KLEIN_KAROO = 'Klein Karoo',
            LINKSAAD = 'Linksaad',
            PANNAR = 'Pannar',
            PIONEER = 'Pioneer',
            SENSAKO = 'Sensako',
            SENSAKO_MONSANTO = 'Sensako (Monsanto)',
            OTHER = 'Other';

        var MAIZE_YELLOW = [
            [AFGRI,'AFG 4222 B'],
            [AFGRI,'AFG 4244'],
            [AFGRI,'AFG 4270 B'],
            [AFGRI,'AFG 4410'],
            [AFGRI,'AFG 4412 B'],
            [AFGRI,'AFG 4414'],
            [AFGRI,'AFG 4416 B'],
            [AFGRI,'AFG 4434 R'],
            [AFGRI,'AFG 4440'],
            [AFGRI,'AFG 4448'],
            [AFGRI,'AFG 4452 B'],
            [AFGRI,'AFG 4474 R'],
            [AFGRI,'AFG 4476'],
            [AFGRI,'AFG 4478 BR'],
            [AFGRI,'AFG 4512'],
            [AFGRI,'AFG 4520'],
            [AFGRI,'AFG 4522 B'],
            [AFGRI,'AFG 4530'],
            [AFGRI,'AFG 4540'],
            [AFGRI,'AFG 4546'],
            [AFGRI,'AFG 4548'],
            [AFGRI,'AFG 4566 B'],
            [AFGRI,'AFG 4572 R'],
            [AFGRI,'AFG 4660'],
            [AFGRI,'AFG 4664'],
            [AFGRI,'DK 618'],
            [ARGICOL,'IMP 50-90 BR'],
            [ARGICOL,'IMP 51-22 B'],
            [ARGICOL,'IMP 51-92'],
            [ARGICOL,'IMP 51-92 R'],
            [ARGICOL,'QS 7646'],
            [ARGICOL,'SC 602'],
            [ARGICOL,'SC 608'],
            [CAPSTONE,'CAP 121-30'],
            [CAPSTONE,'CAP 122-60'],
            [CAPSTONE,'CAP 130-120'],
            [CAPSTONE,'CAP 130-140'],
            [CAPSTONE,'CAP 444 NG'],
            [CAPSTONE,'CAP 766 NG'],
            [CAPSTONE,'CAP 9004'],
            [CAPSTONE,'CAP 9444 NG'],
            [DELALB_MONSANTO,'DKC 61-90'],
            [DELALB_MONSANTO,'DKC 62-80 BR'],
            [DELALB_MONSANTO,'DKC 62-80 BR GEN'],
            [DELALB_MONSANTO,'DKC 62-84 R'],
            [DELALB_MONSANTO,'DKC 64-78 BR'],
            [DELALB_MONSANTO,'DKC 64-78 BR GEN'],
            [DELALB_MONSANTO,'DKC 66-32 B'],
            [DELALB_MONSANTO,'DKC 66-36 R'],
            [DELALB_MONSANTO,'DKC 66-60 BR'],
            [DELALB_MONSANTO,'DKC 73-70 B GEN'],
            [DELALB_MONSANTO,'DKC 73-72'],
            [DELALB_MONSANTO,'DKC 73-74 BR GEN'],
            [DELALB_MONSANTO,'DKC 73-76 R'],
            [DELALB_MONSANTO,'DKC 80-10'],
            [DELALB_MONSANTO,'DKC 80-12 B GEN'],
            [DELALB_MONSANTO,'DKC 80-30 R'],
            [DELALB_MONSANTO,'DKC 80-40 BR GEN'],
            [DELTA_SEED,'Amber'],
            [DELTA_SEED,'DE 2004'],
            [DELTA_SEED,'DE 2006'],
            [DELTA_SEED,'DE 2016'],
            [DELTA_SEED,'DE 222'],
            [KLEIN_KAROO,'Helen'],
            [KLEIN_KAROO,'KKS 8202'],
            [KLEIN_KAROO,'KKS 8204 B'],
            [KLEIN_KAROO,'KKS 8400'],
            [KLEIN_KAROO,'KKS 8402'],
            [LINKSAAD,'LS 8518'],
            [LINKSAAD,'LS 8524 R'],
            [LINKSAAD,'LS 8526'],
            [LINKSAAD,'LS 8528 R'],
            [LINKSAAD,'LS 8532 B'],
            [LINKSAAD,'LS 8536 B'],
            [PANNAR,'BG 3268'],
            [PANNAR,'BG 3292'],
            [PANNAR,'BG 3492BR'],
            [PANNAR,'BG 3568R'],
            [PANNAR,'BG 3592R'],
            [PANNAR,'BG 3768BR'],
            [PANNAR,'BG 4296'],
            [PANNAR,'BG 6308B'],
            [PANNAR,'PAN 14'],
            [PANNAR,'PAN 3D-736 BR'],
            [PANNAR,'PAN 3P-502 R'],
            [PANNAR,'PAN 3P-730 BR'],
            [PANNAR,'PAN 3Q-222'],
            [PANNAR,'PAN 3Q-240'],
            [PANNAR,'PAN 3Q-740 BR'],
            [PANNAR,'PAN 3R-644 R'],
            [PANNAR,'PAN 4P-228'],
            [PANNAR,'PAN 4P-716 BR'],
            [PANNAR,'PAN 6126 '],
            [PANNAR,'PAN 66'],
            [PANNAR,'PAN 6616'],
            [PANNAR,'PAN 6P-110'],
            [PANNAR,'PAN 6P110'],
            [PANNAR,'PAN 6Q-408B'],
            [PANNAR,'PAN 6Q-508 R'],
            [PANNAR,'PAN 6Q-708 BR'],
            [PIONEER,'P 1615 R'],
            [PIONEER,'P 2048'],
            [PIONEER,'Phb 31D21 B'],
            [PIONEER,'Phb 31D24'],
            [PIONEER,'Phb 31D46 BR'],
            [PIONEER,'Phb 31D48 B'],
            [PIONEER,'Phb 31G54 BR'],
            [PIONEER,'Phb 31G56 R'],
            [PIONEER,'Phb 31K58 B'],
            [PIONEER,'Phb 32D95 BR'],
            [PIONEER,'Phb 32D96 B'],
            [PIONEER,'Phb 32D99'],
            [PIONEER,'Phb 32P68 R'],
            [PIONEER,'Phb 32T50'],
            [PIONEER,'Phb 32W71'],
            [PIONEER,'Phb 32W72 B'],
            [PIONEER,'Phb 33A14 B'],
            [PIONEER,'Phb 33H52 B'],
            [PIONEER,'Phb 33H56'],
            [PIONEER,'Phb 33Y72 B'],
            [PIONEER,'Phb 33Y74'],
            [PIONEER,'Phb 3442'],
            [PIONEER,'Phb 34N44 B'],
            [PIONEER,'Phb 34N45 BR'],
            [PIONEER,'Phb 35T05 R'],
            [SENSAKO_MONSANTO,'SNK 2472'],
            [SENSAKO_MONSANTO,'SNK 2682'],
            [SENSAKO_MONSANTO,'SNK 2778'],
            [SENSAKO_MONSANTO,'SNK 2900'],
            [SENSAKO_MONSANTO,'SNK 2942'],
            [SENSAKO_MONSANTO,'SNK 2972'],
            [SENSAKO_MONSANTO,'SNK 6326 B'],
            [SENSAKO_MONSANTO,'SNK 7510 Y'],
            [SENSAKO_MONSANTO,'SNK 8520'],
            [OTHER,'Brasco'],
            [OTHER,'Cobber Flint'],
            [OTHER,'Cumbre'],
            [OTHER,'Energy'],
            [OTHER,'Gold Finger'],
            [OTHER,'High Flyer'],
            [OTHER,'IMP 50-10 R'],
            [OTHER,'IMP 51-22'],
            [OTHER,'IMP 52-12'],
            [OTHER,'MEH 114'],
            [OTHER,'MMH 1765'],
            [OTHER,'MMH 8825'],
            [OTHER,'Maverik'],
            [OTHER,'NK Arma'],
            [OTHER,'NK MAYOR B'],
            [OTHER,'NS 5000'],
            [OTHER,'NS 5004'],
            [OTHER,'NS 5066'],
            [OTHER,'NS 5914'],
            [OTHER,'NS 5916'],
            [OTHER,'NS 5918'],
            [OTHER,'NS 5920'],
            [OTHER,'Premium Flex'],
            [OTHER,'QS 7608'],
            [OTHER,'RO 430'],
            [OTHER,'SA 24'],
            [OTHER,'SABI 7004'],
            [OTHER,'SABI 7200'],
            [OTHER,'Silmaster'],
            [OTHER,'Syncerus'],
            [OTHER,'US 9570'],
            [OTHER,'US 9580'],
            [OTHER,'US 9600'],
            [OTHER,'US 9610'],
            [OTHER,'US 9620'],
            [OTHER,'US 9770'],
            [OTHER,'US 9772'],
            [OTHER,'Woodriver']
        ];

        var MAIZE_WHITE = [
            [AFGRI,'AFG 4211'],
            [AFGRI,'AFG 4321'],
            [AFGRI,'AFG 4331'],
            [AFGRI,'AFG 4333'],
            [AFGRI,'AFG 4361'],
            [AFGRI,'AFG 4383'],
            [AFGRI,'AFG 4411'],
            [AFGRI,'AFG 4445'],
            [AFGRI,'AFG 4447'],
            [AFGRI,'AFG 4471'],
            [AFGRI,'AFG 4475 B'],
            [AFGRI,'AFG 4477'],
            [AFGRI,'AFG 4479 R'],
            [AFGRI,'AFG 4501'],
            [AFGRI,'AFG 4517'],
            [AFGRI,'AFG 4555'],
            [AFGRI,'AFG 4571 B'],
            [AFGRI,'AFG 4573 B'],
            [AFGRI,'AFG 4575'],
            [AFGRI,'AFG 4577 B'],
            [AFGRI,'AFG 4579 B'],
            [AFGRI,'AFG 4581 BR'],
            [AFGRI,'AFG 4611'],
            [AFGRI,'AFG 4663'],
            [AFGRI,'AFRIC 1'],
            [ARGICOL,'IMP 52-11'],
            [ARGICOL,'SC 701'],
            [ARGICOL,'SC 709'],
            [CAPSTONE,'CAP 341 NG'],
            [CAPSTONE,'CAP 341 T NG'],
            [CAPSTONE,'CAP 441 NG'],
            [CAPSTONE,'CAP 775 NG'],
            [CAPSTONE,'CAP 9001'],
            [CAPSTONE,'CAP 9013'],
            [CAPSTONE,'CAP 9421'],
            [DELALB_MONSANTO,'CRN 3505'],
            [DELALB_MONSANTO,'CRN 4141'],
            [DELALB_MONSANTO,'DKC 77-61 B'],
            [DELALB_MONSANTO,'DKC 77-85 B GEN'],
            [DELALB_MONSANTO,'DKC 78-15 B'],
            [DELALB_MONSANTO,'DKC 78-17 B'],
            [DELALB_MONSANTO,'DKC 78-35 R'],
            [DELALB_MONSANTO,'DKC 78-45 BR'],
            [DELALB_MONSANTO,'DKC 78-45 BR GEN'],
            [DELALB_MONSANTO,'DKC 79-05'],
            [DELTA_SEED,'DE 111'],
            [DELTA_SEED,'DE 303'],
            [KLEIN_KAROO,'KKS 4383'],
            [KLEIN_KAROO,'KKS 4445'],
            [KLEIN_KAROO,'KKS 4447'],
            [KLEIN_KAROO,'KKS 4471'],
            [KLEIN_KAROO,'KKS 4473'],
            [KLEIN_KAROO,'KKS 4477'],
            [KLEIN_KAROO,'KKS 4479 R'],
            [KLEIN_KAROO,'KKS 4485'],
            [KLEIN_KAROO,'KKS 4501'],
            [KLEIN_KAROO,'KKS 4517'],
            [KLEIN_KAROO,'KKS 4519'],
            [KLEIN_KAROO,'KKS 4555'],
            [KLEIN_KAROO,'KKS 4575'],
            [KLEIN_KAROO,'KKS 4581 BR'],
            [KLEIN_KAROO,'KKS 8401'],
            [LINKSAAD,'LS 8519'],
            [LINKSAAD,'LS 8529'],
            [LINKSAAD,'LS 8533 R'],
            [LINKSAAD,'LS 8535 B'],
            [LINKSAAD,'LS 8537'],
            [LINKSAAD,'LS 8539 B'],
            [PANNAR,'BG 5485B'],
            [PANNAR,'BG 5685R'],
            [PANNAR,'BG4201'],
            [PANNAR,'BG4401B'],
            [PANNAR,'BG5285'],
            [PANNAR,'BG5785BR'],
            [PANNAR,'BG6683R'],
            [PANNAR,'PAN 413'],
            [PANNAR,'PAN 4P-767BR'],
            [PANNAR,'PAN 53'],
            [PANNAR,'PAN 5Q-649 R'],
            [PANNAR,'PAN 5Q-749 BR'],
            [PANNAR,'PAN 5Q-751BR'],
            [PANNAR,'PAN 6227'],
            [PANNAR,'PAN 6479'],
            [PANNAR,'PAN 6611'],
            [PANNAR,'PAN 6671'],
            [PANNAR,'PAN 67'],
            [PANNAR,'PAN 6777'],
            [PANNAR,'PAN 69'],
            [PANNAR,'PAN 6Q-745BR'],
            [PANNAR,'PAN 93'],
            [PANNAR,'PAN413'],
            [PANNAR,'PAN53'],
            [PANNAR,'PAN6Q245'],
            [PANNAR,'PAN6Q345CB'],
            [PANNAR,'SC 701 (Green mealie)'],
            [PIONEER,'P 2369 W'],
            [PIONEER,'P 2653 WB'],
            [PIONEER,'P 2823 WB'],
            [PIONEER,'P 2961 W'],
            [PIONEER,'Phb 30B95 B'],
            [PIONEER,'Phb 30B97 BR'],
            [PIONEER,'Phb 30D04 R'],
            [PIONEER,'Phb 30D07 B'],
            [PIONEER,'Phb 30D09 BR'],
            [PIONEER,'Phb 30Y79 B'],
            [PIONEER,'Phb 30Y81 R'],
            [PIONEER,'Phb 30Y83'],
            [PIONEER,'Phb 31M09'],
            [PIONEER,'Phb 31M84 BR'],
            [PIONEER,'Phb 31T91'],
            [PIONEER,'Phb 31V31'],
            [PIONEER,'Phb 3210B'],
            [PIONEER,'Phb 32A05 B'],
            [PIONEER,'Phb 32B07 BR'],
            [PIONEER,'Phb 32Y85'],
            [PIONEER,'Phb 32Y87 B'],
            [SENSAKO_MONSANTO,'SNK 2021'],
            [SENSAKO_MONSANTO,'SNK 2147'],
            [SENSAKO_MONSANTO,'SNK 2401'],
            [SENSAKO_MONSANTO,'SNK 2551'],
            [SENSAKO_MONSANTO,'SNK 2721'],
            [SENSAKO_MONSANTO,'SNK 2911'],
            [SENSAKO_MONSANTO,'SNK 2969'],
            [SENSAKO_MONSANTO,'SNK 6025'],
            [SENSAKO_MONSANTO,'SNK 7811 B'],
            [OTHER,'CG 4141'],
            [OTHER,'GM 2000'],
            [OTHER,'KGALAGADI'],
            [OTHER,'MRI 514'],
            [OTHER,'MRI 624'],
            [OTHER,'NG 761'],
            [OTHER,'NS 5913'],
            [OTHER,'NS 5917'],
            [OTHER,'NS 5919'],
            [OTHER,'PGS 7053'],
            [OTHER,'PGS 7061'],
            [OTHER,'PGS 7071'],
            [OTHER,'PLATINUM'],
            [OTHER,'Panthera'],
            [OTHER,'QS 7707'],
            [OTHER,'RO 413'],
            [OTHER,'RO 413'],
            [OTHER,'RO 419'],
            [OTHER,'SAFFIER'],
            [OTHER,'SC 401'],
            [OTHER,'SC 403'],
            [OTHER,'SC 405'],
            [OTHER,'SC 407'],
            [OTHER,'SC 513'],
            [OTHER,'SC 627'],
            [OTHER,'SC 631'],
            [OTHER,'SC 633'],
            [OTHER,'SC 713'],
            [OTHER,'SC 715'],
            [OTHER,'Scout']];

        readOnlyProperty(CropZone, 'cultivarsByCrop', {
            'Barley':[
                [ARGICOL,'SKG 9'],
                [ARGICOL,'SVG 13'],
                [OTHER,'Clipper'],
                [OTHER,'Cocktail'],
                [OTHER,'Puma'],
                [OTHER,'SabbiErica'],
                [OTHER,'SabbiNemesia'],
                [OTHER,'SSG 564'],
                [OTHER,'SSG 585']
            ],
            'Bean (Dry)':[
                [CAPSTONE,'CAP 2000'],
                [CAPSTONE,'CAP 2001'],
                [CAPSTONE,'CAP 2008'],
                [DRY_BEAN,'DBS 310'],
                [DRY_BEAN,'DBS 360'],
                [DRY_BEAN,'DBS 830'],
                [DRY_BEAN,'DBS 840'],
                [DRY_BEAN,'Kranskop HR1'],
                [DRY_BEAN,'OPS RS1'],
                [DRY_BEAN,'OPS RS2'],
                [DRY_BEAN,'OPS RS4'],
                [DRY_BEAN,'OPS-KW1'],
                [DRY_BEAN,'RS 5'],
                [DRY_BEAN,'RS 6'],
                [DRY_BEAN,'RS 7'],
                [PANNAR,'PAN 116'],
                [PANNAR,'PAN 123'],
                [PANNAR,'PAN 128'],
                [PANNAR,'PAN 135'],
                [PANNAR,'PAN 139'],
                [PANNAR,'PAN 146'],
                [PANNAR,'PAN 148'],
                [PANNAR,'PAN 148 Plus'],
                [PANNAR,'PAN 9213'],
                [PANNAR,'PAN 9216'],
                [PANNAR,'PAN 9225'],
                [PANNAR,'PAN 9249'],
                [PANNAR,'PAN 9280'],
                [PANNAR,'PAN 9281'],
                [PANNAR,'PAN 9292'],
                [PANNAR,'PAN 9298'],
                [OTHER,'AFG 470'],
                [OTHER,'AFG 471'],
                [OTHER,'BONUS'],
                [OTHER,'CALEDON'],
                [OTHER,'CARDINAL'],
                [OTHER,'CERRILLOS'],
                [OTHER,'DONGARA'],
                [OTHER,'DPO 820'],
                [OTHER,'JENNY'],
                [OTHER,'KAMIESBERG'],
                [OTHER,'KOMATI'],
                [OTHER,'KRANSKOP'],
                [OTHER,'MAJUBA'],
                [OTHER,'MASKAM'],
                [OTHER,'MINERVA'],
                [OTHER,'MKONDENI'],
                [OTHER,'MKUZI'],
                [OTHER,'RUBY'],
                [OTHER,'SC Silk'],
                [OTHER,'SC Superior'],
                [OTHER,'SEDERBERG'],
                [OTHER,'SSB 20'],
                [OTHER,'STORMBERG'],
                [OTHER,'TEEBUS'],
                [OTHER,'TEEBUS-RCR2'],
                [OTHER,'TEEBUS-RR1'],
                [OTHER,'TYGERBERG'],
                [OTHER,'UKULINGA'],
                [OTHER,'UMTATA'],
                [OTHER,'WERNA']
            ],
            'Canola':[
                [ARGICOL,'Aga Max'],
                [ARGICOL,'AV Garnet'],
                [ARGICOL,'CB Jardee HT'],
                [ARGICOL,'Cobbler'],
                [ARGICOL,'Tawriffic'],
                [KLEIN_KAROO,'Hyola 61'],
                [KLEIN_KAROO,'Rocket CL'],
                [KLEIN_KAROO,'Thunder TT'],
                [KLEIN_KAROO,'Varola 54']
            ],
            'Grain Sorghum':[
                [ARGICOL,'AVENGER GH'],
                [ARGICOL,'DOMINATOR GM'],
                [ARGICOL,'ENFORCER GM'],
                [ARGICOL,'MAXIMIZER'],
                [ARGICOL,'PREMIUM 4065 T GH'],
                [ARGICOL,'PREMIUM 100'],
                [ARGICOL,'NS 5511 GH'],
                [ARGICOL,'NS 5540'],
                [ARGICOL,'NS 5555'],
                [ARGICOL,'NS 5655 GM'],
                [ARGICOL,'NS 5751'],
                [ARGICOL,'NS 5832'],
                [ARGICOL,'TIGER GM'],
                [CAPSTONE,'CAP 1002'],
                [CAPSTONE,'CAP 1003'],
                [CAPSTONE,'CAP 1004'],
                [KLEIN_KAROO,'MR 32 GL'],
                [KLEIN_KAROO,'MR 43 GL'],
                [KLEIN_KAROO,'MR BUSTER GL'],
                [KLEIN_KAROO,'MR PACER'],
                [PANNAR,'PAN 8625 GH'],
                [PANNAR,'PAN 8816 GM'],
                [PANNAR,'PAN 8906 GM'],
                [PANNAR,'PAN 8909 GM'],
                [PANNAR,'PAN 8006 T'],
                [PANNAR,'PAN 8507'],
                [PANNAR,'PAN 8609'],
                [PANNAR,'PAN 8648'],
                [PANNAR,'PAN 8706'],
                [PANNAR,'PAN 8806'],
                [PANNAR,'PAN 8901'],
                [PANNAR,'PAN 8902'],
                [PANNAR,'PAN 8903'],
                [PANNAR,'PAN 8904'],
                [PANNAR,'PAN 8905'],
                [PANNAR,'PAN 8906'],
                [PANNAR,'PAN 8907'],
                [PANNAR,'PAN 8908'],
                [PANNAR,'PAN 8909'],
                [PANNAR,'PAN 8911'],
                [PANNAR,'PAN 8912'],
                [PANNAR,'PAN 8913'],
                [PANNAR,'PAN 8914'],
                [PANNAR,'PAN 8915'],
                [PANNAR,'PAN 8916'],
                [PANNAR,'PAN 8918'],
                [PANNAR,'PAN 8919'],
                [PANNAR,'PAN 8920'],
                [PANNAR,'PAN 8921'],
                [PANNAR,'PAN 8922'],
                [PANNAR,'PAN 8923'],
                [PANNAR,'PAN 8924'],
                [PANNAR,'PAN 8925'],
                [PANNAR,'PAN 8926'],
                [PANNAR,'PAN 8927'],
                [PANNAR,'PAN 8928'],
                [PANNAR,'PAN 8929'],
                [PANNAR,'PAN 8930'],
                [PANNAR,'PAN 8931'],
                [PANNAR,'PAN 8932'],
                [PANNAR,'PAN 8933'],
                [PANNAR,'PAN 8936'],
                [PANNAR,'PAN 8937'],
                [PANNAR,'PAN 8938'],
                [PANNAR,'PAN 8939'],
                [PANNAR,'PAN 8940'],
                [PANNAR,'PAN 8966'],
                [OTHER,'APN 881'],
                [OTHER,'MACIA-SA'],
                [OTHER,'NK 8830'],
                [OTHER,'OVERFLOW'],
                [OTHER,'SA 1302-M27'],
                [OTHER,'TITAN'],
                [OTHER,'X868']
            ],
            'Maize': underscore.union(MAIZE_YELLOW, MAIZE_WHITE).sort(function (itemA, itemB) {
                return naturalSort(itemA.join(), itemB.join());
            }),
            'Maize (Yellow)': MAIZE_YELLOW,
            'Maize (White)': MAIZE_WHITE,
            'Oat':[
                [ARGICOL,'Magnifico'],
                [ARGICOL,'Maida'],
                [ARGICOL,'Nugene'],
                [ARGICOL,'Overberg'],
                [ARGICOL,'Pallinup'],
                [ARGICOL,'Saia'],
                [ARGICOL,'SWK001'],
                [SENSAKO_MONSANTO],
                [SENSAKO_MONSANTO,'SSH 39W'],
                [SENSAKO_MONSANTO,'SSH 405'],
                [SENSAKO_MONSANTO,'SSH 421'],
                [SENSAKO_MONSANTO,'SSH 423'],
                [SENSAKO_MONSANTO,'SSH 491'],
                [OTHER,'Drakensberg'],
                [OTHER,'H06/19'],
                [OTHER,'H06/20'],
                [OTHER,'H07/04'],
                [OTHER,'H07/05'],
                [OTHER,'Heros'],
                [OTHER,'Kompasberg'],
                [OTHER,'Le Tucana'],
                [OTHER,'Maluti'],
                [OTHER,'Potoroo'],
                [OTHER,'Witteberg']
            ],
            'Soya Bean':[
                [AGRIOCARE,'AGC 58007 R'],
                [AGRIOCARE,'AGC 60104 R'],
                [AGRIOCARE,'AGC 64107 R'],
                [AGRIOCARE,'AS 4801 R'],
                [LINKSAAD,'LS 6146 R'],
                [LINKSAAD,'LS 6150 R'],
                [LINKSAAD,'LS 6161 R'],
                [LINKSAAD,'LS 6164 R'],
                [LINKSAAD,'LS 6248 R'],
                [LINKSAAD,'LS 6261 R'],
                [LINKSAAD,'LS 6444 R'],
                [LINKSAAD,'LS 6466 R'],
                [PANNAR,'A 5409 RG'],
                [PANNAR,'PAN 1454 R'],
                [PANNAR,'PAN 1583 R'],
                [PANNAR,'PAN 1664 R'],
                [PANNAR,'PAN 1666 R'],
                [PIONEER,'Phb 94Y80 R'],
                [PIONEER,'Phb 95B53 R'],
                [PIONEER,'Phb 95Y20 R'],
                [PIONEER,'Phb 95Y40 R'],
                [OTHER,'AG 5601'],
                [OTHER,'AMSTEL NO 1'],
                [OTHER,'DUMELA'],
                [OTHER,'DUNDEE'],
                [OTHER,'EGRET'],
                [OTHER,'HERON'],
                [OTHER,'HIGHVELD TOP'],
                [OTHER,'IBIS 2000'],
                [OTHER,'JF 91'],
                [OTHER,'JIMMY'],
                [OTHER,'KIAAT'],
                [OTHER,'KNAP'],
                [OTHER,'LEX 1233 R'],
                [OTHER,'LEX 1235 R'],
                [OTHER,'LEX 2257 R'],
                [OTHER,'LEX 2685 R'],
                [OTHER,'LIGHTNING'],
                [OTHER,'MARULA'],
                [OTHER,'MARUTI'],
                [OTHER,'MOPANIE'],
                [OTHER,'MPIMBO'],
                [OTHER,'MUKWA'],
                [OTHER,'NQUTU'],
                [OTHER,'OCTA'],
                [OTHER,'SONOP'],
                [OTHER,'SPITFIRE'],
                [OTHER,'STORK'],
                [OTHER,'TAMBOTIE'],
                [OTHER,'WENNER']
            ],
            'Sugarcane':[
                [OTHER,'ACRUNCH'],
                [OTHER,'BONITA'],
                [OTHER,'CHIEFTAIN'],
                [OTHER,'EARLISWEET'],
                [OTHER,'GLADIATOR'],
                [OTHER,'GSS 9299'],
                [OTHER,'HOLLYWOOD'],
                [OTHER,'HONEYMOON'],
                [OTHER,'INFERNO'],
                [OTHER,'JUBILEE'],
                [OTHER,'MADHUR'],
                [OTHER,'MAJESTY'],
                [OTHER,'MANTRA'],
                [OTHER,'MATADOR'],
                [OTHER,'MAX'],
                [OTHER,'MEGATON'],
                [OTHER,'MMZ 9903'],
                [OTHER,'ORLA'],
                [OTHER,'OSCAR'],
                [OTHER,'OVERLAND'],
                [OTHER,'PRIMEPLUS'],
                [OTHER,'RUSALTER'],
                [OTHER,'RUSTICO'],
                [OTHER,'RUSTLER'],
                [OTHER,'SENTINEL'],
                [OTHER,'SHIMMER'],
                [OTHER,'STAR 7708'],
                [OTHER,'STAR 7713'],
                [OTHER,'STAR 7714'],
                [OTHER,'STAR 7715'],
                [OTHER,'STAR 7717'],
                [OTHER,'STAR 7718'],
                [OTHER,'STAR 7719'],
                [OTHER,'STETSON'],
                [OTHER,'SWEET SUCCESS'],
                [OTHER,'SWEET SURPRISE'],
                [OTHER,'SWEET TALK'],
                [OTHER,'TENDER TREAT'],
                [OTHER,'WINSTAR']
            ],
            'Sunflower':[
                [ARGICOL,'AGSUN 5161 CL'],
                [ARGICOL,'AGSUN 5182 CL'],
                [ARGICOL,'Agsun 5264'],
                [ARGICOL,'Agsun 5671'],
                [ARGICOL,'Agsun 8251'],
                [ARGICOL,'Nonjana'],
                [ARGICOL,'SUNSTRIPE'],
                [KLEIN_KAROO,'AFG 271'],
                [KLEIN_KAROO,'HYSUN 333'],
                [KLEIN_KAROO,'KKS 318'],
                [KLEIN_KAROO,'NK ADAGIO'],
                [KLEIN_KAROO,'NK Armoni'],
                [KLEIN_KAROO,'NK FERTI'],
                [KLEIN_KAROO,'Sirena'],
                [KLEIN_KAROO,'Sunbird'],
                [PANNAR,'PAN 7033'],
                [PANNAR,'PAN 7049'],
                [PANNAR,'PAN 7050'],
                [PANNAR,'PAN 7057'],
                [PANNAR,'PAN 7063 CL'],
                [PANNAR,'PAN 7080'],
                [PANNAR,'PAN 7086 HO'],
                [PANNAR,'PAN 7095 CL'],
                [PANNAR,'PAN 7351'],
                [OTHER,'Ella'],
                [OTHER,'Grainco Sunstripe'],
                [OTHER,'HV 3037'],
                [OTHER,'HYSUN 334'],
                [OTHER,'HYSUN 338'],
                [OTHER,'HYSUN 346'],
                [OTHER,'HYSUN 350'],
                [OTHER,'Jade Emperor'],
                [OTHER,'Marica-2'],
                [OTHER,'NK Adagio CL'],
                [OTHER,'Nallimi CL'],
                [OTHER,'SEA 2088 CL AO'],
                [OTHER,'SY 4045'],
                [OTHER,'SY 4200'],
                [OTHER,'Sikllos CL'],
                [OTHER,'WBS 3100']
            ],
            'Triticale':[
                [ARGICOL,'AG Beacon'],
                [ARGICOL,'Rex'],
                [PANNAR,'PAN 248'],
                [PANNAR,'PAN 299'],
                [OTHER,'Bacchus'],
                [OTHER,'Cloc 1'],
                [OTHER,'Cultivars'],
                [OTHER,'Falcon'],
                [OTHER,'Ibis'],
                [OTHER,'Kiewiet'],
                [OTHER,'Korhaan'],
                [OTHER,'Tobie'],
                [OTHER,'US 2009'],
                [OTHER,'US 2010'],
                [OTHER,'US2007']
            ],
            'Wheat':[
                [AFGRI,'AFG 554-8'],
                [AFGRI,'AFG 75-3'],
                [ALL_GROW,'BUFFELS'],
                [ALL_GROW,'DUZI'],
                [ALL_GROW,'KARIEGA'],
                [ALL_GROW,'KROKODIL'],
                [ALL_GROW,'SABIE'],
                [ALL_GROW,'STEENBRAS'],
                [KLEIN_KAROO,'HARTBEES'],
                [KLEIN_KAROO,'KOMATI'],
                [KLEIN_KAROO,'KOONAP'],
                [KLEIN_KAROO,'MATLABAS'],
                [KLEIN_KAROO,'SELATI'],
                [KLEIN_KAROO,'SENQU'],
                [SENSAKO,'CRN 826'],
                [SENSAKO,'ELANDS'],
                [SENSAKO,'SST 015'],
                [SENSAKO,'SST 026'],
                [SENSAKO,'SST 027'],
                [SENSAKO,'SST 035'],
                [SENSAKO,'SST 036'],
                [SENSAKO,'SST 037'],
                [SENSAKO,'SST 039'],
                [SENSAKO,'SST 047'],
                [SENSAKO,'SST 056'],
                [SENSAKO,'SST 057'],
                [SENSAKO,'SST 065'],
                [SENSAKO,'SST 077'],
                [SENSAKO,'SST 087'],
                [SENSAKO,'SST 088'],
                [SENSAKO,'SST 094'],
                [SENSAKO,'SST 096'],
                [SENSAKO,'SST 107'],
                [SENSAKO,'SST 124'],
                [SENSAKO,'SST 308'],
                [SENSAKO,'SST 316'],
                [SENSAKO,'SST 317'],
                [SENSAKO,'SST 319'],
                [SENSAKO,'SST 322'],
                [SENSAKO,'SST 333'],
                [SENSAKO,'SST 334'],
                [SENSAKO,'SST 347'],
                [SENSAKO,'SST 356'],
                [SENSAKO,'SST 363'],
                [SENSAKO,'SST 366'],
                [SENSAKO,'SST 367'],
                [SENSAKO,'SST 374'],
                [SENSAKO,'SST 387'],
                [SENSAKO,'SST 398'],
                [SENSAKO,'SST 399'],
                [SENSAKO,'SST 802'],
                [SENSAKO,'SST 805'],
                [SENSAKO,'SST 806'],
                [SENSAKO,'SST 807'],
                [SENSAKO,'SST 815'],
                [SENSAKO,'SST 816'],
                [SENSAKO,'SST 822'],
                [SENSAKO,'SST 825'],
                [SENSAKO,'SST 835'],
                [SENSAKO,'SST 843'],
                [SENSAKO,'SST 866'],
                [SENSAKO,'SST 867'],
                [SENSAKO,'SST 875'],
                [SENSAKO,'SST 876'],
                [SENSAKO,'SST 877'],
                [SENSAKO,'SST 878'],
                [SENSAKO,'SST 884'],
                [SENSAKO,'SST 885'],
                [SENSAKO,'SST 886'],
                [SENSAKO,'SST 895'],
                [SENSAKO,'SST 896'],
                [SENSAKO,'SST 935'],
                [SENSAKO,'SST 936'],
                [SENSAKO,'SST 946'],
                [SENSAKO,'SST 954'],
                [SENSAKO,'SST 963'],
                [SENSAKO,'SST 964'],
                [SENSAKO,'SST 966'],
                [SENSAKO,'SST 972'],
                [SENSAKO,'SST 983'],
                [SENSAKO,'SST 0127'],
                [SENSAKO,'SST 1327'],
                [SENSAKO,'SST 3137'],
                [SENSAKO,'SST 8125'],
                [SENSAKO,'SST 8126'],
                [SENSAKO,'SST 8134'],
                [SENSAKO,'SST 8135'],
                [SENSAKO,'SST 8136'],
                [PANNAR,'PAN 3118'],
                [PANNAR,'PAN 3120'],
                [PANNAR,'PAN 3122'],
                [PANNAR,'PAN 3144'],
                [PANNAR,'PAN 3161'],
                [PANNAR,'PAN 3172'],
                [PANNAR,'PAN 3195'],
                [PANNAR,'PAN 3198'],
                [PANNAR,'PAN 3355'],
                [PANNAR,'PAN 3364'],
                [PANNAR,'PAN 3368'],
                [PANNAR,'PAN 3369'],
                [PANNAR,'PAN 3377'],
                [PANNAR,'PAN 3378'],
                [PANNAR,'PAN 3379'],
                [PANNAR,'PAN 3394'],
                [PANNAR,'PAN 3400'],
                [PANNAR,'PAN 3404'],
                [PANNAR,'PAN 3405'],
                [PANNAR,'PAN 3408'],
                [PANNAR,'PAN 3434'],
                [PANNAR,'PAN 3471'],
                [PANNAR,'PAN 3478'],
                [PANNAR,'PAN 3489'],
                [PANNAR,'PAN 3490'],
                [PANNAR,'PAN 3492'],
                [PANNAR,'PAN 3497'],
                [PANNAR,'PAN 3111'],
                [PANNAR,'PAN 3349'],
                [PANNAR,'PAN 3515'],
                [PANNAR,'PAN 3623'],
                [OTHER,'BAVIAANS'],
                [OTHER,'BELINDA'],
                [OTHER,'BETTA-DN'],
                [OTHER,'BIEDOU'],
                [OTHER,'CALEDON'],
                [OTHER,'CARINA'],
                [OTHER,'CAROL'],
                [OTHER,'GARIEP'],
                [OTHER,'HUGENOOT'],
                [OTHER,'INIA'],
                [OTHER,'KOUGA'],
                [OTHER,'KWARTEL'],
                [OTHER,'LIMPOPO'],
                [OTHER,'MacB'],
                [OTHER,'MARICO'],
                [OTHER,'NOSSOB'],
                [OTHER,'OLIFANTS'],
                [OTHER,'SNACK'],
                [OTHER,'TAMBOTI'],
                [OTHER,'TANKWA'],
                [OTHER,'TARKA'],
                [OTHER,'TIMBAVATI'],
                [OTHER,'TUGELA-DN'],
                [OTHER,'UMLAZI'],
                [OTHER,'RATEL']
            ]
        });

        var cultivarLeaves = {
            'Phb 30F40': 23,
            'Phb 31G54 BR': 19,
            'Phb 31G58': 21,
            'Phb 32D95BR': 18,
            'Phb 32D96 B': 18,
            'Phb 32P68 R': 20,
            'Phb 32T50': 18,
            'Phb 32W71': 21,
            'Phb 32W72 B': 20,
            'Phb 33A14 B': 19,
            'Phb 33H56': 20,
            'Phb 33R78 B': 21,
            'Phb 33Y72B': 17,
            'Phb 3442': 21,
            'Phb 30B95 B': 23,
            'Phb 30B97 BR': 23,
            'Phb 30D09 BR': 20,
            'Phb 31M09': 18,
            'Phb 32A05 B': 19,
            'Phb 32B10': 18,
            'Phb 32Y85': 21,
            'Phb 31D48 BR': 21,
            'Phb 32D91 R': 20,
            'Phb 32D99': 20,
            'Phb 32Y68': 20,
            'Phb 3394': 19,
            'Phb 33A13': 19,
            'Phb 33H52 B': 19,
            'Phb 33H54 BR': 19,
            'Phb 33P34': 20,
            'Phb 33P66': 20,
            'Phb 33P67': 20,
            'X 70200 T': 23,
            'X 7268 TR': 21,
            'Phb 30N35': 23,
            'Phb 32A03': 19,
            'Phb 32Y52': 19,
            'Phb 32Y53': 20,
            'Phb 33A03': 19,
            'Phb 30H22': 21,
            'Phb 32P75': 20,
            'Phb 3335': 20,
            'DKC62-74R': 20,
            'DKC62-80BR': 18,
            'DKC64-78BR': 17,
            'DKC66-32B': 21,
            'DKC66-36R': 19,
            'DKC73-70BGEN': 20,
            'DKC73-74BR': 20,
            'DKC73-74BRGEN': 20,
            'DKC73-76R': 20,
            'DKC80-10': 20,
            'DKC80-12B': 20,
            'DKC80-30R': 20,
            'DKC80-40BR': 19,
            'DKC80-40BRGEN': 21,
            'CRN3505': 21,
            'DKC77-61B': 20,
            'DKC77-71R': 20,
            'DKC77-85B': 21,
            'DKC78-15B': 20,
            'DKC78-35BR': 21,
            'DKC78-45BRGEN': 21,
            'DKC 78-79 BR': 21,
            'CRN 3604': 21,
            'CRN 37-60': 20,
            'CRN 4760 B': 23,
            'DKC 63-20': 20,
            'DKC 66-21': 21,
            'DKC 66-38 B': 21,
            'DKC 63-28 R': 21,
            'CRN 3549': 21,
            'DKC 71-21': 20,
            'SNK 2472': 23,
            'SNK 2682': 23,
            'SNK 2778': 23,
            'SNK 2900': 20,
            'SNK 2942': 24,
            'SNK 2972': 21,
            'SNK 6326 B': 21,
            'SNK 8520': 24,
            'SNK 2911': 21,
            'SNK 6025': 18,
            'LS 8504': 20,
            'LS 8512': 20,
            'LS 8518': 19,
            'LS 8522 R': 19,
            'LS 8511': 19,
            'LS 8513': 19,
            'LS 8519': 19,
            'LS 8521 B': 19,
            'LS 8523 B': 19,
            'LS 8527 BR': 19,
            'LS 8506': 21,
            'LS 8508': 20,
            'LS 8524 R': 20,
            'LEX 800': 23,
            'LS 8509': 21,
            'LS 8517': 23,
            'LS 8525': 21,
            'LS 8529': 21,
            'LS 8533 R': 21,
            'LS 8536 B': 19,
            'PAN 3D-432Bt ': 18,
            'PAN 3D-736BR': 18,
            'PAN 3P-502RR': 19,
            'PAN 3P-730BR': 18,
            'PAN 3Q-422B': 18,
            'PAN 3Q-740BR': 19,
            'PAN 3R-644R': 18,
            'PAN 4P-116': 19,
            'PAN 4P-316Bt': 19,
            'PAN 4P-516RR': 20,
            'PAN 4P-716BR': 19,
            'PAN 6114': 19,
            'PAN 6126': 18,
            'PAN 6146': 24,
            'PAN 6236Bt': 18,
            'PAN 6238RR': 18,
            'PAN 6480': 23,
            'PAN 6616': 23,
            'PAN 6724Bt': 25,
            'PAN 6734': 23,
            'PAN 6P-110': 21,
            'PAN 6Q-308 B': 21,
            'PAN 6Q-308 Bt': 21,
            'PAN 6Q-408 CB': 21,
            'PAN 6Q-508R': 21,
            'PAN 6Q-508RR': 20,
            'PAN 4P-767BR': 19,
            'PAN 5Q-433Bt *': 20,
            'PAN 5R-541RR': 19,
            'PAN 6013Bt': 23,
            'PAN 6017': 21,
            'PAN 6043': 23,
            'PAN 6053': 23,
            'PAN 6223Bt': 21,
            'PAN 6479': 23,
            'PAN 6611': 23,
            'PAN 6723': 23,
            'PAN 6777': 25,
            'PAN 6Q-419B': 20,
            'PAN 6Q-445Bt': 21,
            'PAN 6000 Bt': 19,
            'PAN 6012 Bt': 21,
            'PAN 6118': 19,
            'PAN 6124 Bt': 19,
            'PAN 6128 RR': 19,
            'PAN 6256': 24,
            'PAN 6310': 24,
            'PAN 6316': 25,
            'PAN 6320': 25,
            'PAN 6432 B': 23,
            'PAN 6568': 23,
            'PAN 6622': 25,
            'PAN 6710': 21,
            'PAN 6804': 20,
            'PAN 6844': 25,
            'PAN 6994 Bt': 24,
            'PAN 5Q-749 BR': 23,
            'PAN 6243': 24,
            'PAN 6335': 23,
            'PAN 6573': 23,
            'PAN 6633': 23,
            'PAN 6757': 25,
            'PAN 6839': 23,
            'PAN 6Q-321 B': 23,
            'PAN 6Q-345 CB': 21,
            'AFG 4270B': 18,
            'AFG 4412B': 19,
            'AFG 4434R': 20,
            'AFG 4522B': 20,
            'AFG 4530': 19,
            'AFG 4222 B': 19,
            'AFG 4244': 19,
            'AFG 4410': 19,
            'AFG 4414': 20,
            'AFG 4416 B': 20,
            'AFG 4448': 20,
            'AFG 4474 R': 19,
            'AFG 4476': 20,
            'AFG 4512': 23,
            'AFG 4520': 20,
            'AFG 4540': 20,
            'DK 618': 21,
            'EXPG 5002': 20,
            'EXP Stack': 20,
            'AFG 4321': 19,
            'AFG 4331': 20,
            'AFG 4333': 20,
            'AFG 4411': 21,
            'AFG 4445': 21,
            'AFG 4447': 21,
            'AFG 4471': 23,
            'AFG 4475 B': 21,
            'AFG 4477': 20,
            'AFG 4479 R': 21,
            'AFG 4573 B': 21,
            'AFG 4577 B': 21,
            'AFG 4611': 23,
            'KKS 8204B': 15,
            'KKS 4581 BR': 21,
            'KKS 8301': 19,
            'IMP 50 - 90BR': 18,
            'IMP 51 - 22': 19,
            'IMP 51-92': 19,
            'IMP 52-12': 20,
            'NS 5920': 20,
            'QS 7646': 20,
            'BG 5485 B': 23,
            'BG 8285': 23,
            'Brasco': 19,
            'Energy': 18,
            'Gold Finger': 19,
            'Helen': 17,
            'High Flyer': 17,
            'Maverik': 19,
            'NK Arma': 18,
            'QS 7608': 23,
            'SC 506': 19,
            'SC 602': 21,
            'Woodriver': 18,
            'P 1615 R': 19,
            'P 1973 Y': 19,
            'P 2653 WB': 20,
            'P 2048': 20,
            'IMP 52-11 B': 18,
            'Panthera': 21,
            'QS 7707': 23,
            'SC 401': 18,
            'SC 403': 20,
            'SC 405': 20,
            'SC 407': 20,
            'SC 533': 21,
            'SC 719': 24,
            'Scout': 20
        };

        var growthStages = [
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'R16', 'R17', 'R18'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
            ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']
        ];

        var cropGrowthStages = {
            'Barley': growthStages[1],
            'Bean': growthStages[5],
            'Bean (Broad)': growthStages[5],
            'Bean (Dry)': growthStages[5],
            'Bean (Sugar)': growthStages[5],
            'Bean (Green)': growthStages[5],
            'Bean (Kidney)': growthStages[5],
            'Canola': growthStages[7],
            'Cotton': growthStages[6],
            'Grain Sorghum': growthStages[3],
            'Maize': growthStages[0],
            'Maize (White)': growthStages[0],
            'Maize (Yellow)': growthStages[0],
            'Soya Bean': growthStages[2],
            'Sunflower': growthStages[4],
            'Wheat': growthStages[1],
            'Wheat (Durum)': growthStages[1]
        };

        readOnlyProperty(CropZone, 'maizeTypes', [
            'Commodity',
            'Hybrid',
            'Silo Fodder']);

        CropZone.validates({
            emergenceDate: {
                format: {
                    date: true
                }
            },
            growthStage: {
                required: true,
                inclusion: {
                    in: function (value, instance, field) {
                        return instance.growthStages;
                    }
                }
            },
            plantsHa: {
                required: true,
                range: {
                    from: 0
                },
                numeric: true
            },
            rowWidth: {
                requiredIf: function (value, instance, field) {
                    return instance.inRows;
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            type: {
                requiredIf: function (value, instance, field) {
                    return s.include(instance.crop, 'Maize');
                },
                inclusion: {
                    in: CropZone.maizeTypes
                }
            },
            uuid: {
                format: {
                    uuid: true
                }
            }
        });

        return CropZone;
    }]);



var sdkModelLivestock = angular.module('ag.sdk.model.livestock', ['ag.sdk.model.asset', 'ag.sdk.model.stock']);

sdkModelLivestock.provider('Livestock', ['AssetFactoryProvider', function (AssetFactoryProvider) {
    this.$get = ['computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'Stock', 'underscore',
        function (computedProperty, inheritModel, privateProperty, readOnlyProperty, Stock, underscore) {
            function Livestock (attrs) {
                Stock.apply(this, arguments);

                readOnlyProperty(this, 'actions', {
                    'incoming': [
                        'Birth',
                        'Retained',
                        'Purchase'],
                    'movement': [
                        'Deliver'
                    ],
                    'outgoing': [
                        'Death',
                        'Household',
                        'Labour',
                        'Retain',
                        'Sale']
                });

                computedProperty(this, 'actionTitles', function () {
                    return getActionTitles(this);
                });

                privateProperty(this, 'getActionTitle', function (action) {
                    var splitAction = action.split(':', 2);

                    if (splitAction.length === 2) {
                        switch (splitAction[0]) {
                            case 'Retain':
                                return (this.birthAnimal === this.data.category ? 'Wean Livestock' : 'Retain ' + splitAction[1]);
                            case 'Retained':
                                return (this.weanedAnimal === this.data.category ? 'Weaned Livestock' : 'Retained ' + splitAction[1]);
                            default:
                                return splitAction[0];
                        }
                    }

                    return this.actionTitles[action];
                });

                computedProperty(this, 'baseAnimal', function () {
                    return baseAnimals[this.data.type] || this.data.type;
                });

                computedProperty(this, 'birthAnimal', function () {
                    return getBirthingAnimal(this.data.type);
                });

                computedProperty(this, 'weanedAnimal', function () {
                    return getWeanedAnimal(this.data.type);
                });

                privateProperty(this, 'conversionRate', function () {
                    return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][this.data.category] || conversionRate[this.baseAnimal][representativeAnimals[this.baseAnimal]]);
                });

                computedProperty(this, 'representativeAnimal', function () {
                    return representativeAnimals[this.baseAnimal];
                });

                this.type = 'livestock';
            }

            inheritModel(Livestock, Stock);

            function getActionTitles (instance) {
                return underscore.chain(actionTitles)
                    .pairs()
                    .union(underscore.map(animalGrowthStages[instance.baseAnimal][instance.data.category], function (category) {
                        return ['Retain:' + category, (instance.birthAnimal === instance.data.category ? 'Wean Livestock' : 'Retain ' + category)];
                    }))
                    .sortBy(function (pair) {
                        return pair[0];
                    })
                    .object()
                    .omit(instance.birthAnimal === instance.data.category ? [] : ['Birth', 'Death'])
                    .value();
            }

            var actionTitles = {
                'Birth': 'Register Births',
                'Death': 'Register Deaths',
                'Deliver': 'Deliver Livestock',
                'Purchase': 'Purchase Livestock',
                'Household': 'Household Consumption',
                'Labour': 'Labour Consumption',
                'Sale': 'Sell Livestock'
            };

            var baseAnimals = {
                'Cattle (Extensive)': 'Cattle',
                'Cattle (Feedlot)': 'Cattle',
                'Cattle (Stud)': 'Cattle',
                'Sheep (Extensive)': 'Sheep',
                'Sheep (Feedlot)': 'Sheep',
                'Sheep (Stud)': 'Sheep'
            };

            var birthAnimals = {
                Cattle: 'Calf',
                Game: 'Calf',
                Goats: 'Kid',
                Rabbits: 'Kit',
                Sheep: 'Lamb'
            };

            var representativeAnimals = {
                Cattle: 'Cow',
                Game: 'Cow',
                Goats: 'Ewe',
                Rabbits: 'Doe',
                Sheep: 'Ewe'
            };

            var animalGrowthStages = {
                Cattle: {
                    'Calf': ['Weaner Calf'],
                    'Weaner Calf': ['Bull', 'Heifer', 'Steer'],
                    'Heifer': ['Cow'],
                    'Cow': [],
                    'Steer': ['Ox'],
                    'Ox': [],
                    'Bull': []
                },
                Game: {
                    'Calf': ['Weaner Calf'],
                    'Weaner Calf': ['Heifer', 'Steer', 'Bull'],
                    'Heifer': ['Cow'],
                    'Cow': [],
                    'Steer': ['Ox'],
                    'Ox': [],
                    'Bull': []
                },
                Goats: {
                    'Kid': ['Weaner Kid'],
                    'Weaner Kid': ['Ewe', 'Castrate', 'Ram'],
                    'Ewe': [],
                    'Castrate': [],
                    'Ram': []
                },
                Rabbits: {
                    'Kit': ['Weaner Kit'],
                    'Weaner Kit': ['Doe', 'Lapin', 'Buck'],
                    'Doe': [],
                    'Lapin': [],
                    'Buck': []
                },
                Sheep: {
                    'Lamb': ['Weaner Lamb'],
                    'Weaner Lamb': ['Ewe', 'Wether', 'Ram'],
                    'Ewe': [],
                    'Wether': [],
                    'Ram': []
                }
            };

            var conversionRate = {
                Cattle: {
                    'Calf': 0.32,
                    'Weaner Calf': 0.44,
                    'Cow': 1.1,
                    'Heifer': 1.1,
                    'Steer': 0.75,
                    'Ox': 1.1,
                    'Bull': 1.36
                },
                Game: {
                    'Calf': 0.32,
                    'Weaner Calf': 0.44,
                    'Cow': 1.1,
                    'Heifer': 1.1,
                    'Steer': 0.75,
                    'Ox': 1.1,
                    'Bull': 1.36
                },
                Goats: {
                    'Kid': 0.08,
                    'Weaner Kid': 0.12,
                    'Ewe': 0.17,
                    'Castrate': 0.17,
                    'Ram': 0.22
                },
                Rabbits: {
                    'Kit': 0.08,
                    'Weaner Kit': 0.12,
                    'Doe': 0.17,
                    'Lapin': 0.17,
                    'Buck': 0.22
                },
                Sheep: {
                    'Lamb': 0.08,
                    'Weaner Lamb': 0.11,
                    'Ewe': 0.16,
                    'Wether': 0.16,
                    'Ram': 0.23
                }
            };

            privateProperty(Livestock, 'getBaseAnimal', function (type) {
                return baseAnimals[type] || type;
            });

            function getBirthingAnimal (type) {
                var baseAnimal = baseAnimals[type] || type;

                return baseAnimal && birthAnimals[baseAnimal];
            }

            privateProperty(Livestock, 'getBirthingAnimal', function (type) {
                return getBirthingAnimal(type);
            });

            function getWeanedAnimal (type) {
                var baseAnimal = baseAnimals[type] || type,
                    birthAnimal = birthAnimals[baseAnimal];

                return birthAnimal && animalGrowthStages[baseAnimal] && underscore.first(animalGrowthStages[baseAnimal][birthAnimal]);
            }

            privateProperty(Livestock, 'getWeanedAnimal', function (type) {
                return getWeanedAnimal(type);
            });

            privateProperty(Livestock, 'getAnimalGrowthStages', function (type) {
                var baseAnimal = baseAnimals[type] || type;

                return baseAnimal && animalGrowthStages[baseAnimal] || [];
            });

            privateProperty(Livestock, 'getConversionRate', function (type, category) {
                var baseAnimal = baseAnimals[type] || type;

                return baseAnimal && conversionRate[baseAnimal] && (conversionRate[baseAnimal][category] || conversionRate[baseAnimal][representativeAnimals[baseAnimal]]);
            });

            privateProperty(Livestock, 'getConversionRates', function (type) {
                var baseAnimal = baseAnimals[type] || type;

                return baseAnimal && conversionRate[baseAnimal] || {};
            });

            privateProperty(Livestock, 'getRepresentativeAnimal', function (type) {
                var baseAnimal = baseAnimals[type] || type;

                return baseAnimal && representativeAnimals[baseAnimal];
            });

            Livestock.validates({
                assetKey: {
                    required: true
                },
                data: {
                    required: true,
                    object: true
                },
                legalEntityId: {
                    required: true,
                    numeric: true
                },
                type: {
                    required: true,
                    equal: {
                        to: 'livestock'
                    }
                }
            });

            return Livestock;
        }];

    AssetFactoryProvider.add('livestock', 'Livestock');
}]);

var sdkModelStock = angular.module('ag.sdk.model.stock', ['ag.sdk.model.asset']);

sdkModelStock.provider('Stock', ['AssetFactoryProvider', function (AssetFactoryProvider) {
    this.$get = ['AssetBase', 'Base', 'computedProperty', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
        function (AssetBase, Base, computedProperty, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
            function Stock (attrs) {
                AssetBase.apply(this, arguments);

                computedProperty(this, 'startMonth', function () {
                    return (underscore.isEmpty(this.data.ledger) ? undefined : moment(underscore.chain(this.data.ledger)
                        .pluck('date')
                        .first()
                        .value(), 'YYYY-MM-DD').date(1));
                });

                computedProperty(this, 'endMonth', function () {
                    return (underscore.isEmpty(this.data.ledger) ? undefined : moment(underscore.chain(this.data.ledger)
                        .pluck('date')
                        .last()
                        .value(), 'YYYY-MM-DD').date(1));
                });

                // Actions
                readOnlyProperty(this, 'actions', {
                    'incoming': [
                        'Production',
                        'Purchase'],
                    'movement': [
                        'Deliver'
                    ],
                    'outgoing': [
                        'Consumption',
                        'Internal',
                        'Household',
                        'Labour',
                        'Repay',
                        'Sale']
                }, {configurable: true});

                readOnlyProperty(this, 'actionTitles', {
                    'Consumption': 'Consume',
                    'Household': 'Household Consumption',
                    'Internal': 'Internal Consumption',
                    'Labour': 'Labour Consumption',
                    'Deliver': 'Deliver',
                    'Production': 'Produce',
                    'Purchase': 'Buy Stock',
                    'Repay': 'Repay Credit',
                    'Sale': 'Sell Stock'
                }, {configurable: true});

                privateProperty(this, 'getActionTitle', function (action) {
                    return this.actionTitles[action];
                }, {configurable: true});

                // Ledger
                function addLedgerEntry (instance, ledgerEntry, options) {
                    if (instance.isLedgerEntryValid(ledgerEntry)) {
                        options = underscore.defaults(options || {}, {
                            checkEntries: true,
                            recalculate: true
                        });

                        instance.data.ledger = underscore.chain(instance.data.ledger)
                            .union([underscore.extend(ledgerEntry, {
                                date: moment(ledgerEntry.date).format('YYYY-MM-DD')
                            })])
                            .sortBy(function (item) {
                                return moment(item.date).valueOf() + getActionGroup(instance, item.action);
                            })
                            .value();
                        instance.$dirty = true;

                        if (options.recalculate) {
                            recalculateAndCache(instance, options);
                        }
                    }
                }

                privateProperty(this, 'addLedgerEntry', function (ledgerEntry, options) {
                    return addLedgerEntry(this, ledgerEntry, options);
                });

                function setLedgerEntry (instance, ledgerEntry, data, options) {
                    if (!underscore.isEqual(data, underscore.pick(ledgerEntry, underscore.keys(data)))) {
                        underscore.extend(ledgerEntry, data);
                        instance.$dirty = true;

                        options = underscore.defaults(options || {}, {
                            checkEntries: false,
                            recalculate: true
                        });

                        if (options.recalculate) {
                            recalculateAndCache(instance, options);
                        }
                    }
                }

                privateProperty(this, 'setLedgerEntry', function (ledgerEntry, data, options) {
                    return setLedgerEntry(this, ledgerEntry, data, options);
                });

                function getActionGroup (instance, action) {
                    var pureAction = asPureAction(action);

                    return underscore.chain(instance.actions)
                        .keys()
                        .filter(function (group) {
                            return underscore.contains(instance.actions[group], pureAction);
                        })
                        .first()
                        .value();
                }

                privateProperty(this, 'getActionGroup', function (action) {
                    return getActionGroup(this, action);
                });

                privateProperty(this, 'findLedgerEntry', function (query) {
                    if (underscore.isObject(query)) {
                        var entry = underscore.findWhere(this.data.ledger, query);

                        return entry || underscore.findWhere(this.data.ledger, {
                            reference: underscore.compact([query.reference, query.action, query.date]).join('/')
                        });
                    }

                    return underscore.findWhere(this.data.ledger, {reference: query});
                });

                privateProperty(this, 'hasLedgerEntries', function () {
                    return this.data.ledger.length > 0;
                });

                privateProperty(this, 'hasQuantityBefore', function (before) {
                    var beforeDate = moment(before, 'YYYY-MM-DD');

                    return !underscore.isUndefined(underscore.chain(this.data.ledger)
                        .filter(function (entry) {
                            return moment(entry.date).isSameOrBefore(beforeDate);
                        })
                        .pluck('quantity')
                        .last()
                        .value());
                });

                privateProperty(this, 'removeLedgerEntry', function (ledgerEntry, options) {
                    options = underscore.defaults(options || {}, {
                        checkEntries: false,
                        markDeleted: false,
                        recalculate: true
                    });

                    if (ledgerEntry) {
                        if (options.markDeleted) {
                            ledgerEntry.deleted = true;
                        } else {
                            this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                                return entry.date === ledgerEntry.date && entry.action === ledgerEntry.action && entry.quantity === ledgerEntry.quantity;
                            });
                            this.$dirty = true;
                        }

                        if (options.recalculate) {
                            recalculateAndCache(this, options);
                        }
                    }
                });

                privateProperty(this, 'generateLedgerEntryReference', function (entry) {
                    return '/' + underscore.compact([entry.action, entry.date]).join('/');
                });

                privateProperty(this, 'removeLedgerEntriesByReference', function (reference, options) {
                    this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                        return s.include(entry.reference, reference);
                    });
                    this.$dirty = true;

                    recalculateAndCache(this, options);
                });

                privateProperty(this, 'inventoryInRange', function (rangeStart, rangeEnd) {
                    return inventoryInRange(this, rangeStart, rangeEnd);
                });

                privateProperty(this, 'inventoryBefore', function (before) {
                    var beforeDate = moment(before, 'YYYY-MM-DD');

                    if (this.startMonth && beforeDate.isSameOrAfter(this.startMonth)) {
                        var numberOfMonths = beforeDate.diff(this.startMonth, 'months');

                        if (underscore.isEmpty(_monthly)) {
                            recalculateAndCache(this);
                        }

                        return _monthly[numberOfMonths] || underscore.last(_monthly);
                    }

                    return openingMonth(this);
                });

                privateProperty(this, 'subtotalInRange', function (actions, rangeStart, rangeEnd) {
                    var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD'),
                        rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD');

                    actions = (underscore.isArray(actions) ? actions : [actions]);

                    return underscore.chain(this.data.ledger)
                        .reject(function (entry) {
                            var entryDate = moment(entry.date);

                            return entry.deleted || !underscore.contains(actions, entry.action) || entryDate.isBefore(rangeStartDate) || entryDate.isSameOrAfter(rangeEndDate);
                        })
                        .reduce(function (result, entry) {
                            result.quantity = safeMath.plus(result.quantity, entry.quantity);
                            result.value = safeMath.plus(result.value, entry.value);
                            result.price = safeMath.dividedBy(result.value, result.quantity);
                            return result;
                        }, {})
                        .value();
                });

                privateProperty(this, 'marketPriceAtDate', function (before) {
                    var beforeDate = moment(before, 'YYYY-MM-DD'),
                        actions = ['Purchase', 'Sale'];

                    return underscore.chain(this.data.ledger)
                        .filter(function (entry) {
                            return !entry.deleted && underscore.contains(actions, entry.action) && moment(entry.date).isSameOrBefore(beforeDate);
                        })
                        .map(function (entry) {
                            return safeMath.dividedBy(entry.value, entry.quantity);
                        })
                        .last()
                        .value() || this.data.pricePerUnit;
                });

                privateProperty(this, 'isLedgerEntryValid', function (item) {
                    return isLedgerEntryValid(this, item);
                });

                privateProperty(this, 'clearLedger', function () {
                    this.data.ledger = [];

                    recalculateAndCache(this);
                });

                privateProperty(this, 'recalculateLedger' ,function (options) {
                    recalculateAndCache(this, options);
                });

                var _monthly = [];

                function balanceEntry (curr, prev) {
                    curr.opening = prev.closing;
                    curr.balance = underscore.mapObject(curr.opening, function (value, key) {
                        return safeMath.chain(value)
                            .plus(underscore.reduce(curr.incoming, function (total, item) {
                                return safeMath.plus(total, item[key]);
                            }, 0))
                            .minus(underscore.reduce(curr.outgoing, function (total, item) {
                                return safeMath.plus(total, item[key]);
                            }, 0))
                            .toNumber();
                    });
                    curr.closing = curr.balance;
                }

                function inventoryInRange(instance, rangeStart, rangeEnd) {
                    var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD').date(1),
                        rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD').date(1),
                        numberOfMonths = rangeEndDate.diff(rangeStartDate, 'months'),
                        appliedStart = (instance.startMonth ? instance.startMonth.diff(rangeStartDate, 'months') : numberOfMonths),
                        appliedEnd = (instance.endMonth ? rangeEndDate.diff(instance.endMonth, 'months') : 0),
                        startCrop = Math.abs(Math.min(0, appliedStart)),
                        openingMonthEntry = openingMonth(instance);

                    if (underscore.isEmpty(_monthly) && !underscore.isEmpty(instance.data.ledger)) {
                        recalculateAndCache(instance);
                    }

                    return underscore.reduce(defaultMonths(Math.max(0, appliedStart))
                            .concat(_monthly)
                            .concat(defaultMonths(Math.max(0, appliedEnd))),
                        function (monthly, curr) {
                            var prev = (monthly.length > 0 ? monthly[monthly.length - 1] : openingMonthEntry);

                            balanceEntry(curr, prev);
                            monthly.push(curr);
                            return monthly;
                        }, [])
                        .slice(startCrop, startCrop + numberOfMonths);
                }

                function recalculate (instance, options) {
                    var startMonth = instance.startMonth,
                        endMonth = instance.endMonth,
                        numberOfMonths = (endMonth ? endMonth.diff(startMonth, 'months') : -1),
                        openingMonthEntry = openingMonth(instance),
                        types = ['incoming', 'movement', 'outgoing'];

                    options = underscore.defaults(options || {}, {
                        checkEntries: false
                    });

                    return underscore.range(numberOfMonths + 1).reduce(function (monthly, offset) {
                        var offsetDate = moment(startMonth).add(offset, 'M'),
                            offsetYear = offsetDate.year(),
                            offsetMonth = offsetDate.month(),
                            prev = (monthly.length > 0 ? monthly[monthly.length - 1] : openingMonthEntry);

                        var curr = underscore.reduce(instance.data.ledger, function (month, entry) {
                            var itemDate = moment(entry.date),
                                pureAction = asPureAction(entry.action);

                            if (!entry.deleted && offsetMonth === itemDate.month() && offsetYear === itemDate.year()) {
                                underscore.each(types, function (type) {
                                    if (underscore.contains(instance.actions[type], pureAction)) {
                                        if (options.checkEntries) {
                                            recalculateEntry(instance, entry);
                                        }

                                        month.entries.push(entry);
                                        month[type][pureAction] = (underscore.isUndefined(month[type][pureAction]) ?
                                            defaultItem(entry.quantity, entry.value) :
                                            underscore.mapObject(month[type][pureAction], function (value, key) {
                                                return safeMath.plus(value, entry[key]);
                                            }));
                                    }
                                });
                            }

                            return month;
                        }, defaultMonth());

                        balanceEntry(curr, prev);
                        monthly.push(curr);
                        return monthly;
                    }, []);
                }

                function recalculateEntry (instance, entry) {
                    if (underscore.isUndefined(entry.price) && !underscore.isUndefined(entry.quantity) && !underscore.isUndefined(instance.data.pricePerUnit)) {
                        entry.price = instance.data.pricePerUnit;
                        entry.value = safeMath.times((entry.rate || 1), safeMath.times(entry.price, entry.quantity));
                    }
                }

                function recalculateAndCache (instance, options) {
                    _monthly = recalculate(instance, options);
                }

                Base.initializeObject(this.data, 'ledger', []);
                Base.initializeObject(this.data, 'openingBalance', 0);


                this.type = 'stock';
            }

            function asPureAction (action) {
                return s.strLeft(action, ':');
            }

            function defaultItem (quantity, value) {
                return {
                    quantity: quantity || 0,
                    value: value || 0
                }
            }

            function defaultMonth (quantity, value) {
                return {
                    opening: defaultItem(quantity, value),
                    incoming: {},
                    movement: {},
                    outgoing: {},
                    entries: [],
                    balance: defaultItem(quantity, value),
                    interest: 0,
                    closing: defaultItem(quantity, value)
                }
            }

            function defaultMonths (size) {
                return underscore.range(size).map(defaultMonth);
            }

            function openingMonth (instance) {
                var quantity = instance.data.openingBalance,
                    value = safeMath.times(instance.data.openingBalance, instance.data.pricePerUnit);

                return defaultMonth(quantity, value);
            }

            function isLedgerEntryValid (instance, item) {
                var pureAction = asPureAction(item.action);
                return item && item.date && moment(item.date).isValid() &&
                    /*underscore.isNumber(item.quantity) && */underscore.isNumber(item.value) &&
                    underscore.contains(underscore.keys(instance.actionTitles), pureAction);
            }

            inheritModel(Stock, AssetBase);

            Stock.validates({
                assetKey: {
                    required: true
                },
                data: {
                    required: true,
                    object: true
                },
                legalEntityId: {
                    required: true,
                    numeric: true
                },
                type: {
                    required: true,
                    inclusion: {
                        in: underscore.keys(AssetBase.assetTypesWithOther)
                    }
                }
            });

            return Stock;
        }];

    AssetFactoryProvider.add('stock', 'Stock');
}]);

angular.module('ag.sdk.model.base', ['ag.sdk.library', 'ag.sdk.model.validation', 'ag.sdk.model.errors', 'ag.sdk.model.store'])
    .factory('Model', ['Base', function (Base) {
        var Model = {};
        Model.Base = Base;
        return Model;
    }])
    .factory('Base', ['deepCopy', 'Errorable', 'privateProperty', 'Storable', 'underscore', 'Validatable', function (deepCopy, Errorable, privateProperty, Storable, underscore, Validatable) {
        function Base () {
            var _constructor = this;

            _constructor.new = function (attrs, options) {
                var inst = new _constructor(attrs, options);

                if (typeof inst.storable === 'function') {
                    inst.storable(attrs);
                }

                return inst;
            };

            _constructor.newCopy = function (attrs, options) {
                return _constructor.new(deepCopy(attrs || {}), options);
            };

            _constructor.getModel = function () {
                return _constructor.constructor;
            };

            _constructor.asJSON = function (omit) {
                var json = deepCopy(this);

                return (omit ? underscore.omit(json, omit) : json);
            };

            _constructor.copy = function () {
                var original = this,
                    copy = {},
                    propertyNames = Object.getOwnPropertyNames(original);

                underscore.each(propertyNames, function (propertyName) {
                    Object.defineProperty(copy, propertyName, Object.getOwnPropertyDescriptor(original, propertyName));
                });

                return copy;
            };

            _constructor.extend = function (Module) {
                var properties = new Module(),
                    propertyNames = Object.getOwnPropertyNames(properties),
                    classPropertyNames = underscore.filter(propertyNames, function (propertyName) {
                        return propertyName.slice(0, 2) !== '__';
                    });

                underscore.each(classPropertyNames, function (classPropertyName) {
                    Object.defineProperty(this, classPropertyName, Object.getOwnPropertyDescriptor(properties, classPropertyName));
                }, this);
            };

            _constructor.include = function (Module) {
                var methods = new Module(),
                    propertyNames = Object.getOwnPropertyNames(methods),
                    instancePropertyNames = underscore.filter(propertyNames, function (propertyName) {
                        return propertyName.slice(0, 2) === '__';
                    }),
                    oldConstructor = this.new;

                this.new = function () {
                    var instance = oldConstructor.apply(this, arguments);

                    underscore.each(instancePropertyNames, function (instancePropertyName) {
                        Object.defineProperty(instance, instancePropertyName.slice(2), Object.getOwnPropertyDescriptor(methods, instancePropertyName));
                    });

                    return instance;
                };
            };

            _constructor.extend(Validatable);
            _constructor.extend(Storable);
            _constructor.include(Validatable);
            _constructor.include(Errorable);
            _constructor.include(Storable);
        }

        privateProperty(Base, 'initializeArray', function (length, defaultValue) {
            return underscore.range(length).map(function () {
                return defaultValue || 0;
            });
        });

        privateProperty(Base, 'initializeObject', function (object, property, defaultValue) {
            object[property] = (object[property] && Object.prototype.toString.call(object[property]) === Object.prototype.toString.call(defaultValue))
                ? object[property]
                : defaultValue;
        });

        return Base;
    }])
    .factory('computedProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                get: value
            }));
        }
    }])
    .factory('readOnlyProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                writable: false,
                value: value
            }));
        }
    }])
    .factory('inheritModel', ['underscore', function (underscore) {
        return function (object, base) {
            base.apply(object);

            // Apply defined properties to extended object
            underscore.each(Object.getOwnPropertyNames(base), function (name) {
                var descriptor = Object.getOwnPropertyDescriptor(base, name);

                if (underscore.isUndefined(object[name]) && descriptor) {
                    Object.defineProperty(object, name, descriptor);
                }
            });
        }
    }])
    .factory('privateProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            var val;

            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                enumerable: false,
                configurable: false,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            }));

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }])
    .factory('interfaceProperty', ['underscore', function (underscore) {
        return function (object, name, value, config) {
            var val;

            Object.defineProperty(object, name, underscore.defaults(config || {}, {
                enumerable: false,
                configurable: true,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    val = newVal;
                }
            }));

            if (value !== undefined) {
                object[name] = value;
            }
        }
    }]);
var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule', 'ag.sdk.model.stock']);

sdkModelBusinessPlanDocument.provider('BusinessPlan', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['asJson', 'AssetFactory', 'Base', 'computedProperty', 'Document', 'EnterpriseBudget', 'Financial', 'FinancialGroup', 'generateUUID', 'inheritModel', 'Liability', 'Livestock', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'Stock', 'underscore',
        function (asJson, AssetFactory, Base, computedProperty, Document, EnterpriseBudget, Financial, FinancialGroup, generateUUID, inheritModel, Liability, Livestock, privateProperty, ProductionSchedule, readOnlyProperty, safeArrayMath, safeMath, Stock, underscore) {
            var _version = 17;

            function BusinessPlan (attrs) {
                Document.apply(this, arguments);

                this.docType = 'financial resource plan';

                this.data.startDate = moment(this.data.startDate).format('YYYY-MM-DD');
                this.data.endDate = moment(this.data.startDate).add(2, 'y').format('YYYY-MM-DD');

                Base.initializeObject(this.data, 'account', {});
                Base.initializeObject(this.data, 'models', {});
                Base.initializeObject(this.data, 'adjustmentFactors', {});
                Base.initializeObject(this.data, 'assetStatement', {});
                Base.initializeObject(this.data, 'liabilityStatement', {});

                Base.initializeObject(this.data.assetStatement, 'total', {});
                Base.initializeObject(this.data.liabilityStatement, 'total', {});

                Base.initializeObject(this.data.account, 'monthly', []);
                Base.initializeObject(this.data.account, 'yearly', []);
                Base.initializeObject(this.data.account, 'openingBalance', 0);
                Base.initializeObject(this.data.account, 'interestRateCredit', 0);
                Base.initializeObject(this.data.account, 'interestRateDebit', 0);
                Base.initializeObject(this.data.account, 'depreciationRate', 0);

                Base.initializeObject(this.data.models, 'assets', []);
                Base.initializeObject(this.data.models, 'budgets', []);
                Base.initializeObject(this.data.models, 'expenses', []);
                Base.initializeObject(this.data.models, 'financials', []);
                Base.initializeObject(this.data.models, 'income', []);
                Base.initializeObject(this.data.models, 'liabilities', []);
                Base.initializeObject(this.data.models, 'productionSchedules', []);

                function reEvaluateBusinessPlan (instance) {
                    recalculate(instance);
                    recalculateRatios(instance);
                }

                /**
                 * Production Schedule handling
                 */
                privateProperty(this, 'updateProductionSchedules', function (schedules, options) {
                    updateProductionSchedules(this, schedules, options);
                });

                function updateProductionSchedules (instance, schedules, options) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        oldSchedules = underscore.map(instance.models.productionSchedules, ProductionSchedule.newCopy);

                    options = underscore.defaults(options || {}, {
                        extractStockAssets: true
                    });

                    instance.models.productionSchedules = [];

                    underscore.chain(schedules)
                        .map(function (schedule) {
                            return (schedule instanceof ProductionSchedule ? schedule : ProductionSchedule.newCopy(schedule));
                        })
                        .sortBy(function (schedule) {
                            return moment(schedule.startDate).valueOf();
                        })
                        .each(function (schedule) {
                            // Add valid production schedule if between business plan dates
                            if (schedule.validate() && (startMonth.isBetween(schedule.startDate, schedule.endDate) || (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                                if (options.extractStockAssets) {
                                    extractProductionScheduleStockAssets(instance, schedule);
                                }

                                instance.models.productionSchedules.push(asJson(schedule));

                                oldSchedules = underscore.reject(oldSchedules, function (oldSchedule) {
                                    return oldSchedule.scheduleKey === schedule.scheduleKey;
                                });
                            }
                        });

                    if (oldSchedules.length > 0) {
                        var stockTypes = ['livestock', 'stock'],
                            stockAssets = underscore.chain(instance.models.assets)
                            .filter(function (asset) {
                                return underscore.contains(stockTypes, asset.type);
                            })
                            .map(AssetFactory.newCopy)
                            .value();

                        underscore.each(oldSchedules, function (oldSchedule) {
                            underscore.each(stockAssets, function (stock) {
                                stock.removeLedgerEntriesByReference(oldSchedule.scheduleKey);

                                addStockAsset(instance, stock);
                            });
                        });
                    }

                    updateBudgets(instance);
                    reEvaluateBusinessPlan(instance);
                }

                function initializeCategoryValues (instance, section, category, length) {
                    instance.data[section] = instance.data[section] || {};
                    instance.data[section][category] = instance.data[section][category] || Base.initializeArray(length);
                }

                function getLowerIndexBound (scheduleArray, offset) {
                    return (scheduleArray ? Math.min(scheduleArray.length, Math.abs(Math.min(0, offset))) : 0);
                }

                function getUpperIndexBound (scheduleArray, offset, numberOfMonths) {
                    return (scheduleArray ? Math.min(numberOfMonths, offset + scheduleArray.length) - offset : 0);
                }

                function extractProductionScheduleCategoryValuePerMonth(dataStore, schedule, code, startMonth, numberOfMonths, forceCategory) {
                    var section = underscore.findWhere(schedule.data.sections, {code: code}),
                        scheduleStart = moment(schedule.startDate, 'YYYY-MM-DD'),
                        enterprise = schedule.data.details.commodity;

                    if (section) {
                        var offset = scheduleStart.diff(startMonth, 'months');

                        angular.forEach(section.productCategoryGroups, function (group) {
                            var dataCategory = 'enterpriseProduction' + (code === 'INC' ? 'Income' : 'Expenditure');

                            angular.forEach(group.productCategories, function (category) {
                                // Ignore stockable categories
                                if (!underscore.contains(EnterpriseBudget.stockableCategoryCodes, category.code)) {
                                    var categoryName = (!forceCategory && (schedule.type !== 'livestock' && code === 'INC') ? schedule.data.details.commodity : category.name),
                                        index = getLowerIndexBound(category.valuePerMonth, offset),
                                        maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);

                                    Base.initializeObject(dataStore[dataCategory], enterprise, {});
                                    dataStore[dataCategory][enterprise][categoryName] = dataStore[dataCategory][enterprise][categoryName] || Base.initializeArray(numberOfMonths);

                                    for (; index < maxIndex; index++) {
                                        dataStore[dataCategory][enterprise][categoryName][index + offset] = safeMath.plus(dataStore[dataCategory][enterprise][categoryName][index + offset], category.valuePerMonth[index]);
                                    }
                                }
                            });
                        });
                    }
                }

                function findStockAsset (instance, assetType, stockType, categoryName) {
                    return underscore.find(instance.models.assets, function (asset) {
                        return (underscore.isUndefined(assetType) || asset.type === assetType) &&
                            (underscore.isUndefined(categoryName) || asset.data.category === categoryName) &&
                            (underscore.isUndefined(stockType) || asset.data.type === stockType);
                    });
                }

                function stockPicker (instance) {
                    return function (type, stockType, category, priceUnit, quantityUnit) {
                        var stock = AssetFactory.new(findStockAsset(instance, type, stockType, category) || {
                            type: type,
                            legalEntityId: underscore.chain(instance.data.legalEntities)
                                .where({isPrimary: true})
                                .pluck('id')
                                .first()
                                .value(),
                            data: underscore.extend({
                                category: category,
                                priceUnit: priceUnit,
                                quantityUnit: quantityUnit
                            }, (underscore.isUndefined(stockType) ? {} : {
                                type: stockType
                            }))
                        });

                        stock.generateKey(underscore.findWhere(instance.data.legalEntities, {id: stock.legalEntityId}));

                        addStockAsset(instance, stock, true);

                        return stock;
                    }
                }

                function addStockAsset (instance, stock, force) {
                    instance.models.assets = underscore.reject(instance.models.assets, function (asset) {
                        return asset.assetKey === stock.assetKey;
                    });

                    if (force || stock.hasLedgerEntries()) {
                        instance.models.assets.push(asJson(stock));
                    }
                }

                function extractProductionScheduleStockAssets (instance, productionSchedule) {
                    var inventory = productionSchedule.extractStock(stockPicker(instance));

                    underscore.each(inventory, function (stock) {
                        addStockAsset(instance, stock, true);
                    });
                }

                function calculateYearlyProductionIncomeComposition(productionIncomeComposition, year) {
                    var yearlyComposition = underscore.mapObject(productionIncomeComposition, function (monthlyComposition) {
                        return underscore.reduce(monthlyComposition.slice((year - 1) * 12, year * 12), function (yearly, consumption) {
                            yearly.unit = consumption.unit;
                            yearly.value = safeMath.plus(yearly.value, consumption.value);
                            yearly.quantity = safeMath.plus(yearly.quantity, consumption.quantity);
                            yearly.pricePerUnit = safeMath.dividedBy(yearly.value, yearly.quantity);

                            return yearly;
                        }, {
                            quantity: 0,
                            value: 0
                        });
                    });

                    yearlyComposition.total = {
                        value: safeArrayMath.reduce(underscore.chain(yearlyComposition)
                            .values()
                            .pluck('value')
                            .value()) || 0
                    };

                    underscore.each(yearlyComposition, function(consumption, enterprise) {
                        consumption.percent = (enterprise !== 'total' ? safeMath.times(safeMath.dividedBy(100, yearlyComposition.total.value), consumption.value) : 100);
                    });

                    return yearlyComposition;
                }

                function reEvaluateProductionSchedules (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        numberOfMonths = instance.numberOfMonths;

                    // Indirect production income & expenses
                    underscore.chain(instance.models.income)
                        .where({type: 'production'})
                        .each(function (income) {
                            Base.initializeObject(instance.data.enterpriseProductionIncome, 'Indirect', {});
                            Base.initializeObject(instance.data.enterpriseProductionIncome['Indirect'], income.name, Base.initializeArray(numberOfMonths, 0));
                            instance.data.enterpriseProductionIncome['Indirect'][income.name] = safeArrayMath.plus(instance.data.enterpriseProductionIncome['Indirect'][income.name], income.months);
                        });

                    underscore.chain(instance.models.expenses)
                        .where({type: 'production'})
                        .each(function (expense) {
                            Base.initializeObject(instance.data.enterpriseProductionExpenditure, 'Indirect', {});
                            Base.initializeObject(instance.data.enterpriseProductionExpenditure['Indirect'], expense.name, Base.initializeArray(numberOfMonths, 0));
                            instance.data.enterpriseProductionExpenditure['Indirect'][expense.name] = safeArrayMath.plus(instance.data.enterpriseProductionExpenditure['Indirect'][expense.name], expense.months);
                        });

                    // Production income & expenses
                    angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                        var schedule = ProductionSchedule.new(productionSchedule);

                        extractProductionScheduleCategoryValuePerMonth(instance.data, schedule, 'INC', startMonth, numberOfMonths, true);
                        extractProductionScheduleCategoryValuePerMonth(instance.data, schedule, 'EXP', startMonth, numberOfMonths, true);
                    });
                }

                function reEvaluateProductionIncomeAndExpenditure (instance, numberOfMonths) {
                    instance.data.productionIncome = underscore.extend(instance.data.productionIncome, underscore.reduce(instance.data.enterpriseProductionIncome, function (results, groupedValues) {
                        return underscore.reduce(groupedValues, function (totals, values, group) {
                            Base.initializeObject(totals, group, Base.initializeArray(numberOfMonths, 0));
                            totals[group] = safeArrayMath.plus(totals[group], values);
                            return totals;
                        }, results);
                    }, {}));

                    instance.data.productionExpenditure = underscore.extend(instance.data.productionExpenditure, underscore.reduce(instance.data.enterpriseProductionExpenditure, function (results, groupedValues) {
                        return underscore.reduce(groupedValues, function (totals, values, group) {
                            Base.initializeObject(totals, group, Base.initializeArray(numberOfMonths, 0));
                            totals[group] = safeArrayMath.plus(totals[group], values);
                            return totals;
                        }, results);
                    }, {}));

                    instance.data.unallocatedProductionIncome = instance.data.productionIncome;
                    instance.data.unallocatedProductionExpenditure = instance.data.productionExpenditure;
                }

                /**
                 * Income & Expenses handling
                 */
                function addIncomeExpense (instance, type, item) {
                    instance.models[type] = underscore.reject(instance.models[type], function (modelItem) {
                        return modelItem.uuid === item.uuid;
                    });

                    instance.models[type].push(item);

                    reEvaluateBusinessPlan(instance);
                }

                function removeIncomeExpense (instance, type, item) {
                    instance.models[type] = underscore.reject(instance.models[type], function (modelItem) {
                        return modelItem.uuid === item.uuid;
                    });

                    reEvaluateBusinessPlan(instance);
                }

                privateProperty(this, 'addIncome', function (income) {
                    addIncomeExpense(this, 'income', income);
                });

                privateProperty(this, 'removeIncome', function (income) {
                    removeIncomeExpense(this, 'income', income);
                });

                privateProperty(this, 'addExpense', function (expense) {
                    addIncomeExpense(this, 'expenses', expense);
                });

                privateProperty(this, 'removeExpense', function (expense) {
                    removeIncomeExpense(this, 'expenses', expense);
                });

                function reEvaluateIncomeAndExpenses (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        numberOfMonths = endMonth.diff(startMonth, 'months'),
                        evaluatedModels = [];

                    underscore.each(instance.models.income, function (income) {
                        var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: income.legalEntityId}),
                            evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: income.uuid}),
                            type = (income.type ? income.type : 'other') + 'Income';

                        // Check income is not already added
                        if (income.type !== 'production' && registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                            initializeCategoryValues(instance, type, income.name, numberOfMonths);

                            instance.data[type][income.name] = underscore.map(income.months, function (monthValue, index) {
                                return safeMath.plus(monthValue, instance.data[type][income.name][index]);
                            });

                            evaluatedModels.push(income);
                        }
                    });

                    underscore.each(instance.models.expenses, function (expense) {
                        var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: expense.legalEntityId}),
                            evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: expense.uuid}),
                            type = (expense.type ? expense.type : 'other') + 'Expenditure';

                        // Check expense is not already added
                        if (expense.type !== 'production' && registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                            initializeCategoryValues(instance, type, expense.name, numberOfMonths);

                            instance.data[type][expense.name] = underscore.map(expense.months, function (monthValue, index) {
                                return safeMath.plus(monthValue, instance.data[type][expense.name][index]);
                            });

                            evaluatedModels.push(expense);
                        }
                    });
                }

                /**
                 * Financials
                 */
                privateProperty(this, 'updateFinancials', function (financials) {
                    this.models.financials = underscore.filter(financials, function (financial) {
                        return Financial.new(financial).validate();
                    });

                    this.data.consolidatedFinancials = underscore.chain(this.models.financials)
                        .groupBy('year')
                        .map(function (groupedFinancials) {
                            return asJson(FinancialGroup.new({
                                financials: groupedFinancials
                            }), ['financials']);
                        })
                        .sortBy('year')
                        .last(3)
                        .value();
                });

                /**
                 *   Assets & Liabilities Handling
                 */
                privateProperty(this, 'addAsset', function (asset) {
                    var instance = this,
                        oldAsset = underscore.findWhere(instance.models.assets, {assetKey: asset.assetKey});

                    asset = AssetFactory.new(asset);

                    if (asset.validate()) {
                        // Remove the old asset's liabilities if we are updating an existing asset
                        if (!underscore.isUndefined(oldAsset)) {
                            instance.models.liabilities = underscore.reject(instance.models.liabilities, function (liability) {
                                return underscore.findWhere(oldAsset.liabilities, {uuid: liability.uuid});
                            });
                        }

                        // Remove the asset
                        instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                            return item.assetKey === asset.assetKey;
                        });

                        // Add the new asset's liabilities
                        asset.liabilities = underscore.chain(asset.liabilities)
                            .map(function (liability) {
                                if (liability.validate()) {
                                    instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                                        return item.uuid === liability.uuid;
                                    });

                                    if (liability.$delete === false) {
                                        instance.models.liabilities.push(asJson(liability));
                                    }
                                }

                                return asJson(liability);
                            })
                            .value();

                        // Add the new asset
                        instance.models.assets.push(asJson(asset));

                        reEvaluateBusinessPlan(instance);
                    }
                });

                privateProperty(this, 'removeAsset', function (asset) {
                    var instance = this;

                    instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    underscore.each(asset.liabilities, function (liability) {
                        instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                            return item.uuid === liability.uuid;
                        });
                    });

                    reEvaluateBusinessPlan(instance);
                });

                privateProperty(this, 'addLiability', function (liability) {
                    liability = Liability.new(liability);

                    if (liability.validate()) {
                        this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                            return item.uuid === liability.uuid;
                        });

                        this.models.liabilities.push(asJson(liability));

                        reEvaluateBusinessPlan(this);
                    }
                });

                privateProperty(this, 'removeLiability', function (liability) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    reEvaluateBusinessPlan(this);
                });

                function reEvaluateProductionCredit(instance) {
                    instance.data.unallocatedEnterpriseProductionExpenditure = angular.copy(instance.data.enterpriseProductionExpenditure);
                    instance.data.unallocatedProductionExpenditure = angular.copy(instance.data.productionExpenditure);

                    underscore.chain(instance.data.models.liabilities)
                        .where({type: 'production-credit'})
                        .map(Liability.newCopy)
                        .each(function (liability) {
                            underscore.each(liability.liabilityInRange(instance.startDate, instance.endDate), function (monthly, index) {
                                underscore.each(liability.data.enterprises, function (enterprise) {
                                    underscore.each(liability.data.inputs, function (input) {
                                        Base.initializeObject(instance.data.unallocatedEnterpriseProductionExpenditure[enterprise], input, Base.initializeArray(instance.numberOfMonths, 0));
                                        Base.initializeObject(instance.data.unallocatedProductionExpenditure, input, Base.initializeArray(instance.numberOfMonths, 0));

                                        instance.data.unallocatedEnterpriseProductionExpenditure[enterprise][input][index] = Math.max(0, safeMath.minus(instance.data.unallocatedEnterpriseProductionExpenditure[enterprise][input][index], monthly.withdrawal));
                                        instance.data.unallocatedProductionExpenditure[input][index] = Math.max(0, safeMath.minus(instance.data.unallocatedProductionExpenditure[input][index], monthly.withdrawal));
                                    });
                                });
                            });
                        });
                }

                privateProperty(this, 'reEvaluateProductionCredit', function (liabilities) {
                    return reEvaluateProductionCredit(this, liabilities);
                });

                function updateAssetStatementCategory(instance, category, name, asset) {
                    asset.data.assetValue = asset.data.assetValue || 0;

                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears,
                        assetCategory = underscore.findWhere(instance.data.assetStatement[category], {name: name}) || {
                            name: name,
                            estimatedValue: 0,
                            marketValue: 0,
                            monthly: {
                                depreciation: Base.initializeArray(numberOfMonths),
                                marketValue: Base.initializeArray(numberOfMonths)
                            },
                            yearly: {
                                depreciation: Base.initializeArray(numberOfYears),
                                marketValue: Base.initializeArray(numberOfYears)
                            },
                            assets: []
                        };

                    if (!underscore.findWhere(assetCategory.assets, {assetKey: asset.assetKey})) {
                        assetCategory.assets.push(asJson(asset, ['liabilities', 'productionSchedules']));
                    }

                    if (!asset.data.acquisitionDate || startMonth.isAfter(asset.data.acquisitionDate)) {
                        assetCategory.estimatedValue = safeMath.plus(assetCategory.estimatedValue, asset.data.assetValue);
                    }

                    instance.data.assetStatement[category] = underscore.chain(instance.data.assetStatement[category])
                        .reject(function (item) {
                            return item.name === assetCategory.name;
                        })
                        .union([assetCategory])
                        .value()
                        .sort(function (a, b) {
                            return naturalSort(a.name, b.name);
                        });
                }

                function updateLiabilityStatementCategory(instance, liability) {
                    var category = (liability.type === 'production-credit' ? 'medium-term' : (liability.type === 'rent' ? 'short-term' : liability.type)),
                        name = (liability.type === 'production-credit' ? 'Production Credit' : (liability.type === 'rent' ? 'Rent overdue' : liability.category || liability.name)),
                        numberOfYears = instance.numberOfYears,
                        liabilityCategory = underscore.findWhere(instance.data.liabilityStatement[category], {name: name}) || {
                            name: name,
                            currentValue: 0,
                            yearlyValues: Base.initializeArray(numberOfYears),
                            liabilities: []
                        };

                    liabilityCategory.currentValue = safeMath.plus(liabilityCategory.currentValue, liability.liabilityInMonth(instance.startDate).opening);

                    if (!underscore.findWhere(liabilityCategory.liabilities, {uuid: liability.uuid})) {
                        liabilityCategory.liabilities.push(asJson(liability));
                    }

                    // Calculate total year-end values for liability category
                    for (var year = 0; year < numberOfYears; year++) {
                        var yearEnd = moment.min(moment(instance.endDate, 'YYYY-MM-DD'), moment(instance.startDate, 'YYYY-MM-DD').add(year, 'years').add(11, 'months'));
                        liabilityCategory.yearlyValues[year] = safeMath.plus(liabilityCategory.yearlyValues[year], liability.liabilityInMonth(yearEnd).closing);
                    }

                    instance.data.liabilityStatement[category] = underscore.chain(instance.data.liabilityStatement[category])
                        .reject(function (item) {
                            return item.name === liabilityCategory.name;
                        })
                        .union([liabilityCategory])
                        .value()
                        .sort(function (a, b) {
                            return naturalSort(a.name, b.name);
                        });
                }

                function recalculateAssetStatement (instance) {
                    var ignoredItems = ['Bank Capital', 'Bank Overdraft'],
                        depreciationRatePerMonth = safeMath.chain(instance.data.account.depreciationRate || 0)
                            .dividedBy(100)
                            .dividedBy(12)
                            .toNumber();

                    angular.forEach(instance.data.assetStatement, function (statementItems, category) {
                        if (category !== 'total') {
                            angular.forEach(statementItems, function (item) {
                                if (!underscore.contains(ignoredItems, item.name)) {
                                    var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1,
                                        assetMarketValue = instance.data.assetMarketValue[item.name] || Base.initializeArray(instance.numberOfMonths),
                                        assetStockValue = instance.data.assetStockValue[item.name],
                                        capitalExpenditure = instance.data.capitalExpenditure[item.name] || Base.initializeArray(instance.numberOfMonths);

                                    item.marketValue = safeMath.times(item.estimatedValue, adjustmentFactor);

                                    item.monthly.marketValue = (underscore.isArray(assetStockValue) ?
                                        assetStockValue :
                                        underscore.map(item.monthly.marketValue, function (value, index) {
                                            return safeMath.chain(item.marketValue)
                                                .minus(safeArrayMath.reduce(assetMarketValue.slice(0, index)))
                                                .plus(safeArrayMath.reduce(capitalExpenditure.slice(0, index)))
                                                .toNumber();
                                        }));

                                    item.monthly.depreciation = underscore.map(item.monthly.marketValue, function (value) {
                                        return (item.name !== 'Vehicles, Machinery & Equipment' ? 0 : safeMath.times(value, depreciationRatePerMonth));
                                    });
                                    item.monthly.marketValue = safeArrayMath.minus(item.monthly.marketValue, assetMarketValue);

                                    item.yearly.depreciation = [calculateYearlyTotal(item.monthly.depreciation, 1), calculateYearlyTotal(item.monthly.depreciation, 2)];
                                    item.yearly.marketValue = [calculateEndOfYearValue(item.monthly.marketValue, 1), calculateEndOfYearValue(item.monthly.marketValue, 2)];
                                }
                            });
                        }
                    });
                }

                function totalAssetsAndLiabilities(instance) {
                    var numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears;

                    instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                        .omit('total')
                        .values()
                        .flatten(true)
                        .reduce(function(result, asset) {
                            result.estimatedValue = safeMath.plus(result.estimatedValue, asset.estimatedValue);
                            result.marketValue = safeMath.plus(result.marketValue, asset.marketValue);
                            result.monthly.depreciation = safeArrayMath.plus(result.monthly.depreciation, asset.monthly.depreciation);
                            result.monthly.marketValue = safeArrayMath.plus(result.monthly.marketValue, asset.monthly.marketValue);
                            result.yearly.depreciation = safeArrayMath.plus(result.yearly.depreciation, asset.yearly.depreciation);
                            result.yearly.marketValue = safeArrayMath.plus(result.yearly.marketValue, asset.yearly.marketValue);
                            return result;
                        }, {
                            estimatedValue: 0,
                            marketValue: 0,
                            monthly: {
                                depreciation: Base.initializeArray(numberOfMonths),
                                marketValue: Base.initializeArray(numberOfMonths)
                            },
                            yearly: {
                                depreciation: Base.initializeArray(numberOfYears),
                                marketValue: Base.initializeArray(numberOfYears)
                            }
                        })
                        .value();

                    instance.data.liabilityStatement.total = underscore.chain(instance.data.liabilityStatement)
                        .omit('total')
                        .values()
                        .flatten(true)
                        .reduce(function(result, liability) {
                            result.currentValue = safeMath.plus(result.currentValue, liability.currentValue);
                            result.yearlyValues = safeArrayMath.plus(result.yearlyValues, liability.yearlyValues);
                            return result;
                        }, {
                            currentValue: 0,
                            yearlyValues: Base.initializeArray(numberOfYears)
                        })
                        .value();
                }

                function reEvaluateAssetsAndLiabilities (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        numberOfMonths = endMonth.diff(startMonth, 'months'),
                        evaluatedModels = [],
                        monthDiff = 0;

                    var assetRank = {
                        'cropland': 1,
                        'pasture': 1,
                        'permanent crop': 1,
                        'plantation': 1,
                        'wasteland': 1,
                        'farmland': 2
                    };

                    underscore.chain(instance.models.assets)
                        .sortBy(function (asset) {
                            return assetRank[asset.type] || 0;
                        })
                        .each(function (asset) {
                            var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                                evaluatedAsset = underscore.findWhere(evaluatedModels, {assetKey: asset.assetKey});

                            // Check asset is not already added
                            if (registerLegalEntity && underscore.isUndefined(evaluatedAsset)) {
                                evaluatedModels.push(asset);

                                asset = AssetFactory.new(asset);

                                var acquisitionDate = (asset.data.acquisitionDate ? moment(asset.data.acquisitionDate) : undefined),
                                    soldDate = (asset.data.soldDate ? moment(asset.data.soldDate) : undefined),
                                    constructionDate = (asset.data.constructionDate ? moment(asset.data.constructionDate) : undefined),
                                    demolitionDate = (asset.data.demolitionDate ? moment(asset.data.demolitionDate) : undefined);

                                // VME
                                if (asset.type === 'vme') {
                                    if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = acquisitionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicles, Machinery & Equipment', numberOfMonths);

                                        instance.data.capitalExpenditure['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Vehicles, Machinery & Equipment'][monthDiff], asset.data.assetValue);
                                    }

                                    if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = soldDate.diff(startMonth, 'months');

                                        var value = safeMath.minus(asset.data.assetValue, safeMath.chain(instance.data.account.depreciationRate || 0)
                                            .dividedBy(100)
                                            .dividedBy(12)
                                            .times(asset.data.assetValue)
                                            .times(acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth) ?
                                                soldDate.diff(acquisitionDate, 'months') :
                                                monthDiff + 1)
                                            .toNumber());

                                        initializeCategoryValues(instance, 'assetMarketValue', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalIncome', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalProfit', 'Vehicles, Machinery & Equipment', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalLoss', 'Vehicles, Machinery & Equipment', numberOfMonths);

                                        instance.data.assetMarketValue['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.assetMarketValue['Vehicles, Machinery & Equipment'][monthDiff], safeMath.plus(asset.data.assetValue, value));
                                        instance.data.capitalIncome['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalIncome['Vehicles, Machinery & Equipment'][monthDiff], asset.data.salePrice);
                                        instance.data.capitalProfit['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalProfit['Vehicles, Machinery & Equipment'][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, value)));
                                        instance.data.capitalLoss['Vehicles, Machinery & Equipment'][monthDiff] = safeMath.plus(instance.data.capitalLoss['Vehicles, Machinery & Equipment'][monthDiff], Math.max(0, safeMath.minus(value, asset.data.salePrice)));
                                    }
                                } else if (asset.type === 'improvement') {
                                    if (asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = constructionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Fixed Improvements', numberOfMonths);

                                        instance.data.capitalExpenditure['Fixed Improvements'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Fixed Improvements'][monthDiff], asset.data.assetValue);
                                    }
                                } else if (asset.type === 'stock') {
                                    underscore.each(asset.inventoryInRange(startMonth, endMonth), function (monthly, index) {
                                        initializeCategoryValues(instance, 'assetStockValue', 'Stock On Hand', numberOfMonths);
                                        instance.data.assetStockValue['Stock On Hand'][index] = safeMath.plus(instance.data.assetStockValue['Stock On Hand'][index], monthly.closing.value);

                                        underscore.each(monthly.entries, function (entry) {
                                            var commodity = entry.commodity || 'Indirect';

                                            switch (entry.action) {
                                                case 'Household':
                                                    initializeCategoryValues(instance, 'otherExpenditure', 'Farm Products Consumed', numberOfMonths);
                                                    instance.data.otherExpenditure['Farm Products Consumed'][index] = safeMath.plus(instance.data.otherExpenditure['Farm Products Consumed'][index], entry.value);
                                                    break;
                                                case 'Labour':
                                                    Base.initializeObject(instance.data.enterpriseProductionExpenditure, commodity, {});
                                                    instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'] = instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'] || Base.initializeArray(numberOfMonths);
                                                    instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[commodity]['Farm Products Consumed'][index], entry.value);
                                                    break;
                                                case 'Purchase':
                                                    Base.initializeObject(instance.data.enterpriseProductionExpenditure, commodity, {});
                                                    instance.data.enterpriseProductionExpenditure[commodity][asset.data.category] = instance.data.enterpriseProductionExpenditure[commodity][asset.data.category] || Base.initializeArray(numberOfMonths);
                                                    instance.data.enterpriseProductionExpenditure[commodity][asset.data.category][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[commodity][asset.data.category][index], entry.value);
                                                    break;
                                                case 'Sale':
                                                    // Stock Production Income
                                                    Base.initializeObject(instance.data.enterpriseProductionIncome, commodity, {});
                                                    instance.data.enterpriseProductionIncome[commodity]['Crop Sales'] = instance.data.enterpriseProductionIncome[commodity]['Crop Sales'] || Base.initializeArray(numberOfMonths);
                                                    instance.data.enterpriseProductionIncome[commodity]['Crop Sales'][index] = safeMath.plus(instance.data.enterpriseProductionIncome[commodity]['Crop Sales'][index], entry.value);

                                                    // Composition
                                                    instance.data.productionIncomeComposition[asset.data.category] = instance.data.productionIncomeComposition[asset.data.category] || underscore.range(numberOfMonths).map(function () {
                                                        return {
                                                            unit: asset.data.quantityUnit || asset.data.priceUnit,
                                                            quantity: 0,
                                                            value: 0
                                                        };
                                                    });

                                                    var compositionMonth = instance.data.productionIncomeComposition[asset.data.category][index];
                                                    compositionMonth.value = safeMath.plus(compositionMonth.value, entry.value);
                                                    compositionMonth.quantity = safeMath.plus(compositionMonth.quantity, entry.quantity);
                                                    compositionMonth.pricePerUnit = safeMath.dividedBy(compositionMonth.value, compositionMonth.quantity);
                                                    break;
                                            }
                                        });

                                        if (index === 0) {
                                            updateAssetStatementCategory(instance, 'short-term', 'Stock On Hand', {
                                                data: {
                                                    name: asset.data.category,
                                                    liquidityType: 'short-term',
                                                    assetValue: monthly.opening.value,
                                                    reference: 'production/crop'
                                                }
                                            });
                                        }
                                    });
                                } else if (asset.type === 'livestock') {
                                    var monthlyLedger = asset.inventoryInRange(startMonth, endMonth),
                                        birthingAnimal = EnterpriseBudget.getBirthingAnimal(asset.data.type);

                                    underscore.each(monthlyLedger, function (ledger, index) {
                                        var offsetDate = moment(instance.startDate, 'YYYY-MM-DD').add(index, 'M'),
                                            stockValue = safeMath.times(ledger.closing.quantity, asset.marketPriceAtDate(offsetDate));

                                        if (birthingAnimal === asset.data.category) {
                                            initializeCategoryValues(instance, 'assetStockValue', 'Marketable Livestock', numberOfMonths);
                                            instance.data.assetStockValue['Marketable Livestock'][index] = safeMath.plus(instance.data.assetStockValue['Marketable Livestock'][index], stockValue);
                                        } else {
                                            initializeCategoryValues(instance, 'assetStockValue', 'Breeding Stock', numberOfMonths);
                                            instance.data.assetStockValue['Breeding Stock'][index] = safeMath.plus(instance.data.assetStockValue['Breeding Stock'][index], stockValue);
                                        }

                                        underscore.chain(ledger)
                                            .pick(['incoming', 'outgoing'])
                                            .each(function (actions) {
                                                underscore.each(actions, function (item, action) {
                                                    switch (action) {
                                                        case 'Household':
                                                            initializeCategoryValues(instance, 'otherExpenditure', 'Farm Products Consumed', numberOfMonths);
                                                            instance.data.otherExpenditure['Farm Products Consumed'][index] = safeMath.plus(instance.data.otherExpenditure['Farm Products Consumed'][index], item.value);
                                                            break;
                                                        case 'Labour':
                                                            Base.initializeObject(instance.data.enterpriseProductionExpenditure, asset.data.type, {});
                                                            instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'] = instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'] || Base.initializeArray(numberOfMonths);
                                                            instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'][index] = safeMath.plus(instance.data.enterpriseProductionExpenditure[asset.data.type]['Farm Products Consumed'][index], item.value);
                                                            break;
                                                        case 'Purchase':
                                                            initializeCategoryValues(instance, 'capitalExpenditure', 'Livestock', numberOfMonths);
                                                            instance.data.capitalExpenditure['Livestock'][index] = safeMath.plus(instance.data.capitalExpenditure['Livestock'][index], item.value);
                                                            break;
                                                        case 'Sale':
                                                            // Livestock Production Income
                                                            Base.initializeObject(instance.data.enterpriseProductionIncome, asset.data.type, {});
                                                            instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'] = instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'] || Base.initializeArray(numberOfMonths);
                                                            instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'][index] = safeMath.plus(instance.data.enterpriseProductionIncome[asset.data.type]['Livestock Sales'][index], item.value);

                                                            // Composition
                                                            instance.data.productionIncomeComposition[asset.data.category] = instance.data.productionIncomeComposition[asset.data.category] || underscore.range(numberOfMonths).map(function () {
                                                                return {
                                                                    unit: asset.data.quantityUnit,
                                                                    quantity: 0,
                                                                    value: 0
                                                                };
                                                            });

                                                            var compositionMonth = instance.data.productionIncomeComposition[asset.data.category][index];
                                                            compositionMonth.value = safeMath.plus(compositionMonth.value, item.value);
                                                            compositionMonth.quantity = safeMath.plus(compositionMonth.quantity, item.quantity);
                                                            compositionMonth.pricePerUnit = safeMath.dividedBy(compositionMonth.value, compositionMonth.quantity);
                                                            break;
                                                    }
                                                });
                                            });

                                        if (index === 0) {
                                            if (birthingAnimal === asset.data.category) {
                                                updateAssetStatementCategory(instance, 'short-term', 'Marketable Livestock', {
                                                    data: {
                                                        name: asset.data.category,
                                                        liquidityType: 'short-term',
                                                        assetValue: ledger.opening.value,
                                                        reference: 'production/livestock'
                                                    }
                                                });
                                            } else {
                                                updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', {
                                                    data: {
                                                        name: asset.data.category,
                                                        liquidityType: 'medium-term',
                                                        assetValue: ledger.opening.value,
                                                        reference: 'production/livestock'
                                                    }
                                                });
                                            }
                                        }
                                    });
                                } else if (asset.type === 'farmland') {
                                    if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = acquisitionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                        instance.data.capitalExpenditure['Land'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Land'][monthDiff], asset.data.assetValue);
                                    }

                                    if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = soldDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'assetMarketValue', 'Land', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalIncome', 'Land', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalProfit', 'Land', numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalLoss', 'Land', numberOfMonths);

                                        instance.data.assetMarketValue['Land'][monthDiff] = safeMath.plus(instance.data.assetMarketValue['Land'][monthDiff], asset.data.assetValue);
                                        instance.data.capitalIncome['Land'][monthDiff] = safeMath.plus(instance.data.capitalIncome['Land'][monthDiff], asset.data.salePrice);
                                        instance.data.capitalProfit['Land'][monthDiff] = safeMath.plus(instance.data.capitalProfit['Land'][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, asset.data.assetValue)));
                                        instance.data.capitalLoss['Land'][monthDiff] = safeMath.plus(instance.data.capitalLoss['Land'][monthDiff], Math.max(0, safeMath.minus(asset.data.assetValue, asset.data.salePrice)));
                                    }
                                } else if (asset.type === 'other') {
                                    asset.data.liquidityCategory = asset.data.liquidityCategory || asset.data.category;

                                    if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = acquisitionDate.diff(startMonth, 'months');

                                        initializeCategoryValues(instance, 'capitalExpenditure', asset.data.liquidityCategory, numberOfMonths);

                                        instance.data.capitalExpenditure[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalExpenditure[asset.data.liquidityCategory][monthDiff], asset.data.assetValue);
                                    }

                                    if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                        monthDiff = soldDate.diff(startMonth, 'months');

                                        var value = (asset.data.liquidityCategory !== 'Vehicles, Machinery & Equipment' ? asset.data.assetValue : safeMath.minus(asset.data.assetValue, safeMath.chain(instance.data.account.depreciationRate || 0)
                                            .dividedBy(100)
                                            .dividedBy(12)
                                            .times(asset.data.assetValue)
                                            .times(acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth) ?
                                                soldDate.diff(acquisitionDate, 'months') :
                                                monthDiff + 1)
                                            .toNumber()));

                                        initializeCategoryValues(instance, 'assetMarketValue', asset.data.liquidityCategory, numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalIncome', asset.data.liquidityCategory, numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalProfit', asset.data.liquidityCategory, numberOfMonths);
                                        initializeCategoryValues(instance, 'capitalLoss', asset.data.liquidityCategory, numberOfMonths);

                                        instance.data.assetMarketValue[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.assetMarketValue[asset.data.liquidityCategory][monthDiff], asset.data.assetValue);
                                        instance.data.capitalIncome[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalIncome[asset.data.liquidityCategory][monthDiff], asset.data.salePrice);
                                        instance.data.capitalProfit[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalProfit[asset.data.liquidityCategory][monthDiff], Math.max(0, safeMath.minus(asset.data.salePrice, value)));
                                        instance.data.capitalLoss[asset.data.liquidityCategory][monthDiff] = safeMath.plus(instance.data.capitalLoss[asset.data.liquidityCategory][monthDiff], Math.max(0, safeMath.minus(value, asset.data.salePrice)));
                                    }
                                }

                                if (!(asset.data.sold && soldDate && soldDate.isBefore(startMonth)) && !(asset.data.demolished && demolitionDate && demolitionDate.isBefore(startMonth))) {
                                    switch(asset.type) {
                                        case 'cropland':
                                        case 'pasture':
                                        case 'permanent crop':
                                        case 'plantation':
                                        case 'wasteland':
                                            updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                            break;
                                        case 'farmland':
                                            instance.data.assetStatement['long-term'] = instance.data.assetStatement['long-term'] || [];

                                            var assetCategory = underscore.findWhere(instance.data.assetStatement['long-term'], {name: 'Land'}) || {},
                                                landUseValue = underscore.chain(assetCategory.assets || [])
                                                    .reject(function (statementAsset) {
                                                        return statementAsset.farmId !== asset.farmId || statementAsset.type === 'farmland';
                                                    })
                                                    .reduce(function (total, statementAsset) {
                                                        return safeMath.plus(total, statementAsset.data.assetValue);
                                                    }, 0)
                                                    .value();

                                            if (landUseValue === 0) {
                                                updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                            }
                                            break;
                                        case 'improvement':
                                            updateAssetStatementCategory(instance, 'long-term', 'Fixed Improvements', asset);
                                            break;
                                        case 'vme':
                                            updateAssetStatementCategory(instance, 'medium-term', 'Vehicles, Machinery & Equipment', asset);
                                            break;
                                        case 'other':
                                            updateAssetStatementCategory(instance, asset.data.liquidityType, asset.data.liquidityCategory, asset);
                                            break;
                                    }
                                }

                                angular.forEach(asset.liabilities, function (liability) {
                                    // Check liability is not already added
                                    if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                                        evaluatedModels.push(liability);

                                        var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                            typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                            liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                                        if (asset.type === 'farmland' && liability.type !== 'rent' && moment(liability.startDate, 'YYYY-MM-DD').isBetween(startMonth, endMonth)) {
                                            monthDiff = moment(liability.startDate, 'YYYY-MM-DD').diff(startMonth, 'months');

                                            initializeCategoryValues(instance, 'capitalExpenditure', 'Land', numberOfMonths);

                                            instance.data.capitalExpenditure['Land'][monthDiff] = safeMath.plus(instance.data.capitalExpenditure['Land'][monthDiff], liability.openingBalance);
                                        }

                                        initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                                        instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                            return safeArrayMath.reduce(month.repayment, instance.data[section][typeTitle][index]);
                                        });

                                        // TODO: deal with missing liquidityType for 'Other' liabilities
                                        updateLiabilityStatementCategory(instance, liability)
                                    }
                                });
                            }
                        });

                    underscore.each(instance.models.liabilities, function (liability) {
                        // Check liability is not already added
                        if (underscore.findWhere(evaluatedModels, {uuid: liability.uuid}) === undefined) {
                            evaluatedModels.push(liability);

                            liability = Liability.new(liability);

                            var section = (liability.type === 'rent' ? 'capitalExpenditure' : 'debtRedemption'),
                                typeTitle = (liability.type !== 'other' ? Liability.getTypeTitle(liability.type) : liability.name),
                                liabilityMonths = liability.liabilityInRange(instance.startDate, instance.endDate);

                            initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                            instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                return safeArrayMath.reduce(month.repayment, instance.data[section][typeTitle][index]);
                            });

                            updateLiabilityStatementCategory(instance, liability);
                        }
                    });
                }

                /**
                 * Recalculate summary & ratio data
                 */
                function calculateYearlyTotal (monthlyTotals, year) {
                    return safeArrayMath.reduce(monthlyTotals.slice((year - 1) * 12, year * 12));
                }

                function calculateEndOfYearValue(monthlyTotals, year) {
                    var yearSlice = monthlyTotals.slice((year - 1) * 12, year * 12);
                    return yearSlice[yearSlice.length - 1];
                }

                function calculateMonthlyAssetTotal (instance, types) {
                    var ignoredItems = ['Bank Capital', 'Bank Overdraft'];

                    return underscore.chain(instance.data.assetStatement)
                        .pick(types)
                        .values()
                        .flatten()
                        .compact()
                        .reduce(function (totals, item) {
                            return (!underscore.contains(ignoredItems, item.name) && !underscore.isUndefined(item.monthly) ? safeArrayMath.plus(totals, item.monthly.marketValue) : totals);
                        }, Base.initializeArray(instance.numberOfMonths))
                        .value();
                }

                function calculateAssetLiabilityGroupTotal (instance, type, subTypes) {
                    subTypes = (underscore.isArray(subTypes) ? subTypes : [subTypes]);

                    var numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears,
                        result = (type === 'asset' ? {
                            estimatedValue: 0,
                            marketValue: 0,
                            monthly: {
                                marketValue: Base.initializeArray(numberOfMonths),
                                depreciation: Base.initializeArray(numberOfMonths)
                            },
                            yearly: {
                                marketValue: Base.initializeArray(numberOfYears),
                                depreciation: Base.initializeArray(numberOfYears)
                            }
                        } : {
                            currentValue: 0,
                            yearlyValues: Base.initializeArray(numberOfYears)
                        } );

                    underscore.each(subTypes, function (subType) {
                        result = underscore.reduce(instance.data[type + 'Statement'][subType], function(total, item) {
                            if (type === 'asset') {
                                total.estimatedValue = safeMath.plus(total.estimatedValue, item.estimatedValue);
                                total.marketValue = safeMath.plus(total.marketValue, item.marketValue);
                                total.monthly.depreciation = safeArrayMath.plus(total.monthly.depreciation, item.monthly.depreciation);
                                total.monthly.marketValue = safeArrayMath.plus(total.monthly.marketValue, item.monthly.marketValue);
                                total.yearly.depreciation = safeArrayMath.plus(total.yearly.depreciation, item.yearly.depreciation);
                                total.yearly.marketValue = safeArrayMath.plus(total.yearly.marketValue, item.yearly.marketValue);
                            } else {
                                total.currentValue = safeMath.plus(total.currentValue, item.currentValue);
                                total.yearlyValues = safeArrayMath.plus(total.yearlyValues, item.yearlyValues);
                            }
                            return total;
                        }, result);
                    });

                    return result;
                }

                function calculateMonthlyLiabilityPropertyTotal (instance, liabilityTypes, property, startMonth, endMonth) {
                    var liabilities = underscore.filter(instance.models.liabilities, function(liability) {
                        if (!liabilityTypes || liabilityTypes.length === 0) return true;

                        return liabilityTypes.indexOf(liability.type) !== -1;
                    });

                    if (liabilities.length === 0) return Base.initializeArray(instance.numberOfMonths);

                    return underscore.chain(liabilities)
                        .map(function(liability) {
                            var range = new Liability(liability).liabilityInRange(startMonth, endMonth);

                            return underscore.chain(range)
                                .pluck(property)
                                .map(function (propertyValue) {
                                    return (underscore.isNumber(propertyValue) ? propertyValue : safeArrayMath.reduce(propertyValue))
                                })
                                .value();
                        })
                        .unzip()
                        .map(safeArrayMath.reduce)
                        .value();
                }

                function calculateMonthlyCategoriesTotal (categories, results) {
                    underscore.reduce(categories, function (currentTotals, category) {
                        underscore.each(category, function (month, index) {
                            currentTotals[index] += month;
                        });
                        return currentTotals;
                    }, results);

                    return results;
                }

                function calculateMonthlySectionsTotal (sections, results) {
                    return underscore.reduce(sections, function (sectionTotals, section) {
                        return (section ? calculateMonthlyCategoriesTotal(section, sectionTotals) : sectionTotals);
                    }, results);
                }


                function calculateYearlyLivestockAdjustment (instance, year) {
                    var startDate = moment(instance.startDate).add(year - 1, 'y'),
                        endDate = moment(instance.startDate).add(year, 'y');

                    return underscore.chain(instance.models.assets)
                        .where({type: 'livestock'})
                        .map(AssetFactory.new)
                        .reduce(function (total, asset) {
                            var monthly = asset.inventoryInRange(startDate, endDate),
                                openingMonth = underscore.first(monthly),
                                closingMonth = underscore.last(monthly);

                            var openingStockValue = safeMath.times(openingMonth.opening.quantity, asset.marketPriceAtDate(startDate)),
                                closingStockValue = safeMath.times(closingMonth.opening.quantity, asset.marketPriceAtDate(endDate)),
                                purchaseSubtotal = asset.subtotalInRange('Purchase', startDate, endDate);

                            return safeMath.plus(total, safeMath.minus(safeMath.minus(closingStockValue, openingStockValue), purchaseSubtotal.value));
                        }, 0)
                        .value();
                }

                function calculateYearlyLivestockConsumption (instance, year) {
                    var startDate = moment(instance.startDate).add(year - 1, 'y'),
                        endDate = moment(instance.startDate).add(year, 'y');

                    return underscore.chain(instance.models.assets)
                        .where({type: 'livestock'})
                        .map(AssetFactory.new)
                        .reduce(function (total, asset) {
                            return safeMath.plus(total, asset.subtotalInRange(['Household', 'Labour'], startDate, endDate).value);
                        }, 0)
                        .value();
                }

                function recalculate (instance) {
                    var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                        endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                        numberOfMonths = instance.numberOfMonths,
                        taxRatePerYear = safeMath.dividedBy(instance.data.account.incomeTaxRate, 100);

                    instance.data.summary = {
                        monthly: {},
                        yearly: {}
                    };

                    instance.data.capitalIncome = {};
                    instance.data.capitalExpenditure = {};
                    instance.data.capitalLoss = {};
                    instance.data.capitalProfit = {};
                    instance.data.cashInflow = {};
                    instance.data.cashOutflow = {};
                    instance.data.debtRedemption = {};
                    instance.data.assetMarketValue = {};
                    instance.data.assetStockValue = {};
                    instance.data.assetStatement = {};
                    instance.data.liabilityStatement = {};
                    instance.data.enterpriseProductionIncome = {};
                    instance.data.enterpriseProductionExpenditure = {};
                    instance.data.productionIncome = {};
                    instance.data.productionExpenditure = {};
                    instance.data.productionIncomeComposition = {};
                    instance.data.otherIncome = {};
                    instance.data.otherExpenditure = {};

                    reEvaluateProductionSchedules(instance);
                    reEvaluateAssetsAndLiabilities(instance);
                    reEvaluateIncomeAndExpenses(instance);
                    reEvaluateProductionIncomeAndExpenditure(instance, numberOfMonths);
                    reEvaluateProductionCredit(instance);
                    reEvaluateCashFlow(instance);

                    recalculateIncomeExpensesSummary(instance, startMonth, endMonth, numberOfMonths);
                    recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths);
                    addPrimaryAccountAssetsLiabilities(instance);

                    recalculateAssetStatement(instance);
                    totalAssetsAndLiabilities(instance);
                    recalculateAssetsLiabilitiesInterestSummary(instance, startMonth, endMonth);

                    instance.data.summary.yearly.grossProductionValue = safeArrayMath.plus(instance.data.summary.yearly.productionIncome, safeArrayMath.plus(instance.data.summary.yearly.livestockAdjustment, instance.data.summary.yearly.livestockConsumption));
                    instance.data.summary.yearly.grossProfit = safeArrayMath.minus(instance.data.summary.yearly.grossProductionValue, instance.data.summary.yearly.productionExpenditure);
                    instance.data.summary.yearly.ebitda = safeArrayMath.minus(safeArrayMath.plus(instance.data.summary.yearly.grossProfit, instance.data.summary.yearly.nonFarmIncome), instance.data.summary.yearly.nonFarmExpenditure);
                    instance.data.summary.yearly.ebit = safeArrayMath.minus(instance.data.summary.yearly.ebitda, instance.data.summary.yearly.depreciation);
                    instance.data.summary.yearly.interestPaid = safeArrayMath.plus(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest);
                    instance.data.summary.yearly.ebt = safeArrayMath.minus(instance.data.summary.yearly.ebit, instance.data.summary.yearly.interestPaid);
                    instance.data.summary.yearly.taxPaid = underscore.map(instance.data.summary.yearly.ebt, function (value) {
                        return Math.max(0, safeMath.times(value, taxRatePerYear));
                    });
                    instance.data.summary.yearly.netProfit = safeArrayMath.minus(instance.data.summary.yearly.ebt, instance.data.summary.yearly.taxPaid);
                }

                function reEvaluateCashFlow (instance) {
                    instance.data.cashInflow = {
                        capitalIncome: instance.data.capitalIncome,
                        productionIncome: instance.data.productionIncome,
                        otherIncome: instance.data.otherIncome
                    };

                    instance.data.cashOutflow = {
                        capitalExpenditure: instance.data.capitalExpenditure,
                        productionExpenditure: underscore.omit(instance.data.unallocatedProductionExpenditure, ['Farm Products Consumed']),
                        otherExpenditure: underscore.omit(instance.data.otherExpenditure, ['Farm Products Consumed'])
                    };
                }

                function recalculateIncomeExpensesSummary (instance, startMonth, endMonth, numberOfMonths) {
                    var cashInflow = calculateMonthlySectionsTotal([instance.data.cashInflow.capitalIncome, instance.data.cashInflow.productionIncome, instance.data.cashInflow.otherIncome], Base.initializeArray(numberOfMonths)),
                        cashOutflow = calculateMonthlySectionsTotal([instance.data.cashOutflow.capitalExpenditure, instance.data.cashOutflow.productionExpenditure, instance.data.cashOutflow.otherExpenditure], Base.initializeArray(numberOfMonths)),
                        productionCreditRepayments = underscore.reduce(cashInflow, function (repayment, income, index) {
                            repayment[index] = (income - repayment[index] < 0 ? income : repayment[index]);
                            return repayment;
                        }, calculateMonthlyLiabilityPropertyTotal(instance, ['production-credit'], 'repayment', startMonth, endMonth)),
                        cashInflowAfterRepayments = safeArrayMath.minus(cashInflow, productionCreditRepayments),
                        debtRedemptionAfterRepayments = safeArrayMath.minus(calculateMonthlySectionsTotal([instance.data.debtRedemption], Base.initializeArray(numberOfMonths)), productionCreditRepayments);

                    underscore.extend(instance.data.summary.monthly, {
                        // Income
                        productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], Base.initializeArray(numberOfMonths)),
                        capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], Base.initializeArray(numberOfMonths)),
                        capitalProfit: calculateMonthlySectionsTotal([instance.data.capitalProfit], Base.initializeArray(numberOfMonths)),
                        otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                        nonFarmIncome: calculateMonthlySectionsTotal([instance.data.capitalProfit, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                        totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.productionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                        cashInflowAfterRepayments: cashInflowAfterRepayments,

                        // Expenses
                        unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], Base.initializeArray(numberOfMonths)),
                        productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], Base.initializeArray(numberOfMonths)),
                        capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], Base.initializeArray(numberOfMonths)),
                        capitalLoss: calculateMonthlySectionsTotal([instance.data.capitalLoss], Base.initializeArray(numberOfMonths)),
                        otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                        nonFarmExpenditure: calculateMonthlySectionsTotal([instance.data.capitalLoss, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                        debtRedemption: debtRedemptionAfterRepayments,
                        totalExpenditure: safeArrayMath.plus(debtRedemptionAfterRepayments, calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths))),
                        cashOutflowAfterRepayments: safeArrayMath.plus(debtRedemptionAfterRepayments, cashOutflow)
                    });

                    var livestockAdjustment = [calculateYearlyLivestockAdjustment(instance, 1), calculateYearlyLivestockAdjustment(instance, 2)],
                        livestockConsumption = [calculateYearlyLivestockConsumption(instance, 1), calculateYearlyLivestockConsumption(instance, 2)];

                    underscore.extend(instance.data.summary.yearly, {
                        livestockAdjustment: livestockAdjustment,
                        livestockConsumption: livestockConsumption,

                        // Income
                        productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                        productionIncomeComposition: [calculateYearlyProductionIncomeComposition(instance.data.productionIncomeComposition, 1), calculateYearlyProductionIncomeComposition(instance.data.productionIncomeComposition, 2)],
                        capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                        capitalProfit: [calculateYearlyTotal(instance.data.summary.monthly.capitalProfit, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalProfit, 2)],
                        otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                        nonFarmIncome: [calculateYearlyTotal(instance.data.summary.monthly.nonFarmIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.nonFarmIncome, 2)],
                        totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],
                        cashInflowAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.cashInflowAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.cashInflowAfterRepayments, 2)],

                        // Expenses
                        unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                        productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                        capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                        capitalLoss: [calculateYearlyTotal(instance.data.summary.monthly.capitalLoss, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalLoss, 2)],
                        otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                        nonFarmExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.nonFarmExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.nonFarmExpenditure, 2)],
                        debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                        totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],
                        cashOutflowAfterRepayments: [calculateYearlyTotal(instance.data.summary.monthly.cashOutflowAfterRepayments, 1), calculateYearlyTotal(instance.data.summary.monthly.cashOutflowAfterRepayments, 2)]
                    });
                }

                function recalculateAssetsLiabilitiesInterestSummary (instance, startMonth, endMonth) {
                    var numberOfMonths = instance.numberOfMonths,
                        numberOfYears = instance.numberOfYears;

                    underscore.extend(instance.data.summary.monthly, {
                        // Interest
                        productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                        mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                        longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                        totalInterest: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'long-term', 'medium-term'], 'interest', startMonth, endMonth), instance.data.summary.monthly.primaryAccountInterest),

                        // Liabilities
                        currentLiabilities: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                        mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                        longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                        totalLiabilities: safeArrayMath.plus(calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth), instance.data.summary.monthly.primaryAccountLiability),
                        totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'repayment', startMonth, endMonth),

                        // Assets
                        currentAssets: safeArrayMath.plus(calculateMonthlyAssetTotal(instance, ['short-term']), instance.data.summary.monthly.primaryAccountCapital),
                        movableAssets: calculateMonthlyAssetTotal(instance, ['medium-term']),
                        fixedAssets: calculateMonthlyAssetTotal(instance, ['long-term']),
                        totalAssets: safeArrayMath.plus(calculateMonthlyAssetTotal(instance, ['short-term', 'medium-term', 'long-term']), instance.data.summary.monthly.primaryAccountCapital),

                        depreciation: instance.data.assetStatement.total.monthly.depreciation || Base.initializeArray(numberOfMonths)
                    });

                    underscore.extend(instance.data.summary.yearly, {
                        // Interest
                        productionCreditInterest: [calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 2)],
                        mediumTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 2)],
                        longTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 2)],
                        totalInterest: [calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 2)],

                        // Liabilities
                        currentLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'short-term'),
                        mediumLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'medium-term'),
                        longLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'long-term'),
                        totalLiabilities: [calculateEndOfYearValue(instance.data.summary.monthly.totalLiabilities, 1), calculateEndOfYearValue(instance.data.summary.monthly.totalLiabilities, 2)],
                        totalRent: [calculateYearlyTotal(instance.data.summary.monthly.totalRent, 1), calculateYearlyTotal(instance.data.summary.monthly.totalRent, 2)],

                        // Assets
                        currentAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'short-term'),
                        movableAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'medium-term'),
                        fixedAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'long-term'),
                        totalAssets: instance.data.assetStatement.total.yearly.marketValue || Base.initializeArray(numberOfYears),

                        depreciation: instance.data.assetStatement.total.yearly.depreciation || Base.initializeArray(numberOfYears)
                    });

                    calculateAssetLiabilityGrowth(instance);
                }

                function calculateAssetLiabilityGrowth (instance) {
                    var currentWorth = safeMath.minus(instance.data.assetStatement.total.estimatedValue, instance.data.liabilityStatement.total.currentValue),
                        netWorth = safeArrayMath.minus(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues);

                    underscore.extend(instance.data.summary.yearly, {
                        netWorth: {
                            current: currentWorth,
                            yearly: netWorth
                        },
                        netWorthGrowth: underscore.map(netWorth, function (value, index) {
                            return (index === 0 ? safeMath.minus(value, currentWorth) : safeMath.minus(value, netWorth[index - 1]));
                        })
                    });
                }

                /**
                 * Primary Account Handling
                 */
                function recalculatePrimaryAccount(instance, startMonth, endMonth, numberOfMonths) {
                    var numberOfYears = instance.numberOfYears,
                        defaultObject = {
                            opening: 0,
                            inflow: 0,
                            outflow: 0,
                            balance: 0,
                            interestPayable: 0,
                            interestReceivable: 0,
                            closing: 0
                        };

                    instance.data.summary.monthly.primaryAccountInterest = Base.initializeArray(numberOfMonths);
                    instance.data.summary.monthly.primaryAccountCapital = Base.initializeArray(numberOfMonths);
                    instance.data.summary.monthly.primaryAccountLiability = Base.initializeArray(numberOfMonths);

                    instance.account.monthly = underscore.chain(underscore.range(numberOfMonths))
                        .map(function () {
                            return underscore.extend({}, defaultObject);
                        })
                        .reduce(function (monthly, month, index) {
                            month.opening = (index === 0 ? instance.account.openingBalance : monthly[monthly.length - 1].closing);
                            month.inflow = instance.data.summary.monthly.cashInflowAfterRepayments[index];
                            month.outflow = instance.data.summary.monthly.cashOutflowAfterRepayments[index];
                            month.balance = safeMath.plus(month.opening, safeMath.minus(month.inflow, month.outflow));
                            month.interestPayable = (month.balance < 0 && instance.account.interestRateDebit ?
                                safeMath.times(Math.abs(month.balance), safeMath.chain(instance.account.interestRateDebit)
                                    .dividedBy(100)
                                    .dividedBy(12)
                                    .toNumber()) : 0);
                            month.interestReceivable = (month.balance > 0 && instance.account.interestRateCredit ?
                                safeMath.times(month.balance, safeMath.chain(instance.account.interestRateCredit)
                                    .dividedBy(100)
                                    .dividedBy(12)
                                    .toNumber()) : 0);
                            month.closing = safeMath.chain(month.balance).minus(month.interestPayable).plus(month.interestReceivable).toNumber();

                            instance.data.summary.monthly.primaryAccountInterest[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountInterest[index], month.interestPayable);
                            instance.data.summary.monthly.primaryAccountCapital[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountCapital[index], Math.abs(Math.max(0, month.closing)));
                            instance.data.summary.monthly.primaryAccountLiability[index] = safeMath.plus(instance.data.summary.monthly.primaryAccountLiability[index], Math.abs(Math.min(0, month.closing)));

                            monthly.push(month);
                            return monthly;
                        }, [])
                        .value();

                    instance.account.yearly = underscore.chain(underscore.range(numberOfYears))
                        .map(function () {
                            return underscore.extend({
                                worstBalance: 0,
                                bestBalance: 0,
                                openingMonth: null,
                                closingMonth: null
                            }, defaultObject);
                        })
                        .reduce(function (yearly, year, index) {
                            var months = instance.account.monthly.slice(index * 12, (index + 1) * 12);
                            year.opening = months[0].opening;
                            year.inflow = safeArrayMath.reduceProperty(months, 'inflow');
                            year.outflow = safeArrayMath.reduceProperty(months, 'outflow');
                            year.balance = safeMath.plus(year.opening, safeMath.minus(year.inflow, year.outflow));
                            year.interestPayable = safeArrayMath.reduceProperty(months, 'interestPayable');
                            year.interestReceivable = safeArrayMath.reduceProperty(months, 'interestReceivable');
                            year.closing = safeMath.chain(year.balance).minus(year.interestPayable).plus(year.interestReceivable).toNumber();
                            year.openingMonth = moment(startMonth, 'YYYY-MM-DD').add(index, 'years').format('YYYY-MM-DD');
                            year.closingMonth = moment(startMonth, 'YYYY-MM-DD').add(index, 'years').add(months.length - 1, 'months').format('YYYY-MM-DD');

                            var bestBalance = underscore.max(months, function (month) { return month.closing; }),
                                worstBalance = underscore.min(months, function (month) { return month.closing; });
                            year.bestBalance = {
                                balance: bestBalance.closing,
                                month: moment(year.openingMonth, 'YYYY-MM-DD').add(months.indexOf(bestBalance), 'months').format('YYYY-MM-DD')
                            };
                            year.worstBalance = {
                                balance: worstBalance.closing,
                                month: moment(year.openingMonth, 'YYYY-MM-DD').add(months.indexOf(worstBalance), 'months').format('YYYY-MM-DD')
                            };

                            yearly.push(year);
                            return yearly;
                        }, [])
                        .value();

                    instance.data.summary.yearly.primaryAccountInterest = [calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 2)];
                    instance.data.summary.yearly.primaryAccountCapital = [calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountCapital, 1), calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountCapital, 2)];
                    instance.data.summary.yearly.primaryAccountLiability = [calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountLiability, 1), calculateEndOfYearValue(instance.data.summary.monthly.primaryAccountLiability, 2)];
                }

                function addPrimaryAccountAssetsLiabilities (instance) {
                    // Bank Capital
                    instance.data.assetStatement['short-term'] = instance.data.assetStatement['short-term'] || [];
                    instance.data.assetStatement['short-term'].push({
                        name: 'Bank Capital',
                        estimatedValue: Math.max(0, instance.account.openingBalance),
                        marketValue: Math.max(0, instance.account.openingBalance),
                        monthly: {
                            marketValue: underscore.map(instance.account.monthly, function (monthly) {
                                return Math.max(0, monthly.closing);
                            }),
                            depreciation: Base.initializeArray(instance.numberOfMonths)
                        },
                        yearly: {
                            marketValue: underscore.map(instance.account.yearly, function (yearly) {
                                return Math.max(0, yearly.closing);
                            }),
                            depreciation: Base.initializeArray(instance.numberOfYears)
                        }
                    });

                    // Bank Overdraft
                    instance.data.liabilityStatement['short-term'] = instance.data.liabilityStatement['short-term'] || [];
                    instance.data.liabilityStatement['short-term'].push({
                        name: 'Bank Overdraft',
                        currentValue: Math.abs(Math.min(0, instance.account.openingBalance)),
                        yearlyValues: [instance.data.summary.yearly.primaryAccountLiability[0], instance.data.summary.yearly.primaryAccountLiability[1]]
                    });
                }

                /**
                 * Ratios
                 */
                function recalculateRatios (instance) {
                    instance.data.ratios = {
                        interestCover: calculateRatio(instance, 'operatingProfit', 'totalInterest'),
                        inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                        productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                        cashFlowBank: calculateRatio(instance, 'cashInflowAfterRepayments', ['capitalExpenditure', 'unallocatedProductionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                        //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                        cashFlowFarming: calculateRatio(instance, 'totalIncome', ['capitalExpenditure', 'productionExpenditure', 'debtRedemption', 'otherExpenditure', 'primaryAccountInterest']),
                        debtToTurnover: calculateRatio(instance, 'totalLiabilities', ['productionIncome', 'otherIncome']),
                        interestToTurnover: calculateRatio(instance, 'totalInterest', ['productionIncome', 'otherIncome']),
                        //TODO: change denominator to total asset value used for farming
                        returnOnInvestment: calculateRatio(instance, 'operatingProfit', 'totalAssets')
                    };

                    calculateAssetsLiabilitiesRatios(instance);
                    calculateAccountRatios(instance);
                }

                function calculateAccountRatios (instance) {
                    var debtRatioYear1 = calculateDebtStageRatio(instance, 0),
                        debtRatioYear2 = calculateDebtStageRatio(instance, 1);

                    instance.data.ratios = underscore.extend(instance.data.ratios, {
                        debtMinStage: [debtRatioYear1.min, debtRatioYear2.min],
                        debtMaxStage: [debtRatioYear1.max, debtRatioYear2.max]
                    });
                }

                function calculateDebtStageRatio (instance, year) {
                    var yearStart = 12 * year,
                        yearEnd = 12 * (year + 1);

                    function slice (array) {
                        return array.slice(yearStart, yearEnd);
                    }

                    var totalAssetsMinusAccountCapital = safeArrayMath.minus(slice(instance.data.summary.monthly.totalAssets), slice(instance.data.summary.monthly.primaryAccountCapital)),
                        minusCapitalIncome = safeArrayMath.minus(totalAssetsMinusAccountCapital, slice(instance.data.summary.monthly.capitalIncome)),
                        plusAccountCapital = safeArrayMath.plus(minusCapitalIncome, slice(instance.data.summary.monthly.primaryAccountCapital)),
                        plusCapitalExpenditure = safeArrayMath.plus(plusAccountCapital, slice(instance.data.summary.monthly.capitalExpenditure)),
                        plusTotalIncome = safeArrayMath.plus(plusCapitalExpenditure, slice(instance.data.summary.monthly.totalIncome)),
                        minusCashInflowAfterRepayments = safeArrayMath.minus(plusTotalIncome, slice(instance.data.summary.monthly.cashInflowAfterRepayments)),
                        totalDebt = slice(instance.data.summary.monthly.totalLiabilities);

                    var debtRatio = underscore.map(minusCashInflowAfterRepayments, function (month, index) {
                        return safeMath.dividedBy(totalDebt[index], month);
                    });

                    return {
                        min: underscore.min(debtRatio),
                        max: underscore.max(debtRatio)
                    };
                }

                function calculateAssetsLiabilitiesRatios (instance) {
                    var defaultObj = { yearly: [], marketValue: 0, estimatedValue: 0 };

                    instance.data.ratios = underscore.extend(instance.data.ratios, {
                        netCapital: defaultObj,
                        gearing: defaultObj,
                        debt: defaultObj
                    });

                    instance.data.ratios.netCapital = underscore.mapObject(instance.data.ratios.netCapital, function(value, key) {
                        if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                            return safeMath.dividedBy(instance.data.assetStatement.total[key], instance.data.liabilityStatement.total.currentValue);
                        } else if (key === 'yearly') {
                            return safeArrayMath.dividedBy(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues);
                        }
                    });

                    instance.data.ratios.debt = underscore.mapObject(instance.data.ratios.debt, function(value, key) {
                        if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                            return safeMath.dividedBy(instance.data.liabilityStatement.total.currentValue, instance.data.assetStatement.total[key]);
                        } else if (key === 'yearly') {
                            return safeArrayMath.dividedBy(instance.data.liabilityStatement.total.yearlyValues, instance.data.assetStatement.total.yearly.marketValue);
                        }
                    });

                    instance.data.ratios.gearing = underscore.mapObject(instance.data.ratios.gearing, function(value, key) {
                        if (underscore.contains(['marketValue', 'estimatedValue'], key)) {
                            return safeMath.dividedBy(instance.data.liabilityStatement.total.currentValue, safeMath.minus(instance.data.assetStatement.total[key], instance.data.liabilityStatement.total.currentValue));
                        } else if (key === 'yearly') {
                            return safeArrayMath.dividedBy(instance.data.liabilityStatement.total.yearlyValues, safeArrayMath.minus(instance.data.assetStatement.total.yearly.marketValue, instance.data.liabilityStatement.total.yearlyValues));
                        }
                    });
                }

                function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                    numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
                    denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

                    function sumPropertyValuesForInterval (propertyList, interval) {
                        if (!instance.data.summary[interval]) {
                            return [];
                        }

                        var valueArrays = underscore.chain(propertyList)
                            .map(function(propertyName) {
                                if (propertyName.charAt(0) === '-') {
                                    propertyName = propertyName.substr(1);
                                    return safeArrayMath.negate(instance.data.summary[interval][propertyName]);
                                }
                                return instance.data.summary[interval][propertyName];
                            })
                            .compact()
                            .value();

                        return underscore.reduce(valueArrays.slice(1), function(result, array) {
                            return safeArrayMath.plus(result, array);
                        }, angular.copy(valueArrays[0]) || []);
                    }

                    return {
                        monthly: safeArrayMath.dividedBy(sumPropertyValuesForInterval(numeratorProperties, 'monthly'), sumPropertyValuesForInterval(denominatorProperties, 'monthly')),
                        yearly: safeArrayMath.dividedBy(sumPropertyValuesForInterval(numeratorProperties, 'yearly'), sumPropertyValuesForInterval(denominatorProperties, 'yearly'))
                    }
                }

                computedProperty(this, 'startDate', function () {
                    return this.data.startDate;
                });

                computedProperty(this, 'endDate', function () {
                    this.data.endDate = (this.data.startDate ?
                        moment(this.data.startDate).add(2, 'y').format('YYYY-MM-DD') :
                        this.data.endDate);

                    return this.data.endDate;
                });

                computedProperty(this, 'account', function () {
                    return this.data.account;
                });

                computedProperty(this, 'adjustmentFactors', function () {
                    return this.data.adjustmentFactors;
                });

                computedProperty(this, 'numberOfMonths', function () {
                    return moment(this.endDate, 'YYYY-MM-DD').diff(moment(this.startDate, 'YYYY-MM-DD'), 'months');
                });

                computedProperty(this, 'numberOfYears', function () {
                    return Math.ceil(moment(this.endDate, 'YYYY-MM-DD').diff(moment(this.startDate, 'YYYY-MM-DD'), 'years', true));
                });

                computedProperty(this, 'models', function () {
                    return this.data.models;
                });

                privateProperty(this, 'reEvaluate', function() {
                    reEvaluateBusinessPlan(this);
                });

                privateProperty(this, 'recalculateAccount', function() {
                    recalculatePrimaryAccount(this);
                });

                if (underscore.isEmpty(this.data.models.budgets) && !underscore.isEmpty(this.data.models.productionSchedules))  {
                    updateBudgets(this);
                }

                if (this.data.version <= 16) {
                    migrateProductionSchedulesV16(this);
                    migrateStockV16(this);
                }

                if (this.data.version <= 16) {
                    this.updateProductionSchedules(this.data.models.productionSchedules);
                }

                if (this.data.version <= 15) {
                    this.updateFinancials(this.data.models.financials);
                }

                this.data.version = _version;
            }

            function updateBudgets (instance) {
                instance.data.models.budgets = underscore.chain(instance.data.models.productionSchedules)
                    .pluck('budget')
                    .compact()
                    .uniq(false, function (budget) {
                        return budget.uuid;
                    })
                    .value();
            }

            function migrateProductionSchedulesV16 (instance) {
                var productionSchedules = underscore.chain(instance.data.models.productionSchedules)
                    .map(ProductionSchedule.newCopy)
                    .uniq(function (schedule) {
                        return schedule.scheduleKey;
                    })
                    .value();

                instance.data.models.assets = underscore.map(instance.data.models.assets, function (asset) {
                    var legalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        assetProductionSchedules = asset.productionSchedules;

                    asset = AssetFactory.new(asset);
                    asset.generateKey(legalEntity);

                    underscore.each(assetProductionSchedules, function (schedule) {
                        var assetProductionSchedule = ProductionSchedule.newCopy(schedule),
                            productionSchedule = underscore.findWhere(productionSchedules, {scheduleKey: assetProductionSchedule.scheduleKey}) || assetProductionSchedule;

                        if (underscore.isUndefined(productionSchedule)) {
                            productionSchedules.push(assetProductionSchedule);
                            productionSchedule = assetProductionSchedule;
                        }

                        productionSchedule.addAsset(asset);
                    });

                    return asJson(asset);
                });

                instance.data.models.productionSchedules = asJson(productionSchedules);
            }

            function migrateStockV16 (instance) {
                var stockTypes = ['livestock', 'stock'];

                instance.data.models.assets = underscore.map(instance.data.models.assets, function (asset) {
                    if (underscore.contains(stockTypes, asset.type) && asset.data && asset.data.ledger) {
                        asset = AssetFactory.newCopy(asset);

                        underscore.each(instance.data.models.budgets, function (budget) {
                            asset.removeLedgerEntriesByReference(budget.uuid);
                        });

                        return asJson(asset);
                    }

                    return asset;
                });
            }

            inheritModel(BusinessPlan, Document);

            readOnlyProperty(BusinessPlan, 'incomeExpenseTypes', {
                'capital': 'Capital',
                'production': 'Production',
                'other': 'Other'
            });

            readOnlyProperty(BusinessPlan, 'incomeSubtypes', {
                'other': [
                    'Interest, Dividends & Subsidies',
                    'Pension Fund',
                    'Short-term Insurance Claims',
                    'VAT Refund',
                    'Inheritance',
                    'Shares',
                    'Other']
            });

            readOnlyProperty(BusinessPlan, 'expenseSubtypes', {
                'production': [
                    'Accident Insurance',
                    'Administration',
                    'Accounting Fees',
                    'Bank Charges',
                    'Crop Insurance',
                    'Fuel',
                    'Electricity',
                    'Government Levy',
                    'Licenses & Membership Fees',
                    'Long term insurance & Policies',
                    'Office Costs',
                    'Property Rates',
                    'Protective Clothing',
                    'Rations',
                    'Repairs & Maintenance',
                    'Staff Salaries & Wages',
                    'Security',
                    'Short-term Insurance',
                    'Unemployment Insurance',
                    'Other'],
                'other': [
                    'Drawings',
                    'Medical',
                    'Life insurance',
                    'University / School fees',
                    'Other']
            });

            BusinessPlan.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'financial resource plan'
                    }
                },
                startDate: {
                    required: true,
                    format: {
                        date: true
                    }
                }
            }, Document.validations));

            return BusinessPlan;
        }];

    DocumentFactoryProvider.add('financial resource plan', 'BusinessPlan');
}]);

var sdkModelComparableFarmValuationDocument = angular.module('ag.sdk.model.comparable-farm-valuation', ['ag.sdk.model.farm-valuation']);

sdkModelComparableFarmValuationDocument.provider('ComparableFarmValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['FarmValuation', 'inheritModel', 'underscore',
        function (FarmValuation, inheritModel, underscore) {
            function ComparableFarmValuation (attrs) {
                FarmValuation.apply(this, arguments);

                this.docType = 'comparable farm valuation';
            }

            inheritModel(ComparableFarmValuation, FarmValuation);

            ComparableFarmValuation.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'comparable farm valuation'
                    }
                }
            }, FarmValuation.validations));

            return ComparableFarmValuation;
        }];

    DocumentFactoryProvider.add('comparable farm valuation', 'ComparableFarmValuation');
}]);

var sdkModelCropInspectionDocument = angular.module('ag.sdk.model.crop-inspection', ['ag.sdk.model.document']);

sdkModelCropInspectionDocument.provider('CropInspection', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Base', 'computedProperty', 'Document', 'inheritModel', 'readOnlyProperty', 'underscore',
        function (Base, computedProperty, Document, inheritModel, readOnlyProperty, underscore) {
            function CropInspection (attrs) {
                Document.apply(this, arguments);

                Base.initializeObject(this.data, 'request', {});
                Base.initializeObject(this.data, 'report', {});
                Base.initializeObject(this.data.request, 'assets', []);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.docType = (underscore.contains(CropInspection.docTypes, attrs.docType) ? attrs.docType : underscore.first(CropInspection.docTypes));
            }

            inheritModel(CropInspection, Document);

            readOnlyProperty(CropInspection, 'approvalTypes', [
                'Approved',
                'Not Approved',
                'Not Planted']);

            readOnlyProperty(CropInspection, 'commentTypes', [
                'Crop amendment',
                'Crop re-plant',
                'Insurance coverage discontinued',
                'Multi-insured',
                'Without prejudice',
                'Wrongfully reported']);

            readOnlyProperty(CropInspection, 'docTypes', [
                'emergence inspection',
                'hail inspection',
                'harvest inspection',
                'preharvest inspection',
                'progress inspection']);

            readOnlyProperty(CropInspection, 'moistureStatuses', [
                'Dry',
                'Moist',
                'Wet']);

            CropInspection.validates(underscore.defaults({
                docType: {
                    required: true,
                    inclusion: {
                        in: CropInspection.docTypes
                    }
                }
            }, Document.validations));

            return CropInspection;
        }];

    DocumentFactoryProvider.add('emergence inspection', 'CropInspection');
    DocumentFactoryProvider.add('hail inspection', 'CropInspection');
    DocumentFactoryProvider.add('harvest inspection', 'CropInspection');
    DocumentFactoryProvider.add('preharvest inspection', 'CropInspection');
    DocumentFactoryProvider.add('progress inspection', 'CropInspection');
}]);

var sdkModelDesktopValuationDocument = angular.module('ag.sdk.model.desktop-valuation', ['ag.sdk.model.comparable-sale', 'ag.sdk.model.document']);

sdkModelDesktopValuationDocument.provider('DesktopValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Base', 'ComparableSale', 'computedProperty', 'Document', 'inheritModel', 'privateProperty', 'underscore',
        function (Base, ComparableSale, computedProperty, Document, inheritModel, privateProperty, underscore) {
            function DesktopValuation (attrs) {
                Document.apply(this, arguments);

                this.docType = 'desktop valuation';

                var defaultReportBody = '<div class="tinymce-container pdf-container">' +
                    '<h2 id="property-description">Property Description</h2><br/><table id="property-description-table" width="100%"></table><br/>' +
                    '<h2 id="farmland-value">Estimated Farmland Value</h2><br/><div id="farmland-value-table"></div><br/>' +
                    '<h2 id="regional-value">Regional Value Development</h2><br/><div id="regional-value-graph"></div><br/>' +
                    '<h2 id="comparable-sales">Comparable Sales</h2><table id="comparable-sales-table" width="100%"></table><br/>' +
                    '<h2 id="disclaimer">Disclaimer</h2><p>Estimates of farmland and property value is based on the aggregation of regional sales data and assumptions regarding the property being valued.</p><br/><br/>' +
                    '</div>';

                Base.initializeObject(this.data, 'request', {});
                Base.initializeObject(this.data, 'report', {});

                Base.initializeObject(this.data.request, 'farmland', []);

                Base.initializeObject(this.data.report, 'body', defaultReportBody);
                Base.initializeObject(this.data.report, 'comparables', []);
                Base.initializeObject(this.data.report, 'improvements', []);
                Base.initializeObject(this.data.report, 'improvementsValue', {});
                Base.initializeObject(this.data.report, 'landUseComponents', {});
                Base.initializeObject(this.data.report, 'landUseValue', {});
                Base.initializeObject(this.data.report, 'summary', {});

                if (!underscore.isUndefined(this.data.report.comparableSales)) {
                    this.data.report.comparables = this.data.report.comparableSales;
                    delete this.data.report.comparableSales;
                }

                /**
                 * Legal Entity handling
                 */
                privateProperty(this, 'setLegalEntity', function (entity) {
                    this.data.request.legalEntity = underscore.omit(entity, ['assets', 'farms', 'liabilities']);
                });

                /**
                 * Farmland handling
                 */
                privateProperty(this, 'getFarmland', function () {
                    return this.data.request.farmland;
                });

                privateProperty(this, 'hasFarmland', function (farmland) {
                    return underscore.some(this.data.request.farmland, function (asset) {
                        return asset.assetKey === farmland.assetKey;
                    });
                });

                privateProperty(this, 'addFarmland', function (farmland) {
                    this.removeFarmland(farmland);

                    this.data.request.farmland.push(farmland);
                });

                privateProperty(this, 'removeFarmland', function (farmland) {
                    this.data.request.farmland = underscore.reject(this.data.request.farmland, function (asset) {
                        return asset.assetKey === farmland.assetKey;
                    });
                });

                privateProperty(this, 'getFarmlandSummary', function () {
                    return underscore.chain(this.data.request.farmland)
                        .groupBy(function (farmland) {
                            return (farmland.data.farmLabel ? farmland.data.farmLabel :
                                (farmland.data.officialFarmName ? underscore.titleize(farmland.data.officialFarmName) : 'Unknown'));
                        })
                        .mapObject(function (farmGroup) {
                            return {
                                portionList: (underscore.size(farmGroup) > 1 ? underscore.chain(farmGroup)
                                    .map(function (farmland) {
                                        return (farmland.data.portionNumber ? farmland.data.portionNumber : farmland.data.portionLabel);
                                    })
                                    .sort()
                                    .toSentence()
                                    .value() : underscore.first(farmGroup).data.portionLabel),
                                town: underscore.chain(farmGroup)
                                    .map(function (farmland) {
                                        return (farmland.data.town ? underscore.titleize(farmland.data.town) : '');
                                    })
                                    .first()
                                    .value(),
                                province: underscore.chain(farmGroup)
                                    .map(function (farmland) {
                                        return (farmland.data.province ? underscore.titleize(farmland.data.province) : '');
                                    })
                                    .first()
                                    .value(),
                                area: underscore.reduce(farmGroup, function (total, farmland) {
                                    return total + (farmland.data.area || 0);
                                }, 0)
                            }
                        })
                        .value();
                });

                /**
                 * Comparable Handling
                 */
                privateProperty(this, 'addComparableSale', function (comparableSale) {
                    var _this = this;

                    comparableSale = ComparableSale.new(comparableSale);

                    _this.removeComparableSale(comparableSale);

                    _this.data.report.comparables.push(comparableSale.asJSON());

                    underscore.each(comparableSale.attachments, function (attachment) {
                        _this.addAttachment(attachment);
                    });
                });

                privateProperty(this, 'removeComparableSale', function (comparableSale) {
                    var _this = this;

                    _this.data.report.comparables = underscore.reject(_this.data.report.comparables, underscore.identity({uuid: comparableSale.uuid}));

                    underscore.each(comparableSale.attachments, function (attachment) {
                        _this.removeAttachment(attachment);
                    });
                });
            }

            inheritModel(DesktopValuation, Document);

            DesktopValuation.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'desktop valuation'
                    }
                }
            }, Document.validations));

            return DesktopValuation;
        }];

    DocumentFactoryProvider.add('desktop valuation', 'DesktopValuation');
}]);

var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.provider('Document', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['asJson', 'Base', 'computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (asJson, Base, computedProperty, inheritModel, privateProperty, readOnlyProperty, underscore) {
            function Document (attrs, organization) {
                Base.apply(this, arguments);

                this.data = (attrs && attrs.data) || {};
                Base.initializeObject(this.data, 'attachments', []);

                /**
                 * Asset Register
                 */
                privateProperty(this, 'updateRegister', function (organization) {
                    var organizationJson = asJson(organization);

                    this.organization = organization;
                    this.organizationId = organization.id;
                    this.data = underscore.extend(this.data, {
                        organization: underscore.omit(organizationJson, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
                        farmer: underscore.omit(organizationJson, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
                        farms : organizationJson.farms,
                        legalEntities: underscore.map(organizationJson.legalEntities, function (entity) {
                            return underscore.omit(entity, ['assets', 'farms']);
                        }),
                        assets: underscore.chain(organizationJson.legalEntities)
                            .pluck('assets')
                            .flatten()
                            .compact()
                            .groupBy('type')
                            .value(),
                        liabilities: underscore.chain(organizationJson.legalEntities)
                            .pluck('liabilities')
                            .flatten()
                            .compact()
                            .value(),
                        pointsOfInterest: underscore.map(organizationJson.pointsOfInterest, function (pointOfInterest) {
                            return underscore.omit(pointOfInterest, ['organization']);
                        }),
                        productionSchedules: underscore.map(organizationJson.productionSchedules, function (productionSchedule) {
                            return underscore.omit(productionSchedule, ['organization']);
                        })
                    });
                });

                /**
                 * Attachment Handling
                 */
                computedProperty(this, 'attachments', function () {
                    return this.data.attachments;
                });

                privateProperty(this, 'addAttachment', function (attachment) {
                    this.removeAttachment(attachment);

                    this.data.attachments.push(attachment);
                });

                privateProperty(this, 'removeAttachment', function (attachment) {
                    this.data.attachments = underscore.reject(this.data.attachments, function (item) {
                        return item.key === attachment.key;
                    });
                });

                privateProperty(this, 'removeNewAttachments', function () {
                    var attachments = this.data.attachments;

                    this.data.attachments = underscore.reject(attachments, function (attachment) {
                        return underscore.isObject(attachment.archive);
                    });

                    return underscore.difference(attachments, this.data.attachments);
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.author = attrs.author;
                this.docType = attrs.docType;
                this.documentId = attrs.documentId;
                this.id = attrs.id || attrs.$id;
                this.organizationId = attrs.organizationId;
                this.originUuid = attrs.originUuid;
                this.origin = attrs.origin;
                this.title = underscore.prune(attrs.title, 255, '');

                this.organization = attrs.organization;
                this.tasks = attrs.tasks;
            }

            inheritModel(Document, Base);

            Document.validates({
                author: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                docType: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                }
            });

            return Document;
        }];

    listServiceMapProvider.add('document', ['documentRegistry', 'moment', function (documentRegistry, moment) {
        return function (item) {
            var group = documentRegistry.getProperty(item.docType, 'title'),
                subtitle = (item.title ? item.title : (item.organization && item.organization.name ?
                    item.organization.name :
                    'Created ' + moment(item.createdAt).format('YYYY-MM-DD')));

            return {
                id: item.id || item.$id,
                title: (item.documentId ? item.documentId : ''),
                subtitle: subtitle,
                docType: item.docType,
                group: (group ? group : item.docType)
            };
        };
    }]);
}]);

sdkModelDocument.provider('DocumentFactory', function () {
    var instances = {};

    this.add = function (docType, modelName) {
        instances[docType] = modelName;
    };

    this.$get = ['$injector', 'Document', function ($injector, Document) {
        function apply (attrs, fnName) {
            if (instances[attrs.docType]) {
                if (typeof instances[attrs.docType] === 'string') {
                    instances[attrs.docType] = $injector.get(instances[attrs.docType]);
                }

                return instances[attrs.docType][fnName](attrs);
            }

            return Document[fnName](attrs);
        }

        return {
            isInstanceOf: function (document) {
                return (document ?
                    (instances[document.docType] ?
                        document instanceof instances[document.docType] :
                        document instanceof Document) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});

var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.provider('FarmValuation', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['$filter', 'Asset', 'Base', 'Document', 'Field', 'inheritModel', 'privateProperty', 'safeMath', 'underscore',
        function ($filter, Asset, Base, Document, Field, inheritModel, privateProperty, safeMath, underscore) {
            function FarmValuation (attrs) {
                Document.apply(this, arguments);

                privateProperty(this, 'asComparable', function () {
                    var instance = this;

                    return {
                        attachmentIds: underscore.chain(instance.data.attachments)
                            .filter(function (attachment) {
                                return attachment.type === 'cover photo' || s.include(attachment.mimeType, 'image');
                            })
                            .sortBy(function (attachment, index) {
                                return (attachment.type === 'cover photo' ? -1 : index);
                            })
                            .first(1)
                            .map(function (attachment) {
                                return attachment.key;
                            })
                            .value(),
                        authorData: underscore.chain(instance.data.report.completedBy || {})
                            .pick(['email', 'mobile', 'name', 'position', 'telephone'])
                            .extend({
                                company: instance.data.request.merchant.name
                            })
                            .value(),
                        documentId: instance.id,
                        depreciatedImprovements: instance.data.report.improvementsValue.depreciatedValue,
                        improvedRatePerHa: safeMath.dividedBy(instance.data.report.totalRoundedValue, instance.data.report.summary.totalArea),
                        improvements: instance.data.report.improvements,
                        knowledgeOfProperty: instance.data.report.knowledgeOfProperty,
                        landUse: underscore.chain(instance.data.report.landUseComponents)
                            .values()
                            .flatten()
                            .map(function (landComponent) {
                                return underscore.map(landComponent.assets, function (asset) {
                                    var field = getAssetField(instance, asset),
                                        type = (field ? field.landUse :
                                            (Field.isLandUse(asset.data.landUse) ? asset.data.landUse : landComponent.name)),
                                        subType = getLandUseTitle(asset, {
                                            asOfDate: instance.data.report.completionDate,
                                            field: field || asset.data
                                        });

                                    return {
                                        area: asset.data.size,
                                        assetValue: safeMath.times(landComponent.valuePerHa, asset.data.size),
                                        type: type,
                                        subType: subType,
                                        unitValue: landComponent.valuePerHa
                                    }
                                });
                            })
                            .flatten()
                            .sortBy('subType')
                            .value(),
                        purchasePrice: instance.data.report.totalRoundedValue,
                        vacantLandValue: safeMath.dividedBy(instance.data.report.landUseValue.land, instance.data.report.summary.totalArea),
                        valuationDate: instance.data.report.completionDate,
                        valueMinusImprovements: safeMath.minus(instance.data.report.totalRoundedValue, instance.data.report.improvementsValue.depreciatedValue)
                    }
                });

                Base.initializeObject(this.data, 'request', {});
                Base.initializeObject(this.data.request, 'farmland', []);
                Base.initializeObject(this.data, 'report', {});
                Base.initializeObject(this.data.report, 'description', {});
                Base.initializeObject(this.data.report, 'improvements', []);
                Base.initializeObject(this.data.report, 'improvementsValue', {});
                Base.initializeObject(this.data.report, 'landUseComponents', {});
                Base.initializeObject(this.data.report, 'landUseValue', {});
                Base.initializeObject(this.data.report, 'location', {});
                Base.initializeObject(this.data.report, 'research', []);
                Base.initializeObject(this.data.report, 'services', {});
                Base.initializeObject(this.data.report, 'summary', {});
                Base.initializeObject(this.data.report, 'template', 'default');

                this.docType = 'farm valuation';
            }

            inheritModel(FarmValuation, Document);

            var parenthesizeProps = $filter('parenthesizeProps');

            function getLandUseTitle (asset, options) {
                var cropProps = [Asset.getCustomTitle(asset, ['crop', 'age'], options), Asset.getCustomTitle(asset, ['croppingPotential', 'irrigation', 'terrain', 'waterSource'], options)];

                return parenthesizeProps(Asset.getCustomTitle(asset, [['landUse', 'typeTitle']], options), cropProps);
            }

            function getAssetField (instance, asset) {
                return underscore.chain(instance.data.farms)
                    .where({id: asset.farmId})
                    .pluck('data')
                    .pluck('fields')
                    .flatten()
                    .where({fieldName: asset.data.fieldName})
                    .map(Field.newCopy)
                    .first()
                    .value();
            }

            FarmValuation.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'farm valuation'
                    }
                }
            }, Document.validations));

            return FarmValuation;
        }];

    DocumentFactoryProvider.add('farm valuation', 'FarmValuation');
}]);

var sdkModelEnterpriseBudget = angular.module('ag.sdk.model.enterprise-budget', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelEnterpriseBudget.factory('EnterpriseBudgetBase', ['Base', 'computedProperty', 'inheritModel', 'interfaceProperty', 'Locale', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, computedProperty, inheritModel, interfaceProperty, Locale, naturalSort, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudgetBase(attrs) {
            Locale.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'sections', []);

            computedProperty(this, 'defaultCostStage', function () {
                return underscore.last(EnterpriseBudgetBase.costStages);
            });

            // Cache
            privateProperty(this, 'cache', {});

            privateProperty(this, 'getCache', function (props) {
                return this.cache[typeof props === 'string' ? props : props.join('/')];
            });

            privateProperty(this, 'setCache', function (props, value) {
                var cacheKey = (typeof props === 'string' ? props : props.join('/'));
                this.cache[cacheKey] = value;
                return this.cache[cacheKey];
            });

            privateProperty(this, 'resetCache', function (props) {
                delete this.cache[typeof props === 'string' ? props : props.join('/')];
            });

            privateProperty(this, 'clearCache', function () {
                underscore.each(underscore.keys(this.cache), function (cacheKey) {
                    delete this.cache[cacheKey];
                }, this);
            });

            // Stock
            privateProperty(this, 'stock', []);

            interfaceProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'findStock', function (assetType, categoryName, commodityType) {
                return findStock(this, assetType, categoryName, commodityType);
            });

            interfaceProperty(this, 'replaceAllStock', function (stock) {
                replaceAllStock(this, stock);
            });

            interfaceProperty(this, 'removeStock', function (stock) {
                removeStock(this, stock);
            });

            // Sections
            privateProperty(this, 'getSections', function (sectionCode, costStage) {
                var sections = underscore.where(this.data.sections, {code: sectionCode, costStage: costStage || this.defaultCostStage});

                return (sections.length > 0 ? sections : underscore.filter(this.data.sections, function (section) {
                    return (underscore.isUndefined(sectionCode) || section.code === sectionCode) && underscore.isUndefined(section.costStage);
                }));
            });

            privateProperty(this, 'sortSections', function () {
                this.data.sections = underscore.chain(this.data.sections)
                    .each(function (section) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            group.productCategories.sort(function (categoryA, categoryB) {
                                return naturalSort(categoryA.name, categoryB.name);
                            });
                        });

                        section.productCategoryGroups.sort(function (groupA, groupB) {
                            return naturalSort(groupA.name, groupB.name);
                        });
                    })
                    .sortBy(function (section) {
                        return section.name + (section.costStage ? '-' + section.costStage : '');
                    })
                    .reverse()
                    .value();
            });

            privateProperty(this, 'hasSection', function (sectionCode, costStage) {
                return !underscore.isEmpty(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'getSection', function (sectionCode, costStage) {
                return underscore.first(this.getSections(sectionCode, costStage));
            });

            privateProperty(this, 'getSectionTitle', function (sectionCode) {
                return (EnterpriseBudgetBase.sections[sectionCode] ? EnterpriseBudgetBase.sections[sectionCode].name : '');
            });

            privateProperty(this, 'addSection', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (underscore.isUndefined(section)) {
                    section = underscore.extend({
                        productCategoryGroups: [],
                        total: {
                            value: 0
                        }
                    }, EnterpriseBudgetBase.sections[sectionCode]);

                    if (this.assetType === 'livestock') {
                        section.total.valuePerLSU = 0;
                    }

                    if (costStage) {
                        section.costStage = costStage;
                    }

                    this.data.sections.push(section);
                    this.data.sections.sort(function (sectionA, sectionB) {
                        return naturalSort(sectionA.name + (sectionA.costStage ? '-' + sectionA.costStage : ''), sectionB.name + (sectionB.costStage ? '-' + sectionB.costStage : ''));
                    });
                    this.data.sections.reverse();

                    this.setCache([sectionCode, costStage], section);
                }

                return section;
            });

            // Groups
            privateProperty(this, 'getGroup', function (sectionCode, groupName, costStage) {
                var cacheKey = [groupName, costStage].join('/');

                return this.getCache(cacheKey) || this.setCache(cacheKey, underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .findWhere({name: groupName})
                    .value());
            });

            privateProperty(this, 'findGroupNameByCategory', function (sectionCode, groupName, categoryCode) {
                var splitCategoryCode = categoryCode.split('-');

                return (groupName ? groupName : underscore.chain(EnterpriseBudgetBase.groups)
                    .map(function (group) {
                        return (s.include(group.code, splitCategoryCode[0] + '-' + splitCategoryCode[1]) ||
                            s.include(group.code, splitCategoryCode[1])) ? group.name : undefined;
                    })
                    .compact()
                    .first()
                    .value());
            });

            privateProperty(this, 'addGroup', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                if (underscore.isUndefined(group)) {
                    var section = this.addSection(sectionCode, costStage);

                    group = underscore.extend({
                        productCategories: [],
                        total: {
                            value: 0
                        }
                    }, EnterpriseBudgetBase.groups[groupName]);

                    if (this.assetType === 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    section.productCategoryGroups.push(group);
                    section.productCategoryGroups.sort(function (groupA, groupB) {
                        return naturalSort(groupA.name, groupB.name);
                    });

                    this.setCache([groupName, costStage], group);
                }

                return group;
            });

            privateProperty(this, 'removeGroup', function (sectionCode, groupName, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (section) {
                    section.productCategoryGroups = underscore.reject(section.productCategoryGroups, function (group) {
                        return group.name === groupName;
                    });

                    this.resetCache([groupName, costStage]);
                }

                this.recalculate();
            });

            // Categories
            privateProperty(this, 'categoryAllowed', function (sectionCode, categoryQuery) {
                return underscore.chain(getCategoryOptions(sectionCode, this.assetType, this.baseAnimal))
                    .values()
                    .flatten()
                    .findWhere(categoryQuery)
                    .isObject()
                    .value();
            });

            privateProperty(this, 'groupAndCategoryAllowed', function (sectionCode, groupName, categoryCode) {
                var categoryOptions = getCategoryOptions(sectionCode, this.assetType, this.baseAnimal);

                return categoryOptions[groupName] && underscore.findWhere(categoryOptions[groupName], {code: categoryCode});
            });

            interfaceProperty(this, 'getCategory', function (sectionCode, categoryCode, costStage) {
                var cacheKey = [categoryCode, costStage].join('/');

                return this.getCache(cacheKey) || this.setCache(cacheKey, underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere({code: categoryCode})
                    .value());
            });

            interfaceProperty(this, 'getCategoryOptions', function (sectionCode) {
                return getCategoryOptions(sectionCode, this.assetType, this.baseAnimal);
            });

            interfaceProperty(this, 'getGroupCategoryOptions', function (sectionCode, groupName) {
                return getGroupCategories(sectionCode, this.assetType, this.baseAnimal, groupName);
            });

            privateProperty(this, 'getAvailableGroupCategories', function (sectionCode, groupName, costStage) {
                var group = this.getGroup(sectionCode, groupName, costStage);

                return getAvailableGroupCategories(this, sectionCode, (group ? group.productCategories : []), groupName);
            });

            privateProperty(this, 'getAvailableCategories', function (sectionCode, costStage) {
                var sectionCategories = underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .value();

                return getAvailableGroupCategories(this, sectionCode, sectionCategories);
            });

            interfaceProperty(this, 'addCategory', function (sectionCode, groupName, categoryCode, costStage) {
                var category = this.getCategory(sectionCode, categoryCode, costStage);

                if (underscore.isUndefined(category) && !underscore.isUndefined(categoryCode)) {
                    var group = this.addGroup(sectionCode, this.findGroupNameByCategory(sectionCode, groupName, categoryCode), costStage);

                    category = underscore.extend({
                        quantity: 0,
                        value: 0
                    }, EnterpriseBudgetBase.categories[categoryCode]);

                    // WA: Modify enterprise budget model to specify input costs as "per ha"
                    if (sectionCode === 'EXP') {
                        category.unit = 'Total'
                    }

                    category.per = (this.assetType === 'livestock' ? 'LSU' : 'ha');

                    if (this.assetType === 'livestock') {
                        var conversionRate = this.getConversionRate(category.name);

                        if (conversionRate) {
                            category.conversionRate = conversionRate;
                        }

                        category.valuePerLSU = 0;
                    }

                    group.productCategories.push(category);
                    group.productCategories.sort(function (categoryA, categoryB) {
                        return naturalSort(categoryA.name, categoryB.name);
                    });

                    this.setCache([categoryCode, costStage], category);
                }

                return category;
            });

            interfaceProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {});

            privateProperty(this, 'setCategory', function (sectionCode, groupName, category, costStage) {
                var group = this.addGroup(sectionCode, this.findGroupNameByCategory(sectionCode, groupName, category.code), costStage);

                if (group) {
                    group.productCategories = underscore.chain(group.productCategories)
                        .reject(function (groupCategory) {
                            return groupCategory.code === category.code;
                        })
                        .union([category])
                        .value();
                    this.setCache([categoryCode, costStage], category);
                }

                return category;
            });

            interfaceProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                groupName = this.findGroupNameByCategory(sectionCode, groupName, categoryCode);

                var group = this.getGroup(sectionCode, groupName, costStage);

                if (group) {
                    group.productCategories = underscore.reject(group.productCategories, function (category) {
                        return category.code === categoryCode;
                    });

                    if (group.productCategories.length === 0) {
                        this.removeGroup(sectionCode, groupName, costStage);
                    }

                    this.resetCache([categoryCode, costStage]);
                }

                this.recalculate();
            });

            privateProperty(this, 'getStockAssets', function () {
                return (this.assetType !== 'livestock' || underscore.isUndefined(conversionRate[this.baseAnimal]) ? [this.commodityType] : underscore.keys(conversionRate[this.baseAnimal]));
            });

            interfaceProperty(this, 'recalculate', function () {});

            // Livestock
            computedProperty(this, 'baseAnimal', function () {
                return baseAnimal[this.commodityType] || this.commodityType;
            });

            computedProperty(this, 'birthAnimal', function () {
                return EnterpriseBudgetBase.birthAnimals[this.baseAnimal];
            });

            privateProperty(this, 'getBaseAnimal', function () {
                return this.baseAnimal;
            });

            privateProperty(this, 'getRepresentativeAnimal', function () {
                return EnterpriseBudgetBase.representativeAnimals[this.baseAnimal];
            });

            privateProperty(this, 'getConversionRate', function(animal) {
                return conversionRate[this.baseAnimal] && (conversionRate[this.baseAnimal][animal] || conversionRate[this.baseAnimal][EnterpriseBudgetBase.representativeAnimals[this.baseAnimal]]);
            });

            privateProperty(this, 'getConversionRates', function() {
                return conversionRate[this.baseAnimal];
            });

            privateProperty(this, 'getUnitAbbreviation', function (unit) {
                return unitAbbreviations[unit] || unit;
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetType = attrs.assetType;
            this.commodityType = attrs.commodityType;

            this.sortSections();
            migrateSections(this);
        }

        inheritModel(EnterpriseBudgetBase, Locale);

        var migrations = {
            'INC-HVT-CROP': {
                code: 'INC-CPS-CROP'
            },
            'INC-HVT-FRUT': {
                code: 'INC-FRS-FRUT'
            }
        };

        function migrateSections (instance) {
            underscore.each(instance.data.sections, function (section) {
                migrateItem(section);

                underscore.each(section.productCategoryGroups, function (group) {
                    migrateItem(group);

                    underscore.each(group.productCategories, function (category) {
                        migrateItem(category);
                    });
                });
            });
        }

        function migrateItem (item) {
            if (item && migrations[item.code]) {
                underscore.extend(item, migrations[item.code]);
            }
        }

        readOnlyProperty(EnterpriseBudgetBase, 'sections', underscore.indexBy([
            {
                code: 'EXP',
                name: 'Expenses'
            }, {
                code: 'INC',
                name: 'Income'
            }
        ], 'code'));

        readOnlyProperty(EnterpriseBudgetBase, 'groups', underscore.indexBy([
            {
                code: 'INC-CPS',
                name: 'Crop Sales'
            }, {
                code: 'INC-FRS',
                name: 'Fruit Sales'
            }, {
                code: 'EST',
                name: 'Establishment'
            }, {
                code: 'HVT',
                name: 'Harvest'
            }, {
                code: 'HVP',
                name: 'Preharvest'
            }, {
                code: 'INC-LSS',
                name: 'Livestock Sales'
            }, {
                code: 'INC-LSP',
                name: 'Product Sales'
            }, {
                code: 'EXP-AMF',
                name: 'Animal Feed'
            }, {
                code: 'HBD',
                name: 'Husbandry'
            }, {
                code: 'IDR',
                name: 'Indirect Costs'
            }, {
                code: 'MRK',
                name: 'Marketing'
            }, {
                code: 'RPM',
                name: 'Replacements'
            }
        ], 'name'));

        readOnlyProperty(EnterpriseBudgetBase, 'categories', underscore.indexBy([
            //*********** Income *********
            // livestock sales
            // Sheep
            {
                code: 'INC-LSS-SLAMB',
                name: 'Lamb',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SWEAN',
                name: 'Weaner Lamb',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SEWE',
                name: 'Ewe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SWTH',
                name: 'Wether',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-SRAM',
                name: 'Ram',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            // Cattle
            {
                code: 'INC-LSS-CCALV',
                name: 'Calf',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CWEN',
                name: 'Weaner Calf',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CCOW',
                name: 'Cow',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CHEI',
                name: 'Heifer',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CST18',
                name: 'Steer',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CST36',
                name: 'Ox',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-CBULL',
                name: 'Bull',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            //Goats
            {
                code: 'INC-LSS-GKID',
                name: 'Kid',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GWEAN',
                name: 'Weaner Kid',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GEWE',
                name: 'Ewe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GCAST',
                name: 'Castrate',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-GRAM',
                name: 'Ram',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            //Rabbits
            {
                code: 'INC-LSS-RKIT',
                name: 'Kit',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RWEN',
                name: 'Weaner Kit',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RDOE',
                name: 'Doe',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RLAP',
                name: 'Lapin',
                supplyUnit: 'hd',
                unit: 'kg'
            }, {
                code: 'INC-LSS-RBUC',
                name: 'Buck',
                supplyUnit: 'hd',
                unit: 'kg'
            },

            // livestock product sales
            {
                code: 'INC-LSP-MILK',
                name: 'Milk',
                unit: 'l'
            }, {
                code: 'INC-LSP-WOOL',
                name: 'Wool',
                unit: 'kg'
            }, {
                code: 'INC-LSP-LFUR',
                name: 'Fur',
                unit: 'kg'
            },

            //Crops
            {
                code: 'INC-CPS-CROP',
                name: 'Crop',
                unit: 't'
            },
            //Horticulture (non-perennial)
            {
                code: 'INC-FRS-FRUT',
                name: 'Fruit',
                unit: 't'
            },
            //*********** Expenses *********
            // Establishment
            {
                code: 'EXP-EST-DRAN',
                name: 'Drainage',
                unit: 'Total'
            }, {
                code: 'EXP-EST-IRRG',
                name: 'Irrigation',
                unit: 'Total'
            }, {
                code: 'EXP-EST-LPRP',
                name: 'Land preparation',
                unit: 'Total'
            }, {
                code: 'EXP-EST-TRLL',
                name: 'Trellising',
                unit: 'Total'
            },
            // Preharvest
            {
                code: 'EXP-HVP-CONS',
                name: 'Consultants',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-SEED',
                name: 'Seed',
                unit: 'kg'
            }, {
                code: 'EXP-HVP-PLTM',
                name: 'Plant Material',
                unit: 'each'
            }, {
                code: 'EXP-HVP-ELEC',
                name: 'Electricity',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-FERT',
                name: 'Fertiliser',
                unit: 't'
            }, {
                code: 'EXP-HVP-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-HVP-FUNG',
                name: 'Fungicides',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-GENL',
                name: 'General',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-LIME',
                name: 'Lime',
                unit: 't'
            }, {
                code: 'EXP-HVP-HERB',
                name: 'Herbicides',
                unit: 'l'
            }, {
                code: 'EXP-HVP-PEST',
                name: 'Pesticides',
                unit: 'l'
            }, {
                code: 'EXP-HVP-PGRG',
                name: 'Plant growth regulators',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-POLL',
                name: 'Pollination',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-SPYA',
                name: 'Aerial spraying',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-PRCI',
                name: 'Production Credit Interest',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-INSH',
                name: 'Hail insurance',
                unit: 't'
            }, {
                code: 'EXP-HVP-INSM',
                name: 'Yield insurance',
                unit: 't'
            }, {
                code: 'EXP-HVP-HEDG',
                name: 'Hedging cost',
                unit: 't'
            }, {
                code: 'EXP-HVP-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-HVP-SLAB',
                name: 'Seasonal labour',
                unit: 'ha'
            },
            //Harvest
            {
                code: 'EXP-HVT-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-HVT-LABC',
                name: 'Harvest labour',
                unit: 'ha'
            }, {
                code: 'EXP-HVT-HVTT',
                name: 'Harvest transport',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-HVTC',
                name: 'Harvesting cost',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-HVT-STOR',
                name: 'Storage',
                unit: 'days'
            }, {
                code: 'EXP-HVT-PAKM',
                name: 'Packaging material',
                unit: 'each'
            }, {
                code: 'EXP-HVT-DYCL',
                name: 'Drying & cleaning',
                unit: 't'
            }, {
                code: 'EXP-HVT-PAKC',
                name: 'Packing cost',
                unit: 'each'
            },
            //Indirect
            {
                code: 'EXP-IDR-DEPR',
                name: 'Depreciation',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-IDR-LUBR',
                name: 'Lubrication',
                unit: 'l'
            }, {
                code: 'EXP-IDR-REPP',
                name: 'Repairs & maintenance',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-ELEC',
                name: 'Electricity',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-INTR',
                name: 'Interest on loans',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-WATR',
                name: 'Water',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-LABP',
                name: 'Permanent labour',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-SCHED',
                name: 'Scheduling',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-LICS',
                name: 'License',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-INSA',
                name: 'Insurance assets',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-OTHER',
                name: 'Other overheads',
                unit: 'Total'
            },
            //Replacements
            // Sheep
            {
                code: 'EXP-RPM-SLAMB',
                name: 'Lamb',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SWEAN',
                name: 'Weaner Lamb',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SWTH',
                name: 'Wether',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SRAM',
                name: 'Ram',
                unit: 'head'
            },

            // Cattle
            {
                code: 'EXP-RPM-CCALV',
                name: 'Calf',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CWEN',
                name: 'Weaner Calf',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CCOW',
                name: 'Cow',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CHEI',
                name: 'Heifer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST18',
                name: 'Steer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST36',
                name: 'Ox',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CBULL',
                name: 'Bull',
                unit: 'head'
            },

            //Goats
            {
                code: 'EXP-RPM-GKID',
                name: 'Kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GWEAN',
                name: 'Weaner Kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GCAST',
                name: 'Castrate',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GRAM',
                name: 'Ram',
                unit: 'head'
            },
            //Rabbits
            {
                code: 'EXP-RPM-RKIT',
                name: 'Kit',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RWEN',
                name: 'Weaner Kit',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RDOE',
                name: 'Doe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RLAP',
                name: 'Lapin',
                unit: 'head'
            }, {
                code: 'EXP-RPM-RBUC',
                name: 'Buck',
                unit: 'head'
            },
            //Animal feed
            {
                code: 'EXP-AMF-CROP',
                name: 'Crop',
                unit: 'kg'
            },
            {
                code: 'EXP-AMF-LICK',
                name: 'Lick',
                unit: 't'
            },
            //Husbandry
            {
                code: 'EXP-HBD-VACC',
                name: 'Drenching & vaccination',
                unit: 'head'
            }, {
                code: 'EXP-HBD-DIPP',
                name: 'Dipping & jetting',
                unit: 'head'
            }, {
                code: 'EXP-HBD-VETY',
                name: 'Veterinary',
                unit: 'head'
            }, {
                code: 'EXP-HBD-SHER',
                name: 'Shearing',
                unit: 'head'
            }, {
                code: 'EXP-HBD-CRCH',
                name: 'Crutching',
                unit: 'head'
            }, {
                code: 'EXP-MRK-LSSF',
                name: 'Livestock sales marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-LSPF',
                name: 'Livestock products marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-HOTF',
                name: 'Horticulture marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPF',
                name: 'Crop marketing fees',
                unit: 't'
            }, {
                code: 'EXP-MRK-LSTP',
                name: 'Livestock transport',
                unit: 'head'
            }, {
                code: 'EXP-MRK-HOTT',
                name: 'Fruit transport',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPT',
                name: 'Crop transport',
                unit: 't'
            }
        ], 'code'));


        readOnlyProperty(EnterpriseBudgetBase, 'stockableCategoryCodes', [
            'INC-LSS-SLAMB',
            'INC-LSS-SWEAN',
            'INC-LSS-SEWE',
            'INC-LSS-SWTH',
            'INC-LSS-SRAM',
            'INC-LSS-CCALV',
            'INC-LSS-CWEN',
            'INC-LSS-CCOW',
            'INC-LSS-CHEI',
            'INC-LSS-CST18',
            'INC-LSS-CST36',
            'INC-LSS-CBULL',
            'INC-LSS-GKID',
            'INC-LSS-GWEAN',
            'INC-LSS-GEWE',
            'INC-LSS-GCAST',
            'INC-LSS-GRAM',
            'INC-LSS-RKIT',
            'INC-LSS-RWEN',
            'INC-LSS-RDOE',
            'INC-LSS-RLAP',
            'INC-LSS-RBUC',
            'INC-LSP-MILK',
            'INC-LSP-WOOL',
            'INC-LSP-LFUR',
            'INC-CPS-CROP',
            'INC-FRS-FRUT',
            'EXP-HVP-SEED',
            'EXP-HVP-PLTM',
            'EXP-HVP-FERT',
            'EXP-HVP-FUEL',
            'EXP-HVP-FUNG',
            'EXP-HVP-LIME',
            'EXP-HVP-HERB',
            'EXP-HVP-PEST',
            'EXP-HVP-PGRG',
            'EXP-HVT-FUEL',
            'EXP-IDR-FUEL',
            'EXP-IDR-LUBR',
            'EXP-IDR-WATR',
            'EXP-AMF-CROP',
            'EXP-AMF-LICK'
        ]);

        readOnlyProperty(EnterpriseBudgetBase, 'categoryOptions', {
            crop: {
                INC: {
                    'Crop Sales': getCategoryArray(['INC-CPS-CROP'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-FERT', 'EXP-HVP-FUNG', 'EXP-HVP-HEDG', 'EXP-HVP-HERB', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-LIME', 'EXP-HVP-PEST', 'EXP-HVP-PRCI', 'EXP-HVP-SEED', 'EXP-HVP-SPYA']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC', 'EXP-HVT-HVTC']),
                    'Marketing': getCategoryArray(['EXP-MRK-CRPF', 'EXP-MRK-CRPT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-DEPR', 'EXP-IDR-FUEL', 'EXP-IDR-LUBR', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-OTHER'])
                }
            },
            horticulture: {
                INC: {
                    'Fruit Sales': getCategoryArray(['INC-FRS-FRUT'])
                },
                EXP: {
                    'Establishment': getCategoryArray(['EXP-EST-DRAN', 'EXP-EST-IRRG', 'EXP-EST-LPRP', 'EXP-EST-TRLL']),
                    'Preharvest': getCategoryArray(['EXP-HVP-CONS', 'EXP-HVP-ELEC', 'EXP-HVP-FERT', 'EXP-HVP-FUEL', 'EXP-HVP-FUNG', 'EXP-HVP-GENL', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-PEST', 'EXP-HVP-PGRG', 'EXP-HVP-PLTM', 'EXP-HVP-POLL', 'EXP-HVP-PRCI', 'EXP-HVP-REPP', 'EXP-HVP-SLAB', 'EXP-HVP-SPYA']),
                    'Harvest': getCategoryArray(['EXP-HVT-FUEL', 'EXP-HVT-DYCL', 'EXP-HVT-LABC', 'EXP-HVT-HVTT', 'EXP-HVT-PAKC', 'EXP-HVT-PAKM', 'EXP-HVT-REPP', 'EXP-HVT-STOR']),
                    'Marketing': getCategoryArray(['EXP-MRK-HOTF', 'EXP-MRK-HOTT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-DEPR', 'EXP-IDR-FUEL', 'EXP-IDR-LUBR', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                }
            },
            livestock: {
                Cattle: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CHEI', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CHEI', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Game: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CHEI', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-LFUR'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CHEI', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Goats: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-GKID', 'INC-LSS-GWEAN', 'INC-LSS-GEWE', 'INC-LSS-GCAST', 'INC-LSS-GRAM']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-GKID', 'EXP-RPM-GWEAN', 'EXP-RPM-GEWE', 'EXP-RPM-GCAST', 'EXP-RPM-GRAM']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Rabbits: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-RKIT', 'INC-LSS-RWEN', 'INC-LSS-RDOE', 'INC-LSS-RLUP', 'INC-LSS-RBUC']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-LFUR'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-RKIT', 'EXP-RPM-RWEN', 'EXP-RPM-RDOE', 'EXP-RPM-RLUP', 'EXP-RPM-RBUC']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                },
                Sheep: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-SLAMB', 'INC-LSS-SWEAN', 'INC-LSS-SEWE', 'INC-LSS-SWTH', 'INC-LSS-SRAM']),
                        'Product Sales': getCategoryArray(['INC-LSP-WOOL', 'INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-SLAMB', 'EXP-RPM-SWEAN', 'EXP-RPM-SEWE', 'EXP-RPM-SWTH', 'EXP-RPM-SRAM']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-CROP', 'EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                }
            }
        });

        // Stock
        function addStock (instance, stock) {
            if (stock && underscore.isArray(stock.data.ledger)) {
                instance.stock = underscore.chain(instance.stock)
                    .reject(function (item) {
                        return item.assetKey === stock.assetKey;
                    })
                    .union([stock])
                    .value();
            }
        }

        function findStock (instance, assetType, categoryName, commodityType) {
            return underscore.find(instance.stock, function (stock) {
                return stock.type === assetType && stock.data.category === categoryName && (underscore.isUndefined(stock.data.type) || stock.data.type === commodityType);
            });
        }

        function replaceAllStock (instance, stock) {
            instance.stock = underscore.filter(stock, function (item) {
                return item && underscore.isArray(item.data.ledger);
            });
        }

        function removeStock (instance, stock) {
            instance.stock = underscore.chain(instance.stock)
                .reject(function (item) {
                    return item.assetKey === stock.assetKey;
                })
                .value();
        }

        // Categories
        privateProperty(EnterpriseBudgetBase, 'getBaseCategory', function (query) {
            return underscore.findWhere(EnterpriseBudgetBase.categories, query);
        });

        privateProperty(EnterpriseBudgetBase, 'getGroupCategories', function (assetType, commodityType, sectionCode, groupName) {
            return getGroupCategories(sectionCode, assetType, baseAnimal[commodityType], groupName);
        });

        function getCategoryOptions (sectionCode, assetType, baseAnimal) {
            return (assetType && EnterpriseBudgetBase.categoryOptions[assetType] ?
                (assetType === 'livestock'
                    ? (baseAnimal ? EnterpriseBudgetBase.categoryOptions[assetType][baseAnimal][sectionCode] : {})
                    : EnterpriseBudgetBase.categoryOptions[assetType][sectionCode])
                : {});
        }

        function getGroupCategories (sectionCode, assetType, baseAnimal, groupName) {
            var sectionGroupCategories = getCategoryOptions(sectionCode, assetType, baseAnimal);

            return (sectionGroupCategories && sectionGroupCategories[groupName] ? sectionGroupCategories[groupName] : []);
        }

        function getCategoryArray (categoryCodes) {
            return underscore.chain(categoryCodes)
                .map(function (code) {
                    return EnterpriseBudgetBase.categories[code];
                })
                .compact()
                .sortBy('name')
                .value();
        }

        function getAvailableGroupCategories (instance, sectionCode, usedCategories, groupName) {
            return underscore.chain(instance.getCategoryOptions(sectionCode))
                .map(function (categoryGroup, categoryGroupName) {
                    return underscore.chain(categoryGroup)
                        .reject(function (category) {
                            return (groupName && categoryGroupName !== groupName) ||
                                underscore.findWhere(usedCategories, {code: category.code});
                        })
                        .map(function (category) {
                            return underscore.extend(category, {
                                groupBy: categoryGroupName
                            });
                        })
                        .value();
                })
                .values()
                .flatten()
                .value();
        }

        readOnlyProperty(EnterpriseBudgetBase, 'costStages', ['Establishment', 'Yearly']);

        var unitAbbreviations = {
            head: 'hd',
            each: 'ea.'
        };

        // Livestock
        readOnlyProperty(EnterpriseBudgetBase, 'representativeAnimals', {
            Cattle: 'Cow',
            Game: 'Cow',
            Goats: 'Ewe',
            Rabbits: 'Doe',
            Sheep: 'Ewe'
        });

        var baseAnimal = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        readOnlyProperty(EnterpriseBudgetBase, 'birthAnimals', {
            Cattle: 'Calf',
            Game: 'Calf',
            Goats: 'Kid',
            Rabbits: 'Kit',
            Sheep: 'Lamb'
        });

        readOnlyProperty(EnterpriseBudgetBase, 'weanedAnimals', {
            Cattle: 'Weaner Calf',
            Game: 'Weaner Calf',
            Goats: 'Weaner Kid',
            Rabbits: 'Weaner Kit',
            Sheep: 'Weaner Lamb'
        });

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Game: {
                'Calf': 0.32,
                'Weaner Calf': 0.44,
                'Cow': 1.1,
                'Heifer': 1.1,
                'Steer': 0.75,
                'Ox': 1.1,
                'Bull': 1.36
            },
            Goats: {
                'Kid': 0.08,
                'Weaner Kid': 0.12,
                'Ewe': 0.17,
                'Castrate': 0.17,
                'Ram': 0.22
            },
            Rabbits: {
                'Kit': 0.08,
                'Weaner Kit': 0.12,
                'Doe': 0.17,
                'Lapin': 0.17,
                'Buck': 0.22
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner Lamb': 0.11,
                'Ewe': 0.16,
                'Wether': 0.16,
                'Ram': 0.23
            }
        };

        privateProperty(EnterpriseBudgetBase, 'getBirthingAnimal', function (commodityType) {
            var base = baseAnimal[commodityType] || commodityType;

            return base && EnterpriseBudgetBase.birthAnimals[base];
        });

        interfaceProperty(EnterpriseBudgetBase, 'getAssetTypeForLandUse', function (landUse) {
            return (s.include(landUse, 'Cropland') ? 'crop' :
                (s.include(landUse, 'Cropland') ? 'horticulture' : 'livestock'));
        });

        privateProperty(EnterpriseBudgetBase, 'getCategorySortKey', function (categoryName) {
            if (underscore.contains(underscore.values(EnterpriseBudgetBase.representativeAnimals), categoryName)) {
                return 0 + categoryName;
            } else if (underscore.contains(underscore.values(EnterpriseBudgetBase.birthAnimals), categoryName)) {
                return 1 + categoryName;
            } else if (underscore.contains(underscore.values(EnterpriseBudgetBase.weanedAnimals), categoryName)) {
                return 2 + categoryName;
            }

            return 3 + categoryName;
        });

        EnterpriseBudgetBase.validates({
            data: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudgetBase;
    }]);

sdkModelEnterpriseBudget.provider('EnterpriseBudget', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['$filter', 'Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
        function ($filter, Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeArrayMath, safeMath, underscore) {
            function EnterpriseBudget(attrs) {
                EnterpriseBudgetBase.apply(this, arguments);

                Base.initializeObject(this.data, 'details', {});
                Base.initializeObject(this.data, 'events', {});
                Base.initializeObject(this.data, 'schedules', {});
                Base.initializeObject(this.data.details, 'cycleStart', 0);
                Base.initializeObject(this.data.details, 'numberOfMonths', 12);
                Base.initializeObject(this.data.details, 'productionArea', '1 Hectare');

                computedProperty(this, 'commodityTitle', function () {
                    return getCommodityTitle(this.assetType);
                });

                computedProperty(this, 'numberOfMonths', function () {
                    return this.data.details.numberOfMonths;
                });

                computedProperty(this, 'defaultMonthlyPercent', function () {
                    return monthlyPercents[this.data.details.numberOfMonths] || underscore.reduce(underscore.range(this.numberOfMonths), function (totals, value, index) {
                        totals[index] = (index === totals.length - 1 ?
                            safeMath.minus(100, safeArrayMath.reduce(totals)) :
                            safeMath.chain(100)
                                .dividedBy(totals.length)
                                .round(4)
                                .toNumber());
                        return totals;
                    }, Base.initializeArray(this.numberOfMonths));
                });

                privateProperty(this, 'getCommodities', function () {
                    return getAssetCommodities(this.assetType);
                });

                privateProperty(this, 'getShiftedCycle', function () {
                    return getShiftedCycle(this);
                });

                privateProperty(this, 'getEventTypes', function () {
                    return eventTypes[this.assetType] ? eventTypes[this.assetType] : eventTypes.default;
                });

                privateProperty(this, 'getScheduleTypes', function () {
                    return underscore.chain(scheduleTypes[this.assetType] ? scheduleTypes[this.assetType] : scheduleTypes.default)
                        .union(getScheduleBirthing(this))
                        .compact()
                        .value()
                        .sort(naturalSort);
                });

                privateProperty(this, 'getSchedule', function (scheduleName, defaultValue) {
                    return (scheduleName && this.data.schedules[scheduleName] ?
                        this.data.schedules[scheduleName] :
                        (underscore.isUndefined(defaultValue) ? angular.copy(this.defaultMonthlyPercent) : underscore.range(this.numberOfMonths).map(function () {
                            return 0;
                        })));
                });

                privateProperty(this, 'shiftMonthlyArray', function (array) {
                    return (array ? underscore.rest(array, this.data.details.cycleStart).concat(
                        underscore.first(array, this.data.details.cycleStart)
                    ) : array);
                });

                privateProperty(this, 'unshiftMonthlyArray', function (array) {
                    return (array ? underscore.rest(array, array.length -this.data.details.cycleStart).concat(
                        underscore.first(array, array.length - this.data.details.cycleStart)
                    ) : array);
                });

                privateProperty(this, 'getShiftedSchedule', function (schedule) {
                    return (underscore.isArray(schedule) ?
                        this.shiftMonthlyArray(schedule) :
                        this.shiftMonthlyArray(this.getSchedule(schedule)));
                });

                privateProperty(this, 'getAvailableSchedules', function (includeSchedule) {
                    return getAvailableSchedules(this, includeSchedule);
                });

                computedProperty(this, 'cycleStart', function () {
                    return this.data.details.cycleStart;
                });

                computedProperty(this, 'cycleStartMonth', function () {
                    return EnterpriseBudget.cycleMonths[this.data.details.cycleStart].name;
                });

                privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                    var section = this.getSection(sectionCode, costStage),
                        monthIndex = (section && section.total ? underscore.findIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                            return value !== 0;
                        }) : -1);

                    return (monthIndex !== -1 ? monthIndex : 0);
                });

                privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                    var section = this.getSection(sectionCode, costStage),
                        monthIndex = (section && section.total ? underscore.findLastIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                            return value !== 0;
                        }) : -1);

                    return (monthIndex !== -1 ? monthIndex + 1 : this.numberOfMonths);
                });

                computedProperty(this, 'numberOfAllocatedMonths', function () {
                    return this.getLastAllocationIndex('INC') - this.getAllocationIndex('EXP');
                });

                privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                    return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
                });

                privateProperty(this, 'recalculate', function () {
                    return recalculateEnterpriseBudget(this);
                });

                privateProperty(this, 'recalculateCategory', function (categoryCode) {
                    return recalculateEnterpriseBudgetCategory(this, categoryCode);
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.averaged = attrs.averaged || false;
                this.cloneCount = attrs.cloneCount || 0;
                this.createdAt = attrs.createdAt;
                this.createdBy = attrs.createdBy;
                this.favoriteCount = attrs.favoriteCount || 0;
                this.favorited = attrs.favorited || false;
                this.followers = attrs.followers || [];
                this.id = attrs.id || attrs.$id;
                this.internallyPublished = attrs.internallyPublished || false;
                this.name = attrs.name;
                this.organization = attrs.organization;
                this.organizationUuid = attrs.organizationUuid;
                this.published = attrs.published || false;
                this.region = attrs.region;
                this.sourceUuid = attrs.sourceUuid;
                this.useCount = attrs.useCount || 0;
                this.updatedAt = attrs.updatedAt;
                this.updatedBy = attrs.updatedBy;
                this.user = attrs.user;
                this.userData = attrs.userData;
                this.userId = attrs.userId;
                this.uuid = attrs.uuid;

                if (this.assetType === 'livestock') {
                    this.data.details.representativeAnimal = this.getRepresentativeAnimal();
                    this.data.details.conversions = this.getConversionRates();
                    this.data.details.budgetUnit = 'LSU';

                    underscore.each(this.getEventTypes(), function (event) {
                        Base.initializeObject(this.data.events, event, Base.initializeArray(this.numberOfMonths));
                    }, this);
                } else if (this.assetType === 'horticulture') {
                    if (this.data.details.maturityFactor instanceof Array) {
                        this.data.details.maturityFactor = {
                            'INC': this.data.details.maturityFactor
                        };
                    }

                    Base.initializeObject(this.data.details, 'yearsToMaturity', getYearsToMaturity(this));
                    Base.initializeObject(this.data.details, 'maturityFactor', {});
                    Base.initializeObject(this.data.details.maturityFactor, 'INC', []);
                    Base.initializeObject(this.data.details.maturityFactor, 'EXP', []);
                }

                this.recalculate();
            }

            inheritModel(EnterpriseBudget, EnterpriseBudgetBase);

            // Commodities
            readOnlyProperty(EnterpriseBudget, 'commodityTypes', {
                crop: 'Field Crops',
                horticulture: 'Horticulture',
                livestock: 'Livestock'
            });

            readOnlyProperty(EnterpriseBudget, 'assetCommodities', {
                crop: [
                    'Barley',
                    'Bean (Dry)',
                    'Bean (Green)',
                    'Beet',
                    'Broccoli',
                    'Butternut',
                    'Cabbage',
                    'Canola',
                    'Carrot',
                    'Cauliflower',
                    'Cotton',
                    'Cowpea',
                    'Grain Sorghum',
                    'Groundnut',
                    'Leek',
                    'Lucerne',
                    'Lupin',
                    'Maize',
                    'Maize (Fodder)',
                    'Maize (Green)',
                    'Maize (Irrigated)',
                    'Maize (Seed)',
                    'Maize (White)',
                    'Maize (Yellow)',
                    'Multispecies Pasture',
                    'Oats',
                    'Onion',
                    'Potato',
                    'Pumpkin',
                    'Rapeseed',
                    'Rye',
                    'Soya Bean',
                    'Soya Bean (Irrigated)',
                    'Sunflower',
                    'Sweet Corn',
                    'Teff',
                    'Teff (Irrigated)',
                    'Tobacco',
                    'Triticale',
                    'Turnip',
                    'Wheat',
                    'Wheat (Irrigated)'
                ],
                horticulture: [
                    'Almond',
                    'Apple',
                    'Apricot',
                    'Avocado',
                    'Banana',
                    'Barberry',
                    'Berry',
                    'Bilberry',
                    'Blackberry',
                    'Blueberry',
                    'Cherry',
                    'Chicory',
                    'Chili',
                    'Cloudberry',
                    'Citrus (Hardpeel)',
                    'Citrus (Softpeel)',
                    'Coffee',
                    'Date',
                    'Fig',
                    'Garlic',
                    'Gooseberry',
                    'Grape (Bush Vine)',
                    'Grape (Table)',
                    'Grape (Wine)',
                    'Guava',
                    'Hazelnut',
                    'Hops',
                    'Kiwi',
                    'Kumquat',
                    'Lemon',
                    'Lentil',
                    'Lime',
                    'Macadamia Nut',
                    'Mandarin',
                    'Mango',
                    'Melon',
                    'Mulberry',
                    'Nectarine',
                    'Olive',
                    'Orange',
                    'Papaya',
                    'Pea',
                    'Peach',
                    'Peanut',
                    'Pear',
                    'Prickly Pear',
                    'Pecan Nut',
                    'Persimmon',
                    'Pineapple',
                    'Pistachio Nut',
                    'Plum',
                    'Pomegranate',
                    'Protea',
                    'Prune',
                    'Quince',
                    'Raspberry',
                    'Rooibos',
                    'Strawberry',
                    'Sugarcane',
                    'Tea',
                    'Tomato',
                    'Watermelon',
                    'Wineberry'
                ],
                livestock: [
                    'Cattle (Extensive)',
                    'Cattle (Feedlot)',
                    'Cattle (Stud)',
                    'Chicken (Broilers)',
                    'Chicken (Layers)',
                    'Dairy',
                    'Game',
                    'Goats',
                    'Horses',
                    'Ostrich',
                    'Pigs',
                    'Rabbits',
                    'Sheep (Extensive)',
                    'Sheep (Feedlot)',
                    'Sheep (Stud)'
                ]
            });

            function getCommodityTitle (assetType) {
                return EnterpriseBudget.commodityTypes[assetType] || '';
            }

            function getAssetCommodities (assetType) {
                return EnterpriseBudget.assetCommodities[assetType] || [];
            }

            var eventTypes = {
                'default': [],
                'livestock': ['Birth', 'Death']
            };

            var scheduleTypes = {
                'default': ['Fertilise', 'Harvest', 'Plant/Seed', 'Plough', 'Spray'],
                'livestock': ['Lick', 'Sales', 'Shearing', 'Vaccination']
            };

            readOnlyProperty(EnterpriseBudget, 'cycleMonths', underscore.map([
                    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
                ],
                function (month, index) {
                    return {
                        id: index,
                        name: month,
                        shortname: month.substring(0, 3)
                    }
                }));

            privateProperty(EnterpriseBudget, 'getCycleMonth', function (month) {
                return EnterpriseBudget.cycleMonths[month % 12];
            });

            function getShiftedCycle (instance) {
                return underscore.sortBy(EnterpriseBudget.cycleMonths, function (monthCycle) {
                    return (monthCycle.id < instance.data.details.cycleStart ? monthCycle.id + 12 : monthCycle.id);
                });
            }

            var monthlyPercents = {
                3: [33.33, 33.34, 33.33],
                6: [16.67, 16.67, 16.66, 16.66, 16.67, 16.67],
                7: [14.29, 14.28, 14.29, 14.28, 14.29, 14.28, 14.29],
                9: [11.11, 11.11, 11.11, 11.11, 11.12, 11.11, 11.11, 11.11, 11.11],
                11: [9.09, 9.09, 9.09, 9.09, 9.09, 9.10, 9.09, 9.09, 9.09, 9.09, 9.09],
                12: [8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34]
            };

            // Horticulture
            var yearsToMaturity = {
                'Apple': 25,
                'Apricot': 18,
                'Avocado': 8,
                'Blueberry': 8,
                'Citrus (Hardpeel)': 25,
                'Citrus (Softpeel)': 25,
                'Date': 12,
                'Fig': 30,
                'Grape (Table)': 25,
                'Grape (Wine)': 25,
                'Macadamia Nut': 10,
                'Mango': 30,
                'Nectarine': 18,
                'Olive': 10,
                'Orange': 25,
                'Pecan Nut': 10,
                'Peach': 18,
                'Pear': 25,
                'Persimmon': 20,
                'Plum': 18,
                'Pomegranate': 30,
                'Rooibos': 5
            };

            function getYearsToMaturity (instance) {
                return yearsToMaturity[instance.commodityType];
            }

            // Schedules
            var scheduleBirthing = {
                'Calving': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Dairy'],
                'Hatching': ['Chicken (Broilers)', 'Chicken (Layers)', 'Ostrich'],
                'Kidding': ['Game', 'Goats'],
                'Foaling': ['Horses'],
                'Farrowing': ['Pigs'],
                'Lambing': ['Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
            };

            function getScheduleBirthing (instance) {
                return underscore.chain(scheduleBirthing)
                    .keys()
                    .filter(function (key) {
                        return underscore.contains(scheduleBirthing[key], instance.commodityType);
                    })
                    .value();
            }

            function getAvailableSchedules(instance, includeSchedule) {
                return underscore.reject(instance.getScheduleTypes(), function (schedule) {
                    return ((includeSchedule === undefined || schedule !== includeSchedule) && instance.data.schedules[schedule] !== undefined);
                })
            }

            function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
                var categoryCode = (underscore.isObject(categoryQuery) ? categoryQuery.code : categoryQuery),
                    category = instance.getCategory(sectionCode, categoryCode, costStage);

                if (category) {
                    category.quantity = (category.unit === 'Total' ? 1 : category.quantity);

                    if (underscore.has(category, 'schedule')) {
                        category.scheduled = true;
                        delete category.schedule;
                    }

                    if (property === 'valuePerMonth') {
                        category.scheduled = true;
                        category.value = safeArrayMath.reduce(category.valuePerMonth);
                    }

                    if (underscore.contains(['value', 'valuePerLSU', 'valuePerMonth'], property)) {
                        if (property === 'valuePerLSU') {
                            category.value = safeMath.round(safeMath.dividedBy(category.value, instance.getConversionRate(category.name)), 2);
                        }

                        category.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(category.value, category.supply || 1), category.quantity), 4);
                    }

                    if (underscore.contains(['pricePerUnit', 'quantity', 'quantityPerLSU', 'supply'], property)) {
                        if (property === 'quantityPerLSU') {
                            category.quantity = safeMath.round(safeMath.dividedBy(category.quantity, instance.getConversionRate(category.name)), 2);
                        }

                        category.value = safeMath.times(safeMath.times(category.supply || 1, category.quantity), category.pricePerUnit);
                    }

                    if (property !== 'valuePerMonth') {
                        // Need to convert valuePerMonth using a ratio of the value change
                        // If the previous value is 0, we need to reset the valuePerMonth to a monthly average
                        var oldValue = safeArrayMath.reduce(category.valuePerMonth),
                            valueMod = category.value % instance.numberOfMonths;

                        if (oldValue === 0 || !category.scheduled) {
                            category.valuePerMonth = underscore.reduce(instance.defaultMonthlyPercent, function (totals, value, index) {
                                totals[index] = (index === totals.length - 1 ?
                                    safeMath.minus(category.value, safeArrayMath.reduce(totals)) :
                                    (valueMod === 0 ?
                                        safeMath.dividedBy(category.value, instance.numberOfMonths) :
                                        safeMath.round(safeMath.dividedBy(safeMath.times(value, category.value), 100), 2)));
                                return totals;
                            }, Base.initializeArray(instance.numberOfMonths));
                        } else {
                            var totalFilled = safeArrayMath.count(category.valuePerMonth),
                                countFilled = 0;

                            category.valuePerMonth = underscore.reduce(category.valuePerMonth, function (totals, value, index) {
                                if (value > 0) {
                                    totals[index] = (index === totals.length - 1 || countFilled === totalFilled - 1 ?
                                        safeMath.minus(category.value, safeArrayMath.reduce(totals)) :
                                        safeMath.round(safeMath.dividedBy(safeMath.times(value, category.value), oldValue), 2));
                                    countFilled++;
                                }
                                return totals;
                            }, Base.initializeArray(instance.numberOfMonths));
                        }
                    }

                    recalculateEnterpriseBudgetCategory(instance, categoryCode);
                }
            }

            // Calculation
            function validateEnterpriseBudget (instance) {
                // Validate sections
                underscore.each(EnterpriseBudget.sections, function (section) {
                    for (var i = EnterpriseBudget.costStages.length - 1; i >= 0; i--) {
                        var budgetSection = instance.getSection(section.code, EnterpriseBudget.costStages[i]);

                        if (underscore.isUndefined(budgetSection)) {
                            budgetSection = angular.copy(section);
                            budgetSection.productCategoryGroups = [];

                            instance.data.sections.push(budgetSection);
                            instance.sortSections();
                        }

                        budgetSection.costStage = EnterpriseBudget.costStages[i];
                    }
                });

                // Validate maturity
                if (instance.assetType === 'horticulture' && instance.data.details.yearsToMaturity) {
                    var yearsToMaturity = instance.data.details.yearsToMaturity;

                    instance.data.details.maturityFactor = underscore.mapObject(instance.data.details.maturityFactor, function (maturityFactor) {
                        return underscore.first(maturityFactor.concat(underscore.range(maturityFactor.length < yearsToMaturity ? (yearsToMaturity - maturityFactor.length) : 0)
                            .map(function () {
                                return 100;
                            })), yearsToMaturity);
                    });
                }
            }

            function recalculateEnterpriseBudget (instance) {
                validateEnterpriseBudget(instance);

                if (instance.assetType === 'livestock' && instance.getConversionRate()) {
                    instance.data.details.calculatedLSU = safeMath.times(instance.data.details.herdSize, instance.getConversionRate());
                }

                underscore.each(instance.data.sections, function (section) {
                    underscore.each(section.productCategoryGroups, function (group) {
                        underscore.each(group.productCategories, function (category) {
                            recalculateCategory(instance, category);
                        });

                        recalculateGroup(instance, group);
                    });

                    recalculateSection(instance, section);
                });

                recalculateGrossProfit(instance);
            }

            function recalculateEnterpriseBudgetCategory (instance, categoryCode) {
                underscore.each(instance.data.sections, function (section) {
                    underscore.each(section.productCategoryGroups, function (group) {
                        underscore.each(group.productCategories, function (category) {
                            if (category.code === categoryCode) {
                                recalculateCategory(instance, category);
                                recalculateGroup(instance, group);
                                recalculateSection(instance, section);
                            }
                        });
                    });
                });

                recalculateGrossProfit(instance);
            }

            function recalculateGrossProfit (instance) {
                instance.data.details.grossProfitByStage = underscore.object(EnterpriseBudget.costStages,
                    underscore.map(EnterpriseBudget.costStages, function (stage) {
                        return underscore
                            .chain(instance.data.sections)
                            .where({costStage: stage})
                            .reduce(function (total, section) {
                                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) :
                                    (section.code === 'EXP' ? safeMath.minus(total, section.total.value) : total));
                            }, 0)
                            .value();
                    }));

                instance.data.details.grossProfit = instance.data.details.grossProfitByStage[instance.defaultCostStage];

                if (instance.assetType === 'livestock') {
                    instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
                }
            }

            function recalculateSection (instance, section) {
                section.total = underscore.extend({
                    value: underscore.reduce(section.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.value)
                    }, 0),
                    valuePerMonth: underscore.reduce(section.productCategoryGroups, function (totals, group) {
                        return safeArrayMath.plus(totals, group.total.valuePerMonth);
                    }, Base.initializeArray(instance.numberOfMonths))
                }, (instance.assetType !== 'livestock' ? {} : {
                    quantityPerLSU: underscore.reduce(section.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.quantityPerLSU)
                    }, 0),
                    valuePerLSU: underscore.reduce(section.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU)
                    }, 0)
                }));
            }

            function recalculateGroup (instance, group) {
                group.total = underscore.extend({
                    value: underscore.reduce(group.productCategories, function (total, category) {
                        return safeMath.plus(total, category.value)
                    }, 0),
                    valuePerMonth: underscore.reduce(group.productCategories, function (totals, category) {
                        return safeArrayMath.plus(totals, category.valuePerMonth);
                    }, Base.initializeArray(instance.numberOfMonths))
                }, (instance.assetType !== 'livestock' ? {} : {
                    quantityPerLSU: underscore.reduce(group.productCategories, function (total, category) {
                        return safeMath.plus(total, category.quantityPerLSU)
                    }, 0),
                    valuePerLSU: underscore.reduce(group.productCategories, function (total, category) {
                        return safeMath.plus(total, category.valuePerLSU)
                    }, 0)
                }));
            }

            function recalculateCategory (instance, category) {
                category.name = (underscore.contains(['INC-CPS-CROP', 'INC-FRS-FRUT'], category.code) ?
                    instance.commodityType :
                    (EnterpriseBudgetBase.categories[category.code] ? EnterpriseBudgetBase.categories[category.code].name : category.name));

                if (instance.assetType === 'livestock' && instance.getConversionRate(category.name)) {
                    category.quantityPerLSU = safeMath.times(category.quantity, instance.getConversionRate(category.name));
                    category.valuePerLSU = safeMath.times(category.value, instance.getConversionRate(category.name));
                }

                category.valuePerMonth = category.valuePerMonth || Base.initializeArray(instance.numberOfMonths);

                category.quantityPerMonth = underscore.reduce(category.valuePerMonth, function (totals, value, index) {
                    totals[index] = (index === totals.length - 1 ?
                        safeMath.minus(category.quantity, safeArrayMath.reduce(totals)) :
                        safeMath.dividedBy(safeMath.times(category.quantity, value), category.value));
                    return totals;
                }, Base.initializeArray(instance.numberOfMonths));

                if (!underscore.isUndefined(category.supplyUnit)) {
                    category.supplyPerMonth = underscore.reduce(category.valuePerMonth, function (totals, value, index) {
                        totals[index] = (index === totals.length - 1 ?
                            safeMath.minus(category.supply, safeArrayMath.reduce(totals)) :
                            safeMath.dividedBy(safeMath.times(category.supply, value), category.value));
                        totals[index] = (category.supplyUnit === 'hd' ? Math.round(totals[index]) : totals[index]);
                        return totals;
                    }, Base.initializeArray(instance.numberOfMonths));
                }
            }

            // Validation
            EnterpriseBudget.validates({
                assetType: {
                    required: true,
                    inclusion: {
                        in: underscore.keys(EnterpriseBudget.assetCommodities)
                    }
                },
                commodityType: {
                    required: true,
                    inclusion: {
                        in: function (value, instance, field) {
                            return getAssetCommodities(instance.assetType);
                        }
                    }
                },
                data: {
                    required: true,
                    object: true
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                region: {
                    required: true,
                    object: true
                }
            });

            return EnterpriseBudget;
        }];

    listServiceMapProvider.add('enterprise budget', [function () {
        function searchingIndex (item) {
            var index = [item.name, item.assetType, item.commodityType];

            if (item.data && item.data.details && item.data.details.regionName) {
                index.push(item.data.details.regionName);
            }

            return index;
        }
        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.name,
                subtitle: item.commodityType + (item.regionName? ' in ' + item.regionName : ''),
                status: (item.published ? {text: 'public', label: 'label-success'} : (item.internallyPublished ? {text: 'internal', label: 'label-info'} : false)),
                searchingIndex: searchingIndex(item)
            };
        };
    }]);
}]);

var sdkModelExpense = angular.module('ag.sdk.model.expense', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelExpense.factory('Expense', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, readOnlyProperty, underscore) {
        function Expense (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.description = attrs.description;
            this.documentId = attrs.documentId;
            this.organizationId = attrs.organizationId;
            this.quantity = attrs.quantity;
            this.unit = attrs.unit;
            this.userId = attrs.userId;
            this.reconciled = attrs.reconciled;
            this.reconciledAt = attrs.reconciledAt;
            this.reconciledBy = attrs.reconciledBy;

            this.document = attrs.document;
            this.organization = attrs.organization;
            this.user = attrs.user;
        }

        inheritModel(Expense, Model.Base);

        readOnlyProperty(Expense, 'units', [
            'ha',
            'km',
            'h']);

        Expense.validates({
            description: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            quantity: {
                required: true,
                numeric: true
            },
            unit: {
                required: true,
                inclusion: {
                    in: Expense.units
                }
            }
        });

        return Expense;
    }]);

var sdkModelFarm = angular.module('ag.sdk.model.farm', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFarm.factory('Farm', ['asJson', 'Base', 'computedProperty', 'geoJSONHelper', 'inheritModel', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (asJson, Base, computedProperty, geoJSONHelper, inheritModel, Model, naturalSort, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Farm (attrs) {
            Model.Base.apply(this, arguments);

            privateProperty(this, 'farmNameUnique', function (name, farms) {
                return farmNameUnique(this, name, farms);
            });

            computedProperty(this, 'fields', function () {
                return this.data.fields;
            });

            computedProperty(this, 'gates', function () {
                return this.data.gates;
            });

            // Fields
            privateProperty(this, 'addFields', function (fields) {
                addItems(this, 'fields', fields, 'fieldName');
            });

            privateProperty(this, 'addField', function (field) {
                addItem(this, 'fields', field, 'fieldName');
            });

            privateProperty(this, 'getField', function (fieldName) {
                return getItem(this, 'fields', fieldName, 'fieldName');
            });

            privateProperty(this, 'removeField', function (field) {
                removeItem(this, 'fields', field, 'fieldName');
            });

            // Gates
            privateProperty(this, 'addGates', function (gates) {
                addItems(this, 'gates', gates, 'name');
            });

            privateProperty(this, 'addGate', function (gate) {
                addItem(this, 'gates', gate, 'name');
            });

            privateProperty(this, 'getGate', function (name) {
                return getItem(this, 'gates', name, 'name');
            });

            privateProperty(this, 'removeGate', function (gate) {
                removeItem(this, 'gates', gate, 'name');
            });

            // Geom
            privateProperty(this, 'contains', function (geojson, assets) {
                return contains(this, geojson, assets);
            });

            privateProperty(this, 'centroid', function (assets) {
                return centroid(this, assets);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'fields', []);
            Base.initializeObject(this.data, 'gates', []);
            Base.initializeObject(this.data, 'ignoredLandClasses', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;
        }

        function farmNameUnique (instance, name, farms) {
            var trimmedValue = s.trim(name || '').toLowerCase();

            return !underscore.isEmpty(trimmedValue) && !underscore.chain(farms)
                .reject(function (farm) {
                    return instance.id === farm.id;
                })
                .some(function (farm) {
                    return (s.trim(farm.name).toLowerCase() === trimmedValue);
                })
                .value();
        }

        inheritModel(Farm, Model.Base);

        function addItems (instance, dataStore, items, compareProp) {
            underscore.each(items, function (item) {
                addItem(instance, dataStore, item, compareProp);
            })
        }

        function addItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.chain(instance.data[dataStore])
                    .reject(function (dsItem) {
                        return dsItem[compareProp] === item[compareProp];
                    })
                    .union([asJson(item)])
                    .value()
                    .sort(function (a, b) {
                        return naturalSort(a[compareProp], b[compareProp]);
                    });

                instance.$dirty = true;
            }
        }

        function getItem (instance, dataStore, value, compareProp) {
            return underscore.find(instance.data[dataStore], function (dsItem) {
                return dsItem[compareProp] === value;
            });
        }

        function removeItem (instance, dataStore, item, compareProp) {
            if (item) {
                instance.data[dataStore] = underscore.reject(instance.data[dataStore], function (dsItem) {
                    return dsItem[compareProp] === item[compareProp];
                });

                instance.$dirty = true;
            }
        }

        function getAssetsGeom (instance, assets) {
            return underscore.chain(assets)
                .filter(function (asset) {
                    return asset.farmId === instance.id && asset.data && asset.data.loc;
                })
                .reduce(function (geom, asset) {
                    var assetGeom = topologyHelper.readGeoJSON(asset.data.loc);

                    return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                }, null)
                .value();
        }

        function contains (instance, geojson, assets) {
            var farmGeom = getAssetsGeom(instance, assets),
                queryGeom = topologyHelper.readGeoJSON(geojson);

            return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
        }

        function centroid (instance, assets) {
            var geom = getAssetsGeom(instance, assets);

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        }

        Farm.validates({
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return Farm;
    }]);

var sdkModelField = angular.module('ag.sdk.model.field', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelField.factory('Field', ['computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Field (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'croppingPotentialRequired', function () {
                return s.include(this.landUse, 'Cropland');
            });

            computedProperty(this, 'hasGeometry', function () {
                return !underscore.isUndefined(this.loc);
            });

            computedProperty(this, 'establishedDateRequired', function () {
                return s.include(this.landUse, 'Orchard');
            });

            computedProperty(this, 'terrainRequired', function () {
                return s.include(this.landUse, 'Grazing');
            });

            privateProperty(this, 'setIrrigatedFromLandUse', function () {
                this.irrigated = irrigatedFromLandUse(this.landUse);
            });

            privateProperty(this, 'fieldNameUnique', function (fieldName, farm) {
                return fieldNameUnique(this, fieldName, farm);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.crop = attrs.crop;
            this.croppingPotential = attrs.croppingPotential;
            this.effectiveDepth = attrs.effectiveDepth;
            this.farmName = attrs.farmName;
            this.fieldName = attrs.fieldName;
            this.irrigated = attrs.irrigated;
            this.irrigationType = attrs.irrigationType;
            this.landUse = attrs.landUse;
            this.loc = attrs.loc;
            this.sgKey = attrs.sgKey;
            this.size = attrs.size;
            this.soilTexture = attrs.soilTexture;
            this.source = attrs.source;
            this.terrain = attrs.terrain;
            this.waterSource = attrs.waterSource;

            convertLandUse(this);
        }

        function convertLandUse (instance) {
            switch (instance.landUse) {
                case 'Cropland':
                    if (instance.irrigated) {
                        instance.landUse = 'Cropland (Irrigated)';
                    }
                    break;
                case 'Building':
                    instance.landUse = 'Built-up';
                    break;
                case 'Conservation':
                    instance.landUse = 'Protected Area';
                    break;
                case 'Homestead':
                case 'Housing':
                    instance.landUse = 'Residential';
                    break;
                case 'Horticulture (Intensive)':
                    instance.landUse = 'Greenhouses';
                    break;
                case 'Horticulture (Perennial)':
                    instance.landUse = 'Orchard';
                    break;
                case 'Horticulture (Seasonal)':
                    instance.landUse = 'Vegetables';
                    break;
            }
        }

        function fieldNameUnique (instance, fieldName, farm) {
            var trimmedValue = s.trim(fieldName || '').toLowerCase();

            return (farm && farm.data && !underscore.isEmpty(trimmedValue) && !underscore.some(farm.data.fields || [], function (field) {
                return (s.trim(field.fieldName).toLowerCase() === trimmedValue || (!underscore.isUndefined(instance.loc) && underscore.isEqual(field.loc, instance.loc)));
            }));
        }

        function irrigatedFromLandUse (landUse) {
            return s.include(landUse, 'Irrigated');
        }

        inheritModel(Field, Model.Base);

        readOnlyProperty(Field, 'croppingPotentials', [
            'Very High',
            'High',
            'Medium',
            'Low',
            'Very Low']);

        readOnlyProperty(Field, 'effectiveDepths', [
            '0 - 30cm',
            '30 - 60cm',
            '60 - 90cm',
            '90 - 120cm',
            '120cm +']);

        readOnlyProperty(Field, 'irrigationTypes', [
            'Centre-Pivot',
            'Drip',
            'Flood',
            'Micro',
            'Sprinkler',
            'Sub-drainage']);

        readOnlyProperty(Field, 'landClasses', [
            'Built-up',
            'Cropland',
            'Cropland (Emerging)',
            'Cropland (Irrigated)',
            'Cropland (Smallholding)',
            'Erosion',
            'Forest',
            'Grazing',
            'Grazing (Bush)',
            'Grazing (Fynbos)',
            'Grazing (Shrubland)',
            'Greenhouses',
            'Mining',
            'Non-vegetated',
            'Orchard',
            'Orchard (Shadenet)',
            'Pineapple',
            'Plantation',
            'Plantation (Smallholding)',
            'Planted Pastures',
            'Protected Area',
            'Residential',
            'Structures (Handling)',
            'Structures (Processing)',
            'Structures (Retail)',
            'Structures (Storage)',
            'Sugarcane',
            'Sugarcane (Emerging)',
            'Sugarcane (Irrigated)',
            'Tea',
            'Utilities',
            'Vegetables',
            'Vineyard',
            'Wasteland',
            'Water',
            'Water (Seasonal)',
            'Wetland']);

        readOnlyProperty(Field, 'soilTextures', [
            'Clay',
            'Clay Loam',
            'Clay Sand',
            'Coarse Sand',
            'Coarse Sandy Clay',
            'Coarse Sandy Clay Loam',
            'Coarse Sandy Loam',
            'Fine Sand',
            'Fine Sandy Clay',
            'Fine Sandy Clay Loam',
            'Fine Sandy Loam',
            'Gravel',
            'Loam',
            'Loamy Coarse Sand',
            'Loamy Fine Sand',
            'Loamy Medium Sand',
            'Loamy Sand',
            'Medium Sand',
            'Medium Sandy Clay',
            'Medium Sandy Clay Loam',
            'Medium Sandy Loam',
            'Other',
            'Sand',
            'Sandy Clay',
            'Sandy Clay Loam',
            'Sandy Loam',
            'Silty Clay',
            'Silty Loam']);

        readOnlyProperty(Field, 'waterSources', [
            'Borehole',
            'Dam',
            'Irrigation Scheme',
            'River']);

        readOnlyProperty(Field, 'terrains', [
            'Mountains',
            'Plains']);

        privateProperty(Field, 'getIrrigatedFromLandUse', function (landUse) {
            return irrigatedFromLandUse(landUse);
        });

        privateProperty(Field, 'isLandUse', function (landUse) {
            return landUse && underscore.contains(Field.landClasses, landUse);
        });

        Field.validates({
            croppingPotential: {
                required: false,
                inclusion: {
                    in: Field.croppingPotentials
                }
            },
            effectiveDepth: {
                required: false,
                inclusion: {
                    in: Field.effectiveDepths
                }
            },
            farmName: {
                required: true,
                length: {
                    min: 0,
                    max: 255
                }
            },
            fieldName: {
                required: true,
                length: {
                    min: 0,
                    max: 255
                }
            },
            landUse: {
                required: true,
                inclusion: {
                    in: Field.landClasses
                }
            },
            loc: {
                required: false,
                object: true
            },
            size: {
                required: true,
                numeric: true
            },
            sgKey: {
                required: false,
                numeric: true
            },
            soilTexture: {
                required: false,
                inclusion: {
                    in: Field.soilTextures
                }
            },
            source: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            terrain: {
                requiredIf: function (value, instance, field) {
                    return instance.terrainRequired;
                },
                inclusion: {
                    in: Field.terrains
                }
            },
            waterSource: {
                required: false,
                inclusion: {
                    in: Field.waterSources
                }
            }
        });

        return Field;
    }]);

var sdkModelFinancial = angular.module('ag.sdk.model.financial', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.utilities']);

sdkModelFinancial.factory('FinancialBase', ['Base', 'inheritModel', 'Model', 'privateProperty', 'safeMath', 'underscore',
    function (Base, inheritModel, Model, privateProperty, safeMath, underscore) {
        function FinancialBase (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'assets', {});
            Base.initializeObject(this.data, 'liabilities', {});
            Base.initializeObject(this.data, 'ratios', {});

            privateProperty(this, 'recalculate', function () {
                return recalculate(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.grossProfit = attrs.grossProfit;
            this.netProfit = attrs.netProfit;
            this.netWorth = attrs.netWorth;
            this.year = attrs.year;

            convert(this);
        }

        function convert(instance) {
            underscore.each(['assets', 'liabilities'], function (group) {
                instance.data[group] = underscore.chain(instance.data[group])
                    .omit('undefined')
                    .mapObject(function (categories, type) {
                        return (!underscore.isArray(categories) ?
                            categories :
                            underscore.chain(categories)
                                .map(function (category) {
                                    return [category.name, category.estimatedValue];
                                })
                                .object()
                                .value());
                    })
                    .value();
            });
        }

        inheritModel(FinancialBase, Model.Base);

        function calculateRatio (numeratorProperties, denominatorProperties) {
            numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
            denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

            var numerator = underscore.reduce(numeratorProperties, function (total, value) {
                    return safeMath.plus(total, value);
                }, 0),
                denominator = underscore.reduce(denominatorProperties, function (total, value) {
                    return safeMath.plus(total, value);
                }, 0);

            return safeMath.round(safeMath.dividedBy(numerator, denominator), 2);
        }

        function recalculate (instance) {
            instance.data.totalAssets = safeMath.round(underscore.chain(instance.data.assets)
                .values()
                .reduce(function (total, categories) {
                    return underscore.reduce(categories, function (total, value) {
                        return safeMath.plus(total, value);
                    }, total);
                }, 0)
                .value());
            instance.data.totalLiabilities = safeMath.round(underscore.chain(instance.data.liabilities)
                .values()
                .reduce(function (total, categories) {
                    return underscore.reduce(categories, function (total, value) {
                        return safeMath.plus(total, value);
                    }, total);
                }, 0)
                .value());

            instance.netWorth = safeMath.round(safeMath.minus(instance.data.totalAssets, instance.data.totalLiabilities), 2);
            instance.grossProfit = safeMath.round(safeMath.minus(instance.data.productionIncome, instance.data.productionExpenditure), 2);

            instance.data.ebitda = safeMath.round(safeMath.minus(safeMath.plus(instance.grossProfit, instance.data.otherIncome), instance.data.otherExpenditure), 2);
            instance.data.ebit = safeMath.round(safeMath.minus(instance.data.ebitda, instance.data.depreciationAmortization), 2);
            instance.data.ebt = safeMath.round(safeMath.minus(instance.data.ebit, instance.data.interestPaid), 2);

            instance.netProfit = safeMath.round(safeMath.minus(instance.data.ebt, instance.data.taxPaid), 2);

            instance.data.ratios = {
                debt: calculateRatio(instance.data.totalLiabilities, instance.data.totalAssets),
                debtToTurnover: calculateRatio(instance.data.totalLiabilities, [instance.data.productionIncome, instance.data.otherIncome]),
                gearing: calculateRatio(instance.data.totalLiabilities, instance.netWorth),
                inputOutput: calculateRatio(instance.data.productionIncome, instance.data.productionExpenditure),
                interestCover: calculateRatio(instance.grossProfit, instance.data.interestPaid),
                interestToTurnover: calculateRatio(instance.data.interestPaid, [instance.data.productionIncome, instance.data.otherIncome]),
                productionCost: calculateRatio(instance.data.productionExpenditure, instance.data.productionIncome),
                returnOnInvestment: calculateRatio(instance.grossProfit, instance.data.totalAssets)
            };

            instance.$dirty = true;
        }

        FinancialBase.validates({
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return FinancialBase;
    }]);

sdkModelFinancial.factory('Financial', ['inheritModel', 'FinancialBase', 'underscore',
    function (inheritModel, FinancialBase, underscore) {
        function Financial (attrs) {
            FinancialBase.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.legalEntityId = attrs.legalEntityId;

            // Models
            this.legalEntity = attrs.legalEntity;
        }

        inheritModel(Financial, FinancialBase);

        Financial.validates({
            legalEntityId: {
                required: true,
                numeric: true
            },
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return Financial;
    }]);


sdkModelFinancial.factory('FinancialGroup', ['inheritModel', 'Financial', 'FinancialBase', 'privateProperty', 'safeMath', 'underscore',
    function (inheritModel, Financial, FinancialBase, privateProperty, safeMath, underscore) {
        function FinancialGroup (attrs) {
            FinancialBase.apply(this, arguments);

            privateProperty(this, 'addFinancial', function (financial) {
                addFinancial(this, financial);
            });

            this.financials = [];

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            underscore.each(attrs.financials, this.addFinancial, this);
        }

        inheritModel(FinancialGroup, FinancialBase);

        function addFinancial (instance, financial) {
            financial = (financial instanceof Financial ? financial : Financial.new(financial));

            instance.year = financial.year;

            instance.financials = underscore.chain(instance.financials)
                .reject(function (item) {
                    return item.legalEntityId === financial.legalEntityId && item.year === financial.year;
                })
                .union([financial])
                .value();

            instance.data = underscore.chain(instance.financials)
                .reduce(function (data, financial) {
                    underscore.each(['assets', 'liabilities'], function (group) {
                        underscore.each(financial.data[group], function (categories, type) {
                            data[group][type] = underscore.reduce(categories, function (result, value, category) {
                                result[category] = safeMath.plus(result[category], value);

                                return result;
                            }, data[group][type] || {});
                        });
                    });

                    return data;
                }, {
                    assets: {},
                    liabilities: {},
                    ratios: {}
                })
                .extend(underscore.chain(['productionIncome', 'productionExpenditure', 'otherIncome', 'otherExpenditure', 'depreciationAmortization', 'interestPaid', 'taxPaid'])
                    .map(function (key) {
                        return [key, underscore.chain(instance.financials)
                            .pluck('data')
                            .pluck(key)
                            .reduce(function(total, value) {
                                return safeMath.plus(total, value);
                            }, 0)
                            .value()];
                    })
                    .object()
                    .value())
                .value();

            instance.recalculate();
        }

        FinancialGroup.validates({
            year: {
                numeric: true,
                range: {
                    from: 1000,
                    to: 9999
                }
            }
        });

        return FinancialGroup;
    }]);
var sdkModelLayer= angular.module('ag.sdk.model.layer', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.geospatial']);

sdkModelLayer.factory('Layer', ['inheritModel', 'Locale', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Locale, privateProperty, readOnlyProperty, underscore) {
        function Layer (attrs) {
            Locale.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.province = attrs.province;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            this.organization = attrs.organization;
            this.sublayers = attrs.sublayers;
        }

        inheritModel(Layer, Locale);

        privateProperty(Layer, 'listMap', function (item) {
            return {
                title: item.name,
                subtitle: item.province
            }
        });

        Layer.validates({
            comments: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            },
            geometry: {
                required: false,
                object: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: false,
                numeric: true
            },
            province: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            type: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Layer;
    }]);


sdkModelLayer.factory('Sublayer', ['computedProperty', 'inheritModel', 'Locale', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (computedProperty, inheritModel, Locale, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Sublayer (attrs) {
            Locale.apply(this, arguments);

            computedProperty(this, 'geom', function () {
                return topologyHelper.readGeoJSON(this.geometry);
            });

            privateProperty(this, 'contains', function (geometry) {
                return geometryRelation(this, 'contains', geometry);
            });

            privateProperty(this, 'covers', function (geometry) {
                return geometryRelation(this, 'covers', geometry);
            });

            privateProperty(this, 'crosses', function (geometry) {
                return geometryRelation(this, 'crosses', geometry);
            });

            privateProperty(this, 'intersects', function (geometry) {
                return geometryRelation(this, 'intersects', geometry);
            });

            privateProperty(this, 'overlaps', function (geometry) {
                return geometryRelation(this, 'overlaps', geometry);
            });

            privateProperty(this, 'touches', function (geometry) {
                return geometryRelation(this, 'touches', geometry);
            });

            privateProperty(this, 'within', function (geometry) {
                return geometryRelation(this, 'within', geometry);
            });

            privateProperty(this, 'withinOrCovers', function (geometry) {
                return (geometryRelation(this, 'within', geometry) ||
                    (geometryRelation(this, 'intersects', geometry) && geometryArea(geometryManipulation(this, 'difference', geometry)) < 0.001));
            });

            privateProperty(this, 'subtract', function (geometry) {
                var geom = saveGeometryManipulation(this, 'difference', geometry);

                if (geometryArea(geom) == 0) {
                    this.geometry = undefined;
                }
            });

            privateProperty(this, 'add', function (geometry) {
                saveGeometryManipulation(this, 'union', geometry);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.data = attrs.data;
            this.code = attrs.code;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.geometry = attrs.geometry;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.layerId = attrs.layerId;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            this.organization = attrs.organization;
            this.layer = attrs.layer;
        }

        inheritModel(Sublayer, Locale);

        privateProperty(Sublayer, 'listMap', function (item) {
            return {
                title: item.name,
                subtitle: item.layer.province + (item.code ? ' - ' + item.code : ''),
                layer: item.layer.name
            }
        });

        function geometryArea (geometry) {
            return (geometry && geometry.getArea());
        }

        function geometryEmpty (geometry) {
            return (geometry && geometry.isEmpty());
        }

        function geometryRelation (instance, relation, geometry) {
            var geom = instance.geom;

            return (geom && geometry && geom[relation] ? geom[relation](geometry) : false);
        }

        function geometryManipulation (instance, manipulation, geometry) {
            var geom = instance.geom;

            return (geom && geometry && geom[manipulation] ? geom[manipulation](geometry) : geom);
        }

        function saveGeometryManipulation (instance, manipulation, geometry) {
            var geom = geometryManipulation(instance, manipulation, geometry);

            if (geom) {
                instance.$dirty = true;
                instance.geometry = topologyHelper.writeGeoJSON(geom);
            }

            return geom;
        }

        Sublayer.validates({
            code: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            comments: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            },
            data: {
                required: false,
                object: true
            },
            geometry: {
                required: true,
                object: true
            },
            layerId: {
                required: true,
                numeric: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: false,
                numeric: true
            },
            type: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return Sublayer;
    }]);

var sdkModelLegalEntity = angular.module('ag.sdk.model.legal-entity', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.asset', 'ag.sdk.model.liability']);

sdkModelLegalEntity.provider('LegalEntity', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['Base', 'Asset', 'computedProperty', 'Financial', 'inheritModel', 'Liability', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (Base, Asset, computedProperty, Financial, inheritModel, Liability, Model, privateProperty, readOnlyProperty, underscore) {
            function LegalEntity (attrs) {
                Model.Base.apply(this, arguments);

                computedProperty(this, 'contactNameRequired', function () {
                    return contactNameRequired(this);
                });

                this.data = (attrs && attrs.data ? attrs.data : {});
                Base.initializeObject(this.data, 'attachments', []);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.addressCity = attrs.addressCity;
                this.addressCode = attrs.addressCode;
                this.addressDistrict = attrs.addressDistrict;
                this.addressStreet = attrs.addressStreet;
                this.cifKey = attrs.cifKey;
                this.contactName = attrs.contactName;
                this.email = attrs.email;
                this.fax = attrs.fax;
                this.isActive = attrs.isActive;
                this.isPrimary = attrs.isPrimary;
                this.mobile = attrs.mobile;
                this.name = attrs.name;
                this.organizationId = attrs.organizationId;
                this.registrationNumber = attrs.registrationNumber;
                this.telephone = attrs.telephone;
                this.type = attrs.type;
                this.uuid = attrs.uuid;

                this.assets = underscore.map(attrs.assets, Asset.newCopy);
                this.financials = underscore.map(attrs.financials, Financial.newCopy);
                this.liabilities = underscore.map(attrs.liabilities, Liability.newCopy);
            }

            function contactNameRequired (instance) {
                return instance && instance.type && !underscore.contains(['Individual', 'Sole Proprietary'], instance.type);
            }

            inheritModel(LegalEntity, Model.Base);

            readOnlyProperty(LegalEntity, 'legalEntityTypes', [
                'Individual',
                'Sole Proprietary',
                'Joint account',
                'Partnership',
                'Close Corporation',
                'Private Company',
                'Public Company',
                'Trust',
                'Non-Profitable companies',
                'Cooperatives',
                'In- Cooperatives',
                'Other Financial Intermediaries']);

            privateProperty(LegalEntity, 'getContactNameRequired', function (instance) {
                return contactNameRequired(instance);
            });

            LegalEntity.validates({
                addressCity: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressCode: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressDistrict: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressStreet: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                email: {
                    required: true,
                    format: {
                        email: true
                    }
                },
                fax: {
                    format: {
                        telephone: true
                    }
                },
                mobile: {
                    format: {
                        telephone: true
                    }
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                },
                registrationNumber: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                telephone: {
                    format: {
                        telephone: true
                    }
                },
                type: {
                    required: true,
                    inclusion: {
                        in: LegalEntity.legalEntityTypes
                    }
                },
                uuid: {
                    format: {
                        uuid: true
                    }
                }
            });

            return LegalEntity;
        }];

    listServiceMapProvider.add('legal entity', ['attachmentHelper', 'underscore', function (attachmentHelper, underscore) {
        return function (item) {
            var thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/profile-user.png');

            return underscore.extend({
                id: item.id || item.$id,
                title: item.name,
                subtitle: item.type
            }, (thumbnailUrl ? {
                thumbnailUrl: thumbnailUrl
            } : {}));
        };
    }]);
}]);

var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelLiability.factory('Liability', ['computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function (computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, safeArrayMath, safeMath, underscore) {
        var _frequency = {
            'monthly': 12,
            'bi-monthly': 24,
            'quarterly': 4,
            'bi-yearly': 2,
            'yearly': 1
        };

        var _types = {
            'short-term': 'Short-term',
            'medium-term': 'Medium-term',
            'long-term': 'Long-term',
            'production-credit': 'Production Credit',
            'rent': 'Rent'
        };

        var _typesWithInstallmentPayments = ['short-term', 'medium-term', 'long-term', 'rent'];
        var _typesWithAmount = ['short-term', 'medium-term', 'long-term'];
        var _typesWithName = ['production-credit', 'other'];

        function defaultMonth () {
            return {
                opening: 0,
                repayment: {},
                withdrawal: 0,
                balance: 0,
                interest: 0,
                closing: 0
            }
        }

        function initializeMonthlyTotals (instance, monthlyData, upToIndex) {
            while (monthlyData.length <= upToIndex) {
                monthlyData.push(defaultMonth());
            }

            recalculateMonthlyTotals(instance, monthlyData);
        }

        function recalculateMonthlyTotals (instance, monthlyData) {
            var startMonth = moment(instance.startDate, 'YYYY-MM-DD').month(),
                paymentMonths = instance.paymentMonths,
                paymentsPerMonth = (_frequency[instance.frequency] > 12 ? _frequency[instance.frequency] / 12 : 1);

            underscore.each(monthlyData, function (month, index) {
                var currentMonth = (index + startMonth) % 12;

                month.opening = (index === 0 ? instance.getLiabilityOpening() : monthlyData[index - 1].closing);

                if ((this.frequency === 'once' && index === 0) || (instance.installmentPayment > 0 && underscore.contains(paymentMonths, currentMonth))) {
                    var installmentPayment = (this.frequency === 'once' ? month.opening : safeMath.times(instance.installmentPayment, paymentsPerMonth));

                    if (instance.type === 'rent') {
                        month.repayment.bank = installmentPayment;
                    } else if (month.opening > 0) {
                        month.repayment.bank = (month.opening <= installmentPayment ? month.opening : installmentPayment);
                    }
                }

                month.balance = safeMath.round(Math.max(0, safeMath.minus(safeMath.plus(month.opening, month.withdrawal), safeArrayMath.reduce(month.repayment))), 2);
                month.interest = safeMath.round(safeMath.dividedBy(safeMath.times(safeMath.dividedBy(instance.interestRate, 12), month.balance), 100), 2);
                month.closing = safeMath.round((month.balance === 0 ? 0 : safeMath.plus(month.balance, month.interest)), 2);
            });
        }

        function liabilityInMonth (instance, month) {
            var startMonth = moment(instance.offsetDate, 'YYYY-MM-DD'),
                currentMonth = moment(month, 'YYYY-MM-DD'),
                appliedMonth = currentMonth.diff(startMonth, 'months');

            var monthlyData = angular.copy(instance.data.monthly || []);
            initializeMonthlyTotals(instance, monthlyData, appliedMonth);

            return monthlyData[appliedMonth] || defaultMonth();
        }

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            computedProperty(this, 'title', function () {
                return this.name || this.category;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = (underscore.isUndefined(this.data.month) ? moment(this.offsetDate, 'YYYY-MM-DD').month() : this.data.month);

                return underscore
                    .range(firstPaymentMonth, firstPaymentMonth + 12, (paymentsPerYear < 12 ? 12 / paymentsPerYear : 1))
                    .map(function (value) {
                        return value % 12;
                    })
                    .sort(function (a, b) {
                        return a - b;
                    });
            });

            computedProperty(this, 'offsetDate', function () {
                return (this.startDate && this.openingDate ?
                    (moment(this.startDate).isBefore(this.openingDate) ? this.openingDate : this.startDate) :
                    (this.startDate ? this.startDate : this.openingDate));
            });

            /**
             * Get liability/balance in month
             */
            privateProperty(this, 'liabilityInMonth', function (month) {
                return liabilityInMonth(this, month);
            });

            privateProperty(this, 'balanceInMonth', function (month) {
                return this.liabilityInMonth(month).closing || 0;
            });

            computedProperty(this, 'currentBalance', function () {
                return (this.type !== 'rent' ? this.balanceInMonth(moment().startOf('month')) : 0);
            });

            privateProperty(this, 'recalculate', function () {
                this.data.monthly = this.data.monthly || [];

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            /**
             * Set/add repayment/withdrawal in month
             */
            privateProperty(this, 'resetWithdrawalAndRepayments', function () {
                this.data.monthly = [];
            });

            privateProperty(this, 'resetRepayments', function () {
                underscore.each(this.data.monthly, function (month) {
                    month.repayment = {};
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'resetWithdrawals', function () {
                underscore.each(this.data.monthly, function (month) {
                    month.withdrawal = 0;
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'resetWithdrawalsInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    appliedStartMonth = moment(rangeStart, 'YYYY-MM-DD').diff(startMonth, 'months'),
                    appliedEndMonth = moment(rangeEnd, 'YYYY-MM-DD').diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];

                appliedStartMonth = (appliedStartMonth < 0 ? 0 : appliedStartMonth);
                appliedEndMonth = (appliedEndMonth > this.data.monthly.length ? this.data.monthly.length : appliedEndMonth);

                for (var i = appliedStartMonth; i < appliedEndMonth; i++) {
                    this.data.monthly[i].withdrawal = 0;
                }

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'addRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                source = source || 'bank';

                var repaymentRemainder = repayment;

                // applied month is not before the offsetDate, add repayment and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        summedRepayment = safeArrayMath.reduce(monthLiability.repayment),
                        openingPlusBalance = safeMath.minus(safeMath.plus(monthLiability.opening, monthLiability.withdrawal), summedRepayment),
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = safeMath.round(safeMath.minus(repayment, limitedRepayment), 2);
                    monthLiability.repayment[source] = safeMath.plus(monthLiability.repayment[source], limitedRepayment);

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'setRepaymentInMonth', function (repayment, month, source) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                source = source || 'bank';

                var repaymentRemainder = repayment;

                // applied month is not before the offsetDate, add repayment and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        repaymentWithoutSource = underscore.reduce(monthLiability.repayment, function (total, amount, repaymentSource) {
                            return total + (repaymentSource === source ? 0 : amount || 0)
                        }, 0),
                        openingPlusBalance = safeMath.minus(safeMath.plus(monthLiability.opening, monthLiability.withdrawal), repaymentWithoutSource),
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = safeMath.round(safeMath.minus(repayment, limitedRepayment), 2);
                    monthLiability.repayment[source] = limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
            });

            privateProperty(this, 'removeRepaymentInMonth', function (month, source) {
                source = source || 'bank';

                underscore.each(this.data.monthly, function (item, key) {
                    if (month === key) {
                        delete item.repayment[source];
                    }
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'addWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                // applied month is not before the offsetDate, add withdrawal and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        summedWithdrawal = safeMath.plus(withdrawal, monthLiability.withdrawal),
                        openingMinusRepayment = safeMath.minus(monthLiability.opening, safeArrayMath.reduce(monthLiability.repayment)),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, safeMath.minus(this.creditLimit, openingMinusRepayment)), summedWithdrawal) : summedWithdrawal),
                        withdrawalRemainder = safeMath.round(safeMath.minus(summedWithdrawal, limitedWithdrawal), 2);

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            privateProperty(this, 'setWithdrawalInMonth', function (withdrawal, month) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                // applied month is not before the offsetDate, add withdrawal and do calculation
                if(appliedMonth > -1) {
                    this.data.monthly = this.data.monthly || [];
                    initializeMonthlyTotals(this, this.data.monthly, appliedMonth);

                    var monthLiability = this.data.monthly[appliedMonth],
                        openingMinusRepayment = safeMath.minus(monthLiability.opening, safeArrayMath.reduce(monthLiability.repayment)),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, safeMath.minus(this.creditLimit, openingMinusRepayment)), withdrawal) : withdrawal),
                        withdrawalRemainder = safeMath.round(safeMath.minus(withdrawal, limitedWithdrawal), 2);

                    monthLiability.withdrawal = limitedWithdrawal;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return withdrawalRemainder;
            });

            /**
             * Ranges of liability
             */
            privateProperty(this, 'liabilityInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    rangeStartMonth = moment(rangeStart, 'YYYY-MM-DD'),
                    rangeEndMonth = moment(rangeEnd, 'YYYY-MM-DD'),
                    appliedStartMonth = rangeStartMonth.diff(startMonth, 'months'),
                    appliedEndMonth = rangeEndMonth.diff(startMonth, 'months'),
                    paddedOffset = (appliedStartMonth < 0 ? Math.min(rangeEndMonth.diff(rangeStartMonth, 'months'), Math.abs(appliedStartMonth)) : 0);

                var monthlyData = angular.copy(this.data.monthly || []);
                initializeMonthlyTotals(this, monthlyData, appliedEndMonth);

                return underscore.range(paddedOffset)
                    .map(defaultMonth)
                    .concat(monthlyData.slice(appliedStartMonth + paddedOffset, appliedEndMonth));
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilityInRange(rangeStart, rangeEnd), function (total, liability) {
                    return safeMath.plus(total, (typeof liability.repayment == 'number' ? liability.repayment : safeArrayMath.reduce(liability.repayment)));
                }, 0);
            });

            privateProperty(this, 'getLiabilityOpening', function () {
                return (moment(this.startDate).isBefore(this.openingDate) && !underscore.isUndefined(this.openingBalance) ? this.openingBalance : this.amount) || 0;
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.name = attrs.name;
            this.type = attrs.type;
            this.category = attrs.category;
            this.openingBalance = attrs.openingBalance;
            this.installmentPayment = attrs.installmentPayment;
            this.interestRate = attrs.interestRate || 0;
            this.creditLimit = attrs.creditLimit;
            this.frequency = attrs.frequency;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.openingDate = attrs.openingDate && moment(attrs.openingDate).format('YYYY-MM-DD') || this.startDate;
            this.amount = attrs.amount || this.openingBalance;

            // TODO: Add merchant model
            this.merchant = attrs.merchant;
        }

        inheritModel(Liability, Model.Base);

        readOnlyProperty(Liability, 'frequencyTypes', {
            'once': 'One Time',
            'bi-monthly': 'Bi-Monthly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'bi-yearly': 'Bi-Annually',
            'yearly': 'Annually'
        });

        readOnlyProperty(Liability, 'frequencyTypesWithCustom', underscore.extend({
            'custom': 'Custom'
        }, Liability.frequencyTypes));

        privateProperty(Liability, 'getFrequencyTitle', function (type) {
            return Liability.frequencyTypesWithCustom[type] || '';
        });

        readOnlyProperty(Liability, 'liabilityTypes', _types);

        readOnlyProperty(Liability, 'liabilityTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Liability.liabilityTypes));

        privateProperty(Liability, 'getTypeTitle', function (type) {
            return Liability.liabilityTypesWithOther[type] || '';
        });

        privateProperty(Liability, 'getLiabilityInMonth', function (liability, month) {
            return liabilityInMonth(Liability.newCopy(liability), month);
        });

        readOnlyProperty(Liability, 'liabilityCategories', {
            'long-term': ['Bonds', 'Loans', 'Other'],
            'medium-term': ['Terms Loans', 'Instalment Sale Credit', 'Leases', 'Other'],
            'short-term': ['Bank', 'Co-operative', 'Creditors', 'Income Tax', 'Bills Payable', 'Portion of Term Commitments', 'Other'],
            'production-credit': ['Off Taker', 'Input Supplier', 'Input Financing']
        });

        function isLeased (value, instance, field) {
            return instance.type === 'rent';
        }

        function isOtherType (value, instance, field) {
            return instance.type === 'other';
        }

        function hasCategory (value, instance, field) {
            return !underscore.isEmpty(Liability.liabilityCategories[instance.type]);
        }

        Liability.validates({
            amount: {
                requiredIf: function (value, instance, field) {
                    return !isLeased(value, instance, field);
                },
                numeric: true
            },
            openingBalance: {
                required: true,
                numeric: true
            },
            installmentPayment: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(_typesWithInstallmentPayments, instance.type) &&
                        (instance.type !== 'production-credit' && !angular.isNumber(instance.interestRate));
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            interestRate: {
                required: true,
                range: {
                    from: 0,
                    to: 100
                },
                numeric: true
            },
            creditLimit: {
                requiredIf: function (value, instance, field) {
                    return (instance.type === 'production-credit' && instance.data.category === 'Input Financing') ||
                        (instance.type !== 'production-credit' && !angular.isNumber(instance.installmentPayment));
                },
                range: {
                    from: 0
                },
                numeric: true
            },
            merchantUuid: {
                requiredIf: function (value, instance, field) {
                    return !isOtherType(value, instance, field);
                },
                format: {
                    uuid: true
                }
            },
            frequency: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.frequencyTypesWithCustom)
                }
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Liability.liabilityTypesWithOther)
                }
            },
            category: {
                requiredIf: hasCategory,
                inclusion: {
                    in: function (value, instance, field) {
                        return Liability.liabilityCategories[instance.type];
                    }
                }
            },
            data: {
                required: true,
                object: true
            },
            name: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(_typesWithName, instance.type);
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            openingDate: {
                required: false,
                format: {
                    date: true
                }
            },
            endDate: {
                requiredIf: function (value, instance, field) {
                    return isLeased(value, instance, field) || instance.type === 'custom';
                },
                format: {
                    date: true
                }
            }
        });

        return Liability;
    }]);

var sdkModelLocale  = angular.module('ag.sdk.model.locale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelLocale.factory('Locale', ['computedProperty', 'Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, Base, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Locale (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'countryLocale', function () {
                return countryLocale(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.country = attrs.country;
        }

        inheritModel(Locale, Model.Base);

        function countryLocale (instance) {
            return underscore.findWhere(Locale.countryLocales, {
                country: (instance && instance.country || 'South Africa')
            });
        }

        privateProperty(Locale, 'countryLocale', function (instance) {
            return countryLocale(instance);
        });

        readOnlyProperty(Locale, 'countryLocales', underscore.map([
            [[41.1424498947,20.0498339611], 'Albania',6, 'Lek', 'ALL', 'Lek'],
            [[33.8352307278,66.0047336558], 'Afghanistan',6, 'Afghani', 'AFN', '؋'],
            [[-35.3813487953,-65.179806925], 'Argentina',6, 'Peso', 'ARS', '$'],
            [[-25.7328870417,134.491000082], 'Australia',6, 'Dollar', 'AUD', '$'],
            [[40.2882723471,47.5459987892], 'Azerbaijan',6, 'Manat', 'AZN', '₼'],
            [[24.2903670223,-76.6284303802], 'Bahamas',6, 'Dollar', 'BSD', '$'],
            [[13.1814542822,-59.5597970021], 'Barbados',6, 'Dollar', 'BBD', '$'],
            [[53.5313137685,28.0320930703], 'Belarus',6, 'Ruble', 'BYN', 'Br'],
            [[17.2002750902,-88.7101048564], 'Belize',6, 'Dollar', 'BZD', 'BZ$'],
            [[32.3136780208,-64.7545588982], 'Bermuda',6, 'Dollar', 'BMD', '$'],
            [[-16.7081478725,-64.6853864515], 'Bolivia',6, 'Bolíviano', 'BOB', '$b'],
            [[44.1745012472,17.7687673323], 'Bosnia and Herzegovina',6, 'Convertible Marka', 'BAM', 'KM'],
            [[-22.1840321328,23.7985336773], 'Botswana',6, 'Pula', 'BWP', 'P'],
            [[42.7689031797,25.2155290863], 'Bulgaria',6, 'Lev', 'BGN', 'лв'],
            [[-10.7877770246,-53.0978311267], 'Brazil',6, 'Real', 'BRL', 'R$'],
            [[4.51968957503,114.722030354], 'Brunei Darussalam',6, 'Dollar', 'BND', '$'],
            [[12.7200478567,104.906943249], 'Cambodia',6, 'Riel', 'KHR', '៛'],
            [[61.3620632437,-98.3077702819], 'Canada',6, 'Dollar', 'CAD', '$'],
            [[19.4289649722,-80.9121332147], 'Cayman Islands',6, 'Dollar', 'KYD', '$'],
            [[-37.730709893,-71.3825621318], 'Chile',6, 'Peso', 'CLP', '$'],
            [[36.5617654559,103.81907349], 'China',6, 'Yuan Renminbi', 'CNY', '¥'],
            [[3.91383430725,-73.0811458241], 'Colombia',6, 'Peso', 'COP', '$'],
            [[9.9763446384,-84.1920876775], 'Costa Rica',6, 'Colon', 'CRC', '₡'],
            [[45.0804763057,16.404128994], 'Croatia',6, 'Kuna', 'HRK', 'kn'],
            [[21.6228952793,-79.0160538445], 'Cuba',6, 'Peso', 'CUP', '₱'],
            [[49.7334123295,15.3124016281], 'Czech Republic',6, 'Koruna', 'CZK', 'Kč'],
            [[55.9812529593,10.0280099191], 'Denmark',6, 'Krone', 'DKK', 'kr'],
            [[18.8943308233,-70.5056889612], 'Dominican Republic',6, 'Peso', 'DOP', 'RD$'],
            [[26.4959331064,29.8619009908], 'Egypt',6, 'Pound', 'EGP', '£'],
            [[13.7394374383,-88.8716446906], 'El Salvador',6, 'Colon', 'SVC', '$'],
            [[-51.7448395441,-59.35238956], 'Falkland Islands (Malvinas)',6, 'Pound', 'FKP', '£'],
            [[-17.4285803175,165.451954318], 'Fiji',6, 'Dollar', 'FJD', '$'],
            [[7.95345643541,-1.21676565807], 'Ghana',6, 'Cedi', 'GHS', '¢'],
            [[15.694036635,-90.3648200858], 'Guatemala',6, 'Quetzal', 'GTQ', 'Q'],
            [[49.4680976128,-2.57239063555], 'Guernsey',6, 'Pound', 'GGP', '£'],
            [[4.79378034012,-58.9820245893], 'Guyana',6, 'Dollar', 'GYD', '$'],
            [[14.8268816519,-86.6151660963], 'Honduras',6, 'Lempira', 'HNL', 'L'],
            [[22.3982773723,114.113804542], 'Hong Kong',6, 'Dollar', 'HKD', '$'],
            [[47.1627750614,19.3955911607], 'Hungary',6, 'Forint', 'HUF', 'Ft'],
            [[64.9957538607,-18.5739616708], 'Iceland',6, 'Krona', 'ISK', 'kr'],
            [[22.8857821183,79.6119761026], 'India',6, 'Rupee', 'INR', '₹'],
            [[-2.21505456346,117.240113662], 'Indonesia',6, 'Rupiah', 'IDR', 'Rp'],
            [[32.575032915,54.2740700448], 'Iran',6, 'Rial', 'IRR', '﷼'],
            [[54.2241891077,-4.53873952326], 'Isle of Man',6, 'Pound', 'IMP', '£'],
            [[31.4611010118,35.0044469277], 'Israel',6, 'Shekel', 'ILS', '₪'],
            [[18.1569487765,-77.3148259327], 'Jamaica',6, 'Dollar', 'JMD', 'J$'],
            [[37.592301353,138.030895577], 'Japan',6, 'Yen', 'JPY', '¥'],
            [[49.2183737668,-2.12689937944], 'Jersey',6, 'Pound', 'JEP', '£'],
            [[48.1568806661,67.2914935687], 'Kazakhstan',6, 'Tenge', 'KZT', 'лв'],
            [[40.1535031093,127.192479732], 'Korea (North)',6, 'Won', 'KPW', '₩'],
            [[36.3852398347,127.839160864], 'Korea (South)',6, 'Won', 'KRW', '₩'],
            [[41.4622194346,74.5416551329], 'Kyrgyzstan',6, 'Som', 'KGS', 'лв'],
            [[18.5021743316,103.73772412], 'Laos',6, 'Kip', 'LAK', '₭'],
            [[33.9230663057,35.880160715], 'Lebanon',6, 'Pound', 'LBP', '£'],
            [[6.45278491657,-9.3220757269], 'Liberia',6, 'Dollar', 'LRD', '$'],
            [[41.5953089336,21.6821134607], 'Macedonia',6, 'Denar', 'MKD', 'ден'],
            [[3.78986845571,109.697622843], 'Malaysia',6, 'Ringgit', 'MYR', 'RM'],
            [[-20.2776870433,57.5712055061], 'Mauritius',6, 'Rupee', 'MUR', '₨'],
            [[23.9475372406,-102.523451692], 'Mexico',6, 'Peso', 'MXN', '$'],
            [[46.8268154394,103.052997649], 'Mongolia',6, 'Tughrik', 'MNT', '₮'],
            [[-17.2738164259,35.5336754259], 'Mozambique',6, 'Metical', 'MZN', 'MT'],
            [[-22.1303256842,17.209635667], 'Namibia',6, 'Dollar', 'NAD', '$'],
            [[28.2489136496,83.9158264002], 'Nepal',6, 'Rupee', 'NPR', '₨'],
            [[-41.811135569,171.484923466], 'New Zealand',6, 'Dollar', 'NZD', '$'],
            [[12.8470942896,-85.0305296951], 'Nicaragua',6, 'Cordoba', 'NIO', 'C$'],
            [[9.59411452233,8.08943894771], 'Nigeria',6, 'Naira', 'NGN', '₦'],
            [[68.7501557205,15.3483465622], 'Norway',6, 'Krone', 'NOK', 'kr'],
            [[20.6051533257,56.0916615483], 'Oman',6, 'Rial', 'OMR', '﷼'],
            [[29.9497515031,69.3395793748], 'Pakistan',6, 'Rupee', 'PKR', '₨'],
            [[8.51750797491,-80.1191515612], 'Panama',6, 'Balboa', 'PAB', 'B/.'],
            [[-23.228239132,-58.400137032], 'Paraguay',6, 'Guarani', 'PYG', 'Gs'],
            [[-9.15280381329,-74.382426851], 'Peru',6, 'Sol', 'PEN', 'S/.'],
            [[11.7753677809,122.883932529], 'Philippines',6, 'Piso', 'PHP', '₱'],
            [[52.1275956442,19.3901283493], 'Poland',6, 'Zloty', 'PLN', 'zł'],
            [[25.3060118763,51.1847963212], 'Qatar',6, 'Riyal', 'QAR', '﷼'],
            [[45.8524312742,24.9729303933], 'Romania',6, 'Leu', 'RON', 'lei'],
            [[61.9805220919,96.6865611231], 'Russia',6, 'Ruble', 'RUB', '₽'],
            [[-12.4035595078,-9.5477941587], 'Saint Helena',6, 'Pound', 'SHP', '£'],
            [[24.1224584073,44.5368627114], 'Saudi Arabia',6, 'Riyal', 'SAR', '﷼'],
            [[44.2215031993,20.7895833363], 'Serbia',6, 'Dinar', 'RSD', 'Дин.'],
            [[-4.66099093522,55.4760327912], 'Seychelles',6, 'Rupee', 'SCR', '₨'],
            [[1.35876087075,103.81725592], 'Singapore',6, 'Dollar', 'SGD', '$'],
            [[-8.92178021692,159.632876678], 'Solomon Islands',6, 'Dollar', 'SBD', '$'],
            [[4.75062876055,45.7071448699], 'Somalia',6, 'Shilling', 'SOS', 'S'],
            [[-29.0003409534,25.0839009251], 'South Africa',5.1, 'Rand', 'ZAR', 'R'],
            [[7.61266509224,80.7010823782], 'Sri Lanka',6, 'Rupee', 'LKR', '₨'],
            [[62.7796651931,16.7455804869], 'Sweden',6, 'Krona', 'SEK', 'kr'],
            [[46.7978587836,8.20867470615], 'Switzerland',6, 'Franc', 'CHF', 'CHF'],
            [[4.1305541299,-55.9123456951], 'Suriname',6, 'Dollar', 'SRD', '$'],
            [[35.025473894,38.5078820425], 'Syria',6, 'Pound', 'SYP', '£'],
            [[23.753992795,120.954272814], 'Taiwan',6, 'New Dollar', 'TWD', 'NT$'],
            [[15.1181579418,101.002881304], 'Thailand',6, 'Baht', 'THB', '฿'],
            [[10.457334081,-61.2656792335], 'Trinidad and Tobago',6, 'Dollar', 'TTD', 'TT$'],
            [[39.0616029013,35.1689534649], 'Turkey',6, 'Lira', 'TRY', '₺'],
            [[48.9965667265,31.3832646865], 'Ukraine',6, 'Hryvnia', 'UAH', '₴'],
            [[54.1238715577,-2.86563164084], 'United Kingdom',6, 'Pound', 'GBP', '£'],
            [[45.6795472026,-112.4616737], 'United States',6, 'Dollar', 'USD', '$'],
            [[-32.7995153444,-56.0180705315], 'Uruguay',6, 'Peso', 'UYU', '$U'],
            [[41.7555422527,63.1400152805], 'Uzbekistan',6, 'Som', 'UZS', 'лв'],
            [[7.12422421273,-66.1818412311], 'Venezuela',6, 'Bolívar', 'VEF', 'Bs'],
            [[16.6460167019,106.299146978], 'Viet Nam',6, 'Dong', 'VND', '₫'],
            [[15.9092800505,47.5867618877], 'Yemen',6, 'Rial', 'YER', '﷼'],
            [[-19.0042041882,29.8514412019], 'Zimbabwe',6, 'Dollar', 'ZWD', 'Z$']
        ], function (countryLocale) {
            return underscore.object(['coordinates', 'country', 'zoom', 'currency', 'code', 'symbol'], countryLocale);
        }));

        Locale.validates({
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            }
        });

        return Locale;
    }]);



var sdkModelMapTheme = angular.module('ag.sdk.model.map-theme', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelMapTheme.factory('MapTheme', ['Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (Base, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function MapTheme (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'categories', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            // Models
            this.organization = attrs.organization;

            checkVersion(this);
        }

        function checkVersion(instance) {
            switch (instance.data.version) {
                case undefined:
                    instance.data = underscore.extend({
                        baseStyle: (instance.data.baseTile && MapTheme.baseStyles[instance.data.baseTile] ? instance.data.baseTile : 'Agriculture'),
                        categories: instance.data.categories,
                        center: instance.data.center,
                        zoom: {
                            value: instance.data.zoom
                        }
                    }, MapTheme.baseStyles[instance.data.baseTile] || MapTheme.baseStyles['Agriculture']);
            }

            instance.data.version = MapTheme.version;
        }

        inheritModel(MapTheme, Model.Base);

        readOnlyProperty(MapTheme, 'version', 1);

        readOnlyProperty(MapTheme, 'baseStyles', {
            'Agriculture': {
                style: 'mapbox://styles/agrista/cjdmrq0wu0iq02so2sevccwlm',
                sources: [],
                layers: []
            },
            'Satellite': {
                style: 'mapbox://styles/agrista/cjdmt8w570l3r2sql91xzgmbn',
                sources: [],
                layers: []
            },
            'Light': {
                style: 'mapbox://styles/agrista/cjdmt9c8q0mr02srgvyfo2qwg',
                sources: [],
                layers: []
            },
            'Dark': {
                style: 'mapbox://styles/agrista/cjdmt9w8d0o8x2so2xpcu4mm0',
                sources: [],
                layers: []
            }
        });

        MapTheme.validates({
            data: {
                required: true,
                object: true
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return MapTheme;
    }]);

var sdkModelFarmer = angular.module('ag.sdk.model.farmer', ['ag.sdk.model.organization']);

sdkModelFarmer.provider('Farmer', ['OrganizationFactoryProvider', function (OrganizationFactoryProvider) {
    this.$get = ['Organization', 'Base', 'computedProperty', 'inheritModel', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
        function (Organization, Base, computedProperty, inheritModel, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
            function Farmer (attrs) {
                Organization.apply(this, arguments);

                computedProperty(this, 'operationTypeDescription', function () {
                    return Farmer.operationTypeDescriptions[this.type] || '';
                });

                Base.initializeObject(this.data, 'enterprises', []);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.farms = attrs.farms || [];
                this.operationType = attrs.operationType;

                this.productionSchedules = underscore.map(attrs.productionSchedules, ProductionSchedule.newCopy);
            }

            inheritModel(Farmer, Organization);

            readOnlyProperty(Farmer, 'operationTypes', [
                'Unknown',
                'Commercial',
                'Recreational',
                'Smallholder'
            ]);

            readOnlyProperty(Farmer, 'operationTypeDescriptions', {
                Unknown: 'No farming production information available',
                Commercial: 'Large scale agricultural production',
                Recreational: 'Leisure or hobby farming',
                Smallholder: 'Small farm, limited production'
            });

            privateProperty(Farmer, 'getOperationTypeDescription', function (type) {
                return Farmer.operationTypeDescriptions[type] || '';
            });

            Farmer.validates(underscore.defaults({
                type: {
                    required: true,
                    equal: {
                        to: 'farmer'
                    }
                }
            }, Organization.validations));

            return Farmer;
        }];

    OrganizationFactoryProvider.add('farmer', 'Farmer');
}]);

var sdkModelMerchant = angular.module('ag.sdk.model.merchant', ['ag.sdk.model.organization']);

sdkModelMerchant.provider('Merchant', ['OrganizationFactoryProvider', function (OrganizationFactoryProvider) {
    this.$get = ['Organization', 'Base', 'computedProperty', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (Organization, Base, computedProperty, inheritModel, privateProperty, readOnlyProperty, underscore) {
            function Merchant (attrs) {
                Organization.apply(this, arguments);

                computedProperty(this, 'partnerTitle', function () {
                    return getPartnerTitle(this.partnerType);
                });

                computedProperty(this, 'subscriptionPlanTitle', function () {
                    return getSubscriptionPlanTitle(this.subscriptionPlan);
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.partnerType = attrs.partnerType;
                this.services = attrs.services || [];
            }

            function getPartnerTitle (type) {
                return Merchant.partnerTypes[type] || '';
            }

            function getSubscriptionPlanTitle (type) {
                return Merchant.subscriptionPlanTypes[type] || '';
            }

            inheritModel(Merchant, Organization);

            readOnlyProperty(Merchant, 'partnerTypes', {
                benefit: 'Benefit',
                standard: 'Standard'
            });

            readOnlyProperty(Merchant, 'subscriptionPlanTypes', {
                small: 'Small',
                medium: 'Medium',
                large: 'Large',
                association: 'Association'
            });

            privateProperty(Merchant, 'getPartnerTitle' , function (type) {
                return getPartnerTitle(type);
            });

            privateProperty(Merchant, 'getSubscriptionPlanTitle' , function (type) {
                return getSubscriptionPlanTitle(type);
            });

            Merchant.validates(underscore.defaults({
                partnerType: {
                    required: false,
                    inclusion: {
                        in: underscore.keys(Merchant.partnerTypes)
                    }
                },
                services: {
                    required: true,
                    length: {
                        min: 1
                    }
                },
                subscriptionPlan: {
                    required: false,
                    inclusion: {
                        in: underscore.keys(Merchant.subscriptionPlanTypes)
                    }
                },
                type: {
                    required: true,
                    equal: {
                        to: 'merchant'
                    }
                }
            }, Organization.validations));

            return Merchant;
        }];

    OrganizationFactoryProvider.add('merchant', 'Merchant');
}]);

var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.provider('Organization', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['Locale', 'Base', 'computedProperty', 'geoJSONHelper', 'inheritModel', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
        function (Locale, Base, computedProperty, geoJSONHelper, inheritModel, privateProperty, readOnlyProperty, topologyHelper, underscore) {
            function Organization (attrs) {
                Locale.apply(this, arguments);

                computedProperty(this, 'isActive', function () {
                    return this.status === 'active';
                });

                // Geom
                privateProperty(this, 'contains', function (geojson) {
                    return contains(this, geojson);
                });

                privateProperty(this, 'centroid', function () {
                    return centroid(this);
                });

                privateProperty(this, 'location', function () {
                    var centroid = this.centroid();

                    return (this.data.loc ?
                        geoJSONHelper(this.data.loc).getCenter() :
                        centroid ? centroid : this.countryLocale.coordinates);
                });

                this.data = (attrs && attrs.data) || {};
                Base.initializeObject(this.data, 'attachments', []);
                Base.initializeObject(this.data, 'baseStyles', {});

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.createdAt = attrs.createdAt;
                this.createdBy = attrs.createdBy;
                this.customerId = attrs.customerId;
                this.customerNumber = attrs.customerNumber;
                this.email = attrs.email;
                this.hostUrl = attrs.hostUrl;
                this.legalEntities = attrs.legalEntities || [];
                this.name = attrs.name;
                this.originHost = attrs.originHost;
                this.originPort = attrs.originPort;
                this.primaryContact = attrs.primaryContact;
                this.pointsOfInterest = attrs.pointsOfInterest || [];
                this.productionRegion = attrs.productionRegion;
                this.registered = attrs.registered;
                this.status = attrs.status;
                this.subscriptionPlan = attrs.subscriptionPlan;
                this.tags = attrs.tags || [];
                this.teams = attrs.teams || [];
                this.type = attrs.type;
                this.updatedAt = attrs.updatedAt;
                this.updatedBy = attrs.updatedBy;
                this.uuid = attrs.uuid;
            }

            function centroid (instance) {
                var geom = getAssetGeom(instance),
                    coord = (geom ? geom.getCentroid().getCoordinate() : geom);

                return (coord ? [coord.x, coord.y] : coord);
            }

            function contains (instance, geojson) {
                var farmGeom = getAssetGeom(instance),
                    queryGeom = topologyHelper.readGeoJSON(geojson);

                return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
            }

            function getAssetGeom (instance) {
                return underscore.chain(instance.legalEntities)
                    .pluck('assets')
                    .flatten().compact()
                    .filter(function (asset) {
                        return asset.data && asset.data.loc;
                    })
                    .reduce(function (geom, asset) {
                        var assetGeom = geoJSONHelper(asset.data.loc).geometry();

                        return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                    }, null)
                    .value();
            }

            inheritModel(Organization, Locale);

            privateProperty(Organization, 'contains', function (instance, geojson) {
                return contains(instance, geojson);
            });

            privateProperty(Organization, 'centroid', function (instance) {
                return centroid(instance);
            });

            privateProperty(Organization, 'types', {
                'farmer': 'Farmer',
                'merchant': 'AgriBusiness'
            });

            Organization.validates({
                country: {
                    required: true,
                    length: {
                        min: 1,
                        max: 64
                    }
                },
                email: {
                    format: {
                        email: true
                    }
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                organizationId: {
                    numeric: true
                },
                teams: {
                    required: true,
                    length: {
                        min: 1
                    }
                }
            });

            return Organization;
        }];

    listServiceMapProvider.add('organization', ['attachmentHelper', 'Organization', 'underscore', function (attachmentHelper, Organization, underscore) {
        var tagMap = {
            'danger': ['Duplicate Farmland', 'Duplicate Legal Entities'],
            'warning': ['No CIF', 'No Farmland', 'No Homestead', 'No Segmentation']
        };

        function searchingIndex (item) {
            return underscore.chain(item.legalEntities)
                .map(function (entity) {
                    return underscore.compact([entity.cifKey, entity.name, entity.registrationNumber]);
                })
                .flatten()
                .uniq()
                .value()
        }

        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.name,
                subtitle: (item.type && Organization.types[item.type] || '') + (item.customerId ? (item.type ? ': ' : '') + item.customerId : ''),
                thumbnailUrl: attachmentHelper.findSize(item, 'thumb', 'img/profile-business.png'),
                searchingIndex: searchingIndex(item),
                pills: underscore.chain(tagMap)
                    .mapObject(function (values) {
                        return underscore.chain(item.tags)
                            .pluck('name')
                            .filter(function (tag) {
                                return underscore.contains(values, tag);
                            })
                            .value();
                    })
                    .omit(function (values) {
                        return underscore.isEmpty(values);
                    })
                    .value()
            };
        };
    }]);
}]);

sdkModelOrganization.provider('OrganizationFactory', function () {
    var instances = {};

    this.add = function (type, modelName) {
        instances[type] = modelName;
    };

    this.$get = ['$injector', 'Organization', function ($injector, Organization) {
        function apply (attrs, fnName) {
            if (instances[attrs.type]) {
                initInstance(attrs.type);

                return instances[attrs.type][fnName](attrs);
            }

            return Organization[fnName](attrs);
        }

        function initInstance(type) {
            if (instances[type] && typeof instances[type] === 'string') {
                instances[type] = $injector.get(instances[type]);
            }
        }

        return {
            isInstanceOf: function (organization) {
                if (organization) {
                    initInstance(organization.type);

                    return (instances[organization.type] ?
                            organization instanceof instances[organization.type] :
                            organization instanceof Organization);
                }

                return false;
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});

var sdkModelPointOfInterest = angular.module('ag.sdk.model.point-of-interest', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelPointOfInterest.provider('PointOfInterest', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['inheritModel', 'md5Json', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (inheritModel, md5Json, Model, privateProperty, readOnlyProperty, underscore) {
            function PointOfInterest (attrs) {
                Model.Base.apply(this, arguments);

                privateProperty(this, 'generateKey', function (legalEntity, farm) {
                    this.poiKey = generateKey(this);

                    return this.poiKey;
                });

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.accessAir = attrs.accessAir;
                this.accessRail = attrs.accessRail;
                this.accessRoad = attrs.accessRoad;
                this.accessSea = attrs.accessSea;
                this.addressCity = attrs.addressCity;
                this.addressCode = attrs.addressCode;
                this.addressCountry = attrs.addressCountry;
                this.addressDistrict = attrs.addressDistrict;
                this.addressStreet1 = attrs.addressStreet1;
                this.addressStreet2 = attrs.addressStreet2;
                this.location = attrs.location;
                this.name = attrs.name;
                this.organization = attrs.organization;
                this.organizationId = attrs.organizationId;
                this.poiKey = attrs.poiKey;
                this.type = attrs.type;
            }

            inheritModel(PointOfInterest, Model.Base);

            function generateKey (instance) {
                return md5Json(underscore.pick(instance, ['location', 'name', 'type']));
            }

            var BRANCH = 'Branch',
                DEPOT = 'Depot',
                FARM_GATE = 'Farm Gate',
                GINNERY = 'Ginnery',
                GRAIN_MILL = 'Grain Mill',
                HEAD_OFFICE = 'Head Office',
                HOMESTEAD = 'Homestead',
                MARKET = 'Market',
                PACKHOUSE = 'Packhouse',
                SHED = 'Shed',
                SILO = 'Silo',
                SUGAR_MILL = 'Sugar Mill',
                TANK = 'Tank';

            readOnlyProperty(PointOfInterest, 'types', [
                BRANCH,
                DEPOT,
                FARM_GATE,
                GINNERY,
                GRAIN_MILL,
                HEAD_OFFICE,
                HOMESTEAD,
                MARKET,
                PACKHOUSE,
                SHED,
                SILO,
                SUGAR_MILL,
                TANK]);

            readOnlyProperty(PointOfInterest, 'organizationTypes', {
                farmer: [
                    FARM_GATE,
                    HOMESTEAD,
                    SHED,
                    TANK],
                merchant: [
                    BRANCH,
                    DEPOT,
                    GINNERY,
                    GRAIN_MILL,
                    HEAD_OFFICE,
                    MARKET,
                    PACKHOUSE,
                    SILO,
                    SUGAR_MILL]
            });

            privateProperty(PointOfInterest, 'getOrganizationTypes', function (type) {
                return PointOfInterest.organizationTypes[type] || PointOfInterest.organizationTypes['merchant'];
            });

            PointOfInterest.validates({
                addressCity: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressCode: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressCountry: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressDistrict: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressStreet1: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressStreet2: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                location: {
                    required: false,
                    object: true
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                },
                type: {
                    required: true,
                    inclusion: {
                        in: PointOfInterest.types
                    }
                }
            });

            return PointOfInterest;
        }];

    listServiceMapProvider.add('point of interest', [function () {
        return function (item) {
            return {
                id: item.id || item.$id,
                title: item.name,
                subtitle: item.type
            };
        };
    }]);
}]);

var sdkModelProductionGroup = angular.module('ag.sdk.model.production-group', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionGroup.factory('ProductionGroup', ['Base', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'ProductionSchedule', 'promiseService', 'safeArrayMath', 'safeMath', 'underscore',
    function (Base, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, ProductionSchedule, promiseService, safeArrayMath, safeMath, underscore) {
        function ProductionGroup (attrs, options) {
            options = options || {};

            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'details', {});
            Base.initializeObject(this.data.details, 'grossProfit', 0);
            Base.initializeObject(this.data.details, 'size', 0);

            this.commodities = [];
            this.productionSchedules = [];

            privateProperty(this, 'addProductionSchedule', function (productionSchedule) {
                if (!options.manualDateRange) {
                    if (underscore.isUndefined(this.startDate) || moment(productionSchedule.startDate).isBefore(this.startDate)) {
                        this.startDate = moment(productionSchedule.startDate).format('YYYY-MM-DD');
                    }

                    if (underscore.isUndefined(this.endDate) || moment(productionSchedule.endDate).isAfter(this.endDate)) {
                        this.endDate = moment(productionSchedule.endDate).format('YYYY-MM-DD');
                    }

                    addProductionSchedule(this, productionSchedule);
                } else if (productionSchedule.inDateRange(this.startDate, this.endDate)) {
                    addProductionSchedule(this, productionSchedule);
                }
            });

            privateProperty(this, 'removeProductionSchedule', function (productionSchedule) {
                removeProductionSchedule(this, productionSchedule);
            });

            computedProperty(this, 'costStage', function () {
                return this.defaultCostStage;
            });

            computedProperty(this, 'options', function () {
                return options;
            });

            // Stock
            privateProperty(this, 'addStock', function (stock) {
                addStock(this, stock);
            });

            privateProperty(this, 'extractStock', function (stockPickerFn) {
                return extractStock(this, stockPickerFn);
            });

            privateProperty(this, 'replaceAllStock', function (stock) {
                replaceAllStock(this, stock);
            });

            privateProperty(this, 'removeStock', function (stock) {
                removeStock(this, stock);
            });

            // Categories
            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'getCategory', function (sectionCode, categoryQuery, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere(categoryQuery)
                    .value();
            });

            privateProperty(this, 'getCategoryOptions', function (sectionCode) {
                return underscore.chain(this.productionSchedules)
                    .map(function (productionSchedule) {
                        return productionSchedule.getCategoryOptions(sectionCode);
                    })
                    .reduce(function (categoryOptions, categoryGroup) {
                        return underscore.extend(categoryOptions || {}, categoryGroup);
                    }, {})
                    .value();
            });

            privateProperty(this, 'addCategory', function (sectionCode, groupName, categoryQuery, costStage) {
                return addCategory(this, sectionCode, groupName, categoryQuery, costStage);
            });

            privateProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                removeCategory(this, sectionCode, groupName, categoryCode, costStage);
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionGroup(this);
            });

            privateProperty(this, 'recalculateCategory', function (sectionCode, groupName, categoryQuery, costStage) {
                recalculateProductionGroupCategory(this, sectionCode, groupName, categoryQuery, costStage);
            });

            computedProperty(this, 'allocatedSize', function () {
                return safeMath.round(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            computedProperty(this, 'startDateOffset', function () {
                return Math.max(0, moment(underscore.chain(this.productionSchedules)
                    .sortBy(function (productionSchedule) {
                        return moment(productionSchedule.startDate).unix();
                    })
                    .pluck('startDate')
                    .first()
                    .value()).diff(this.startDate, 'months'));
            });

            computedProperty(this, 'endDateOffset', function () {
                return safeMath.minus(this.numberOfMonths - 1, Math.max(0, moment(this.endDate).diff(underscore.chain(this.productionSchedules)
                    .sortBy(function (productionSchedule) {
                        return moment(productionSchedule.endDate).unix();
                    })
                    .pluck('endDate')
                    .last()
                    .value(), 'months')));
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            if (options.startDate && options.endDate) {
                options.manualDateRange = true;
                this.startDate = moment(options.startDate).format('YYYY-MM-DD');
                this.endDate = moment(options.endDate).format('YYYY-MM-DD');
            } else {
                this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
                this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            }

            this.replaceAllStock(attrs.stock || []);

            underscore.each(attrs.productionSchedules, this.addProductionSchedule, this);

            this.recalculate();
        }

        inheritModel(ProductionGroup, EnterpriseBudgetBase);

        function addProductionSchedule (instance, productionSchedule) {
            instance.productionSchedules.push(productionSchedule);

            updateSchedules(instance);

            productionSchedule.replaceAllStock(instance.stock);
        }

        function removeProductionSchedule (instance, productionSchedule) {
            instance.productionSchedules = underscore.without(instance.productionSchedules, productionSchedule);

            updateSchedules(instance);
        }

        function updateSchedules (instance) {
            instance.commodities = underscore.chain(instance.productionSchedules)
                .pluck('commodityType')
                .uniq()
                .compact()
                .value()
                .sort(naturalSort);

            instance.data.details.size = safeArrayMath.reduceProperty(instance.productionSchedules, 'allocatedSize');
        }

        // Stock
        function addAllStock (instance, inventory) {
            underscore.each(underscore.isArray(inventory) ? inventory : [inventory], function (stock) {
                addStock(instance, stock);
            });
        }

        function addStock (instance, stock) {
            if (stock && underscore.isArray(stock.data.ledger)) {
                instance.stock = underscore.chain(instance.stock)
                    .reject(function (item) {
                        return item.assetKey === stock.assetKey;
                    })
                    .union([stock])
                    .value();

                underscore.each(instance.productionSchedules, function (productionSchedule) {
                    productionSchedule.addStock(stock);
                });
            }
        }

        function extractStock (instance, stockPickerFn) {
            underscore.each(instance.productionSchedules, function (productionSchedule) {
                addAllStock(instance, productionSchedule.extractStock(stockPickerFn));
            });

            return instance.stock;
        }

        function replaceAllStock (instance, stock) {
            instance.stock = underscore.filter(stock, function (item) {
                return item && underscore.isArray(item.data.ledger);
            });

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.replaceAllStock(stock);
            });
        }

        function removeStock (instance, stock) {
            instance.stock = underscore.chain(instance.stock)
                .reject(function (item) {
                    return item.assetKey === stock.assetKey;
                })
                .value();

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.removeStock(stock);
            });
        }

        // Categories
        function addCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            var category = instance.getCategory(sectionCode, categoryQuery, costStage);

            if (underscore.isUndefined(category)) {
                var group = instance.addGroup(sectionCode, instance.findGroupNameByCategory(sectionCode, groupName, categoryQuery.code), costStage);

                category = underscore.extend({
                    quantity: 0,
                    value: 0
                }, EnterpriseBudgetBase.categories[categoryQuery.code]);

                // WA: Modify enterprise budget model to specify input costs as "per ha"
                if (sectionCode === 'EXP') {
                    category.unit = 'Total'
                }

                if (categoryQuery.name) {
                    category.name = categoryQuery.name;
                }

                category.per = (instance.assetType === 'livestock' ? 'LSU' : 'ha');

                if (this.assetType === 'livestock') {
                    var conversionRate = instance.getConversionRate(category.name);

                    if (conversionRate) {
                        category.conversionRate = conversionRate;
                    }

                    category.valuePerLSU = 0;
                }

                group.productCategories = underscore.union(group.productCategories, [category])
                    .sort(function (categoryA, categoryB) {
                        return (instance.assetType === 'livestock' && sectionCode === 'INC' ?
                            naturalSort(EnterpriseBudgetBase.getCategorySortKey(categoryA.name), EnterpriseBudgetBase.getCategorySortKey(categoryB.name)) :
                            naturalSort(categoryA.name, categoryB.name));
                    });
                instance.setCache([category.code, costStage], category);
            }

            return category;
        }

        function removeCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            groupName = instance.findGroupNameByCategory(sectionCode, groupName, categoryQuery.code);

            var group = instance.getGroup(sectionCode, groupName, costStage);

            if (group) {
                group.productCategories = underscore.reject(group.productCategories, function (category) {
                    return underscore.every(categoryQuery, function (value, key) {
                        return category[key] === value;
                    });
                });

                instance.resetCache([categoryQuery.code, costStage]);
            }
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var productionGroupCategory = instance.getCategory(sectionCode, categoryQuery, costStage),
                oldValue = 0;

            if (productionGroupCategory && !underscore.isUndefined(productionGroupCategory[property])) {
                var categorySchedules = underscore.chain(instance.productionSchedules)
                    .filter(function (productionSchedule) {
                        return underscore.some(productionGroupCategory.categories, function (category) {
                            return productionSchedule.scheduleKey === category.scheduleKey;
                        });
                    })
                    .uniq(false, function (productionSchedule) {
                        return productionSchedule.scheduleKey;
                    })
                    .indexBy('scheduleKey')
                    .value();

                var uniqueBudgets = underscore.chain(categorySchedules)
                    .pluck('budget')
                    .uniq(false, underscore.iteratee('uuid'))
                    .value();

                var propertyMap = {
                    quantity: 'quantityPerMonth',
                    value: 'valuePerMonth',
                    quantityPerHa: 'quantity',
                    valuePerHa: 'value'
                }, mappedProperty = propertyMap[property] || property;

                switch (property) {
                    case 'stock':
                        underscore.each(categorySchedules, function (productionSchedule) {
                            productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);
                        });
                        break;
                    case 'quantity':
                    case 'value':
                        oldValue = safeMath.round(safeArrayMath.reduce(productionGroupCategory[mappedProperty]), 2);

                        if (oldValue === 0) {
                            var totalCategories = safeArrayMath.reduce(productionGroupCategory.categoriesPerMonth);

                            productionGroupCategory[mappedProperty] = underscore.reduce(productionGroupCategory.categoriesPerMonth, function (result, value, index) {
                                result[index] = safeMath.dividedBy(safeMath.times(value, productionGroupCategory[property]), totalCategories);

                                return result;
                            }, Base.initializeArray(instance.numberOfMonths));

                            property = mappedProperty;
                        } else {
                            underscore.each(categorySchedules, function (productionSchedule) {
                                var productionCategory = productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                                if (productionCategory) {
                                    productionCategory[property] = safeMath.dividedBy(safeMath.times(productionCategory[property], productionGroupCategory[property]), oldValue);

                                    productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);
                                }
                            });
                        }
                        break;
                    case 'quantityPerHa':
                    case 'valuePerHa':
                        oldValue = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory[mappedProperty + 'PerHaPerMonth']), safeArrayMath.count(productionGroupCategory[mappedProperty + 'PerHaPerMonth'])), 2);

                        productionGroupCategory[mappedProperty + 'PerHaPerMonth'] = underscore.reduce(productionGroupCategory[mappedProperty + 'PerHaPerMonth'], function (valuePerHaPerMonth, value, index) {
                            valuePerHaPerMonth[index] = (oldValue === 0 ?
                                safeMath.dividedBy(productionGroupCategory[property], uniqueBudgets.length) :
                                safeMath.dividedBy(safeMath.times(value, productionGroupCategory[property]), oldValue));
                            return valuePerHaPerMonth;
                        }, Base.initializeArray(instance.numberOfMonths));

                        productionGroupCategory[mappedProperty + 'PerMonth'] = safeArrayMath.round(safeArrayMath.times(productionGroupCategory[mappedProperty + 'PerHaPerMonth'], productionGroupCategory.haPerMonth), 2);
                        property = mappedProperty + 'PerMonth';
                        break;
                }

                if (underscore.contains(['quantityPerMonth', 'valuePerMonth'], property)) {
                    var oldValuePerMonth = underscore.reduce(productionGroupCategory.categories, function (result, category) {
                        return safeArrayMath.plus(result, category[property]);
                    }, Base.initializeArray(instance.numberOfMonths));

                    oldValue = safeArrayMath.reduce(oldValuePerMonth);

                    var categoriesAffectedPerMonth = underscore.reduce(productionGroupCategory.categories, function (result, category) {
                        return safeArrayMath.plus(result, underscore.map(category[property], function (value) {
                            return (value !== 0 ? 1 : 0);
                        }));
                    }, Base.initializeArray(instance.numberOfMonths));

                    underscore.each(productionGroupCategory.categories, function (category) {
                        var productionSchedule = categorySchedules[category.scheduleKey],
                            productionCategory = productionSchedule && productionSchedule.getCategory(sectionCode, categoryQuery.code, productionSchedule.costStage);

                        if (productionCategory) {
                            underscore.reduce(productionGroupCategory[property], function (result, value, index) {
                                if (value !== oldValuePerMonth[index]) {
                                    var indexOffset = index - category.offset,
                                        categoriesAffected = (categoriesAffectedPerMonth[index] !== 0 ?
                                            categoriesAffectedPerMonth[index] :
                                            productionGroupCategory.categoriesPerMonth[index]);

                                    if (indexOffset >= 0 && indexOffset < result.length && (categoriesAffectedPerMonth[index] === 0 || result[indexOffset] > 0)) {
                                        result[indexOffset] = safeMath.dividedBy(value, categoriesAffected);
                                    }
                                }
                                return result;
                            }, productionCategory[property]);

                            productionSchedule.adjustCategory(sectionCode, categoryQuery, productionSchedule.costStage, property);

                            underscore.each(categorySchedules, function (schedule) {
                                if (schedule.budgetUuid === productionSchedule.budgetUuid && schedule.scheduleKey !== productionSchedule.scheduleKey) {
                                    schedule.recalculateCategory(categoryQuery.code);
                                }
                            });
                        }
                    });
                }

                recalculateProductionGroupCategory(instance, sectionCode, productionGroupCategory.groupBy, categoryQuery, costStage);
            }
        }

        function reduceArrayInRange (offset) {
            return function (totals, value, index) {
                var indexOffset = index + offset;

                if (indexOffset >= 0 && indexOffset < totals.length) {
                    totals[indexOffset] = safeMath.plus(totals[indexOffset], value);
                }

                return totals;
            }
        }

        function recalculateProductionGroup (instance) {
            instance.data.sections = [];
            instance.clearCache();

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                productionSchedule.recalculate();

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, productionSchedule, startOffset, section, group, category);
                            });

                            recalculateGroup(instance, productionSchedule, section, group);
                        });

                        recalculateSection(instance, productionSchedule, section);
                    }
                });
            });

            instance.addSection('INC');
            instance.addSection('EXP');
            instance.sortSections();

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);
        }

        function recalculateProductionGroupCategory (instance, sectionCode, groupName, categoryQuery, costStage) {
            instance.removeCategory(sectionCode, groupName, categoryQuery, costStage);

            underscore.each(instance.productionSchedules, function (productionSchedule) {
                productionSchedule.recalculateCategory(categoryQuery.code);

                underscore.each(productionSchedule.data.sections, function (section) {
                    if (section.costStage === productionSchedule.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            var category = underscore.findWhere(group.productCategories, categoryQuery);

                            if (category) {
                                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                                recalculateCategory(instance, productionSchedule, startOffset, section, group, category);
                                recalculateGroup(instance, productionSchedule, section, group);
                                recalculateSection(instance, productionSchedule, section);
                            }
                        });
                    }
                });
            });

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);
        }

        function recalculateSection (instance, productionSchedule, section) {
            var productionSection = instance.getSection(section.code, instance.defaultCostStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (totalPerMonth, valuePerMonth) {
                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(totalPerMonth[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                if (productionSchedule.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }

                instance.data.details.grossProfit = (productionSection.code === 'INC' ?
                    safeMath.plus(instance.data.details.grossProfit, productionSection.total.value) :
                    safeMath.minus(instance.data.details.grossProfit, productionSection.total.value));
            }
        }

        function recalculateGroup (instance, productionSchedule, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, instance.defaultCostStage);

            if (productionGroup) {
                productionGroup.total.value = safeArrayMath.reduceProperty(productionGroup.productCategories, 'value');

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (totalPerMonth, valuePerMonth) {
                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(totalPerMonth[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                if (productionSchedule.type === 'livestock') {
                    productionGroup.total.valuePerLSU = safeArrayMath.reduceProperty(productionGroup.productCategories, 'valuePerLSU');
                }
            }
        }

        function recalculateCategory (instance, productionSchedule, startOffset, section, group, category) {
            var productionGroupCategory = instance.addCategory(section.code, group.name, underscore.pick(category, ['code', 'name']), instance.defaultCostStage),
                assetType = (group.code === 'INC-LSS' ? 'livestock' : 'stock'),
                commodityType = productionSchedule.data.details.commodity;

            productionGroupCategory.name = (underscore.contains(['INC-CPS-CROP', 'INC-FRS-FRUT'], productionGroupCategory.code) ? commodityType : productionGroupCategory.name);

            var stock = instance.findStock(assetType, productionGroupCategory.name, commodityType);

            var productionCategory = underscore.extend({
                commodity: productionSchedule.commodityType,
                offset: startOffset,
                scheduleKey: productionSchedule.scheduleKey
            }, category);

            productionGroupCategory.per = category.per;
            productionGroupCategory.categories = productionGroupCategory.categories || [];
            productionGroupCategory.categories.push(productionCategory);

            if (stock) {
                productionGroupCategory.stock = productionGroupCategory.stock || stock;
            }

            productionGroupCategory.categoriesPerMonth = safeArrayMath.plus(underscore.reduce(Base.initializeArray(instance.numberOfMonths, 1), reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths)), productionGroupCategory.categoriesPerMonth || Base.initializeArray(instance.numberOfMonths));

            // Value
            productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
            productionCategory.value = safeMath.round(safeArrayMath.reduce(productionCategory.valuePerMonth), 2);

            productionGroupCategory.valuePerMonth = safeArrayMath.plus(productionCategory.valuePerMonth, productionGroupCategory.valuePerMonth || Base.initializeArray(instance.numberOfMonths));
            productionGroupCategory.value = safeMath.round(safeArrayMath.reduce(productionGroupCategory.valuePerMonth), 2);

            // Quantity
            productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
            productionCategory.quantity = safeMath.round(safeArrayMath.reduce(productionCategory.quantityPerMonth), 2);

            productionGroupCategory.quantityPerMonth = safeArrayMath.plus(productionCategory.quantityPerMonth, productionGroupCategory.quantityPerMonth || Base.initializeArray(instance.numberOfMonths));
            productionGroupCategory.quantity = safeMath.round(safeArrayMath.reduce(productionGroupCategory.quantityPerMonth), 2);

            // Supply
            if (productionCategory.supplyPerMonth) {
                productionCategory.supplyPerMonth = underscore.reduce(category.supplyPerMonth, reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
                productionCategory.supply = safeMath.round(safeArrayMath.reduce(productionCategory.supplyPerMonth), 2);

                productionGroupCategory.supplyPerMonth = safeArrayMath.plus(productionCategory.supplyPerMonth, productionGroupCategory.supplyPerMonth || Base.initializeArray(instance.numberOfMonths));
                productionGroupCategory.supply = safeMath.round(safeArrayMath.reduce(productionGroupCategory.supplyPerMonth), 2);
            }

            // Price Per Unit
            productionCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(productionCategory.value, productionCategory.supply || 1), productionCategory.quantity), 4);
            productionGroupCategory.pricePerUnit = safeMath.round(safeMath.dividedBy(safeMath.dividedBy(productionGroupCategory.value, productionGroupCategory.supply || 1), productionGroupCategory.quantity), 4);

            if (productionSchedule.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.dividedBy(safeMath.times(productionCategory.value, category.valuePerLSU), category.value);
                productionCategory.quantityPerLSU = safeMath.dividedBy(safeMath.times(productionCategory.quantity, category.quantityPerLSU), category.quantity);

                productionGroupCategory.valuePerLSU = safeMath.plus(productionGroupCategory.valuePerLSU, productionCategory.valuePerLSU);
                productionGroupCategory.quantityPerLSU = safeMath.plus(productionGroupCategory.quantityPerLSU, productionCategory.quantityPerLSU);
            } else {
                productionCategory.haPerMonth = underscore.reduce(Base.initializeArray(instance.numberOfMonths, productionSchedule.allocatedSize), reduceArrayInRange(startOffset), Base.initializeArray(instance.numberOfMonths));
                productionGroupCategory.haPerMonth = safeArrayMath.plus(productionCategory.haPerMonth, productionGroupCategory.haPerMonth || Base.initializeArray(instance.numberOfMonths));

                productionGroupCategory.valuePerHaPerMonth = safeArrayMath.round(safeArrayMath.dividedBy(productionGroupCategory.valuePerMonth, productionGroupCategory.haPerMonth), 2);
                productionGroupCategory.quantityPerHaPerMonth = safeArrayMath.round(safeArrayMath.dividedBy(productionGroupCategory.quantityPerMonth, productionGroupCategory.haPerMonth), 3);

                productionGroupCategory.valuePerHa = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory.valuePerHaPerMonth), safeArrayMath.count(productionGroupCategory.valuePerHaPerMonth)), 2);
                productionGroupCategory.quantityPerHa = safeMath.round(safeMath.dividedBy(safeArrayMath.reduce(productionGroupCategory.quantityPerHaPerMonth), safeArrayMath.count(productionGroupCategory.quantityPerHaPerMonth)), 3);
            }
        }

        return ProductionGroup;
    }]);

var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionSchedule', ['AssetFactory', 'Base', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'Field', 'inheritModel', 'Livestock', 'moment', 'privateProperty', 'promiseService', 'readOnlyProperty', 'safeArrayMath', 'safeMath', 'underscore',
    function (AssetFactory, Base, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, Field, inheritModel, Livestock, moment, privateProperty, promiseService, readOnlyProperty, safeArrayMath, safeMath, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            Base.initializeObject(this.data, 'activities', []);
            Base.initializeObject(this.data, 'details', {});

            computedProperty(this, 'costStage', function () {
                return (this.type !== 'horticulture' || this.data.details.assetAge !== 0 ? this.defaultCostStage : underscore.first(ProductionSchedule.costStages));
            });

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate).date(1);

                this.startDate = startDate.format('YYYY-MM-DD');

                var monthsPerCycle = 12 / Math.floor(12 / this.numberOfAllocatedMonths),
                    nearestAllocationMonth = (this.budget ? ((monthsPerCycle * Math.floor((startDate.month() - this.budget.cycleStart) / monthsPerCycle)) + this.budget.cycleStart) : startDate.month()),
                    allocationDate = moment([startDate.year()]).add(nearestAllocationMonth, 'M');

                this.startDate = allocationDate.format('YYYY-MM-DD');
                this.endDate = allocationDate.add(1, 'y').format('YYYY-MM-DD');

                if (this.type === 'horticulture') {
                    startDate = moment(this.startDate);

                    this.data.details.establishedDate = (!underscore.isUndefined(this.data.details.establishedDate) ?
                        this.data.details.establishedDate :
                        underscore.chain(this.assets)
                            .map(function (asset) {
                                return asset.data.establishedDate;
                            })
                            .union([this.startDate])
                            .compact()
                            .first()
                            .value());
                    var assetAge = (startDate.isAfter(this.data.details.establishedDate) ? startDate.diff(this.data.details.establishedDate, 'years') : 0);

                    if (assetAge !== this.data.details.assetAge) {
                        this.data.details.assetAge = assetAge;

                        this.recalculate();
                    }
                }
            });

            privateProperty(this, 'addAsset', function (asset) {
                asset = AssetFactory.new(asset);
                asset.$local = true;

                this.assets = underscore.chain(this.assets)
                    .reject(underscore.identity({assetKey: asset.assetKey}))
                    .union([asset])
                    .value();

                if (underscore.size(this.assets) === 1) {
                    setDetails(this, asset);
                }

                this.recalculateSize();
            });

            privateProperty(this, 'removeAsset', function (asset) {
                asset.$delete = true;

                this.recalculateSize();
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = EnterpriseBudget.new(underscore.omit(budget, ['followers', 'organization', 'region', 'user', 'userData']));
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    commodity: this.budget.commodityType,
                    grossProfit: 0
                });

                if (this.type === 'livestock') {
                    this.data.details = underscore.defaults(this.data.details, {
                        calculatedLSU: 0,
                        grossProfitPerLSU: 0,
                        herdSize: this.budget.data.details.herdSize || 0,
                        stockingDensity: 0,
                        multiplicationFactor: 0
                    });
                } else {
                    this.data.details = underscore.extend(this.data.details, underscore.pick(this.budget.data.details,
                        (this.type === 'horticulture' ? ['maturityFactor', 'cultivar', 'seedProvider'] : ['cultivar', 'seedProvider'])));
                }

                if (this.data.details.pastureType && this.budget.data.details.stockingDensity) {
                    this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                }

                this.recalculate();

                if (this.startDate) {
                    this.setDate(this.startDate);
                }
            });

            privateProperty(this, 'setLivestockStockingDensity', function (stockingDensity) {
                if (this.type === 'livestock' && this.data.details.stockingDensity !== stockingDensity) {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type === 'livestock') {
                    this.data.details.calculatedLSU = safeMath.dividedBy(this.allocatedSize, this.data.details.stockingDensity);

                    if (this.budget) {
                        this.data.details.multiplicationFactor = (this.budget.data.details.herdSize ? safeMath.dividedBy(this.data.details.herdSize, this.budget.data.details.herdSize) : 1);
                        this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.multiplicationFactor);
                        this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? safeMath.dividedBy(this.data.details.grossProfit, this.data.details.calculatedLSU) : 0);
                    }
                } else if (this.budget) {
                    this.data.details.grossProfit = safeMath.times(this.budget.data.details.grossProfit, this.data.details.size);
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryQuery, costStage, property) {
                return adjustCategory(this, sectionCode, categoryQuery, costStage, property);
            });

            privateProperty(this, 'extractStock', function (stockPickerFn) {
                return extractStock(this, stockPickerFn);
            });

            privateProperty(this, 'updateCategoryStock', function (sectionCode, categoryCode, stock, overwrite) {
                updateCategoryStock(this, sectionCode, categoryCode, stock, overwrite);
            });

            privateProperty(this, 'applyMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(factor)
                    .dividedBy(100)
                    .toNumber();
            });

            privateProperty(this, 'reverseMaturityFactor', function (sectionCode, value) {
                var factor = (this.type === 'horticulture' && this.costStage === 'Yearly' && this.data.details.maturityFactor && this.data.details.maturityFactor[sectionCode] ?
                    (this.data.details.maturityFactor[sectionCode][this.data.details.assetAge - 1] || 0) : 100);

                return safeMath.chain(value)
                    .times(100)
                    .dividedBy(factor)
                    .toNumber();
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            privateProperty(this, 'recalculateCategory', function (categoryCode) {
                recalculateProductionScheduleCategory(this, categoryCode);
            });

            privateProperty(this, 'recalculateSize', function () {
                var size = safeMath.round(underscore.chain(this.assets)
                    .reject({'$delete': true})
                    .reduce(function (total, asset) {
                        return safeMath.plus(total, asset.data.plantedArea || asset.data.size);
                    }, 0)
                    .value(), 2);

                if (size !== this.data.details.size) {
                    this.setSize(size);
                    this.$dirty = true;
                }
            });

            computedProperty(this, 'scheduleKey', function () {
                return (this.budgetUuid ? this.budgetUuid + '-' : '') +
                    (this.startDate ? moment(this.startDate).unix() + '-' : '') +
                    (this.endDate ? moment(this.endDate).unix() : '');
            }, {
                enumerable: true
            });

            computedProperty(this, 'assetType', function () {
                return (this.budget ? this.budget.assetType : this.type);
            });

            computedProperty(this, 'commodityType', function () {
                return (this.budget ? this.budget.commodityType : this.data.details.commodity);
            });
            
            computedProperty(this, 'allocatedSize', function () {
                return safeMath.round(this.data.details.size, 2);
            });

            computedProperty(this, 'title', function () {
                return getTitle(this);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            privateProperty(this, 'getAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getAllocationIndex(sectionCode, costStage) : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                return (this.budget ? this.budget.getLastAllocationIndex(sectionCode, costStage) : this.numberOfMonths);
            });

            privateProperty(this, 'getAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getAllocationIndex(sectionCode, costStage), 'M');
            });

            privateProperty(this, 'getLastAllocationMonth', function (sectionCode, costStage) {
                return moment(this.startDate).add(this.getLastAllocationIndex(sectionCode, costStage), 'M');
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return (this.budget ? this.budget.numberOfAllocatedMonths : this.numberOfMonths);
            });

            privateProperty(this, 'inDateRange', function (rangeStart, rangeEnd) {
                rangeStart = moment(rangeStart);
                rangeEnd = moment(rangeEnd);

                var scheduleStart = moment(this.startDate),
                    scheduleEnd = moment(this.endDate);

                return (scheduleStart.isSame(rangeStart) && scheduleEnd.isSame(rangeEnd)) ||
                    (scheduleStart.isSameOrAfter(rangeStart) && scheduleStart.isBefore(rangeEnd)) ||
                    (scheduleEnd.isAfter(rangeStart) && scheduleEnd.isSameOrBefore(rangeEnd));
            });

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC', costStage: this.costStage});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP', costStage: this.costStage});
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            Base.initializeObject(this.data, 'budget', attrs.budget);

            this.id = attrs.id || attrs.$id;
            this.assets = underscore.map(attrs.assets || [], AssetFactory.new);
            this.budgetUuid = attrs.budgetUuid;
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.organization = attrs.organization;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');
            this.type = attrs.type;

            // TODO: WA: Legacy parameter required
            this.assetId = underscore.chain(this.assets)
                .pluck('id')
                .first()
                .value();

            if (this.data.budget) {
                this.budget = EnterpriseBudget.new(this.data.budget);
            }
        }

        function setDetails (instance, asset) {
            instance.type = ProductionSchedule.typeByAsset[asset.type];
            instance.data.details.irrigated = (asset.data.irrigated === true);

            // TODO: WA: Legacy parameter required
            instance.assetId = asset.id;

            if (asset.data.crop && instance.type !== 'livestock') {
                instance.data.details.commodity = asset.data.crop;
            }

            if (instance.type === 'horticulture') {
                var startDate = moment(instance.startDate);

                instance.data.details.establishedDate = asset.data.establishedDate || instance.startDate;
                instance.data.details.assetAge = (startDate.isAfter(instance.data.details.establishedDate) ?
                    startDate.diff(instance.data.details.establishedDate, 'years') : 0);
            } else if (instance.type === 'livestock') {
                instance.data.details.pastureType = (asset.data.intensified ? 'pasture' : 'grazing');

                if (instance.budget && instance.budget.data.details.stockingDensity) {
                    instance.setLivestockStockingDensity(instance.budget.data.details.stockingDensity[instance.data.details.pastureType]);
                }
            }
        }

        function adjustCategory (instance, sectionCode, categoryQuery, costStage, property) {
            var categoryCode = (underscore.isObject(categoryQuery) ? categoryQuery.code : categoryQuery),
                productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage),
                budgetProperty = property;

            if (productionCategory && budgetCategory) {
                switch (property) {
                    case 'pricePerUnit':
                        budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                        break;
                    case 'quantity':
                        budgetCategory.quantity = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.quantity), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'quantityPerHa':
                        budgetCategory.quantity = instance.reverseMaturityFactor(sectionCode, productionCategory.quantityPerHa);
                        budgetProperty = 'quantity';
                        break;
                    case 'quantityPerLSU':
                        budgetCategory.quantityPerLSU = productionCategory.quantityPerLSU;
                        break;
                    case 'stock':
                        productionCategory.name = (underscore.contains(['INC-CPS-CROP', 'INC-FRS-FRUT'], categoryCode) ? instance.commodityType : productionCategory.name);

                        var assetType = (s.include(categoryCode, 'INC-LSS') ? 'livestock' : 'stock'),
                            stock = instance.findStock(assetType, productionCategory.name, instance.commodityType),
                            reference = [instance.scheduleKey, (sectionCode === 'INC' ? 'Sale' : 'Consumption')].join('/'),
                            ignoredKeys = ['quantity', 'quantityPerMonth'];

                        underscore.extend(budgetCategory, underscore.chain(stock.inventoryInRange(instance.startDate, instance.endDate))
                            .reduce(function (resultCategory, monthly, index) {
                                underscore.chain(monthly.entries)
                                    .filter(function (entry) {
                                        return s.include(entry.reference, reference);
                                    })
                                    .each(function (entry) {
                                        if (budgetCategory.supplyUnit && entry.quantityUnit === budgetCategory.supplyUnit) {
                                            resultCategory.supply = safeMath.plus(resultCategory.supply, entry.quantity);
                                            resultCategory.quantity = safeMath.plus(resultCategory.quantity, entry.rate);
                                        }

                                        resultCategory.valuePerMonth[index] = safeMath.plus(resultCategory.valuePerMonth[index], entry.value);
                                    });

                                return resultCategory;
                            }, {
                                valuePerMonth: Base.initializeArray(instance.budget.numberOfMonths)
                            })
                            .mapObject(function (value, key) {
                                return (underscore.contains(ignoredKeys, key) ? value : (underscore.isArray(value) ? instance.budget.unshiftMonthlyArray(underscore.map(value, function (monthValue) {
                                    return safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, monthValue), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                                })) : safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize))));
                            })
                            .value());

                        updateDeliveries(instance, stock);

                        budgetProperty = 'valuePerMonth';
                        break;
                    case 'supply':
                        budgetCategory.supply = safeMath.dividedBy(productionCategory.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'value':
                        budgetCategory.value = safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, productionCategory.value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));
                        break;
                    case 'valuePerHa':
                        budgetCategory.value = instance.reverseMaturityFactor(sectionCode, productionCategory.valuePerHa);
                        budgetProperty = 'value';
                        break;
                    case 'valuePerLSU':
                        budgetCategory.valuePerLSU = productionCategory.valuePerLSU;
                        break;
                    case 'valuePerMonth':
                        var totalFilled = safeArrayMath.count(productionCategory.valuePerMonth),
                            countFilled = 0;

                        budgetCategory.value = safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, safeArrayMath.reduce(productionCategory.valuePerMonth)), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4);
                        budgetCategory.valuePerMonth = instance.budget.unshiftMonthlyArray(underscore.reduce(productionCategory.valuePerMonth, function (totals, value, index) {
                            if (value > 0) {
                                totals[index] = (index === totals.length - 1 || countFilled === totalFilled - 1 ?
                                    safeMath.minus(budgetCategory.value, safeArrayMath.reduce(totals)) :
                                    safeMath.round(safeMath.dividedBy(instance.reverseMaturityFactor(sectionCode, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 4));
                                countFilled++;
                            }
                            return totals;
                        }, Base.initializeArray(instance.budget.numberOfMonths)));
                        break;
                    default:
                        budgetCategory[property] = productionCategory[property];
                }

                instance.budget.adjustCategory(sectionCode, categoryCode, costStage, budgetProperty);

                recalculateProductionScheduleCategory(instance, categoryCode);

                if (property !== 'stock') {
                    updateCategoryStock(instance, sectionCode, categoryCode);
                }

                instance.$dirty = true;

                return productionCategory[property];
            }
        }

        function extractStock (instance, stockPickerFn) {
            var startDate = moment(instance.startDate);

            if (underscore.isFunction(stockPickerFn)) {
                underscore.each(instance.data.sections, function (section) {
                    underscore.each(section.productCategoryGroups, function (group) {
                        underscore.each(group.productCategories, function (category) {
                            if (underscore.contains(EnterpriseBudget.stockableCategoryCodes, category.code)) {
                                var assetType = (group.code === 'INC-LSS' ? 'livestock' : 'stock'),
                                    priceUnit = (category.unit === 'Total' ? undefined : category.unit),
                                    stockType = (section.code === 'INC' ? instance.commodityType : undefined);

                                category.name = (underscore.contains(['INC-CPS-CROP', 'INC-FRS-FRUT'], category.code) ? instance.commodityType : category.name);

                                var stock = stockPickerFn(assetType, stockType, category.name, priceUnit, category.supplyUnit);

                                if (assetType === 'livestock' && category.value && underscore.isUndefined(stock.data.pricePerUnit)) {
                                    stock.data.pricePerUnit = safeMath.dividedBy(category.value, category.supply || 1);
                                    stock.$dirty = true;
                                }

                                instance.updateCategoryStock(section.code, category.code, stock);
                                instance.addStock(stock);
                            }
                        });

                        if (group.code === 'INC-LSS') {
                            // Representative Animal
                            var representativeAnimal = instance.getRepresentativeAnimal(),
                                representativeCategory = underscore.findWhere(instance.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: representativeAnimal});

                            // Birth/Weaned Animals
                            var birthAnimal = instance.birthAnimal,
                                birthCategory = underscore.findWhere(instance.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: birthAnimal}),
                                weanedCategory = underscore.findWhere(instance.getGroupCategoryOptions('INC', 'Livestock Sales'), {name: Livestock.getWeanedAnimal(instance.commodityType)});

                            if (!underscore.isUndefined(representativeCategory) && !underscore.isUndefined(birthCategory) && !underscore.isUndefined(weanedCategory)) {
                                var representativeLivestock = stockPickerFn('livestock', instance.commodityType, representativeAnimal, representativeCategory.unit, representativeCategory.supplyUnit),
                                    birthLivestock = stockPickerFn('livestock', instance.commodityType, birthAnimal, birthCategory.unit, birthCategory.supplyUnit),
                                    weanedLivestock = stockPickerFn('livestock', instance.commodityType, weanedCategory.name, weanedCategory.unit, weanedCategory.supplyUnit);

                                var firstBirthLedgerEntry = underscore.first(birthLivestock.data.ledger),
                                    retainLivestockMap = {
                                        'Retain': birthLivestock,
                                        'Retained': weanedLivestock
                                    };

                                if (representativeLivestock.data.openingBalance !== instance.data.details.herdSize &&
                                    (underscore.isUndefined(firstBirthLedgerEntry) || moment(instance.startDate).isSameOrBefore(firstBirthLedgerEntry.date))) {
                                    representativeLivestock.data.openingBalance = instance.data.details.herdSize;
                                    representativeLivestock.$dirty = true;
                                }

                                instance.budget.addCategory('INC', 'Livestock Sales', representativeCategory.code, instance.costStage);
                                instance.budget.addCategory('INC', 'Livestock Sales', birthCategory.code, instance.costStage);
                                instance.budget.addCategory('INC', 'Livestock Sales', weanedCategory.code, instance.costStage);

                                underscore.each(underscore.keys(instance.budget.data.events).sort(), function (action) {
                                    var shiftedSchedule = instance.budget.shiftMonthlyArray(instance.budget.data.events[action]);

                                    underscore.each(shiftedSchedule, function (rate, index) {
                                        if (rate > 0) {
                                            var formattedDate = moment(startDate).add(index, 'M').format('YYYY-MM-DD'),
                                                representativeLivestockInventory = representativeLivestock.inventoryBefore(formattedDate),
                                                ledgerEntry = birthLivestock.findLedgerEntry({
                                                    date: formattedDate,
                                                    action: action,
                                                    reference: instance.scheduleKey
                                                }),
                                                actionReference = [instance.scheduleKey, action, formattedDate].join('/'),
                                                quantity = Math.floor(safeMath.chain(rate)
                                                    .times(representativeLivestockInventory.closing.quantity)
                                                    .dividedBy(100)
                                                    .toNumber()),
                                                value = safeMath.times(quantity, birthLivestock.data.pricePerUnit);

                                            if (underscore.isUndefined(ledgerEntry)) {
                                                birthLivestock.addLedgerEntry({
                                                    action: action,
                                                    commodity: instance.commodityType,
                                                    date: formattedDate,
                                                    price: birthLivestock.data.pricePerUnit,
                                                    priceUnit: birthLivestock.data.quantityUnit,
                                                    quantity: quantity,
                                                    quantityUnit: birthLivestock.data.quantityUnit,
                                                    reference: actionReference,
                                                    value: value
                                                });
                                            } else {
                                                birthLivestock.setLedgerEntry(ledgerEntry, {
                                                    commodity: instance.commodityType,
                                                    price: birthLivestock.data.pricePerUnit,
                                                    priceUnit: birthLivestock.data.quantityUnit,
                                                    quantity: quantity,
                                                    quantityUnit: birthLivestock.data.quantityUnit,
                                                    reference: actionReference,
                                                    value: value
                                                });
                                            }

                                            if (action === 'Death') {
                                                var retainReference = [instance.scheduleKey, 'Retain:' + birthAnimal, formattedDate].join('/');

                                                // Removed already included retained entries, as it affects the inventory balance
                                                birthLivestock.removeLedgerEntriesByReference(retainReference);

                                                // Retains birth animal as weaned animal
                                                var inventory = birthLivestock.inventoryBefore(formattedDate);

                                                underscore.each(underscore.keys(retainLivestockMap), function (retainAction) {
                                                    var retainLivestock = retainLivestockMap[retainAction],
                                                        retainLedgerEntry = retainLivestock.findLedgerEntry(retainReference),
                                                        value = inventory.closing.value || safeMath.times(retainLivestock.data.pricePerUnit, inventory.closing.quantity);

                                                    if (underscore.isUndefined(retainLedgerEntry)) {
                                                        retainLivestock.addLedgerEntry({
                                                            action: retainAction + ':' + birthAnimal,
                                                            commodity: instance.commodityType,
                                                            date: formattedDate,
                                                            price: retainLivestock.data.pricePerUnit,
                                                            priceUnit: retainLivestock.data.quantityUnit,
                                                            quantity: inventory.closing.quantity,
                                                            quantityUnit: retainLivestock.data.quantityUnit,
                                                            reference: retainReference,
                                                            value: value
                                                        });
                                                    } else {
                                                        birthLivestock.setLedgerEntry(retainLedgerEntry, {
                                                            commodity: instance.commodityType,
                                                            price: retainLivestock.data.pricePerUnit,
                                                            priceUnit: retainLivestock.data.quantityUnit,
                                                            quantity: inventory.closing.quantity,
                                                            quantityUnit: retainLivestock.data.quantityUnit,
                                                            reference: retainReference,
                                                            value: value
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    });
                                });

                                instance.addStock(representativeLivestock);
                                instance.addStock(birthLivestock);
                                instance.addStock(weanedLivestock);
                            }
                        }
                    });
                });

                underscore.chain(instance.data.activities)
                    .where({type: 'delivery'})
                    .each(function (activity) {
                        var action = 'Deliver',
                            assetType = (instance.assetType === 'livestock' ? 'livestock' : 'stock'),
                            priceUnit = activity.unit,
                            stockType = instance.commodityType,
                            stock = stockPickerFn(assetType, stockType, instance.commodityType, priceUnit);

                        var reference = [instance.scheduleKey, action, activity.id].join('/'),
                            ledgerEntry = stock.findLedgerEntry(reference),
                            marketPrice = stock.marketPriceAtDate(activity.date),
                            value = safeMath.times(marketPrice, activity.quantity),
                            commodity = activity.commodity || instance.commodityType;

                        if (underscore.isUndefined(ledgerEntry)) {
                            stock.addLedgerEntry({
                                action: action,
                                commodity: commodity,
                                date: activity.date,
                                delivery: activity,
                                price: marketPrice,
                                priceUnit: activity.unit,
                                quantity: activity.quantity,
                                quantityUnit: activity.unit,
                                reference: reference,
                                value: value
                            });
                        } else {
                            stock.setLedgerEntry(ledgerEntry, {
                                commodity: commodity,
                                delivery: activity,
                                price: marketPrice,
                                priceUnit: activity.unit,
                                quantity: activity.quantity,
                                quantityUnit: activity.unit,
                                reference: reference,
                                value: value
                            });
                        }

                        instance.addStock(stock);
                    });
            }

            return instance.stock;
        }

        function updateDeliveries (instance, stock) {
            if (stock) {
                var commodity = stock.data.category,
                    filterReference = [instance.scheduleKey, 'Deliver'].join('/'),
                    oldDeliveries = underscore.where(instance.data.activities, {commodity: commodity, type: 'delivery'});

                underscore.chain(stock.data.ledger)
                    .filter(function (entry) {
                        return s.include(entry.reference, filterReference) && !underscore.isUndefined(entry.delivery);
                    })
                    .each(function (entry) {
                        oldDeliveries = underscore.reject(oldDeliveries, underscore.identity({id: entry.delivery.id}));

                        instance.data.activities = underscore.chain(instance.data.activities)
                            .reject(underscore.identity({id: entry.delivery.id}))
                            .union([entry.delivery])
                            .value();
                    });

                instance.data.activities = underscore.reject(instance.data.activities, function (activity) {
                    return underscore.some(oldDeliveries, function (oldDelivery) {
                        return activity.id === oldDelivery.id;
                    });
                });
            }
        }

        function updateStockLedgerEntry (instance, stock, ledgerEntry, formattedDate, action, category, index, options) {
            var reference = [instance.scheduleKey, action, formattedDate].join('/');

            options = underscore.defaults(options || {}, {
                overwrite: false
            });

            if (underscore.isUndefined(ledgerEntry)) {
                ledgerEntry = underscore.extend({
                    action: action,
                    date: formattedDate,
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    }))));

                stock.addLedgerEntry(ledgerEntry, options);
            } else if (!ledgerEntry.edited || options.overwrite) {
                stock.setLedgerEntry(ledgerEntry, underscore.extend({
                    commodity: instance.commodityType,
                    reference: reference,
                    value: category.valuePerMonth[index]
                }, (category.unit === 'Total' ? {} :
                    underscore.extend({
                        price: category.pricePerUnit,
                        priceUnit: category.unit
                    }, (underscore.isUndefined(category.supplyPerMonth) ? {
                        quantity: category.quantityPerMonth[index],
                        quantityUnit: category.unit
                    } : {
                        quantity: category.supplyPerMonth[index],
                        quantityUnit: category.supplyUnit,
                        rate: category.quantity
                    })))), options);

                if (ledgerEntry.liabilityUuid) {
                    var liability = underscore.findWhere(stock.liabilities, {uuid: ledgerEntry.liabilityUuid});

                    updateLedgerEntryLiability(liability, category.name, formattedDate, action, category.valuePerMonth[index]);
                }
            }

            return ledgerEntry;
        }

        function updateCategoryStock (instance, sectionCode, categoryCode, stock, overwrite) {
            var category = instance.getCategory(sectionCode, categoryCode, instance.costStage),
                assetType = (s.include(categoryCode, 'INC-LSS') ? 'livestock' : 'stock'),
                updateOptions = {
                    overwrite: overwrite === true,
                    recalculate: false
                };

            if (category) {
                category.name = (underscore.contains(['INC-CPS-CROP', 'INC-FRS-FRUT'], category.code) ? instance.commodityType : category.name);
                stock = stock || instance.findStock(assetType, category.name, instance.commodityType);

                if (stock) {
                    var inputAction = (sectionCode === 'INC' ? 'Production' : 'Purchase'),
                        outputAction = (sectionCode === 'INC' ? 'Sale' : 'Consumption');

                    // Remove entries
                    var unassignedLiabilities = underscore.chain(category.valuePerMonth)
                        .reduce(function (results, value, index) {
                            if (value === 0 && underscore.size(stock.data.ledger) > 0) {
                                var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                    inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                    outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                                if (inputLedgerEntry && inputLedgerEntry.liabilityUuid) {
                                    results.push(underscore.findWhere(stock.liabilities, {uuid: inputLedgerEntry.liabilityUuid}));
                                }

                                stock.removeLedgerEntry(inputLedgerEntry, updateOptions);
                                stock.removeLedgerEntry(outputLedgerEntry, updateOptions);
                            }

                            return results;
                        }, [])
                        .compact()
                        .value();

                    stock.recalculateLedger();

                    // Add entries
                    underscore.each(category.valuePerMonth, function (value, index) {
                        if (value > 0) {
                            var formattedDate = moment(instance.startDate).add(index, 'M').format('YYYY-MM-DD'),
                                inputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: inputAction, reference: instance.scheduleKey}),
                                outputLedgerEntry = stock.findLedgerEntry({date: formattedDate, action: outputAction, reference: instance.scheduleKey});

                            if (sectionCode === 'EXP' || instance.assetType !== 'livestock') {
                                inputLedgerEntry = updateStockLedgerEntry(instance, stock, inputLedgerEntry, formattedDate, inputAction, category, index, updateOptions);

                                if (underscore.size(unassignedLiabilities) > 0 && underscore.isUndefined(inputLedgerEntry.liabilityUuid) && inputAction === 'Purchase') {
                                    var liability = unassignedLiabilities.shift();

                                    updateLedgerEntryLiability(liability, category.name, formattedDate, inputAction, value);

                                    inputLedgerEntry.liabilityUuid = liability.uuid;
                                }
                            }

                            updateStockLedgerEntry(instance, stock, outputLedgerEntry, formattedDate, outputAction, category, index, updateOptions);
                        }
                    });

                    stock.recalculateLedger({checkEntries: true});
                }
            }
        }

        function updateLedgerEntryLiability (liability, name, formattedDate, inputAction, value) {
            var liabilityName = name + ' ' + inputAction + ' ' + formattedDate;

            if (liability && (liability.name !== liabilityName || liability.creditLimit !== value || liability.openingDate !== formattedDate)) {
                liability.name = liabilityName;
                liability.creditLimit = value;
                liability.openingDate = formattedDate;
                liability.startDate = formattedDate;

                liability.resetWithdrawals();
                liability.setWithdrawalInMonth(value, formattedDate);
                liability.$dirty = true;
            }
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.clearCache();

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                recalculateCategory(instance, section, group, category);
                            });

                            recalculateGroup(instance, section, group);
                        });

                        recalculateSection(instance, section);
                    }
                });

                instance.sortSections();

                recalculateGrossProfit(instance);
            }
        }

        function recalculateProductionScheduleCategory (instance, categoryCode) {
            if (instance.budget) {
                instance.budget.recalculateCategory(categoryCode);

                underscore.each(instance.budget.data.sections, function (section) {
                    if (section.costStage === instance.costStage) {
                        underscore.each(section.productCategoryGroups, function (group) {
                            underscore.each(group.productCategories, function (category) {
                                if (category.code === categoryCode) {
                                    instance.resetCache([category.code, section.costStage]);
                                    instance.resetCache([group.name, section.costStage]);
                                    instance.resetCache([section.code, section.costStage]);

                                    recalculateCategory(instance, section, group, category);
                                    recalculateGroup(instance, section, group);
                                    recalculateSection(instance, section);
                                }
                            });
                        });
                    }
                });

                recalculateGrossProfit(instance);
            }
        }

        function recalculateGrossProfit (instance) {
            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code === 'INC' ? safeMath.plus(total, section.total.value) : safeMath.minus(total, section.total.value));
            }, 0);

            if (instance.type === 'livestock') {
                instance.data.details.grossProfitPerLSU = safeMath.dividedBy(instance.data.details.grossProfit, instance.data.details.calculatedLSU);
            }
        }

        function recalculateSection (instance, section) {
            var productionSection = instance.getSection(section.code, section.costStage);

            if (productionSection) {
                productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                    return safeMath.plus(total, group.total.value);
                }, 0);

                productionSection.total.valuePerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionSection.total.quantityPerMonth = underscore
                    .chain(productionSection.productCategoryGroups)
                    .pluck('total')
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                        return safeMath.plus(total, group.total.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateGroup (instance, section, group) {
            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

            if (productionGroup) {
                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                    return safeMath.plus(total, category.value);
                }, 0);

                productionGroup.total.valuePerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('valuePerMonth')
                    .reduce(function (total, valuePerMonth) {
                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(valuePerMonth));
                    })
                    .value();

                productionGroup.total.quantityPerMonth = underscore
                    .chain(productionGroup.productCategories)
                    .pluck('quantityPerMonth')
                    .reduce(function (total, quantityPerMonth) {
                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                            return safeMath.plus(total[index], value);
                        }) : angular.copy(quantityPerMonth));
                    })
                    .value();

                if (instance.type === 'livestock') {
                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                        return safeMath.plus(total, category.valuePerLSU);
                    }, 0);
                }
            }
        }

        function recalculateCategory (instance, section, group, category) {
            var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

            productionCategory.name = category.name;
            productionCategory.pricePerUnit = category.pricePerUnit;

            if (instance.type === 'livestock') {
                productionCategory.valuePerLSU = safeMath.plus(productionCategory.valuePerLSU, safeMath.times(category.valuePerLSU, instance.data.details.multiplicationFactor));
                productionCategory.quantityPerLSU = category.quantity;

                if (group.code === 'INC-LSS') {
                    productionCategory.stock = (!underscore.isUndefined(category.stock) ? category.stock : (category.name === instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0));
                    productionCategory.stockPrice = (!underscore.isUndefined(category.stockPrice) ? category.stockPrice : category.pricePerUnit);
                }
            } else {
                productionCategory.quantityPerHa = instance.applyMaturityFactor(section.code, category.quantity);

                if (section.code === 'EXP') {
                    productionCategory.valuePerHa = instance.applyMaturityFactor(section.code, category.value);
                }
            }

            if (section.code === 'INC' && productionCategory.supplyUnit && productionCategory.unit !== category.unit) {
                category.supplyUnit = productionCategory.supplyUnit;
                category.supply = category.quantity;
                category.quantity = 1;
                category.unit = productionCategory.unit;
            }

            if (!underscore.isUndefined(category.supplyPerMonth)) {
                productionCategory.supply = safeMath.times(category.supply, (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(instance.applyMaturityFactor(section.code, value), 2);
                });

                productionCategory.supplyPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.supplyPerMonth), function (value) {
                    var productionValue = safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize));

                    return (category.supplyUnit === 'hd' ? Math.round(productionValue) : productionValue);
                });
            } else {
                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                    return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
                });
            }

            productionCategory.quantity = safeArrayMath.reduce(productionCategory.quantityPerMonth);

            productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                return safeMath.round(safeMath.times(instance.applyMaturityFactor(section.code, value), (instance.type === 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize)), 2);
            });

            productionCategory.value = safeArrayMath.reduce(productionCategory.valuePerMonth);
        }

        function getTitle (instance) {
            return (instance.data && instance.data.details ? instance.data.details.commodity + ' - ' + moment(instance.startDate).format('MMM YYYY') : '');
        }

        inheritModel(ProductionSchedule, EnterpriseBudgetBase);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', underscore.difference(Field.landClasses, [
            'Building',
            'Built-up',
            'Erosion',
            'Forest',
            'Homestead',
            'Mining',
            'Non-vegetated',
            'Water',
            'Water (Seasonal)',
            'Wetland']));

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['crop', 'cropland', 'pasture', 'permanent crop']);

        readOnlyProperty(ProductionSchedule, 'typeByAsset', {
            'crop': 'crop',
            'cropland': 'crop',
            'pasture': 'livestock',
            'permanent crop': 'horticulture'
        });

        readOnlyProperty(ProductionSchedule, 'assetByType', underscore.chain(ProductionSchedule.typeByAsset)
            .omit('cropland')
            .invert()
            .value());

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        privateProperty(ProductionSchedule, 'getTitle', function (instance) {
            return getTitle(instance);
        });

        ProductionSchedule.validates({
            budget: {
                required: true,
                object: true
            },
            budgetUuid: {
                required: true,
                format: {
                    uuid: true
                }
            },
            data: {
                required: true,
                object: true
            },
            endDate: {
                required: true,
                format: {
                    date: true
                }
            },
            organizationId: {
                required: true,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            }
        });

        return ProductionSchedule;
    }]);

var sdkModelComparableSale = angular.module('ag.sdk.model.comparable-sale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelComparableSale.factory('ComparableSale', ['Locale', 'computedProperty', 'Field', 'inheritModel', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Locale, computedProperty, Field, inheritModel, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function ComparableSale (attrs) {
            Locale.apply(this, arguments);

            computedProperty(this, 'distanceInKm', function () {
                return (this.distance ? safeMath.dividedBy(this.distance, 1000.0) : '-');
            });

            computedProperty(this, 'improvedRatePerHa', function () {
                return safeMath.dividedBy(this.purchasePrice, this.area);
            }, {enumerable: true});

            computedProperty(this, 'vacantLandValue', function () {
                return safeMath.dividedBy(this.valueMinusImprovements, this.area);
            }, {enumerable: true});

            computedProperty(this, 'valueMinusImprovements', function () {
                return safeMath.minus(this.purchasePrice,  this.depImpValue);
            }, {enumerable: true});

            computedProperty(this, 'farmName', function () {
                return underscore.chain(this.portions)
                    .groupBy('farmLabel')
                    .map(function (portions, farmName) {
                        var portionSentence = underscore.chain(portions)
                            .sortBy('portionLabel')
                            .pluck('portionLabel')
                            .map(function (portionLabel) {
                                return (s.include(portionLabel, '/') ? s.strLeftBack(portionLabel, '/') : '');
                            })
                            .toSentence()
                            .value();

                        return ((portionSentence.length ? (s.startsWith(portionSentence, 'RE') ? '' : 'Ptn ') + portionSentence + ' of the ' : 'The ') + (farmName ? (underscore.startsWith(farmName.toLowerCase(), 'farm') ? '' : 'farm ') + farmName : ''));
                    })
                    .toSentence()
                    .value();
            }, {enumerable: true});


            computedProperty(this, 'totalLandComponentArea', function () {
                return underscore.chain(this.landComponents)
                    .reject(function (component) {
                        return component.type === 'Water Rights';
                    })
                    .reduce(function(total, landComponent) {
                        return safeMath.plus(total, landComponent.area);
                    }, 0)
                    .value();
            });

            computedProperty(this, 'totalLandComponentValue', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return safeMath.plus(total, landComponent.assetValue);
                }, 0);
            });

            /**
             * Attachment Handling
             */
            privateProperty(this, 'addAttachment', function (attachment) {
                this.removeAttachment(attachment);

                this.attachments.push(attachment);
            });

            privateProperty(this, 'removeAttachment', function (attachment) {
                this.attachments = underscore.reject(this.attachments, function (item) {
                    return item.key === attachment.key;
                });
            });

            privateProperty(this, 'removeNewAttachments', function () {
                var attachments = this.attachments;

                this.attachments = underscore.reject(attachments, function (attachment) {
                    return underscore.isObject(attachment.archive);
                });

                return underscore.difference(attachments, this.attachments);
            });

            /**
             * Land Component Handling
             */
            privateProperty(this, 'addLandComponent', function (type) {
                this.landComponents.push({
                    type: type,
                    assetValue: 0
                });
            });

            privateProperty(this, 'removeLandComponent', function (landComponent) {
                this.landComponents = underscore.without(this.landComponents, landComponent);
            });

            /**
             * Portion Handling
             */
            privateProperty(this, 'addPortion', function (portion) {
                if (!this.hasPortion(portion)) {
                    this.portions.push(portion);

                    underscore.each(portion.landCover || [], function (landCover) {
                        var landComponent = underscore.findWhere(this.landComponents, {type: landCover.label});

                        if (underscore.isUndefined(landComponent)) {
                            landComponent = {
                                type: landCover.label,
                                assetValue: 0
                            };

                            this.landComponents.push(landComponent);
                        }

                        landComponent.area = safeMath.plus(landComponent.area, landCover.area, 3);

                        if (landComponent.unitValue) {
                            landComponent.assetValue = safeMath.times(landComponent.area, landComponent.unitValue);
                        }
                    }, this);
                }

                recalculateArea(this);
            });

            privateProperty(this, 'hasPortion', function (portion) {
                return underscore.some(this.portions, function (storedPortion) {
                    return storedPortion.sgKey === portion.sgKey;
                });
            });

            privateProperty(this, 'removePortionBySgKey', function (sgKey) {
                this.portions = underscore.reject(this.portions, function (portion) {
                    return (portion.sgKey === sgKey);
                });
                recalculateArea(this);
            });

            /**
             * Edit Authorisation
             */
            privateProperty(this, 'isEditable', function (user) {
                return (user && this.authorData && user.username === this.authorData.username && user.company === this.authorData.company);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.area = attrs.area;
            this.attachments = attrs.attachments || [];
            this.authorData = attrs.authorData;
            this.centroid = attrs.centroid;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.depImpValue = attrs.depImpValue;
            this.distance = attrs.distance || 0;
            this.geometry = attrs.geometry;
            this.landComponents = underscore.map(attrs.landComponents || [], convertLandComponent);
            this.portions = attrs.portions || [];
            this.regions = attrs.regions || [];
            this.propertyKnowledge = attrs.propertyKnowledge;
            this.purchasedAt = attrs.purchasedAt;
            this.purchasePrice = attrs.purchasePrice || 0;
            this.useCount = attrs.useCount || 0;
        }

        function convertLandComponent (landComponent) {
            landComponent.type = convertLandComponentType(landComponent.type);

            return landComponent;
        }

        function convertLandComponentType (type) {
            switch (type) {
                case 'Cropland (Dry)':
                    return 'Cropland';
                case 'Cropland (Equipped, Irrigable)':
                case 'Cropland (Irrigable)':
                    return 'Cropland (Irrigated)';
                case 'Conservation':
                    return 'Grazing (Bush)';
                case 'Horticulture (Intensive)':
                    return 'Greenhouses';
                case 'Horticulture (Perennial)':
                    return 'Orchard';
                case 'Horticulture (Seasonal)':
                    return 'Vegetables';
                case 'Housing':
                    return 'Homestead';
                case 'Wasteland':
                    return 'Non-vegetated';
            }

            return type;
        }

        function recalculateArea (instance) {
            instance.area = safeMath.round(underscore.reduce(instance.portions, function(total, portion) {
                return safeMath.plus(total, portion.area);
            }, 0), 4);
        }

        inheritModel(ComparableSale, Locale);

        readOnlyProperty(ComparableSale, 'landComponentTypes', underscore.union(Field.landClasses, ['Water Rights']).sort(naturalSort));

        readOnlyProperty(ComparableSale, 'propertyKnowledgeOptions', ['The valuer has no firsthand knowledge of this property.',
            'The valuer has inspected this comparable from aerial photos, and has no firsthand knowledge of the property.',
            'The valuer has inspected/valued this comparable before, and has firsthand knowledge of the property.']);

        privateProperty(ComparableSale, 'convertLandComponentType', convertLandComponentType);

        ComparableSale.validates({
            area: {
                required: true,
                numeric: true
            },
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            },
            landComponents: {
                required: true,
                length: {
                    min: 1
                }
            },
            portions: {
                required: true,
                length: {
                    min: 1
                }
            },
            purchasePrice: {
                required: true,
                numeric: true
            }
        });

        return ComparableSale;
    }]);

var sdkModelFarmSale = angular.module('ag.sdk.model.farm-sale', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.farm-valuation']);

sdkModelFarmSale.factory('FarmSale', ['Base', 'computedProperty', 'DocumentFactory', 'Locale', 'inheritModel', 'md5String', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Base, computedProperty, DocumentFactory, Locale, inheritModel, md5String, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function FarmSale (attrs) {
            Locale.apply(this, arguments);

            computedProperty(this, 'farmland', function () {
                return this.data.farmland;
            });

            privateProperty(this, 'generateUid', function () {
                this.uid = md5String(underscore.chain(this.farmland)
                    .pluck('data')
                    .pluck('sgKey')
                    .compact()
                    .value()
                    .join(',') + (this.saleDate ? '/' + moment(this.saleDate).format('YYYY-MM-DD') : ''));

                return this.uid;
            });

            privateProperty(this, 'asComparable', function () {
                return {
                    centroid: this.centroid,
                    farmland: this.data.farmland,
                    farmName: this.title,
                    farmSize: this.area,
                    uuid: this.uid
                }
            });

            /**
             * Document Handling
             */

            privateProperty(this, 'addDocument', function (document) {
                this.documents = underscore.chain(this.documents)
                    .reject(underscore.identity({documentId: document.documentId}))
                    .union([document])
                    .sortBy(function (document) {
                        return moment(document.data.report && document.data.report.completionDate).unix();
                    })
                    .value();
                this.documentCount = underscore.size(this.documents);
            });

            /**
             * Farmland Handling
             */

            privateProperty(this, 'addFarmland', function (farmland) {
                this.data.farmland = underscore.chain(this.data.farmland)
                    .reject(function (item) {
                        return item.data.sgKey === farmland.data.sgKey;
                    })
                    .union([farmland])
                    .value()
                    .sort(function (itemA, itemB) {
                        return naturalSort(itemA.data.sgKey, itemB.data.sgKey);
                    });

                generateTitle(this);
                recalculateArea(this);
            });

            privateProperty(this, 'hasFarmland', function (farmland) {
                return underscore.some(this.data.farmland, function (item) {
                    return item.data.sgKey === farmland.data.sgKey;
                });
            });

            privateProperty(this, 'removeFarmlandBySgKey', function (sgKey) {
                this.data.farmland = underscore.reject(this.data.farmland, function (item) {
                    return (item.data.sgKey === sgKey);
                });

                generateTitle(this);
                recalculateArea(this);
            });

            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'farmland', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.area = attrs.area || 0;
            this.centroid = attrs.centroid;
            this.documentCount = attrs.documentCount || 0;
            this.salePrice = attrs.salePrice;
            this.saleDate = attrs.saleDate;
            this.title = attrs.title;
            this.uid = attrs.uid;

            this.documents = underscore.chain(attrs.documents)
                .map(DocumentFactory.newCopy)
                .sortBy(function (document) {
                    return moment(document.data.report && document.data.report.completionDate).unix();
                })
                .value();
        }

        function generateTitle (instance) {
            instance.title = underscore.chain(instance.farmland)
                .groupBy(function (asset) {
                    return asset.data.farmLabel;
                })
                .map(function (assets, farmLabel) {
                    var portionSentence = underscore.chain(assets)
                        .pluck('data')
                        .sortBy('portionLabel')
                        .pluck('portionLabel')
                        .compact()
                        .map(function (portionLabel) {
                            return (s.include(portionLabel, '/') ? s.strLeftBack(portionLabel, '/') : '');
                        })
                        .toSentence()
                        .value();

                    return (underscore.size(portionSentence) > 0 ? (s.startsWith(portionSentence, 'RE') ? '' : 'Ptn ') + portionSentence + ' of the ' : 'The ') +
                        (farmLabel ? (underscore.startsWith(farmLabel.toLowerCase(), 'farm') ? '' : 'farm ') + farmLabel : '');
                })
                .toSentence()
                .prune(1024, '')
                .value();
        }

        function recalculateArea (instance) {
            instance.area = safeMath.round(underscore.reduce(instance.data.farmland, function(total, farmland) {
                return safeMath.plus(total, farmland.data.area);
            }, 0), 3);
        }

        inheritModel(FarmSale, Locale);

        readOnlyProperty(FarmSale, 'propertyKnowledgeOptions', ['The valuer has no firsthand knowledge of this property.',
            'The valuer has inspected this property from aerial photos, and has no firsthand knowledge of the property.',
            'The valuer has inspected/valued this property before, and has firsthand knowledge of the property.']);


        FarmSale.validates({
            area: {
                required: true,
                numeric: true
            },
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            },
            data: {
                required: true,
                object: true
            },
            farmland: {
                required: true,
                length: {
                    min: 1
                }
            },
            salePrice: {
                required: true,
                numeric: true
            },
            saleDate: {
                required: true,
                date: true
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 1024
                }
            },
            uid: {
                required: true,
                format: {
                    uid: true
                }
            }
        });

        return FarmSale;
    }]);

var sdkModelTaskEmergenceInspection = angular.module('ag.sdk.model.task.emergence-inspection', ['ag.sdk.model.crop-inspection', 'ag.sdk.model.task']);

sdkModelTaskEmergenceInspection.provider('EmergenceInspectionTask', ['TaskFactoryProvider', function (TaskFactoryProvider) {
    this.$get = ['computedProperty', 'CropInspection', 'inheritModel', 'Task', 'underscore',
        function (computedProperty, CropInspection, inheritModel, Task, underscore) {
            function EmergenceInspectionTask (attrs) {
                Task.apply(this, arguments);

                computedProperty(this, 'inspectionDate', function () {
                    return this.data.inspectionDate;
                });

                computedProperty(this, 'landRecommendation', function () {
                    return this.data.landRecommendation;
                });

                computedProperty(this, 'moistureStatus', function () {
                    return this.data.moistureStatus;
                });

                computedProperty(this, 'zones', function () {
                    return this.data.asset.data.zones;
                });
            }

            inheritModel(EmergenceInspectionTask, Task);

            EmergenceInspectionTask.validates(underscore.extend({
                inspectionDate: {
                    required: true,
                    format: {
                        date: true
                    }
                },
                landRecommendation: {
                    required: true,
                    inclusion: {
                        in: CropInspection.approvalTypes
                    }
                },
                moistureStatus: {
                    requiredIf: function (value, instance, field) {
                        return instance.landRecommendation !== 'Not Planted';
                    },
                    inclusion: {
                        in: CropInspection.moistureStatuses
                    }
                },
                zones: {
                    requiredIf: function (value, instance, field) {
                        return instance.landRecommendation !== 'Not Planted';
                    },
                    length: {
                        min: 1
                    }
                }
            }, Task.validations));

            return EmergenceInspectionTask;
        }];

    TaskFactoryProvider.add('emergence inspection', 'EmergenceInspectionTask');
}]);
var sdkModelTaskProgressInspection = angular.module('ag.sdk.model.task.progress-inspection', ['ag.sdk.model.crop', 'ag.sdk.model.task']);

sdkModelTaskProgressInspection.provider('ProcessInspectionTask', ['TaskFactoryProvider', function (TaskFactoryProvider) {
    this.$get = ['Base', 'computedProperty', 'Crop', 'CropInspection', 'inheritModel', 'privateProperty', 'safeArrayMath', 'safeMath', 'Task', 'underscore',
        function (Base, computedProperty, Crop, CropInspection, inheritModel, privateProperty, safeArrayMath, safeMath, Task, underscore) {
            function ProcessInspectionTask (attrs) {
                Task.apply(this, arguments);

                Base.initializeObject(this.data, 'samples', []);

                privateProperty(this, 'calculateResults', function () {
                    calculateResults(this);
                });

                computedProperty(this, 'inspectionDate', function () {
                    return this.data.inspectionDate;
                });

                computedProperty(this, 'moistureStatus', function () {
                    return this.data.moistureStatus;
                });

                computedProperty(this, 'pitWeight', function () {
                    return this.data.pitWeight;
                });

                computedProperty(this, 'realization', function () {
                    return this.data.realization;
                });

                computedProperty(this, 'samples', function () {
                    return this.data.samples;
                });
            }

            inheritModel(ProcessInspectionTask, Task);

            function reduceSamples (samples, prop) {
                return safeMath.dividedBy(underscore.reduce(samples, function (total, sample) {
                    return safeMath.plus(total, sample[prop]);
                }, 0), samples.length);
            }

            function calculateResults (instance) {
                var asset = Crop.newCopy(instance.data.asset),
                    pitWeight = instance.data.pitWeight || 0,
                    realization = instance.data.realization || 100;

                var zoneResults = underscore.map(asset.zones, function (zone) {
                    var zoneSamples = underscore.where(instance.data.samples, {zoneUuid: zone.uuid}),
                        result = {
                            zoneUuid: zone.uuid,
                            sampleSize: underscore.size(zoneSamples),
                            coverage: safeMath.dividedBy(zone.size, asset.data.plantedArea),
                            heads: reduceSamples(zoneSamples, 'heads'),
                            weight: reduceSamples(zoneSamples, 'weight')
                        };

                    if (asset.flower === 'spikelet') {
                        result.yield = safeMath.dividedBy(
                            safeMath.times(result.weight, result.heads),
                            safeMath.times((asset.data.irrigated ? 3000 : 3500), (zone.plantedInRows ? safeMath.times(zone.rowWidth, 3) : 1)));
                    } else if (asset.flower === 'pod') {
                        result.pods = reduceSamples(zoneSamples, 'pods');
                        result.seeds = reduceSamples(zoneSamples, 'seeds');
                        result.yield = safeMath.dividedBy(
                            safeArrayMath.reduceOperator([pitWeight, result.seeds, result.pods, result.heads], 'times', 0),
                            safeMath.times(zone.rowWidth, 300));
                    } else {
                        result.yield = safeMath.dividedBy(
                            safeMath.times(result.weight, result.heads),
                            safeMath.times(zone.rowWidth, 1000));
                    }

                    result.yield = safeMath.times(result.yield, safeMath.dividedBy(realization, 100));

                    return result;
                });

                instance.data.inspection = {
                    flower: asset.flower,
                    results: zoneResults,
                    totalYield: underscore.reduce(zoneResults, function (total, item) {
                        return total + (item.coverage * item.yield);
                    }, 0)
                };
            }

            ProcessInspectionTask.validates(underscore.extend({
                inspectionDate: {
                    required: true,
                    format: {
                        date: true
                    }
                },
                moistureStatus: {
                    required: true,
                    inclusion: {
                        in: CropInspection.moistureStatuses
                    }
                },
                pitWeight: {
                    required: true,
                    range: {
                        from: 0
                    },
                    numeric: true
                },
                realization: {
                    required: true,
                    range: {
                        from: 0,
                        to: 100
                    },
                    numeric: true
                },
                samples: {
                    required: true,
                    length: {
                        min: 1
                    }
                }
            }, Task.validations));

            return ProcessInspectionTask;
        }];

    TaskFactoryProvider.add('progress inspection', 'ProcessInspectionTask');
}]);
var sdkModelTask = angular.module('ag.sdk.model.task', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelTask.factory('Task', ['Base', 'inheritModel', 'Model', 'underscore',
    function (Base, inheritModel, Model, underscore) {
        function Task (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assignedAt = attrs.assignedAt;
            this.assignedBy = attrs.assignedBy;
            this.assignedTo = attrs.assignedTo;
            this.completedAt = attrs.completedAt;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.documentId = attrs.documentId;
            this.documentKey = attrs.documentKey;
            this.organizationId = attrs.organizationId;
            this.originUuid = attrs.originUuid;
            this.parentTaskId = attrs.parentTaskId;
            this.progressAt = attrs.progressAt;
            this.providerType = attrs.providerType;
            this.providerUuid = attrs.providerUuid;
            this.status = attrs.status;
            this.todo = attrs.todo;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;

            // Models
            this.document = attrs.document;
            this.organization = attrs.organization;
        }

        inheritModel(Task, Model.Base);

        Task.validates({
            documentId: {
                required: true,
                numeric: true
            },
            organizationId: {
                required: true,
                numeric: true
            },
            originUuid: {
                requiredIf: function (value, instance, field) {
                    return instance.type === 'external';
                },
                format: {
                    uuid: true
                }
            },
            parentTaskId: {
                requiredIf: function (value, instance, field) {
                    return instance.type !== 'parent';
                },
                numeric: true
            },
            providerType: {
                requiredIf: function (value, instance, field) {
                    return instance.type === 'external';
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            providerUuid: {
                requiredIf: function (value, instance, field) {
                    return instance.type === 'external';
                },
                format: {
                    uuid: true
                }
            },
            uuid: {
                format: {
                    uuid: true
                }
            }
        });

        return Task;
    }]);

sdkModelTask.provider('TaskFactory', function () {
    var instances = {};

    this.add = function (todo, modelName) {
        instances[todo] = modelName;
    };

    this.$get = ['$injector', 'Task', function ($injector, Task) {
        function apply (attrs, fnName) {
            if (instances[attrs.todo]) {
                if (typeof instances[attrs.todo] === 'string') {
                    instances[attrs.todo] = $injector.get(instances[attrs.todo]);
                }

                return instances[attrs.todo][fnName](attrs);
            }

            return Task[fnName](attrs);
        }

        return {
            isInstanceOf: function (task) {
                return (task ?
                    (instances[task.todo] ?
                        task instanceof instances[task.todo] :
                        task instanceof Task) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});

var sdkModelErrors = angular.module('ag.sdk.model.errors', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelErrors.factory('Errorable', ['privateProperty', 'underscore',
    function (privateProperty, underscore) {
        function Errorable () {
            var _$errors = {};

            privateProperty(_$errors, 'count', 0);

            privateProperty(_$errors, 'countFor', function (fieldName) {
                if (underscore.isUndefined(fieldName)) {
                    return _$errors.count;
                }

                return (_$errors[fieldName] ? _$errors[fieldName].length : 0);
            });

            privateProperty(_$errors, 'add', function (fieldName, errorMessage) {
                if (underscore.isUndefined(_$errors[fieldName])) {
                    _$errors[fieldName] = [];
                }

                if (underscore.contains(_$errors[fieldName], errorMessage) === false) {
                    _$errors[fieldName].push(errorMessage);
                    _$errors.count++;
                }
            });

            privateProperty(_$errors, 'clear', function (fieldName, errorMessage) {
                if (underscore.isUndefined(errorMessage) === false) {
                    if (underscore.contains(_$errors[fieldName], errorMessage)) {
                        _$errors[fieldName] = underscore.without(_$errors[fieldName], errorMessage);
                        _$errors.count--;

                        if(_$errors[fieldName].length === 0) {
                            delete _$errors[fieldName];
                        }
                    }
                } else {
                    var toClear = [];

                    if (underscore.isArray(fieldName)) {
                        toClear = fieldName;
                    }

                    if (underscore.isString(fieldName)) {
                        toClear.push(fieldName);
                    }

                    if (underscore.isUndefined(fieldName)) {
                        toClear = underscore.keys(_$errors);
                    }

                    underscore.each(toClear, function (fieldName) {
                        if (underscore.isUndefined(_$errors[fieldName]) === false) {
                            var count = _$errors[fieldName].length;
                            delete _$errors[fieldName];
                            _$errors.count -= count;
                        }
                    });
                }
            });

            privateProperty(this, '__$errors', _$errors);
        }

        return Errorable;
    }]);
var sdkModelStore = angular.module('ag.sdk.model.store', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelStore.factory('Storable', ['computedProperty', 'privateProperty',
    function (computedProperty, privateProperty) {
        var booleanProps = ['$complete', '$delete', '$dirty', '$local', '$offline', '$saved'],
            otherProps = ['$id', '$uri'];

        function Storable () {
            var _storable = {};

            privateProperty(_storable, 'set', function (inst, attrs) {
                if (attrs) {
                    angular.forEach(otherProps, function (prop) {
                        privateProperty(inst, prop, attrs[prop]);
                    });

                    angular.forEach(booleanProps, function (prop) {
                        privateProperty(inst, prop, attrs[prop] === true);
                    });
                }
            });

            privateProperty(this, 'storable', function (attrs) {
                _storable.set(this, attrs);
            });
        }

        return Storable;
    }]);
var sdkModelValidation = angular.module('ag.sdk.model.validation', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.validators']);

sdkModelValidation.factory('Validatable', ['computedProperty', 'privateProperty', 'underscore', 'Validatable.Field',
    'Validator.dateRange',
    'Validator.equal',
    'Validator.format',
    'Validator.inclusion',
    'Validator.inclusion.in',
    'Validator.length',
    'Validator.object',
    'Validator.numeric',
    'Validator.range',
    'Validator.required',
    'Validator.requiredIf',
    function (computedProperty, privateProperty, underscore, Field) {
        function Validatable () {
            var _validations = {};

            privateProperty(_validations, 'add', function (validationSpec) {
                underscore.each(validationSpec, function (validationSet, fieldName) {
                    if (_validations[fieldName]) {
                        _validations[fieldName].addValidators(validationSet);
                    } else {
                        _validations[fieldName] = new Field(fieldName, validationSet);
                    }
                });
            });

            privateProperty(_validations, 'validate', function (instance, fieldName) {
                var toValidate = getFieldsToValidate(fieldName);

                underscore.each(toValidate, function (validation) {
                    validateField(instance, validation);
                });

                return instance.$errors.countFor(fieldName) === 0;
            });

            function validateField (instance, validation) {
                if (validation.validate(instance) === false) {
                    instance.$errors.add(validation.field, validation.message);
                } else {
                    instance.$errors.clear(validation.field, validation.message);
                }
            }

            function getFieldsToValidate (fieldName) {
                if (fieldName && _validations[fieldName]) {
                    return _validations[fieldName];
                }

                return underscore.chain(_validations)
                    .map(function (validations) {
                        return validations;
                    })
                    .flatten()
                    .value();
            }

            privateProperty(this, 'validations', _validations);
            privateProperty(this, 'validates', _validations.add);

            privateProperty(this, '__validate', function (fieldName) {
                return this.constructor.validations.validate(this, fieldName);
            });

            computedProperty(this, '__$valid', function () {
                return this.constructor.validations.validate(this);
            });

            computedProperty(this, '__$invalid', function () {
                return !this.constructor.validations.validate(this);
            });
        }

        return Validatable;
    }]);

sdkModelValidation.factory('Validatable.DuplicateValidatorError', [function () {
    function DuplicateValidatorError(name) {
        this.name = 'DuplicateValidatorError';
        this.message = 'A validator by the name ' + name + ' is already registered';
    }

    DuplicateValidatorError.prototype = Error.prototype;

    return DuplicateValidatorError;
}]);

sdkModelValidation.factory('Validatable.ValidationMessageNotFoundError', [function() {
    function ValidationMessageNotFoundError(validatorName, fieldName) {
        this.name    = 'ValidationMessageNotFound';
        this.message = 'Validation message not found for validator ' + validatorName + ' on the field ' + fieldName + '. Validation messages must be added to validators in order to provide your users with useful error messages.';
    }

    ValidationMessageNotFoundError.prototype = Error.prototype;

    return ValidationMessageNotFoundError;
}]);

sdkModelValidation.factory('Validatable.Field', ['privateProperty', 'underscore', 'Validatable.Validation', 'Validatable.ValidationMessageNotFoundError', 'Validatable.Validator', 'Validatable.validators',
    function (privateProperty, underscore, Validation, ValidationMessageNotFoundError, Validator, validators) {
        function Field (name, validationSet) {
            var field = [];

            privateProperty(field, 'addValidator', function (params, validationName) {
                if (params instanceof Validation) {
                    field.push(params);
                } else {
                    var validator = validators.find(validationName) || new Validator(params, validationName),
                        configuredFunctions = underscore.flatten([validator.configure(params)]);

                    if (underscore.isUndefined(validator.message)) {
                        throw new ValidationMessageNotFoundError(validationName, name);
                    }

                    underscore.each(configuredFunctions, function (configuredFunction) {
                        field.push(new Validation(name, configuredFunction));
                    });
                }
            });

            privateProperty(field, 'addValidators', function (validationSet) {
                underscore.each(validationSet, field.addValidator);
            });

            field.addValidators(validationSet);

            return field;
        }

        return Field;
    }]);

sdkModelValidation.factory('Validatable.Validation', ['privateProperty', function (privateProperty) {
    function Validation (field, validationFunction) {
        privateProperty(this, 'field', field);
        privateProperty(this, 'message', validationFunction.message);
        privateProperty(this, 'validate', function (instance) {
            return validationFunction(instance[field], instance, field);
        });
    }

    return Validation;
}]);

sdkModelValidation.factory('Validatable.ValidationFunction', ['underscore', function (underscore) {
    function ValidationFunction (validationFunction, options) {
        var boundFunction = underscore.bind(validationFunction, options);
        boundFunction.message = configureMessage();

        function configureMessage () {
            if (underscore.isFunction(options.message)) {
                return options.message.apply(options);
            }

            return options.message;
        }

        return boundFunction;
    }

    return ValidationFunction;
}]);

sdkModelValidation.factory('Validatable.ValidatorNotFoundError', [function() {
    function ValidatorNotFoundError(name) {
        this.name    = 'ValidatorNotFoundError';
        this.message = 'No validator found by the name of ' + name + '. Custom validators must define a validator key containing the custom validation function';
    }

    ValidatorNotFoundError.prototype = Error.prototype;

    return ValidatorNotFoundError;
}]);

sdkModelValidation.factory('Validatable.Validator', ['privateProperty', 'underscore', 'Validatable.ValidationFunction', 'Validatable.ValidatorNotFoundError', 'Validatable.validators',
    function (privateProperty, underscore, ValidationFunction, ValidatorNotFoundError, validators) {
        function AnonymousValidator(options, name) {
            if (underscore.isFunction(options.validator)) {
                if (options.message) {
                    options.validator.message = options.message;
                }

                return new Validator(options.validator, name);
            }
        }

        function Validator (validationFunction, name) {
            if (validationFunction.validator) {
                return new AnonymousValidator(validationFunction, name);
            }

            if (underscore.isFunction(validationFunction) === false) {
                throw new ValidatorNotFoundError(name);
            }

            var validator = this;

            privateProperty(validator, 'name', validationFunction.name);
            privateProperty(validator, 'message', validationFunction.message);
            privateProperty(validator, 'childValidators', {});
            privateProperty(validator, 'configure', function (options) {
                options = defaultOptions(options);

                if (underscore.size(validator.childValidators) > 0) {
                    return configuredChildren(options);
                }

                return new ValidationFunction(validationFunction, underscore.defaults(options, this));
            });

            addChildValidators(validationFunction.options);
            validators.register(validator);

            function addChildValidators (options) {
                underscore.each(options, function (value, key) {

                    if (value.constructor.name === 'Validator') {
                        validator.childValidators[key] = value;
                    }
                });
            }

            function configuredChildren (options) {
                return underscore.chain(validator.childValidators)
                    .map(function (childValidator, name) {
                        if (options[name] !== undefined) {
                            return childValidator.configure(options[name]);
                        }
                    })
                    .compact()
                    .value();
            }

            function defaultOptions (options) {
                if (typeof options != 'object' || underscore.isArray(options)) {
                    options = {
                        value: options,
                        message: validator.message
                    };
                }

                if (underscore.isUndefined(validationFunction.name) == false) {
                    options[validationFunction.name] = options.value;
                }

                return options;
            }
        }

        return Validator;
    }]);

sdkModelValidation.factory('Validatable.validators', ['Validatable.DuplicateValidatorError', 'privateProperty', 'underscore',
    function (DuplicateValidatorError, privateProperty, underscore) {
        var validators = {};

        privateProperty(validators, 'register', function (validator) {
            if (underscore.isUndefined(validators[validator.name])) {
                validators[validator.name] = validator;
            } else {
                throw new DuplicateValidatorError(validator.name);
            }
        });

        privateProperty(validators, 'find', function (validatorName) {
            return validators[validatorName];
        });

        return validators;
    }]);

var sdkModelValidators = angular.module('ag.sdk.model.validators', ['ag.sdk.library', 'ag.sdk.model.validation']);

/**
 * Date Validator
 */
sdkModelValidators.factory('Validator.dateRange', ['moment', 'underscore', 'Validatable.Validator', 'Validator.dateRange.after', 'Validator.dateRange.before',
    function (moment, underscore, Validator, after, before) {
        function dateRange (value, instance, field) {}

        dateRange.message = function () {
            return 'Is not a valid date';
        };

        dateRange.options = {
            after: after,
            before: before
        };

        return new Validator(dateRange);
    }]);

sdkModelValidators.factory('Validator.dateRange.after', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        function after (value, instance, field) {
            if (underscore.isUndefined(this.after) || underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return moment(value) >= moment(this.after);
        }

        after.message = function () {
            return 'Must be at least ' + moment(this.after).format("dddd, MMMM Do YYYY, h:mm:ss a");
        };

        return new Validator(after);
    }]);

sdkModelValidators.factory('Validator.dateRange.before', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        function before (value, instance, field) {
            if (underscore.isUndefined(this.before) || underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return moment(value) <= moment(this.before);
        }

        before.message = function () {
            return 'Must be no more than ' + moment(this.before).format("dddd, MMMM Do YYYY, h:mm:ss a");
        };

        return new Validator(before);
    }]);

/**
 * Equals Validator
 */
sdkModelValidators.factory('Validator.equal', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function equal (value, instance, field) {
            if (underscore.isUndefined(this.to)) {
                throw 'Equal validator must specify an \'to\' attribute';
            }

            return value === this.to;
        }

        equal.message = function () {
            return 'Must be equal to \'' + this.to + '\'';
        };

        return new Validator(equal);
    }]);

/**
 * Format Validator
 */
sdkModelValidators.factory('Validator.format', ['underscore', 'Validatable.Validator', 'Validator.format.date', 'Validator.format.email', 'Validator.format.telephone', 'Validator.format.uuid',
    function (underscore, Validator, date, email, telephone, uuid) {
        function format (value, instance, field) {}

        format.message = function () {
            return 'Must be the correct format';
        };

        format.options = {
            date: date,
            email: email,
            telephone: telephone,
            uuid: uuid
        };

        return new Validator(format);
    }]);

sdkModelValidators.factory('Validator.format.date', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        function date (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return moment(value).isValid();
        }

        date.message = function () {
            return 'Must be a valid date';
        };

        return new Validator(date);
    }]);

sdkModelValidators.factory('Validator.format.email', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$');

        function email (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        email.message = function () {
            return 'Must be a valid email address';
        };

        return new Validator(email);
    }]);

sdkModelValidators.factory('Validator.format.telephone', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^(\\(?\\+?[0-9]*\\)?)?[0-9_\\- \\(\\)]*$');

        function telephone (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        telephone.message = function () {
            return 'Must be a valid telephone number';
        };

        return new Validator(telephone);
    }]);

sdkModelValidators.factory('Validator.format.uuid', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'i');

        function uuid (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        uuid.message = function () {
            return 'Must be a valid UUID';
        };

        return new Validator(uuid);
    }]);

sdkModelValidators.factory('Validator.format.uid', ['moment', 'underscore', 'Validatable.Validator',
    function (moment, underscore, Validator) {
        var regexValidator = new RegExp('^[0-9a-f]{16}$', 'i');

        function uid (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return regexValidator.test(value);
        }

        uid.message = function () {
            return 'Must be a valid UID';
        };

        return new Validator(uid);
    }]);

/**
 * Inclusion Validator
 */
sdkModelValidators.factory('Validator.inclusion', ['underscore', 'Validatable.Validator', 'Validator.inclusion.in',
    function (underscore, Validator, inclusionIn) {
        function inclusion (value, instance, field) {}

        inclusion.message = function () {
            return 'Must have an included value';
        };

        inclusion.options = {
            in: inclusionIn
        };

        return new Validator(inclusion);
    }]);

sdkModelValidators.factory('Validator.inclusion.in', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function inclusionIn (value, instance, field) {
            var _in = (typeof this.value == 'function' ? this.value(value, instance, field) : this.value);

            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return (_in.length == 0 ? true : underscore.some(_in, function (item) {
                return value === item;
            }));
        }

        inclusionIn.message = function () {
            return 'Must be in array of values';
        };

        return new Validator(inclusionIn);
    }]);

/**
 * Length Validators
 */
sdkModelValidators.factory('Validator.length', ['Validatable.Validator', 'Validator.length.min', 'Validator.length.max',
    function (Validator, min, max) {
        function length () {
            return true;
        }

        length.message = 'does not meet the length requirement';
        length.options = {};

        if (min) length.options.min = min;
        if (max) length.options.max = max;

        return new Validator(length);
    }]);

sdkModelValidators.factory('Validator.length.min', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function min (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return value.length >= this.min;
        }

        min.message = function () {
            return 'Length must be at least ' + this.min;
        };

        return new Validator(min);
    }]);

sdkModelValidators.factory('Validator.length.max', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function max (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return value.length <= this.max;
        }

        max.message = function () {
            return 'Length must be at most ' + this.max;
        };

        return new Validator(max);
    }]);

/**
 * Numeric Validator
 */
sdkModelValidators.factory('Validator.numeric', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function numeric (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return (typeof value == 'number' && underscore.isNumber(value));
        }

        numeric.message = function () {
            return 'Must be a number';
        };

        return new Validator(numeric);
    }]);

sdkModelValidators.factory('Validator.object', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function object (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return true;
            }

            return (typeof value == 'object');
        }

        object.message = function () {
            return 'Must be an object';
        };

        return new Validator(object);
    }]);

/**
 * Range Validators
 */
sdkModelValidators.factory('Validator.range', ['Validatable.Validator', 'Validator.range.from', 'Validator.range.to',
    function (Validator, from, to) {
        function range () {
            return true;
        }

        range.message = 'Must be with the range requirement';

        range.options = {
            from: from,
            to: to
        };

        return new Validator(range);
    }]);

sdkModelValidators.factory('Validator.range.from', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function from (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return value >= this.from;
        }

        from.message = function () {
            return 'Must be at least ' + this.from;
        };

        return new Validator(from);
    }]);

sdkModelValidators.factory('Validator.range.to', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function to (value, instance, field) {
            if (underscore.isUndefined(value) || underscore.isNull(value) || value === '') {
                return true;
            }

            return value <= this.to;
        }

        to.message = function () {
            return 'Must be no more than ' + this.to;
        };

        return new Validator(to);
    }]);

/**
 * Required Validator
 */
sdkModelValidators.factory('Validator.required', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function required (value, instance, field) {
            if (!this.required) {
                return true;
            }

            if (underscore.isUndefined(value) || underscore.isNull(value)) {
                return false;
            }

            if (value.constructor.name === 'String') {
                return !!(value && value.length || typeof value == 'object');
            }

            return value !== undefined;
        }

        required.message = 'cannot be blank';

        return new Validator(required);
    }]);

/**
 * Required If Validator
 */
sdkModelValidators.factory('Validator.requiredIf', ['underscore', 'Validatable.Validator',
    function (underscore, Validator) {
        function requiredIf (value, instance, field) {
            if (!this.value(value, instance, field)) {
                return true;
            } else {
                if (underscore.isUndefined(value) || underscore.isNull(value)) {
                    return false;
                }

                if (value.constructor.name == 'String') {
                    return !!(value && value.length || typeof value == 'object');
                }

                return value !== undefined;
            }
        }

        requiredIf.message = 'Is a required field';

        return new Validator(requiredIf);
    }]);
var sdkTestDataApp = angular.module('ag.sdk.test.data', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkTestDataApp.provider('mockDataService', ['underscore', function (underscore) {
    var _mockData = {};
    var _config = {
        localStore: true
    };

    this.config = function (options) {
        _config = underscore.defaults(options, _config);
    };

    this.$get = ['localStore', 'objectId', 'promiseService', function (localStore, objectId, promiseService) {
        if (_config.localStore) {
            _mockData = localStore.getItem('mockdata') || {};
        }

        return {
            setItem: function (type, data) {
                if (data instanceof Array) {
                    _mockData[type] = {};

                    angular.forEach(data, function (item) {
                        item.id = item.id || objectId().toString();

                        _mockData[type][item.id] = item;
                    });
                } else {
                    data.id = data.id || objectId().toString();

                    _mockData[type] = _mockData[type] || {};
                    _mockData[type][data.id] = data;
                }

                if (_config.localStore) {
                    localStore.setItem('mockdata', _mockData);
                }
            },
            getItem: function (type, id) {
                return promiseService.wrap(function (promise) {
                    _mockData[type] = _mockData[type] || {};

                    if (id === undefined) {
                        promise.resolve(underscore.toArray(_mockData[type] || {}));
                    } else {
                        if (_mockData[type][id]) {
                            promise.resolve(_mockData[type][id]);
                        } else {
                            promise.reject();
                        }
                    }
                });
            }
        }
    }];
}]);

angular.module('ag.sdk.helper', [
    'ag.sdk.helper.asset',
    'ag.sdk.helper.attachment',
    'ag.sdk.helper.crop-inspection',
    'ag.sdk.helper.document',
    'ag.sdk.helper.favourites',
    'ag.sdk.helper.task',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.geocledian',
    'ag.sdk.interface.ui',
    'ag.sdk.interface.list',
    'ag.sdk.interface.map',
    'ag.sdk.interface.navigation'
]);

angular.module('ag.sdk.model', [
    'ag.sdk.model.asset',
    'ag.sdk.model.base',
    'ag.sdk.model.business-plan',
    'ag.sdk.model.comparable-farm-valuation',
    'ag.sdk.model.comparable-sale',
    'ag.sdk.model.crop',
    'ag.sdk.model.crop-inspection',
    'ag.sdk.model.desktop-valuation',
    'ag.sdk.model.document',
    'ag.sdk.model.enterprise-budget',
    'ag.sdk.model.expense',
    'ag.sdk.model.farm',
    'ag.sdk.model.farm-sale',
    'ag.sdk.model.farm-valuation',
    'ag.sdk.model.farmer',
    'ag.sdk.model.field',
    'ag.sdk.model.financial',
    'ag.sdk.model.layer',
    'ag.sdk.model.legal-entity',
    'ag.sdk.model.liability',
    'ag.sdk.model.livestock',
    'ag.sdk.model.locale',
    'ag.sdk.model.map-theme',
    'ag.sdk.model.merchant',
    'ag.sdk.model.organization',
    'ag.sdk.model.point-of-interest',
    'ag.sdk.model.production-group',
    'ag.sdk.model.production-schedule',
    'ag.sdk.model.errors',
    'ag.sdk.model.stock',
    'ag.sdk.model.store',
    'ag.sdk.model.task',
    'ag.sdk.model.task.emergence-inspection',
    'ag.sdk.model.task.progress-inspection',
    'ag.sdk.model.validation',
    'ag.sdk.model.validators'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.sdk', [
    'ag.sdk.authorization',
    'ag.sdk.editor',
    'ag.sdk.id',
    'ag.sdk.geospatial',
    'ag.sdk.utilities',
    'ag.sdk.model',
    'ag.sdk.api',
    'ag.sdk.helper',
    'ag.sdk.library',
    'ag.sdk.interface.map',
    'ag.sdk.test'
]);
