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
        getSubRegionBoundaries: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/guideline-subregions?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
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

    return {
        createComparable: function (comparable) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable', comparable, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchComparables: function (query) {
            query = underscore.chain(query)
                .defaults({
                    resulttype: 'simple'
                })
                .map(function (value, key) {
                    return key + '=' + encodeURIComponent(value);
                })
                .value().join('&');

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/comparables/search' + (query && query.length > 0 ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getComparable: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/comparable/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateComparable: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        useComparable: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ id + '/use', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteComparable: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/comparable/'+ id + '/delete', {withCredentials: true}).then(function (res) {
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

            return pagingService.page(_host + 'api/budgets' + (id ? '?subregion=' + id : ''), page);
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
 * Production Region API
 */
sdkApiApp.factory('productionRegionApi', ['$http', '$log', 'pagingService', 'promiseService', 'configuration', function($http, $log, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getProductionRegions: function (params) {
            return pagingService.page(_host + 'api/subregions', params);
        },
        getProductionRegion: function(subregionId) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/subregion/' + subregionId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getProductionRegionsByRegion: function (regionId) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/subregions/' + regionId, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createProductionRegion: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/subregion', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateProductionRegion: function(region) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/subregion/' + region.id, region, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getParentRegions: function (params) {
            return pagingService.page(_host + 'api/regions', params);
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
 * SubRegion API
 */
sdkApiApp.factory('subRegionApi', ['$http', '$log', 'pagingService', 'promiseService', 'configuration', function($http, $log, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getSubRegions: function (params) {
            return pagingService.page(_host + 'api/guidelines/subregions', params);
        },
        getSubRegion: function(subregionId, versionId) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/guidelines/' + subregionId + (versionId ? '?versionId=' + versionId : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
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

    var _lastError = undefined;

    var _tokens;

    // Intercept any HTTP responses that are not authorized
    $httpProvider.interceptors.push(['$injector', '$rootScope', 'localStore', 'promiseService', function ($injector, $rootScope, localStore, promiseService) {
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
                    return config;
                }

                if (_tokens && _tokens.refresh_token) {
                    if (_requestQueue.length == 0) {
                        var $auth = $injector.get('$auth'),
                            authorizationApi = $injector.get('authorizationApi');

                        authorizationApi.refresh(_tokens.refresh_token).then(function (res) {
                            if (res) {
                                $auth.setToken(res.token);
                                localStore.setItem('tokens', res);
                                _tokens = res;
                            }

                            resolveQueue(res && res.token);
                        }, function () {
                            resolveQueue();
                        });
                    }

                    return queueRequest(config);
                }

                return config;
            },
            responseError: function (err) {
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
    }];

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        setPreAuthenticate: function (fn) {
            _preAuthenticate = fn;
        },

        $get: ['$auth', '$injector', '$rootScope', '$timeout', 'authorizationApi', 'localStore', 'promiseService',
            function ($auth, $injector, $rootScope, $timeout, authorizationApi, localStore, promiseService) {
                var _user = _getUser();

                _tokens = localStore.getItem('tokens');

                if (_preAuthenticate instanceof Array) {
                    _preAuthenticate = $injector.invoke(_preAuthenticate);
                }

                authorizationApi.getUser().then(function (res) {
                    _user = _setUser(res);

                    $rootScope.$broadcast('authorization::login', _user);
                }, function () {
                    $rootScope.$broadcast('authorization::unauthorized');
                });

                $rootScope.$on('authorization::unauthorized', function () {
                    localStore.removeItem('user');
                    localStore.removeItem('tokens');
                    _tokens = undefined;
                });

                function _getUser() {
                    return localStore.getItem('user') || _defaultUser;
                }

                function _setUser(user) {
                    user = user || _defaultUser;

                    if (user.role === undefined) {
                        user.role = (user.accessLevel == 'admin' ? _userRoles.admin : _userRoles.user);
                    }

                    localStore.setItem('user', user);

                    return user;
                }

                function _postAuthenticateSuccess (res) {
                    if (res && res.data) {
                        $auth.setToken(res.data.token);
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

                return {
                    userRole: _userRoles,
                    accessLevel: _accessLevels,
                    lastError: function () {
                        return _lastError;
                    },
                    currentUser: function () {
                        return _user;
                    },
                    getAuthenticationResponse: function () {
                        return _tokens;
                    },

                    isAllowed: function (level) {
                        return (level & _user.role) != 0;
                    },
                    isLoggedIn: function () {
                        return (_accessLevels.user & _user.role) != 0;
                    },
                    login: function (email, password) {
                        var credentials = {
                            email: email,
                            password: password
                        };

                        return promiseService.wrap(function (promise) {
                            return _preAuthenticate(credentials)
                                .then(function () {
                                    return $auth.login(credentials);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });
                    },
                    authenticate: function (name, data) {
                        return promiseService.wrap(function (promise) {
                            return _preAuthenticate(data)
                                .then(function () {
                                    return $auth.authenticate(name, data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });
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
                        return promiseService.wrap(function (promise) {
                            return _preAuthenticate(data)
                                .then(function () {
                                    return $auth.signup(data);
                                }, promiseService.throwError)
                                .then(_postAuthenticateSuccess, promiseService.throwError)
                                .then(_postGetUserSuccess(promise), _postError(promise));
                        });
                    },
                    logout: function () {
                        return authorizationApi.logout().then(function () {
                            $auth.logout();
                            localStore.removeItem('user');
                            localStore.removeItem('tokens');
                            _tokens = undefined;

                            $rootScope.$broadcast('authorization::logout');
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
        getServer: _getServer,
        useHost: function(host, version, cCallback) {
            if (typeof version === 'function') {
                cCallback = version;
                version = '';
            }

            _version = version || '';

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
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    };

    return function() {
        return GenerateUUID();
    };
});

var sdkLibraryApp = angular.module('ag.sdk.library', []);

/**
 * This module includes other required third party libraries
 */
sdkLibraryApp.constant('underscore', window._);

sdkLibraryApp.constant('moment', window.moment);

sdkLibraryApp.constant('geojsonUtils', window.gju);

sdkLibraryApp.constant('naturalSort', window.naturalSort);

var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

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

var skdUtilitiesApp = angular.module('ag.sdk.utilities', ['ngCookies', 'ag.sdk.id']);

skdUtilitiesApp.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function (fn) {
        if ($rootScope.$$phase) {
            fn();
        } else {
            $rootScope.$apply(fn);
        }
    };
}]);

skdUtilitiesApp.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
});

skdUtilitiesApp.factory('dataMapService', [function() {
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

skdUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', 'generateUUID', 'underscore', function($rootScope, $http, promiseService, dataMapService, generateUUID, underscore) {
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
                        params: underscore.omit(params, 'resulttype'),
                        withCredentials: true
                    } : {
                        method: 'GET',
                        url: endPoint,
                        params: params,
                        withCredentials: true
                    });

                    $http(httpRequest).then(_handleResponse, promise.reject);
                }
            });
        }
    };
}]);

skdUtilitiesApp.factory('promiseService', ['$q', 'safeApply', function ($q, safeApply) {
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
        all: function (promises) {
            return $q.all(promises);
        },
        chain: function (action) {
            return _chainAll(action, []);
        },
        wrap: function(action) {
            var deferred = _defer();

            action(deferred);

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
        reject: function (obj) {
            return $q.reject(obj);
        },
        throwError: function (err) {
            throw err;
        },
        defer: _defer
    }
}]);

skdUtilitiesApp.factory('localStore', ['$cookieStore', '$window', function ($cookieStore, $window) {
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

skdUtilitiesApp.filter('round', ['$filter', function ($filter) {
    return function (value, precision) {
        precision = precision || 2;

        return Number(Math.round(value + 'e' + precision) + 'e-' + precision);
    };
}]);
var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'attachmentHelper', 'landUseHelper', 'underscore', function($filter, attachmentHelper, landUseHelper, underscore) {
    var _assetTitle = function (asset) {
        if (asset.data) {
            switch (asset.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return (asset.data.plantedArea ? $filter('number')(asset.data.plantedArea, 2) + 'ha' : '') +
                       (asset.data.plantedArea && asset.data.crop ? ' of ' : '') +
                       (asset.data.crop ? asset.data.crop : '') +
                       (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'farmland':
                    return (asset.data.label ? asset.data.label :
                        (asset.data.portionLabel ? asset.data.portionLabel :
                            (asset.data.portionNumber ? 'Ptn. ' + asset.data.portionNumber : 'Rem. extent of farm')));
                case 'improvement':
                    return asset.data.name;
                case 'cropland':
                    return (asset.data.equipped ? 'Irrigated ' + asset.type + ' (' + (asset.data.irrigation ? asset.data.irrigation + ' irrigation from ' : '')
                        + asset.data.waterSource + ')' : (asset.data.irrigated ? 'Irrigable, unequipped ' : 'Non irrigable ') + asset.type)
                        + (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'livestock':
                    return asset.data.type + (asset.data.category ? ' - ' + asset.data.category : '');
                case 'pasture':
                    return (asset.data.intensified ? (asset.data.crop || 'Intensified pasture') : 'Natural grazing') +
                        (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
                case 'vme':
                    return asset.data.category + (asset.data.model ? ' model ' + asset.data.model : '');
                case 'wasteland':
                    return 'Wasteland';
                case 'water source':
                case 'water right':
                    return asset.data.waterSource + (asset.data.fieldName ? ' on field ' + asset.data.fieldName : '');
            }
        }

        return _assetTypes[type];
    };

    var _listServiceMap = function(item, metadata) {
        var map = {
            id: item.id || item.$id,
            type: item.type,
            updatedAt: item.updatedAt
        };

        if (item.data) {
            if (item.type == 'crop') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.season ? item.data.season : '');
                map.groupby = item.farmId;
            } else if (item.type == 'farmland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.area !== undefined ? 'Area: ' + $filter('number')(item.data.area, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = _assetTitle(item);
                // Might want to edit this further so that title and subtitle are not identical in most cases
                map.subtitle = item.data.type + (item.data.category ? ' - ' + item.data.category : '');
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'cropland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'livestock') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.breed ? item.data.breed + ' for ' : 'For ') + item.data.purpose;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'pasture') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'permanent crop') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'plantation') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'vme') {
                map.title = _assetTitle(item);
                map.subtitle = 'Quantity: ' + item.data.quantity;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'wasteland') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Area: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            } else if (item.type == 'water right') {
                map.title = _assetTitle(item);
                map.subtitle = (item.data.size !== undefined ? 'Irrigatable Extent: ' + $filter('number')(item.data.size, 2) + 'ha' : 'Unknown area');
                map.groupby = item.farmId;
            }

            map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/camera.png');
        }

        if (metadata) {
            map = underscore.extend(map, metadata);
        }

        return map;
    };

    var _assetTypes = {
        'crop': 'Crops',
        'farmland': 'Farmlands',
        'improvement': 'Fixed Improvements',
        'cropland': 'Cropland',
        'livestock': 'Livestock',
        'pasture': 'Pastures',
        'permanent crop': 'Permanent Crops',
        'plantation': 'Plantations',
        'vme': 'Vehicles, Machinery & Equipment',
        'wasteland': 'Wasteland',
        'water right': 'Water Rights'
    };

    var _assetSubtypes = {
        'improvement': ['Livestock & Game', 'Crop Cultivation & Processing', 'Residential', 'Business','Equipment & Utilities','Infrastructure','Recreational & Misc.'],
        'livestock': ['Cattle', 'Sheep', 'Pigs', 'Chickens', 'Ostriches', 'Goats'],
        'vme': ['Vehicles', 'Machinery', 'Equipment']
    };

    var _assetCategories = {
        improvement: [
            { category: "Airport", subCategory: "Hangar" },
            { category: "Airport", subCategory: "Helipad" },
            { category: "Airport", subCategory: "Runway" },
            { category: "Poultry", subCategory: "Hatchery" },
            { category: "Aquaculture", subCategory: "Pond" },
            { category: "Aquaculture", subCategory: "Net House" },
            { category: "Aviary" },
            { category: "Beekeeping" },
            { category: "Borehole" },
            { category: "Borehole", subCategory: "Equipped" },
            { category: "Borehole", subCategory: "Pump" },
            { category: "Borehole", subCategory: "Windmill" },
            { category: "Poultry", subCategory: "Broiler House" },
            { category: "Poultry", subCategory: "Broiler House - Atmosphere" },
            { category: "Poultry", subCategory: "Broiler House - Semi" },
            { category: "Poultry", subCategory: "Broiler House - Zinc" },
            { category: "Building", subCategory: "Administrative" },
            { category: "Building" },
            { category: "Building", subCategory: "Commercial" },
            { category: "Building", subCategory: "Entrance" },
            { category: "Building", subCategory: "Lean-to" },
            { category: "Building", subCategory: "Outbuilding" },
            { category: "Building", subCategory: "Gate" },
            { category: "Cold Storage" },
            { category: "Commercial", subCategory: "Coffee Shop" },
            { category: "Commercial", subCategory: "Sales Facility" },
            { category: "Commercial", subCategory: "Shop" },
            { category: "Commercial", subCategory: "Bar" },
            { category: "Commercial", subCategory: "Café" },
            { category: "Commercial", subCategory: "Restaurant" },
            { category: "Commercial", subCategory: "Factory" },
            { category: "Commercial", subCategory: "Tasting Facility" },
            { category: "Commercial", subCategory: "Cloth House" },
            { category: "Compost", subCategory: "Preparing Unit" },
            { category: "Crocodile Dam" },
            { category: "Crop Processing", subCategory: "Degreening Room" },
            { category: "Crop Processing", subCategory: "Dehusking Facility" },
            { category: "Crop Processing", subCategory: "Drying Facility" },
            { category: "Crop Processing", subCategory: "Drying Tunnels" },
            { category: "Crop Processing", subCategory: "Sorting Facility" },
            { category: "Crop Processing", subCategory: "Drying Oven" },
            { category: "Crop Processing", subCategory: "Drying Racks" },
            { category: "Crop Processing", subCategory: "Crushing Plant" },
            { category: "Crop Processing", subCategory: "Nut Cracking Facility" },
            { category: "Crop Processing", subCategory: "Nut Factory" },
            { category: "Dairy" },
            { category: "Dairy", subCategory: "Pasteurising Facility" },
            { category: "Dairy", subCategory: "Milking Parlour" },
            { category: "Dam" },
            { category: "Dam", subCategory: "Filter" },
            { category: "Dam", subCategory: "Trout" },
            { category: "Domestic", subCategory: "Chicken Coop" },
            { category: "Domestic", subCategory: "Chicken Run" },
            { category: "Domestic", subCategory: "Kennels" },
            { category: "Domestic", subCategory: "Gardening Facility" },
            { category: "Education", subCategory: "Conference Room" },
            { category: "Education", subCategory: "Classroom" },
            { category: "Education", subCategory: "Crèche" },
            { category: "Education", subCategory: "School" },
            { category: "Education", subCategory: "Training Facility" },
            { category: "Equipment", subCategory: "Air Conditioner" },
            { category: "Equipment", subCategory: "Gantry" },
            { category: "Equipment", subCategory: "Oven" },
            { category: "Equipment", subCategory: "Pump" },
            { category: "Equipment", subCategory: "Pumphouse" },
            { category: "Equipment", subCategory: "Scale" },
            { category: "Feed Mill" },
            { category: "Feedlot" },
            { category: "Fencing" },
            { category: "Fencing", subCategory: "Electric" },
            { category: "Fencing", subCategory: "Game" },
            { category: "Fencing", subCategory: "Perimeter" },
            { category: "Fencing", subCategory: "Security" },
            { category: "Fencing", subCategory: "Wire" },
            { category: "Fuel", subCategory: "Tanks" },
            { category: "Fuel", subCategory: "Tank Stand" },
            { category: "Fuel", subCategory: "Fuelling Facility" },
            { category: "Grain Mill" },
            { category: "Greenhouse" },
            { category: "Infrastructure" },
            { category: "Irrigation", subCategory: "Sprinklers" },
            { category: "Irrigation" },
            { category: "Laboratory" },
            { category: "Livestock Handling", subCategory: "Auction Facility" },
            { category: "Livestock Handling", subCategory: "Cages" },
            { category: "Livestock Handling", subCategory: "Growing House" },
            { category: "Livestock Handling", subCategory: "Pens" },
            { category: "Livestock Handling", subCategory: "Shelter" },
            { category: "Livestock Handling", subCategory: "Breeding Facility" },
            { category: "Livestock Handling", subCategory: "Culling Shed" },
            { category: "Livestock Handling", subCategory: "Dipping Facility" },
            { category: "Livestock Handling", subCategory: "Elephant Enclosures" },
            { category: "Livestock Handling", subCategory: "Feed Troughs/Dispensers" },
            { category: "Livestock Handling", subCategory: "Horse Walker" },
            { category: "Livestock Handling", subCategory: "Maternity Shelter/Pen" },
            { category: "Livestock Handling", subCategory: "Quarantine Area" },
            { category: "Livestock Handling", subCategory: "Rehab Facility" },
            { category: "Livestock Handling", subCategory: "Shearing Facility" },
            { category: "Livestock Handling", subCategory: "Stable" },
            { category: "Livestock Handling", subCategory: "Surgery" },
            { category: "Livestock Handling", subCategory: "Treatment Area" },
            { category: "Livestock Handling", subCategory: "Weaner House" },
            { category: "Livestock Handling", subCategory: "Grading Facility" },
            { category: "Livestock Handling", subCategory: "Inspection Facility" },
            { category: "Logistics", subCategory: "Handling Equipment" },
            { category: "Logistics", subCategory: "Handling Facility" },
            { category: "Logistics", subCategory: "Depot" },
            { category: "Logistics", subCategory: "Loading Area" },
            { category: "Logistics", subCategory: "Loading Shed" },
            { category: "Logistics", subCategory: "Hopper" },
            { category: "Logistics", subCategory: "Weigh Bridge" },
            { category: "Meat Processing", subCategory: "Abattoir" },
            { category: "Meat Processing", subCategory: "Deboning Room" },
            { category: "Meat Processing", subCategory: "Skinning Facility" },
            { category: "Mill" },
            { category: "Mushrooms", subCategory: "Cultivation" },
            { category: "Mushrooms", subCategory: "Sweat Room" },
            { category: "Nursery ", subCategory: "Plant" },
            { category: "Nursery ", subCategory: "Plant Growing Facility" },
            { category: "Office" },
            { category: "Packaging Facility" },
            { category: "Paddocks", subCategory: "Camp" },
            { category: "Paddocks", subCategory: "Kraal" },
            { category: "Paddocks" },
            { category: "Piggery", subCategory: "Farrowing House" },
            { category: "Piggery", subCategory: "Pig Sty" },
            { category: "Processing", subCategory: "Bottling Facility" },
            { category: "Processing", subCategory: "Flavour Shed" },
            { category: "Processing", subCategory: "Processing Facility" },
            { category: "Recreation", subCategory: "Viewing Area" },
            { category: "Recreation", subCategory: "BBQ" },
            { category: "Recreation", subCategory: "Clubhouse" },
            { category: "Recreation", subCategory: "Event Venue" },
            { category: "Recreation", subCategory: "Gallery" },
            { category: "Recreation", subCategory: "Game Room" },
            { category: "Recreation", subCategory: "Gazebo" },
            { category: "Recreation", subCategory: "Gymnasium" },
            { category: "Recreation", subCategory: "Jacuzzi" },
            { category: "Recreation", subCategory: "Judging Booth" },
            { category: "Recreation", subCategory: "Museum" },
            { category: "Recreation", subCategory: "Play Area" },
            { category: "Recreation", subCategory: "Pool House" },
            { category: "Recreation", subCategory: "Pottery Room" },
            { category: "Recreation", subCategory: "Racing Track" },
            { category: "Recreation", subCategory: "Salon" },
            { category: "Recreation", subCategory: "Sauna" },
            { category: "Recreation", subCategory: "Shooting Range" },
            { category: "Recreation", subCategory: "Spa Facility" },
            { category: "Recreation", subCategory: "Squash Court" },
            { category: "Recreation", subCategory: "Swimming Pool" },
            { category: "Recreation" },
            { category: "Religeous", subCategory: "Church" },
            { category: "Residential", subCategory: "Carport" },
            { category: "Residential", subCategory: "Driveway" },
            { category: "Residential", subCategory: "Flooring" },
            { category: "Residential", subCategory: "Paving" },
            { category: "Residential", subCategory: "Roofing" },
            { category: "Residential", subCategory: "Water Feature" },
            { category: "Residential", subCategory: "Hall" },
            { category: "Residential", subCategory: "Balcony" },
            { category: "Residential", subCategory: "Canopy" },
            { category: "Residential", subCategory: "Concrete Surface" },
            { category: "Residential", subCategory: "Courtyard" },
            { category: "Residential", subCategory: "Covered" },
            { category: "Residential", subCategory: "Deck" },
            { category: "Residential", subCategory: "Mezzanine" },
            { category: "Residential", subCategory: "Parking Area" },
            { category: "Residential", subCategory: "Patio" },
            { category: "Residential", subCategory: "Porch" },
            { category: "Residential", subCategory: "Porte Cochere" },
            { category: "Residential", subCategory: "Terrace" },
            { category: "Residential", subCategory: "Veranda" },
            { category: "Residential", subCategory: "Walkways" },
            { category: "Residential", subCategory: "Rondavel" },
            { category: "Residential", subCategory: "Accommodation Units" },
            { category: "Residential", subCategory: "Boma" },
            { category: "Residential", subCategory: "Bungalow" },
            { category: "Residential", subCategory: "Bunker" },
            { category: "Residential", subCategory: "Cabin" },
            { category: "Residential", subCategory: "Chalet" },
            { category: "Residential", subCategory: "Community Centre" },
            { category: "Residential", subCategory: "Dormitory" },
            { category: "Residential", subCategory: "Dwelling" },
            { category: "Residential", subCategory: "Flat" },
            { category: "Residential", subCategory: "Kitchen" },
            { category: "Residential", subCategory: "Lapa" },
            { category: "Residential", subCategory: "Laundry Facility" },
            { category: "Residential", subCategory: "Locker Room" },
            { category: "Residential", subCategory: "Lodge" },
            { category: "Residential", subCategory: "Shower" },
            { category: "Residential", subCategory: "Toilets" },
            { category: "Residential", subCategory: "Room" },
            { category: "Residential", subCategory: "Cottage" },
            { category: "Residential", subCategory: "Garage" },
            { category: "Roads", subCategory: "Access Roads" },
            { category: "Roads", subCategory: "Gravel" },
            { category: "Roads", subCategory: "Tarred" },
            { category: "Security", subCategory: "Control Room" },
            { category: "Security", subCategory: "Guardhouse" },
            { category: "Security", subCategory: "Office" },
            { category: "Shade Nets" },
            { category: "Silo" },
            { category: "Sports", subCategory: "Arena" },
            { category: "Sports", subCategory: "Tennis Court" },
            { category: "Staff", subCategory: "Hostel" },
            { category: "Staff", subCategory: "Hut" },
            { category: "Staff", subCategory: "Retirement Centre" },
            { category: "Staff", subCategory: "Staff Building" },
            { category: "Staff", subCategory: "Canteen" },
            { category: "Staff", subCategory: "Dining Facility" },
            { category: "Storage", subCategory: "Truck Shelter" },
            { category: "Storage", subCategory: "Barn" },
            { category: "Storage", subCategory: "Dark Room" },
            { category: "Storage", subCategory: "Bin Compartments" },
            { category: "Storage", subCategory: "Machinery" },
            { category: "Storage", subCategory: "Saddle Room" },
            { category: "Storage", subCategory: "Shed" },
            { category: "Storage", subCategory: "Chemicals" },
            { category: "Storage", subCategory: "Tools" },
            { category: "Storage", subCategory: "Dry" },
            { category: "Storage", subCategory: "Equipment" },
            { category: "Storage", subCategory: "Feed" },
            { category: "Storage", subCategory: "Fertilizer" },
            { category: "Storage", subCategory: "Fuel" },
            { category: "Storage", subCategory: "Grain" },
            { category: "Storage", subCategory: "Hides" },
            { category: "Storage", subCategory: "Oil" },
            { category: "Storage", subCategory: "Pesticide" },
            { category: "Storage", subCategory: "Poison" },
            { category: "Storage", subCategory: "Seed" },
            { category: "Storage", subCategory: "Zinc" },
            { category: "Storage", subCategory: "Sulphur" },
            { category: "Storage" },
            { category: "Storage", subCategory: "Vitamin Room" },
            { category: "Sugar Mill" },
            { category: "Tanks", subCategory: "Water" },
            { category: "Timber Mill" },
            { category: "Trench" },
            { category: "Utilities", subCategory: "Battery Room" },
            { category: "Utilities", subCategory: "Boiler Room" },
            { category: "Utilities", subCategory: "Compressor Room" },
            { category: "Utilities", subCategory: "Engine Room" },
            { category: "Utilities", subCategory: "Generator" },
            { category: "Utilities", subCategory: "Power Room" },
            { category: "Utilities", subCategory: "Pumphouse" },
            { category: "Utilities", subCategory: "Transformer Room" },
            { category: "Utilities" },
            { category: "Vacant Area" },
            { category: "Vehicles", subCategory: "Transport Depot" },
            { category: "Vehicles", subCategory: "Truck Wash" },
            { category: "Vehicles", subCategory: "Workshop" },
            { category: "Walls" },
            { category: "Walls", subCategory: "Boundary" },
            { category: "Walls", subCategory: "Retaining" },
            { category: "Walls", subCategory: "Security" },
            { category: "Warehouse" },
            { category: "Water", subCategory: "Reservoir" },
            { category: "Water", subCategory: "Tower" },
            { category: "Water", subCategory: "Purification Plant" },
            { category: "Water", subCategory: "Reticulation Works" },
            { category: "Water", subCategory: "Filter Station" },
            { category: "Wine Cellar", subCategory: "Tanks" },
            { category: "Wine Cellar" },
            { category: "Wine Cellar", subCategory: "Winery" },
            { category: "Wine Cellar", subCategory: "Barrel Maturation Room" }
        ],
        livestock: [
            { category: "Cattle", subCategory: "Phase A Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Phase B Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Phase C Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Phase D Bulls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Heifers", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Bull Calves", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Heifer Calves", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Tollies 1-2", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Heifers 1-2", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Culls", purpose: "Breeding" },
            { category: "Cattle", subCategory: "Bulls", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Dry Cows", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Lactating Cows", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Heifers", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Calves", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Culls", purpose: "Dairy" },
            { category: "Cattle", subCategory: "Bulls", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Cows", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Heifers", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Weaners", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Calves", purpose: "Slaughter" },
            { category: "Cattle", subCategory: "Culls", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Rams", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Young Rams", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Ewes", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Young Ewes", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Lambs", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Wethers", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Culls", purpose: "Breeding" },
            { category: "Sheep", subCategory: "Rams", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Ewes", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Lambs", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Wethers", purpose: "Slaughter" },
            { category: "Sheep", subCategory: "Culls", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Boars", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Breeding Sows", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Weaned pigs", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Piglets", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Porkers", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Baconers", purpose: "Slaughter" },
            { category: "Pigs", subCategory: "Culls", purpose: "Slaughter" },
            { category: "Chickens", subCategory: "Day Old Chicks", purpose: "Broilers" },
            { category: "Chickens", subCategory: "Broilers", purpose: "Broilers" },
            { category: "Chickens", subCategory: "Hens", purpose: "Layers" },
            { category: "Chickens", subCategory: "Point of Laying Hens", purpose: "Layers" },
            { category: "Chickens", subCategory: "Culls", purpose: "Layers" },
            { category: "Ostriches", subCategory: "Breeding Stock", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Slaughter Birds > 3 months", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Slaughter Birds < 3 months", purpose: "Slaughter" },
            { category: "Ostriches", subCategory: "Chicks", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Rams", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Breeding Ewes", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Young Ewes", purpose: "Slaughter" },
            { category: "Goats", subCategory: "Kids", purpose: "Slaughter" }
        ],
        vme: [
            { category: "Vehicles", subCategory: "Bakkie" },
            { category: "Vehicles", subCategory: "Car" },
            { category: "Vehicles", subCategory: "Truck" },
            { category: "Vehicles", subCategory: "Tractor" },
            { category: "Machinery", subCategory: "Mower" },
            { category: "Machinery", subCategory: "Mower Conditioner" },
            { category: "Machinery", subCategory: "Hay Rake" },
            { category: "Machinery", subCategory: "Hay Baler" },
            { category: "Machinery", subCategory: "Harvester" },
            { category: "Equipment", subCategory: "Plough" },
            { category: "Equipment", subCategory: "Harrow" },
            { category: "Equipment", subCategory: "Ridgers" },
            { category: "Equipment", subCategory: "Rotovator" },
            { category: "Equipment", subCategory: "Cultivator" },
            { category: "Equipment", subCategory: "Planter" },
            { category: "Equipment", subCategory: "Combine" },
            { category: "Equipment", subCategory: "Spreader" },
            { category: "Equipment", subCategory: "Sprayer" },
            { category: "Equipment", subCategory: "Mixer" },
        ]
    };

    var _conditionTypes = ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor'];

    var _assetPurposes = {
        livestock: {
            Cattle: ['Breeding', 'Dairy', 'Slaughter'],
            Sheep: ['Breeding', 'Slaughter'],
            Pigs: ['Slaughter'],
            Chickens: ['Broilers', 'Layers'],
            Ostriches:['Slaughter'],
            Goats: ['Slaughter']
        }
    };

    var _seasonTypes = ['Cape', 'Summer', 'Fruit', 'Winter'];

    var _assetLandUse = {
        'crop': ['Cropland'],
        'farmland': [],
        'improvement': [],
        'cropland': ['Cropland', 'Irrigated Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'pasture': ['Grazing', 'Planted Pastures', 'Conservation'],
        'permanent crop': ['Horticulture (Perennial)'],
        'plantation': ['Plantation'],
        'vme': [],
        'wasteland': ['Grazing', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland'],
        'water right': ['Water Right']
    };

    var _grazingCropTypes = ['Bahia-Notatum', 'Birdsfoot Trefoil', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Phalaris', 'Rescue', 'Rhodes', 'Russian Grass', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium', 'Smuts Finger', 'Soutbos', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'];

    var _landUseCropTypes = {
        'Cropland': [
          'Barley',
          'Bean',
          'Bean (Broad)',
          'Bean (Dry)',
          'Bean (Sugar)',
          'Bean (Green)',
          'Bean (Kidney)',
          'Canola',
          'Cassava',
          'Cotton',
          'Cowpea',
          'Grain Sorghum',
          'Groundnut',
          'Lucerne',
          'Maize',
          'Maize (White)',
          'Maize (Yellow)',
          'Oat',
          'Peanut',
          'Pearl Millet',
          'Potato',
          'Rape',
          'Rice',
          'Rye',
          'Soya Bean',
          'Sunflower',
          'Sweet Corn',
          'Sweet Potato',
          'Tobacco',
          'Triticale',
          'Wheat',
          'Wheat (Durum)'
        ],
        'Grazing': _grazingCropTypes,
        'Horticulture (Perennial)': [
          'Almond',
          'Aloe',
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
          'Cloudberry',
          'Coconut',
          'Coffee',
          'Fig',
          'Gooseberry',
          'Grape',
          'Grape (Bush Vine)',
          'Grape (Red)',
          'Grape (Table)',
          'Grape (White)',
          'Grapefruit',
          'Guava',
          'Hops',
          'Kiwi Fruit',
          'Lemon',
          'Litchi',
          'Macadamia Nut',
          'Mandarin',
          'Mango',
          'Nectarine',
          'Olive',
          'Orange',
          'Papaya',
          'Peach',
          'Pear',
          'Prickly Pear',
          'Pecan Nut',
          'Persimmon',
          'Pineapple',
          'Pistachio Nut',
          'Plum',
          'Pomegranate',
          'Protea',
          'Raspberry',
          'Rooibos',
          'Sisal',
          'Strawberry',
          'Sugarcane',
          'Tea',
          'Walnut',
          'Wineberry'
        ],
        'Horticulture (Seasonal)': [
          'Asparagus',
          'Beet',
          'Beetroot',
          'Blackberry',
          'Borecole',
          'Brinjal',
          'Broccoli',
          'Brussel Sprout',
          'Cabbage',
          'Cabbage (Chinese)',
          'Cabbage (Savoy)',
          'Cactus Pear',
          'Carrot',
          'Cauliflower',
          'Celery',
          'Chicory',
          'Chili',
          'Cucumber',
          'Cucurbit',
          'Garlic',
          'Ginger',
          'Granadilla',
          'Kale',
          'Kohlrabi',
          'Leek',
          'Lentil',
          'Lespedeza',
          'Lettuce',
          'Makataan',
          'Mustard',
          'Mustard (White)',
          'Onion',
          'Paprika',
          'Parsley',
          'Parsnip',
          'Pea',
          'Pea (Dry)',
          'Pepper',
          'Pumpkin',
          'Quince',
          'Radish',
          'Squash',
          'Strawberry',
          'Swede',
          'Sweet Melon',
          'Swiss Chard',
          'Tea',
          'Tomato',
          'Turnip',
          'Vetch (Common)',
          'Vetch (Hairy)',
          'Watermelon',
          'Youngberry'
        ],
        'Plantation': [
          'Bluegum',
          'Pine',
          'Wattle'],
        'Planted Pastures': _grazingCropTypes
    };

    var _liabilityFrequencies = {
        'bi-monthly': 'Bi-Monthly',
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'bi-yearly': 'Bi-Yearly',
        'yearly': 'Yearly'
    };

    var _liabilityTypes = {
        'rent': 'Rented',
        'short-term': 'Short Term Loan',
        'medium-term': 'Medium Term Loan',
        'long-term': 'Long Term Loan'
    };

    return {
        assetTypes: function() {
            return _assetTypes;
        },
        seasonTypes: function () {
            return _seasonTypes;
        },
        listServiceMap: function () {
            return _listServiceMap;
        },
        getAssetClass: function (type) {
            return _assetTypes[type];
        },
        getAssetTitle: function (asset) {
            return _assetTitle(asset);
        },
        getAssetLandUse: function (type) {
            return _assetLandUse[type];
        },
        getAssetSubtypes: function(type) {
            return _assetSubtypes[type] || [];
        },
        getAssetCategories: function(type, subtype) {
            return (_assetCategories[type] ? (subtype ? (_assetCategories[type][subtype] || []) : _assetCategories[type] ) : []);
        },
        getCategoryLabel: function(categoryObject) {
            if (!(categoryObject && categoryObject.category)) {
                return '';
            }
            return categoryObject.category + (categoryObject.subCategory ? ' (' + categoryObject.subCategory + (categoryObject.purpose ? ', ' + categoryObject.purpose : '') + ')'  : '');
        },
        getAssetPurposes: function(type, subtype) {
            return (_assetPurposes[type] ? (_assetPurposes[type][subtype] || []) : []);
        },
        getCropsForLandUse: function (landUse) {
            return _landUseCropTypes[landUse] || [];
        },
        getLiabilityFrequencyTitle: function (frequency) {
            return _liabilityFrequencies[frequency] || '';
        },
        getLiabilityTitle: function (type) {
            return _liabilityTypes[type] || '';
        },
        getZoneTitle: function (zone) {
            return $filter('number')(zone.size, 2) + 'Ha at Stage ' + zone.growthStage + ' (' + zone.cultivar + ')';
        },
        conditionTypes: function () {
            return _conditionTypes;
        },
        isFieldApplicable: function (type, field) {
            return (_assetLandUse[type] && _assetLandUse[type].indexOf(field.landUse) !== -1);
        },
        generateAssetKey: function (asset, legalEntity, farm) {
            asset.assetKey = 'entity.' + legalEntity.uuid +
                (asset.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (asset.type === 'crop' && asset.data.season ? '-s.' + asset.data.season : '') +
                (asset.data.fieldName ? '-fi.' + asset.data.fieldName : '') +
                (asset.data.crop ? '-c.' + asset.data.crop : '') +
                (asset.type === 'cropland' && asset.data.irrigated ? '-i.' + asset.data.irrigation : '') +
                (asset.type === 'farmland' && asset.data.sgKey ? '-' + asset.data.sgKey : '') +
                (asset.type === 'improvement' || asset.type === 'livestock' || asset.type === 'vme' ?
                    (asset.data.type ? '-t.' + asset.data.type : '') +
                    (asset.data.category ? '-c.' + asset.data.category : '') +
                    (asset.data.name ? '-n.' + asset.data.name : '') +
                    (asset.data.purpose ? '-p.' + asset.data.purpose : '') +
                    (asset.data.model ? '-m.' + asset.data.model : '') +
                    (asset.data.identificationNo ? '-in.' + asset.data.identificationNo : '') : '') +
                (asset.data.waterSource ? '-ws.' + asset.data.waterSource : '');
        },
        cleanAssetData: function (asset) {
            if (asset.type == 'vme') {
                asset.data.quantity = (asset.data.identificationNo && asset.data.identificationNo.length > 0 ? 1 : asset.data.quantity);
                asset.data.identificationNo = (asset.data.quantity != 1 ? '' : asset.data.identificationNo);
            } else if (asset.type == 'cropland') {
                asset.data.equipped = (asset.data.irrigated ? asset.data.equipped : false);
            }

            return asset;
        },
        calculateLiability: function (asset) {
            if (asset.data.financing && (asset.data.financing.financed || asset.data.financing.leased)) {
                asset.data.financing.closingBalance = this.calculateLiabilityForMonth(asset, moment().format('YYYY-MM'))
            }

            return asset;
        },
        calculateLiabilityForMonth: function (asset, month) {
            var freq = {
                Monthly: 12,
                'Bi-Monthly': 24,
                Quarterly: 4,
                'Bi-Yearly': 2,
                Yearly: 1
            };

            var financing = asset.data.financing,
                closingBalance = financing.openingBalance || 0;

            var startMonth = moment(financing.paymentStart),
                endMonth = moment(financing.paymentEnd),
                currentMonth = moment(month);

            var installmentsSince = (financing.leased && currentMonth > endMonth ? endMonth : currentMonth)
                    .diff(startMonth, 'months') * ((freq[financing.paymentFrequency] || 1) / 12);

            if (asset.data.financing.financed) {
                for (var i = 0; i <= installmentsSince; i++) {
                    closingBalance -= Math.min(closingBalance, (financing.installment || 0) - ((((financing.interestRate || 0) / 100) / freq[financing.paymentFrequency]) * closingBalance));
                }
            } else if (startMonth <= currentMonth) {
                closingBalance = Math.ceil(installmentsSince) * (financing.installment || 0);
            }

            return closingBalance;
        },
        calculateValuation: function (asset, valuation) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                valuation.assetValue = asset.data.quantity * (valuation.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(valuation.totalStock) == false) {
                valuation.assetValue = valuation.totalStock * (valuation.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(valuation.expectedYield) == false) {
                valuation.assetValue = valuation.expectedYield * (valuation.unitValue || 0);
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                valuation.assetValue = asset.data.size * (valuation.unitValue || 0);
            }

            return valuation;
        },
        generateFarmlandAssetLabels: function(asset, force) {
            var portion = (asset.data ? asset.data : asset);
            
            if (portion && (asset.type == 'farmland' || force)) {
                portion.portionLabel = (portion.portionNumber ?
                    (portion.remainder ? 'Rem. portion ' + portion.portionNumber : 'Ptn. ' + portion.portionNumber) :
                    'Rem. extent');
                portion.farmLabel = (portion.officialFarmName && !_(portion.officialFarmName.toLowerCase()).startsWith('farm') ?
                    _(portion.officialFarmName).titleize() + ' ' : '') + (portion.farmNumber ? portion.farmNumber : '');
                portion.label = portion.portionLabel + (portion.farmLabel && _.words(portion.farmLabel).length > 0 ?
                    " of " + (_.words(portion.farmLabel.toLowerCase())[0] == 'farm' ? _(portion.farmLabel).titleize() :
                    "farm " + _(portion.farmLabel).titleize() ) : 'farm Unknown');
            }
        },
        generateAssetName: function(asset, categoryLabel, currentAssetList) {
            var assetCount = underscore.chain(currentAssetList)
                .where({type: asset.type})
                .reduce(function(currentAssetCount, asset) {
                    if (asset.data.name) {
                        var index = asset.data.name.search(/\s+[0-9]+$/);
                        var name = asset.data.name;
                        var number;
                        if (index != -1) {
                            name = name.substr(0, index);
                            number = parseInt(asset.data.name.substring(index).trim());
                        }
                        if (categoryLabel && name == categoryLabel && (!number || number > currentAssetCount)) {
                            currentAssetCount = number || 1;
                        }
                    }

                    return currentAssetCount;
                }, -1)
                .value();

            asset.data.name = categoryLabel + (assetCount + 1 ? ' ' + (assetCount + 1) : '');
        }
    }
}]);

sdkHelperAssetApp.factory('assetValuationHelper', ['assetHelper', 'underscore', function (assetHelper, underscore) {
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
            var assetLandUse = assetHelper.getAssetLandUse(asset.type);
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
        if (_options.fileResolver instanceof Array) {
            _options.fileResolver = $injector.invoke(_options.fileResolver);
        }

        var _getResizedAttachment = function (attachments, size, defaultImage, type) {
            if ((attachments instanceof Array) == false) {
                attachments = [attachments];
            }

            defaultImage = defaultImage || _options.defaultImage;

            var src = underscore.chain(attachments)
                .filter(function (attachment) {
                    return (type === undefined || attachment.type == type) &&
                        (attachment.sizes && attachment.sizes[size]);
                }).map(function (attachment) {
                    return attachment.sizes[size].src;
                }).last().value();

            return (src ? _options.fileResolver(src) : defaultImage);
        };

        return {
            findSize: function (obj, size, defaultImage, type) {
                return _getResizedAttachment((obj.data && obj.data.attachments ? obj.data.attachments : []), size, defaultImage, type);
            },
            getSize: function (attachments, size, defaultImage, type) {
                return _getResizedAttachment((attachments ? attachments : []), size, defaultImage, type);
            },
            getThumbnail: function (attachments, defaultImage, type) {
                return _getResizedAttachment((attachments ? attachments : []), 'thumb', defaultImage, type);
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

sdkHelperCropInspectionApp.factory('cropInspectionHelper', ['documentHelper', 'underscore', function(documentHelper, underscore) {
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
                    total.yield = (total.weight * total.heads) / ((asset.data.irrigated ? 3000 : 3500) * (zone.plantedInRows ? zone.rowWidth * 3 : 1));
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
                yield: underscore.reduce(zoneYields, function (total, item) {
                    return total + (item.coverage * item.yield);
                }, 0)
            };
        }
    }
}]);

sdkHelperCropInspectionApp.factory('cultivarHelper', ['underscore', function (underscore) {
    var _providerCultivars = {
        'Barley': {
            'Agricol': [
                'Other',
                'SKG 9',
                'SVG 13'
            ],
            'Other': [
                'Clipper',
                'Cocktail',
                'Other',
                'Puma',
                'SabbiErica',
                'SabbiNemesia',
                'SSG 564',
                'SSG 585'
            ]
        },
        'Bean (Dry)': {
            'Capstone': [
                'CAP 2000',
                'CAP 2001',
                'CAP 2008',
                'Other'
            ],
            'Dry Bean Seed Pty (Ltd)': [
                'DBS 310',
                'DBS 360',
                'DBS 830',
                'DBS 840',
                'Kranskop HR1',
                'OPS RS1',
                'OPS RS2',
                'OPS RS4',
                'OPS-KW1',
                'Other',
                'RS 5',
                'RS 6',
                'RS 7'
            ],
            'Pannar': [
                'Other',
                'PAN 116',
                'PAN 123',
                'PAN 128',
                'PAN 135',
                'PAN 139',
                'PAN 146',
                'PAN 148',
                'PAN 148 Plus',
                'PAN 9213',
                'PAN 9216',
                'PAN 9225',
                'PAN 9249',
                'PAN 9280',
                'PAN 9281',
                'PAN 9292',
                'PAN 9298'
            ],
            'Other': [
                'AFG 470',
                'AFG 471',
                'BONUS',
                'CALEDON',
                'CARDINAL',
                'CERRILLOS',
                'DONGARA',
                'DPO 820',
                'JENNY',
                'KAMIESBERG',
                'KOMATI',
                'KRANSKOP',
                'MAJUBA',
                'MASKAM',
                'MINERVA',
                'MKONDENI',
                'MKUZI',
                'Other',
                'RUBY',
                'SC Silk',
                'SC Superior',
                'SEDERBERG',
                'SSB 20',
                'STORMBERG',
                'TEEBUS',
                'TEEBUS-RCR2',
                'TEEBUS-RR1',
                'TYGERBERG',
                'UKULINGA',
                'UMTATA',
                'WERNA'
            ]
        },
        'Canola': {
            'Agricol': [
                'Aga Max',
                'AV Garnet',
                'CB Jardee HT',
                'Cobbler',
                'Other',
                'Tawriffic'
            ],
            'Klein Karoo': [
                'Hyola 61',
                'Other',
                'Rocket CL',
                'Thunder TT',
                'Varola 54'
            ],
            'Other': [
                'Other'
            ]
        },
        'Grain Sorghum': {
            'Agricol': [
                'AVENGER GH',
                'DOMINATOR GM',
                'ENFORCER GM',
                'MAXIMIZER',
                'Other',
                'PREMIUM 4065 T GH',
                'PREMIUM 100',
                'NS 5511 GH',
                'NS 5540',
                'NS 5555',
                'NS 5655 GM',
                'NS 5751',
                'NS 5832',
                'TIGER GM'
            ],
            'Capstone': [
                'CAP 1002',
                'CAP 1003',
                'CAP 1004',
                'Other'
            ],
            'Klein Karoo Saad': [
                'MR 32 GL',
                'MR 43 GL',
                'MR BUSTER GL',
                'MR PACER',
                'Other'
            ],
            'Pannar': [
                'PAN 8625 GH',
                'PAN 8816 GM',
                'PAN 8906 GM',
                'PAN 8909 GM',
                'PAN 8006 T',
                'PAN 8507',
                'PAN 8609',
                'PAN 8648',
                'PAN 8706',
                'PAN 8806',
                'PAN 8901',
                'PAN 8902',
                'PAN 8903',
                'PAN 8904',
                'PAN 8905',
                'PAN 8906',
                'PAN 8907',
                'PAN 8908',
                'PAN 8909',
                'PAN 8911',
                'PAN 8912',
                'PAN 8913',
                'PAN 8914',
                'PAN 8915',
                'PAN 8916',
                'PAN 8918',
                'PAN 8919',
                'PAN 8920',
                'PAN 8921',
                'PAN 8922',
                'PAN 8923',
                'PAN 8924',
                'PAN 8925',
                'PAN 8926',
                'PAN 8927',
                'PAN 8928',
                'PAN 8929',
                'PAN 8930',
                'PAN 8931',
                'PAN 8932',
                'PAN 8933',
                'PAN 8936',
                'PAN 8937',
                'PAN 8938',
                'PAN 8939',
                'PAN 8940',
                'PAN 8966',
                'Other'
            ],
            'Other': [
                'APN 881',
                'MACIA-SA',
                'NK 8830',
                'Other',
                'OVERFLOW',
                'SA 1302-M27',
                'TITAN',
                'X868'
            ]
        },
        'Maize (Yellow)': {
            'Afgri': [
                'AFG 4222 B',
                'AFG 4244',
                'AFG 4270 B',
                'AFG 4410',
                'AFG 4412 B',
                'AFG 4414',
                'AFG 4416 B',
                'AFG 4434 R',
                'AFG 4440',
                'AFG 4448',
                'AFG 4452 B',
                'AFG 4474 R',
                'AFG 4476',
                'AFG 4478 BR',
                'AFG 4512',
                'AFG 4520',
                'AFG 4522 B',
                'AFG 4530',
                'AFG 4540',
                'AFG 4546',
                'AFG 4548',
                'AFG 4566 B',
                'AFG 4572 R',
                'AFG 4660',
                'AFG 4664',
                'DK 618',
                'Other'
            ],
            'Agricol': [
                'IMP 50-90 BR',
                'IMP 51-22 B',
                'IMP 51-92',
                'IMP 51-92 R',
                'Other',
                'QS 7646',
                'SC 602',
                'SC 608'
            ],
            'Capstone Seeds': [
                'CAP 121-30',
                'CAP 122-60',
                'CAP 130-120',
                'CAP 130-140',
                'CAP 444 NG',
                'CAP 766 NG',
                'CAP 9004',
                'CAP 9444 NG',
                'Other'
            ],
            'Dekalb (Monsanto)': [
                'DKC 61-90',
                'DKC 62-80 BR',
                'DKC 62-80 BR GEN',
                'DKC 62-84 R',
                'DKC 64-78 BR',
                'DKC 64-78 BR GEN',
                'DKC 66-32 B',
                'DKC 66-36 R',
                'DKC 66-60 BR',
                'DKC 73-70 B GEN',
                'DKC 73-72',
                'DKC 73-74 BR GEN',
                'DKC 73-76 R',
                'DKC 80-10',
                'DKC 80-12 B GEN',
                'DKC 80-30 R',
                'DKC 80-40 BR GEN',
                'Other'
            ],
            'Delta Seed': [
                'Amber',
                'DE 2004',
                'DE 2006',
                'DE 2016',
                'DE 222',
                'Other'
            ],
            'Klein Karoo Saad': [
                'Helen',
                'KKS 8202',
                'KKS 8204 B',
                'KKS 8400',
                'KKS 8402',
                'Other'
            ],
            'Linksaad': [
                'LS 8518',
                'LS 8524 R',
                'LS 8526',
                'LS 8528 R',
                'LS 8532 B',
                'LS 8536 B',
                'Other'
            ],
            'Pannar': [
                'BG 3268',
                'BG 3292',
                'BG 3492BR',
                'BG 3568R',
                'BG 3592R',
                'BG 3768BR',
                'BG 4296',
                'BG 6308B',
                'Other',
                'PAN 14',
                'PAN 3D-736 BR',
                'PAN 3P-502 R',
                'PAN 3P-730 BR',
                'PAN 3Q-222',
                'PAN 3Q-240',
                'PAN 3Q-740 BR',
                'PAN 3R-644 R',
                'PAN 4P-228',
                'PAN 4P-716 BR',
                'PAN 6126 ',
                'PAN 66',
                'PAN 6616',
                'PAN 6P-110',
                'PAN 6P110',
                'PAN 6Q-408B',
                'PAN 6Q-508 R',
                'PAN 6Q-708 BR'
            ],
            'Pioneer': [
                'Other',
                'P 1615 R',
                'P 2048',
                'Phb 31D21 B',
                'Phb 31D24',
                'Phb 31D46 BR',
                'Phb 31D48 B',
                'Phb 31G54 BR',
                'Phb 31G56 R',
                'Phb 31K58 B',
                'Phb 32D95 BR',
                'Phb 32D96 B',
                'Phb 32D99',
                'Phb 32P68 R',
                'Phb 32T50',
                'Phb 32W71',
                'Phb 32W72 B',
                'Phb 33A14 B',
                'Phb 33H52 B',
                'Phb 33H56',
                'Phb 33Y72 B',
                'Phb 33Y74',
                'Phb 3442',
                'Phb 34N44 B',
                'Phb 34N45 BR',
                'Phb 35T05 R'
            ],
            'Sensako (Monsanto)': [
                'Other',
                'SNK 2472',
                'SNK 2682',
                'SNK 2778',
                'SNK 2900',
                'SNK 2942',
                'SNK 2972',
                'SNK 6326 B',
                'SNK 7510 Y',
                'SNK 8520'
            ],
            'Other': [
                'Brasco',
                'Cobber Flint',
                'Cumbre',
                'Energy',
                'Gold Finger',
                'High Flyer',
                'IMP 50-10 R',
                'IMP 51-22',
                'IMP 52-12',
                'MEH 114',
                'MMH 1765',
                'MMH 8825',
                'Maverik',
                'NK Arma',
                'NK MAYOR B',
                'NS 5000',
                'NS 5004',
                'NS 5066',
                'NS 5914',
                'NS 5916',
                'NS 5918',
                'NS 5920',
                'Other',
                'Premium Flex',
                'QS 7608',
                'RO 430',
                'SA 24',
                'SABI 7004',
                'SABI 7200',
                'Silmaster',
                'Syncerus',
                'US 9570',
                'US 9580',
                'US 9600',
                'US 9610',
                'US 9620',
                'US 9770',
                'US 9772',
                'Woodriver'
            ]
        },
        'Maize (White)': {
            'Afgri': [
                'AFG 4211',
                'AFG 4321',
                'AFG 4331',
                'AFG 4333',
                'AFG 4361',
                'AFG 4383',
                'AFG 4411',
                'AFG 4445',
                'AFG 4447',
                'AFG 4471',
                'AFG 4475 B',
                'AFG 4477',
                'AFG 4479 R',
                'AFG 4501',
                'AFG 4517',
                'AFG 4555',
                'AFG 4571 B',
                'AFG 4573 B',
                'AFG 4575',
                'AFG 4577 B',
                'AFG 4579 B',
                'AFG 4581 BR',
                'AFG 4611',
                'AFG 4663',
                'AFRIC 1',
                'Other'
            ],
            'Agricol': [
                'IMP 52-11',
                'Other',
                'SC 701',
                'SC 709'
            ],
            'Capstone Seeds': [
                'CAP 341 NG',
                'CAP 341 T NG',
                'CAP 441 NG',
                'CAP 775 NG',
                'CAP 9001',
                'CAP 9013',
                'CAP 9421',
                'Other'
            ],
            'Dekalb (Monsanto)': [
                'CRN 3505',
                'CRN 4141',
                'DKC 77-61 B',
                'DKC 77-85 B GEN',
                'DKC 78-15 B',
                'DKC 78-17 B',
                'DKC 78-35 R',
                'DKC 78-45 BR',
                'DKC 78-45 BR GEN',
                'DKC 79-05',
                'Other'
            ],
            'Delta Seed': [
                'DE 111',
                'DE 303',
                'Other'
            ],
            'Klein Karoo Saad': [
                'KKS 4383',
                'KKS 4445',
                'KKS 4447',
                'KKS 4471',
                'KKS 4473',
                'KKS 4477',
                'KKS 4479 R',
                'KKS 4485',
                'KKS 4501',
                'KKS 4517',
                'KKS 4519',
                'KKS 4555',
                'KKS 4575',
                'KKS 4581 BR',
                'KKS 8401',
                'Other'
            ],
            'Linksaad': [
                'LS 8519',
                'LS 8529',
                'LS 8533 R',
                'LS 8535 B',
                'LS 8537',
                'LS 8539 B',
                'Other'
            ],
            'Pannar': [
                'BG 5485B',
                'BG 5685R',
                'BG4201',
                'BG4401B',
                'BG5285',
                'BG5785BR',
                'BG6683R',
                'Other',
                'PAN 413',
                'PAN 4P-767BR',
                'PAN 53',
                'PAN 5Q-649 R',
                'PAN 5Q-749 BR',
                'PAN 5Q-751BR',
                'PAN 6227',
                'PAN 6479',
                'PAN 6611',
                'PAN 6671',
                'PAN 67',
                'PAN 6777',
                'PAN 69',
                'PAN 6Q-745BR',
                'PAN 93',
                'PAN413',
                'PAN53',
                'PAN6Q245',
                'PAN6Q345CB',
                'SC 701 (Green mealie)'
            ],
            'Pioneer': [
                'Other',
                'P 2369 W',
                'P 2653 WB',
                'P 2823 WB',
                'P 2961 W',
                'Phb 30B95 B',
                'Phb 30B97 BR',
                'Phb 30D04 R',
                'Phb 30D07 B',
                'Phb 30D09 BR',
                'Phb 30Y79 B',
                'Phb 30Y81 R',
                'Phb 30Y83',
                'Phb 31M09',
                'Phb 31M84 BR',
                'Phb 31T91',
                'Phb 31V31',
                'Phb 3210B',
                'Phb 32A05 B',
                'Phb 32B07 BR',
                'Phb 32Y85',
                'Phb 32Y87 B'
            ],
            'Sensako (Monsanto)': [
                'SNK 2021',
                'SNK 2147',
                'SNK 2401',
                'SNK 2551',
                'SNK 2721',
                'SNK 2911',
                'SNK 2969',
                'SNK 6025',
                'SNK 7811 B'
            ],
            'Other': [
                'CG 4141',
                'GM 2000',
                'KGALAGADI',
                'MRI 514',
                'MRI 624',
                'NG 761',
                'NS 5913',
                'NS 5917',
                'NS 5919',
                'Other',
                'PGS 7053',
                'PGS 7061',
                'PGS 7071',
                'PLATINUM',
                'Panthera',
                'QS 7707',
                'RO 413',
                'RO 413',
                'RO 419',
                'SAFFIER',
                'SC 401',
                'SC 403',
                'SC 405',
                'SC 407',
                'SC 513',
                'SC 627',
                'SC 631',
                'SC 633',
                'SC 713',
                'SC 715',
                'Scout'
            ]
        },
        'Oat': {
            'Agricol': [
                'Magnifico',
                'Maida',
                'Nugene',
                'Other',
                'Overberg',
                'Pallinup',
                'Saia',
                'SWK001'
            ],
            'Sensako (Monsanto)': [
                'Other',
                'SSH 39W',
                'SSH 405',
                'SSH 421',
                'SSH 423',
                'SSH 491'
            ],
            'Other': [
                'Drakensberg',
                'H06/19',
                'H06/20',
                'H07/04',
                'H07/05',
                'Heros',
                'Kompasberg',
                'Le Tucana',
                'Maluti',
                'Other',
                'Potoroo',
                'Witteberg'
            ]
        },
        'Peanut': {
            'Other': [
                'Other'
            ]
        },
        'Soya Bean': {
            'Agriocare': [
                'AGC 58007 R',
                'AGC 60104 R',
                'AGC 64107 R',
                'AS 4801 R',
                'Other'
            ],
            'Linksaad': [
                'LS 6146 R',
                'LS 6150 R',
                'LS 6161 R',
                'LS 6164 R',
                'LS 6248 R',
                'LS 6261 R',
                'LS 6444 R',
                'LS 6466 R',
                'Other'
            ],
            'Pannar': [
                'A 5409 RG',
                'Other',
                'PAN 1454 R',
                'PAN 1583 R',
                'PAN 1664 R',
                'PAN 1666 R'
            ],
            'Pioneer': [
                'Other',
                'Phb 94Y80 R',
                'Phb 95B53 R',
                'Phb 95Y20 R',
                'Phb 95Y40 R'
            ],
            'Other': [
                'AG 5601',
                'AMSTEL NO 1',
                'DUMELA',
                'DUNDEE',
                'EGRET',
                'HERON',
                'HIGHVELD TOP',
                'IBIS 2000',
                'JF 91',
                'JIMMY',
                'KIAAT',
                'KNAP',
                'LEX 1233 R',
                'LEX 1235 R',
                'LEX 2257 R',
                'LEX 2685 R',
                'LIGHTNING',
                'MARULA',
                'MARUTI',
                'MOPANIE',
                'MPIMBO',
                'MUKWA',
                'NQUTU',
                'OCTA',
                'Other',
                'SONOP',
                'SPITFIRE',
                'STORK',
                'TAMBOTIE',
                'WENNER'
            ]
        },
        'Sugarcane': {
            'Other': [
                'ACRUNCH',
                'BONITA',
                'CHIEFTAIN',
                'EARLISWEET',
                'GLADIATOR',
                'GSS 9299',
                'HOLLYWOOD',
                'HONEYMOON',
                'INFERNO',
                'JUBILEE',
                'MADHUR',
                'MAJESTY',
                'MANTRA',
                'MATADOR',
                'MAX',
                'MEGATON',
                'MMZ 9903',
                'ORLA',
                'OSCAR',
                'Other',
                'OVERLAND',
                'PRIMEPLUS',
                'RUSALTER',
                'RUSTICO',
                'RUSTLER',
                'SENTINEL',
                'SHIMMER',
                'STAR 7708',
                'STAR 7713',
                'STAR 7714',
                'STAR 7715',
                'STAR 7717',
                'STAR 7718',
                'STAR 7719',
                'STETSON',
                'SWEET SUCCESS',
                'SWEET SURPRISE',
                'SWEET TALK',
                'TENDER TREAT',
                'WINSTAR'
            ]
        },
        'Sunflower': {
            'Agricol': [
                'AGSUN 5161 CL',
                'AGSUN 5182 CL',
                'Agsun 5264',
                'Agsun 5671',
                'Agsun 8251',
                'Nonjana',
                'Other',
                'SUNSTRIPE'
            ],
            'Klein Karoo Saad': [
                'AFG 271',
                'HYSUN 333',
                'KKS 318',
                'NK ADAGIO',
                'NK Armoni',
                'NK FERTI',
                'Other',
                'Sirena',
                'Sunbird'
            ],
            'Pannar': [
                'Other',
                'PAN 7033',
                'PAN 7049',
                'PAN 7050',
                'PAN 7057',
                'PAN 7063 CL',
                'PAN 7080',
                'PAN 7086 HO',
                'PAN 7095 CL',
                'PAN 7351'
            ],
            'Other': [
                'Ella',
                'Grainco Sunstripe',
                'HV 3037',
                'HYSUN 334',
                'HYSUN 338',
                'HYSUN 346',
                'HYSUN 350',
                'Jade Emperor',
                'Marica-2',
                'NK Adagio CL',
                'Nallimi CL',
                'Other',
                'SEA 2088 CL AO',
                'SY 4045',
                'SY 4200',
                'Sikllos CL',
                'WBS 3100'
            ]
        },
        'Triticale': {
            'Agricol': [
                'AG Beacon',
                'Other',
                'Rex'
            ],
            'Pannar': [
                'PAN 248',
                'PAN 299',
                'Other'
            ],
            'Other': [
                'Bacchus',
                'Cloc 1',
                'Cultivars',
                'Falcon',
                'Ibis',
                'Kiewiet',
                'Korhaan',
                'Other',
                'Tobie',
                'US 2009',
                'US 2010',
                'US2007'
            ]
        },
        'Wheat': {
            'Afgri': [
                'AFG 554-8',
                'AFG 75-3',
                'Other'
            ],
            'All-Grow Seed': [
                'BUFFELS',
                'DUZI',
                'KARIEGA',
                'KROKODIL',
                'Other',
                'SABIE',
                'STEENBRAS'
            ],
            'Klein Karoo Saad': [
                'HARTBEES',
                'KOMATI',
                'KOONAP',
                'MATLABAS',
                'Other',
                'SELATI',
                'SENQU'
            ],
            'Sensako': [
                'CRN 826',
                'ELANDS',
                'Other',
                'SST 015',
                'SST 026',
                'SST 027',
                'SST 035',
                'SST 036',
                'SST 037',
                'SST 039',
                'SST 047',
                'SST 056',
                'SST 057',
                'SST 065',
                'SST 077',
                'SST 087',
                'SST 088',
                'SST 094',
                'SST 096',
                'SST 107',
                'SST 124',
                'SST 308',
                'SST 316',
                'SST 317',
                'SST 319',
                'SST 322',
                'SST 333',
                'SST 334',
                'SST 347',
                'SST 356',
                'SST 363',
                'SST 366',
                'SST 367',
                'SST 374',
                'SST 387',
                'SST 398',
                'SST 399',
                'SST 802',
                'SST 805',
                'SST 806',
                'SST 807',
                'SST 815',
                'SST 816',
                'SST 822',
                'SST 825',
                'SST 835',
                'SST 843',
                'SST 866',
                'SST 867',
                'SST 875',
                'SST 876',
                'SST 877',
                'SST 878',
                'SST 884',
                'SST 885',
                'SST 886',
                'SST 895',
                'SST 896',
                'SST 935',
                'SST 936',
                'SST 946',
                'SST 954',
                'SST 963',
                'SST 964',
                'SST 966',
                'SST 972',
                'SST 983',
                'SST 0127',
                'SST 1327',
                'SST 3137',
                'SST 8125',
                'SST 8126',
                'SST 8134',
                'SST 8135',
                'SST 8136'
            ],
            'Pannar': [
                'Other',
                'PAN 3118',
                'PAN 3120',
                'PAN 3122',
                'PAN 3144',
                'PAN 3161',
                'PAN 3172',
                'PAN 3195',
                'PAN 3198',
                'PAN 3355',
                'PAN 3364',
                'PAN 3368',
                'PAN 3369',
                'PAN 3377',
                'PAN 3378',
                'PAN 3379',
                'PAN 3394',
                'PAN 3400',
                'PAN 3404',
                'PAN 3405',
                'PAN 3408',
                'PAN 3434',
                'PAN 3471',
                'PAN 3478',
                'PAN 3489',
                'PAN 3490',
                'PAN 3492',
                'PAN 3497',
                'PAN 3111',
                'PAN 3349',
                'PAN 3515',
                'PAN 3623'
            ],
            'Other': [
                'BAVIAANS',
                'BELINDA',
                'BETTA-DN',
                'BIEDOU',
                'CALEDON',
                'CARINA',
                'CAROL',
                'GARIEP',
                'HUGENOOT',
                'INIA',
                'KOUGA',
                'KWARTEL',
                'LIMPOPO',
                'MacB',
                'MARICO',
                'NOSSOB',
                'OLIFANTS',
                'Other',
                'SNACK',
                'TAMBOTI',
                'TANKWA',
                'TARKA',
                'TIMBAVATI',
                'TUGELA-DN',
                'UMLAZI',
                'RATEL'
            ]
        }
    };

    // Create Maize from Maize (Yellow) and Maize (White)
    _providerCultivars['Maize'] = angular.copy(_providerCultivars['Maize (Yellow)']);

    angular.forEach(_providerCultivars['Maize (White)'], function (cultivars, seedProvider) {
        _providerCultivars['Maize'][seedProvider] = _.chain(_providerCultivars['Maize'][seedProvider] || [])
            .union(cultivars)
            .compact()
            .uniq()
            .sortBy(function (cultivar) {
                return cultivar;
            })
            .value();
    });

    var _cultivarLeafTable = {
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

    return {
        getCultivars: function (crop, seedProvider) {
            return (_providerCultivars[crop] && _providerCultivars[crop][seedProvider] ? _providerCultivars[crop][seedProvider] : []);
        },
        getCultivarLeafCount: function (cultivar) {
            return _cultivarLeafTable[cultivar] || 22;
        },
        getSeedProviders: function (crop) {
            return (_providerCultivars[crop] ? underscore.keys(_providerCultivars[crop]) : []);
        }
    }
}]);

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
            var typeColorMap = {
                'error': 'danger',
                'information': 'info',
                'warning': 'warning'
            };
            var flagLabels = underscore.chain(item.activeFlags)
                .groupBy(function(activeFlag) {
                    return activeFlag.flag.type;
                })
                .map(function (group, type) {
                    var hasOpen = false;
                    angular.forEach(group, function(activeFlag) {
                        if(activeFlag.status == 'open') {
                            hasOpen = true;
                        }
                    });
                    return {
                        label: typeColorMap[type],
                        count: group.length,
                        hasOpen: hasOpen
                    }
                })
                .value();
            var docMap = _documentMap[item.docType];
            var map = {
                id: item.id || item.$id,
                title: (item.documentId ? item.documentId : ''),
                subtitle: (item.author ? 'By ' + item.author + ' on ': 'On ') + $filter('date')(item.createdAt),
                docType: item.docType,
                group: (docMap ? docMap.title : item.docType),
                flags: flagLabels
            };

            if (item.organization && item.organization.name) {
                map.title = item.organization.name;
                map.subtitle = item.documentId || '';
            }

            if (item.data && docMap && docMap.listServiceMap) {
                if (docMap.listServiceMap instanceof Array) {
                    docMap.listServiceMap = $injector.invoke(docMap.listServiceMap);
                }

                docMap.listServiceMap(map, item);
            }

            return map;
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
                return (_documentMap[docType] ? _documentMap[docType].title : '');
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

var sdkHelperEnterpriseBudgetApp = angular.module('ag.sdk.helper.enterprise-budget', ['ag.sdk.library']);

sdkHelperEnterpriseBudgetApp.factory('enterpriseBudgetHelper', ['naturalSort', 'underscore', function(naturalSort, underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.commodityType + (item.regionName? ' in ' + item.regionName : ''),
            status: (item.published ? {text: 'public', label: 'label-success'} : (item.internallyPublished ? {text: 'internal', label: 'label-info'} : false)),
            searchingIndex: searchingIndex(item)
        };

        function searchingIndex (item) {
            var index = [item.name, item.assetType, item.commodityType];

            if (item.data && item.data.details && item.data.details.regionName) {
                index.push(item.data.details.regionName);
            }

            return index;
        }
    };

    var _modelTypes = {
        crop: 'Field Crop',
        livestock: 'Livestock',
        horticulture: 'Horticulture'
    };

    var _sections = {
        expenses: {
            code: 'EXP',
            name: 'Expenses'
        },
        income: {
            code: 'INC',
            name: 'Income'
        }
    };

    var _groups = underscore.indexBy([
        {
            code: 'INC-CPS',
            name: 'Crop Sales'
        }, {
            code: 'INC-FRS',
            name: 'Fruit Sales'
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
    ], 'name');

    var _categories = underscore.indexBy([
        //*********** Income *********
        // livestock sales
        // Sheep
        {
            code: 'INC-LSS-SLAMB',
            name: 'Lamb',
            unit: 'head'
        }, {
            code: 'INC-LSS-SWEAN',
            name: 'Weaner lambs',
            unit: 'head'
        }, {
            code: 'INC-LSS-SEWE',
            name: 'Ewe',
            unit: 'head'
        }, {
            code: 'INC-LSS-SWTH',
            name: 'Wether (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-SRAM',
            name: 'Ram',
            unit: 'head'
        },

        // Cattle
        {
            code: 'INC-LSS-CCALV',
            name: 'Calf',
            unit: 'head'
        }, {
            code: 'INC-LSS-CWEN',
            name: 'Weaner calves',
            unit: 'head'
        }, {
            code: 'INC-LSS-CCOW',
            name: 'Cow or heifer',
            unit: 'head'
        }, {
            code: 'INC-LSS-CST18',
            name: 'Steer (18 moths plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-CST36',
            name: 'Steer (3 years plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-CBULL',
            name: 'Bull (3 years plus)',
            unit: 'head'
        },

        //Goats
        {
            code: 'INC-LSS-GKID',
            name: 'Kid',
            unit: 'head'
        }, {
            code: 'INC-LSS-GWEAN',
            name: 'Weaner kids',
            unit: 'head'
        }, {
            code: 'INC-LSS-GEWE',
            name: 'Ewe (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-GCAST',
            name: 'Castrate (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'INC-LSS-GRAM',
            name: 'Ram (2-tooth plus)',
            unit: 'head'
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
        },

        //Crops
        {
            code: 'INC-HVT-CROP',
            name: 'Crop',
            unit: 't'
        },
        //Horticulture (non-perennial)
        {
            code: 'INC-HVT-FRUT',
            name: 'Fruit',
            unit: 't'
        },
        //*********** Expenses *********
        // Preharvest
        {
            code: 'EXP-HVP-SEED',
            name: 'Seed',
            unit: 'kg'
        }, {
            code: 'EXP-HVP-PLTM',
            name: 'Plant Material',
            unit: 'each'
        }, {
            code: 'EXP-HVP-FERT',
            name: 'Fertiliser',
            unit: 't'
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
            code: 'EXP-HVP-SPYA',
            name: 'Aerial spraying',
            unit: 'ha'
        }, {
            code: 'EXP-HVP-INSH',
            name: 'Crop Insurance (Hail)',
            unit: 't'
        }, {
            code: 'EXP-HVP-INSM',
            name: 'Crop Insurance (Multiperil)',
            unit: 't'
        }, {
            code: 'EXP-HVP-HEDG',
            name: 'Hedging cost',
            unit: 't'
        },
        //Harvest
        {
            code: 'EXP-HVT-LABC',
            name: 'Contract work (Harvest)',
            unit: 'ha'
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
            name: 'Drying and cleaning',
            unit: 't'
        }, {
            code: 'EXP-HVT-PAKC',
            name: 'Packing cost',
            unit: 'each'
        },
        //Indirect
        {
            code: 'EXP-IDR-FUEL',
            name: 'Fuel',
            unit: 'l'
        }, {
            code: 'EXP-IDR-REPP',
            name: 'Repairs & parts',
            unit: 'Total'
        }, {
            code: 'EXP-IDR-ELEC',
            name: 'Electricity',
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
            name: 'Other costs',
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
            name: 'Weaner lambs',
            unit: 'head'
        }, {
            code: 'EXP-RPM-SEWE',
            name: 'Ewe',
            unit: 'head'
        }, {
            code: 'EXP-RPM-SWTH',
            name: 'Wether (2-tooth plus)',
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
            name: 'Weaner calves',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CCOW',
            name: 'Cow or heifer',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CST18',
            name: 'Steer (18 moths plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CST36',
            name: 'Steer (3 years plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-CBULL',
            name: 'Bull (3 years plus)',
            unit: 'head'
        },

        //Goats
        {
            code: 'EXP-RPM-GKID',
            name: 'Kid',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GWEAN',
            name: 'Weaner kids',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GEWE',
            name: 'Ewe (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GCAST',
            name: 'Castrate (2-tooth plus)',
            unit: 'head'
        }, {
            code: 'EXP-RPM-GRAM',
            name: 'Ram (2-tooth plus)',
            unit: 'head'
        },
        //Animal feed
        {
            code: 'EXP-AMF-LICK',
            name: 'Lick',
            unit: 'kg'
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
            incomeGroup: 'Livestock Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-LSPF',
            name: 'Livestock products marketing fees',
            incomeGroup: 'Product Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-HOTF',
            name: 'Horticulture marketing fees',
            incomeGroup: 'Fruit Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-CRPF',
            name: 'Crop marketing fees',
            incomeGroup: 'Crop Sales',
            unit: '%'
        }, {
            code: 'EXP-MRK-LSTP',
            name: 'Livestock transport',
            unit: 'head'
        }, {
            code: 'EXP-MRK-HOTT',
            name: 'Horticulture transport',
            unit: 't'
        }, {
            code: 'EXP-MRK-CRPT',
            name: 'Crop transport',
            unit: 't'
        }
    ], 'code');

    // todo: extend the categories with products for future features.
//    var _productsMap = {
//        'INC-PDS-MILK': {
//            code: 'INC-PDS-MILK-M13',
//            name: 'Cow Milk',
//            unit: 'l'
//        }
//    }

    var _categoryOptions = {
        crop: {
            income: {
                'Crop Sales': [
                    _categories['INC-HVT-CROP']
                ]
            },
            expenses: {
                'Preharvest': [
                    _categories['EXP-HVP-SEED'],
                    _categories['EXP-HVP-FERT'],
                    _categories['EXP-HVP-LIME'],
                    _categories['EXP-HVP-HERB'],
                    _categories['EXP-HVP-PEST'],
                    _categories['EXP-HVP-SPYA'],
                    _categories['EXP-HVP-INSH'],
                    _categories['EXP-HVP-INSM'],
                    _categories['EXP-HVP-HEDG']
                ],
                'Harvest': [
                    _categories['EXP-HVT-LABC']
                ],
                'Marketing': [
                    _categories['EXP-MRK-CRPF'],
                    _categories['EXP-MRK-CRPT']
                ],
                'Indirect Costs': [
                    _categories['EXP-IDR-FUEL'],
                    _categories['EXP-IDR-REPP'],
                    _categories['EXP-IDR-ELEC'],
                    _categories['EXP-IDR-WATR'],
                    _categories['EXP-IDR-LABP'],
                    _categories['EXP-IDR-SCHED'],
                    _categories['EXP-IDR-OTHER']
                ]
            }
        },
        horticulture: {
            income: {
                'Fruit Sales': [
                    _categories['INC-HVT-FRUT']
                ]
            },
            expenses: {
                'Preharvest': [
                    _categories['EXP-HVP-PLTM'],
                    _categories['EXP-HVP-FERT'],
                    _categories['EXP-HVP-LIME'],
                    _categories['EXP-HVP-HERB'],
                    _categories['EXP-HVP-PEST'],
                    _categories['EXP-HVP-SPYA'],
                    _categories['EXP-HVP-INSH'],
                    _categories['EXP-HVP-INSM']
                ],
                'Harvest': [
                    _categories['EXP-HVT-LABC'],
                    _categories['EXP-HVT-STOR'],
                    _categories['EXP-HVT-PAKM'],
                    _categories['EXP-HVT-DYCL'],
                    _categories['EXP-HVT-PAKC']
                ],
                'Marketing': [
                    _categories['EXP-MRK-HOTF'],
                    _categories['EXP-MRK-HOTT']
                ],
                'Indirect Costs': [
                    _categories['EXP-IDR-FUEL'],
                    _categories['EXP-IDR-REPP'],
                    _categories['EXP-IDR-ELEC'],
                    _categories['EXP-IDR-WATR'],
                    _categories['EXP-IDR-LABP'],
                    _categories['EXP-IDR-SCHED'],
                    _categories['EXP-IDR-LICS'],
                    _categories['EXP-IDR-INSA'],
                    _categories['EXP-IDR-OTHER']
                ]
            }
        },
        livestock: {
            Cattle: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-CCALV'],
                        _categories['INC-LSS-CWEN'],
                        _categories['INC-LSS-CCOW'],
                        _categories['INC-LSS-CST18'],
                        _categories['INC-LSS-CST36'],
                        _categories['INC-LSS-CBULL']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-CCALV'],
                        _categories['EXP-RPM-CWEN'],
                        _categories['EXP-RPM-CCOW'],
                        _categories['EXP-RPM-CST18'],
                        _categories['EXP-RPM-CST36'],
                        _categories['EXP-RPM-CBULL']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            },
            Goats: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-GKID'],
                        _categories['INC-LSS-GWEAN'],
                        _categories['INC-LSS-GEWE'],
                        _categories['INC-LSS-GCAST'],
                        _categories['INC-LSS-GRAM']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-WOOL'],
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-GKID'],
                        _categories['EXP-RPM-GWEAN'],
                        _categories['EXP-RPM-GEWE'],
                        _categories['EXP-RPM-GCAST'],
                        _categories['EXP-RPM-GRAM']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY'],
                        _categories['EXP-HBD-SHER'],
                        _categories['EXP-HBD-CRCH']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            },
            Sheep: {
                income: {
                    'Livestock Sales': [
                        _categories['INC-LSS-SLAMB'],
                        _categories['INC-LSS-SWEAN'],
                        _categories['INC-LSS-SEWE'],
                        _categories['INC-LSS-SWTH'],
                        _categories['INC-LSS-SRAM']
                    ],
                    'Product Sales': [
                        _categories['INC-LSP-WOOL'],
                        _categories['INC-LSP-MILK']
                    ]
                },
                expenses: {
                    'Replacements': [
                        _categories['EXP-RPM-SLAMB'],
                        _categories['EXP-RPM-SWEAN'],
                        _categories['EXP-RPM-SEWE'],
                        _categories['EXP-RPM-SWTH'],
                        _categories['EXP-RPM-SRAM']
                    ],
                    'Animal Feed': [
                        _categories['EXP-AMF-LICK']
                    ],
                    'Husbandry': [
                        _categories['EXP-HBD-VACC'],
                        _categories['EXP-HBD-DIPP'],
                        _categories['EXP-HBD-VETY'],
                        _categories['EXP-HBD-SHER'],
                        _categories['EXP-HBD-CRCH']
                    ],
                    'Marketing': [
                        _categories['EXP-MRK-LSSF'],
                        _categories['EXP-MRK-LSPF'],
                        _categories['EXP-MRK-LSTP']
                    ],
                    'Indirect Costs': [
                        _categories['EXP-IDR-FUEL'],
                        _categories['EXP-IDR-REPP'],
                        _categories['EXP-IDR-ELEC'],
                        _categories['EXP-IDR-WATR'],
                        _categories['EXP-IDR-LABP'],
                        _categories['EXP-IDR-LICS'],
                        _categories['EXP-IDR-INSA'],
                        _categories['EXP-IDR-OTHER']
                    ]
                }
            }
        }
    };

    var _representativeAnimal = {
        Cattle: 'Cow or heifer',
        Sheep: 'Ewe',
        Goats: 'Ewe (2-tooth plus)'
    };

    var _baseAnimal = {
        'Cattle (Extensive)': 'Cattle',
        'Cattle (Feedlot)': 'Cattle',
        'Cattle (Stud)': 'Cattle',
        'Sheep (Extensive)': 'Sheep',
        'Sheep (Feedlot)': 'Sheep',
        'Sheep (Stud)': 'Sheep'
    };

    var _conversionRate = {
        Cattle: {
            'Calf': 0.32,
            'Weaner calves': 0.44,
            'Cow or heifer': 1.1,
            'Steer (18  months plus)': 0.75,
            'Steer (3 years plus)': 1.1,
            'Bull (3 years plus)': 1.36
        },
        Sheep: {
            'Lamb': 0.08,
            'Weaner Lambs': 0.11,
            'Ewe': 0.16,
            'Wether (2-tooth plus)': 0.16,
            'Ram (2-tooth plus)': 0.23
        },
        Goats: {
            'Kid': 0.08,
            'Weaner kids': 0.12,
            'Ewe (2-tooth plus)': 0.17,
            'Castrate (2-tooth plus)': 0.17,
            'Ram (2-tooth plus)': 0.22
        }
    };

    var _commodityTypes = {
        crop: 'Field Crops',
        horticulture: 'Horticulture',
        livestock: 'Livestock'
    };

    // When updating, also update the _enterpriseTypes list in the legalEntityHelper (farmerHelperModule.js)
    var _commodities = {
        crop: ['Barley', 'Bean (Dry)', 'Bean (Green)', 'Canola', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Lucerne', 'Lupin', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oat', 'Potato', 'Rye', 'Soya Bean', 'Sunflower', 'Sweet Corn', 'Tobacco', 'Triticale', 'Wheat'],
        horticulture: ['Almond', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Chicory', 'Chili', 'Citrus (Hardpeel)', 'Citrus (Softpeel)', 'Coffee', 'Fig', 'Garlic', 'Grape (Table)', 'Grape (Wine)', 'Guava', 'Hops', 'Kiwi', 'Lemon', 'Lentil', 'Macadamia Nut', 'Mango', 'Melon', 'Nectarine', 'Olive', 'Onion', 'Orange', 'Papaya', 'Pea', 'Peach', 'Peanut', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Pomegranate', 'Prickly Pear', 'Prune', 'Pumpkin', 'Quince', 'Rooibos', 'Strawberry', 'Sugarcane', 'Tomato', 'Watermelon'],
        livestock: ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
    };

    var _horticultureStages = {
        'Apple': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Apricot': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Avocado': ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'],
        'Blueberry': ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'],
        'Citrus (Hardpeel)': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Citrus (Softpeel)': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Fig': ['0-1 years', '1-3 years', '3-6 years', '6-18 years', '18-30 years', '30+ years'],
        'Grape (Table)': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Grape (Wine)': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Macadamia Nut': ['0-1 years', '1-3 years', '3-6 years', '6-9 years','10+ years'],
        'Mango': ['0-1 years', '1-3 years', '3-5 years', '5-18 years', '18-30 years', '30+ years'],
        'Nectarine': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Olive': ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
        'Orange': ['0-1 years', '1-4 years', '4-8 years', '8-20 years', '20-25 years', '25+ years'],
        'Pecan Nut': ['0-1 years', '1-3 years', '3-7 years', '7-10 years', '10+ years'],
        'Peach': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Pear': ['0-3 years', '3-10 years', '10-15 years', '15-25 years', '25+ years'],
        'Persimmon': ['0-1 years', '1-4 years', '4-12 years', '12-20 years', '20+ years'],
        'Plum': ['0-2 years', '2-5 years', '5-15 years', '15-18 years', '18+ years'],
        'Pomegranate': ['0-1 years', '1-3 years', '3-5 years', '5-18 years', '18-30 years', '30+ years'],
        'Rooibos': ['0-1 years', '1-2 years', '2-4 years', '4-5 years', '5+ years']
    };

    /*
     * Extended Budgets
     */
    var _cycleMonths = [
        {
            id: 0,
            name: 'January',
            shortname: 'Jan'
        }, {
            id: 1,
            name: 'February',
            shortname: 'Feb'
        }, {
            id: 2,
            name: 'March',
            shortname: 'Mar'
        }, {
            id: 3,
            name: 'April',
            shortname: 'Apr'
        }, {
            id: 4,
            name: 'May',
            shortname: 'May'
        }, {
            id: 5,
            name: 'June',
            shortname: 'Jun'
        }, {
            id: 6,
            name: 'July',
            shortname: 'Jul'
        }, {
            id: 7,
            name: 'August',
            shortname: 'Aug'
        }, {
            id: 8,
            name: 'September',
            shortname: 'Sep'
        }, {
            id: 9,
            name: 'October',
            shortname: 'Oct'
        }, {
            id: 10,
            name: 'November',
            shortname: 'Nov'
        }, {
            id: 11,
            name: 'December',
            shortname: 'Dec'
        }];

    var _scheduleTypes = {
        'default': ['Fertilise', 'Harvest', 'Plant/Seed', 'Plough', 'Spray'],
        'livestock': ['Lick', 'Sales', 'Shearing', 'Vaccination']
    };

    var _scheduleBirthing = {
        'Calving': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Dairy'],
        'Hatching': ['Chicken (Broilers)', 'Chicken (Layers)', 'Ostrich'],
        'Kidding': ['Game', 'Goats'],
        'Foaling': ['Horses'],
        'Farrowing': ['Pigs'],
        'Lambing': ['Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
    };

    var _productsMap = {
        'INC-PDS-MILK': {
            code: 'INC-PDS-MILK-M13',
            name: 'Cow Milk',
            unit: 'Litre'
        }
    };

    function checkBudgetTemplate (budget) {
        budget.data = budget.data || {};
        budget.data.details = budget.data.details || {};
        budget.data.details.cycleStart = budget.data.details.cycleStart || 0;
        budget.data.sections = budget.data.sections || [];
        budget.data.schedules = budget.data.schedules || {};
    }

    function getBaseAnimal (commodityType) {
        return _baseAnimal[commodityType] || commodityType;
    }

    function getScheduleBirthing (commodityType) {
        return underscore.chain(_scheduleBirthing)
            .keys()
            .filter(function (key) {
                return underscore.contains(_scheduleBirthing[key], commodityType);
            })
            .value();
    }

    function checkBudgetSection (budget, stage) {
        angular.forEach(['income', 'expenses'], function (section) {
            var foundSection = underscore.findWhere(budget.data.sections,
                (stage === undefined ? {code: _sections[section].code} : {code: _sections[section].code, horticultureStage: stage}));

            if (foundSection === undefined) {
                foundSection = {
                    code: _sections[section].code,
                    name: _sections[section].name,
                    productCategoryGroups: [],
                    total: {
                        value: 0
                    }
                };

                if (stage !== undefined) {
                    foundSection.horticultureStage = stage;
                }

                budget.data.sections.push(foundSection);
            }
        });

        return budget;
    }

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        commodityTypes: function() {
            return _commodityTypes;
        },
        commodities: function() {
            return _commodities;
        },
        cycleMonths: function () {
            return _cycleMonths;
        },
        scheduleTypes: function() {
            return _scheduleTypes;
        },
        getRepresentativeAnimal: function(commodityType) {
            return _representativeAnimal[getBaseAnimal(commodityType)];
        },
        getConversionRate: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)][_representativeAnimal[getBaseAnimal(commodityType)]];
        },
        getConversionRates: function(commodityType) {
            return _conversionRate[getBaseAnimal(commodityType)];
        },
        getCommodities: function (type) {
            return _commodities[type] || '';
        },
        getHorticultureStages: function(commodityType) {
            return _horticultureStages[commodityType] || [];
        },
        getHorticultureStage: function (commodityType, asset) {
            var stages = this.getHorticultureStages(commodityType),
                result = (stages.length > 0 ? stages[0] : undefined);

            if (asset && asset.data.establishedDate) {
                var assetAge = moment().diff(asset.data.establishedDate, 'years', true);

                angular.forEach(stages, function (stage) {
                    var matchYears = stage.match(/\d+/g);

                    if ((matchYears.length == 1 && matchYears[0] <= assetAge) || (matchYears.length == 2 && matchYears[0] <= assetAge && matchYears[1] >= assetAge)) {
                        result = stage;
                    }
                });
            }

            return result;
        },
        getCategories: function (budget, assetType, commodityType, sectionType, horticultureStage) {
            var categories = {};

            if(assetType == 'livestock' && _categoryOptions[assetType][getBaseAnimal(commodityType)]) {
                categories = angular.copy(_categoryOptions[assetType][getBaseAnimal(commodityType)][sectionType]) || {};
            }

            if(assetType == 'crop' && _categoryOptions[assetType][sectionType]) {
                categories = angular.copy(_categoryOptions[assetType][sectionType]) || {};
            }

            if(assetType == 'horticulture' && _categoryOptions[assetType][sectionType]) {
                categories = angular.copy(_categoryOptions[assetType][sectionType]) || {};
            }

            // remove the income / expense items which exists in the budget, from the categories
            angular.forEach(budget.data.sections, function(section, i) {
                if(section.name.toLowerCase().indexOf(sectionType) > -1) {
                    if(budget.assetType != 'horticulture' || (budget.assetType == 'horticulture' && section.horticultureStage == horticultureStage)) {
                        angular.forEach(section.productCategoryGroups, function(group, j) {
                            angular.forEach(group.productCategories, function(category, k) {
                                angular.forEach(categories[group.name], function(option, l) {
                                    if(option.code == category.code) {
                                        categories[group.name].splice(l, 1);
                                    }
                                });
                            });
                        });
                    }
                }
            });

            var result = [];

            for(var label in categories) {
                categories[label].forEach(function(option, i) {
                    option.groupBy = label;
                    result.push(option);
                });
            }

            return result;
        },
        getModelType: function (type) {
            return _modelTypes[type] || '';
        },
        getScheduleTypes: function(assetType, commodityType) {
            return underscore.chain(_scheduleTypes[assetType] ? _scheduleTypes[assetType] : _scheduleTypes.default)
                .union(getScheduleBirthing(commodityType))
                .compact()
                .value()
                .sort(function (a, b) {
                    return naturalSort(a, b);
                });
        },

        validateBudgetData: function (budget, stage) {
            checkBudgetTemplate(budget);
            checkBudgetSection(budget, stage);
            return this.calculateTotals(budget);
        },
        initNewSections: function (budget, stage) {
            return checkBudgetSection(budget, stage);
        },
        addCategoryToBudget: function (budget, sectionName, groupName,  categoryCode, horticultureStage) {
            var category = angular.copy(_categories[categoryCode]);

            if(budget.assetType == 'livestock') {
                category.valuePerLSU = 0;
                if(_conversionRate[getBaseAnimal(budget.commodityType)][category.name]) {
                    category.conversionRate = _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                }
            }

            var noSuchSection = true;
            var noSuchGroup = true;
            var sectionIndex = -1;
            var groupIndex = -1;
            var targetSection = angular.copy(_sections[sectionName]);
            var targetGroup = angular.copy(_groups[groupName]);

            targetSection.productCategoryGroups = [];
            targetGroup.productCategories = [];

            angular.forEach(budget.data.sections, function(section, i) {
                if((budget.assetType != 'horticulture' && section.name == targetSection.name) || (budget.assetType == 'horticulture' && section.name == targetSection.name && section.horticultureStage == horticultureStage)) {
                    noSuchSection = false;
                    sectionIndex = i;
                    targetSection = section;
                    section.productCategoryGroups.forEach(function(group, j) {
                        if(group.name == groupName) {
                            noSuchGroup = false;
                            groupIndex = j;
                            targetGroup = group;
                        }
                    });
                }
            });

            // add new section and/or new group
            if(noSuchSection) {
                if(budget.assetType == 'horticulture' && horticultureStage) {
                    targetSection.horticultureStage = horticultureStage;
                }

                budget.data.sections.push(targetSection);
                sectionIndex = budget.data.sections.length - 1;
            }

            if(noSuchGroup) {
                budget.data.sections[sectionIndex].productCategoryGroups.push(targetGroup);
                groupIndex = budget.data.sections[sectionIndex].productCategoryGroups.length - 1;
            }

            budget.data.sections[sectionIndex].productCategoryGroups[groupIndex].productCategories.push(category);

            return budget;
        },
        calculateTotals: function (budget) {
            checkBudgetTemplate(budget);

            if(budget.assetType == 'livestock') {
                budget.data.details.calculatedLSU = budget.data.details.herdSize *
                    _conversionRate[getBaseAnimal(budget.commodityType)][_representativeAnimal[getBaseAnimal(budget.commodityType)]];
            }

            var income = 0;
            var costs = 0;
            budget.data.sections.forEach(function(section, i) {
                section.total = {
                    value: 0
                };

                if(budget.assetType == 'livestock') {
                    section.total.valuePerLSU = 0;
                }

                section.productCategoryGroups.forEach(function(group, j) {
                    group.total = {
                        value: 0
                    };

                    if(budget.assetType == 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    group.productCategories.forEach(function(category, k) {
                        if(category.unit == '%') {
                            var groupSum = underscore
                                .chain(budget.data.sections)
                                .filter(function (groupingSection) {
                                    return (budget.assetType != 'horticulture' || groupingSection.horticultureStage === section.horticultureStage);
                                })
                                .pluck('productCategoryGroups')
                                .flatten()
                                .reduce(function(total, group) {
                                    return (group.name == category.incomeGroup && group.total !== undefined ? total + group.total.value : total);
                                }, 0)
                                .value();

                            category.value = (category.pricePerUnit || 0) * groupSum / 100;
                        } else {
                            category.quantity = (category.unit == 'Total' ? 1 : category.quantity);
                            category.value = (category.pricePerUnit || 0) * (category.quantity || 0);
                        }

                        if(budget.assetType == 'livestock') {
                            category.valuePerLSU = (category.pricePerUnit || 0) / _conversionRate[getBaseAnimal(budget.commodityType)][category.name];
                            group.total.valuePerLSU += category.valuePerLSU;
                        }

                        var schedule = (category.schedule && budget.data.schedules[category.schedule] ?
                            budget.data.schedules[category.schedule] :
                            underscore.range(12).map(function () {
                                return 100 / 12;
                            }));

                        category.valuePerMonth = underscore.map(schedule, function (month) {
                            return (month / 100) * category.value;
                        });

                        group.total.value += category.value;
                        group.total.valuePerMonth = (group.total.valuePerMonth ?
                            underscore.map(group.total.valuePerMonth, function (month, i) {
                                return month + category.valuePerMonth[i];
                            }) : category.valuePerMonth);
                    });

                    section.total.value += group.total.value;
                    section.total.valuePerMonth = (section.total.valuePerMonth ?
                        underscore.map(section.total.valuePerMonth, function (month, i) {
                            return month + group.total.valuePerMonth[i];
                        }) : group.total.valuePerMonth);

                    if(budget.assetType == 'livestock') {
                        section.total.valuePerLSU += group.total.valuePerLSU;
                    }
                });

                if(section.name == 'Income') {
                    income = section.total.value;
                } else {
                    costs += section.total.value;
                }
            });

            budget.data.details.grossProfit = income - costs;

            if(budget.assetType == 'horticulture') {
                budget.data.details.grossProfitByStage = {};

                angular.forEach(_horticultureStages[budget.commodityType], function(stage) {
                    budget.data.details.grossProfitByStage[stage] = underscore
                        .chain(budget.data.sections)
                        .where({horticultureStage: stage})
                        .reduce(function (total, section) {
                            return (section.name === 'Income' ? total + section.total.value :
                                (section.name === 'Expenses' ? total - section.total.value : total));
                        }, 0)
                        .value();
                });
            }

            if(budget.assetType == 'livestock') {
                budget.data.details.grossProfitPerLSU = budget.data.details.grossProfit / budget.data.details.calculatedLSU;
            }

            return budget;
        }
    }
}]);
var sdkHelperExpenseApp = angular.module('ag.sdk.helper.expense', ['ag.sdk.library']);

sdkHelperExpenseApp.factory('expenseHelper', ['underscore', function (underscore) {
    var _expenseTypes = {
        area: 'Area',
        distance: 'Distance',
        hours: 'Hours'
    };

    var _expenseUnits = {
        area: 'ha',
        distance: 'km',
        hours: 'h'
    };

    var _expenseAction = {
        area: 'inspected',
        distance: 'travelled',
        hours: 'worked'
    };

    return {
        expenseTypes: function () {
            return _expenseTypes;
        },

        getExpenseTitle: function (type) {
            return _expenseTypes[type] || '';
        },
        getExpenseUnit: function (type) {
            return _expenseUnits[type] || '';
        },
        getExpenseAction: function (type) {
            return _expenseAction[type] || '';
        }
    };
}]);
var sdkHelperFarmerApp = angular.module('ag.sdk.helper.farmer', ['ag.sdk.interface.map', 'ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperFarmerApp.factory('farmerHelper', ['attachmentHelper', 'geoJSONHelper', 'underscore', function(attachmentHelper, geoJSONHelper, underscore) {
    var _listServiceMap = function (item) {
        typeColorMap = {
            'error': 'danger',
            'information': 'info',
            'warning': 'warning'
        };
        var flagLabels = underscore.chain(item.activeFlags)
            .groupBy(function(activeFlag) {
                return activeFlag.flag.type;
            })
            .map(function (group, type) {
                var hasOpen = false;
                angular.forEach(group, function(activeFlag) {
                    if(activeFlag.status == 'open') {
                        hasOpen = true;
                    }
                });
                return {
                    label: typeColorMap[type],
                    count: group.length,
                    hasOpen: hasOpen
                }
            })
            .value();

        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.operationType,
            thumbnailUrl: attachmentHelper.findSize(item, 'thumb', 'img/profile-business.png'),
            searchingIndex: searchingIndex(item),
            flags: flagLabels
        };

        function searchingIndex(item) {
            var index = [];

            angular.forEach(item.legalEntities, function(entity) {
                index.push(entity.name);

                if(entity.registrationNumber) {
                    index.push(entity.registrationNumber);
                }
            });

            return index;
        }
    };

    var _businessEntityTypes = ['Commercial', 'Recreational', 'Smallholder'];
    var _businessEntityDescriptions = {
        Commercial: 'Large scale agricultural production',
        Recreational: 'Leisure or hobby farming',
        Smallholder: 'Small farm, limited production'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        businessEntityTypes: function() {
            return _businessEntityTypes;
        },

        getBusinessEntityDescription: function (businessEntity) {
            return _businessEntityDescriptions[businessEntity] || '';
        },
        getFarmerLocation: function(farmer) {
            if (farmer) {
                if (farmer.data && farmer.data.loc) {
                    return (farmer.data.loc.geometry ? farmer.data.loc.geometry.coordinates : farmer.data.loc.coordinates);
                } else if (farmer.legalEntities) {
                    var geojson = geoJSONHelper();

                    angular.forEach(farmer.legalEntities, function (entity) {
                        if (entity.assets) {
                            angular.forEach(entity.assets, function (asset) {
                                geojson.addGeometry(asset.data.loc);
                            });
                        }
                    });

                    return geojson.getCenter().reverse();
                }
            }

            return null;
        },
        isFarmerActive: function(farmer) {
            return (farmer && farmer.status == 'active');
        }
    }
}]);

sdkHelperFarmerApp.factory('legalEntityHelper', ['attachmentHelper', 'underscore', function (attachmentHelper, underscore) {
    var _listServiceMap = function(item) {
        var map = {
            id: item.id || item.$id,
            title: item.name,
            subtitle: item.type
        };

        map.thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/profile-user.png');

        return map;
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietary', 'Joint account', 'Partnership', 'Close Corporation', 'Private Company', 'Public Company', 'Trust', 'Non-Profitable companies', 'Cooperatives', 'In- Cooperatives', 'Other Financial Intermediaries'];

    // When updating, also update the _commodities list in the enterpriseBudgetHelper
    var _enterpriseTypes = {
        'Field Crops': [
          'Barley',
          'Bean',
          'Bean (Broad)',
          'Bean (Dry)',
          'Bean (Sugar)',
          'Bean (Green)',
          'Bean (Kidney)',
          'Canola',
          'Cassava',
          'Cotton',
          'Cowpea',
          'Grain Sorghum',
          'Groundnut',
          'Lucerne',
          'Maize',
          'Maize (White)',
          'Maize (Yellow)',
          'Oat',
          'Peanut',
          'Pearl Millet',
          'Potato',
          'Rape',
          'Rice',
          'Rye',
          'Soya Bean',
          'Sunflower',
          'Sweet Corn',
          'Sweet Potato',
          'Tobacco',
          'Triticale',
          'Wheat',
          'Wheat (Durum)'
        ],
        'Grazing': [
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
          'Weeping Lovegrass'],
        'Horticulture': [
          'Almond',
          'Aloe',
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
          'Cloudberry',
          'Coconut',
          'Coffee',
          'Fig',
          'Gooseberry',
          'Grape',
          'Grape (Bush Vine)',
          'Grape (Red)',
          'Grape (Table)',
          'Grape (White)',
          'Grapefruit',
          'Guava',
          'Hops',
          'Kiwi Fruit',
          'Lemon',
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
          'Pomegranate',
          'Prickly Pear',
          'Pecan Nut',
          'Persimmon',
          'Pineapple',
          'Pistachio Nut',
          'Plum',
          'Protea',
          'Raspberry',
          'Rooibos',
          'Sisal',
          'Strawberry',
          'Sugarcane',
          'Tea',
          'Walnut',
          'Wineberry'
        ],
        'Livestock': [
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
          'Sheep (Extensive)',
          'Sheep (Feedlot)',
          'Sheep (Stud)'
        ],
        'Plantation': [
          'Bluegum',
          'Pine',
          'Wattle'
        ]
    };

    /**
     * @name EnterpriseEditor
     * @param enterprises
     * @constructor
     */
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

        if (this.enterprises.indexOf(enterprise) == -1) {
            this.enterprises.push(enterprise);
            this.selection.item = undefined;
        }
    };

    EnterpriseEditor.prototype.removeEnterprise = function (item) {
        if (typeof item == 'string') {
            item = this.enterprises.indexOf(item);
        }

        if (item !== -1) {
            this.enterprises.splice(item, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        legalEntityTypes: function() {
            return _legalEntityTypes;
        },
        enterpriseTypes: function () {
            return _enterpriseTypes;
        },

        enterpriseEditor: function (enterprises) {
            return new EnterpriseEditor(enterprises);
        }
    }
}]);

sdkHelperFarmerApp.factory('landUseHelper', function() {
    var _croppingPotentialTypes = ['High', 'Medium', 'Low'];
    var _effectiveDepthTypes = ['0 - 30cm', '30 - 60cm', '60 - 90cm', '90 - 120cm', '120cm +'];
    var _irrigationTypes = ['Centre-Pivot', 'Flood', 'Micro', 'Sub-drainage', 'Sprinkler', 'Drip'];
    var _landUseTypes = ['Cropland', 'Grazing', 'Horticulture (Intensive)', 'Horticulture (Perennial)', 'Horticulture (Seasonal)', 'Housing', 'Plantation', 'Planted Pastures', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland', 'Conservation'];
    var _soilTextureTypes = ['Sand', 'Loamy Sand', 'Clay Sand', 'Sandy Loam', 'Fine Sandy Loam', 'Loam', 'Silty Loam', 'Sandy Clay Loam', 'Clay Loam', 'Clay', 'Gravel', 'Other', 'Fine Sandy Clay', 'Medium Sandy Clay Loam', 'Fine Sandy Clay Loam', 'Loamy Medium Sand', 'Medium Sandy Loam', 'Coarse Sandy Clay Loam', 'Coarse Sand', 'Loamy Fine Sand', 'Loamy Coarse Sand', 'Fine Sand', 'Silty Clay', 'Coarse Sandy Loam', 'Medium Sand', 'Medium Sandy Clay', 'Coarse Sandy Clay', 'Sandy Clay'];
    var _terrainTypes = ['Plains', 'Mountains'];
    var _waterSourceTypes = ['Irrigation Scheme', 'River', 'Dam', 'Borehole'];

    var _pipLandUseConvertion = {
        'Crops': 'Cropland',
        'Orchards': 'Horticulture (Perennial)',
        'Plantations': 'Plantation',
        'Vineyards': 'Horticulture (Perennial)'
    };

    return {
        croppingPotentialTypes: function () {
            return _croppingPotentialTypes;
        },
        effectiveDepthTypes: function () {
            return _effectiveDepthTypes;
        },
        irrigationTypes: function () {
            return _irrigationTypes;
        },
        landUseTypes: function () {
            return _landUseTypes;
        },
        soilTextureTypes: function () {
            return _soilTextureTypes;
        },
        terrainTypes: function () {
            return _terrainTypes;
        },
        waterSourceTypes: function () {
            return _waterSourceTypes;
        },
        isCroppingPotentialRequired: function (landUse) {
            return (landUse == 'Cropland');
        },
        isTerrainRequired: function (landUse) {
            return (landUse == 'Grazing');
        },
        getPipLandUseType: function (pipLandUse) {
            return _pipLandUseConvertion[pipLandUse];
        }
    }
});

sdkHelperFarmerApp.factory('farmHelper', ['geoJSONHelper', 'geojsonUtils', 'underscore', function(geoJSONHelper, geojsonUtils, underscore) {
    var _listServiceMap = function(item) {
        return {
            id: item.id || item.$id,
            title: item.name
        };
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },

        containsPoint: function (geometry, assets, farm) {
            var found = false;

            angular.forEach(assets, function (asset) {
                if(asset.type == 'farmland' && asset.farmId && asset.farmId == farm.id) {
                    if (geojsonUtils.pointInPolygon(geometry, asset.data.loc)) {
                        found = true;
                    }
                }
            });

            return found;
        },
        getCenter: function (farmer, farm) {
            var geojson = geoJSONHelper();

            underscore
                .chain(farmer.legalEntities)
                .pluck('assets')
                .flatten()
                .compact()
                .each(function (asset) {
                    if(asset.type == 'farmland' && asset.farmId && asset.farmId == farm.id) {
                        geojson.addGeometry(asset.data.loc);
                    }
                });

            return geojson.getCenterAsGeojson();
        },

        validateFieldName: function (farm, newField, oldField) {
            newField.fieldName = (newField.fieldName ? newField.fieldName.trim().replace(/[^0-9A-Za-z\s]/g, '') : '');
            var foundField = underscore.find(farm.data.fields, function (field) {
                return (field.fieldName.toUpperCase().replace(/[^0-9A-Z]/g, '') === newField.fieldName.toUpperCase().replace(/[^0-9A-Z]/g, ''))
            });

            return (angular.isObject(foundField) ? (angular.isObject(oldField) && foundField.fieldName === oldField.fieldName) : true);
        }
    }
}]);

var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', function(documentHelper) {
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

        map.referenceId = item.referenceType == 'farmer' ? item.organization.id : item[item.referenceType + 'Id'];

        if (item.referenceType == 'farmer') {
            if (item.action == 'invite') {
                map.subtitle += item.organization.name + ' to create an Agrista account';
            } else if (item.action == 'register') {
                map.subtitle += 'your request to join Agrista';
            } else if (item.action == 'create') {
                map.subtitle += 'a customer portfolio for ' + item.organization.name;
            } else if (item.action == 'decline') {
                map.subtitle += 'a task for ' + item.organization.name;
            } else {
                map.subtitle += 'the portfolio of ' + item.organization.name;
            }

            map.referenceState = 'customer.details';
        } else {
            if (item[item.referenceType] !== undefined) {
                if (item.referenceType == 'document') {
                    map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + documentHelper.getDocumentTitle(item[item.referenceType].docType) + ' ' + item.referenceType;
                    map.referenceState = 'document.details';
                } else if (item.referenceType == 'task') {
                    map.subtitle += 'the ' + taskHelper.getTaskTitle(item[item.referenceType].todo) + ' ' + item.referenceType;
                    map.referenceState = documentHelper.getTaskState(item[item.referenceType].todo);
                } else {
                    map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
                }
            } else {
                map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
            }

            if (item.actor && item.organization && item.organization.name) {
                map.subtitle += ' ' + _getActionPreposition(item.action) + ' ' + item.organization.name;
            }
        }

        return map;
    };

    var _getActionPreposition = function (action) {
        return _actionPrepositionExceptionMap[action] || 'for';
    };

    var _getActionVerb = function (action) {
        var vowels = ['a', 'e', 'i', 'o', 'u'];

        return _actionVerbExceptionMap[action] || (action.lastIndexOf('e') == action.length - 1 ? action + 'd' : action.lastIndexOf('y') == action.length - 1 ? (vowels.indexOf(action.substr(action.length - 1, action.length)) == -1 ? action.substr(0, action.length - 1)  + 'ied' : action + 'ed') : action + 'ed');
    };

    var _getReferenceArticle = function (reference) {
        var vowels = ['a', 'e', 'i', 'o', 'u'];

        return _referenceArticleExceptionMap[reference] || (vowels.indexOf(reference.substr(0, 1)) != -1 ? 'an' : 'a');
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

sdkHelperFavouritesApp.factory('notificationHelper', ['taskHelper', 'documentHelper', function (taskHelper, documentHelper) {
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

var sdkHelperMerchantApp = angular.module('ag.sdk.helper.merchant', ['ag.sdk.library']);

sdkHelperMerchantApp.factory('merchantHelper', ['underscore', function (underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: (item.subscriptionPlan ? getSubscriptionPlan(item.subscriptionPlan) + ' ' : '') + (item.partnerType ? getPartnerType(item.partnerType) + ' partner' : ''),
            status: (item.registered ? {text: 'registered', label: 'label-success'} : false)
        }
    };

    var _partnerTypes = {
        benefit: 'Benefit',
        standard: 'Standard'
    };

    var _subscriptionPlans = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        association: 'Association'
    };

    var getPartnerType = function (type) {
        return _partnerTypes[type] || '';
    };

    var getSubscriptionPlan = function (plan) {
        return _subscriptionPlans[plan] || '';
    };

    /**
     * @name ServiceEditor
     * @param availableServices
     * @param services
     * @constructor
     */
    function ServiceEditor (/**Array=*/availableServices, /**Array=*/services) {
        availableServices = availableServices || [];

        this.services = underscore.map(services || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            list: availableServices,
            mode: (availableServices.length == 0 ? 'add' : 'select'),
            text: ''
        };
    }

    ServiceEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode == 'select' ? 'add' : 'select');
            this.selection.text = '';
        }
    };

    ServiceEditor.prototype.addService = function (service) {
        service = service || this.selection.text;

        if (this.services.indexOf(service) == -1) {
            this.services.push(service);
            this.selection.text = '';
        }
    };

    ServiceEditor.prototype.removeService = function (indexOrService) {
        if (typeof indexOrService == 'string') {
            indexOrService = this.services.indexOf(indexOrService);
        }

        if (indexOrService !== -1) {
            this.services.splice(indexOrService, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },

        partnerTypes: function() {
            return _partnerTypes;
        },
        getPartnerType: getPartnerType,
        subscriptionPlans: function() {
            return _subscriptionPlans;
        },
        getSubscriptionPlan: getSubscriptionPlan,

        serviceEditor: function (/**Array=*/availableServices, /**Array=*/services) {
            return new ServiceEditor(availableServices, services);
        }
    }
}]);

var sdkHelperProductionPlanApp = angular.module('ag.sdk.helper.production-plan', []);

sdkHelperProductionPlanApp.factory('productionPlanHelper', [function () {
    var _assetTypeMap = {
        'crop': ['Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'horticulture': ['Horticulture (Perennial)']
    };

    return {
        isFieldApplicable: function (field) {
            return (this.getAssetType(field) !== undefined);
        },

        getAssetType: function (field) {
            var assetType;

            angular.forEach(_assetTypeMap, function (fieldTypes, type) {
                if (fieldTypes.indexOf(field.landUse) !== -1) {
                    assetType = type;
                }
            });

            return assetType;
        }
    }
}]);
var sdkHelperRegionApp = angular.module('ag.sdk.helper.region', []);

sdkHelperRegionApp.factory('regionHelper', [function() {
    var _listServiceMap = function(item) {
        var map = {
            title: item.name,
            subtitle: item.region.province,
            region: item.region.name
        };
        if(item.subRegionNumber) {
            map.subtitle += ' - ' +item.subRegionNumber;
        }
        if(item.plotCode) {
            map.subtitle += ' - ' +item.plotCode;
        }

        return map;
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);
var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.authorization', 'ag.sdk.utilities', 'ag.sdk.interface.list', 'ag.sdk.library']);

sdkHelperTaskApp.provider('taskHelper', ['underscore', function (underscore) {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = item.documentKey;
        var mappedItems = underscore.filter(item.subtasks, function (task) {
            return (task.type && _validTaskStatuses.indexOf(task.status) !== -1 && task.type == 'child');
        }).map(function (task) {
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
            });

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

        return (taskMap !== undefined ? (typeof taskMap.title == 'string' ? taskMap.title : taskMap.title(task)) : undefined);
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
                    return (_getTaskState(task.todo) !== undefined && underscore.contains(excludeStatus, task.status) == false);
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
                        return (task && task.assignedTo == currentUser.username);
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

var sdkHelperTeamApp = angular.module('ag.sdk.helper.team', ['ag.sdk.library']);

sdkHelperTeamApp.factory('teamHelper', ['underscore', function (underscore) {

    /**
     * @name TeamEditor
     * @param availableTeams
     * @param teams
     * @constructor
     */
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
            mode: (availableTeams.length == 0 ? 'add' : 'select'),
            text: ''
        };

        this.filterList();
    }

    TeamEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode == 'select' ? 'add' : 'select');
            this.selection.text = '';
        }
    };

    TeamEditor.prototype.addTeam = function (team) {
        team = team || this.selection.text;

        if (this.teams.indexOf(team) == -1) {
            this.teams.push(team);
            this.teamsDetails.push(underscore.findWhere(this.selection.list, {name: team}));
            this.selection.text = '';
            this.filterList();
        }
    };

    TeamEditor.prototype.removeTeam = function (indexOrTeam) {
        if (typeof indexOrTeam == 'string') {
            indexOrTeam = this.teams.indexOf(indexOrTeam);
        }

        if (indexOrTeam !== -1) {
            this.teams.splice(indexOrTeam, 1);
            this.teamsDetails.splice(indexOrTeam, 1);
            this.selection.text = '';
            this.filterList();
        }
    };

    return {
        teamEditor: function (/**Array=*/availableTeams, /**Array=*/teams) {
            return new TeamEditor(availableTeams, teams);
        }
    }
}]);

var sdkHelperUserApp = angular.module('ag.sdk.helper.user', []);

sdkHelperUserApp.factory('userHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.$id,
            title: item.firstName + ' ' + item.lastName,
            subtitle: item.position,
            teams: item.teams
        }
    };

    var _languageList = ['English'];

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        languageList: function() {
            return _languageList;
        }
    }
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

    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if(toParams.id) {
            _setActiveItem(toParams.id);
        } else {
            _setActiveItem(toParams.type);
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

var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.config', 'ag.sdk.library']);

/*
 * GeoJson
 */
sdkInterfaceMapApp.factory('geoJSONHelper', function () {
    function GeojsonHelper(json, properties) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json, properties);
        }

        this.addGeometry(json, properties);
    }

    function _recursiveCoordinateFinder (bounds, coordinates) {
        if (coordinates) {
            if (angular.isArray(coordinates[0])) {
                angular.forEach(coordinates, function(coordinate) {
                    _recursiveCoordinateFinder(bounds, coordinate);
                });
            } else if (angular.isArray(coordinates)) {
                bounds.push([coordinates[1], coordinates[0]]);
            }
        }
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
        getBounds: function () {
            var bounds = [];

            if (this._json) {
                var features = this._json.features || [this._json];

                angular.forEach(features, function(feature) {
                    var geometry = feature.geometry || feature;

                    _recursiveCoordinateFinder(bounds, geometry.coordinates);
                });
            }

            return bounds;
        },
        getBoundingBox: function (bounds) {
            bounds = bounds || this.getBounds();

            var lat1 = 0, lat2 = 0,
                lng1 = 0, lng2 = 0;

            angular.forEach(bounds, function(coordinate, index) {
                if (index == 0) {
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
        getCenter: function (bounds) {
            var boundingBox = this.getBoundingBox(bounds);

            return [boundingBox[0][0] + ((boundingBox[1][0] - boundingBox[0][0]) / 2), boundingBox[0][1] + ((boundingBox[1][1] - boundingBox[0][1]) / 2)];
        },
        getCenterAsGeojson: function (bounds) {
            return {
                coordinates: this.getCenter(bounds).reverse(),
                type: 'Point'
            }
        },
        getProperty: function (name) {
            return (this._json && this._json.properties ? this._json.properties[name] : undefined);
        },
        setCoordinates: function (coordinates) {
            if (this._json && this._json.type != 'FeatureCollection') {
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
                if (_this._json.type != 'FeatureCollection' && _this._json.type != 'Feature') {
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
        addGeometry: function (geometry, properties) {
            if (geometry) {
                if (this._json === undefined) {
                    this._json = geometry;

                    this.addProperties(properties);
                } else {
                    if (this._json.type != 'FeatureCollection' && this._json.type != 'Feature') {
                        this._json = {
                            type: 'Feature',
                            geometry: this._json
                        };
                    }

                    if (this._json.type == 'Feature') {
                        this._json = {
                            type: 'FeatureCollection',
                            features: [this._json]
                        };
                    }

                    if (this._json.type == 'FeatureCollection') {
                        this._json.features.push({
                            type: 'Feature',
                            geometry: geometry,
                            properties: properties
                        });
                    }
                }
            }

            return this;
        },
        formatGeoJson: function (geoJson, toType) {
            // TODO: REFACTOR
            //todo: maybe we can do the geoJson formation to make it standard instead of doing the validation.
            if(toType.toLowerCase() == 'point') {
                switch (geoJson && geoJson.type && geoJson.type.toLowerCase()) {
                    // type of Feature
                    case 'feature':
                        if(geoJson.geometry && geoJson.geometry.type && geoJson.geometry.type == 'Point') {
                            console.log(geoJson.geometry);
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
            if(!geoJson || geoJson.type == undefined || typeof geoJson.type != 'string' || (typeRestriction && geoJson.type.toLowerCase() != typeRestriction)) {
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
                    flattenedCoordinates.forEach(function(element, i) {
                        if(typeof element != 'number') {
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
});

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

sdkInterfaceMapApp.provider('mapStyleHelper', ['mapMarkerHelperProvider', function (mapMarkerHelperProvider) {
    var _markerIcons = {
        asset: mapMarkerHelperProvider.getMarkerStates('asset', ['default', 'success', 'error']),
        zone: mapMarkerHelperProvider.getMarkerStates('marker', ['default', 'success', 'error'])
    };

    var _mapStyles = {
        foreground: {
            district: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.5
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
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
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
            'permanent crop': {
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
            zone: {
                icon: _markerIcons.zone.success,
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            farmgate: {
                icon: 'success'
            },
            homestead: {
                icon: 'success'
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
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
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
            'permanent crop': {
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
            zone: {
                icon: _markerIcons.zone.default,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.5,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            },
            farmgate: {
                icon: 'default'
            },
            homestead: {
                icon: 'default',
                label: {
                    message: 'Homestead'
                }
            }
        }
    };

    var _getStyle = this.getStyle = function (composition, layerName, label) {
        var mapStyle = (_mapStyles[composition] && _mapStyles[composition][layerName] ? angular.copy(_mapStyles[composition][layerName]) : {});

        if (typeof mapStyle.icon == 'string') {
            if (_markerIcons[layerName] === undefined) {
                _markerIcons[layerName] = mapMarkerHelperProvider.getMarkerStates(layerName, ['default', 'success', 'error']);
            }

            mapStyle.icon = _markerIcons[layerName][mapStyle.icon];
        }

        if (typeof label == 'object') {
            mapStyle.label = label;
        }

        return mapStyle;
    };

    var _setStyle = this.setStyle = function(composition, layerName, style) {
        _mapStyles[composition] = _mapStyles[composition] || {};
        _mapStyles[composition][layerName] = style;
    };

    this.$get = function() {
        return {
            getStyle: _getStyle,
            setStyle: _setStyle
        }
    };
}]);

/**
 * Maps
 */
sdkInterfaceMapApp.provider('mapboxService', ['underscore', function (underscore) {
    var _defaultConfig = {
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
                    tiles: 'agrista.f9f5628d',
                    type: 'mapbox'
                },
                'Satellite': {
                    tiles: 'agrista.a7235891',
                    type: 'mapbox'
                },
                'Hybrid': {
                    tiles: 'agrista.01e3fb18',
                    type: 'mapbox'
                },
                'Light': {
                    tiles: 'agrista.e7367e07',
                    type: 'mapbox'
                },
                'Production Regions': {
                    tiles: 'agrista.87ceb2ab',
                    type: 'mapbox'
                }
            },
            overlays: {}
        },
        controls: {},
        events: {},
        view: {
            coordinates: [-28.691, 24.714],
            zoom: 6
        },
        bounds: {},
        leafletLayers: {},
        layers: {},
        geojson: {}
    };

    var _instances = {};
    
    this.config = function (options) {
        _defaultConfig = underscore.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$rootScope', '$timeout', 'objectId', 'safeApply', function ($rootScope, $timeout, objectId, safeApply) {
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

            _this._config = angular.copy(_defaultConfig);
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
                    _this._config = angular.copy(_defaultConfig);
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
                this._config = angular.copy(_defaultConfig);

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

                        handler(layer);
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
            addPhotoMarker: function(layerName, geojson, options, properties, onAddCallback) {
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

                        if (typeof onAddCallback == 'function') {
                            onAddCallback(feature, featureLayer);
                        }
                    }
                };

                data.properties.isMedia = true;

                _this.enqueueRequest('mapbox-' + _this._id + '::add-photo-marker', data, function () {
                    _this._config.geojson[layerName] = _this._config.geojson[layerName] || {};
                    _this._config.geojson[layerName][properties.featureId] = data;
                });

                return properties.featureId;
            },
            removeGeoJSONFeature: function(layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + this._id + '::remove-geojson-feature', this._config.geojson[layerName][featureId], function () {
                        delete _this._config.geojson[layerName][featureId];
                    });
                }
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

            if (_instances[id] === undefined) {
                _instances[id] = new MapboxServiceInstance(id, options);
            }

            if (options.clean === true) {
                _instances[id].reset();
            }

            return _instances[id];
        };
    }];
}]);

/**
 * mapbox
 */
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', '$log', '$timeout', 'configuration', 'mapboxService', 'geoJSONHelper', 'mapStyleHelper', 'objectId', 'underscore', function ($rootScope, $http, $log, $timeout, configuration, mapboxService, geoJSONHelper, mapStyleHelper, objectId, underscore) {
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

        // photoMarker
        scope.$on('mapbox-' + id + '::add-photo-marker', function (event, args) {
            _this.addPhotoMarker(args);
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
//            setTimeout(function () {
//                sidebar.show();
//            }, 500);
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
            if (baselayer.type == 'tile') {
                baselayer.layer = L.tileLayer(baselayer.tiles);
            } else if (baselayer.type == 'mapbox') {
                baselayer.layer = L.mapbox.tileLayer(baselayer.tiles);
            } else if (baselayer.type == 'google' && typeof L.Google === 'function') {
                baselayer.layer = new L.Google(baselayer.tiles);
            }

            if (name === this._layerControls.baseTile || show) {
                baselayer.layer.addTo(this._map);
            }

            this._layerControls.baseLayers[name] = baselayer;
            this._layerControls.control.addBaseLayer(baselayer.layer, name);
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
        var toLayer = this._layers[toLayerName],
            added = false;
        
        if (toLayer) {
            added = (this._layers[name] == undefined);
            this._layers[name] = layer;

            toLayer.addLayer(layer);
        }

        return added;
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

        if (fromLayer) {
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
            label.setLatLng(geojson.getCenter());

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

    Mapbox.prototype.addPhotoMarker = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName, item.type, item.options);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var image = item;
        var icon = {
            iconSize: [40, 40],
            className: 'leaflet-marker-agrista-photo'
        };
        var fancyboxOptions = {
            helpers: {
                overlay : {
                    css : {
                        'background' : 'rgba(0,0,0,0.7)'
                    }
                }
            },
            aspectRatio: true,
            autoSize: false,
            width: 640,
            height: 640
        };

        L.geoJson(geojson.getJson(), {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {
                    icon: L.icon(L.extend({
                        iconUrl: image.geojson.properties.data.src
                    }, icon)),
                    title: image.caption || ''
                });
            },
            onEachFeature: function(feature, layer) {
                var added = _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);

                if (added && typeof item.handler === 'function') {
                    item.handler(_this._layers[item.layerName], feature, layer);
                }

                layer.on('click', function(e) {
                    //todo: video
                    //image
                    $.fancybox({
                        href: feature.properties.data.src,
                        title: (feature.properties.data.photoDate || feature.properties.data.uploadDate)
                            + ' @ ' + feature.geometry.coordinates[1].toFixed(4) + (feature.geometry.coordinates[1] > 0 ? ' N' : ' S')
                            + ' ' + feature.geometry.coordinates[0].toFixed(4)+ (feature.geometry.coordinates[0] > 0 ? ' E' : '  W'),
                        type: 'image'
                    }, fancyboxOptions);
                });
            }
        });
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
        if (this._geoJSON[data.layerName] && this._geoJSON[data.layerName][data.properties.featureId]) {
            this.removeLayerFromLayer(data.properties.featureId, data.layerName);
            
            delete this._geoJSON[data.layerName][data.properties.featureId];
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
            this._map.removeControl(this._draw.controls.polyline);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.polygon);
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
                polyline: true,
                polygon: true,
                marker: true
            };

            this._editableFeature.eachLayer(function(layer) {
                if(layer.feature && layer.feature.geometry && layer.feature.geometry.type) {
                    switch(layer.feature.geometry.type) {
                        case 'LineString':
                            controlRequirement.polyline = false;
                            break;
                        case 'Polygon':
                            controlRequirement.polygon = false;
                            break;
                        case 'Point':
                            controlRequirement.marker = false;
                            break;
                    }
                }
            });

            if (this._draw.controlOptions.exclude) {
                if(controlRequirement.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(controlRequirement.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(controlRequirement.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            } else {
                if(this._draw.controls.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(this._draw.controls.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
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
            $http.get(host + 'api/geo/portion-polygon' + params)
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
            $http.get(host + 'api/geo/portion-polygon' + params)
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
            $http.get(host + 'api/geo/district-polygon' + params)
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
            $http.get(host + 'api/geo/district-polygon' + params)
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
            $http.get(host + 'api/geo/field-polygon' + params)
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
            $http.get(host + 'api/geo/field-polygon' + params)
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

        switch (e.layerType) {
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

                angular.forEach(e.layer._latlngs, function (latlngs) {
                    geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
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

    this.$get = ['$rootScope', '$state', 'authorization', function($rootScope, $state, authorization) {
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
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
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
            selectItem: function (id) {
                $rootScope.$broadcast('navigation::item__selected', id);

                return $state.go(id);
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
                width = $attrs.width || 100,
                xExtent = $attrs.xExtent,
                height = $attrs.height || 20,
                yExtent = $attrs.yExtent || 100,
                interpolate = $attrs.interpolate || 'step-before',
                svg = d3.select($element[0]).append('svg').attr('width', width).attr('height', height),
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
                $scope.data.unshift({x: -1, y: 0});

                xFn.domain(xExtent && xExtent != 0 ? [0, xExtent] : d3.extent($scope.data, function (d) {
                    return d.x;
                }));

                yFn.domain(yExtent && yExtent != 0 ? [0, yExtent] : d3.extent($scope.data, function (d) {
                    return d.y;
                }));

                area.attr('d', areaFn($scope.data));
                line.attr('d', lineFn($scope.data));
            }
        }
    }
}]);

var sdkModelAsset = angular.module('ag.sdk.model.asset', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelAsset.factory('Asset', ['$filter', 'attachmentHelper', 'computedProperty', 'inheritModel', 'Liability', 'Model', 'moment', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function ($filter, attachmentHelper, computedProperty, inheritModel, Liability, Model, moment, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {
        function Asset (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            privateProperty(this, 'generateKey', function (legalEntity, farm) {
                this.assetKey = (legalEntity ? 'entity.' + legalEntity.uuid : '') +
                (this.type !== 'farmland' && farm ? '-f.' + farm.name : '') +
                (this.type === 'crop' && this.data.season ? '-s.' + this.data.season : '') +
                (this.data.fieldName ? '-fi.' + this.data.fieldName : '') +
                (this.data.crop ? '-c.' + this.data.crop : '') +
                (this.type === 'cropland' && this.data.irrigated ? '-i.' + this.data.irrigation : '') +
                (this.type === 'farmland' && this.data.sgKey ? '-' + this.data.sgKey : '') +
                (this.type === 'improvement' || this.type === 'livestock' || this.type === 'vme' ?
                (this.data.type ? '-t.' + this.data.type : '') +
                (this.data.category ? '-c.' + this.data.category : '') +
                (this.data.name ? '-n.' + this.data.name : '') +
                (this.data.purpose ? '-p.' + this.data.purpose : '') +
                (this.data.model ? '-m.' + this.data.model : '') +
                (this.data.identificationNo ? '-in.' + this.data.identificationNo : '') : '') +
                (this.data.waterSource ? '-ws.' + this.data.waterSource : '') +
                (this.type === 'other' ? (this.data.name ? '-n.' + this.data.name : '') : '');

                return this.assetKey;
            });

            privateProperty(this, 'getPhoto', function () {
                return attachmentHelper.findSize(this, 'thumb', 'img/camera.png');
            });

            privateProperty(this, 'getTitle', function (withField, farm) {
                return getTitle(this, withField, farm);
            });

            computedProperty(this, 'age', function (asOfDate) {
                return (this.data.establishedDate ? moment(asOfDate).diff(this.data.establishedDate, 'years', true) : 0);
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

            // Crop
            privateProperty(this, 'availableCrops', function () {
                return Asset.cropsByType[this.type] || [];
            });

            computedProperty(this, 'crop', function () {
                return this.data.crop;
            });

            computedProperty(this, 'establishedDate', function () {
                return this.data.establishedDate;
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
                    return total + (value || 0);
                }, 0);
            });

            privateProperty(this, 'totalLiabilityInRange', function (rangeStart, rangeEnd) {
                return underscore.reduce(this.liabilities, function (total, liability) {
                    return total + liability.totalLiabilityInRange(rangeStart, rangeEnd);
                }, 0);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assetKey = attrs.assetKey;
            this.farmId = attrs.farmId;
            this.legalEntityId = attrs.legalEntityId;

            this.liabilities = underscore.map(attrs.liabilities, function (liability) {
                return Liability.newCopy(liability);
            });

            this.productionSchedules = underscore.map(attrs.productionSchedules, function (schedule) {
                return ProductionSchedule.newCopy(schedule);
            });

            this.type = attrs.type;
        }

        inheritModel(Asset, Model.Base);

        readOnlyProperty(Asset, 'assetTypes', {
            'crop': 'Crops',
            'farmland': 'Farmlands',
            'improvement': 'Fixed Improvements',
            'cropland': 'Cropland',
            'livestock': 'Livestock',
            'pasture': 'Pastures',
            'permanent crop': 'Permanent Crops',
            'plantation': 'Plantations',
            'vme': 'Vehicles, Machinery & Equipment',
            'wasteland': 'Homestead & Wasteland',
            'water right': 'Water Rights'
        });

        var _croplandCrops = [
          'Barley',
          'Bean',
          'Bean (Broad)',
          'Bean (Dry)',
          'Bean (Sugar)',
          'Bean (Green)',
          'Bean (Kidney)',
          'Canola',
          'Cassava',
          'Cotton',
          'Cowpea',
          'Grain Sorghum',
          'Groundnut',
          'Lucerne',
          'Maize',
          'Maize (White)',
          'Maize (Yellow)',
          'Oat',
          'Peanut',
          'Pearl Millet',
          'Potato',
          'Rape',
          'Rice',
          'Rye',
          'Soya Bean',
          'Sunflower',
          'Sweet Corn',
          'Sweet Potato',
          'Tobacco',
          'Triticale',
          'Wheat',
          'Wheat (Durum)'
        ];
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
          'Aloe',
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
          'Cloudberry',
          'Coconut',
          'Coffee',
          'Fig',
          'Gooseberry',
          'Grape',
          'Grape (Bush Vine)',
          'Grape (Red)',
          'Grape (Table)',
          'Grape (White)',
          'Grapefruit',
          'Guava',
          'Hops',
          'Kiwi Fruit',
          'Lemon',
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
          'Pineapple',
          'Pistachio Nut',
          'Plum',
          'Pomegranate',
          'Protea',
          'Raspberry',
          'Rooibos',
          'Sisal',
          'Strawberry',
          'Sugarcane',
          'Tea',
          'Walnut',
          'Wineberry'
        ];
        var _plantationCrops = [
          'Bluegum',
          'Pine',
          'Wattle'
        ];

        readOnlyProperty(Asset, 'cropsByType', {
            'crop': _croplandCrops,
            'cropland': _croplandCrops,
            'livestock': _grazingCrops,
            'pasture': _grazingCrops,
            'permanent crop': _perennialCrops,
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

        readOnlyProperty(Asset, 'assetTypesWithOther', underscore.extend({
            'other': 'Other'
        }, Asset.assetTypes));

        privateProperty(Asset, 'getTypeTitle', function (type) {
            return Asset.assetTypes[type] || '';
        });

        privateProperty(Asset, 'getTitleType', function (title) {
            var keys = underscore.keys(Asset.assetTypes);

            return keys[underscore.values(Asset.assetTypes).indexOf(title)];
        });

        privateProperty(Asset, 'getTitle', function (asset) {
            return getTitle(asset);
        });

        function getTitle (instance, withField, farm) {
            switch (instance.type) {
                case 'crop':
                case 'permanent crop':
                case 'plantation':
                    return (instance.data.plantedArea ? $filter('number')(instance.data.plantedArea, 2) + 'ha' : '') +
                        (instance.data.plantedArea && instance.data.crop ? ' of ' : '') +
                        (instance.data.crop ? instance.data.crop : '') +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                case 'farmland':
                    return (instance.data.label ? instance.data.label :
                        (instance.data.portionLabel ? instance.data.portionLabel :
                            (instance.data.portionNumber ? 'Ptn. ' + instance.data.portionNumber : 'Rem. extent of farm')));
                case 'cropland':
                    return (instance.data.irrigation ? instance.data.irrigation + ' irrigated' :
                            (instance.data.irrigated ? 'Irrigated' + (instance.data.equipped ? ', equipped' : ', unequipped') : 'Non irrigable'))
                        + ' ' + instance.type + (instance.data.waterSource ? ' from ' + instance.data.waterSource : '') +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                case 'livestock':
                    return instance.data.type + (instance.data.category ? ' - ' + instance.data.category : '');
                case 'pasture':
                    return (instance.data.intensified ? (instance.data.crop ? instance.data.crop + ' intensified ' : 'Intensified ') + instance.type : 'Natural grazing') +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                case 'vme':
                    return instance.data.category + (instance.data.model ? ' model ' + instance.data.model : '');
                case 'wasteland':
                    return 'Homestead & Wasteland';
                case 'water source':
                case 'water right':
                    return instance.data.waterSource +
                        (withField && instance.data.fieldName ? ' on field ' + instance.data.fieldName : '') +
                        (farm ? ' on farm ' + farm.name : '');
                default:
                    return instance.data.name || instance.data.category || Asset.assetTypes[instance.type];
            }
        }

        Asset.validates({
            crop: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(['crop', 'permanent crop', 'plantation'], instance.type);
                },
                inclusion: {
                    in: function (value, instance, field) {
                        return Asset.cropsByType[instance.type];
                    }
                }
            },
            establishedDate: {
                requiredIf: function (value, instance, field) {
                    return underscore.contains(['permanent crop', 'plantation'], instance.type);
                },
                format: {
                    date: true
                }
            },
            farmId: {
                numeric: true
            },
            fieldName: {
                requiredIf: function (value, instance, field) {
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
            assetKey: {
                required: true
            },
            size: {
                requiredIf: function (value, instance, field) {
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

angular.module('ag.sdk.model.base', ['ag.sdk.library', 'ag.sdk.model.validation', 'ag.sdk.model.errors', 'ag.sdk.model.store'])
    .factory('Model', ['Base', function (Base) {
        var Model = {};
        Model.Base = Base;
        return Model;
    }])
    .factory('Base', ['Errorable', 'privateProperty', 'Storable', 'underscore', 'Validatable', function (Errorable, privateProperty, Storable, underscore, Validatable) {
        function Base () {
            var _constructor = this;
            var _prototype = _constructor.prototype;

            _constructor.new = function (attrs) {
                var inst = new _constructor(attrs);

                if (typeof inst.storable == 'function') {
                    inst.storable(attrs);
                }

                return inst;
            };

            _constructor.newCopy = function (attrs) {
                return _constructor.new(underscore.extend({}, angular.copy(attrs)));
            };

            _constructor.asJSON = function () {
                return underscore.omit(JSON.parse(JSON.stringify(this)), ['$complete', '$dirty', '$id', '$local', '$saved', '$uri']);
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
                        return propertyName.slice(0, 2) == '__';
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

        privateProperty(Base, 'initializeArray', function (length) {
            return underscore.range(length).map(function () {
                return 0;
            });
        });

        privateProperty(Base, 'initializeObject', function (object, property, defaultObject) {
            return object[property] = object[property] || defaultObject;
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
var sdkModelBusinessPlanDocument = angular.module('ag.sdk.model.business-plan', ['ag.sdk.id', 'ag.sdk.helper.enterprise-budget', 'ag.sdk.model.asset', 'ag.sdk.model.document', 'ag.sdk.model.liability', 'ag.sdk.model.production-schedule']);

sdkModelBusinessPlanDocument.factory('BusinessPlan', ['Asset', 'Base', 'computedProperty', 'Document', 'Financial', 'generateUUID', 'inheritModel', 'Liability', 'privateProperty', 'ProductionSchedule', 'readOnlyProperty', 'underscore',
    function (Asset, Base, computedProperty, Document, Financial, generateUUID, inheritModel, Liability, privateProperty, ProductionSchedule, readOnlyProperty, underscore) {

        var _assetYearEndValueAdjustments = {
            'Land and fixed improvements': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Land Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Land Purchases'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Development'
                }
            ],
            'Vehicles': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Vehicle Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Vehicle Purchases'
                }
            ],
            'Machinery': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Machinery & Plant Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Machinery & Plant Purchases'
                }
            ],
            'Breeding Stock': [
                {
                    operation: '+',
                    category: 'capitalIncome',
                    item: 'Breeding Stock Sales'
                },
                {
                    operation: '-',
                    category: 'capitalExpenditure',
                    item: 'Breeding Stock Purchases'
                }
            ]
        };

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
            Base.initializeObject(this.data.models, 'expenses', []);
            Base.initializeObject(this.data.models, 'financials', []);
            Base.initializeObject(this.data.models, 'income', []);
            Base.initializeObject(this.data.models, 'liabilities', []);
            Base.initializeObject(this.data.models, 'productionSchedules', []);

            function reEvaluateBusinessPlan (instance) {
                // Re-evaluate all included models
                reEvaluateProductionSchedules(instance);
                reEvaluateAssetsAndLiabilities(instance);
                reEvaluateIncomeAndExpenses(instance);

                recalculate(instance);
            }

            function recalculate (instance) {
                // Re-calculate summary, account & ratio data
                recalculateSummary(instance);
                recalculatePrimaryAccount(instance);
                recalculateRatios(instance);
            }

            /**
             * Helper functions
             */
            function infinityToZero(value) {
                return (isFinite(value) ? value : 0);
            }

            function sumCollectionProperty(collection, property) {
                return underscore.chain(collection)
                    .pluck(property)
                    .reduce(function(total, value) {
                        return total + value;
                    }, 0)
                    .value();
            }

            function divideArrayValues (numeratorValues, denominatorValues) {
                if (!numeratorValues || !denominatorValues || numeratorValues.length != denominatorValues.length) {
                    return [];
                }

                return underscore.reduce(denominatorValues, function(result, value, index) {
                    result[index] = infinityToZero(result[index] / value);
                    return result;
                }, angular.copy(numeratorValues));
            }

            function addArrayValues (array1, array2) {
                if (!array1 || !array2 || array1.length != array2.length) {
                    return [];
                }

                return underscore.reduce(array1, function(result, value, index) {
                    result[index] += value;
                    return result;
                }, angular.copy(array2));
            }

            function subtractArrayValues (array1, array2) {
                return addArrayValues(array1, negateArrayValues(array2));
            }

            function negateArrayValues (array) {
                return underscore.map(array, function(value) {
                    return value * -1;
                });
            }

            /**
             * Production Schedule handling
             */
            privateProperty(this, 'updateProductionSchedules', function (schedules) {
                var startMonth = moment(this.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(this.endDate, 'YYYY-MM-DD');

                this.models.productionSchedules = [];

                angular.forEach(schedules, function (schedule) {
                    if (schedule && ProductionSchedule.new(schedule).validate() &&
                        (startMonth.isBetween(schedule.startDate, schedule.endDate) ||
                        (startMonth.isBefore(schedule.endDate) && endMonth.isAfter(schedule.startDate)))) {
                        // Add valid production schedule if between business plan dates
                        this.models.productionSchedules.push(schedule);
                    }
                }, this);

                reEvaluateBusinessPlan(this);
            });

            function initializeCategoryValues(instance, section, category, months) {
                instance.data[section] = instance.data[section] || {};
                instance.data[section][category] = instance.data[section][category] || underscore.range(months).map(function () {
                    return 0;
                });
            }

            function getLowerIndexBound (scheduleArray, offset) {
                return (scheduleArray ? Math.min(scheduleArray.length, Math.abs(Math.min(0, offset))) : 0);
            }

            function getUpperIndexBound (scheduleArray, offset, numberOfMonths) {
                return (scheduleArray ? Math.min(numberOfMonths, offset + scheduleArray.length) - offset : 0);
            }

            function extractGroupCategories(dataStore, schedule, code, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: code}),
                // TODO: Fix time zone errors. Temporarily added one day to startDate to ensure it falls in the appropriate month.
                    scheduleStart = moment(schedule.startDate).add(1, 'days');

                if (section) {
                    var offset = scheduleStart.diff(startMonth, 'months');

                    angular.forEach(section.productCategoryGroups, function (group) {
                        angular.forEach(group.productCategories, function (category) {
                            var categoryName = (schedule.type !== 'livestock' && code === 'INC' ? schedule.data.details.commodity : category.name);

                            dataStore[categoryName] = dataStore[categoryName] || underscore.range(numberOfMonths).map(function () {
                                return 0;
                            });

                            var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                            var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, numberOfMonths);
                            for (var i = minIndex; i < maxIndex; i++) {
                                dataStore[categoryName][i + offset] += (category.valuePerMonth[i] || 0);
                            }
                        });
                    });
                }
            }

            function calculateIncomeComposition(instance, schedule, startMonth, numberOfMonths) {
                var section = underscore.findWhere(schedule.data.sections, {code: 'INC'}),
                // TODO: Fix time zone errors. Temporarily added one day to startDate to ensure it falls in the appropriate month.
                    scheduleStart = moment(schedule.startDate).add(1, 'days');

                if (section) {
                    var numberOfYears = Math.ceil(numberOfMonths / 12);

                    while (instance.data.productionIncomeComposition.length < numberOfYears) {
                        instance.data.productionIncomeComposition.push({});
                    }

                    for (var year = 0; year < numberOfYears; year++) {
                        var monthsInYear = Math.min(12, numberOfMonths - (year * 12));
                        var offset = scheduleStart.diff(moment(startMonth, 'YYYY-MM-DD').add(year, 'years'), 'months');

                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var categoryName = (schedule.type !== 'livestock' ? schedule.data.details.commodity : category.name);

                                var compositionCategory = instance.data.productionIncomeComposition[year][categoryName] ||
                                {
                                    unit: category.unit,
                                    pricePerUnit: 0,
                                    quantity: 0,
                                    value: 0
                                };

                                var minIndex = getLowerIndexBound(category.valuePerMonth, offset);
                                var maxIndex = getUpperIndexBound(category.valuePerMonth, offset, monthsInYear);
                                for (var i = minIndex; i < maxIndex; i++) {
                                    compositionCategory.value += category.valuePerMonth[i];
                                }

                                minIndex = getLowerIndexBound(category.quantityPerMonth, offset);
                                maxIndex = getUpperIndexBound(category.quantityPerMonth, offset, monthsInYear);
                                for (i = minIndex; i < maxIndex; i++) {
                                    compositionCategory.quantity += category.quantityPerMonth[i];
                                }

                                compositionCategory.pricePerUnit = ((!compositionCategory.pricePerUnit && category.pricePerUnit) ?
                                    category.pricePerUnit : infinityToZero(compositionCategory.value / compositionCategory.quantity));

                                instance.data.productionIncomeComposition[year][categoryName] = compositionCategory;
                            });
                        });

                        var totalValue = underscore.chain(instance.data.productionIncomeComposition[year])
                            .omit('total')
                            .values()
                            .pluck('value')
                            .reduce(function(total, value) { return total + value; }, 0)
                            .value();

                        for (var categoryName in instance.data.productionIncomeComposition[year]) {
                            if (instance.data.productionIncomeComposition[year].hasOwnProperty(categoryName) && categoryName != 'total') {
                                instance.data.productionIncomeComposition[year][categoryName].contributionPercent =
                                    infinityToZero(instance.data.productionIncomeComposition[year][categoryName].value / totalValue) * 100;
                            }
                        }
                        instance.data.productionIncomeComposition[year].total = {value: totalValue};
                    }
                }
            }

            function extractLivestockBreedingStockComposition (instance, schedule) {
                if (schedule.type == 'livestock') {
                    var livestockSalesGroup = schedule.getGroup('INC', 'Livestock Sales', schedule.defaultCostStage);

                    if (livestockSalesGroup) {
                        underscore.each(livestockSalesGroup.productCategories, function (category) {
                            if (category.breedingStock) {
                                updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', {
                                    data: {
                                        name: 'Breeding Stock',
                                        liquidityType: 'medium-term',
                                        assetValue: (category.stock || 0) * category.pricePerUnit
                                    }
                                });
                            }
                        });
                    }
                }
            }

            function reEvaluateProductionSchedules (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    numberOfMonths = instance.numberOfMonths;

                instance.data.enterpriseProductionExpenditure = {};
                instance.data.productionIncome = {};
                instance.data.productionExpenditure = {};
                instance.data.productionIncomeComposition = [];

                angular.forEach(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    Base.initializeObject(instance.data.enterpriseProductionExpenditure, schedule.data.details.commodity, {});
                    extractGroupCategories(instance.data.enterpriseProductionExpenditure[schedule.data.details.commodity], schedule, 'EXP', startMonth, numberOfMonths);

                    extractGroupCategories(instance.data.productionIncome, schedule, 'INC', startMonth, numberOfMonths);
                    extractGroupCategories(instance.data.productionExpenditure, schedule, 'EXP', startMonth, numberOfMonths);
                    calculateIncomeComposition(instance, schedule, startMonth, numberOfMonths);
                });

                instance.data.unallocatedProductionIncome = instance.data.unallocatedProductionIncome || instance.data.productionIncome;
                instance.data.unallocatedProductionExpenditure = instance.data.unallocatedProductionExpenditure || instance.data.productionExpenditure;
            }

            /**
             * Income & Expenses handling
             */
            privateProperty(this, 'addIncome', function (income) {
                this.models.income = underscore.reject(this.models.income, function (item) {
                    return item.uuid === income.uuid;
                });

                this.models.income.push(income);

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            privateProperty(this, 'removeIncome', function (income) {
                this.models.income = underscore.reject(this.models.income, function (item) {
                    return item.uuid === income.uuid;
                });

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            privateProperty(this, 'addExpense', function (expense) {
                this.models.expenses = underscore.reject(this.models.expenses, function (item) {
                    return item.uuid === expense.uuid;
                });

                this.models.expenses.push(expense);

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            privateProperty(this, 'removeExpense', function (expense) {
                this.models.expenses = underscore.reject(this.models.expenses, function (item) {
                    return item.uuid === expense.uuid;
                });

                reEvaluateBusinessPlan(this);
                recalculate(this);
            });

            function reEvaluateIncomeAndExpenses (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    evaluatedModels = [];

                instance.data.otherIncome = {};
                instance.data.otherExpenditure = {};

                underscore.each(instance.models.income, function (income) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: income.legalEntityId}),
                        evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: income.uuid}),
                        type = (income.type ? income.type : 'other') + 'Income';

                    // Check income is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                        initializeCategoryValues(instance, type, income.name, numberOfMonths);

                        instance.data[type][income.name] = underscore.map(income.months, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data[type][income.name][index] || 0);
                        });

                        evaluatedModels.push(income);
                    }
                });

                underscore.each(instance.models.expenses, function (expense) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: expense.legalEntityId}),
                        evaluatedModel = underscore.findWhere(evaluatedModels, {uuid: expense.uuid}),
                        type = (expense.type ? expense.type : 'other') + 'Expenditure';

                    // Check expense is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedModel) && instance.data[type]) {
                        initializeCategoryValues(instance, type, expense.name, numberOfMonths);

                        instance.data[type][expense.name] = underscore.map(expense.months, function (monthValue, index) {
                            return (monthValue || 0) + (instance.data[type][expense.name][index] || 0);
                        });

                        evaluatedModels.push(expense);
                    }
                });

                instance.data.unallocatedProductionIncome = instance.data.unallocatedProductionIncome || instance.data.productionIncome;
                instance.data.unallocatedProductionExpenditure = instance.data.unallocatedProductionExpenditure || instance.data.productionExpenditure;
            }

            /**
             * Financials
             */
            privateProperty(this, 'updateFinancials', function (financials) {
                this.models.financials = underscore.chain(financials)
                    .filter(function(financial) {
                        return Financial.new(financial).validate();
                    })
                    .sortBy(function (financial) {
                        return -financial.year;
                    })
                    .first(3)
                    .sortBy(function (financial) {
                        return financial.year;
                    })
                    .value();
            });

            /**
             *   Assets & Liabilities Handling
             */
            privateProperty(this, 'addAsset', function (asset) {
                var instance = this;

                asset = Asset.new(asset);

                if (asset.validate()) {
                    instance.models.assets = underscore.reject(instance.models.assets, function (item) {
                        return item.assetKey === asset.assetKey;
                    });

                    asset.liabilities = underscore.chain(asset.liabilities)
                        .map(function (liability) {
                            if (liability.validate()) {
                                instance.models.liabilities = underscore.reject(instance.models.liabilities, function (item) {
                                    return item.uuid === liability.uuid;
                                });

                                instance.models.liabilities.push(liability.asJSON());
                            }

                            return liability.asJSON();
                        })
                        .value();

                    instance.models.assets.push(asset.asJSON());

                    reEvaluateAssetsAndLiabilities(instance);
                    recalculate(instance);
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

                reEvaluateAssetsAndLiabilities(instance);
                recalculate(instance);

            });

            privateProperty(this, 'addLiability', function (liability) {
                liability = Liability.new(liability);

                if (liability.validate()) {
                    this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                        return item.uuid === liability.uuid;
                    });

                    this.models.liabilities.push(liability.asJSON());

                    reEvaluateAssetsAndLiabilities(this);
                    recalculate(this);
                }
            });

            privateProperty(this, 'removeLiability', function (liability) {
                this.models.liabilities = underscore.reject(this.models.liabilities, function (item) {
                    return item.uuid === liability.uuid;
                });

                reEvaluateAssetsAndLiabilities(this);
                recalculate(this);
            });

            function reEvaluateProductionCredit(instance, liabilities) {
                var filteredLiabilities = underscore.where(liabilities, {type: 'production-credit'});

                instance.data.unallocatedEnterpriseProductionExpenditure = angular.copy(instance.data.enterpriseProductionExpenditure);
                instance.data.unallocatedProductionIncome = angular.copy(instance.data.productionIncome);
                instance.data.unallocatedProductionExpenditure = angular.copy(instance.data.productionExpenditure);

                underscore.each(filteredLiabilities, function (liability) {
                    liability.resetRepayments();
                    liability.resetWithdrawalsInRange(instance.startDate, instance.endDate);
                    liability.$dirty = true;

                    underscore.each(liability.data.customRepayments, function (amount, month) {
                        if (moment(month).isBefore(liability.startDate)) {
                            liability.addRepaymentInMonth(amount, month, 'bank');
                        }
                    });

                    var filteredUnallocatedEnterpriseProductionExpenditure = underscore.chain(instance.data.unallocatedEnterpriseProductionExpenditure)
                        .reduce(function (enterpriseProductionExpenditure, productionExpenditure, enterprise) {
                            if (underscore.isEmpty(liability.data.enterprises) || underscore.contains(liability.data.enterprises, enterprise)) {
                                enterpriseProductionExpenditure[enterprise] = underscore.chain(productionExpenditure)
                                    .reduce(function (productionExpenditure, expenditure, input) {
                                        if (underscore.isEmpty(liability.data.inputs) || underscore.contains(liability.data.inputs, input)) {
                                            productionExpenditure[input] = expenditure;
                                        }

                                        return productionExpenditure;
                                    }, {})
                                    .value();
                            }

                            return enterpriseProductionExpenditure;
                        }, {})
                        .value();

                    for (var i = 0; i < instance.numberOfMonths; i++) {
                        var month = moment(liability.startDate, 'YYYY-MM-DD').add(i, 'M'),
                            monthFormatted = month.format('YYYY-MM-DD');

                        underscore.each(filteredUnallocatedEnterpriseProductionExpenditure, function (productionExpenditure, enterprise) {
                            underscore.each(productionExpenditure, function (expenditure, input) {
                                var opening = expenditure[i];

                                expenditure[i] = liability.addWithdrawalInMonth(opening, month);
                                instance.data.unallocatedProductionExpenditure[input][i] += (expenditure[i] - opening)
                            });
                        });

                        if (liability.data.customRepayments && liability.data.customRepayments[monthFormatted]) {
                            liability.addRepaymentInMonth(liability.data.customRepayments[monthFormatted], month, 'bank');
                        }
                    }
                });
            }

            privateProperty(this, 'reEvaluateProductionCredit', function (liabilities) {
                return reEvaluateProductionCredit(this, liabilities);
            });

            function updateAssetStatementCategory(instance, category, itemName, asset) {
                instance.data.assetStatement[category] = instance.data.assetStatement[category] || [];

                var index = underscore.findIndex(instance.data.assetStatement[category], function(statementObj) { return statementObj.name == itemName; }),
                    numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true)),
                    assetCategory = (index !== -1 ? instance.data.assetStatement[category].splice(index, 1)[0] : {
                        name: itemName,
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears),
                        assets: []
                    });

                if (!underscore.findWhere(assetCategory.assets, { assetKey: asset.assetKey })) {
                    assetCategory.assets.push(typeof asset.asJSON == 'function' ? asset.asJSON() : asset);
                }
                assetCategory.estimatedValue += asset.data.assetValue || 0;
                instance.data.assetStatement[category].push(assetCategory);
            }

            function updateLiabilityStatementCategory(instance, liability) {
                var category = (liability.type == 'production-credit' ? 'medium-term' : (liability.type == 'rent' ? 'short-term' : liability.type)),
                    itemName = (liability.type == 'rent' ? 'Rent overdue' : liability.name),
                    index = underscore.findIndex(instance.data.liabilityStatement[category], function(statementObj) { return statementObj.name == itemName; }),
                    numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true)),
                    liabilityCategory = (index !== -1 ? instance.data.liabilityStatement[category].splice(index, 1)[0] : {
                        name: itemName,
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears),
                        liabilities: []
                    });

                instance.data.liabilityStatement[category] = instance.data.liabilityStatement[category] || [];

                liabilityCategory.currentValue +=  liability.liabilityInMonth(instance.startDate).opening;

                // Calculate total year-end values for liability category
                for (var year = 0; year < numberOfYears; year++) {
                    var yearEnd = moment.min(moment(instance.endDate, 'YYYY-MM-DD'), moment(instance.startDate, 'YYYY-MM-DD').add(year, 'years').add(11, 'months'));
                    liabilityCategory.yearlyValues[year] += liability.liabilityInMonth(yearEnd).closing;
                }

                if (!underscore.findWhere(liabilityCategory.liabilities, { uuid: liability.uuid })) {
                    liabilityCategory.liabilities.push(typeof liability.asJSON == 'function' ? liability.asJSON() : liability);
                }
                instance.data.liabilityStatement[category].push(liabilityCategory);
            }

            function calculateAssetStatementRMV(instance) {
                angular.forEach(instance.data.assetStatement, function(statementItems, category) {
                    if (category != 'total') {
                        angular.forEach(statementItems, function(item) {
                            var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;
                            item.currentRMV = (item.estimatedValue || 0) * adjustmentFactor;

                            for (var year = 0; year < item.yearlyRMV.length; year++) {
                                var rmv = (year == 0 ? item.currentRMV : item.yearlyRMV[year - 1]);
                                angular.forEach(_assetYearEndValueAdjustments[item.name], function(adjustment) {
                                    if (instance.data[adjustment.category][adjustment.item]) {
                                        var value = underscore.reduce(instance.data[adjustment.category][adjustment.item].slice(year * 12, (year + 1) * 12), function(total, value) {
                                            return total + (value || 0);
                                        }, 0);
                                        rmv = (['+', '-'].indexOf(adjustment.operation) != -1 ? eval( rmv + adjustment.operation + value ) : rmv);
                                    }
                                });
                                item.yearlyRMV[year] = rmv * adjustmentFactor;
                            }
                        });
                    }
                });
            }

            function totalAssetsAndLiabilities(instance) {
                var numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true));

                instance.data.assetStatement.total = underscore.chain(instance.data.assetStatement)
                    .omit('total')
                    .values()
                    .flatten(true)
                    .reduce(function(result, asset) {
                        result.estimatedValue += asset.estimatedValue;
                        result.currentRMV += asset.currentRMV;
                        result.yearlyRMV = addArrayValues(result.yearlyRMV, asset.yearlyRMV);
                        return result;
                    }, {
                        estimatedValue: 0,
                        currentRMV: 0,
                        yearlyRMV: Base.initializeArray(numberOfYears)
                    })
                    .value();

                instance.data.liabilityStatement.total = underscore.chain(instance.data.liabilityStatement)
                    .omit('total')
                    .values()
                    .flatten(true)
                    .reduce(function(result, liability) {
                        result.currentValue += liability.currentValue;
                        result.yearlyValues = addArrayValues(result.yearlyValues, liability.yearlyValues);
                        return result;
                    }, {
                        currentValue: 0,
                        yearlyValues: Base.initializeArray(numberOfYears)
                    })
                    .value();

                recalculate(instance);
            }

            function reEvaluateAssetsAndLiabilities (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months'),
                    evaluatedModels = [];

                instance.data.capitalIncome = {};
                instance.data.capitalExpenditure = {};
                instance.data.debtRedemption = {};
                instance.data.assetStatement = {};
                instance.data.liabilityStatement = {};

                underscore.each(instance.models.assets, function (asset) {
                    var registerLegalEntity = underscore.findWhere(instance.data.legalEntities, {id: asset.legalEntityId}),
                        evaluatedAsset = underscore.findWhere(evaluatedModels, {assetKey: asset.assetKey});

                    // Check asset is not already added
                    if (registerLegalEntity && underscore.isUndefined(evaluatedAsset)) {
                        evaluatedModels.push(asset);

                        asset = Asset.new(asset);

                        var acquisitionDate = (asset.data.acquisitionDate ? moment(asset.data.acquisitionDate) : undefined),
                            soldDate = (asset.data.soldDate ? moment(asset.data.soldDate) : undefined),
                            constructionDate = (asset.data.constructionDate ? moment(asset.data.constructionDate) : undefined),
                            demolitionDate = (asset.data.demolitionDate ? moment(asset.data.demolitionDate) : undefined);

                        // VME
                        if (asset.type === 'vme') {
                            if (asset.data.type === 'Vehicles') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Vehicle Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Vehicle Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Vehicle Sales', numberOfMonths);

                                    instance.data.capitalIncome['Vehicle Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }

                            } else if (asset.data.type === 'Machinery') {
                                if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Machinery & Plant Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Machinery & Plant Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                                }

                                if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalIncome', 'Machinery & Plant Sales', numberOfMonths);

                                    instance.data.capitalIncome['Machinery & Plant Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                                }
                            }
                        } else if (asset.type === 'improvement' && asset.data.assetValue && constructionDate && constructionDate.isBetween(startMonth, endMonth)) {
                            initializeCategoryValues(instance, 'capitalExpenditure', 'Development', numberOfMonths);

                            instance.data.capitalExpenditure['Development'][constructionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                        } else if (asset.type === 'farmland') {
                            if (asset.data.assetValue && acquisitionDate && acquisitionDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalExpenditure', 'Land Purchases', numberOfMonths);

                                instance.data.capitalExpenditure['Land Purchases'][acquisitionDate.diff(startMonth, 'months')] += asset.data.assetValue;
                            }

                            if (asset.data.sold && asset.data.salePrice && soldDate && soldDate.isBetween(startMonth, endMonth)) {
                                initializeCategoryValues(instance, 'capitalIncome', 'Land Sales', numberOfMonths);

                                instance.data.capitalIncome['Land Sales'][soldDate.diff(startMonth, 'months')] += asset.data.salePrice;
                            }
                        }

                        if (asset.data.assetValue && !(asset.data.sold && soldDate && soldDate.isBefore(startMonth)) && !(asset.data.demolished && demolitionDate && demolitionDate.isBefore(startMonth))) {
                            switch(asset.type) {
                                case 'cropland':
                                case 'farmland':
                                case 'pasture':
                                case 'permanent crop':
                                case 'plantation':
                                case 'wasteland':
                                    updateAssetStatementCategory(instance, 'long-term', 'Land', asset);
                                    break;
                                case 'improvement':
                                    updateAssetStatementCategory(instance, 'long-term', 'Fixed Improvements', asset);
                                    break;
                                case 'livestock':
                                    updateAssetStatementCategory(instance, 'medium-term', 'Breeding Stock', asset);
                                    break;
                                case 'vme':
                                    updateAssetStatementCategory(instance, 'medium-term', 'Vehicles, Machinery & Equipment', asset);
                                    break;
                                case 'other':
                                    updateAssetStatementCategory(instance, asset.data.liquidityType, asset.data.category, asset);
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

                                if (asset.type == 'farmland' && liability.type !== 'rent' && moment(liability.startDate, 'YYYY-MM-DD').isBetween(startMonth, endMonth)) {
                                    initializeCategoryValues(instance, 'capitalExpenditure', 'Land Purchases', numberOfMonths);

                                    instance.data.capitalExpenditure['Land Purchases'][moment(liability.startDate, 'YYYY-MM-DD').diff(startMonth, 'months')] += liability.openingBalance;
                                }

                                initializeCategoryValues(instance, section, typeTitle, numberOfMonths);

                                instance.data[section][typeTitle] = underscore.map(liabilityMonths, function (month, index) {
                                    return ((month.repayment && month.repayment.bank) || 0) + (instance.data[section][typeTitle][index] || 0);
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
                            return ((month.repayment && month.repayment.bank) || 0) + (instance.data[section][typeTitle][index] || 0);
                        });

                        updateLiabilityStatementCategory(instance, liability);
                    }
                });

                underscore.each(instance.models.productionSchedules, function (productionSchedule) {
                    var schedule = ProductionSchedule.new(productionSchedule);

                    extractLivestockBreedingStockComposition(instance, schedule);
                });

                calculateAssetStatementRMV(instance);
                totalAssetsAndLiabilities(instance);
            }

            /**
             * Recalculate summary & ratio data
             */
            function calculateYearlyTotal (monthlyTotals, year) {
                return underscore.reduce(monthlyTotals.slice((year - 1) * 12, year * 12), function (total, value) {
                    return total + (value || 0);
                }, 0);
            }

            function calculateYearlyEndLiabilityBalance(monthlyTotals, year) {
                var yearSlice = monthlyTotals.slice((year - 1) * 12, year * 12);
                return yearSlice[yearSlice.length - 1];
            }

            function calculateAssetLiabilityGroupTotal (instance, type, subType) {
                var numberOfYears = Math.ceil(moment(instance.endDate, 'YYYY-MM-DD').diff(moment(instance.startDate, 'YYYY-MM-DD'), 'years', true));
                var defaultObj = (type == 'asset' ? {
                    estimatedValue: 0,
                    currentRMV: 0,
                    yearlyRMV: Base.initializeArray(numberOfYears)
                } : { currentValue: 0, yearlyValues: Base.initializeArray(numberOfYears) } );
                var statementProperty = (type == 'asset' ? 'assetStatement' : 'liabilityStatement');

                if (!instance.data[statementProperty][subType] || instance.data[statementProperty][subType].length == 0) {
                    return defaultObj;
                }

                return underscore.reduce(instance.data[statementProperty][subType], function(result, item) {
                    if (type == 'asset') {
                        result.estimatedValue += item.estimatedValue || 0;
                        result.currentRMV += item.currentRMV || 0;
                        result.yearlyRMV = addArrayValues(result.yearlyRMV, item.yearlyRMV);
                    } else {
                        result.currentValue += item.currentValue || 0;
                        result.yearlyValues = addArrayValues(result.yearlyValues, item.yearlyValues);
                    }
                    return result;
                }, defaultObj);
            }

            function calculateMonthlyLiabilityPropertyTotal (instance, liabilityTypes, property, startMonth, endMonth) {
                var liabilities = underscore.filter(instance.models.liabilities, function(liability) {
                        if (!liabilityTypes || liabilityTypes.length == 0) return true;

                        return liabilityTypes.indexOf(liability.type) != -1;
                    });

                if (liabilities.length == 0) return Base.initializeArray(instance.numberOfMonths);

                return underscore.chain(liabilities)
                    .map(function(liability) {
                        var l = new Liability(liability).liabilityInRange(startMonth, endMonth);
                        return underscore.pluck(l, property);
                    })
                    .unzip()
                    .map(function(monthArray) {
                            return underscore.reduce(monthArray, function(total, value) { return total + (value || 0); }, 0);
                        })
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

            function getDepreciation(instance) {
                var yearlyDepreciation = underscore.chain(instance.data.assetStatement['medium-term'])
                    .filter(function(item) {
                        return underscore.contains(['Vehicle', 'Machinery', 'Equipment'], item.name);
                    })
                    .map(function(item) {
                        var adjustmentFactor = instance.data.adjustmentFactors[item.name] || 1;
                        for (var i = 0; i < item.yearlyRMV.length; i++) {
                            item.yearlyRMV[i] = (item.yearlyRMV[i] / adjustmentFactor) * (1 - (instance.data.account.depreciationRate || 0));
                        }
                        return item;
                    })
                    .pluck('yearlyRMV')
                    .reduce(function(result, rmvArray) {
                        if (result.length == 0) {
                            result = Base.initializeArray(rmvArray.length);
                        }
                        return addArrayValues(result, rmvArray);
                    }, [])
                    .value();
                return (yearlyDepreciation.length == 0 ? [0,0] : yearlyDepreciation);
            }

            function recalculateSummary (instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                // Summary of year 1 & year 2 for each category
                instance.data.summary = {};
                instance.data.summary.monthly = {
                    // Income
                    unallocatedProductionIncome: calculateMonthlySectionsTotal([instance.data.unallocatedProductionIncome], Base.initializeArray(numberOfMonths)),
                    productionIncome: calculateMonthlySectionsTotal([instance.data.productionIncome], Base.initializeArray(numberOfMonths)),
                    capitalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome], Base.initializeArray(numberOfMonths)),
                    otherIncome: calculateMonthlySectionsTotal([instance.data.otherIncome], Base.initializeArray(numberOfMonths)),
                    totalIncome: calculateMonthlySectionsTotal([instance.data.capitalIncome, instance.data.unallocatedProductionIncome, instance.data.otherIncome], Base.initializeArray(numberOfMonths)),

                    // Expenses
                    unallocatedProductionExpenditure: calculateMonthlySectionsTotal([instance.data.unallocatedProductionExpenditure], Base.initializeArray(numberOfMonths)),
                    productionExpenditure: calculateMonthlySectionsTotal([instance.data.productionExpenditure], Base.initializeArray(numberOfMonths)),
                    capitalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure], Base.initializeArray(numberOfMonths)),
                    otherExpenditure: calculateMonthlySectionsTotal([instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),
                    debtRedemption: calculateMonthlySectionsTotal([instance.data.debtRedemption], Base.initializeArray(numberOfMonths)),
                    totalExpenditure: calculateMonthlySectionsTotal([instance.data.capitalExpenditure, instance.data.unallocatedProductionExpenditure, instance.data.debtRedemption, instance.data.otherExpenditure], Base.initializeArray(numberOfMonths)),

                    // Interest
                    primaryAccountInterest: Base.initializeArray(numberOfMonths), //Calculated when primary account is recalculated
                    productionCreditInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'interest', startMonth, endMonth),
                    mediumTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'interest', startMonth, endMonth),
                    longTermInterest: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'interest', startMonth, endMonth),
                    totalInterest: Base.initializeArray(numberOfMonths), //Calculated when primary account is recalculated

                    // Liabilities
                    currentLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['short-term', 'production-credit'], 'closing', startMonth, endMonth),
                    mediumLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['medium-term'], 'closing', startMonth, endMonth),
                    longLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, ['long-term'], 'closing', startMonth, endMonth),
                    totalLiabilities: calculateMonthlyLiabilityPropertyTotal(instance, [], 'closing', startMonth, endMonth),
                    totalRent: calculateMonthlyLiabilityPropertyTotal(instance, ['rent'], 'rent', startMonth, endMonth)
                };

                instance.data.summary.yearly = {
                    // Income
                    unallocatedProductionIncome: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionIncome, 2)],
                    productionIncome: [calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.productionIncome, 2)],
                    capitalIncome: [calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalIncome, 2)],
                    otherIncome: [calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.otherIncome, 2)],
                    totalIncome: [calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 1), calculateYearlyTotal(instance.data.summary.monthly.totalIncome, 2)],

                    // Expenses
                    unallocatedProductionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.unallocatedProductionExpenditure, 2)],
                    productionExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.productionExpenditure, 2)],
                    capitalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.capitalExpenditure, 2)],
                    otherExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.otherExpenditure, 2)],
                    debtRedemption: [calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 1), calculateYearlyTotal(instance.data.summary.monthly.debtRedemption, 2)],
                    totalExpenditure: [calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 1), calculateYearlyTotal(instance.data.summary.monthly.totalExpenditure, 2)],

                    // Interest
                    primaryAccountInterest: Base.initializeArray(2),
                    productionCreditInterest: [calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.productionCreditInterest, 2)],
                    mediumTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.mediumTermInterest, 2)],
                    longTermInterest: [calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.longTermInterest, 2)],
                    totalInterest: Base.initializeArray(2),

                    // Liabilities
                    currentLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'short-term'),
                    mediumLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'medium-term'),
                    longLiabilities: calculateAssetLiabilityGroupTotal(instance, 'liability', 'long-term'),
                    totalLiabilities: [calculateYearlyEndLiabilityBalance(instance.data.summary.monthly.totalLiabilities, 1), calculateYearlyEndLiabilityBalance(instance.data.summary.monthly.totalLiabilities, 2)],
                    totalRent: [calculateYearlyTotal(instance.data.summary.monthly.totalRent, 1), calculateYearlyTotal(instance.data.summary.monthly.totalRent, 2)],

                    // Assets
                    currentAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'short-term'),
                    movableAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'medium-term'),
                    fixedAssets: calculateAssetLiabilityGroupTotal(instance, 'asset', 'long-term'),
                    totalAssets: instance.data.assetStatement.total.yearlyRMV || Base.initializeArray(2),

                    depreciation: getDepreciation(instance)
                };

                instance.data.summary.yearly.netFarmIncome = subtractArrayValues(instance.data.summary.yearly.productionIncome, addArrayValues(instance.data.summary.yearly.productionExpenditure, instance.data.summary.yearly.depreciation));
                instance.data.summary.yearly.farmingProfitOrLoss = subtractArrayValues(instance.data.summary.yearly.netFarmIncome, addArrayValues(instance.data.summary.yearly.totalRent, instance.data.summary.yearly.totalInterest));
            }

            /**
             * Primary Account Handling
             */
            function recalculatePrimaryAccount(instance) {
                var startMonth = moment(instance.startDate, 'YYYY-MM-DD'),
                    endMonth = moment(instance.endDate, 'YYYY-MM-DD'),
                    numberOfYears = Math.ceil(endMonth.diff(startMonth, 'years', true)),
                    defaultMonthObj = {
                        opening: 0,
                        inflow: 0,
                        outflow: 0,
                        balance: 0,
                        interestPayable: 0,
                        interestReceivable: 0,
                        closing: 0
                    };

                while (instance.account.monthly.length < instance.numberOfMonths) {
                    instance.account.monthly.push(defaultMonthObj);
                }
                while (instance.account.yearly.length < numberOfYears) {
                    instance.account.yearly.push(underscore.extend(defaultMonthObj, { worstBalance: 0, bestBalance: 0, openingMonth: null, closingMonth: null }));
                }

                instance.data.summary.monthly.primaryAccountInterest = Base.initializeArray(instance.numberOfMonths);
                instance.data.summary.monthly.totalInterest = calculateMonthlyLiabilityPropertyTotal(instance, [], 'interest', startMonth, endMonth);

                underscore.each(instance.account.monthly, function (month, index) {
                    month.opening = (index === 0 ? instance.account.openingBalance : instance.account.monthly[index - 1].closing);
                    month.inflow = instance.data.summary.monthly.totalIncome[index];
                    month.outflow = instance.data.summary.monthly.totalExpenditure[index];
                    month.balance = month.opening + month.inflow - month.outflow;
                    month.interestPayable = (month.balance < 0 && instance.account.interestRateCredit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateCredit / 100 / 12) : 0 );
                    month.interestReceivable = (month.balance > 0 && instance.account.interestRateDebit ? ((month.opening + month.balance) / 2) * (instance.account.interestRateDebit / 100 / 12) : 0 );
                    month.closing = month.balance + month.interestPayable + month.interestReceivable;

                    instance.data.summary.monthly.totalInterest[index] += -month.interestPayable;
                    instance.data.summary.monthly.primaryAccountInterest[index] += -month.interestPayable;
                });

                underscore.each(instance.account.yearly, function(year, index) {
                    var months = instance.account.monthly.slice(index * 12, (index + 1) * 12);
                    year.opening = months[0].opening;
                    year.inflow = sumCollectionProperty(months, 'inflow');
                    year.outflow = sumCollectionProperty(months, 'outflow');
                    year.balance = year.opening + year.inflow - year.outflow;
                    year.interestPayable = sumCollectionProperty(months, 'interestPayable');
                    year.interestReceivable = sumCollectionProperty(months, 'interestReceivable');
                    year.closing = year.balance + year.interestPayable + year.interestReceivable;
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
                });

                instance.data.summary.yearly.primaryAccountInterest = [calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.primaryAccountInterest, 2)];
                instance.data.summary.yearly.totalInterest = [calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 1), calculateYearlyTotal(instance.data.summary.monthly.totalInterest, 2)];
            }

            function recalculateRatios (instance) {
                instance.data.ratios = {
                    interestCover: calculateRatio(instance, 'netFarmIncome', 'totalInterest'),
                    inputOutput: calculateRatio(instance, 'productionIncome', ['productionExpenditure', 'productionCreditInterest', 'primaryAccountInterest']),
                    productionCost: calculateRatio(instance, 'productionExpenditure', 'productionIncome'),
                    cashFlowBank: calculateRatio(instance, 'unallocatedProductionIncome', ['unallocatedProductionExpenditure', 'primaryAccountInterest']),
                    //TODO: add payments to co-ops with crop deliveries to cashFlowFarming denominator
                    cashFlowFarming: calculateRatio(instance, ['productionIncome', 'capitalIncome', 'otherIncome'], ['totalExpenditure', 'primaryAccountInterest']),
                    debtToTurnover: calculateRatio(instance, 'totalLiabilities', ['productionIncome', 'otherIncome']),
                    interestToTurnover: calculateRatio(instance, 'totalInterest', ['productionIncome', 'otherIncome']),
                    //TODO: change denominator to total asset value used for farming
                    returnOnInvestment: calculateRatio(instance, 'netFarmIncome', 'totalAssets')
                };

                calculateAssetRatios(instance);
            }

            function calculateAssetRatios (instance) {
                var defaultObj = { yearly: [], currentRMV: 0, estimatedValue: 0 };

                instance.data.ratios = underscore.extend(instance.data.ratios, {
                    netCapital: defaultObj,
                    gearing: defaultObj,
                    debt: defaultObj
                });

                instance.data.ratios.netCapital = underscore.mapObject(instance.data.ratios.netCapital, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.assetStatement.total[key] / instance.data.liabilityStatement.total.currentValue);
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.assetStatement.total.yearlyRMV, instance.data.liabilityStatement.total.yearlyValues);
                    }
                });

                instance.data.ratios.debt = underscore.mapObject(instance.data.ratios.debt, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.liabilityStatement.total.currentValue / instance.data.assetStatement.total[key]);
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.liabilityStatement.total.yearlyValues, instance.data.assetStatement.total.yearlyRMV);
                    }
                });

                instance.data.ratios.gearing = underscore.mapObject(instance.data.ratios.gearing, function(value, key) {
                    if (underscore.contains(['currentRMV', 'estimatedValue'], key)) {
                        return infinityToZero(instance.data.liabilityStatement.total.currentValue / (instance.data.assetStatement.total[key] - instance.data.liabilityStatement.total.currentValue));
                    } else if (key === 'yearly') {
                        return divideArrayValues(instance.data.liabilityStatement.total.yearlyValues, subtractArrayValues(instance.data.assetStatement.total.yearlyRMV, instance.data.liabilityStatement.total.yearlyValues));
                    }
                });
            }

            function calculateRatio(instance, numeratorProperties, denominatorProperties) {
                if (!underscore.isArray(numeratorProperties)) {
                    numeratorProperties = [numeratorProperties];
                }
                if (!underscore.isArray(denominatorProperties)) {
                    denominatorProperties = [denominatorProperties];
                }

                function sumPropertyValuesForInterval (propertyList, interval) {
                    if (!instance.data.summary[interval]) {
                        return [];
                    }

                    var valueArrays = underscore.chain(propertyList)
                        .map(function(propertyName) {
                            if (propertyName.charAt(0) === '-') {
                                propertyName = propertyName.substr(1);
                                return negateArrayValues(instance.data.summary[interval][propertyName]);
                            }
                            return instance.data.summary[interval][propertyName];
                        })
                        .compact()
                        .value();

                    return underscore.reduce(valueArrays.slice(1), function(result, array) {
                        return addArrayValues(result, array);
                    }, angular.copy(valueArrays[0]) || []);
                }

                return {
                    monthly: divideArrayValues(sumPropertyValuesForInterval(numeratorProperties, 'monthly'), sumPropertyValuesForInterval(denominatorProperties, 'monthly')),
                    yearly: divideArrayValues(sumPropertyValuesForInterval(numeratorProperties, 'yearly'), sumPropertyValuesForInterval(denominatorProperties, 'yearly'))
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

            computedProperty(this, 'models', function () {
                return this.data.models;
            });

            privateProperty(this, 'reEvaluate', function() {
                reEvaluateBusinessPlan(this);
            });

            privateProperty(this, 'recalculateAccount', function() {
                recalculatePrimaryAccount(this);
            });
        }

        inheritModel(BusinessPlan, Document);

        readOnlyProperty(BusinessPlan, 'incomeExpenseTypes', {
            'capital': 'Capital',
            'production': 'Production',
            'other': 'Other'
        });

        BusinessPlan.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'financial resource plan'
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
            },
            title: {
                length: {
                    min: 1,
                    max: 255
                }
            }
        });

        return BusinessPlan;
    }]);

