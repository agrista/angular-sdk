var sdkModelCropReportDocument = angular.module('ag.sdk.model.crop-report', ['ag.sdk.model.document']);

sdkModelCropReportDocument.provider('CropReport', ['DocumentFactoryProvider', function (DocumentFactoryProvider) {
    this.$get = ['Base', 'Document', 'inheritModel', 'readOnlyProperty', 'underscore',
        function (Base, Document, inheritModel, readOnlyProperty, underscore) {
            function CropReport (attrs) {
                Document.apply(this, arguments);

                Base.initializeObject(this.data, 'request', {});
                Base.initializeObject(this.data, 'report', {});
                Base.initializeObject(this.data.report, 'signatures', []);
                Base.initializeObject(this.data.request, 'productionSchedules', []);

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.docType = (underscore.contains(CropReport.docTypes, attrs.docType) ? attrs.docType : underscore.first(CropReport.docTypes));
            }

            inheritModel(CropReport, Document);

            readOnlyProperty(CropReport, 'docTypes', [
                'crop activity report',
                'crop progress report']);

            CropReport.validates(underscore.defaults({
                docType: {
                    required: true,
                    inclusion: {
                        in: CropReport.docTypes
                    }
                }
            }, Document.validations));

            return CropReport;
        }];

    DocumentFactoryProvider.add('crop activity report', 'CropReport');
    DocumentFactoryProvider.add('crop progress report', 'CropReport');
}]);
