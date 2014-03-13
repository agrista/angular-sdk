var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.utilities']);

sdkHelperTaskApp.provider('taskHelper', function() {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = _getTaskTitle(item.todo) + ' for ' + item.organization.name + ' ' + item.id;
        var mappedItems = _.filter(item.subtasks, function (task) {
            return (task.type && _validTaskStatuses.indexOf(task.status) !== -1 && task.type == 'child');
        }).map(function (task) {
                return {
                    id: task.id,
                    title: item.organization.name,
                    subtitle: _getTaskTitle(task.todo),
                    todo: task.todo,
                    groupby: title,
                    status: {
                        text: task.status || ' ',
                        label: _getStatusLabelClass(task.status)
                    }
                }
            });

        return (mappedItems.length ? mappedItems : undefined);
    };

    var _parentListServiceMap = function (item) {
        return {
            id: item.documentId,
            title: item.organization.name,
            subtitle: _getTaskTitle(item.todo),
            status: {
                text: item.status || ' ',
                label: _getStatusLabelClass(item.status)
            }
        };
    };

    var _taskTodoMap = {};

    var _getTaskState = function (taskType) {
        var todo = _taskTodoMap[taskType] || {};

        return todo.state || undefined;
    };

    var _getTaskTitle = function (taskType) {
        var todo = _taskTodoMap[taskType] || {};

        return todo.title || taskType;
    };

    var _getStatusTitle = function (taskStatus) {
        return _taskStatusTitles[taskStatus] || taskStatus || ' ';
    };

    var _getActionTitle = function (taskAction) {
        return _taskActionTitles[taskAction] || taskAction || ' ';
    };

    var _getStatusLabelClass = function (status) {
        switch (status) {
            case 'in progress':
            case 'in review':
                return 'label-warning';
            case 'done':
                return 'label-success';
            default:
                return 'label-default';
        }
    };

    var _taskStatusTitles = {
        'backlog': 'Backlog',
        'assigned': 'Assigned',
        'in progress': 'In Progress',
        'in review': 'In Review',
        'done': 'Done',
        'archive': 'Archived'
    };

    var _taskActionTitles = {
        'accept': 'Accept',
        'decline': 'Decline',
        'assign': 'Assign',
        'start': 'Start',
        'complete': 'Complete',
        'approve': 'Approve',
        'reject': 'Reject',
        'release': 'Release'
    };

    var _taskStatusMap = {
        'rejected': -2,
        'unassigned': -1,
        'pending': 0,
        'assigned': 1,
        'in progress': 2,
        'complete': 3
    };

    /*
     * Provider functions
     */
    this.addTasks = function (tasks) {
        _taskTodoMap =  _.extend(_taskTodoMap, tasks);
    };

    this.$get = ['listService', 'dataMapService', function (listService, dataMapService) {
        return {
            listServiceMap: function() {
                return _listServiceMap;
            },
            parentListServiceMap: function() {
                return _parentListServiceMap;
            },
            getTaskState: _getTaskState,
            getTaskTitle: _getTaskTitle,
            getTaskStatusTitle: _getStatusTitle,
            getTaskActionTitle: _getActionTitle,
            getTaskLabel: _getStatusLabelClass,
            getTaskStatus: function (status) {
                return _taskStatusMap[status];
            },

            updateListService: function (id, todo, tasks, organization) {
                listService.addItems(dataMapService({
                    id: tasks[0].parentTaskId,
                    type: 'parent',
                    todo: todo,
                    organization: organization,
                    subtasks : tasks
                }, _listServiceMap));

                var task = _.findWhere(tasks, {id: id});

                if (task && _validTaskStatuses.indexOf(task.status) === -1) {
                    listService.removeItems(task.id);
                }
            }
        }
    }];
});

sdkHelperTaskApp.factory('taskWorkflowHelper', function() {
    var _taskActions = {
        accept: ['backlog', 'assigned', 'in progress', 'in review', 'complete'],
        decline: ['assigned'],
        start: ['assigned', 'in progress'],
        assign: ['backlog', 'assigned', 'in progress', 'in review'],
        complete: ['assigned', 'in progress'],
        approve: ['in review'],
        reject: ['assigned', 'in review'],
        release: ['done']
    };

    return {
        canChangeToState: function (task, action) {
            return (_taskActions[action] ? _taskActions[action].indexOf(task.status) !== -1 : true);
        }
    }
});
