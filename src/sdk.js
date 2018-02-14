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
    'ag.sdk.helper.task',
    'ag.sdk.helper.team',
    'ag.sdk.helper.user'
]);

angular.module('ag.sdk.interface', [
    'ag.sdk.interface.geocledian',
    'ag.sdk.interface.ui',
    'ag.sdk.interface.list',
    'ag.sdk.interface.map',
    'ag.sdk.interface.navigation'
]);

angular.module('ag.sdk.model', [
    'ag.sdk.model.asset',
    'ag.sdk.model.base',
    'ag.sdk.model.business-plan',
    'ag.sdk.model.comparable-sale',
    'ag.sdk.model.desktop-valuation',
    'ag.sdk.model.document',
    'ag.sdk.model.enterprise-budget',
    'ag.sdk.model.farm',
    'ag.sdk.model.farm-valuation',
    'ag.sdk.model.field',
    'ag.sdk.model.financial',
    'ag.sdk.model.layer',
    'ag.sdk.model.legal-entity',
    'ag.sdk.model.liability',
    'ag.sdk.model.livestock',
    'ag.sdk.model.map-theme',
    'ag.sdk.model.production-schedule',
    'ag.sdk.model.errors',
    'ag.sdk.model.stock',
    'ag.sdk.model.store',
    'ag.sdk.model.validation',
    'ag.sdk.model.validators'
]);

angular.module('ag.sdk.test', [
    'ag.sdk.test.data'
]);

angular.module('ag.sdk', [
    'ag.sdk.authorization',
    'ag.sdk.id',
    'ag.sdk.geospatial',
    'ag.sdk.utilities',
    'ag.sdk.model',
    'ag.sdk.api',
    'ag.sdk.helper',
    'ag.sdk.library',
    'ag.sdk.interface.map',
    'ag.sdk.test'
]);
