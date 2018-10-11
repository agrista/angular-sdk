var sdkHelperMerchantApp = angular.module('ag.sdk.helper.merchant', ['ag.sdk.model.merchant', 'ag.sdk.library']);

sdkHelperMerchantApp.factory('merchantHelper', ['Merchant', 'underscore', function (Merchant, underscore) {
    var _listServiceMap = function (item) {
        return {
            id: item.id || item.$id,
            title: item.name,
            subtitle: (item.subscriptionPlan ? Merchant.getSubscriptionPlanTitle(item.subscriptionPlan) + ' ' : '') + (item.partnerType ? Merchant.getPartnerTitle(item.partnerType) + ' partner' : ''),
            status: (item.registered ? {text: 'registered', label: 'label-success'} : false)
        }
    };

    /**
     * @name ServiceEditor
     * @param availableServices
     * @param services
     * @constructor
     */
    function ServiceEditor (/**Array=*/availableServices, /**Array=*/services) {
        availableServices = availableServices || [];

        this.services = underscore.map(services || [], function (item) {
            return (item.serviceType ? item.serviceType : item);
        });

        this.selection = {
            list: availableServices,
            mode: (availableServices.length === 0 ? 'add' : 'select'),
            text: undefined
        };
    }

    ServiceEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode === 'select' ? 'add' : 'select');
            this.selection.text = undefined;
        }
    };

    ServiceEditor.prototype.addService = function (service) {
        service = service || this.selection.text;

        if (!underscore.isUndefined(service) && this.services.indexOf(service) === -1) {
            this.services.push(service);
            this.selection.text = undefined;
        }
    };

    ServiceEditor.prototype.removeService = function (indexOrService) {
        if (underscore.isString(indexOrService)) {
            indexOrService = this.services.indexOf(indexOrService);
        }

        if (indexOrService !== -1) {
            this.services.splice(indexOrService, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },

        serviceEditor: function (/**Array=*/availableServices, /**Array=*/services) {
            return new ServiceEditor(availableServices, services);
        }
    }
}]);
