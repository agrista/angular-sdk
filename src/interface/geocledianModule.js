var sdkInterfaceGeocledianApp = angular.module('ag.sdk.interface.geocledian', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.library']);

sdkInterfaceGeocledianApp.provider('geocledianService', ['underscore', function (underscore) {
    var _defaultConfig = {
        key: '46552fa9-6a5v-2346-3z67-s4b8556cxvwp',
        layers: ['vitality', 'visible'],
        url: 'https://geocledian.com/agknow/'
    };

    this.config = function (options) {
        _defaultConfig = underscore.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$http', 'moment', 'promiseService',
        function ($http, moment, promiseService) {
            function GeocledianService () {
                this.ids = [];
                this.dates = [];
                this.parcels = [];
            }

            GeocledianService.prototype = {
                config: _defaultConfig,
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
                getParcels: function (type, date) {
                    if (type && date) {
                        return underscore.where(this.parcels, {type: type, date: date});
                    } else if (type) {
                        return underscore.where(this.parcels, {type: type});
                    } else if (date) {
                        return underscore.where(this.parcels, {date: date});
                    }

                    return this.parcels;
                },
                getParcel: function (parcelId, type) {
                    return underscore.findWhere(this.parcels, (type ? {parcel_id: parcelId, type: type} : {parcel_id: parcelId}));
                },
                getParcelImageUrl: function (parcel, imageType) {
                    return _defaultConfig.url + parcel[imageType || 'png'] + '?key=' + _defaultConfig.key;
                }
            };

            function addParcel (instance, parcelId) {
                return promiseService.wrapAll(function (promises) {
                    if (parcelId) {
                        instance.ids.push(parcelId);

                        underscore.each(_defaultConfig.layers, function (layer) {
                            promises.push(addParcelType(instance, parcelId, layer));
                        });
                    }
                });
            }

            function addParcelType (instance, parcelId, type) {
                return $http.get(_defaultConfig.url + 'parcels/' + parcelId + '/' + type + '?key=' + _defaultConfig.key).then(function (result) {
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