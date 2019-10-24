var sdkApiApp = angular.module('ag.sdk.api', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library', 'ag.sdk.api.geo']);

/**
 * Action API
 */
sdkApiApp.factory('actionApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer();

    return {
        createAction: function (data) {
            return httpRequestor(host + 'api/action', data);
        },
        getActions: function (id, type, params) {
            if (typeof type === 'object') {
                params = type;
                type = undefined;
            }

            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/actions' + (id ? '/' + id : '') + (type ? '/' + type : ''), params);
        },
        getDocumentActions: function (id, params) {
            return pagingService.page(host + 'api/actions/document/' + id, params);
        },
        getOrganizationActions: function (id, params) {
            return pagingService.page(host + 'api/actions/organization/' + id, params);
        },
        getAction: function (id) {
            return httpRequestor(host + 'api/action/' + id);
        },
        deleteAction: function (id) {
            return httpRequestor(host + 'api/action/' + id + '/delete', {});
        }
    };
}]);

/**
 * Activity API
 */
sdkApiApp.factory('activityApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer(),
        removableFields = ['asset', 'assets', 'pointOfInterest'];

    return {
        createActivity: function (data, includeRemovable) {
            return httpRequestor(host + 'api/activity', data, (includeRemovable ? [] : removableFields));
        },
        updateActivity: function (data, includeRemovable) {
            return httpRequestor(host + 'api/activity/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        deleteActivity: function (id) {
            return httpRequestor(host + 'api/activity/' + id + '/delete', {});
        },
        attachAsset: function (id, assetId) {
            return httpRequestor(host + 'api/activity/' + id+ '/add/' + assetId, {});
        },
        detachAsset: function (id, assetId) {
            return httpRequestor(host + 'api/activity/' + id+ '/remove/' + assetId, {});
        }
    };
}]);

/**
 * Aggregation API
 */
