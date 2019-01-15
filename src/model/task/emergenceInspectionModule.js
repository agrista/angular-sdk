var sdkModelTaskEmergenceInspection = angular.module('ag.sdk.model.task.emergence-inspection', ['ag.sdk.model.crop-inspection', 'ag.sdk.model.task']);

sdkModelTaskEmergenceInspection.provider('EmergenceInspectionTask', ['TaskFactoryProvider', function (TaskFactoryProvider) {
    this.$get = ['computedProperty', 'CropInspection', 'inheritModel', 'Task', 'underscore',
        function (computedProperty, CropInspection, inheritModel, Task, underscore) {
            function EmergenceInspectionTask (attrs) {
                Task.apply(this, arguments);

                computedProperty(this, 'inspectionDate', function () {
                    return this.data.inspectionDate;
                });

                computedProperty(this, 'landRecommendation', function () {
                    return this.data.landRecommendation;
                });

                computedProperty(this, 'moistureStatus', function () {
                    return this.data.moistureStatus;
                });

                computedProperty(this, 'zones', function () {
                    return this.data.asset.data.zones;
                });
            }

            inheritModel(EmergenceInspectionTask, Task);

            EmergenceInspectionTask.validates(underscore.extend({
                inspectionDate: {
                    required: true,
                    format: {
                        date: true
                    }
                },
                landRecommendation: {
                    required: true,
                    inclusion: {
                        in: CropInspection.approvalTypes
                    }
                },
                moistureStatus: {
                    requiredIf: function (value, instance, field) {
                        return instance.landRecommendation !== 'Not Planted';
                    },
                    inclusion: {
                        in: CropInspection.moistureStatuses
                    }
                },
                zones: {
                    requiredIf: function (value, instance, field) {
                        return instance.landRecommendation !== 'Not Planted';
                    },
                    length: {
                        min: 1
                    }
                }
            }, Task.validations));

            return EmergenceInspectionTask;
        }];

    TaskFactoryProvider.add('emergence inspection', 'EmergenceInspectionTask');
}]);