var sdkModelComparableSale = angular.module('ag.sdk.model.comparable-sale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelComparableSale.factory('ComparableSale', ['computedProperty', 'inheritModel', 'landUseHelper', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, landUseHelper, Model, naturalSort, privateProperty, readOnlyProperty, underscore) {
        function ComparableSale (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'area', function () {
                return underscore.reduce(this.portions, function(total, portion) {
                    return total + (portion.area || 0);
                }, 0);
            });

            computedProperty(this, 'distanceInKm', function () {
                return (this.distance ? this.distance / 1000.0 : '-');
            });

            computedProperty(this, 'improvedRatePerHa', function () {
                return this.purchasePrice / this.area;
            });

            computedProperty(this, 'vacantLandValue', function () {
                return this.valueMinusImprovements / this.area;
            });

            computedProperty(this, 'valueMinusImprovements', function () {
                return this.purchasePrice - this.depImpValue;
            });

            computedProperty(this, 'farmName', function () {
                return underscore.chain(this.portions)
                    .groupBy('farmLabel')
                    .map(function (portions, farmName) {
                        farmName = (farmName || '').toLowerCase();

                        var portionSentence = underscore.chain(portions)
                                .sortBy('portionLabel')
                                .pluck('portionLabel')
                                .toSentence()
                                .value();

                        return (portionSentence + (farmName.length ? ' of ' + (underscore.startsWith(farmName, 'farm') ? '' : 'farm ') + underscore.titleize(farmName) : ''));
                    })
                    .toSentence()
                    .value();
            });


            computedProperty(this, 'totalLandComponentArea', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return total + (landComponent.area || 0);
                }, 0);
            });

            computedProperty(this, 'totalLandComponentValue', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return total + (landComponent.assetValue || 0);
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
                if (underscore.chain(this.landComponents).pluck('type').contains(type).value() == false) {
                    this.landComponents.push({
                        type: type,
                        assetValue: 0
                    });
                }
            });

            privateProperty(this, 'removeLandComponent', function (type) {
                this.landComponents = underscore.reject(this.landComponents, function (landComponent) {
                    return landComponent.type === type;
                });
            });

            /**
             * Portion Handling
             */
            privateProperty(this, 'addPortion', function (portion) {
                this.removePortionBySgKey(portion.sgKey);

                this.portions.push(portion);
            });

            privateProperty(this, 'removePortionBySgKey', function (sgKey) {
                this.portions = underscore.reject(this.portions, function (portion) {
                    return (portion.sgKey === sgKey);
                });
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
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
            this.landComponents = attrs.landComponents || [];
            this.portions = attrs.portions || [];
            this.propertyKnowledge = attrs.propertyKnowledge;
            this.purchasedAt = attrs.purchasedAt;
            this.purchasePrice = attrs.purchasePrice || 0;
            this.useCount = attrs.useCount || 0;
        }

        inheritModel(ComparableSale, Model.Base);

        readOnlyProperty(ComparableSale, 'landComponentTypes', underscore.chain(landUseHelper.landUseTypes())
            .without('Cropland')
            .union(['Cropland (Dry)', 'Cropland (Equipped, Irrigable)', 'Cropland (Irrigable)'])
            .value()
            .sort(naturalSort));

        readOnlyProperty(ComparableSale, 'propertyKnowledgeOptions', ['The valuer has no firsthand knowledge of this property.',
            'The valuer has inspected this comparable from aerial photos, and has no firsthand knowledge of the property.',
            'The valuer has inspected/valued this comparable before, and has firsthand knowledge of the property.']);

        ComparableSale.validates({
            area: {
                required: true,
                numeric: true
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

var sdkModelDesktopValuationDocument = angular.module('ag.sdk.model.desktop-valuation', ['ag.sdk.model.comparable-sale', 'ag.sdk.model.document']);

sdkModelDesktopValuationDocument.factory('DesktopValuation', ['Base', 'ComparableSale', 'computedProperty', 'Document', 'inheritModel', 'privateProperty', 'underscore',
    function (Base, ComparableSale, computedProperty, Document, inheritModel, privateProperty, underscore) {
        function DesktopValuation (attrs) {
            Document.apply(this, arguments);

            this.docType = 'desktop valuation';

            var defaultReportBody = '<div class="tinymce-container pdf-container">' +
                '<h2 id="property-description">Property Description</h2><br/><br/>' +
                '<h2 id="farmland-value">Estimated Farmland Value</h2><br/><br/>' +
                '<h2 id="regional-value">Regional Value Development</h2><br/><br/>' +
                '<h2 id="comparable-sales">Comparable Sales</h2><div id="comparable-sales-table"></div><br/>' +
                '<h2 id="disclaimer">Disclaimer</h2><p>Estimates of farmland and property value is based on the aggregation of regional sales data and assumptions regarding the property being valued.</p><br/><br/>' +
                '</div>';

            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'request', {});
            Base.initializeObject(this.data, 'report', {});

            Base.initializeObject(this.data.request, 'farmland', []);

            Base.initializeObject(this.data.report, 'body', defaultReportBody);
            Base.initializeObject(this.data.report, 'comparableSales', []);
            Base.initializeObject(this.data.report, 'improvements', []);
            Base.initializeObject(this.data.report, 'improvementsValue', {});
            Base.initializeObject(this.data.report, 'landUseComponents', {});
            Base.initializeObject(this.data.report, 'landUseValue', {});
            Base.initializeObject(this.data.report, 'summary', {});

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
                comparableSale = ComparableSale.new(comparableSale);

                this.removeComparableSale(comparableSale);

                this.data.report.comparableSales.push(comparableSale.asJSON());
            });

            privateProperty(this, 'removeComparableSale', function (comparableSale) {
                this.data.report.comparableSales = underscore.reject(this.data.report.comparableSales, function (comparable) {
                    return comparable.id === comparableSale.id;
                });
            });
        }

        inheritModel(DesktopValuation, Document);

        DesktopValuation.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'desktop valuation'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return DesktopValuation;
    }]);

var sdkModelDocument = angular.module('ag.sdk.model.document', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelDocument.factory('Document', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Document (attrs, organization) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            privateProperty(this, 'updateRegister', function (organization) {
                this.organization = organization;
                this.organizationId = organization.id;
                this.data = underscore.extend(this.data, {
                    farmer: underscore.omit(organization, ['activeFlags', 'farms', 'legalEntities', 'primaryContact', 'teams']),
                    farms : organization.farms,
                    legalEntities: underscore
                        .map(organization.legalEntities, function (entity) {
                            return underscore.omit(entity, ['assets', 'farms']);
                        }),
                    assets: underscore
                        .chain(organization.legalEntities)
                        .pluck('assets')
                        .flatten()
                        .compact()
                        .groupBy('type')
                        .value(),
                    liabilities: underscore
                        .chain(organization.legalEntities)
                        .pluck('liabilities')
                        .flatten()
                        .compact()
                        .value()
                });
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.author = attrs.author;
            this.docType = attrs.docType;
            this.documentId = attrs.documentId;
            this.id = attrs.id || attrs.$id;
            this.organization = attrs.organization;
            this.organizationId = attrs.organizationId;
            this.title = attrs.title;
        }

        inheritModel(Document, Model.Base);

        readOnlyProperty(Document, 'docTypes', {
            'asset register': 'Asset Register',
            'desktop valuation': 'Desktop Valuation',
            'emergence report': 'Emergence Report',
            'farm valuation': 'Farm Valuation',
            'financial resource plan': 'Financial Resource Plan',
            'insurance policy': 'Insurance Policy',
            'production plan': 'Production Plan',
            'progress report': 'Progress Report'
        });

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
                inclusion: {
                    in: underscore.keys(Document.docTypes)
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return Document;
    }]);

var sdkModelEnterpriseBudget = angular.module('ag.sdk.model.enterprise-budget', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelEnterpriseBudget.factory('EnterpriseBudgetBase', ['computedProperty', 'inheritModel', 'interfaceProperty', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, interfaceProperty, Model, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudgetBase(attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});
            this.data.sections = this.data.sections || [];

            computedProperty(this, 'defaultCostStage', function () {
                return underscore.last(EnterpriseBudgetBase.costStages);
            });

            // Sections
            privateProperty(this, 'getSections', function (sectionCode, costStage) {
                var sections = underscore.where(this.data.sections, {code: sectionCode, costStage: costStage || this.defaultCostStage});

                return (sections.length > 0 ? sections : underscore.filter(this.data.sections, function (section) {
                    return section.code === sectionCode && underscore.isUndefined(section.costStage);
                }));
            });

            privateProperty(this, 'getSection', function (sectionCode, costStage) {
                return underscore.first(this.getSections(sectionCode, costStage));
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

                    if (this.assetType == 'livestock') {
                        section.total.valuePerLSU = 0;
                    }

                    if (costStage) {
                        section.costStage = costStage;
                    }

                    this.data.sections.push(section);
                }

                return section;
            });

            // Groups
            privateProperty(this, 'getGroup', function (sectionCode, groupName, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .findWhere({name: groupName})
                    .value();
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

                    if (this.assetType == 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    section.productCategoryGroups.push(group);
                }

                return group;
            });

            privateProperty(this, 'removeGroup', function (sectionCode, groupName, costStage) {
                var section = this.getSection(sectionCode, costStage);

                if (section) {
                    section.productCategoryGroups = underscore.reject(section.productCategoryGroups, function (group) {
                        return group.name === groupName;
                    });
                }

                this.recalculate();
            });

            // Categories
            privateProperty(this, 'getCategory', function (sectionCode, categoryCode, costStage) {
                return underscore.chain(this.getSections(sectionCode, costStage))
                    .pluck('productCategoryGroups')
                    .flatten()
                    .pluck('productCategories')
                    .flatten()
                    .findWhere({code: categoryCode})
                    .value();
            });

            interfaceProperty(this, 'getCategoryOptions', function (sectionCode) {
                return (this.assetType ?
                    (this.assetType == 'livestock' ?
                        EnterpriseBudgetBase.categoryOptions[this.assetType][this.baseAnimal][sectionCode] :
                        EnterpriseBudgetBase.categoryOptions[this.assetType][sectionCode]) :
                    []);
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

            privateProperty(this, 'addCategory', function (sectionCode, groupName, categoryCode, costStage) {
                var category = this.getCategory(sectionCode, categoryCode, costStage);

                if (underscore.isUndefined(category)) {
                    var group = this.addGroup(sectionCode, findGroupNameByCategory(this, sectionCode, groupName, categoryCode), costStage);

                    category = underscore.extend({
                        quantity: 0,
                        value: 0
                    }, EnterpriseBudgetBase.categories[categoryCode]);

                    // WA: Modify enterprise budget model to specify input costs as "per ha"
                    if (sectionCode === 'EXP') {
                        category.unit = 'Total'
                    }

                    if (this.assetType == 'livestock') {
                        category = underscore.extend(category, {
                            conversionRate: this.getConversionRate(category.name),
                            valuePerLSU: 0,
                            per: 'LSU'
                        });

                        if (breedingStock[this.commodityType] && underscore.contains(breedingStock[this.commodityType], category.name)) {
                            category.breedingStock = true;
                        }
                    } else {
                        category.per = 'ha';
                    }

                    group.productCategories.push(category);
                }

                return category;
            });

            privateProperty(this, 'removeCategory', function (sectionCode, groupName, categoryCode, costStage) {
                groupName = findGroupNameByCategory(this, sectionCode, groupName, categoryCode);

                var group = this.getGroup(sectionCode, groupName, costStage);

                if (group) {
                    group.productCategories = underscore.reject(group.productCategories, function (category) {
                        return category.code === categoryCode;
                    });

                    if (group.productCategories.length == 0) {
                        this.removeGroup(sectionCode, groupName, costStage);
                    }
                }

                this.recalculate();
            });

            interfaceProperty(this, 'recalculate', function () {});

            // Livestock
            computedProperty(this, 'baseAnimal', function () {
                return baseAnimal[this.commodityType] || this.commodityType;
            });

            privateProperty(this, 'getBaseAnimal', function () {
                return this.baseAnimal;
            });

            privateProperty(this, 'getRepresentativeAnimal', function() {
                return representativeAnimal[this.baseAnimal];
            });

            privateProperty(this, 'getConversionRate', function(animal) {
                return conversionRate[this.baseAnimal][animal] || conversionRate[this.baseAnimal][representativeAnimal[this.baseAnimal]];
            });

            privateProperty(this, 'getConversionRates', function() {
                return conversionRate[this.baseAnimal];
            });

            privateProperty(this, 'getUnitAbbreviation', function (unit) {
                return unitAbbreviations[unit] || unit;
            });
        }

        inheritModel(EnterpriseBudgetBase, Model.Base);

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
                unit: 'head'
            }, {
                code: 'INC-LSS-SWEAN',
                name: 'Weaner lambs',
                unit: 'head'
            }, {
                code: 'INC-LSS-SEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'INC-LSS-SWTH',
                name: 'Wether (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-SRAM',
                name: 'Ram',
                unit: 'head'
            },

            // Cattle
            {
                code: 'INC-LSS-CCALV',
                name: 'Calf',
                unit: 'head'
            }, {
                code: 'INC-LSS-CWEN',
                name: 'Weaner calves',
                unit: 'head'
            }, {
                code: 'INC-LSS-CCOW',
                name: 'Cow or heifer',
                unit: 'head'
            }, {
                code: 'INC-LSS-CST18',
                name: 'Steer (18 months plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-CST36',
                name: 'Steer (3 years plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-CBULL',
                name: 'Bull (3 years plus)',
                unit: 'head'
            },

            //Goats
            {
                code: 'INC-LSS-GKID',
                name: 'Kid',
                unit: 'head'
            }, {
                code: 'INC-LSS-GWEAN',
                name: 'Weaner kids',
                unit: 'head'
            }, {
                code: 'INC-LSS-GEWE',
                name: 'Ewe (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-GCAST',
                name: 'Castrate (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'INC-LSS-GRAM',
                name: 'Ram (2-tooth plus)',
                unit: 'head'
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
            },

            //Crops
            {
                code: 'INC-HVT-CROP',
                name: 'Crop',
                unit: 't'
            },
            //Horticulture (non-perennial)
            {
                code: 'INC-HVT-FRUT',
                name: 'Fruit',
                unit: 't'
            },
            //*********** Expenses *********
            // Preharvest
            {
                code: 'EXP-HVP-SEED',
                name: 'Seed',
                unit: 'kg'
            }, {
                code: 'EXP-HVP-PLTM',
                name: 'Plant Material',
                unit: 'each'
            }, {
                code: 'EXP-HVP-FERT',
                name: 'Fertiliser',
                unit: 't'
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
                code: 'EXP-HVP-SPYA',
                name: 'Aerial spraying',
                unit: 'ha'
            }, {
                code: 'EXP-HVP-INSH',
                name: 'Crop Insurance (Hail)',
                unit: 't'
            }, {
                code: 'EXP-HVP-INSM',
                name: 'Crop Insurance (Multiperil)',
                unit: 't'
            }, {
                code: 'EXP-HVP-HEDG',
                name: 'Hedging cost',
                unit: 't'
            },
            //Harvest
            {
                code: 'EXP-HVT-LABC',
                name: 'Contract work (Harvest)',
                unit: 'ha'
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
                name: 'Drying and cleaning',
                unit: 't'
            }, {
                code: 'EXP-HVT-PAKC',
                name: 'Packing cost',
                unit: 'each'
            },
            //Indirect
            {
                code: 'EXP-IDR-FUEL',
                name: 'Fuel',
                unit: 'l'
            }, {
                code: 'EXP-IDR-REPP',
                name: 'Repairs & parts',
                unit: 'Total'
            }, {
                code: 'EXP-IDR-ELEC',
                name: 'Electricity',
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
                name: 'Other costs',
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
                name: 'Weaner lambs',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SEWE',
                name: 'Ewe',
                unit: 'head'
            }, {
                code: 'EXP-RPM-SWTH',
                name: 'Wether (2-tooth plus)',
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
                name: 'Weaner calves',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CCOW',
                name: 'Cow or heifer',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST18',
                name: 'Steer (18 moths plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CST36',
                name: 'Steer (3 years plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-CBULL',
                name: 'Bull (3 years plus)',
                unit: 'head'
            },

            //Goats
            {
                code: 'EXP-RPM-GKID',
                name: 'Kid',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GWEAN',
                name: 'Weaner kids',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GEWE',
                name: 'Ewe (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GCAST',
                name: 'Castrate (2-tooth plus)',
                unit: 'head'
            }, {
                code: 'EXP-RPM-GRAM',
                name: 'Ram (2-tooth plus)',
                unit: 'head'
            },
            //Animal feed
            {
                code: 'EXP-AMF-LICK',
                name: 'Lick',
                unit: 'kg'
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
                name: 'Horticulture transport',
                unit: 't'
            }, {
                code: 'EXP-MRK-CRPT',
                name: 'Crop transport',
                unit: 't'
            }
        ], 'code'));

        readOnlyProperty(EnterpriseBudgetBase, 'categoryOptions', {
            crop: {
                INC: {
                    'Crop Sales': getCategoryArray(['INC-HVT-CROP'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-SEED', 'EXP-HVP-FERT', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-PEST', 'EXP-HVP-SPYA', 'EXP-HVP-INSH', 'EXP-HVP-INSM', 'EXP-HVP-HEDG']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC']),
                    'Marketing': getCategoryArray(['EXP-MRK-CRPF', 'EXP-MRK-CRPT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-OTHER'])
                }
            },
            horticulture: {
                INC: {
                    'Fruit Sales': getCategoryArray(['INC-HVT-FRUT'])
                },
                EXP: {
                    'Preharvest': getCategoryArray(['EXP-HVP-PLTM', 'EXP-HVP-FERT', 'EXP-HVP-LIME', 'EXP-HVP-HERB', 'EXP-HVP-PEST', 'EXP-HVP-SPYA', 'EXP-HVP-INSH', 'EXP-HVP-INSM']),
                    'Harvest': getCategoryArray(['EXP-HVT-LABC', 'EXP-HVT-STOR', 'EXP-HVT-PAKM', 'EXP-HVT-DYCL', 'EXP-HVT-PAKC']),
                    'Marketing': getCategoryArray(['EXP-MRK-HOTF', 'EXP-MRK-HOTT']),
                    'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-SCHED', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                }
            },
            livestock: {
                Cattle: {
                    INC: {
                        'Livestock Sales': getCategoryArray(['INC-LSS-CCALV', 'INC-LSS-CWEN', 'INC-LSS-CCOW', 'INC-LSS-CST18', 'INC-LSS-CST36', 'INC-LSS-CBULL']),
                        'Product Sales': getCategoryArray(['INC-LSP-MILK'])
                    },
                    EXP: {
                        'Replacements': getCategoryArray(['EXP-RPM-CCALV', 'EXP-RPM-CWEN', 'EXP-RPM-CCOW', 'EXP-RPM-CST18', 'EXP-RPM-CST36', 'EXP-RPM-CBULL']),
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
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
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
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
                        'Animal Feed': getCategoryArray(['EXP-AMF-LICK']),
                        'Husbandry': getCategoryArray(['EXP-HBD-VACC', 'EXP-HBD-DIPP', 'EXP-HBD-VETY', 'EXP-HBD-SHER', 'EXP-HBD-CRCH']),
                        'Marketing': getCategoryArray(['EXP-MRK-LSSF', 'EXP-MRK-LSPF', 'EXP-MRK-LSTP']),
                        'Indirect Costs': getCategoryArray(['EXP-IDR-FUEL', 'EXP-IDR-REPP', 'EXP-IDR-ELEC', 'EXP-IDR-WATR', 'EXP-IDR-LABP', 'EXP-IDR-LICS', 'EXP-IDR-INSA', 'EXP-IDR-OTHER'])
                    }
                }
            }
        });

        function getCategoryArray (categoryCodes) {
            return underscore.chain(categoryCodes)
                .map(function (code) {
                    return EnterpriseBudgetBase.categories[code];
                })
                .compact()
                .value();
        }

        function findGroupNameByCategory(instance, sectionCode, groupName, categoryCode) {
            return (groupName ? groupName : underscore.chain(instance.getCategoryOptions(sectionCode))
                .map(function (categoryGroup, categoryGroupName) {
                    return (underscore.where(categoryGroup, {code: categoryCode}).length > 0 ? categoryGroupName : undefined);
                })
                .compact()
                .first()
                .value());
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
        var representativeAnimal = {
            Cattle: 'Cow or heifer',
            Sheep: 'Ewe',
            Goats: 'Ewe (2-tooth plus)'
        };

        var baseAnimal = {
            'Cattle (Extensive)': 'Cattle',
            'Cattle (Feedlot)': 'Cattle',
            'Cattle (Stud)': 'Cattle',
            'Sheep (Extensive)': 'Sheep',
            'Sheep (Feedlot)': 'Sheep',
            'Sheep (Stud)': 'Sheep'
        };

        var conversionRate = {
            Cattle: {
                'Calf': 0.32,
                'Weaner calves': 0.44,
                'Cow or heifer': 1.1,
                'Steer (18 months plus)': 0.75,
                'Steer (18 moths plus)': 0.75,
                'Steer (3 years plus)': 1.1,
                'Bull (3 years plus)': 1.36
            },
            Sheep: {
                'Lamb': 0.08,
                'Weaner Lambs': 0.11,
                'Ewe': 0.16,
                'Wether (2-tooth plus)': 0.16,
                'Ram (2-tooth plus)': 0.23
            },
            Goats: {
                'Kid': 0.08,
                'Weaner kids': 0.12,
                'Ewe (2-tooth plus)': 0.17,
                'Castrate (2-tooth plus)': 0.17,
                'Ram (2-tooth plus)': 0.22
            }
        };

        var breedingStock = {
            'Cattle (Extensive)': ['Cow or heifer', 'Bull (3 years plus)'],
            'Sheep (Extensive)': ['Ewe', 'Ram (2-tooth plus)']
        };

        EnterpriseBudgetBase.validates({
            data: {
                required: true,
                object: true
            }
        });

        return EnterpriseBudgetBase;
    }]);