sdkApiApp.factory('aggregationApi', ['configuration', 'httpRequestor', 'pagingService', 'underscore', function (configuration, httpRequestor, pagingService, underscore) {
    // TODO: Refactor so that the aggregationApi can be extended for downstream platforms
    var host = configuration.getServer();

    return {
        getCustomerLocations: function () {
            return httpRequestor(host + 'api/aggregation/customer-locations');
        },
        getCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return httpRequestor(host + 'api/aggregation/customer-geodata?x1=' + southWestLng + '&y1=' + southWestLat + '&x2=' + northEastLng + '&y2=' + northEastLat);
        },
        getSublayerBoundaries: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return httpRequestor(host + 'api/aggregation/guideline-sublayers?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat);
        },
        getGroupCustomerLocations: function () {
            return httpRequestor(host + 'api/aggregation/customer-locations-group');
        },
        getGroupCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return httpRequestor(host + 'api/aggregation/customer-geodata-group?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat);
        },
        getFarmlandOverlaps: function (page) {
            return pagingService.page(host + 'api/aggregation/farmland-overlap', page);
        },
        getGuidelineExceptions: function (page) {
            return pagingService.page(host + 'api/aggregation/guideline-exceptions', page);
        },
        listBenefitAuthorisation: function() {
            return httpRequestor(host + 'api/aggregation/report-benefit-authorisation');
        },
        listCrossSelling: function(params) {
            return pagingService.page(host + 'api/aggregation/report-cross-selling', params);
        },
        searchProductionSchedules: function(query) {
            query = underscore.map(query, function (value, key) {
                return (underscore.isString(key) ? key.toLowerCase() : key) + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/aggregation/search-production-schedules' + (query ? '?' + query : ''));
        },
        averageProductionSchedules: function(query) {
            return httpRequestor(host + 'api/aggregation/average-production-schedules', query);
        },
        getDistinctProductionScheduleYears: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/aggregation/distinct-production-schedule-years' + (query ? '?' + query : ''));
        },
        getDistinctProductionScheduleEnterprises: function(query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/aggregation/distinct-production-schedule-enterprises' + (query ? '?' + query : ''));
        },
        getDistinctProductionScheduleCategories: function() {
            return httpRequestor(host + 'api/aggregation/distinct-production-schedule-categories');
        },
        mapReduce: function(query) {
            return httpRequestor(host + 'api/aggregation/map-reduce', query);
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
sdkApiApp.factory('assetApi', ['configuration', 'httpRequestor', 'pagingService', function (configuration, httpRequestor, pagingService) {
    var host = configuration.getServer(),
        removableFields = ['liabilities', 'product', 'productionSchedules'];

    return {
        getAssets: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/assets' + (id ? '/' + id : ''), params);
        },
        createAsset: function (data, includeRemovable) {
            return httpRequestor(host + 'api/asset', data, (includeRemovable ? [] : removableFields));
        },
        getAsset: function (id) {
            return httpRequestor(host + 'api/asset/' + id);
        },
        updateAsset: function (data, includeRemovable) {
            return httpRequestor(host + 'api/asset/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        attachLiability: function (id, data) {
            return httpRequestor(host + 'api/asset/' + id + '/liability', data);
        },
        detachLiability: function (id, liabilityId) {
            return httpRequestor(host + 'api/asset/' + id + '/liability/' + liabilityId + '/delete', {});
        },
        deleteAsset: function (id) {
            return httpRequestor(host + 'api/asset/' + id + '/delete', {});
        },
        uploadAttachment: function (id, data) {
            return httpRequestor(host + 'api/asset/' + id + '/attach', data);
        }
    };
}]);

/**
 * Attachment API
 */
sdkApiApp.factory('attachmentApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        getAttachmentUri: function (key) {
            return httpRequestor(host + 'api/attachment/url?key=' + encodeURIComponent(key));
        },
        uploadAttachment: function (data) {
            return httpRequestor(host + 'api/attachment/upload', data);
        }
    };
}]);

/**
 * Benefit API
 */
sdkApiApp.factory('benefitApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer();

    return {
        searchCustomerNumber: function (customerNumber) {
            return httpRequestor(host + 'api/benefit/search?customernumber=' + customerNumber);
        },
        linkCustomerNumber: function (data) {
            return httpRequestor(host + 'api/benefit/link', data);
        },
        unlinkCustomerNumber: function (data) {
            return httpRequestor(host + 'api/benefit/unlink', data);
        },
        authoriseCustomerNumber: function (data) {
            return httpRequestor(host + 'api/benefit/authorise', data);
        },
        modifyAuthorisedCustomerNumber: function (data) {
            return httpRequestor(host + 'api/benefit/modify', data);
        },
        deauthoriseCustomerNumber: function (data) {
            return httpRequestor(host + 'api/benefit/deauthorise', data);
        },
        listMemberships: function () {
            return httpRequestor(host + 'api/benefit/memberships');
        }
    };
}]);

/**
 * Comparable API
 */
sdkApiApp.factory('comparableApi', ['httpRequestor', 'pagingService', 'configuration', 'underscore', 'uriEncodeQuery', function (httpRequestor, pagingService, configuration, underscore, uriEncodeQuery) {
    var host = configuration.getServer();

    return {
        createComparable: function (data) {
            return httpRequestor(host + 'api/comparable', data);
        },
        aggregateComparables: function (query) {
            query = uriEncodeQuery(query, {
                resulttype: 'simple'
            });

            return httpRequestor(host + 'api/comparables/aggregate' + (query && query.length > 0 ? '?' + query : ''));
        },
        searchComparables: function (query) {
            query = uriEncodeQuery(query, {
                resulttype: 'simple'
            });

            return httpRequestor(host + 'api/comparables/search' + (query && query.length > 0 ? '?' + query : ''));
        },
        getComparable: function (uuid) {
            return httpRequestor(host + 'api/comparable/' + uuid);
        },
        updateComparable: function (data) {
            return httpRequestor(host + 'api/comparable/' + data.uuid, data);
        },
        uploadAttachment: function (uuid, data) {
            return httpRequestor(host + 'api/comparable/' + uuid + '/attach', data);
        },
        useComparable: function (uuid) {
            return httpRequestor(host + 'api/comparable/' + uuid + '/use', {});
        },
        deleteComparable: function (uuid) {
            return httpRequestor(host + 'api/comparable/' + uuid + '/delete', {});
        }
    };
}]);

