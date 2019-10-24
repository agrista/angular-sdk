var sdkModelField = angular.module('ag.sdk.model.field', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelField.factory('Field', ['computedProperty', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Field (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'croppingPotentialRequired', function () {
                return s.include(this.landUse, 'Cropland');
            });

            computedProperty(this, 'hasGeometry', function () {
                return !underscore.isUndefined(this.loc);
            });

            computedProperty(this, 'establishedDateRequired', function () {
                return s.include(this.landUse, 'Orchard');
            });

            computedProperty(this, 'terrainRequired', function () {
                return s.include(this.landUse, 'Grazing');
            });

            privateProperty(this, 'setIrrigatedFromLandUse', function () {
                this.irrigated = irrigatedFromLandUse(this.landUse);
            });

            privateProperty(this, 'fieldNameUnique', function (fieldName, farm) {
                return fieldNameUnique(this, fieldName, farm);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.crop = attrs.crop;
            this.croppingPotential = attrs.croppingPotential;
            this.effectiveDepth = attrs.effectiveDepth;
            this.farmName = attrs.farmName;
            this.fieldName = attrs.fieldName;
            this.irrigated = attrs.irrigated;
            this.irrigationType = attrs.irrigationType;
            this.landUse = attrs.landUse;
            this.loc = attrs.loc;
            this.sgKey = attrs.sgKey;
            this.size = attrs.size;
            this.soilTexture = attrs.soilTexture;
            this.source = attrs.source;
            this.terrain = attrs.terrain;
            this.waterSource = attrs.waterSource;

            convertLandUse(this);
        }

        function convertLandUse (instance) {
            switch (instance.landUse) {
                case 'Building':
                case 'Built-up':
                case 'Homestead':
                case 'Housing':
                    instance.landUse = 'Residential';
                    break;
                case 'Cropland':
                    if (instance.irrigated) {
                        instance.landUse = 'Cropland (Irrigated)';
                    }
                    break;
                case 'Cropland (Emerging)':
                    instance.landUse = 'Cropland (Subsistence)';
                    break;
                case 'Conservation':
                case 'Protected Area':
                    instance.landUse = 'Grazing';
                    break;
                case 'Horticulture (Intensive)':
                    instance.landUse = 'Greenhouses';
                    break;
                case 'Horticulture (Perennial)':
                    instance.landUse = 'Orchard';
                    break;
                case 'Horticulture (Seasonal)':
                    instance.landUse = 'Vegetables';
                    break;
                case 'Structures (Retail)':
                    instance.landUse = 'Commercial';
                    break;
                case 'Sugarcane (Emerging)':
                    instance.landUse = 'Sugarcane (Small-scale)';
                    break;
            }
        }

        function fieldNameUnique (instance, fieldName, farm) {
            var trimmedValue = s.trim(fieldName || '').toLowerCase();

            return (farm && farm.data && !underscore.isEmpty(trimmedValue) && !underscore.some(farm.data.fields || [], function (field) {
                return (s.trim(field.fieldName).toLowerCase() === trimmedValue || (!underscore.isUndefined(instance.loc) && underscore.isEqual(field.loc, instance.loc)));
            }));
        }

        function irrigatedFromLandUse (landUse) {
            return s.include(landUse, 'Irrigated');
        }

        inheritModel(Field, Model.Base);

        readOnlyProperty(Field, 'croppingPotentials', [
            'Very High',
            'High',
            'Medium',
            'Low',
            'Very Low']);

        readOnlyProperty(Field, 'effectiveDepths', [
            '0 - 30cm',
            '30 - 60cm',
            '60 - 90cm',
            '90 - 120cm',
            '120cm +']);

        readOnlyProperty(Field, 'irrigationTypes', [
            'Centre-Pivot',
            'Drip',
            'Flood',
            'Micro',
            'Sprinkler',
            'Sub-drainage']);

        readOnlyProperty(Field, 'landClasses', [
            'Commercial',
            'Cropland',
            'Cropland (Irrigated)',
            'Cropland (Smallholding)',
            'Cropland (Subsistence)',
            'Dam',
            'Erosion',
            'Forest',
            'Grazing',
            'Grazing (Bush)',
            'Grazing (Fynbos)',
            'Grazing (Shrubland)',
            'Greenhouses',
            'Homestead',
            'Horticulture',
            'Industrial',
            'Landfill',
            'Mining',
            'Non-vegetated',
            'Ocean',
            'Orchard',
            'Orchard (Shadenet)',
            'Pineapple',
            'Plantation',
            'Plantation (Smallholding)',
            'Planted Pastures',
            'Planted Pastures (Irrigated)',
            'Recreational',
            'Residential',
            'Residential (Informal)',
            'Residential (Smallholding)',
            'River',
            'Road & Rail',
            'Sewage Ponds',
            'Structures (Handling)',
            'Structures (Processing)',
            'Structures (Storage)',
            'Sugarcane',
            'Sugarcane (Irrigated)',
            'Sugarcane (Small-scale)',
            'Tea',
            'Tea (Irrigated)',
            'Utilities',
            'Vegetables',
            'Village',
            'Vineyard',
            'Wasteland',
            'Water',
            'Water (Seasonal)',
            'Wetland']);

        readOnlyProperty(Field, 'soilTextures', [
            'Clay',
            'Clay Loam',
            'Clay Sand',
            'Coarse Sand',
            'Coarse Sandy Clay',
            'Coarse Sandy Clay Loam',
            'Coarse Sandy Loam',
            'Fine Sand',
            'Fine Sandy Clay',
            'Fine Sandy Clay Loam',
            'Fine Sandy Loam',
            'Gravel',
            'Loam',
            'Loamy Coarse Sand',
            'Loamy Fine Sand',
            'Loamy Medium Sand',
            'Loamy Sand',
            'Medium Sand',
            'Medium Sandy Clay',
            'Medium Sandy Clay Loam',
            'Medium Sandy Loam',
            'Other',
            'Sand',
            'Sandy Clay',
            'Sandy Clay Loam',
            'Sandy Loam',
            'Silty Clay',
            'Silty Loam']);

        readOnlyProperty(Field, 'waterSources', [
            'Borehole',
            'Dam',
            'Irrigation Scheme',
            'River']);

        readOnlyProperty(Field, 'terrains', [
            'Mountains',
            'Plains']);

        privateProperty(Field, 'getIrrigatedFromLandUse', function (landUse) {
            return irrigatedFromLandUse(landUse);
        });

        privateProperty(Field, 'isLandUse', function (landUse) {
            return landUse && underscore.contains(Field.landClasses, landUse);
        });

        Field.validates({
            croppingPotential: {
                required: false,
                inclusion: {
                    in: Field.croppingPotentials
                }
            },
            effectiveDepth: {
                required: false,
                inclusion: {
                    in: Field.effectiveDepths
                }
            },
            farmName: {
                required: true,
                length: {
                    min: 0,
                    max: 255
                }
            },
            fieldName: {
                required: true,
                length: {
                    min: 0,
                    max: 255
                }
            },
            landUse: {
                required: true,
                inclusion: {
                    in: Field.landClasses
                }
            },
            loc: {
                required: false,
                object: true
            },
            size: {
                required: true,
                numeric: true
            },
            sgKey: {
                required: false,
                numeric: true
            },
            soilTexture: {
                required: false,
                inclusion: {
                    in: Field.soilTextures
                }
            },
            source: {
                required: false,
                length: {
                    min: 0,
                    max: 255
                }
            },
            terrain: {
                requiredIf: function (value, instance, field) {
                    return instance.terrainRequired;
                },
                inclusion: {
                    in: Field.terrains
                }
            },
            waterSource: {
                required: false,
                inclusion: {
                    in: Field.waterSources
                }
            }
        });

        return Field;
    }]);
