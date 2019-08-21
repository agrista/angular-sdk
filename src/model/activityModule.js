var sdkModelActivity = angular.module('ag.sdk.model.activity', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelActivity.factory('Activity', ['inheritModel', 'Model', 'readOnlyProperty', 'underscore',
    function (inheritModel, Model, readOnlyProperty, underscore) {
        function Activity (attrs) {
            Model.Base.apply(this, arguments);

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.area = attrs.area;
            this.areaUnit = attrs.areaUnit;
            this.assetId = attrs.assetId;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.endDate = attrs.endDate;
            this.pointOfInterestId = attrs.pointOfInterestId;
            this.rate = attrs.rate;
            this.startDate = attrs.startDate;
            this.total = attrs.total;
            this.type = attrs.type;
            this.uid = attrs.uid;
            this.unit = attrs.unit;

            this.asset = attrs.asset;
            this.assets = attrs.assets;
            this.pointOfInterest = attrs.pointOfInterest;
        }

        inheritModel(Activity, Model.Base);

        readOnlyProperty(Activity, 'types', {
            'BAL': 'Baling/Fodder Production',
            'HAR': 'Chaining/Harrowing',
            'CHA': 'Chemical Application',
            'CPM': 'Crop Monitoring',
            'CUL': 'Cultivating',
            'DER': 'Deep Ripping',
            'FEA': 'Fertiliser Application',
            'FER': 'Fertiliser Recommendation',
            'GRP': 'Ground Preparation',
            'HVT': 'Harvest',
            'HVC': 'Harvest Contract',
            'HVD': 'Harvest Delivery',
            'INS': 'Insurance',
            'IRR': 'Irrigation',
            'MAT': 'Manual Tasks',
            'PEM': 'Pest Monitoring',
            'PLO': 'Ploughing',
            'ROL': 'Rolling',
            'SCA': 'Scarifying',
            'PNT': 'Seeding/Planting',
            'ANA': 'Soil/Leaf Analysis',
            'SWA': 'Swathing',
            'WEC': 'Weed Counts'
        });

        readOnlyProperty(Activity, 'areaUnits', [
            'ha']);

        readOnlyProperty(Activity, 'units', [
            'g',
            'kg',
            'kWh',
            'l',
            'cl',
            'ml',
            'mm']);

        Activity.validates({
            area: {
                required: false,
                numeric: true
            },
            areaUnit: {
                requiredIf: function (value, instance, field) {
                    return !underscore.isUndefined(instance.area);
                },
                inclusion: {
                    in: Activity.areaUnits
                }
            },
            assetId: {
                required: false,
                numeric: true
            },
            endDate: {
                required: false,
                format: {
                    date: true
                }
            },
            pointOfInterestId: {
                required: false,
                numeric: true
            },
            rate: {
                required: false,
                numeric: true
            },
            startDate: {
                required: true,
                format: {
                    date: true
                }
            },
            total: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(Activity.types)
                }
            },
            uid: {
                required: false,
                length: {
                    min: 0,
                    max: 32
                }
            },
            unit: {
                required: true,
                inclusion: {
                    in: Activity.units
                }
            }
        });

        return Activity;
    }]);