/**
 * Country API
 */
sdkApiApp.factory('countryApi', ['apiPager', 'configuration', 'pagingService', 'promiseService', function (apiPager, configuration, pagingService, promiseService) {
    var host = configuration.getServer(),
        countries;

    return {
        getCountries: function () {
            return promiseService.wrap(function (promise) {
                if (countries) {
                    if (typeof countries === 'object' && typeof countries.finally === 'function') {
                        countries.then(function (result) {
                            promise.resolve(result);
                        });
                    } else {
                        promise.resolve(countries);
                    }
                } else {
                    countries = apiPager(function (page) {
                        return pagingService.page(host + 'api/countries', page);
                    });

                    countries.then(function (results) {
                        countries = results;
                        promise.resolve(countries);
                    }, promise.reject);
                }
            });
        }
    };
}]);

/**
 * Data API
 */
sdkApiApp.factory('dataApi', ['httpRequestor', 'configuration', 'underscore', 'uriEncodeQuery', function (httpRequestor, configuration, underscore, uriEncodeQuery) {
    var host = configuration.getServer();

    return {
        aggregateAll: function (params) {
            params = uriEncodeQuery(params);

            return httpRequestor(host + 'api/data/aggregate-all' + (params.length ? '?' + params : ''), {});
        },
        exportFile: function (data) {
            return httpRequestor(host + 'api/data/export-file', data);
        },
        importFile: function (data) {
            return httpRequestor(host + 'api/data/import-file', data);
        },
        validateFile: function (data) {
            return httpRequestor(host + 'api/data/validate-file', data);
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['httpRequestor', 'configuration', 'pagingService', 'uriEncodeQuery', function (httpRequestor, configuration, pagingService, uriEncodeQuery) {
    var host = configuration.getServer(),
        removableFields = ['organization', 'origin', 'permissions', 'tasks'];

    return {
        getDocuments: function (id, params) {
            if (typeof id === 'object') {
                params = id;
                id = undefined;
            }

            return pagingService.page(host + 'api/documents' + (id ? '/' + id : ''), params);
        },
        createDocument: function (data) {
            return httpRequestor(host + 'api/document', data, removableFields);
        },
        getDocument: function (id) {
            return httpRequestor(host + 'api/document/' + id);
        },
        sendDocument: function (id, data) {
            return httpRequestor(host + 'api/document/' + id + '/send', data);
        },
        attachDocument: function (id, documentId, params) {
            params = uriEncodeQuery(params);

            return httpRequestor(host + 'api/document/' + id + '/add/' + documentId + (params.length > 0 ? '?' + params : ''), {});
        },
        detachDocument: function (id, documentId, params) {
            params = uriEncodeQuery(params);

            return httpRequestor(host + 'api/document/' + id + '/remove/' + documentId + (params.length > 0 ? '?' + params : ''), {});
        },
        updateDocument: function (data) {
            return httpRequestor(host + 'api/document/' + data.id, data, removableFields);
        },
        deleteDocument: function (id) {
            return httpRequestor(host + 'api/document/' + id + '/delete', {});
        },
        uploadAttachment: function (id, data) {
            return httpRequestor(host + 'api/document/' + id + '/attach', data);
        },
        getDocumentPdf: function (data) {
            return httpRequestor(host + 'api/document/pdf/get', data);
        },
        saveDocumentPdf: function (data) {
            return httpRequestor(host + 'api/document/pdf/save', data);
        },
        mergeDocumentPdfs: function (key, data) {
            return httpRequestor(host + 'api/document/pdf/merge?key=' + key, data);
        }
    };
}]);

/**
 * Document Permission API
 */
sdkApiApp.factory('documentPermissionApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer(),
        removableFields = ['document', 'user'];

    return {
        createDocumentPermission: function (data, includeRemovable) {
            return httpRequestor(host + 'api/document-permission', data,  (includeRemovable ? [] : removableFields));
        },
        updateDocumentPermission: function (data, includeRemovable) {
            return httpRequestor(host + 'api/document-permission/' + data.id, data,  (includeRemovable ? [] : removableFields));
        },
        deleteDocumentPermission: function (id) {
            return httpRequestor(host + 'api/document-permission/' + id + '/delete', {});
        }
    };
}]);

/**
 * Enterprise Budget API
 */
sdkApiApp.factory('enterpriseBudgetApi', ['httpRequestor', 'httpResultTypeRequestor', 'pagingService', 'configuration', 'uriEncodeQuery', function (httpRequestor, httpResultTypeRequestor, pagingService, configuration, uriEncodeQuery) {
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

            return httpRequestor(host + 'api/budgets/averaged' + (query && query.length > 0 ? '?' + query : ''));
        },
        searchEnterpriseBudgets: function (query) {
            return httpResultTypeRequestor(host + 'api/budgets/search', query);
        },
        createEnterpriseBudget: function (data) {
            return httpRequestor(host + 'api/budget', data);
        },
        getEnterpriseBudget: function (id, requesttype) {
            return httpRequestor(host + 'api/budget/' + id + (requesttype ? '?requesttype=' + requesttype : ''));
        },
        getEnterpriseBudgetPublishers: function (query) {
            query = uriEncodeQuery(query);

            return httpRequestor(host + 'api/budget/publishers' + (query.length > 0 ? '?' + query : ''));
        },
        getEnterpriseBudgetRegions: function (query) {
            query = uriEncodeQuery(query);

            return httpRequestor(host + 'api/budget/regions' + (query.length > 0 ? '?' + query : ''));
        },
        updateEnterpriseBudget: function (data) {
            return httpRequestor(host + 'api/budget/' + data.id, data);
        },
        publishEnterpriseBudget: function (id, data) {
            data = data || {remote: 'agrista'};

            return httpRequestor(host + 'api/budget/' + id + '/publish', data);
        },
        deleteEnterpriseBudget: function (id) {
            return httpRequestor(host + 'api/budget/' + id + '/delete', {});
        },
        uploadAttachment: function (id, data) {
            return httpRequestor(host + 'api/budget/' + id + '/attach', data);
        },
        favoriteEnterpriseBudget: function (id) {
            return httpRequestor(host + 'api/budget/' + id + '/favorite', {});
        }

    };
}]);

