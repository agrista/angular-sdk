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

            // Actions
            readOnlyProperty(this, 'actions', {
                'credit': [
                    'Production',
                    'Purchase'],
                'debit': [
                    'Internal',
                    'Household',
                    'Labour',
                    'Sale']
            }, {configurable: true});

            readOnlyProperty(this, 'actionTitles', {
                'Production': 'Produce',
                'Purchase': 'Buy Stock',
                'Internal': 'Internal Consumption',
                'Household': 'Household Consumption',
                'Labour': 'Labour Consumption',
                'Sale': 'Sell Stock'
            }, {configurable: true});

            // Ledger
            privateProperty(this, 'addLedgerEntry', function (item) {
                if (this.isLedgerEntryValid(item)) {
                    this.data.ledger = underscore.chain(this.data.ledger)
                        .union([item])
                        .sortBy(function (item) {
                            return moment(item.date).valueOf();
                        })
                        .value();

                    recalculate(this);
                }
            });

            privateProperty(this, 'hasLedgerEntries', function () {
                return this.data.ledger.length > 0;
            });

            privateProperty(this, 'removeLedgerEntriesByReference', function (reference) {
                this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                    return entry.reference === reference;
                });
            });

            privateProperty(this, 'inventoryInRange', function (rangeStart, rangeEnd) {
                var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD').date(1),
                    rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD').date(1),
                    appliedStart = this.startMonth.diff(rangeStartDate, 'months'),
                    startCrop = Math.abs(Math.min(0, appliedStart));

                if (underscore.isEmpty(_monthly) && !underscore.isEmpty(this.data.ledger)) {
                    recalculate(this);
                }

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

            privateProperty(this, 'isLedgerEntryValid', function (item) {
                return isLedgerEntryValid(this, item);
            });

            privateProperty(this, 'clearLedger', function () {
                this.data.ledger = [];

                recalculate(this);
            });

            var _monthly = [];

            function balanceEntry (curr, prev) {
                curr.opening = prev.closing;
                curr.balance = underscore.mapObject(curr.opening, function (value, key) {
                    return safeMath.chain(value)
                        .plus(underscore.reduce(curr.credit, function (total, item) {
                            return safeMath.plus(total, item[key]);
                        }, 0))
                        .minus(underscore.reduce(curr.debit, function (total, item) {
                            return safeMath.plus(total, item[key]);
                        }, 0))
                        .toNumber();
                });
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
                                if (underscore.contains(instance.actions[key], item.action)) {
                                    month[key][item.action] = underscore.mapObject(month[key][item.action] || defaultItem(), function (value, key) {
                                        return safeMath.plus(value, item[key]);
                                    });
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
        }

        function defaultItem () {
            return {
                quantity: 0,
                value: 0
            }
        }

        function defaultMonth () {
            return {
                opening: defaultItem(),
                credit: {},
                debit: {},
                balance: defaultItem(),
                interest: 0,
                closing: defaultItem()
            }
        }

        function defaultMonths (size) {
            return underscore.range(size).map(defaultMonth);
        }

        function isLedgerEntryValid (instance, item) {
            return item && item.date && moment(item.date).isValid() && underscore.isNumber(item.quantity) && underscore.isNumber(item.value) &&
                (underscore.contains(instance.actions.credit, item.action) || underscore.contains(instance.actions.debit, item.action));
        }

        inheritModel(Stock, AssetBase);

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
