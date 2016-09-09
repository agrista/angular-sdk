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