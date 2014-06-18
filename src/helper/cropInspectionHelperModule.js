var sdkHelperCropInspectionApp = angular.module('ag.sdk.helper.crop-inspection', ['ag.sdk.helper.document']);

sdkHelperCropInspectionApp.factory('cropInspectionHelper', ['documentHelper', function(documentHelper) {
    var _policyTypes = {
        'hail': 'Hail',
        'multi peril': 'Multi Peril'
    };

    var _inspectionTypes = {
        emergence: 'Emergence Inspection',
        hail: 'Hail Inspection',
        harvest: 'Harvest Inspection',
        preharvest: 'Pre Harvest Inspection',
        progress: 'Progress Inspection'
    };

    var _policyInspections = {
        'hail': {
            hail: _inspectionTypes.hail
        },
        'multi peril': _inspectionTypes
    };

    var _listServiceMap = function (item) {
        var map = documentHelper.listServiceWithTaskMap()(item);

        if (map && item.data.request) {
            map.subtitle = map.title + ' - ' + item.data.enterprise;
            map.title = item.documentId;
            map.group = _inspectionTypes[item.data.inspectionType] || '';
        }

        return map;
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },

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
