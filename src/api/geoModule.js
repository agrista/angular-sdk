var sdkApiGeoApp = angular.module('ag.sdk.api.geo', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library']);


/**
 * PIP Geo API
 */
sdkApiGeoApp.factory('pipGeoApi', ['$http', 'configuration', 'pagingService', 'promiseService', 'underscore', function ($http, configuration, pagingService, promiseService, underscore) {
    var _host = configuration.getServer();

    function trimQuery (query) {
        return underscore.omit(query, function (value) {
            return (value == null || value == '');
        });
    }

    function uriEncodeQuery (query) {
        return underscore.map(trimQuery(query), function (value, key) {
            return key + '=' + encodeURIComponent(value);
        });
    }

    function uriEncodeQueryJoin (query) {
        return uriEncodeQuery(query).join('&');
    }

    return {
        getAdminRegion: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/admin-region' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchAdminRegions: function (params) {
            return pagingService.page(_host + 'api/geo/admin-regions', trimQuery(params));
        },
        getDistrict: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/district' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (query) {
            query = uriEncodeQueryJoin(query);

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
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/field' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPortion: function (query) {
            query = uriEncodeQueryJoin(query);

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
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/geo/province' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSublayer: function (query) {
            query = uriEncodeQueryJoin(query);

            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/geo/sublayer' + (query ? '?' + query : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    }
}]);
