var sdkModelStock = angular.module('ag.sdk.model.stock', ['ag.sdk.model.asset']);

sdkModelStock.factory('Stock', ['AssetBase', 'Base', 'computedProperty', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
    function (AssetBase, Base, computedProperty, inheritModel, moment, naturalSort, privateProperty, readOnlyProperty, safeMath, underscore) {
        function Stock (attrs) {
            AssetBase.apply(this, arguments);

            computedProperty(this, 'startMonth', function () {
                return (underscore.isEmpty(this.data.ledger) ? undefined : moment(underscore.chain(this.data.ledger)
                    .pluck('date')
                    .first()
                    .value(), 'YYYY-MM-DD').date(1));
            });

            computedProperty(this, 'endMonth', function () {
                return (underscore.isEmpty(this.data.ledger) ? undefined : moment(underscore.chain(this.data.ledger)
                    .pluck('date')
                    .last()
                    .value(), 'YYYY-MM-DD').date(1));
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
                        .union([underscore.extend(item, {
                            date: moment(item.date).format('YYYY-MM-DD')
                        })])
                        .sortBy(function (item) {
                            return moment(item.date).valueOf();
                        })
                        .value();

                    recalculate(this);
                }
            });

            privateProperty(this, 'findLedgerEntry', function (query) {
                return underscore.findWhere(this.data.ledger, query);
            });

            privateProperty(this, 'hasLedgerEntries', function () {
                return this.data.ledger.length > 0;
            });

            privateProperty(this, 'removeLedgerEntry', function (ledgerEntry) {
                this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                    return entry.date === ledgerEntry.date && entry.action === ledgerEntry.action && entry.quantity === ledgerEntry.quantity;
                });

                recalculate(this);
            });

            privateProperty(this, 'removeLedgerEntriesByReference', function (reference) {
                this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                    return entry.reference === reference;
                });
            });

            privateProperty(this, 'inventoryInRange', function (rangeStart, rangeEnd) {
                return inventoryInRange(this, rangeStart, rangeEnd);
            });

            privateProperty(this, 'inventoryBefore', function (before) {
                var beforeDate = moment(before, 'YYYY-MM-DD');

                if (this.startMonth && beforeDate.isSameOrAfter(this.startMonth)) {
                    var numberOfMonths = beforeDate.diff(this.startMonth, 'months');

                    if (underscore.isEmpty(_monthly)) {
                        recalculate(this);
                    }

                    return _monthly[numberOfMonths] || underscore.last(_monthly);
                }

                return openingMonth(this);
            });

            privateProperty(this, 'subtotalInRange', function (actions, rangeStart, rangeEnd) {
                var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD'),
                    rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD');

                actions = (underscore.isArray(actions) ? actions : [actions]);

                return underscore.chain(this.data.ledger)
                    .reject(function (entry) {
                        var entryDate = moment(entry.date);

                        return !underscore.contains(actions, entry.action) || entryDate.isBefore(rangeStartDate) || entryDate.isSameOrAfter(rangeEndDate);
                    })
                    .reduce(function (result, entry) {
                        result.quantity = safeMath.plus(result.quantity, entry.quantity);
                        result.value = safeMath.plus(result.value, entry.value);
                        result.price = safeMath.dividedBy(result.value, result.value);
                        return result;
                    }, {})
                    .value();
            });

            privateProperty(this, 'marketPriceAtDate', function (before) {
                var beforeDate = moment(before, 'YYYY-MM-DD'),
                    actions = ['Purchase', 'Sale'];

                return underscore.chain(this.data.ledger)
                    .filter(function (entry) {
                        return underscore.contains(actions, entry.action) && moment(entry.date).isSameOrBefore(beforeDate);
                    })
                    .map(function (entry) {
                        return safeMath.dividedBy(entry.value, entry.quantity);
                    })
                    .last()
                    .value() || this.data.pricePerUnit;
            });

            privateProperty(this, 'isLedgerEntryValid', function (item) {
                return isLedgerEntryValid(this, item);
            });

            privateProperty(this, 'clearLedger', function () {
                this.data.ledger = [];

                recalculate(this);
            });

            privateProperty(this, 'recalculateLedger' ,function () {
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

            function inventoryInRange(instance, rangeStart, rangeEnd) {
                var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD').date(1),
                    rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD').date(1),
                    numberOfMonths = rangeEndDate.diff(rangeStartDate, 'months'),
                    appliedStart = (instance.startMonth ? instance.startMonth.diff(rangeStartDate, 'months') : numberOfMonths),
                    appliedEnd = (instance.endMonth ? rangeEndDate.diff(instance.endMonth, 'months') : 0),
                    startCrop = Math.abs(Math.min(0, appliedStart));

                if (underscore.isEmpty(_monthly) && !underscore.isEmpty(instance.data.ledger)) {
                    recalculate(instance);
                }

                return underscore.reduce(defaultMonths(Math.max(0, appliedStart))
                        .concat(_monthly)
                        .concat(defaultMonths(Math.max(0, appliedEnd))),
                    function (monthly, curr) {
                        balanceEntry(curr, underscore.last(monthly) || openingMonth(instance));
                        monthly.push(curr);
                        return monthly;
                    }, [])
                    .slice(startCrop, startCrop + numberOfMonths);
            }

            function recalculate (instance) {
                var startMonth = instance.startMonth,
                    endMonth = instance.endMonth,
                    numberOfMonths = (endMonth ? endMonth.diff(startMonth, 'months') : endMonth);

                if (!underscore.isUndefined(numberOfMonths)) {
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

                        balanceEntry(curr, underscore.last(monthly) || openingMonth(instance));
                        monthly.push(curr);
                        return monthly;
                    }, []);
                }
            }

            Base.initializeObject(this.data, 'ledger', []);
            Base.initializeObject(this.data, 'openingBalance', 0);


            this.type = 'stock';
        }

        function defaultItem (quantity, value) {
            return {
                quantity: quantity || 0,
                value: value || 0
            }
        }

        function defaultMonth (quantity, value) {
            return {
                opening: defaultItem(quantity, value),
                credit: {},
                debit: {},
                balance: defaultItem(quantity, value),
                interest: 0,
                closing: defaultItem(quantity, value)
            }
        }

        function defaultMonths (size) {
            return underscore.range(size).map(defaultMonth);
        }

        function openingMonth (instance) {
            var quantity = instance.data.openingBalance,
                value = safeMath.times(instance.data.openingBalance, instance.data.pricePerUnit);

            return defaultMonth(quantity, value);
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
