angular.module('ag.sdk.helper', [
    'ag.sdk.helper.asset',
    'ag.sdk.helper.attachment',
    'ag.sdk.helper.crop-inspection',
    'ag.sdk.helper.document',
    'ag.sdk.helper.enterprise-budget',
    'ag.sdk.helper.expense',
    'ag.sdk.helper.farmer',
    'ag.sdk.helper.favourites',
    'ag.sdk.helper.merchant',
    'ag.sdk.helper.production-plan',
    'ag.sdk.helper.region',
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.ui',
    'ag.sdk.interface.list',
    'ag.sdk.interface.map',
    'ag.sdk.interface.navigation'
]);

angular.module('ag.sdk.model', [
    'ag.sdk.model.asset',
    'ag.sdk.model.base',
    'ag.sdk.model.business-plan',
    'ag.sdk.model.document',
    'ag.sdk.model.farm-valuation',
    'ag.sdk.model.legal-entity',
    'ag.sdk.model.liability',
    'ag.sdk.model.production-plan',
    'ag.sdk.model.errors',
    'ag.sdk.model.validation',
    'ag.sdk.model.validators'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.mobile-sdk', [
    'ag.sdk.authorization',
    'ag.sdk.id',
    'ag.sdk.utilities',
    'ag.sdk.model',
    'ag.sdk.monitor',
    'ag.sdk.interface.map',
    'ag.sdk.helper',
    'ag.sdk.library',
    'ag.sdk.test',
    'ag.mobile-sdk.helper',
    'ag.mobile-sdk.api',
    'ag.mobile-sdk.data',
    'ag.mobile-sdk.hydration'
]);
