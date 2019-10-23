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

            return httpRequestor(host + 'api/geo/admin-region' + (query ? '?' + query : ''));
        },
        searchAdminRegions: function (params) {
            return pagingService.page(host + 'api/geo/admin-regions', trimQuery(params));
        },
        getColorMap: function (query) {
            var params = uriEncodeTrimmedQuery(underscore.pick(query, ['type']));

            return httpRequestor(host + 'api/geo/color-map' + (params ? '?' + params : ''), query, ['type']);
        },
        getDistrict: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'api/geo/district' + (query ? '?' + query : ''));
        },
        getFarm: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'api/geo/farm' + (query ? '?' + query : ''));
        },
        searchFarms: function (params) {
            return pagingService.page(host + 'api/geo/farms', trimQuery(params));
        },
        getField: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'api/geo/field' + (query ? '?' + query : ''));
        },
        getPortion: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'api/geo/portion' + (query ? '?' + query : ''));
        },
        getPortionLandValues: function (params) {
            return pagingService.page(host + 'api/geo/portion-values', trimQuery(params));
        },
        searchPortions: function (params) {
            return pagingService.page(host + 'api/geo/portions', trimQuery(params));
        },
        getProvince: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'api/geo/province' + (query ? '?' + query : ''));
        },
        getSublayer: function (query) {
            query = uriEncodeTrimmedQuery(query);

            return httpRequestor(host + 'api/geo/sublayer' + (query ? '?' + query : ''));
        }
    }
}]);