/**
 * Expense API
 */
sdkApiApp.factory('expenseApi', ['httpRequestor', 'pagingService', 'configuration', function(httpRequestor, pagingService, configuration) {
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
            return httpRequestor(host + 'api/expense', data);
        },
        updateExpense: function (data) {
            return httpRequestor(host + 'api/expense/' + data.id, data);
        },
        deleteExpense: function (id) {
            return httpRequestor(host + 'api/expense/' + id + '/delete', {});
        }
    };
}]);

/**
 * Farm API
 */
sdkApiApp.factory('farmApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
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
            return httpRequestor(host + 'api/farm', data);
        },
        getFarm: function (id) {
            return httpRequestor(host + 'api/farm/' + id);
        },
        updateFarm: function (data) {
            return httpRequestor(host + 'api/farm/' + data.id, data);
        },
        deleteFarm: function (id) {
            return httpRequestor(host + 'api/farm/' + id + '/delete', {});
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
            return organizationApi.searchOrganizations(underscore.defaults(query, {type: 'farmer'}));
        },
        createFarmer: function (data, includeRemovable) {
            return organizationApi.createOrganization(underscore.defaults(data, {type: 'farmer'}), includeRemovable);
        },
        inviteFarmer: function (id, data) {
            return organizationApi.inviteOrganization(id, data);
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
sdkApiApp.factory('farmlandValueApi', ['httpRequestor', 'configuration', 'underscore', function (httpRequestor, configuration, underscore) {
    var host = configuration.getServer();

    return {
        getFarmlandValue: function (id, query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/farmland-value/' + id + (query ? '?' + query : ''));
        },
        getFarmlandValues: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/farmland-values' + (query ? '?' + query : ''));
        }
    };
}]);

/**
 * Farm Sale API
 */
