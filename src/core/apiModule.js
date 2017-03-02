var sdkApiApp = angular.module('ag.sdk.api', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library']);

/**
 * Active Flag API
 */
sdkApiApp.factory('activeFlagApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
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
        updateActiveFlag: function(activeFlag) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/active-flag/' + activeFlag.id, activeFlag, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

/**
 * Activity API
 */
sdkApiApp.factory('activityApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/activity', data, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('aggregationApi', ['$log', '$http', 'configuration', 'promiseService', 'pagingService', 'underscore', function ($log, $http, configuration, promiseService, pagingService, underscore) {
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
        getProductionRegionByPoint: function (x, y) {
            return promiseService.wrap(function(promise) {
                var param = '';

                if (typeof x == 'number' && typeof y == 'number') {
                    param = '?x=' + x + '&y=' + y;
                } else {
                    promise.reject();
                }

                $http.get(_host + 'api/aggregation/production-region' + param, {withCredentials: true}).then(function (res) {
                    $log.debug(res.data);
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        listValuationStatus: function(params) {
            return pagingService.page(_host + 'api/aggregation/report-valuation-summary', params);
        },
        listBenefitAuthorisation: function() {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/report-benefit-authorisation', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        listFinancialResourcePlanStatus: function(params) {
            return pagingService.page(_host + 'api/aggregation/report-frp-summary', params);
        },
        listCrossSelling: function(params) {
            return pagingService.page(_host + 'api/aggregation/report-cross-selling', params);
        },
        searchProductionSchedules: function(query) {
            query = angular.copy(query);

            if (query.horticultureStage) {
                query.horticulturestage = query.horticultureStage;
                delete query['horticultureStage'];
            }
            if (query.regionName) {
                query.regionname = query.regionName;
                delete query['regionName'];
            }
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
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
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/aggregation/distinct-production-schedule-categories', {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('assetApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset', (includeDependencies ? data : underscore.omit(data, ['liabilities', 'productionSchedules'])), {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + data.id, (includeDependencies ? data : underscore.omit(data, ['liabilities', 'productionSchedules'])), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        attachLiability: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/liability', data, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
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
        getPDFPreviewImage: function(key) {
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
sdkApiApp.factory('benefitApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/link', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        unlinkCustomerNumber: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/unlink', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        authoriseCustomerNumber: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/authorise', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        modifyAuthorisedCustomerNumber: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/modify', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deauthoriseCustomerNumber: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/benefit/deauthorise', data, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('comparableApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
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
        createComparable: function (comparable) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable', comparable, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ data.uuid, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadComparableAttachments: function (uuid, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/' + uuid + '/attach', data, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('dataApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        aggregateAll: function () {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/aggregate-all', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        exportFile: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/export-file', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        importFile: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/import-file', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        validateFile: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/data/validate-file', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['$cookieStore', '$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($cookieStore, $http, pagingService, promiseService, configuration, underscore) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document', underscore.omit(data, ['organization', 'tasks']), {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/send', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        relateDocuments: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/relate', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateDocument: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + data.id, underscore.omit(data, ['organization', 'tasks']), {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getDocumentPdf: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/pdf/get', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        saveDocumentPdf: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/pdf/save', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        mergeDocumentPdfs: function (key, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/pdf/merge?key=' + key, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Enterprise Budget API
 */
sdkApiApp.factory('enterpriseBudgetApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getEnterpriseBudgets: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/budgets' + (id ? '?sublayer=' + id : ''), page);
        },
        getAveragedBudgets: function(query) {
            query = underscore.chain(query)
                .defaults({
                    resulttype: 'simple'
                })
                .map(function (value, key) {
                    return key + '=' + encodeURIComponent(value);
                })
                .value().join('&');

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budgets/averaged' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchEnterpriseBudgets: function (query) {
            query = underscore.chain(query)
                .defaults({
                    resulttype: 'simple'
                })
                .map(function (value, key) {
                    return key + '=' + encodeURIComponent(value);
                })
                .value().join('&');

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budgets/search' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createEnterpriseBudget: function (budgetData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget', budgetData, {withCredentials: true}).then(function (res) {
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
        getEnterpriseBudgetPublishers: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budget/publishers', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEnterpriseBudgetRegions: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/budget/regions', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateEnterpriseBudget: function (budgetData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + budgetData.id, budgetData, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/budget/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        favoriteEnterpriseBudget: function(id) {
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
sdkApiApp.factory('expenseApi', ['$http', '$log', 'pagingService', 'promiseService', 'configuration', function($http, $log, pagingService, promiseService, configuration) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/expense/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farm API
 */
sdkApiApp.factory('farmApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarms: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farms' + (id ? '/' + id : ''), params);
        },
        createFarm: function (farmData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm', farmData, {withCredentials: true}).then(function (res) {
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
        updateFarm: function (farmData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('farmerApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer', (includeDependencies ? data : underscore.omit(data, ['farms', 'financials', 'legalEntities'])), {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + data.id, (includeDependencies ? data : underscore.omit(data, ['farms', 'financials', 'legalEntities'])), {withCredentials: true}).then(function (res) {
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
        hasOutstandingRequest: function(ids) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmers/with-open-request?ids=' + ids, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAssignedMerchant: function(id) {
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
        getFarmlandValue: function(id, query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmland-value/' + id + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmlandValues: function(query) {
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
sdkApiApp.factory('financialApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/financial', data, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/financial/' + data.id, data, {withCredentials: true}).then(function (res) {
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
 * Layers API
 */
sdkApiApp.factory('layerApi', ['$http', '$log', 'pagingService', 'promiseService', 'configuration', function ($http, $log, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
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
        getLayerTypes: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/layer/types', {withCredentials: true}).then(function (res) {
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
        createSublayer: function (sublayer) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/sublayer', sublayer, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateSublayer: function(sublayer) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/sublayer/' + sublayer.id, sublayer, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Legal Entity API
 */
sdkApiApp.factory('legalEntityApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + data.id, (includeDependencies ? data : underscore.omit(data, ['assets'])), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadEntityAttachments: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity', (includeDependencies ? data : underscore.omit(data, ['assets'])), {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/liability', data, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('liabilityApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        updateLiability: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/liability/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Map Theme API
 */
sdkApiApp.factory('mapThemeApi', ['$http', 'promiseService', 'configuration', 'underscore', function ($http, promiseService, configuration, underscore) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/map-theme', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMapTheme: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/map-theme/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Merchant API
 */
sdkApiApp.factory('merchantApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant', data, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/register/merchant', data, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadMerchantAttachments: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('notificationApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getNotifications: function (params) {
            return pagingService.page(_host + 'api/notifications', params);
        },
        createNotification: function (notificationData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification', notificationData, {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification/' + id + '/reject', data, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('organizationalUnitApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        createOrganizationalUnit: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/organizational-unit' + (data.type ? '/' + data.type.toLowerCase() : ''), data, {withCredentials: true}).then(function (res) {
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
        getOrganizationalUnit: function(id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/organizational-unit/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateOrganizationalUnit: function(data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/organizational-unit/' + data.id, underscore.omit(data, ['organization', 'users']), {withCredentials: true}).then(function (res) {
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
 * PIP Geo API
 */
sdkApiApp.factory('pipGeoApi', ['$http', 'promiseService', 'configuration', 'underscore', function ($http, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getFieldPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/field-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPortionPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/portion-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchPortions: function (query) {
            query = underscore.chain(query)
                .omit(function (value) {
                    return (value == null || value == '');
                })
                .map(function (value, key) {
                    return key + '=' + encodeURIComponent(value);
                })
                .value().join('&');

            return promiseService.wrap(function (promise) {
                if (!query) {
                    promise.reject();
                }
                $http.get(_host + 'api/geo/portion-polygons?' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDistrictPolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/district-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getProvincePolygon: function (lng, lat) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/province-polygon?x=' + lng + '&y=' + lat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);

/**
 * Market Assumptions API
 */
sdkApiApp.factory('productDemandApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getProductDemandAssumptions: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/demand-assumptions' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMapData: function(options) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumptions/map-data', options, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        addAssumptionGroup: function(data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumption', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateProductDemandAssumption: function(id, data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumption/' + id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteProductDemandAssumption: function(data) {
            // data takes the form { id: 5, year: "2014"}, where either an id OR a year is given to specify which records to delete
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/demand-assumption/delete', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Production Schedule API
 */
sdkApiApp.factory('productionScheduleApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getProductionSchedules: function (id) {
            return pagingService.page(_host + 'api/production-schedules' + (id ? '/' + id : ''));
        },
        createProductionSchedule: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/production-schedule', underscore.omit(data, ['asset', 'budget', 'organization']), {withCredentials: true}).then(function (res) {
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
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/production-schedule/' + data.id, underscore.omit(data, ['asset', 'budget', 'organization']), {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('roleApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
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
        updateRoleApps: function (roleList) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/role-apps', roleList, {withCredentials: true}).then(function (res) {
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
        getServiceTypes: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/service/types', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
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
sdkApiApp.factory('taskApi', ['$http', 'pagingService', 'promiseService', 'configuration', 'underscore', function ($http, pagingService, promiseService, configuration, underscore) {
    var _host = configuration.getServer();

    return {
        getTasks: function (params) {
            return pagingService.page(_host + 'api/tasks', params);
        },
        getManagerTasks: function (params) {
            return pagingService.page(_host + 'api/tasks/manager', params);
        },
        createTask: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task', underscore.omit(data, ['document', 'organization', 'subtasks']), {withCredentials: true}).then(function (res) {
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
        sendTask: function (id, requestData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTask: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + data.id, underscore.omit(data, ['document', 'organization', 'subtasks']), {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('teamApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTeams: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/teams', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createTeam: function (teamData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team', teamData, {withCredentials: true}).then(function (res) {
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
        updateTeam: function (teamData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team/' + teamData.id, teamData, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('userApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
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
        createUser: function (userData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user', userData, {withCredentials: true}).then(function (res) {
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
        updateUser: function (userData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + userData.id, userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUserGroups: function (userData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + userData.id + '/groups', userData, {withCredentials: true}).then(function (res) {
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
sdkApiApp.factory('workloadApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        updateWorkload: function (workload) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/workload/' + workload.id, workload, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);
