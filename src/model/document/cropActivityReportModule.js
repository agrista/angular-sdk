var sdkModelCropActivityReportDocument = angular.module('ag.sdk.model.crop-activity-report', ['ag.sdk.model.document']);

sdkModelCropActivityReportDocument.provider('CropActivityReport', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Base', 'Document', 'inheritModel', 'underscore',
        function (Base, Document, inheritModel, underscore) {
            function CropActivityReport (attrs) {
                Document.apply(this, arguments);

                Base.initializeObject(this.data, 'request', {});
                Base.initializeObject(this.data, 'report', {});
                Base.initializeObject(this.data.report, 'signatures', []);
                Base.initializeObject(this.data.request, 'productionSchedules', []);

                this.docType = 'crop activity report';
            }

            inheritModel(CropActivityReport, Document);

            CropActivityReport.validates(underscore.defaults({
                docType: {
                    required: true,
                    equal: {
                        to: 'crop activity report'
                    }
                }
            }, Document.validations));

            return CropActivityReport;
        }];

    DocumentFactoryProvider.add('crop activity report', 'CropActivityReport');
}]);
