var cordovaMapApp = angular.module('ag.mobile-sdk.cordova.map', ['ag.sdk.library']);

cordovaMapApp.factory('cordovaTileCache', ['mapConfig', 'underscore',
    function (mapConfig, underscore) {
        function getTileLayers () {
            return underscore.chain(mapConfig.layerControl && mapConfig.layerControl.baseLayers || [])
                .omit(function (layer) {
                    return layer.type !== 'tileLayerCordova';
                })
                .mapObject(function (layer) {
                    return L[layer.type](layer.template, layer.options);
                })
                .value();
        }

        return {
            clear: function () {
                underscore.each(getTileLayers(), function (tileLayer) {
                    tileLayer.emptyCache();
                });
            },
            getTileLayer: function (name) {
                return getTileLayers()[name];
            }
        }
    }]);