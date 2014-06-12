var sdkHelperCropAssessmentApp = angular.module('ag.sdk.helper.crop-assessment', []);

sdkHelperCropAssessmentApp.factory('cropAssessmentHelper', [function() {
    var _purposes = ['Arrears', 'Building line restriction', 'Consolidation', 'Covering Bond', 'Expropration', 'Extention of section/plan', 'Further Advance', 'New Loan', 'Notarial agreement', 'Opening of sectional title register/township', 'Progress Payment', 'Property in Possession (PIP)', 'Rectification transfer', 'Release of portions/units/sections', 'Removal of restrictive conditions', 'Replacement value', 'Rezoning', 'Securities', 'Servitude', 'Special consent', 'Subdivision', 'Township establishment', 'Other'];

    var _priorities = [{
        key: 'Priority 1',
        value: 1
    }, {
        key: 'Priority 2',
        value: 2
    }, {
        key: 'Priority 3',
        value: 3
    }];

    return {
        purposes: function() {
            return _purposes;
        },
        priorities: function() {
            return _priorities;
        }
    }
}]);
