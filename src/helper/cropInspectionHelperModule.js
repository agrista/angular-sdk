var sdkHelperCropInspectionApp = angular.module('ag.sdk.helper.crop-inspection', []);

sdkHelperCropInspectionApp.factory('cropInspectionHelper', [function() {
    var _policyTypes = {
        'hail': 'Hail',
        'multi peril': 'Multi Peril'
    };

    var _inspectionTypes = {
        emergence: 'Emergence',
        hail: 'Hail',
        harvest: 'Harvest',
        preharvest: 'Pre Harvest',
        progress: 'Progress'
    };

    var _policyInspections = {
        'hail': {
            hail: _inspectionTypes.hail
        },
        'multi peril': _inspectionTypes
    };

    return {
        inspectionTypes: function () {
            return _inspectionTypes;
        },
        policyTypes: function () {
            return _policyTypes;
        },
        policyInspectionTypes: function (policyType) {
            return _policyInspections[policyType] || {};
        },

        getPolicyTitle: function (type) {
            return _policyTypes[type] || '';
        },
        getInspectionTitle: function (type) {
            return _inspectionTypes[type] || '';
        }
    }
}]);
