var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.factory('Organization', ['Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (Base, inheritModel, Model, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Organization (attrs) {
            Model.Base.apply(this, arguments);

            // Geom
            privateProperty(this, 'contains', function (geojson) {
                return contains(this, geojson);
            });

            privateProperty(this, 'centroid', function () {
                return centroid(this);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'baseStyles', {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.email = attrs.email;
            this.hostUrl = attrs.hostUrl;
            this.name = attrs.name;
            this.registered = attrs.registered;
            this.services = attrs.services;
            this.status = attrs.status;
            this.uuid = attrs.uuid;
        }

        inheritModel(Organization, Model.Base);

        function getAssetsGeom (instance) {
            return underscore.chain(instance.legalEntities)
                .pluck('assets')
                .flatten().compact()
                .filter(function (asset) {
                    return asset.data && asset.data.loc;
                })
                .reduce(function (geom, asset) {
                    var assetGeom = topologyHelper.readGeoJSON(asset.data.loc);

                    return (geom && assetGeom.isValid() ? geom.union(assetGeom) : geom || assetGeom);
                }, null)
                .value();
        }

        function contains (instance, geojson) {
            var farmGeom = getAssetsGeom(instance),
                queryGeom = topologyHelper.readGeoJSON(geojson);

            return (farmGeom && queryGeom ? farmGeom.contains(queryGeom) : false);
        }

        function centroid (instance) {
            var geom = getAssetsGeom(instance);

            return (geom ? topologyHelper.writeGeoJSON(geom.getCentroid()) : geom);
        }

        privateProperty(Organization, 'contains', function (instance, geojson) {
            return contains(instance, geojson);
        });

        privateProperty(Organization, 'centroid', function (instance) {
            return centroid(instance);
        });

        readOnlyProperty(Organization, 'currencies', [
            {
                name: 'UAE Dirham',
                sym: 'د.إ',
                code: 'AED'
            }, {
                name: 'Afghan Afghani',
                sym: '؋',
                code: 'AFN'
            }, {
                name: 'Albanian lek',
                sym: 'L',
                code: 'ALL'
            }, {
                name: 'Armenian Dram',
                sym: '֏',
                code: 'AMD'
            }, {
                name: 'Netherlands Antillian Guilder',
                sym: 'ƒ',
                code: 'ANG'
            }, {
                name: 'Angolan Kwanza',
                sym: 'Kz',
                code: 'AOA'
            }, {
                name: 'Argentine Peso',
                sym: '$',
                code: 'ARS'
            }, {
                name: 'Australian Dollar',
                sym: '$',
                code: 'AUD'
            }, {
                name: 'Aruban Florin',
                sym: 'ƒ',
                code: 'AWG'
            }, {
                name: 'Azerbaijanian Manat',
                sym: 'ман',
                code: 'AZN'
            }, {
                name: 'Convertible Marks',
                sym: 'KM',
                code: 'BAM'
            }, {
                name: 'Barbados Dollar',
                sym: '$',
                code: 'BBD'
            }, {
                name: 'Bangladeshi Taka',
                sym: '৳',
                code: 'BDT'
            }, {
                name: 'Bulgarian Lev',
                sym: 'лв',
                code: 'BGN'
            }, {
                name: 'Bahraini Dinar',
                sym: '.د.ب',
                code: 'BHD'
            }, {
                name: 'Burundi Franc',
                sym: 'FBu',
                code: 'BIF'
            }, {
                name: 'Bermudian Dollar',
                sym: '$',
                code: 'BMD'
            }, {
                name: 'Brunei Dollar',
                sym: '$',
                code: 'BND'
            }, {
                name: 'Boliviano Mvdol',
                sym: '$b',
                code: 'BOB'
            }, {
                name: 'Brazilian Real',
                sym: 'R$',
                code: 'BRL'
            }, {
                name: 'Bahamian Dollar',
                sym: '$',
                code: 'BSD'
            }, {
                name: 'Bhutanese Ngultrum',
                sym: 'Nu.',
                code: 'BTN'
            }, {
                name: 'Botswana Pula',
                sym: 'P',
                code: 'BWP'
            }, {
                name: 'Belarussian Ruble',
                sym: 'Br.',
                code: 'BYR'
            }, {
                name: 'Belize Dollar',
                sym: 'BZ$',
                code: 'BZD'
            }, {
                name: 'Canadian Dollar',
                sym: '$',
                code: 'CAD'
            }, {
                name: 'Congolese Franc',
                sym: 'Fr.',
                code: 'CDF'
            }, {
                name: 'Swiss Franc',
                sym: 'CHF',
                code: 'CHF'
            }, {
                name: 'Chilean Peso',
                sym: '$',
                code: 'CLP'
            }, {
                name: 'Chinese Yuan Renminbi',
                sym: '¥',
                code: 'CNY'
            }, {
                name: 'Colombian Peso',
                sym: '$',
                code: 'COP'
            }, {
                name: 'Costa Rican Colon',
                sym: '₡',
                code: 'CRC'
            }, {
                name: 'Cuban Peso',
                sym: '₱',
                code: 'CUP'
            }, {
                name: 'Cuban Convertible Peso',
                sym: '$',
                code: 'CUC'
            }, {
                name: 'Cape Verde Escudo',
                sym: 'Esc',
                code: 'CVE'
            }, {
                name: 'Czech Koruna',
                sym: 'Kč',
                code: 'CZK'
            }, {
                name: 'Djibouti Franc',
                sym: 'Fdj',
                code: 'DJF'
            }, {
                name: 'Danish Krone',
                sym: 'kr',
                code: 'DKK'
            }, {
                name: 'Dominican Peso',
                sym: 'RD$',
                code: 'DOP'
            }, {
                name: 'Algerian Dinar',
                sym: 'د.ج',
                code: 'DZD'
            }, {
                name: 'Estonia Kroon',
                sym: 'kr',
                code: 'EEK'
            }, {
                name: 'Egyptian Pound',
                sym: '£',
                code: 'EGP'
            }, {
                name: 'Eritrean Nakfa',
                sym: 'Nfk',
                code: 'ERN'
            }, {
                name: 'Ethiopian Birr',
                sym: 'Br.',
                code: 'ETB'
            }, {
                name: 'Euro',
                sym: '€',
                code: 'EUR'
            }, {
                name: 'Fiji Dollar',
                sym: '$',
                code: 'FJD'
            }, {
                name: 'Falkland Islands Pound',
                sym: '£',
                code: 'FKP'
            }, {
                name: 'British Pound Sterling',
                sym: '£',
                code: 'GBP'
            }, {
                name: 'Georgian Lari',
                sym: 'ლ',
                code: 'GEL'
            }, {
                name: 'Guernsey pound',
                sym: '£',
                code: 'GGP'
            }, {
                name: 'Ghana Cedi',
                sym: '₵',
                code: 'GHS'
            }, {
                name: 'Gibraltar Pound',
                sym: '£',
                code: 'GIP'
            }, {
                name: 'Ghambian Dalasi',
                sym: 'D',
                code: 'GMD'
            }, {
                name: 'Guinea Franc',
                sym: 'GFr',
                code: 'GNF'
            }, {
                name: 'Guatemalan Quetzal',
                sym: 'Q',
                code: 'GTQ'
            }, {
                name: 'Guyana Dollar',
                sym: '$',
                code: 'GYD'
            }, {
                name: 'Hong Kong Dollar',
                sym: '$',
                code: 'HKD'
            }, {
                name: 'Honduran Lempira',
                sym: 'L',
                code: 'HNL'
            }, {
                name: 'Croatian Kuna',
                sym: 'kn',
                code: 'HRK'
            }, {
                name: 'Haitian Gourde',
                sym: 'G',
                code: 'HTG'
            }, {
                name: 'Hungarian Forint',
                sym: 'Ft',
                code: 'HUF'
            }, {
                name: 'Indonesian Rupiah',
                sym: 'Rp',
                code: 'IDR'
            }, {
                name: 'Israeli New Sheqel',
                sym: '₪',
                code: 'ILS'
            }, {
                name: 'Manx pound',
                sym: '£',
                code: 'IMP'
            }, {
                name: 'Indian Rupee',
                sym: '₹',
                code: 'INR'
            }, {
                name: 'Iraqi Dinar',
                sym: 'ع.د',
                code: 'IQD'
            }, {
                name: 'Iranian Rial',
                sym: '﷼',
                code: 'IRR'
            }, {
                name: 'Iceland Krona',
                sym: 'kr',
                code: 'ISK'
            }, {
                name: 'Jersey pound',
                sym: '£',
                code: 'JEP'
            }, {
                name: 'Jamaican Dollar',
                sym: 'J$',
                code: 'JMD'
            }, {
                name: 'Jordanian Dinar',
                sym: 'د.ا',
                code: 'JOD'
            }, {
                name: 'Japanese Yen',
                sym: '¥',
                code: 'JPY'
            }, {
                name: 'Kenyan Shilling',
                sym: 'Sh',
                code: 'KES'
            }, {
                name: 'Kyrgyzstani Som',
                sym: 'лв',
                code: 'KGS'
            }, {
                name: 'Cambodian Riel',
                sym: '៛',
                code: 'KHR'
            }, {
                name: 'Comoro Franc',
                sym: 'CF',
                code: 'KMF'
            }, {
                name: 'North Korean Won',
                sym: '₩',
                code: 'KPW'
            }, {
                name: 'South Korean Won',
                sym: '₩',
                code: 'KRW'
            }, {
                name: 'Kuwaiti Dinar',
                sym: 'د.ك',
                code: 'KWD'
            }, {
                name: 'Cayman Islands Dollar',
                sym: '$',
                code: 'KYD'
            }, {
                name: 'Kazakhstani Tenge',
                sym: '₸',
                code: 'KZT'
            }, {
                name: 'Lao Kip',
                sym: '₭',
                code: 'LAK'
            }, {
                name: 'Lebanese Pound',
                sym: 'ل.ل',
                code: 'LBP'
            }, {
                name: 'Sri Lanka Rupee',
                sym: 'රු',
                code: 'LKR'
            }, {
                name: 'Liberian Dollar',
                sym: '$',
                code: 'LRD'
            }, {
                name: 'Lesotho Loti',
                sym: 'L',
                code: 'LSL'
            }, {
                name: 'Lithuanian Litas',
                sym: 'Lt',
                code: 'LTL'
            }, {
                name: 'Latvian Lats',
                sym: 'Ls',
                code: 'LVL'
            }, {
                name: 'Libyan Dinar',
                sym: 'ل.د',
                code: 'LYD'
            }, {
                name: 'Moroccan Dirham',
                sym: 'د.م.',
                code: 'MAD'
            }, {
                name: 'Moldovan Leu',
                sym: 'L',
                code: 'MDL'
            }, {
                name: 'Malagasy Ariary',
                sym: 'Ar',
                code: 'MGA'
            }, {
                name: 'Macedonian Denar',
                sym: 'ден',
                code: 'MKD'
            }, {
                name: 'Burmese Kyat',
                sym: 'Ks',
                code: 'MMK'
            }, {
                name: 'Mongolian Tugrik',
                sym: '₮',
                code: 'MNT'
            }, {
                name: 'Macanese Pataca',
                sym: 'P',
                code: 'MOP'
            }, {
                name: 'Mauritanian Ouguiya',
                sym: 'UM',
                code: 'MRO'
            }, {
                name: 'Mauritius Rupee',
                sym: '₨',
                code: 'MUR'
            }, {
                name: 'Maildivian Rufiyaa',
                sym: '.ރ',
                code: 'MVR'
            }, {
                name: 'Malawian Kwacha',
                sym: 'MK',
                code: 'MWK'
            }, {
                name: 'Mexican Peso',
                sym: '$',
                code: 'MXN'
            }, {
                name: 'Malaysian Ringgit',
                sym: 'RM',
                code: 'MYR'
            }, {
                name: 'Mozambican Metical',
                sym: 'MT',
                code: 'MZN'
            }, {
                name: 'Namibian Dollar',
                sym: '$',
                code: 'NAD'
            }, {
                name: 'Nigeria Naira',
                sym: '₦',
                code: 'NGN'
            }, {
                name: 'Nicaraguan Cordoba Oro',
                sym: 'C$',
                code: 'NIO'
            }, {
                name: 'Norwegian Krone',
                sym: 'kr',
                code: 'NOK'
            }, {
                name: 'Nepalese Rupee',
                sym: '₨',
                code: 'NPR'
            }, {
                name: 'New Zealand Dollar',
                sym: '$',
                code: 'NZD'
            }, {
                name: 'Omani Rial',
                sym: 'ر.ع.',
                code: 'OMR'
            }, {
                name: 'Panamanian Balboa',
                sym: 'B/.',
                code: 'PAB'
            }, {
                name: 'Peruvian Nuevo Sol',
                sym: 'S/.',
                code: 'PEN'
            }, {
                name: 'Papua New Guinean Kina',
                sym: 'K',
                code: 'PGK'
            }, {
                name: 'Philippine Peso',
                sym: '₱',
                code: 'PHP'
            }, {
                name: 'Pakistan Rupee',
                sym: '₨',
                code: 'PKR'
            }, {
                name: 'Polish Zloty',
                sym: 'zł',
                code: 'PLN'
            }, {
                name: 'Transnistrian Ruble',
                sym: 'p.',
                code: 'PRB'
            }, {
                name: 'Paraguayan Guarani',
                sym: '₲',
                code: 'PYG'
            }, {
                name: 'Qatari Rial',
                sym: 'ر.ق',
                code: 'QAR'
            }, {
                name: 'Romanian Leu',
                sym: 'lei',
                code: 'RON'
            }, {
                name: 'Serbian Dinar',
                sym: 'Дин.',
                code: 'RSD'
            }, {
                name: 'Russian Ruble',
                sym: 'руб',
                code: 'RUB'
            }, {
                name: 'Rwanda Franc',
                sym: 'R₣',
                code: 'RWF'
            }, {
                name: 'Saudi Riyal',
                sym: 'ر.س',
                code: 'SAR'
            }, {
                name: 'Solomon Islands Dollar',
                sym: '$',
                code: 'SBD'
            }, {
                name: 'Seychelles Rupee',
                sym: '₨',
                code: 'SCR'
            }, {
                name: 'Sudanese Pound',
                sym: '£',
                code: 'SDG'
            }, {
                name: 'Swedish Krona',
                sym: 'kr',
                code: 'SEK'
            }, {
                name: 'Singapore Dollar',
                sym: '$',
                code: 'SGD'
            }, {
                name: 'Saint Helena Pound',
                sym: '£',
                code: 'SHP'
            }, {
                name: 'Sierra Leonean Leone',
                sym: 'Le',
                code: 'SLL'
            }, {
                name: 'Somali Shilling',
                sym: 'Sh',
                code: 'SOS'
            }, {
                name: 'Surinamese Dollar',
                sym: '$',
                code: 'SRD'
            }, {
                name: 'South Sudanese Pound',
                sym: '£',
                code: 'SSP'
            }, {
                name: 'São Tomé and Príncipe Dobra',
                sym: 'Db',
                code: 'STD'
            }, {
                name: 'El Salvador Colon US Dollar',
                sym: '$',
                code: 'SVC'
            }, {
                name: 'Syrian Pound',
                sym: 'ل.س',
                code: 'SYP'
            }, {
                name: 'Swazi Lilangeni',
                sym: 'L',
                code: 'SZL'
            }, {
                name: 'Thai Baht',
                sym: '฿',
                code: 'THB'
            }, {
                name: 'Tajikistani Somoni',
                sym: 'SM',
                code: 'TJS'
            }, {
                name: 'Turkmenistan Manat',
                sym: 'm',
                code: 'TMT'
            }, {
                name: 'Tunisian Dinar',
                sym: 'د.ت',
                code: 'TND'
            }, {
                name: 'Tongan Pa\'anga',
                sym: 'T$',
                code: 'TOP'
            }, {
                name: 'Turkish Lira',
                sym: '₺',
                code: 'TRY'
            }, {
                name: 'Trinidad and Tobago Dollar',
                sym: 'TT$',
                code: 'TTD'
            }, {
                name: 'New Taiwan Dollar',
                sym: 'NT$',
                code: 'TWD'
            }, {
                name: 'Tanzanian Shilling',
                sym: 'Sh',
                code: 'TZS'
            }, {
                name: 'Ukrainian Hryvnia',
                sym: '₴',
                code: 'UAH'
            }, {
                name: 'Uganda Shilling',
                sym: 'Sh',
                code: 'UGX'
            }, {
                name: 'US Dollar',
                sym: '$',
                code: 'USD'
            }, {
                name: 'Uruguayan Peso',
                sym: '$U',
                code: 'UYU'
            }, {
                name: 'Uzbekistan Som',
                sym: 'лв',
                code: 'UZS'
            }, {
                name: 'Venezuelan Bolivar Fuerte',
                sym: 'Bs',
                code: 'VEF'
            }, {
                name: 'Vietnamese Dong',
                sym: '₫',
                code: 'VND'
            }, {
                name: 'Vanuatu Vatu',
                sym: 'Vt',
                code: 'VUV'
            }, {
                name: 'Samoan Tala',
                sym: 'T',
                code: 'WST'
            }, {
                name: 'East Caribbean Dollar',
                sym: '$',
                code: 'XCD'
            }, {
                name: 'Yemeni Rial',
                sym: '﷼',
                code: 'YER'
            }, {
                name: 'South African Rand',
                sym: 'R',
                code: 'ZAR'
            }, {
                name: 'Zambian Kwacha',
                sym: 'ZK',
                code: 'ZMW'
            }, {
                name: 'Zimbabwe Dollar',
                sym: '$',
                code: 'ZWD'
            }]);

        Organization.validates({
            email: {
                required: true,
                format: {
                    email: true
                }
            },
            name: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
            organizationId: {
                required: true,
                numeric: true
            }
        });

        return Organization;
    }]);


