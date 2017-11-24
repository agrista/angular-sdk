var sdkModelStock = angular.module('ag.sdk.model.stock', ['ag.sdk.model.asset']);

sdkModelStock.factory('Stock', ['AssetBase', 'Base', 'computedProperty', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, Base, computedProperty, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function Stock (attrs) {
            AssetBase.apply(this, arguments);

            computedProperty(this, 'startMonth', function () {
                return moment(underscore.chain(this.data.ledger).pluck('date').first().value(), 'YYYY-MM-DD').date(1);
            });

            computedProperty(this, 'endMonth', function () {
                return moment(underscore.chain(this.data.ledger).pluck('date').last().value(), 'YYYY-MM-DD').date(1);
            });

            privateProperty(this, 'addLedgerEntry', function (item) {
                if (Stock.isLedgerEntryValid(item)) {
                    this.data.ledger = underscore.chain(this.data.ledger)
                        .union([item])
                        .sortBy(function (item) {
                            return moment(item.date).valueOf();
                        })
                        .value();

                    recalculate(this);
                }
            });

            privateProperty(this, 'inventoryInRange', function (rangeStart, rangeEnd) {
                var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD').date(1),
                    rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD').date(1),
                    appliedStart = this.startMonth.diff(rangeStartDate, 'months'),
                    startCrop = Math.abs(Math.min(0, appliedStart));

                return underscore.reduce(defaultMonths(Math.max(0, appliedStart))
                        .concat(_monthly)
                        .concat(defaultMonths(Math.max(0, rangeEndDate.diff(this.endMonth, 'months')))),
                    function (monthly, curr) {
                        balanceEntry(curr, underscore.last(monthly) || defaultMonth());
                        monthly.push(curr);
                        return monthly;
                    }, [])
                    .slice(startCrop, startCrop + rangeEndDate.diff(rangeStartDate, 'months'));
            });

            privateProperty(this, 'clearLedger', function () {
                this.data.ledger = [];

                recalculate(this);
            });

            var _monthly = [];

            function balanceEntry (curr, prev) {
                curr.opening = prev.closing;
                curr.balance = safeMath.chain(curr.opening)
                    .plus(underscore.reduce(curr.credit, function (total, value) {
                        return safeMath.plus(total, value);
                    }, 0))
                    .minus(underscore.reduce(curr.debit, function (total, value) {
                        return safeMath.plus(total, value);
                    }, 0))
                    .toNumber();
                curr.closing = curr.balance;
            }

            function recalculate (instance) {
                var startMonth = instance.startMonth,
                    endMonth = instance.endMonth,
                    numberOfMonths = endMonth.diff(startMonth, 'months');

                _monthly = underscore.range(numberOfMonths + 1).reduce(function (monthly, offset) {
                    var offsetDate = moment(startMonth).add(offset, 'M');

                    var curr = underscore.extend(defaultMonth(), underscore.reduce(instance.data.ledger, function (month, item) {
                        var itemDate = moment(item.date);

                        if (offsetDate.year() === itemDate.year() && offsetDate.month() === itemDate.month()) {
                            underscore.each(['credit', 'debit'], function (key) {
                                if (underscore.contains(Stock.actions[key], item.action)) {
                                    month[key][item.action] = month[key][item.action] || 0;
                                    month[key][item.action] = safeMath.plus(month[key][item.action], item.value);
                                }
                            });
                        }

                        return month;
                    }, {
                        credit: {},
                        debit: {}
                    }));

                    balanceEntry(curr, underscore.last(monthly) || defaultMonth());
                    monthly.push(curr);
                    return monthly;
                }, []);
            }

            Base.initializeObject(this.data, 'ledger', []);

            this.type = 'stock';

            recalculate(this);
        }

        function defaultMonth () {
            return {
                opening: 0,
                credit: {},
                debit: {},
                balance: 0,
                interest: 0,
                closing: 0
            }
        }

        function defaultMonths (size) {
            return underscore.range(size).map(defaultMonth);
        }

        inheritModel(Stock, AssetBase);

        readOnlyProperty(Stock, 'actions', {
            'credit': ['Birth', 'Production', 'Purchase'],
            'debit': ['Consumption', 'Death', 'Sale']
        });

        privateProperty(Stock, 'isLedgerEntryValid', function (item) {
            return item && item.date && moment(item.date).isValid() && underscore.isNumber(item.value) &&
                (underscore.contains(Stock.actions.credit, item.action) || underscore.contains(Stock.actions.debit, item.action));
        });

        Stock.validates({
            assetKey: {
                required: true
            },
            data: {
                required: true,
                object: true
            },
            legalEntityId: {
                required: true,
                numeric: true
            },
            type: {
                required: true,
                inclusion: {
                    in: underscore.keys(AssetBase.assetTypesWithOther)
                }
            }
        });

        return Stock;
    }]);