sdkModelEnterpriseBudget.factory('EnterpriseBudget', ['$filter', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, EnterpriseBudgetBase, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, underscore) {
        function EnterpriseBudget(attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data.details = this.data.details || {};
            this.data.details.cycleStart = this.data.details.cycleStart || 0;
            this.data.details.productionArea = this.data.details.productionArea || '1 Hectare';

            this.data.schedules = this.data.schedules || {};

            computedProperty(this, 'commodityTitle', function () {
                return getCommodityTitle(this.assetType);
            });

            privateProperty(this, 'getCommodities', function () {
                return getAssetCommodities(this.assetType);
            });

            privateProperty(this, 'getShiftedCycle', function () {
                return getShiftedCycle(this);
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
                    (underscore.isUndefined(defaultValue) ? angular.copy(monthlyPercent) : underscore.range(12).map(function () {
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
                    return value != 0;
                }) : -1);

                return (monthIndex !== -1 ? monthIndex : 0);
            });

            privateProperty(this, 'getLastAllocationIndex', function (sectionCode, costStage) {
                var section = this.getSection(sectionCode, costStage),
                    monthIndex = (section && section.total ? underscore.findLastIndex(this.shiftMonthlyArray(section.total.valuePerMonth), function (value) {
                        return value != 0;
                    }) : -1);

                return (monthIndex !== -1 ? monthIndex + 1 : 12);
            });

            computedProperty(this, 'numberOfAllocatedMonths', function () {
                return this.getLastAllocationIndex('INC') - this.getAllocationIndex('EXP');
            });

            privateProperty(this, 'recalculate', function () {
                return recalculateEnterpriseBudget(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetType = attrs.assetType;
            this.averaged = attrs.averaged || false;
            this.cloneCount = attrs.cloneCount || 0;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.commodityType = attrs.commodityType;
            this.favoriteCount = attrs.favoriteCount || 0;
            this.favorited = attrs.favorited || false;
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
            } else if (this.assetType === 'horticulture') {
                this.data.details.yearsToMaturity = this.data.details.yearsToMaturity || getYearsToMaturity(this);
                this.data.details.maturityFactor = this.data.details.maturityFactor || [];
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
              'Canola',
              'Cotton',
              'Cowpea',
              'Grain Sorghum',
              'Groundnut',
              'Lucerne',
              'Lupin',
              'Maize (Fodder)',
              'Maize (Green)',
              'Maize (Seed)',
              'Maize (White)',
              'Maize (Yellow)',
              'Oat',
              'Potato',
              'Rye',
              'Soya Bean',
              'Sunflower',
              'Sweet Corn',
              'Tobacco',
              'Triticale',
              'Wheat'
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
              'Fig',
              'Garlic',
              'Gooseberry',
              'Grape (Table)',
              'Grape (Wine)',
              'Guava',
              'Hops',
              'Kiwi',
              'Lemon',
              'Lentil',
              'Macadamia Nut',
              'Mandarin',
              'Mango',
              'Melon',
              'Mulberry',
              'Nectarine',
              'Olive',
              'Onion',
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
              'Pumpkin',
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

        var monthlyPercent = [8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34, 8.33, 8.33, 8.34];

        // Horticulture
        var yearsToMaturity = {
            'Apple': 25,
            'Apricot': 18,
            'Avocado': 8,
            'Blueberry': 8,
            'Citrus (Hardpeel)': 25,
            'Citrus (Softpeel)': 25,
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
                    }

                    budgetSection.costStage = EnterpriseBudget.costStages[i];
                }
            });

            // Validate maturity
            if (instance.assetType == 'horticulture' && instance.data.details.yearsToMaturity) {
                while (instance.data.details.maturityFactor.length < instance.data.details.yearsToMaturity) {
                    instance.data.details.maturityFactor.push(Math.floor((100 / instance.data.details.yearsToMaturity) * (instance.data.details.maturityFactor.length + 1)));
                }

                instance.data.details.maturityFactor = instance.data.details.maturityFactor.slice(0, instance.data.details.yearsToMaturity);
            }
        }

        var roundValue = $filter('round');

        function recalculateEnterpriseBudget (instance) {
            validateEnterpriseBudget(instance);

            if(instance.assetType == 'livestock') {
                instance.data.details.calculatedLSU = instance.data.details.herdSize * instance.getConversionRate();
            }

            angular.forEach(instance.data.sections, function(section) {
                section.total = {
                    value: 0
                };

                if(instance.assetType == 'livestock') {
                    section.total.valuePerLSU = 0;
                }

                angular.forEach(section.productCategoryGroups, function(group) {
                    group.total = {
                        value: 0
                    };

                    if(instance.assetType == 'livestock') {
                        group.total.valuePerLSU = 0;
                    }

                    angular.forEach(group.productCategories, function(category) {
                        if(category.unit == '%') {
                            var groupSum = underscore
                                .chain(instance.data.sections)
                                .filter(function (groupingSection) {
                                    return (groupingSection.costStage === section.costStage);
                                })
                                .pluck('productCategoryGroups')
                                .flatten()
                                .reduce(function(total, group) {
                                    return (group.name == category.incomeGroup && group.total !== undefined ? total + group.total.value : total);
                                }, 0)
                                .value();

                            category.quantity = roundValue(groupSum / 100);
                        } else {
                            category.quantity = (category.unit == 'Total' ? 1 : category.quantity);
                        }

                        if(instance.assetType == 'livestock') {
                            category.valuePerLSU = (category.pricePerUnit || 0) / instance.getConversionRate(category.name);
                            group.total.valuePerLSU += category.valuePerLSU;
                        }

                        var schedule = (underscore.isArray(category.schedule) ? category.schedule : instance.getSchedule(category.schedule)),
                            scheduleTotalAllocation = underscore.reduce(schedule, function (total, value) {
                                return total + (value || 0);
                            }, 0);

                        category.value = (((category.pricePerUnit || 0) * (category.quantity || 0)) / 100) * scheduleTotalAllocation;

                        category.valuePerMonth = underscore.map(schedule, function (allocation) {
                            return (category.value / 100) * allocation;
                        });

                        category.quantityPerMonth = underscore.map(schedule, function (allocation) {
                            return (category.quantity / 100) * allocation;
                        });

                        group.total.value += category.value;
                        group.total.valuePerMonth = (group.total.valuePerMonth ?
                            underscore.map(group.total.valuePerMonth, function (value, index) {
                                return value + category.valuePerMonth[index];
                            }) : angular.copy(category.valuePerMonth));
                    });

                    section.total.value += group.total.value;
                    section.total.valuePerMonth = (section.total.valuePerMonth ?
                        underscore.map(section.total.valuePerMonth, function (value, index) {
                            return value + group.total.valuePerMonth[index];
                        }) : angular.copy(group.total.valuePerMonth));

                    if(instance.assetType == 'livestock') {
                        section.total.valuePerLSU += group.total.valuePerLSU;
                    }
                });
            });

            instance.data.details.grossProfitByStage = underscore.object(EnterpriseBudget.costStages,
                underscore.map(EnterpriseBudget.costStages, function (stage) {
                    return underscore
                        .chain(instance.data.sections)
                        .where({costStage: stage})
                        .reduce(function (total, section) {
                            return (section.code === 'INC' ? total + section.total.value :
                                (section.code === 'EXP' ? total - section.total.value : total));
                        }, 0)
                        .value();
                }));

            instance.data.details.grossProfit = instance.data.details.grossProfitByStage[instance.defaultCostStage];

            if(instance.assetType == 'livestock') {
                instance.data.details.grossProfitPerLSU = instance.data.details.grossProfit / instance.data.details.calculatedLSU;
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
    }]);

var sdkModelFarm = angular.module('ag.sdk.model.farm', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelFarm.factory('Farm', ['inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Farm (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;
        }

        inheritModel(Farm, Model.Base);

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

var sdkModelFarmValuationDocument = angular.module('ag.sdk.model.farm-valuation', ['ag.sdk.model.asset', 'ag.sdk.model.document']);

sdkModelFarmValuationDocument.factory('FarmValuation', ['Asset', 'computedProperty', 'Document', 'inheritModel', 'privateProperty',
    function (Asset, computedProperty, Document, inheritModel, privateProperty) {
        function FarmValuation (attrs) {
            Document.apply(this, arguments);

            this.docType = 'farm valuation';
        }

        inheritModel(FarmValuation, Document);

        FarmValuation.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'farm valuation'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return FarmValuation;
    }]);

var sdkModelFinancial = angular.module('ag.sdk.model.financial', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.utilities']);

sdkModelFinancial.factory('Financial', ['$filter', 'inheritModel', 'Model', 'privateProperty', 'underscore',
    function ($filter, inheritModel, Model, privateProperty, underscore) {
        function Financial (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};
            this.data.assets = this.data.assets || {};
            this.data.liabilities = this.data.liabilities || {};
            this.data.ratios = this.data.ratios || {};

            privateProperty(this, 'recalculate', function () {
                return recalculate(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.month = attrs.month;
            this.year = attrs.year;
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;

            // Models
            this.organization = attrs.organization;
        }

        inheritModel(Financial, Model.Base);

        var roundValue = $filter('round');

        function calculateRatio (numeratorProperties, denominatorProperties) {
            numeratorProperties = (underscore.isArray(numeratorProperties) ? numeratorProperties : [numeratorProperties]);
            denominatorProperties = (underscore.isArray(denominatorProperties) ? denominatorProperties : [denominatorProperties]);

            var numerator = underscore.reduce(numeratorProperties, function (total, value) {
                    return total + (value || 0);
                }, 0),
                denominator = underscore.reduce(denominatorProperties, function (total, value) {
                    return total + (value || 0);
                }, 0);

            return (denominator ? roundValue(numerator / denominator) : 0);
        }

        function recalculate (instance) {
            instance.data.totalAssets = roundValue(underscore.chain(instance.data.assets)
                .values()
                .flatten()
                .reduce(function (total, asset) {
                    return total + (asset.estimatedValue || 0);
                }, 0)
                .value());
            instance.data.totalLiabilities = roundValue(underscore.chain(instance.data.liabilities)
                .values()
                .flatten()
                .reduce(function (total, liability) {
                    return total + (liability.estimatedValue || 0);
                }, 0)
                .value());

            instance.netWorth = roundValue(instance.data.totalAssets - instance.data.totalLiabilities);
            instance.grossProfit = roundValue((instance.data.productionIncome || 0) - (instance.data.productionExpenditure || 0));

            instance.data.ebitda = roundValue(instance.grossProfit + (instance.data.otherIncome || 0) - (instance.data.otherExpenditure || 0));
            instance.data.ebit = roundValue(instance.data.ebitda - (instance.data.depreciationAmortization || 0));
            instance.data.ebt = roundValue(instance.data.ebit - (instance.data.interestPaid || 0));

            instance.netProfit = roundValue(instance.data.ebt - (instance.data.taxPaid || 0));

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

        Financial.validates({
            organizationId: {
                required: true,
                numeric: true
            },
            month: {
                numeric: true,
                range: {
                    from: 1,
                    to: 12
                }
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

var sdkModelLegalEntity = angular.module('ag.sdk.model.legal-entity', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.asset', 'ag.sdk.model.liability']);

sdkModelLegalEntity.factory('LegalEntity', ['Asset', 'inheritModel', 'Liability', 'Model', 'readOnlyProperty', 'underscore',
    function (Asset, inheritModel, Liability, Model, readOnlyProperty, underscore) {
        function LegalEntity (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.addressCity = attrs.addressCity;
            this.addressCode = attrs.addressCode;
            this.addressDistrict = attrs.addressDistrict;
            this.addressStreet = attrs.addressStreet;
            this.email = attrs.email;
            this.fax = attrs.fax;
            this.id = attrs.id || attrs.$id;
            this.mobile = attrs.mobile;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.registrationNumber = attrs.registrationNumber;
            this.telephone = attrs.telephone;
            this.type = attrs.type;
            this.uuid = attrs.uuid;

            this.assets = underscore.map(attrs.assets, function (asset) {
                return Asset.newCopy(asset);
            });

            this.liabilities = underscore.map(attrs.liabilities, function (liability) {
                return Liability.newCopy(liability);
            });
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
    }]);

var sdkModelLiability = angular.module('ag.sdk.model.liability', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.base']);

sdkModelLiability.factory('Liability', ['$filter', 'computedProperty', 'inheritModel', 'Model', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, inheritModel, Model, moment, privateProperty, readOnlyProperty, underscore) {
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
        
        var roundValue = $filter('round');

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
                    var installmentPayment = (this.frequency === 'once' ? month.opening : instance.installmentPayment * paymentsPerMonth);

                    if (month.opening > 0) {
                        month.repayment.bank = (month.opening <= installmentPayment ? month.opening : installmentPayment);
                    }
                }

                var totalRepayment = underscore.reduce(month.repayment, function (total, amount, source) {
                    return total + (amount || 0);
                }, 0);

                month.balance = roundValue(month.opening - totalRepayment + month.withdrawal <= 0 ? 0 : month.opening - totalRepayment + month.withdrawal);
                month.interest = roundValue(((instance.interestRate / 12) * month.balance) / 100);
                month.closing = roundValue(month.balance === 0 ? 0 : month.balance + month.interest);
            });
        }

        function Liability (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            computedProperty(this, 'title', function () {
                return this.name || this.category;
            });

            computedProperty(this, 'paymentMonths', function () {
                var paymentsPerYear = _frequency[this.frequency],
                    firstPaymentMonth = moment(this.offsetDate, 'YYYY-MM-DD').month();

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
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    currentMonth = moment(month, 'YYYY-MM-DD'),
                    appliedMonth = currentMonth.diff(startMonth, 'months');

                var monthlyData = angular.copy(this.data.monthly || []);
                initializeMonthlyTotals(this, monthlyData, appliedMonth);

                return monthlyData[appliedMonth] || defaultMonth();
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
                underscore.each(this.data.monthly, function (month, index) {
                    month.repayment = {};
                });

                recalculateMonthlyTotals(this, this.data.monthly);
            });

            privateProperty(this, 'resetWithdrawalsInRange', function (rangeStart, rangeEnd) {
                var startMonth = moment(this.offsetDate, 'YYYY-MM-DD'),
                    appliedStartMonth = moment(rangeStart, 'YYYY-MM-DD').diff(startMonth, 'months'),
                    appliedEndMonth = moment(rangeEnd, 'YYYY-MM-DD').diff(startMonth, 'months');

                this.data.monthly = this.data.monthly || [];

                appliedStartMonth = (appliedStartMonth < 0 ? 0 : appliedStartMonth);
                appliedEndMonth = (appliedEndMonth > this.data.monthly.length ? this.data.monthly.length - 1 : appliedEndMonth);

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
                        summedRepayment = underscore.reduce(monthLiability.repayment, function (total, amount) {
                            return total + (amount || 0);
                        }, 0),
                        openingPlusBalance = monthLiability.opening + monthLiability.withdrawal - summedRepayment,
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = roundValue(repayment - limitedRepayment);
                    monthLiability.repayment[source] = monthLiability.repayment[source] || 0;
                    monthLiability.repayment[source] += limitedRepayment;

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
                        repaymentWithoutSource = underscore.reduce(monthLiability.repayment, function (total, amount, src) {
                            return total + (src === source ? 0 : amount || 0)
                        }, 0),
                        openingPlusBalance = monthLiability.opening + monthLiability.withdrawal - repaymentWithoutSource,
                        limitedRepayment = (openingPlusBalance <= repayment ? openingPlusBalance : repayment);

                    repaymentRemainder = roundValue(repayment - limitedRepayment)
                    monthLiability.repayment[source] = limitedRepayment;

                    recalculateMonthlyTotals(this, this.data.monthly);
                }
                // applied month is before the offsetDate, do nothing

                return repaymentRemainder;
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
                        summedWithdrawal = withdrawal + monthLiability.withdrawal,
                        openingMinusRepayment = monthLiability.opening - underscore.reduce(monthLiability.repayment, function (total, amount) {
                                return total + (amount || 0);
                            }, 0),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, this.creditLimit - openingMinusRepayment), summedWithdrawal) : summedWithdrawal),
                        withdrawalRemainder = roundValue(summedWithdrawal - limitedWithdrawal);

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
                        openingMinusRepayment = monthLiability.opening - underscore.reduce(monthLiability.repayment, function (total, amount) {
                                return total + (amount || 0);
                            }, 0),
                        limitedWithdrawal = (this.creditLimit > 0 ? Math.min(Math.max(0, this.creditLimit - openingMinusRepayment), withdrawal) : withdrawal),
                        withdrawalRemainder = roundValue(withdrawal - limitedWithdrawal);

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
                    return total + (typeof liability.repayment == 'number' ? liability.repayment : underscore.reduce(liability.repayment, function (subtotal, value) {
                        return subtotal + (value || 0);
                    }, 0));
                }, 0);
            });

            privateProperty(this, 'getLiabilityOpening', function () {
                return (moment(this.startDate).isBefore(this.openingDate) && !underscore.isUndefined(this.openingBalance) ? this.openingBalance : this.amount);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
            this.merchantUuid = attrs.merchantUuid;
            this.name = attrs.name;
            this.type = attrs.type;
            this.category = attrs.category;
            this.openingBalance = attrs.openingBalance || 0;
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
            'bi-yearly': 'Bi-Yearly',
            'yearly': 'Yearly'
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

var sdkModelProductionSchedule = angular.module('ag.sdk.model.production-schedule', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model']);

sdkModelProductionSchedule.factory('ProductionGroup', ['$filter', 'computedProperty', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'ProductionSchedule', 'underscore',
    function ($filter, computedProperty, EnterpriseBudgetBase, inheritModel, moment, privateProperty, ProductionSchedule, underscore) {
        function ProductionGroup (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data.details = this.data.details || {};

            this.productionSchedules = [];

            privateProperty(this, 'addProductionSchedule', function (productionSchedule) {
                if (underscore.isUndefined(this.startDate) || moment(productionSchedule.startDate).isBefore(this.startDate)) {
                    this.startDate = moment(productionSchedule.startDate).format('YYYY-MM-DD');
                }

                if (underscore.isUndefined(this.endDate) || moment(productionSchedule.endDate).isAfter(this.endDate)) {
                    this.endDate = moment(productionSchedule.endDate).format('YYYY-MM-DD');
                }

                this.productionSchedules.push(productionSchedule);

                this.data.details.size = roundValue(underscore.reduce(this.productionSchedules, function (total, schedule) {
                    return total + schedule.allocatedSize;
                }, 0), 2);

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryCode, costStage, property) {
                return adjustCategory(this, sectionCode, categoryCode, costStage, property);
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

            privateProperty(this, 'recalculate', function () {
                recalculateProductionGroup(this);
            });

            computedProperty(this, 'allocatedSize', function () {
                return roundValue(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'numberOfMonths', function () {
                return moment(this.endDate).diff(this.startDate, 'months');
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');


            underscore.each(attrs.productionSchedules, this.addProductionSchedule, this);
        }

        inheritModel(ProductionGroup, EnterpriseBudgetBase);

        var roundValue = $filter('round');

        function adjustCategory (instance, sectionCode, categoryCode, costStage, property) {
            var productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                value = 0;

            if (productionCategory && !underscore.isUndefined(productionCategory[property])) {
                if (underscore.contains(['valuePerLSU', 'pricePerUnit', 'quantityPerLSU', 'quantityPerHa'], property)) {
                    value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                        return total + category[property];
                    }, 0) / productionCategory.categories.length, 2);
                } else if (underscore.contains(['value', 'quantity'], property)) {
                    value = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                        return total + category[property];
                    }, 0), 2);
                } else if (property === 'valuePerHa') {
                    value = roundValue(productionCategory.value / instance.allocatedSize, 2);
                }

                var affectedProductionSchedules = underscore.reject(instance.productionSchedules, function (productionSchedule) {
                    return underscore.isUndefined(productionSchedule.getCategory(sectionCode, categoryCode, costStage));
                });

                if (property !== 'schedule') {
                    var offset = (100 / value) * productionCategory[property],
                        remainder = productionCategory[property];

                    underscore.each(affectedProductionSchedules, function (productionSchedule, index, list) {
                        var category = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        if (underscore.isFinite(offset) && category[property] != 0) {
                            category[property] = (category[property] / 100) * offset;
                        } else if (index < list.length - 1) {
                            category[property] = category[property] / list.length;
                        } else {
                            category[property] = remainder;
                        }

                        remainder = roundValue(remainder - productionSchedule.adjustCategory(sectionCode, categoryCode, costStage, property), 2);
                    });
                } else if (property === 'schedule') {
                    var valuePerMonth = underscore.reduce(productionCategory.schedule, function (valuePerMonth, allocation, index) {
                        //valuePerMonth[index] = roundValue((productionCategory.value / 100) * allocation, 2);
                        valuePerMonth[index] = (productionCategory.value / 100) * allocation;

                        return valuePerMonth;
                    }, initializeArray(instance.numberOfMonths));

                    underscore.each(productionCategory.valuePerMonth, function (value, index) {
                        var categoryCount = underscore.chain(productionCategory.categories)
                            .filter(function (category) {
                                return index >= category.offset && index < category.offset + category.valuePerMonth.length;
                            })
                            .size();

                        underscore.each(affectedProductionSchedules, function (productionSchedule) {
                            var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months'),
                                category = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                            if (index >= startOffset && index < startOffset + category.valuePerMonth.length) {
                                //category.valuePerMonth[index - startOffset] = (value == 0 ?
                                //    roundValue(valuePerMonth[index] / categoryCount, 2) :
                                //    roundValue(valuePerMonth[index] * (category.valuePerMonth[index - startOffset] / value), 2));
                                category.valuePerMonth[index - startOffset] = (value == 0 ?
                                    valuePerMonth[index] / categoryCount :
                                    valuePerMonth[index] * (category.valuePerMonth[index - startOffset] / value));
                            }
                        });
                    });

                    underscore.each(affectedProductionSchedules, function (productionSchedule) {
                        var category = productionSchedule.getCategory(sectionCode, categoryCode, costStage);

                        category.value = underscore.reduce(category.valuePerMonth, function (total, value) {
                            return total + (value || 0);
                        }, 0);

                        category.schedule = underscore.map(category.valuePerMonth, function (value) {
                            return (category.value > 0 ? roundValue((100 / category.value) * value, 2) : 0);
                        });

                        productionSchedule.adjustCategory(sectionCode, categoryCode, costStage, property);
                    });
                }
            }
        }

        function initializeArray (size) {
            return underscore.range(size).map(function () {
                return 0;
            });
        }

        function recalculateProductionGroup (instance) {
            instance.data.sections = [];

            angular.forEach(instance.productionSchedules, function (productionSchedule) {
                var startOffset = moment(productionSchedule.startDate).diff(instance.startDate, 'months');

                productionSchedule.recalculate();

                angular.forEach(productionSchedule.data.sections, function (section) {
                    if (productionSchedule.data.details.applyEstablishmentCosts || section.costStage === productionSchedule.defaultCostStage) {
                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                productionCategory.per = category.per;
                                productionCategory.categories = productionCategory.categories || [];
                                productionCategory.categories.push(underscore.extend({
                                    offset: startOffset,
                                    size: productionSchedule.allocatedSize
                                }, category));

                                productionCategory.valuePerMonth = underscore.reduce(category.valuePerMonth, function (valuePerMonth, value, index) {
                                    valuePerMonth[index + startOffset] = roundValue(valuePerMonth[index + startOffset] + value);

                                    return valuePerMonth;
                                }, productionCategory.valuePerMonth || initializeArray(instance.numberOfMonths));

                                productionCategory.value = roundValue(underscore.reduce(productionCategory.valuePerMonth, function (total, value) {
                                    return total + value;
                                }, 0), 2);

                                productionCategory.quantityPerMonth = underscore.reduce(category.quantityPerMonth, function (quantityPerMonth, value, index) {
                                    quantityPerMonth[index + startOffset] = roundValue(quantityPerMonth[index + startOffset] + value);

                                    return quantityPerMonth;
                                }, productionCategory.quantityPerMonth || initializeArray(instance.numberOfMonths));

                                productionCategory.quantity = roundValue(underscore.reduce(productionCategory.quantityPerMonth, function (total, value) {
                                    return total + value;
                                }, 0), 2);

                                productionCategory.pricePerUnit = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                    return total + category.pricePerUnit;
                                }, 0) / productionCategory.categories.length, 2);

                                productionCategory.schedule = underscore.reduce(productionCategory.valuePerMonth, function (schedule, value, index) {
                                    schedule[index] = roundValue((100 / productionCategory.value) * value, 2);

                                    return schedule;
                                }, initializeArray(instance.numberOfMonths));

                                if (productionSchedule.type == 'livestock') {
                                    productionCategory.quantityPerLSU = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + category.quantityPerLSU;
                                    }, 0) / productionCategory.categories.length, 2);

                                    productionCategory.valuePerLSU = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0) / productionCategory.categories.length, 2);
                                } else {
                                    productionCategory.quantityPerHa = roundValue(underscore.reduce(productionCategory.categories, function (total, category) {
                                        return total + category.quantityPerHa;
                                    }, 0) / productionCategory.categories.length, 2);
                                }

                                if (section.code === 'EXP') {
                                    productionCategory.valuePerHa = roundValue(productionCategory.value / instance.allocatedSize, 2);
                                }
                            });

                            // Group totals
                            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (productionGroup) {
                                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                    return total + category.value;
                                }, 0);

                                productionGroup.total.valuePerMonth = underscore
                                    .chain(productionGroup.productCategories)
                                    .pluck('valuePerMonth')
                                    .reduce(function (totalPerMonth, valuePerMonth) {
                                        return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                                            return totalPerMonth[index] + value;
                                        }) : angular.copy(valuePerMonth));
                                    })
                                    .value();

                                if (productionSchedule.type == 'livestock') {
                                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var productionSection = instance.getSection(section.code, section.costStage);

                        if (productionSection) {
                            productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                return total + group.total.value;
                            }, 0);

                            productionSection.total.valuePerMonth = underscore
                                .chain(productionSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('valuePerMonth')
                                .reduce(function (totalPerMonth, valuePerMonth) {
                                    return (totalPerMonth ? underscore.map(valuePerMonth, function (value, index) {
                                        return totalPerMonth[index] + value;
                                    }) : angular.copy(valuePerMonth));
                                })
                                .value();

                            if (productionSchedule.type == 'livestock') {
                                productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                    return total + group.total.valuePerLSU;
                                }, 0);
                            }

                            instance.data.details.grossProfit += (productionSection.code == 'INC' ?
                                (instance.data.details.grossProfit + productionSection.total.value) :
                                (instance.data.details.grossProfit - productionSection.total.value));
                        }
                    }
                });
            });

            instance.data.details.grossProfit = underscore.reduce(instance.data.sections, function (total, section) {
                return (section.code == 'INC' ? total + section.total.value : total - section.total.value);
            }, 0);
        }

        return ProductionGroup;
    }]);

