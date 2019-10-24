var sdkModelMarketReportDocument = angular.module('ag.sdk.model.market-report', ['ag.sdk.model.desktop-valuation']);

sdkModelMarketReportDocument.provider('MarketReport', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Base', 'DesktopValuation', 'inheritModel', 'underscore',
        function (Base, DesktopValuation, inheritModel, underscore) {
            function MarketReport (attrs) {
                DesktopValuation.apply(this, arguments);

                this.docType = 'market report';

                var defaultReportBody = '<div class="tinymce-container pdf-container">' +
                    '<h2 id="property-description">Property Description</h2><br/><table id="property-description-table" width="100%"></table><br/>' +
                    '<h2 id="farmland-value">Estimated Farmland Value</h2><br/><div id="farmland-value-table"></div><br/>' +
                    '<h2 id="regional-value">Regional Value Development</h2><br/><div id="regional-value-graph"></div><br/>' +
                    '<h2 id="comparable-sales">Comparable Sales</h2><table id="comparable-sales-table" width="100%"></table><br/>' +
                    '<h2 id="disclaimer">Disclaimer</h2><p>Estimates of farmland and property value is based on the aggregation of regional sales data and assumptions regarding the property being valued.</p><br/><br/>' +
                    '</div>';

                Base.initializeObject(this.data.report, 'body', defaultReportBody);
            }

            inheritModel(MarketReport, DesktopValuation);

            MarketReport.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'market report'
                    }
                }
            }, DesktopValuation.validations));

            return MarketReport;
        }];

    DocumentFactoryProvider.add('market report', 'MarketReport');
}]);
