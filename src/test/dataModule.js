var sdkTestDataApp = angular.module('ag.sdk.test.data', ['ag.sdk.utilities', 'ag.sdk.id']);

sdkTestDataApp.provider('mockDataService', [function () {
    var _mockData = {};
    var _config = {
        localStore: true
    };

    this.config = function (options) {
        _config = _.defaults(options, _config);
    };

    this.$get = ['localStore', 'objectId', function (localStore, objectId) {
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
                    data.id = data.id || ObjectId().toString();

                    _mockData[type] = _mockData[type] || {};
                    _mockData[type][data.id] = data;
                }

                if (_config.localStore) {
                    localStore.setItem('mockdata', _mockData);
                }
            },
            getItem: function (type, id) {
                _mockData[type] = _mockData[type] || {};

                if (id === undefined) {
                    return _.toArray(_mockData[type] || {});
                } else {
                    return _mockData[type][id];
                }
            }
        }
    }];
}]);
