var sdkModelLegalEntity = angular.module('ag.sdk.model.legal-entity', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.asset', 'ag.sdk.model.liability']);

sdkModelLegalEntity.provider('LegalEntity', ['listServiceMapProvider', function (listServiceMapProvider) {
    this.$get = ['Base', 'Asset', 'computedProperty', 'Financial', 'inheritModel', 'Liability', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
        function (Base, Asset, computedProperty, Financial, inheritModel, Liability, Model, privateProperty, readOnlyProperty, underscore) {
            function LegalEntity (attrs) {
                Model.Base.apply(this, arguments);

                computedProperty(this, 'contactNameRequired', function () {
                    return contactNameRequired(this);
                });

                this.data = (attrs && attrs.data ? attrs.data : {});
                Base.initializeObject(this.data, 'attachments', []);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.id = attrs.id || attrs.$id;
                this.addressCity = attrs.addressCity;
                this.addressCode = attrs.addressCode;
                this.addressCountry = attrs.addressCountry;
                this.addressDistrict = attrs.addressDistrict;
                this.addressStreet = attrs.addressStreet;
                this.cifKey = attrs.cifKey;
                this.contactName = attrs.contactName;
                this.email = attrs.email;
                this.fax = attrs.fax;
                this.isActive = attrs.isActive;
                this.isPrimary = attrs.isPrimary;
                this.mobile = attrs.mobile;
                this.name = attrs.name;
                this.organizationId = attrs.organizationId;
                this.registrationNumber = attrs.registrationNumber;
                this.telephone = attrs.telephone;
                this.type = attrs.type;
                this.uuid = attrs.uuid;

                this.assets = underscore.map(attrs.assets, Asset.newCopy);
                this.financials = underscore.map(attrs.financials, Financial.newCopy);
                this.liabilities = underscore.map(attrs.liabilities, Liability.newCopy);
            }

            function contactNameRequired (instance) {
                return instance && instance.type && !underscore.contains(['Individual', 'Sole Proprietary'], instance.type);
            }

            inheritModel(LegalEntity, Model.Base);

            readOnlyProperty(LegalEntity, 'legalEntityTypes', [
                'Individual',
                'Sole Proprietary',
                'Joint account',
                'Partnership',
                'Close Corporation',
                'Private Company',
                'Public Company',
                'Trust',
                'Non-Profitable companies',
                'Cooperatives',
                'In- Cooperatives',
                'Other Financial Intermediaries']);

            privateProperty(LegalEntity, 'getContactNameRequired', function (instance) {
                return contactNameRequired(instance);
            });

            LegalEntity.validates({
                addressCity: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressCode: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressDistrict: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                addressStreet: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                email: {
                    required: true,
                    format: {
                        email: true
                    }
                },
                fax: {
                    format: {
                        telephone: true
                    }
                },
                mobile: {
                    format: {
                        telephone: true
                    }
                },
                name: {
                    required: true,
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                organizationId: {
                    required: true,
                    numeric: true
                },
                registrationNumber: {
                    length: {
                        min: 1,
                        max: 255
                    }
                },
                telephone: {
                    format: {
                        telephone: true
                    }
                },
                type: {
                    required: true,
                    inclusion: {
                        in: LegalEntity.legalEntityTypes
                    }
                },
                uuid: {
                    format: {
                        uuid: true
                    }
                }
            });

            return LegalEntity;
        }];

    listServiceMapProvider.add('legal entity', ['attachmentHelper', 'underscore', function (attachmentHelper, underscore) {
        return function (item) {
            var thumbnailUrl = attachmentHelper.findSize(item, 'thumb', 'img/profile-user.png');

            return underscore.extend({
                id: item.id || item.$id,
                title: item.name,
                subtitle: item.type
            }, (thumbnailUrl ? {
                thumbnailUrl: thumbnailUrl
            } : {}));
        };
    }]);
}]);
