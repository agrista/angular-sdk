var sdkEditorApp = angular.module('ag.sdk.editor', ['ag.sdk.library']);

sdkEditorApp.factory('enterpriseEditor', ['underscore', function (underscore) {
    function EnterpriseEditor (enterprises) {
        this.enterprises = underscore.map(enterprises || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            category: undefined,
            item: undefined
        }
    }

    EnterpriseEditor.prototype.addEnterprise = function (enterprise) {
        enterprise = enterprise || this.selection.item;

        if (!underscore.isUndefined(enterprise) && this.enterprises.indexOf(enterprise) === -1) {
            this.enterprises.push(enterprise);
            this.selection.item = undefined;
        }
    };

    EnterpriseEditor.prototype.removeEnterprise = function (item) {
        if (underscore.isString(item)) {
            item = this.enterprises.indexOf(item);
        }

        if (item !== -1) {
            this.enterprises.splice(item, 1);
        }
    };

    return function (enterprises) {
        return new EnterpriseEditor(enterprises);
    }
}]);

sdkEditorApp.factory('serviceEditor', ['underscore', function (underscore) {
    function ServiceEditor (/**Array=*/availableServices, /**Array=*/services) {
        availableServices = availableServices || [];

        this.services = underscore.map(services || [], function (item) {
            return (item.name ? item.name : item);
        });

        this.selection = {
            list: availableServices,
            mode: (availableServices.length === 0 ? 'add' : 'select'),
            text: undefined
        };
    }

    ServiceEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            // Allow toggle
            this.selection.mode = (this.selection.mode === 'select' ? 'add' : 'select');
            this.selection.text = undefined;
        }
    };

    ServiceEditor.prototype.addService = function (service) {
        service = service || this.selection.text;

        if (!underscore.isUndefined(service) && this.services.indexOf(service) === -1) {
            this.services.push(service);
            this.selection.text = undefined;
        }
    };

    ServiceEditor.prototype.removeService = function (indexOrService) {
        if (underscore.isString(indexOrService)) {
            indexOrService = this.services.indexOf(indexOrService);
        }

        if (indexOrService !== -1) {
            this.services.splice(indexOrService, 1);
        }
    };

    return function (/**Array=*/availableServices, /**Array=*/services) {
        return new ServiceEditor(availableServices, services);
    }
}]);

sdkEditorApp.factory('teamEditor', ['underscore', function (underscore) {
    function TeamEditor (/**Array=*/availableTeams, /**Array=*/teams) {
        availableTeams = availableTeams || [];
        teams = teams || [];

        this.teams = underscore.map(teams, function (item) {
            return (item.name ? item.name : item);
        });

        this.teamsDetails = angular.copy(teams);

        this.filterList = function () {
            var instance = this;
            instance.selection.list = underscore.reject(availableTeams, function (item) {
                return underscore.contains(instance.teams, (item.name ? item.name : item));
            })
        };

        this.selection = {
            mode: (availableTeams.length === 0 ? 'add' : 'select'),
            text: undefined
        };

        this.filterList();
    }

    TeamEditor.prototype.toggleMode = function() {
        if (this.selection.list.length > 0) {
            this.selection.mode = (this.selection.mode === 'select' ? 'add' : 'select');
            this.selection.text = undefined;
        }
    };

    TeamEditor.prototype.addTeam = function (team) {
        team = team || this.selection.text;

        if (!underscore.isUndefined(team) && this.teams.indexOf(team) === -1) {
            this.teams.push(team);
            this.teamsDetails.push(underscore.findWhere(this.selection.list, {name: team}));
            this.selection.text = undefined;
            this.filterList();
        }
    };

    TeamEditor.prototype.removeTeam = function (indexOrTeam) {
        if (underscore.isString(indexOrTeam)) {
            indexOrTeam = this.teams.indexOf(indexOrTeam);
        }

        if (indexOrTeam !== -1) {
            this.teams.splice(indexOrTeam, 1);
            this.teamsDetails.splice(indexOrTeam, 1);
            this.selection.text = undefined;
            this.filterList();
        }
    };

    return function (/**Array=*/availableTeams, /**Array=*/teams) {
        return new TeamEditor(availableTeams, teams);
    };
}]);
