var sdkModelDesktopValuationDocument = angular.module('ag.sdk.model.desktop-valuation', ['ag.sdk.model.comparable-sale', 'ag.sdk.model.document']);

sdkModelDesktopValuationDocument.factory('DesktopValuation', ['Base', 'ComparableSale', 'computedProperty', 'Document', 'inheritModel', 'privateProperty', 'underscore',
    function (Base, ComparableSale, computedProperty, Document, inheritModel, privateProperty, underscore) {
        function DesktopValuation (attrs) {
            Document.apply(this, arguments);

            this.docType = 'desktop valuation';

            var defaultReportBody = '<div class="tinymce-container pdf-container">' +
                '<h2 id="property-description">Property Description</h2><br/><br/>' +
                '<h2 id="farmland-value">Estimated Farmland Value</h2><br/><br/>' +
                '<h2 id="regional-value">Regional Value Development</h2><br/><br/>' +
                '<h2 id="comparable-sales">Comparable Sales</h2><div id="comparable-sales-table"></div><br/>' +
                '<h2 id="disclaimer">Disclaimer</h2><p>Estimates of farmland and property value is based on the aggregation of regional sales data and assumptions regarding the property being valued.</p><br/><br/>' +
                '</div>';

            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'request', {});
            Base.initializeObject(this.data, 'report', {});

            Base.initializeObject(this.data.request, 'farmland', []);

            Base.initializeObject(this.data.report, 'body', defaultReportBody);
            Base.initializeObject(this.data.report, 'comparableSales', []);
            Base.initializeObject(this.data.report, 'improvements', []);
            Base.initializeObject(this.data.report, 'improvementsValue', {});
            Base.initializeObject(this.data.report, 'landUseComponents', {});
            Base.initializeObject(this.data.report, 'landUseValue', {});
            Base.initializeObject(this.data.report, 'summary', {});

            /**
             * Legal Entity handling
             */
            privateProperty(this, 'setLegalEntity', function (entity) {
                this.data.request.legalEntity = underscore.omit(entity, ['assets', 'farms', 'liabilities']);
            });

            /**
             * Farmland handling
             */
            privateProperty(this, 'getFarmland', function () {
                return this.data.request.farmland;
            });

            privateProperty(this, 'hasFarmland', function (farmland) {
                return underscore.some(this.data.request.farmland, function (asset) {
                    return asset.assetKey === farmland.assetKey;
                });
            });

            privateProperty(this, 'addFarmland', function (farmland) {
                this.removeFarmland(farmland);

                this.data.request.farmland.push(farmland);
            });

            privateProperty(this, 'removeFarmland', function (farmland) {
                this.data.request.farmland = underscore.reject(this.data.request.farmland, function (asset) {
                    return asset.assetKey === farmland.assetKey;
                });
            });

            privateProperty(this, 'getFarmlandSummary', function () {
                return underscore.chain(this.data.request.farmland)
                    .groupBy(function (farmland) {
                        return (farmland.data.farmLabel ? farmland.data.farmLabel :
                            (farmland.data.officialFarmName ? underscore.titleize(farmland.data.officialFarmName) : 'Unknown'));
                    })
                    .mapObject(function (farmGroup) {
                        return {
                            portionList: (underscore.size(farmGroup) > 1 ? underscore.chain(farmGroup)
                                .map(function (farmland) {
                                    return (farmland.data.portionNumber ? farmland.data.portionNumber : farmland.data.portionLabel);
                                })
                                .sort()
                                .toSentence()
                                .value() : underscore.first(farmGroup).data.portionLabel),
                            town: underscore.chain(farmGroup)
                                .map(function (farmland) {
                                    return (farmland.data.town ? underscore.titleize(farmland.data.town) : '');
                                })
                                .first()
                                .value(),
                            province: underscore.chain(farmGroup)
                                .map(function (farmland) {
                                    return (farmland.data.province ? underscore.titleize(farmland.data.province) : '');
                                })
                                .first()
                                .value(),
                            area: underscore.reduce(farmGroup, function (total, farmland) {
                                return total + (farmland.data.area || 0);
                            }, 0)
                        }
                    })
                    .value();
            });

            /**
             * Comparable Handling
             */
            privateProperty(this, 'addComparableSale', function (comparableSale) {
                comparableSale = ComparableSale.new(comparableSale);

                this.removeComparableSale(comparableSale);

                this.data.report.comparableSales.push(comparableSale.asJSON());
            });

            privateProperty(this, 'removeComparableSale', function (comparableSale) {
                this.data.report.comparableSales = underscore.reject(this.data.report.comparableSales, function (comparable) {
                    return comparable.id === comparableSale.id;
                });
            });
        }

        inheritModel(DesktopValuation, Document);

        DesktopValuation.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                equal: {
                    to: 'desktop valuation'
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return DesktopValuation;
    }]);