sdkApiApp.factory('farmSaleApi', ['httpRequestor', 'httpResultTypeRequestor', 'pagingService', 'configuration', function (httpRequestor, httpResultTypeRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['country', 'documents', 'organization'];

    return {
        createFarmSale: function (data, includeRemovable) {
            return httpRequestor(host + 'api/farm-sale', data, (includeRemovable ? [] : removableFields));
        },
        getFarmSales: function (params) {
            return pagingService.page(host + 'api/farm-sales', params);
        },
        aggregateFarmSales: function (params) {
            return httpResultTypeRequestor(host + 'api/farm-sales/aggregate', params);
        },
        searchFarmSales: function (params) {
            return pagingService.page(host + 'api/farm-sales/search', params);
        },
        getFarmSale: function (id) {
            return httpRequestor(host + 'api/farm-sale/' + id);
        },
        updateFarmSale: function (data, includeRemovable) {
            return httpRequestor(host + 'api/farm-sale/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        deleteFarmSale: function (id) {
            return httpRequestor(host + 'api/farm-sale/' + id + '/delete', {});
        },
        attachDocument: function (id, documentId) {
            return httpRequestor(host + 'api/farm-sale/' + id + '/add/' + documentId, {});
        },
        detachDocument: function (id, documentId) {
            return httpRequestor(host + 'api/farm-sale/' + id + '/remove/' + documentId, {});
        }
    };
}]);

/**
 * Financial API
 */
sdkApiApp.factory('financialApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer(),
        removableFields = ['legalEntity'];

    return {
        getFinancials: function (id) {
            return httpRequestor(host + 'api/financials' + (id ? '/' + id : ''));
        },
        createFinancial: function (data) {
            return httpRequestor(host + 'api/financial', data, removableFields);
        },
        getFinancial: function (id) {
            return httpRequestor(host + 'api/financial/' + id);
        },
        updateFinancial: function (data) {
            return httpRequestor(host + 'api/financial/' + data.id, data, removableFields);
        },
        deleteFinancial: function (id) {
            return httpRequestor(host + 'api/financial/' + id + '/delete', {});
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
sdkApiApp.factory('inviteApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        getInvite: function (hash) {
            return httpRequestor(host + 'api/invite/' + hash);
        }
    };
}]);

/**
 * Label API
 */
sdkApiApp.factory('labelApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer();

    return {
        getLabels: function (params) {
            return pagingService.page(host + 'api/labels', params);
        },
        getLabel: function (id) {
            return httpRequestor(host + 'api/label/' + id);
        }
    };
}]);

/**
 * Layers API
 */
sdkApiApp.factory('layerApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['country', 'layer'];

    return {
        getLayerTypes: function () {
            return httpRequestor(host + 'api/layer/types');
        },
        getLayers: function (params) {
            return pagingService.page(host + 'api/layers', params);
        },
        getLayer: function (id) {
            return httpRequestor(host + 'api/layer/' + id);
        },
        createLayer: function (data, includeRemovable) {
            return httpRequestor(host + 'api/layer', data, (includeRemovable ? [] : removableFields));
        },
        updateLayer: function (data, includeRemovable) {
            return httpRequestor(host + 'api/layer/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        getSublayers: function (params) {
            return pagingService.page(host + 'api/sublayers', params);
        },
        getSublayer: function (id) {
            return httpRequestor(host + 'api/sublayer/' + id);
        },
        getSublayersByLayer: function (id) {
            return httpRequestor(host + 'api/sublayers/' + id);
        },
        createSublayer: function (data, includeRemovable) {
            return httpRequestor(host + 'api/sublayer', data, (includeRemovable ? [] : removableFields));
        },
        updateSublayer: function (data, includeRemovable) {
            return httpRequestor(host + 'api/sublayer/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        deleteSublayer: function (id) {
            return httpRequestor(host + 'api/sublayer/' + id + '/delete', {});
        }
    };
}]);

/**
 * Legal Entity API
 */