sdkModelProductionSchedule.factory('ProductionSchedule', ['$filter', 'computedProperty', 'EnterpriseBudget', 'EnterpriseBudgetBase', 'inheritModel', 'moment', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, EnterpriseBudget, EnterpriseBudgetBase, inheritModel, moment, privateProperty, readOnlyProperty, underscore) {
        function ProductionSchedule (attrs) {
            EnterpriseBudgetBase.apply(this, arguments);

            this.data.details = this.data.details || {};

            privateProperty(this, 'setDate', function (startDate) {
                startDate = moment(startDate);
                startDate.date(1);

                this.startDate = startDate.format('YYYY-MM-DD');

                var monthsPerCycle = 12 / Math.floor(12 / this.numberOfAllocatedMonths),
                    nearestAllocationMonth = (this.budget ? ((monthsPerCycle * Math.floor((startDate.month() - this.budget.cycleStart) / monthsPerCycle)) + this.budget.cycleStart) : startDate.month()),
                    allocationDate = moment([startDate.year()]).add(nearestAllocationMonth, 'M');

                this.startDate = allocationDate.format('YYYY-MM-DD');
                this.endDate = allocationDate.add(1, 'y').format('YYYY-MM-DD');

                if (this.asset) {
                    var assetAge = (this.asset.data.establishedDate ? moment(this.startDate).diff(this.asset.data.establishedDate, 'years') : 0);

                    if (assetAge != this.data.details.assetAge) {
                        this.data.details.assetAge = assetAge;

                        this.recalculate();
                    }
                }
            });

            privateProperty(this, 'setAsset', function (asset) {
                this.asset = underscore.omit(asset, ['liabilities', 'productionSchedules']);
                this.assetId = this.asset.id || this.asset.$id;
                this.type = (asset.type === 'cropland' ? 'crop' : (asset.type === 'permanent crop' ? 'horticulture' : 'livestock'));
                this.data.details.fieldName = this.asset.data.fieldName;
                this.data.details.assetAge = (this.asset.data.establishedDate ? moment(this.startDate).diff(this.asset.data.establishedDate, 'years') : 0);

                if (asset.data.crop) {
                    this.data.details.commodity = asset.data.crop;
                }

                if (this.type === 'livestock') {
                    this.data.details.pastureType = (this.asset.data.irrigated ? 'pasture' : 'grazing');

                    if (this.budget && this.budget.data.details.stockingDensity) {
                        this.setLivestockStockingDensity(this.budget.data.details.stockingDensity[this.data.details.pastureType]);
                    }
                }
                
                this.setSize(this.asset.data.size);
            });
            
            privateProperty(this, 'setBudget', function (budget) {
                this.budget = EnterpriseBudget.new(budget);
                this.budgetUuid = this.budget.uuid;
                this.type = this.budget.assetType;

                this.data.budget = this.budget;
                this.data.details = underscore.extend(this.data.details, {
                    applyEstablishmentCosts: false,
                    commodity: this.budget.commodityType,
                    grossProfit: 0
                });

                if (this.type === 'livestock') {
                    this.data.details = underscore.extend(this.data.details, {
                        calculatedLSU: 0,
                        grossProfitPerLSU: 0,
                        herdSize: this.budget.data.details.herdSize || 0,
                        stockingDensity: 0,
                        multiplicationFactor: 0
                    });
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
                if (this.type == 'livestock' && this.data.details.stockingDensity != stockingDensity) {
                    this.data.details.stockingDensity = stockingDensity;

                    this.setSize(this.allocatedSize);
                }
            });

            privateProperty(this, 'setSize', function (size) {
                this.data.details.size = size;

                if (this.type == 'livestock') {
                    this.data.details.calculatedLSU = (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0);
                    this.data.details.multiplicationFactor = roundValue(this.data.details.calculatedLSU ? (this.data.details.stockingDensity ? this.allocatedSize / this.data.details.stockingDensity : 0) / this.data.details.calculatedLSU : 0, 2);

                    if (this.budget) {
                        this.data.details.herdSize = this.budget.data.details.herdSize * this.data.details.multiplicationFactor;
                        this.data.details.grossProfit = this.budget.data.details.grossProfit * this.data.details.multiplicationFactor;
                        this.data.details.grossProfitPerLSU = (this.data.details.calculatedLSU ? this.data.details.grossProfit / this.data.details.calculatedLSU : 0);
                    }
                } else if (this.budget) {
                    this.data.details.grossProfit = this.budget.data.details.grossProfit * this.data.details.size;
                }

                this.recalculate();
            });

            privateProperty(this, 'adjustCategory', function (sectionCode, categoryCode, costStage, property) {
                return adjustCategory(this, sectionCode, categoryCode, costStage, property);
            });

            privateProperty(this, 'recalculate', function () {
                recalculateProductionSchedule(this);
            });

            computedProperty(this, 'scheduleKey', function () {
                return (this.budgetUuid ? this.budgetUuid + '-' : '') +
                    (this.data.details.fieldName ? this.data.details.fieldName + '-' : '') +
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
                return roundValue(this.data.details.size || 0, 2);
            });

            computedProperty(this, 'title', function () {
                return this.allocatedSize + 'ha ' + (this.commodityType ? 'of ' + this.commodityType : '') + (this.startDate ? ' starting ' + moment(this.startDate).format('MMM YYYY') : '');
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

            computedProperty(this, 'income', function () {
                return underscore.findWhere(this.data.sections, {code: 'INC', costStage: this.defaultCostStage});
            });

            computedProperty(this, 'expenses', function () {
                return underscore.findWhere(this.data.sections, {code: 'EXP', costStage: this.defaultCostStage});
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.assetId = attrs.assetId;
            this.budgetUuid = attrs.budgetUuid;
            this.type = attrs.type;
            this.endDate = attrs.endDate && moment(attrs.endDate).format('YYYY-MM-DD');
            this.id = attrs.id || attrs.$id;
            this.organizationId = attrs.organizationId;
            this.startDate = attrs.startDate && moment(attrs.startDate).format('YYYY-MM-DD');

            this.organization = attrs.organization;

            if (attrs.asset) {
                this.setAsset(attrs.asset);
            }

            if (this.data.budget || attrs.budget) {
                this.setBudget(this.data.budget || attrs.budget);
            }
        }

        var roundValue = $filter('round');
        
        function adjustCategory (instance, sectionCode, categoryCode, costStage, property) {
            var productionCategory = instance.getCategory(sectionCode, categoryCode, costStage),
                budgetCategory = instance.budget.getCategory(sectionCode, categoryCode, costStage);

            if (productionCategory && budgetCategory) {
                if (property === 'value') {
                    budgetCategory.value = productionCategory.value / (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    } else {
                        budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                        productionCategory.quantity = productionCategory.value / productionCategory.pricePerUnit;
                    }

                    productionCategory.value = roundValue(budgetCategory.value * (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize), 2);
                } else if (property === 'valuePerHa') {
                    budgetCategory.value = roundValue(productionCategory.valuePerHa, 2);

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    }

                    budgetCategory.quantity = roundValue(budgetCategory.value / budgetCategory.pricePerUnit, 2);
                    productionCategory.value = roundValue(budgetCategory.value * instance.allocatedSize, 2);
                    productionCategory.valuePerHa = budgetCategory.value;
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                } else if (property === 'valuePerLSU') {
                    budgetCategory.valuePerLSU = roundValue(productionCategory.valuePerLSU, 2);
                    budgetCategory.pricePerUnit = budgetCategory.valuePerLSU * instance.budget.getConversionRate(budgetCategory.name);
                    budgetCategory.value = (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(budgetCategory.value * instance.data.details.multiplicationFactor, 2);
                    productionCategory.valuePerLSU = roundValue(budgetCategory.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                } else if (property === 'quantityPerHa') {
                    budgetCategory.quantity = productionCategory.quantityPerHa;
                    budgetCategory.value = (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(budgetCategory.value * instance.allocatedSize, 2);
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                    productionCategory.quantityPerHa = budgetCategory.quantity;
                } else if (property === 'quantityPerLSU') {
                    budgetCategory.quantity = productionCategory.quantityPerLSU;
                    budgetCategory.value = (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(budgetCategory.value * instance.data.details.multiplicationFactor, 2);
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                    productionCategory.quantityPerLSU = budgetCategory.quantity;
                } else if (property === 'quantity') {
                    budgetCategory.quantity = productionCategory.quantity / (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);
                    budgetCategory.value = (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(budgetCategory.value * (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize), 2);
                    productionCategory.quantity = roundValue(productionCategory.value / productionCategory.pricePerUnit, 2);
                } else if (property === 'pricePerUnit') {
                    budgetCategory.pricePerUnit = productionCategory.pricePerUnit;
                    budgetCategory.value = (budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0);
                    productionCategory.value = roundValue(budgetCategory.value * (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize), 2);
                    productionCategory.pricePerUnit = budgetCategory.pricePerUnit;
                } else if (property === 'stock') {
                    budgetCategory.stock = productionCategory.stock;
                } else if (property === 'schedule') {
                    budgetCategory.schedule = instance.budget.unshiftMonthlyArray(productionCategory.schedule);
                    budgetCategory.value = productionCategory.value / (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);

                    if (budgetCategory.unit === 'Total') {
                        budgetCategory.pricePerUnit = budgetCategory.value;
                        productionCategory.pricePerUnit = budgetCategory.value;
                    } else {
                        budgetCategory.quantity = budgetCategory.value / budgetCategory.pricePerUnit;
                        productionCategory.quantity = productionCategory.value / productionCategory.pricePerUnit;
                    }

                    budgetCategory.value = (((budgetCategory.pricePerUnit || 0) * (budgetCategory.quantity || 0)) / 100) * underscore.reduce(budgetCategory.schedule, function (total, value) {
                        return total + (value || 0);
                    }, 0);

                    budgetCategory.valuePerMonth = underscore.map(budgetCategory.schedule, function (allocation) {
                        return (budgetCategory.value / 100) * allocation;
                    });

                    productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(budgetCategory.valuePerMonth), function (value) {
                        return value * (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize);
                    });

                    productionCategory.value = roundValue(underscore.reduce(productionCategory.valuePerMonth, function (total, value) {
                        return total + value;
                    }, 0), 2);
                }

                if(instance.type == 'livestock') {
                    budgetCategory.valuePerLSU = (budgetCategory.pricePerUnit || 0) / instance.budget.getConversionRate(budgetCategory.name);
                }

                if (sectionCode === 'EXP') {
                    productionCategory.valuePerHa = budgetCategory.value;
                }

                instance.$dirty = true;

                return productionCategory[property];
            }
        }

        function recalculateProductionSchedule (instance) {
            if (instance.budget) {
                instance.budget.recalculate();

                instance.data.sections = [];
                instance.data.details.grossProfit = 0;
                
                angular.forEach(instance.budget.data.sections, function (section) {
                    if (instance.data.details.applyEstablishmentCosts || section.costStage === instance.defaultCostStage) {
                        angular.forEach(section.productCategoryGroups, function (group) {
                            angular.forEach(group.productCategories, function (category) {
                                var productionCategory = instance.addCategory(section.code, group.name, category.code, section.costStage);

                                productionCategory.pricePerUnit = category.pricePerUnit;

                                if (instance.type == 'livestock') {
                                    productionCategory.valuePerLSU += roundValue(category.valuePerLSU * instance.data.details.multiplicationFactor, 2);
                                    productionCategory.quantityPerLSU = category.quantity;

                                    if (group.code === 'INC-LSS') {
                                        productionCategory.stock = category.stock || (category.name == instance.getRepresentativeAnimal() ? instance.data.details.herdSize : 0);
                                    }
                                } else {
                                    productionCategory.quantityPerHa = category.quantity;
                                }

                                if (section.code === 'EXP') {
                                    productionCategory.valuePerHa = category.value;
                                }

                                productionCategory.schedule = instance.budget.getShiftedSchedule(category.schedule);

                                productionCategory.valuePerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.valuePerMonth), function (value) {
                                    return roundValue(value * (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize), 2);
                                });

                                productionCategory.quantityPerMonth = underscore.map(instance.budget.shiftMonthlyArray(category.quantityPerMonth), function (value) {
                                    return roundValue(value * (instance.type == 'livestock' ? instance.data.details.multiplicationFactor : instance.allocatedSize), 2);
                                });

                                productionCategory.value = roundValue(underscore.reduce(productionCategory.valuePerMonth, function (total, value) {
                                    return total + value;
                                }, 0), 2);

                                productionCategory.quantity = roundValue(underscore.reduce(productionCategory.quantityPerMonth, function (total, value) {
                                    return total + value;
                                }, 0), 2);
                            });

                            // Group totals
                            var productionGroup = instance.getGroup(section.code, group.name, section.costStage);

                            if (productionGroup) {
                                productionGroup.total.value = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                    return total + category.value;
                                }, 0);

                                productionGroup.total.valuePerMonth = underscore
                                    .chain(productionGroup.productCategories)
                                    .pluck('valuePerMonth')
                                    .reduce(function (total, valuePerMonth) {
                                        return (total ? underscore.map(valuePerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : angular.copy(valuePerMonth));
                                    })
                                    .value();

                                productionGroup.total.quantityPerMonth = underscore
                                    .chain(productionGroup.productCategories)
                                    .pluck('quantityPerMonth')
                                    .reduce(function (total, quantityPerMonth) {
                                        return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                            return total[index] + value;
                                        }) : angular.copy(quantityPerMonth));
                                    })
                                    .value();

                                if (instance.type == 'livestock') {
                                    productionGroup.total.valuePerLSU = underscore.reduce(productionGroup.productCategories, function (total, category) {
                                        return total + category.valuePerLSU;
                                    }, 0);
                                }
                            }
                        });

                        // Section totals
                        var productionSection = instance.getSection(section.code, section.costStage);

                        if (productionSection) {
                            productionSection.total.value = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                return total + group.total.value;
                            }, 0);

                            productionSection.total.valuePerMonth = underscore
                                .chain(productionSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('valuePerMonth')
                                .reduce(function (total, valuePerMonth) {
                                    return (total ? underscore.map(valuePerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : angular.copy(valuePerMonth));
                                })
                                .value();

                            productionSection.total.quantityPerMonth = underscore
                                .chain(productionSection.productCategoryGroups)
                                .pluck('total')
                                .pluck('quantityPerMonth')
                                .reduce(function (total, quantityPerMonth) {
                                    return (total ? underscore.map(quantityPerMonth, function (value, index) {
                                        return total[index] + value;
                                    }) : angular.copy(quantityPerMonth));
                                })
                                .value();

                            if (instance.type == 'livestock') {
                                productionSection.total.valuePerLSU = underscore.reduce(productionSection.productCategoryGroups, function (total, group) {
                                    return total + group.total.valuePerLSU;
                                }, 0);
                            }

                            instance.data.details.grossProfit = (productionSection.code == 'INC' ?
                                (instance.data.details.grossProfit + productionSection.total.value) :
                                (instance.data.details.grossProfit - productionSection.total.value));
                        }
                    }
                });

                if (instance.type == 'livestock') {
                    instance.data.details.grossProfitPerLSU = (instance.data.details.calculatedLSU ? instance.data.details.grossProfit / instance.data.details.calculatedLSU : 0);
                }
            }
        }

        inheritModel(ProductionSchedule, EnterpriseBudgetBase);

        readOnlyProperty(ProductionSchedule, 'productionScheduleTypes', {
            crop: 'Crop',
            horticulture: 'Horticulture',
            livestock: 'Livestock'
        });

        readOnlyProperty(ProductionSchedule, 'allowedLandUse', ['Conservation', 'Cropland', 'Grazing', 'Horticulture (Perennial)', 'Irrigated Cropland', 'Planted Pastures']);

        readOnlyProperty(ProductionSchedule, 'allowedAssets', ['cropland', 'pasture', 'permanent crop']);

        privateProperty(ProductionSchedule, 'getTypeTitle', function (type) {
            return ProductionSchedule.productionScheduleTypes[type] || '';
        });

        ProductionSchedule.validates({
            assetId: {
                required: true,
                numeric: true
            },
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
        function Storable () {
            var _storable = {};

            privateProperty(_storable, 'set', function (inst, attrs) {
                if (attrs) {
                    inst.$complete = attrs.$complete === true;
                    inst.$dirty = attrs.$dirty === true;
                    inst.$id = attrs.$id;
                    inst.$local = attrs.$local === true;
                    inst.$saved = attrs.$saved === true;
                    inst.$uri = attrs.$uri;
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

            privateProperty(field, 'addValidator', function (options, validationName) {
                var validator = validators.find(validationName) || new Validator(options, validationName),
                    configuredFunctions = underscore.flatten([validator.configure(options)]);

                if (underscore.isUndefined(validator.message)) {
                    throw new ValidationMessageNotFoundError(validationName, name);
                }

                underscore.each(configuredFunctions, function (configuredFunction) {
                    field.push(new Validation(name, configuredFunction));
                })
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
    'ag.sdk.helper.enterprise-budget',
    'ag.sdk.helper.expense',
    'ag.sdk.helper.farmer',
    'ag.sdk.helper.favourites',
    'ag.sdk.helper.merchant',
    'ag.sdk.helper.production-plan',
    'ag.sdk.helper.region',
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
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
    'ag.sdk.model.comparable-sale',
    'ag.sdk.model.desktop-valuation',
    'ag.sdk.model.document',
    'ag.sdk.model.enterprise-budget',
    'ag.sdk.model.farm',
    'ag.sdk.model.farm-valuation',
    'ag.sdk.model.financial',
    'ag.sdk.model.legal-entity',
    'ag.sdk.model.liability',
    'ag.sdk.model.production-schedule',
    'ag.sdk.model.errors',
    'ag.sdk.model.store',
    'ag.sdk.model.validation',
    'ag.sdk.model.validators'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.sdk', [
    'ag.sdk.authorization',
    'ag.sdk.id',
    'ag.sdk.utilities',
    'ag.sdk.model',
    'ag.sdk.api',
    'ag.sdk.helper',
    'ag.sdk.library',
    'ag.sdk.interface.map',
    'ag.sdk.test'
]);
