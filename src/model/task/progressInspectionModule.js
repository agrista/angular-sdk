var sdkModelTaskProgressInspection = angular.module('ag.sdk.model.task.progress-inspection', ['ag.sdk.model.crop', 'ag.sdk.model.task']);

sdkModelTaskProgressInspection.provider('ProcessInspectionTask', ['TaskFactoryProvider', function (TaskFactoryProvider) {
    this.$get = ['Base', 'computedProperty', 'Crop', 'CropInspection', 'inheritModel', 'privateProperty', 'safeArrayMath', 'safeMath', 'Task', 'underscore',
        function (Base, computedProperty, Crop, CropInspection, inheritModel, privateProperty, safeArrayMath, safeMath, Task, underscore) {
            function ProcessInspectionTask (attrs) {
                Task.apply(this, arguments);

                Base.initializeObject(this.data, 'samples', []);

                privateProperty(this, 'calculateResults', function () {
                    calculateResults(this);
                });

                computedProperty(this, 'inspectionDate', function () {
                    return this.data.inspectionDate;
                });

                computedProperty(this, 'moistureStatus', function () {
                    return this.data.moistureStatus;
                });

                computedProperty(this, 'pitWeight', function () {
                    return this.data.pitWeight;
                });

                computedProperty(this, 'realization', function () {
                    return this.data.realization;
                });

                computedProperty(this, 'samples', function () {
                    return this.data.samples;
                });
            }

            inheritModel(ProcessInspectionTask, Task);

            function reduceSamples (samples, prop) {
                return safeMath.dividedBy(underscore.reduce(samples, function (total, sample) {
                    return safeMath.plus(total, sample[prop]);
                }, 0), samples.length);
            }

            function calculateResults (instance) {
                var asset = Crop.newCopy(instance.data.asset),
                    pitWeight = instance.data.pitWeight || 0,
                    realization = instance.data.realization || 100;

                var zoneResults = underscore.map(asset.zones, function (zone) {
                    var zoneSamples = underscore.where(instance.data.samples, {zoneUuid: zone.uuid}),
                        result = {
                            zoneUuid: zone.uuid,
                            sampleSize: underscore.size(zoneSamples),
                            coverage: safeMath.dividedBy(zone.size, asset.data.plantedArea),
                            heads: reduceSamples(zoneSamples, 'heads'),
                            weight: reduceSamples(zoneSamples, 'weight')
                        };

                    if (asset.flower === 'spikelet') {
                        result.yield = safeMath.dividedBy(
                            safeMath.times(result.weight, result.heads),
                            safeMath.times((asset.data.irrigated ? 3000 : 3500), (zone.plantedInRows ? safeMath.times(zone.rowWidth, 3) : 1)));
                    } else if (asset.flower === 'pod') {
                        result.pods = reduceSamples(zoneSamples, 'pods');
                        result.seeds = reduceSamples(zoneSamples, 'seeds');
                        result.yield = safeMath.dividedBy(
                            safeArrayMath.reduceOperator([pitWeight, result.seeds, result.pods, result.heads], 'times', 0),
                            safeMath.times(zone.rowWidth, 300));
                    } else {
                        result.yield = safeMath.dividedBy(
                            safeMath.times(result.weight, result.heads),
                            safeMath.times(zone.rowWidth, 1000));
                    }

                    result.yield = safeMath.times(result.yield, safeMath.dividedBy(realization, 100));

                    return result;
                });

                instance.data.inspection = {
                    flower: asset.flower,
                    results: zoneResults,
                    totalYield: underscore.reduce(zoneResults, function (total, item) {
                        return total + (item.coverage * item.yield);
                    }, 0)
                };
            }

            ProcessInspectionTask.validates(underscore.extend({
                inspectionDate: {
                    required: true,
                    format: {
                        date: true
                    }
                },
                moistureStatus: {
                    required: true,
                    inclusion: {
                        in: CropInspection.moistureStatuses
                    }
                },
                pitWeight: {
                    required: true,
                    range: {
                        from: 0
                    },
                    numeric: true
                },
                realization: {
                    required: true,
                    range: {
                        from: 0,
                        to: 100
                    },
                    numeric: true
                },
                samples: {
                    required: true,
                    length: {
                        min: 1
                    }
                }
            }, Task.validations));

            return ProcessInspectionTask;
        }];

    TaskFactoryProvider.add('progress inspection', 'ProcessInspectionTask');
}]);