var sdkModelFarmSale = angular.module('ag.sdk.model.farm-sale', ['ag.sdk.library', 'ag.sdk.model.base', 'ag.sdk.model.farm-valuation']);

sdkModelFarmSale.factory('FarmSale', ['Base', 'computedProperty', 'DocumentFactory', 'inheritModel', 'md5String', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (Base, computedProperty, DocumentFactory, inheritModel, md5String, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function FarmSale (attrs) {
            Base.apply(this, arguments);

            computedProperty(this, 'farmland', function () {
                return this.data.farmland;
            });

            privateProperty(this, 'generateUid', function () {
                this.uid = md5String(underscore.chain(this.farmland)
                    .pluck('data')
                    .pluck('sgKey')
                    .compact()
                    .value()
                    .join(',') + (this.saleDate ? '/' + moment(this.saleDate).format('YYYY-MM-DD') : ''));

                return this.uid;
            });

            privateProperty(this, 'asComparable', function () {
                return {
                    centroid: this.centroid,
                    farmland: this.data.farmland,
                    farmName: this.title,
                    farmSize: this.area,
                    uuid: this.uid
                }
            });

            /**
             * Document Handling
             */

            privateProperty(this, 'addDocument', function (document) {
                this.documents = underscore.chain(this.documents)
                    .reject(underscore.identity({documentId: document.documentId}))
                    .union([document])
                    .sortBy(function (document) {
                        return moment(document.data.report && document.data.report.completionDate).unix();
                    })
                    .value();
                this.documentCount = underscore.size(this.documents);
            });

            /**
             * Farmland Handling
             */

            privateProperty(this, 'addFarmland', function (farmland) {
                this.data.farmland = underscore.chain(this.data.farmland)
                    .reject(function (item) {
                        return item.data.sgKey === farmland.data.sgKey;
                    })
                    .union([farmland])
                    .value()
                    .sort(function (itemA, itemB) {
                        return naturalSort(itemA.data.sgKey, itemB.data.sgKey);
                    });

                generateTitle(this);
                recalculateArea(this);
            });

            privateProperty(this, 'hasFarmland', function (farmland) {
                return underscore.some(this.data.farmland, function (item) {
                    return item.data.sgKey === farmland.data.sgKey;
                });
            });

            privateProperty(this, 'removeFarmlandBySgKey', function (sgKey) {
                this.data.farmland = underscore.reject(this.data.farmland, function (item) {
                    return (item.data.sgKey === sgKey);
                });

                generateTitle(this);
                recalculateArea(this);
            });

            this.data = (attrs && attrs.data ? attrs.data : {});
            Base.initializeObject(this.data, 'farmland', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.area = attrs.area || 0;
            this.buyerName = attrs.buyerName;
            this.centroid = attrs.centroid;
            this.country = attrs.country;
            this.countryId = attrs.countryId;
            this.documentCount = attrs.documentCount || 0;
            this.reference = attrs.reference;
            this.salePrice = attrs.salePrice;
            this.saleDate = attrs.saleDate;
            this.sellerName = attrs.sellerName;
            this.title = attrs.title;
            this.uid = attrs.uid;

            this.documents = underscore.chain(attrs.documents)
                .map(DocumentFactory.newCopy)
                .sortBy(function (document) {
                    return moment(document.data.report && document.data.report.completionDate).unix();
                })
                .value();
        }

        function generateTitle (instance) {
            instance.title = underscore.chain(instance.farmland)
                .groupBy(function (asset) {
                    return asset.data.farmLabel;
                })
                .map(function (assets, farmLabel) {
                    var portionSentence = underscore.chain(assets)
                        .pluck('data')
                        .sortBy('portionLabel')
                        .pluck('portionLabel')
                        .compact()
                        .map(function (portionLabel) {
                            return (s.include(portionLabel, '/') ? s.strLeftBack(portionLabel, '/') : '');
                        })
                        .toSentence()
                        .value();

                    return (underscore.size(portionSentence) > 0 ? (s.startsWith(portionSentence, 'RE') ? '' : 'Ptn ') + portionSentence + ' of the ' : 'The ') +
                        (farmLabel ? (underscore.startsWith(farmLabel.toLowerCase(), 'farm') ? '' : 'farm ') + farmLabel : '');
                })
                .toSentence()
                .prune(1024, '')
                .value();
        }

        function recalculateArea (instance) {
            instance.area = safeMath.round(underscore.reduce(instance.data.farmland, function(total, farmland) {
                return safeMath.plus(total, farmland.data.area);
            }, 0), 3);
        }

        inheritModel(FarmSale, Base);

        readOnlyProperty(FarmSale, 'propertyKnowledgeOptions', ['The valuer has no firsthand knowledge of this property.',
            'The valuer has inspected this property from aerial photos, and has no firsthand knowledge of the property.',
            'The valuer has inspected/valued this property before, and has firsthand knowledge of the property.']);


        FarmSale.validates({
            area: {
                required: true,
                numeric: true
            },
            countryId: {
                required: true,
                numeric: true
            },
            data: {
                required: true,
                object: true
            },
            farmland: {
                required: true,
                length: {
                    min: 1
                }
            },
            salePrice: {
                required: true,
                numeric: true
            },
            saleDate: {
                required: true,
                date: true
            },
            title: {
                required: true,
                length: {
                    min: 1,
                    max: 1024
                }
            },
            uid: {
                required: true,
                format: {
                    uid: true
                }
            }
        });

        return FarmSale;
    }]);
