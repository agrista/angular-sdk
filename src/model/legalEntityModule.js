var sdkModelLegalEntity = angular.module('ag.sdk.model.legal-entity', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.asset', 'ag.sdk.model.liability']);

sdkModelLegalEntity.factory('LegalEntity', ['Asset', 'inheritModel', 'Liability', 'Model', 'readOnlyProperty', 'underscore',
    function (Asset, inheritModel, Liability, Model, readOnlyProperty, underscore) {
        function LegalEntity (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data) || {};

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.addressCity = attrs.addressCity;
            this.addressCode = attrs.addressCode;
            this.addressDistrict = attrs.addressDistrict;
            this.addressStreet = attrs.addressStreet;
            this.email = attrs.email;
            this.fax = attrs.fax;
            this.id = attrs.id || attrs.$id;
            this.mobile = attrs.mobile;
            this.name = attrs.name;
            this.organizationId = attrs.organizationId;
            this.registrationNumber = attrs.registrationNumber;
            this.telephone = attrs.telephone;
            this.type = attrs.type;
            this.uuid = attrs.uuid;

            this.assets = underscore.map(attrs.assets, function (asset) {
                return Asset.new(asset);
            });

            this.liabilities = underscore.map(attrs.liabilities, function (liability) {
                return Liability.new(liability);
            });
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
    }]);
