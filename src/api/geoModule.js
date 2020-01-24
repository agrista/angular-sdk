var sdkApiGeoApp = angular.module('ag.sdk.api.geo', ['ag.sdk.config', 'ag.sdk.utilities', 'ag.sdk.library']);


/**
 * PIP Geo API
 */
sdkApiGeoApp.factory('pipGeoApi', ['httpRequestor', 'configuration', 'pagingService', 'underscore', 'uriEncodeQuery', function (httpRequestor, configuration, pagingService, underscore, uriEncodeQuery) {
    var host = configuration.getServer();

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

            return httpRequestor(host + 'geo/admin-region' + (query ? '?' + query : ''));
        },
        searchAdminRegions: function (params) {
            return pagingService.page(host + 'geo/admin-regions', trimQuery(params));
        },
        getColorMap: function (query) {
            var params = uriEncodeTrimmedQuery(underscore.pick(query, ['type']));

            return httpRequestor(host + 'geo/color-map' + (params ? '?' + params : ''), query, ['type']);
        },
        getDistrict: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/district' + (query ? '?' + query : ''));
        },
        getFarm: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/farm' + (query ? '?' + query : ''));
        },
        searchFarms: function (params) {
            return pagingService.page(host + 'geo/farms', trimQuery(params));
        },
        getField: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/field' + (query ? '?' + query : ''));
        },
        getPortion: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/portion' + (query ? '?' + query : ''));
        },
        getPortionLandCapabilities: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/portion-capabilities' + (query ? '?' + query : ''));
        },
        getPortionLandValues: function (params) {
            return pagingService.page(host + 'geo/portion-values', trimQuery(params));
        },
        searchPortions: function (params) {
            return pagingService.page(host + 'geo/portions', trimQuery(params));
        },
        getProvince: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/province' + (query ? '?' + query : ''));
        },
        getSublayer: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'geo/sublayer' + (query ? '?' + query : ''));
        }
    }
}]);