sdkApiApp.factory('legalEntityApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
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
            return httpRequestor(host + 'api/legalentity/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        uploadAttachment: function (id, data) {
            return httpRequestor(host + 'api/legalentity/' + id + '/attach', data);
        },
        getEntity: function (id) {
            return httpRequestor(host + 'api/legalentity/' + id);
        },
        createEntity: function (data, includeRemovable) {
            return httpRequestor(host + 'api/legalentity', data, (includeRemovable ? [] : removableFields));
        },
        deleteEntity: function (id) {
            return httpRequestor(host + 'api/legalentity/' + id + '/delete', {});
        },
        attachLiability: function (id, data) {
            return httpRequestor(host + 'api/legalentity/' + id + '/liability', data);
        },
        detachLiability: function (id, liabilityId) {
            return httpRequestor(host + 'api/legalentity/' + id + '/liability/' + liabilityId + '/delete', {});
        }
    };
}]);

/**
 * Liability API
 */
sdkApiApp.factory('liabilityApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        createLiability: function (data) {
            return httpRequestor(host + 'api/liability', data);
        },
        updateLiability: function (data) {
            return httpRequestor(host + 'api/liability/' + data.id, data);
        },
        deleteLiability: function (id) {
            return httpRequestor(host + 'api/liability/' + id + '/delete', {});
        }
    };
}]);

/**
 * Map Theme API
 */
sdkApiApp.factory('mapThemeApi', ['httpRequestor', 'configuration', 'underscore', function (httpRequestor, configuration, underscore) {
    var host = configuration.getServer();

    return {
        getMapThemes: function (params) {
            params = underscore.map(underscore.defaults(params || {}, {resulttype: 'simple'}), function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/map-themes' + (params ? '?' + params : ''));
        },
        createMapTheme: function (data) {
            return httpRequestor(host + 'api/map-theme', data);
        },
        updateMapTheme: function (data) {
            return httpRequestor(host + 'api/map-theme/' + data.id, data);
        }
    };
}]);

/**
 * Merchant API
 */
sdkApiApp.factory('merchantApi', ['httpRequestor', 'organizationApi', 'pagingService', 'configuration', 'underscore', function (httpRequestor, organizationApi, pagingService, configuration, underscore) {
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
        inviteMerchant: function (id, data) {
            return organizationApi.inviteOrganization(id, data);
        },
        registerMerchant: function (data) {
            return httpRequestor(host + 'api/register/merchant', data);
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
sdkApiApp.factory('notificationApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer();

    return {
        getNotifications: function (params) {
            return pagingService.page(host + 'api/notifications', params);
        },
        createNotification: function (data) {
            return httpRequestor(host + 'api/notification', data);
        },
        getNotification: function (id) {
            return httpRequestor(host + 'api/notification/' + id);
        },
        rejectNotification: function (id, data) {
            return httpRequestor(host + 'api/notification/' + id + '/reject', data);
        },
        acceptNotification: function (id) {
            return httpRequestor(host + 'api/notification/' + id + '/accept', {});
        },
        deleteNotification: function (id) {
            return httpRequestor(host + 'api/notification/' + id + '/delete', {});
        }
    };
}]);

/**
 * Organization API
 */
sdkApiApp.factory('organizationApi', ['httpRequestor', 'httpResultTypeRequestor', 'pagingService', 'configuration', function (httpRequestor, httpResultTypeRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['country', 'farms', 'legalEntities', 'pointsOfInterest'];

    return {
        createOrganization: function (data, includeRemovable) {
            return httpRequestor(host + 'api/organization', data, (includeRemovable ? [] : removableFields));
        },
        getOrganizations: function (params) {
            return pagingService.page(host + 'api/organizations', params);
        },
        getOrganization: function (id) {
            return httpRequestor(host + 'api/organization/' + id);
        },
        getProfile: function (domain) {
            return httpRequestor(host + 'api/profile/' + domain);
        },
        getOrganizationDuplicates: function (id) {
            return httpResultTypeRequestor(host + 'api/organization/' + id + '/duplicates');
        },
        searchOrganizations: function (params) {
            return pagingService.page(host + 'api/organizations/search', params);
        },
        searchOrganization: function (params) {
            return httpResultTypeRequestor(host + 'api/organization/search', params);
        },
        inviteOrganization: function (id, data) {
            return httpRequestor(host + 'api/organization/' + id + '/invite', data);
        },
        registerOrganization: function (data) {
            return httpRequestor(host + 'api/register/organization', data);
        },
        updateOrganization: function (data, includeRemovable) {
            return httpRequestor(host + 'api/organization/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        sendOrganization: function (id, data) {
            return httpRequestor(host + 'api/organization/' + id + '/send', data);
        },
        uploadAttachment: function (id, data) {
            return httpRequestor(host + 'api/organization/' + id + '/attach', data);
        },
        deleteOrganization: function (id) {
            return httpRequestor(host + 'api/organization/' + id + '/delete', {});
        }
    };
}]);

/**
 * Organizational Unit API
 */
sdkApiApp.factory('organizationalUnitApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer();

    return {
        createOrganizationalUnit: function (data) {
            return httpRequestor(host + 'api/organizational-unit' + (data.type ? '/' + data.type.toLowerCase() : ''), data);
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
            return httpRequestor(host + 'api/organizational-unit/' + id);
        },
        updateOrganizationalUnit: function (data) {
            return httpRequestor(host + 'api/organizational-unit/' + data.id, data, ['organization', 'users']);
        },
        deleteOrganizationalUnit: function (id) {
            return httpRequestor(host + 'api/organizational-unit/' + id + '/delete', {});
        }
    };
}]);

/**
 * Point Of Interest API
 */
sdkApiApp.factory('pointOfInterestApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['organization'];

    return {
        createPointOfInterest: function (data) {
            return httpRequestor(host + 'api/point-of-interest', data, removableFields);
        },
        getPointOfInterest: function (id) {
            return httpRequestor(host + 'api/point-of-interest/' + id);
        },
        searchPointsOfInterest: function (params) {
            return pagingService.page(host + 'api/points-of-interest/search', params);
        },
        updatePointOfInterest: function (data) {
            return httpRequestor(host + 'api/point-of-interest/' + data.id, data, removableFields);
        },
        deletePointOfInterest: function (id) {
            return httpRequestor(host + 'api/point-of-interest/' + id + '/delete', {});
        }
    };
}]);

