var sdkHelperMerchantApp = angular.module('ag.sdk.helper.merchant', []);

sdkHelperMerchantApp.factory('merchantHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.primaryContact,
            status: (item.registered ? {text: 'registered', label: 'label-success'} : false)
        }
    };

    var _partnerTypes = {
        benefit: 'Benefit Partner',
        standard: 'Standard'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        partnerTypes: function() {
            return _partnerTypes;
        },
        getPartnerType: function (type) {
            return _partnerTypes[type];
        }
    }
}]);
