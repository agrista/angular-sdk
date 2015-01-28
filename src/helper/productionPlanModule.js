var sdkHelperProductionPlanApp = angular.module('ag.sdk.helper.production-plan', []);

sdkHelperProductionPlanApp.factory('productionPlanHelper', [function () {
    var _assetTypeMap = {
        'crop': ['Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'horticulture': ['Horticulture (Perennial)']
    };

    return {
        isFieldApplicable: function (field) {
            return (this.getAssetType(field) !== undefined);
        },

        getAssetType: function (field) {
            var assetType;

            angular.forEach(_assetTypeMap, function (fieldTypes, type) {
                if (fieldTypes.indexOf(field.landUse) !== -1) {
                    assetType = type;
                }
            });

            return assetType;
        }
    }
}]);