/**
 * Product Demand API
 */
sdkApiApp.factory('productDemandApi', ['httpRequestor', 'pagingService', 'configuration', 'underscore', function (httpRequestor, pagingService, configuration, underscore) {
    var host = configuration.getServer();

    return {
        getProductDemandAssumptions: function (query) {
            query = underscore.map(query, function (value, key) {
                return key + '=' + encodeURIComponent(value);
            }).join('&');

            return httpRequestor(host + 'api/demand-assumptions' + (query ? '?' + query : ''));
        },
        getMapData: function (options) {
            return httpRequestor(host + 'api/demand-assumptions/map-data', options);
        },
        addAssumptionGroup: function (data) {
            return httpRequestor(host + 'api/demand-assumption', data);
        },
        updateProductDemandAssumption: function (id, data) {
            return httpRequestor(host + 'api/demand-assumption/' + data.id, data);
        },
        deleteProductDemandAssumption: function (data) {
            return httpRequestor(host + 'api/demand-assumption/delete', data);
        }
    };
}]);

/**
 * Production Schedule API
 */
sdkApiApp.factory('productionScheduleApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['assets', 'budget', 'organization'];

    return {
        getProductionSchedules: function (id) {
            return pagingService.page(host + 'api/production-schedules' + (id ? '/' + id : ''));
        },
        createProductionSchedule: function (data, includeRemovable) {
            return httpRequestor(host + 'api/production-schedule', data, (includeRemovable ? [] : removableFields));
        },
        getProductionSchedule: function (id) {
            return httpRequestor(host + 'api/production-schedule/' + id);
        },
        updateProductionSchedule: function (data, includeRemovable) {
            return httpRequestor(host + 'api/production-schedule/' + data.id, data, (includeRemovable ? [] : removableFields));
        },
        deleteProductionSchedule: function (id) {
            return httpRequestor(host + 'api/production-schedule/' + id + '/delete', {});
        },
        attachAsset: function (id, assetId) {
            return httpRequestor(host + 'api/production-schedule/' + id + '/add/' + assetId, {});
        },
        detachAsset: function (id, assetId) {
            return httpRequestor(host + 'api/production-schedule/' + id + '/remove/' + assetId, {});
        }
    };
}]);

