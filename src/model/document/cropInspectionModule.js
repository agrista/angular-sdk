var sdkModelCropInspectionDocument = angular.module('ag.sdk.model.crop-inspection', ['ag.sdk.model.document']);

sdkModelCropInspectionDocument.factory('CropInspection', ['Base', 'computedProperty', 'Document', 'inheritModel', 'readOnlyProperty', 'underscore',
    function (Base, computedProperty, Document, inheritModel, readOnlyProperty, underscore) {
        function CropInspection (attrs) {
            Document.apply(this, arguments);

            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'request', {});
            Base.initializeObject(this.data, 'report', {});
            Base.initializeObject(this.data.request, 'assets', []);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.docType = (underscore.contains(CropInspection.docTypes, attrs.docType) ? attrs.docType : underscore.first(CropInspection.docTypes));
        }

        inheritModel(CropInspection, Document);

        readOnlyProperty(CropInspection, 'approvalTypes', [
            'Approved',
            'Not Approved',
            'Not Planted']);

        readOnlyProperty(CropInspection, 'commentTypes', [
            'Crop amendment',
            'Crop re-plant',
            'Insurance coverage discontinued',
            'Multi-insured',
            'Without prejudice',
            'Wrongfully reported']);

        readOnlyProperty(CropInspection, 'docTypes', [
            'emergence inspection',
            'hail inspection',
            'harvest inspection',
            'preharvest inspection',
            'progress inspection']);

        readOnlyProperty(CropInspection, 'moistureStatuses', [
            'Dry',
            'Moist',
            'Wet']);

        CropInspection.validates({
            author: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            docType: {
                required: true,
                inclusion: {
                    in: CropInspection.docTypes
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return CropInspection;
    }]);
