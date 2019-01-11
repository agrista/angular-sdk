var sdkModelTaskProgressInspection = angular.module('ag.sdk.model.task.progress-inspection', ['ag.sdk.model.task']);

sdkModelTaskProgressInspection.provider('ProcessInspectionTask', ['TaskFactoryProvider', function (TaskFactoryProvider) {
    this.$get = ['Base', 'inheritModel', 'Task',
        function (Base, inheritModel, Task) {
            function ProcessInspectionTask (attrs) {
                Task.apply(this, arguments);

                Base.initializeObject(this.data, 'samples', []);
            }

            inheritModel(ProcessInspectionTask, Task);

            ProcessInspectionTask.validates(Task.validations);

            return ProcessInspectionTask;
        }];

    TaskFactoryProvider.add('progress inspection', 'ProcessInspectionTask');
}]);