/**
 * Product API
 */
sdkApiApp.factory('productApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['organization'];

    return {
        createProduct: function (data) {
            return httpRequestor(host + 'api/product', data, removableFields);
        },
        getProduct: function (id) {
            return httpRequestor(host + 'api/product/' + id);
        },
        searchProducts: function (params) {
            return pagingService.page(host + 'api/products/search', params);
        },
        updateProduct: function (data) {
            return httpRequestor(host + 'api/product/' + data.id, data, removableFields);
        },
        deleteProduct: function (id) {
            return httpRequestor(host + 'api/product/' + id + '/delete', {});
        }
    };
}]);

/**
 * Role API
 */
sdkApiApp.factory('roleApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        getRoles: function () {
            return httpRequestor(host + 'api/roles');
        },
        updateRoleApps: function (data) {
            return httpRequestor(host + 'api/role-apps', data);
        }
    };
}]);

/**
 * Share API
 */
sdkApiApp.factory('shareApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        getDocument: function (code) {
            return httpRequestor(host + 'api/share/document/' + code);
        }
    };
}]);

/**
 * Tag API
 */
sdkApiApp.factory('tagApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        getTags: function () {
            return httpRequestor(host + 'api/tags');
        }
    }
}]);

/**
 * Task API
 */
sdkApiApp.factory('taskApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer(),
        removableFields = ['assignerUser', 'document', 'organization', 'subtasks', 'user'];

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
            return httpRequestor(host + 'api/task', data, removableFields);
        },
        getTask: function (id) {
            return httpRequestor(host + 'api/task/' + id);
        },
        updateTask: function (data) {
            return httpRequestor(host + 'api/task/' + data.id, data, removableFields);
        },
        deleteTask: function (id) {
            return httpRequestor(host + 'api/task/' + id + '/delete', {});
        }
    };
}]);

/**
 * Team API
 */
sdkApiApp.factory('teamApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        getTeams: function () {
            return httpRequestor(host + 'api/teams');
        },
        createTeam: function (data) {
            return httpRequestor(host + 'api/team', data);
        },
        getTeam: function (id) {
            return httpRequestor(host + 'api/team/' + id);
        },
        getTeamUsers: function (id) {
            return httpRequestor(host + 'api/team/' + id + '/users');
        },
        updateTeam: function (data) {
            return httpRequestor(host + 'api/team/' + data.id, data);
        },
        deleteTeam: function (id) {
            return httpRequestor(host + 'api/team/' + id + '/delete', {});
        }
    };
}]);

/**
 * User API
 */
sdkApiApp.factory('userApi', ['httpRequestor', 'pagingService', 'configuration', function (httpRequestor, pagingService, configuration) {
    var host = configuration.getServer();

    return {
        getUsers: function (params) {
            return pagingService.page(host + 'api/users', params);
        },
        getUsersByRole: function (id, role) {
            return httpRequestor(host + 'api/users/organization/' + id + '?rolename=' + role);
        },
        getUsersPositions: function () {
            return httpRequestor(host + 'api/users/positions');
        },
        createUser: function (data) {
            return httpRequestor(host + 'api/user', data);
        },
        inviteUser: function (id, data) {
            return httpRequestor(host + 'api/user/' + id + '/invite', data);
        },
        getUser: function (id, username) {
            return httpRequestor(host + 'api/user/' + id + (username ? '?username=' + username : ''));
        },
        updateUser: function (data) {
            return httpRequestor(host + 'api/user/' + data.id, data);
        },
        updateUserGroups: function (data) {
            return httpRequestor(host + 'api/user/' + data.id + '/groups', data);
        },
        deleteUser: function (id) {
            return httpRequestor(host + 'api/user/' + id + '/delete', {});
        }
    };
}]);

/**
 * Workload API
 */
sdkApiApp.factory('workloadApi', ['httpRequestor', 'configuration', function (httpRequestor, configuration) {
    var host = configuration.getServer();

    return {
        updateWorkload: function (data) {
            return httpRequestor(host + 'api/workload/' + data.id, data);
        }
    }
}]);
