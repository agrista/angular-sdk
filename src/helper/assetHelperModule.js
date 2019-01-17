var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.attachment', 'ag.sdk.library']);

sdkHelperAssetApp.factory('assetValuationHelper', ['Asset', 'underscore', function (Asset, underscore) {
    var _listServiceMap = function (item) {
        return {
            title: item.organization.name,
            subtitle: 'Valued at ' + item.currency + ' ' + item.assetValue,
            date: item.date
        };
    };

    return {
        listServiceMap: function () {
            return _listServiceMap;
        },
        calculateAssetValue: function (asset) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                asset.data.assetValue = asset.data.quantity * (asset.data.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(asset.data.totalStock) == false) {
                asset.data.assetValue = asset.data.totalStock * (asset.data.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(asset.data.expectedYield) == false) {
                asset.data.assetValue = asset.data.expectedYield * (asset.data.unitValue || 0);
            } else if (asset.type == 'improvement') {
                asset.data.valuation = asset.data.valuation || {};
                asset.data.valuation.replacementValue = asset.data.size * ((asset.data.valuation && asset.data.valuation.constructionCost) || 0);
                asset.data.valuation.totalDepreciation = underscore.reduce(['physicalDepreciation', 'functionalDepreciation', 'economicDepreciation', 'purchaserResistance'], function (total, type) {
                    return isNaN(asset.data.valuation[type]) ? total : total * (1 - asset.data.valuation[type]);
                }, 1);

                asset.data.assetValue = Math.round((asset.data.valuation.replacementValue || 0) * Math.min(asset.data.valuation.totalDepreciation, 1));
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                asset.data.assetValue = asset.data.size * (asset.data.unitValue || 0);
            }

            asset.data.assetValue = Math.round(asset.data.assetValue * 100) / 100;
        },
        getApplicableGuidelines: function (guidelines, asset, field) {
            var assetLandUse = Asset.landClassesByType[asset.type] || [];
            var chain = underscore.chain(guidelines).filter(function(item) {
                return (assetLandUse.indexOf(item.assetClass) !== -1);
            });

            if (asset.type === 'cropland') {
                chain = chain.filter(function (item) {
                    return (field.irrigated ?
                        (asset.data.waterSource ? (item.waterSource && item.waterSource.indexOf(asset.data.waterSource) !== -1) : item.category === 'Potential Irrigable Land') :
                        (item.assetClass === 'Cropland' && (item.soilPotential === undefined || item.soilPotential === field.croppingPotential)));
                });
            } else if (asset.type === 'pasture' || asset.type === 'wasteland') {
                chain = chain.where({assetClass: field.landUse}).filter(function (item) {
                    return ((asset.data.crop === undefined && item.crop === undefined) || (item.crop !== undefined && item.crop.indexOf(asset.data.crop) !== -1)) &&
                        ((field.terrain === undefined && item.terrain === undefined) || item.terrain === field.terrain);
                });
            } else if (asset.type === 'permanent crop') {
                var establishedDate = moment(asset.data.establishedDate);
                var monthsFromEstablished = moment().diff(establishedDate, 'months');

                chain = chain.filter(function (item) {
                    return (item.crop && item.crop.indexOf(asset.data.crop) !== -1) &&
                        (!asset.data.irrigation || item.irrigationType === undefined ||
                            item.irrigationType.indexOf(asset.data.irrigation) !== -1) &&
                        (item.minAge === undefined || monthsFromEstablished >= item.minAge) &&
                        (item.maxAge === undefined || monthsFromEstablished < item.maxAge);
                });
            } else if (asset.type === 'plantation') {
                chain = chain.filter(function (item) {
                    return (item.crop === undefined || item.crop.indexOf(asset.data.crop) !== -1);
                });
            } else if (asset.type === 'water right') {
                chain = chain.filter(function (item) {
                    return (item.waterSource === undefined || item.waterSource.indexOf(asset.data.waterSource) !== -1);
                });
            }

            return chain.value();
        }
    }
}]);
