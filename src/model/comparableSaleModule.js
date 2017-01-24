var sdkModelComparableSale = angular.module('ag.sdk.model.comparable-sale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelComparableSale.factory('ComparableSale', ['computedProperty', 'inheritModel', 'landUseHelper', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, landUseHelper, Model, naturalSort, privateProperty, readOnlyProperty, underscore) {
        function ComparableSale (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'area', function () {
                return underscore.reduce(this.portions, function(total, portion) {
                    return total + (portion.area || 0);
                }, 0);
            });

            computedProperty(this, 'distanceInKm', function () {
                return (this.distance ? this.distance / 1000.0 : '-');
            });

            computedProperty(this, 'improvedRatePerHa', function () {
                return this.purchasePrice / this.area;
            });

            computedProperty(this, 'vacantLandValue', function () {
                return this.valueMinusImprovements / this.area;
            });

            computedProperty(this, 'valueMinusImprovements', function () {
                return this.purchasePrice - this.depImpValue;
            });

            computedProperty(this, 'farmName', function () {
                return underscore.chain(this.portions)
                    .groupBy('farmLabel')
                    .map(function (portions, farmName) {
                        farmName = (farmName || '').toLowerCase();

                        var portionSentence = underscore.chain(portions)
                                .sortBy('portionLabel')
                                .pluck('portionLabel')
                                .toSentence()
                                .value();

                        return (portionSentence + (farmName.length ? ' of ' + (underscore.startsWith(farmName, 'farm') ? '' : 'farm ') + underscore.titleize(farmName) : ''));
                    })
                    .toSentence()
                    .value();
            });


            computedProperty(this, 'totalLandComponentArea', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return total + (landComponent.area || 0);
                }, 0);
            });

            computedProperty(this, 'totalLandComponentValue', function () {
                return underscore.reduce(this.landComponents, function(total, landComponent) {
                    return total + (landComponent.assetValue || 0);
                }, 0);
            });

            /**
             * Attachment Handling
             */
            privateProperty(this, 'addAttachment', function (attachment) {
                this.removeAttachment(attachment);

                this.attachments.push(attachment);
            });

            privateProperty(this, 'removeAttachment', function (attachment) {
                this.attachments = underscore.reject(this.attachments, function (item) {
                    return item.key === attachment.key;
                });
            });

            privateProperty(this, 'removeNewAttachments', function () {
                var attachments = this.attachments;

                this.attachments = underscore.reject(attachments, function (attachment) {
                    return underscore.isObject(attachment.archive);
                });

                return underscore.difference(attachments, this.attachments);
            });

            /**
             * Land Component Handling
             */
            privateProperty(this, 'addLandComponent', function (type) {
                if (underscore.chain(this.landComponents).pluck('type').contains(type).value() == false) {
                    this.landComponents.push({
                        type: type,
                        assetValue: 0
                    });
                }
            });

            privateProperty(this, 'removeLandComponent', function (type) {
                this.landComponents = underscore.reject(this.landComponents, function (landComponent) {
                    return landComponent.type === type;
                });
            });

            /**
             * Portion Handling
             */
            privateProperty(this, 'addPortion', function (portion) {
                this.removePortionBySgKey(portion.sgKey);

                this.portions.push(portion);
            });

            privateProperty(this, 'removePortionBySgKey', function (sgKey) {
                this.portions = underscore.reject(this.portions, function (portion) {
                    return (portion.sgKey === sgKey);
                });
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.area = attrs.area;
            this.attachments = attrs.attachments || [];
            this.authorData = attrs.authorData;
            this.centroid = attrs.centroid;
            this.comments = attrs.comments;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.depImpValue = attrs.depImpValue;
            this.distance = attrs.distance || 0;
            this.geometry = attrs.geometry;
            this.landComponents = attrs.landComponents || [];
            this.portions = attrs.portions || [];
            this.propertyKnowledge = attrs.propertyKnowledge;
            this.purchasedAt = attrs.purchasedAt;
            this.purchasePrice = attrs.purchasePrice || 0;
            this.useCount = attrs.useCount || 0;
        }

        inheritModel(ComparableSale, Model.Base);

        readOnlyProperty(ComparableSale, 'landComponentTypes', underscore.chain(landUseHelper.landUseTypes())
            .without('Cropland')
            .union(['Cropland (Dry)', 'Cropland (Equipped, Irrigable)', 'Cropland (Irrigable)'])
            .value()
            .sort(naturalSort));

        readOnlyProperty(ComparableSale, 'propertyKnowledgeOptions', ['The valuer has no firsthand knowledge of this property.',
            'The valuer has inspected this comparable from aerial photos, and has no firsthand knowledge of the property.',
            'The valuer has inspected/valued this comparable before, and has firsthand knowledge of the property.']);

        ComparableSale.validates({
            area: {
                required: true,
                numeric: true
            },
            landComponents: {
                required: true,
                length: {
                    min: 1
                }
            },
            portions: {
                required: true,
                length: {
                    min: 1
                }
            },
            purchasePrice: {
                required: true,
                numeric: true
            }
        });

        return ComparableSale;
    }]);
