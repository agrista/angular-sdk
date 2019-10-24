var sdkModelStock = angular.module('ag.sdk.model.stock', ['ag.sdk.library', 'ag.sdk.utilities', 'ag.sdk.model.asset', 'ag.sdk.model.asset-factory', 'ag.sdk.model.base']);

sdkModelStock.provider('Stock', ['AssetFactoryProvider', function (AssetFactoryProvider) {
    this.$get = ['AssetBase', 'Base', 'computedProperty', 'inheritModel', 'moment', 'naturalSort', 'privateProperty', 'readOnlyProperty', 'safeMath', 'underscore',
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
                    'incoming': [
                        'Production',
                        'Purchase'],
                    'movement': [
                        'Deliver'
                    ],
                    'outgoing': [
                        'Consumption',
                        'Internal',
                        'Household',
                        'Labour',
                        'Repay',
                        'Sale']
                }, {configurable: true});

                readOnlyProperty(this, 'actionTitles', {
                    'Consumption': 'Consume',
                    'Household': 'Household Consumption',
                    'Internal': 'Internal Consumption',
                    'Labour': 'Labour Consumption',
                    'Deliver': 'Deliver',
                    'Production': 'Produce',
                    'Purchase': 'Buy Stock',
                    'Repay': 'Repay Credit',
                    'Sale': 'Sell Stock'
                }, {configurable: true});

                privateProperty(this, 'getActionTitle', function (action) {
                    return this.actionTitles[action];
                }, {configurable: true});

                // Ledger
                function addLedgerEntry (instance, ledgerEntry, options) {
                    if (instance.isLedgerEntryValid(ledgerEntry)) {
                        options = underscore.defaults(options || {}, {
                            checkEntries: true,
                            recalculate: true
                        });

                        instance.data.ledger = underscore.chain(instance.data.ledger)
                            .union([underscore.extend(ledgerEntry, {
                                date: moment(ledgerEntry.date).format('YYYY-MM-DD')
                            })])
                            .sortBy(function (item) {
                                return moment(item.date).valueOf() + getActionGroup(instance, item.action);
                            })
                            .value();
                        instance.$dirty = true;

                        if (options.recalculate) {
                            recalculateAndCache(instance, options);
                        }
                    }
                }

                privateProperty(this, 'addLedgerEntry', function (ledgerEntry, options) {
                    return addLedgerEntry(this, ledgerEntry, options);
                });

                function setLedgerEntry (instance, ledgerEntry, data, options) {
                    if (!underscore.isEqual(data, underscore.pick(ledgerEntry, underscore.keys(data)))) {
                        underscore.extend(ledgerEntry, data);
                        instance.$dirty = true;

                        options = underscore.defaults(options || {}, {
                            checkEntries: false,
                            recalculate: true
                        });

                        if (options.recalculate) {
                            recalculateAndCache(instance, options);
                        }
                    }
                }

                privateProperty(this, 'setLedgerEntry', function (ledgerEntry, data, options) {
                    return setLedgerEntry(this, ledgerEntry, data, options);
                });

                function getActionGroup (instance, action) {
                    var pureAction = asPureAction(action);

                    return underscore.chain(instance.actions)
                        .keys()
                        .filter(function (group) {
                            return underscore.contains(instance.actions[group], pureAction);
                        })
                        .first()
                        .value();
                }

                privateProperty(this, 'getActionGroup', function (action) {
                    return getActionGroup(this, action);
                });

                privateProperty(this, 'findLedgerEntry', function (reference, source) {
                    return underscore.find(this.data.ledger, function (entry) {
                        return (underscore.isUndefined(reference) || entry.reference === reference) &&
                            (underscore.isUndefined(source) || entry.source === source);
                    });
                });

                privateProperty(this, 'hasLedgerEntries', function () {
                    return this.data.ledger.length > 0;
                });

                privateProperty(this, 'hasQuantityBefore', function (before) {
                    var beforeDate = moment(before, 'YYYY-MM-DD');

                    return !underscore.isUndefined(underscore.chain(this.data.ledger)
                        .filter(function (entry) {
                            return moment(entry.date).isSameOrBefore(beforeDate);
                        })
                        .pluck('quantity')
                        .last()
                        .value());
                });

                privateProperty(this, 'removeLedgerEntry', function (ledgerEntry, options) {
                    options = underscore.defaults(options || {}, {
                        checkEntries: false,
                        markDeleted: false,
                        recalculate: true
                    });

                    if (ledgerEntry) {
                        if (options.markDeleted) {
                            ledgerEntry.deleted = true;
                        } else {
                            this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                                return entry.date === ledgerEntry.date && entry.action === ledgerEntry.action && entry.quantity === ledgerEntry.quantity;
                            });
                            this.$dirty = true;
                        }

                        if (options.recalculate) {
                            recalculateAndCache(this, options);
                        }
                    }
                });

                privateProperty(this, 'generateLedgerEntryReference', function (entry) {
                    return underscore.compact([entry.action, entry.date]).join('/');
                });

                privateProperty(this, 'removeLedgerEntriesByReference', function (reference, source, options) {
                    if (underscore.isObject(source)) {
                        options = source;
                        source = undefined;
                    }

                    this.data.ledger = underscore.reject(this.data.ledger, function (entry) {
                        return entry.source === source && s.include(entry.reference, reference);
                    });
                    this.$dirty = true;

                    recalculateAndCache(this, options);
                });

                privateProperty(this, 'inventoryInRange', function (rangeStart, rangeEnd) {
                    return inventoryInRange(this, rangeStart, rangeEnd);
                });

                privateProperty(this, 'inventoryBefore', function (before) {
                    var beforeDate = moment(before, 'YYYY-MM-DD');

                    if (this.startMonth && beforeDate.isSameOrAfter(this.startMonth)) {
                        var numberOfMonths = beforeDate.diff(this.startMonth, 'months');

                        if (underscore.isEmpty(_monthly)) {
                            recalculateAndCache(this);
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

                            return entry.deleted || !underscore.contains(actions, entry.action) || entryDate.isBefore(rangeStartDate) || entryDate.isSameOrAfter(rangeEndDate);
                        })
                        .reduce(function (result, entry) {
                            result.quantity = safeMath.plus(result.quantity, entry.quantity);
                            result.value = safeMath.plus(result.value, entry.value);
                            result.price = safeMath.dividedBy(result.value, result.quantity);
                            return result;
                        }, {})
                        .value();
                });

                privateProperty(this, 'marketPriceAtDate', function (before) {
                    var beforeDate = moment(before, 'YYYY-MM-DD'),
                        actions = ['Purchase', 'Sale'];

                    return underscore.chain(this.data.ledger)
                        .filter(function (entry) {
                            return !entry.deleted && underscore.contains(actions, entry.action) && moment(entry.date).isSameOrBefore(beforeDate);
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

                    recalculateAndCache(this);
                });

                privateProperty(this, 'recalculateLedger', function (options) {
                    recalculateAndCache(this, options);
                });

                var _monthly = [];

                function balanceEntry (curr, prev) {
                    curr.opening = prev.closing;
                    curr.balance = underscore.mapObject(curr.opening, function (value, key) {
                        return Math.max(0, safeMath.chain(value)
                            .plus(underscore.reduce(curr.incoming, function (total, item) {
                                return safeMath.plus(total, item[key]);
                            }, 0))
                            .minus(underscore.reduce(curr.outgoing, function (total, item) {
                                return safeMath.plus(total, item[key]);
                            }, 0))
                            .toNumber());
                    });
                    curr.closing = curr.balance;
                }

                function inventoryInRange (instance, rangeStart, rangeEnd) {
                    var rangeStartDate = moment(rangeStart, 'YYYY-MM-DD').date(1),
                        rangeEndDate = moment(rangeEnd, 'YYYY-MM-DD').date(1),
                        numberOfMonths = rangeEndDate.diff(rangeStartDate, 'months'),
                        appliedStart = (instance.startMonth ? instance.startMonth.diff(rangeStartDate, 'months') : numberOfMonths),
                        appliedEnd = (instance.endMonth ? rangeEndDate.diff(instance.endMonth, 'months') : 0),
                        startCrop = Math.abs(Math.min(0, appliedStart)),
                        openingMonthEntry = openingMonth(instance);

                    if (underscore.isEmpty(_monthly) && !underscore.isEmpty(instance.data.ledger)) {
                        recalculateAndCache(instance);
                    }

                    return underscore.reduce(defaultMonths(Math.max(0, appliedStart))
                            .concat(_monthly)
                            .concat(defaultMonths(Math.max(0, appliedEnd))),
                        function (monthly, curr) {
                            var prev = (monthly.length > 0 ? monthly[monthly.length - 1] : openingMonthEntry);

                            balanceEntry(curr, prev);
                            monthly.push(curr);
                            return monthly;
                        }, [])
                        .slice(startCrop, startCrop + numberOfMonths);
                }

                function recalculate (instance, options) {
                    var startMonth = instance.startMonth,
                        endMonth = instance.endMonth,
                        numberOfMonths = (endMonth ? endMonth.diff(startMonth, 'months') : -1),
                        openingMonthEntry = openingMonth(instance),
                        types = ['incoming', 'movement', 'outgoing'];

                    options = underscore.defaults(options || {}, {
                        checkEntries: false
                    });

                    return underscore.range(numberOfMonths + 1).reduce(function (monthly, offset) {
                        var offsetDate = moment(startMonth).add(offset, 'M'),
                            offsetYear = offsetDate.year(),
                            offsetMonth = offsetDate.month(),
                            prev = (monthly.length > 0 ? monthly[monthly.length - 1] : openingMonthEntry);

                        var curr = underscore.reduce(instance.data.ledger, function (month, entry) {
                            var itemDate = moment(entry.date),
                                pureAction = asPureAction(entry.action);

                            if (!entry.deleted && offsetMonth === itemDate.month() && offsetYear === itemDate.year()) {
                                underscore.each(types, function (type) {
                                    if (underscore.contains(instance.actions[type], pureAction)) {
                                        if (options.checkEntries) {
                                            recalculateEntry(instance, entry);
                                        }

                                        month.entries.push(entry);
                                        month[type][pureAction] = (underscore.isUndefined(month[type][pureAction]) ?
                                            defaultItem(entry.quantity, entry.value) :
                                            underscore.mapObject(month[type][pureAction], function (value, key) {
                                                return safeMath.plus(value, entry[key]);
                                            }));
                                    }
                                });
                            }

                            return month;
                        }, defaultMonth());

                        balanceEntry(curr, prev);
                        monthly.push(curr);
                        return monthly;
                    }, []);
                }

                function recalculateEntry (instance, entry) {
                    if (underscore.isUndefined(entry.price) && !underscore.isUndefined(entry.quantity) && !underscore.isUndefined(instance.data.pricePerUnit)) {
                        entry.price = instance.data.pricePerUnit;
                        entry.value = safeMath.times((entry.rate || 1), safeMath.times(entry.price, entry.quantity));
                    }
                }

                function recalculateAndCache (instance, options) {
                    _monthly = recalculate(instance, options);
                }

                Base.initializeObject(this.data, 'ledger', []);
                Base.initializeObject(this.data, 'openingBalance', 0);

                this.type = 'stock';

                if (underscore.isUndefined(attrs) || arguments.length === 0) return;

                this.productId = attrs.productId;
                this.product = attrs.product;
            }

            function asPureAction (action) {
                return s.strLeft(action, ':');
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
                    incoming: {},
                    movement: {},
                    outgoing: {},
                    entries: [],
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
                var pureAction = asPureAction(item.action);
                return item && item.date && moment(item.date).isValid() &&
                    /*underscore.isNumber(item.quantity) && */underscore.isNumber(item.value) &&
                    underscore.contains(underscore.keys(instance.actionTitles), pureAction);
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
        }];

    AssetFactoryProvider.add('stock', 'Stock');
}]);
