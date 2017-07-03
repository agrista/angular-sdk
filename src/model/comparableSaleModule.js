var sdkModelComparableSale = angular.module('ag.sdk.model.comparable-sale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelComparableSale.factory('ComparableSale', ['$filter', 'computedProperty', 'Field', 'inheritModel', 'Model', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'underscore',
    function ($filter, computedProperty, Field, inheritModel, Model, naturalSort, privateProperty, readOnlyProperty, underscore) {
        function ComparableSale (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'distanceInKm', function () {
                return (this.distance ? this.distance / 1000.0 : '-');
            });

            computedProperty(this, 'improvedRatePerHa', function () {
                return this.purchasePrice / this.area;
            }, {enumerable: true});

            computedProperty(this, 'vacantLandValue', function () {
                return this.valueMinusImprovements / this.area;
            }, {enumerable: true});

            computedProperty(this, 'valueMinusImprovements', function () {
                return this.purchasePrice - this.depImpValue;
            }, {enumerable: true});

            computedProperty(this, 'farmName', function () {
                return underscore.chain(this.portions)
                    .groupBy('farmLabel')
                    .map(function (portions, farmName) {
                        farmName = (farmName || '').toLowerCase();

                        var portionSentence = underscore.chain(portions)
                            .sortBy('portionLabel')
                            .pluck('portionLabel')
                            .map(function (portionLabel) {
                                return s.strLeft(portionLabel, '/');
                            })
                            .toSentence()
                            .value();

                        return ((s.startsWith(portionSentence, 'RE') ? '' : 'Ptn ') + portionSentence + (farmName.length ? ' of ' + (underscore.startsWith(farmName, 'farm') ? '' : 'farm ') + underscore.titleize(farmName) : ''));
                    })
                    .toSentence()
                    .value();
            }, {enumerable: true});


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
                this.landComponents.push({
                    type: type,
                    assetValue: 0
                });
            });

            privateProperty(this, 'removeLandComponent', function (landComponent) {
                this.landComponents = underscore.without(this.landComponents, landComponent);
            });

            /**
             * Portion Handling
             */
            privateProperty(this, 'addPortion', function (portion) {
                if (!this.hasPortion(portion)) {
                    this.portions.push(portion);
                    recalculateArea(this);

                    underscore.each(portion.landCover || [], function (landCover) {
                        var landComponent = underscore.findWhere(this.landComponents, {type: landCover.label});

                        if (underscore.isUndefined(landComponent)) {
                            landComponent = {
                                type: landCover.label,
                                assetValue: 0
                            };

                            this.landComponents.push(landComponent);
                        }

                        landComponent.area = roundValue((landComponent.area || 0) + landCover.area, 3);

                        if (landComponent.unitValue) {
                            landComponent.assetValue = landComponent.area * landComponent.unitValue;
                        }
                    }, this);
                }
            });

            privateProperty(this, 'hasPortion', function (portion) {
                return underscore.some(this.portions, function (storedPortion) {
                    return storedPortion.sgKey === portion.sgKey;
                });
            });

            privateProperty(this, 'removePortionBySgKey', function (sgKey) {
                this.portions = underscore.reject(this.portions, function (portion) {
                    return (portion.sgKey === sgKey);
                });
                recalculateArea(this);
            });

            /**
             * Edit Authorisation
             */
            privateProperty(this, 'isEditable', function (user) {
                return (user && this.authorData && user.username === this.authorData.username && user.company === this.authorData.company);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.uuid = attrs.uuid;
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
            this.landComponents = underscore.map(attrs.landComponents || [], convertLandComponent);
            this.portions = attrs.portions || [];
            this.regions = attrs.regions || [];
            this.propertyKnowledge = attrs.propertyKnowledge;
            this.purchasedAt = attrs.purchasedAt;
            this.purchasePrice = attrs.purchasePrice || 0;
            this.useCount = attrs.useCount || 0;
        }

        var roundValue = $filter('round');

        function convertLandComponent (landComponent) {
            switch (landComponent.type) {
                case 'Cropland (Dry)':
                    landComponent.type = 'Cropland';
                    break;
                case 'Cropland (Equipped, Irrigable)':
                case 'Cropland (Irrigable)':
                    landComponent.type = 'Cropland (Irrigated)';
                    break;
                case 'Conservation':
                    landComponent.type = 'Grazing (Bush)';
                    break;
                case 'Horticulture (Intensive)':
                    landComponent.type = 'Greenhouses';
                    break;
                case 'Horticulture (Perennial)':
                    landComponent.type = 'Orchard';
                    break;
                case 'Horticulture (Seasonal)':
                    landComponent.type = 'Vegetables';
                    break;
                case 'Housing':
                    landComponent.type = 'Homestead';
                    break;
                case 'Wasteland':
                    landComponent.type = 'Non-vegetated';
                    break;
            }

            return landComponent;
        }

        function recalculateArea (instance) {
            instance.area = roundValue(underscore.reduce(instance.portions, function(total, portion) {
                return total + (portion.area || 0);
            }, 0), 4);
        }

        inheritModel(ComparableSale, Model.Base);

        readOnlyProperty(ComparableSale, 'landComponentTypes', Field.landClasses);

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
