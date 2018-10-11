var sdkModelOrganization = angular.module('ag.sdk.model.organization', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelOrganization.factory('Organization', ['computedProperty', 'Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'topologyHelper', 'underscore',
    function (computedProperty, Base, inheritModel, Model, privateProperty, readOnlyProperty, topologyHelper, underscore) {
        function Organization (attrs) {
            Model.Base.apply(this, arguments);

            // Geom
            privateProperty(this, 'contains', function (geojson) {
                return contains(this, geojson);
            });

            privateProperty(this, 'centroid', function () {
                return centroid(this);
            });

            computedProperty(this, 'countryLocale', function () {
                return countryLocale(this);
            });

            this.data = (attrs && attrs.data) || {};
            Base.initializeObject(this.data, 'attachments', []);
            Base.initializeObject(this.data, 'baseStyles', {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.country = attrs.country;
            this.email = attrs.email;
            this.hostUrl = attrs.hostUrl;
            this.name = attrs.name;
            this.primaryContact = attrs.primaryContact;
            this.registered = attrs.registered;
            this.status = attrs.status;
            this.teams = attrs.teams || [];
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

        function countryLocale (instance) {
            return underscore.findWhere(Organization.countryLocales, {
                country: instance.country || 'South Africa'
            });
        }

        privateProperty(Organization, 'contains', function (instance, geojson) {
            return contains(instance, geojson);
        });

        privateProperty(Organization, 'centroid', function (instance) {
            return centroid(instance);
        });

        privateProperty(Organization, 'countryLocale', function (instance) {
            return countryLocale(instance);
        });

        readOnlyProperty(Organization, 'countryLocales', [
            {
                country: 'Albania',
                zoom: 6,
                center: [20.0498339611, 41.1424498947],
                currency: 'Lek',
                code: 'ALL',
                sym: 'Lek'
            }, {
                country: 'Afghanistan',
                zoom: 6,
                center: [66.0047336558, 33.8352307278],
                currency: 'Afghani',
                code: 'AFN',
                sym: '؋'
            }, {
                country: 'Argentina',
                zoom: 6,
                center: [-65.179806925, -35.3813487953],
                currency: 'Peso',
                code: 'ARS',
                sym: '$'
            }, {
                country: 'Australia',
                zoom: 6,
                center: [134.491000082, -25.7328870417],
                currency: 'Dollar',
                code: 'AUD',
                sym: '$'
            }, {
                country: 'Azerbaijan',
                zoom: 6,
                center: [47.5459987892, 40.2882723471],
                currency: 'Manat',
                code: 'AZN',
                sym: '₼'
            }, {
                country: 'Bahamas',
                zoom: 6,
                center: [-76.6284303802, 24.2903670223],
                currency: 'Dollar',
                code: 'BSD',
                sym: '$'
            }, {
                country: 'Barbados',
                zoom: 6,
                center: [-59.5597970021, 13.1814542822],
                currency: 'Dollar',
                code: 'BBD',
                sym: '$'
            }, {
                country: 'Belarus',
                zoom: 6,
                center: [28.0320930703, 53.5313137685],
                currency: 'Ruble',
                code: 'BYN',
                sym: 'Br'
            }, {
                country: 'Belize',
                zoom: 6,
                center: [-88.7101048564, 17.2002750902],
                currency: 'Dollar',
                code: 'BZD',
                sym: 'BZ$'
            }, {
                country: 'Bermuda',
                zoom: 6,
                center: [-64.7545588982, 32.3136780208],
                currency: 'Dollar',
                code: 'BMD',
                sym: '$'
            }, {
                country: 'Bolivia',
                zoom: 6,
                center: [-64.6853864515, -16.7081478725],
                currency: 'Bolíviano',
                code: 'BOB',
                sym: '$b'
            }, {
                country: 'Bosnia and Herzegovina',
                zoom: 6,
                center: [17.7687673323, 44.1745012472],
                currency: 'Convertible Marka',
                code: 'BAM',
                sym: 'KM'
            }, {
                country: 'Botswana',
                zoom: 6,
                center: [23.7985336773, -22.1840321328],
                currency: 'Pula',
                code: 'BWP',
                sym: 'P'
            }, {
                country: 'Bulgaria',
                zoom: 6,
                center: [25.2155290863, 42.7689031797],
                currency: 'Lev',
                code: 'BGN',
                sym: 'лв'
            }, {
                country: 'Brazil',
                zoom: 6,
                center: [-53.0978311267, -10.7877770246],
                currency: 'Real',
                code: 'BRL',
                sym: 'R$'
            }, {
                country: 'Brunei Darussalam',
                zoom: 6,
                center: [114.722030354, 4.51968957503],
                currency: 'Dollar',
                code: 'BND',
                sym: '$'
            }, {
                country: 'Cambodia',
                zoom: 6,
                center: [104.906943249, 12.7200478567],
                currency: 'Riel',
                code: 'KHR',
                sym: '៛'
            }, {
                country: 'Canada',
                zoom: 6,
                center: [-98.3077702819, 61.3620632437],
                currency: 'Dollar',
                code: 'CAD',
                sym: '$'
            }, {
                country: 'Cayman Islands',
                zoom: 6,
                center: [-80.9121332147, 19.4289649722],
                currency: 'Dollar',
                code: 'KYD',
                sym: '$'
            }, {
                country: 'Chile',
                zoom: 6,
                center: [-71.3825621318, -37.730709893],
                currency: 'Peso',
                code: 'CLP',
                sym: '$'
            }, {
                country: 'China',
                zoom: 6,
                center: [103.81907349, 36.5617654559],
                currency: 'Yuan Renminbi',
                code: 'CNY',
                sym: '¥'
            }, {
                country: 'Colombia',
                zoom: 6,
                center: [-73.0811458241, 3.91383430725],
                currency: 'Peso',
                code: 'COP',
                sym: '$'
            }, {
                country: 'Costa Rica',
                zoom: 6,
                center: [-84.1920876775, 9.9763446384],
                currency: 'Colon',
                code: 'CRC',
                sym: '₡'
            }, {
                country: 'Croatia',
                zoom: 6,
                center: [16.404128994, 45.0804763057],
                currency: 'Kuna',
                code: 'HRK',
                sym: 'kn'
            }, {
                country: 'Cuba',
                zoom: 6,
                center: [-79.0160538445, 21.6228952793],
                currency: 'Peso',
                code: 'CUP',
                sym: '₱'
            }, {
                country: 'Czech Republic',
                zoom: 6,
                center: [15.3124016281, 49.7334123295],
                currency: 'Koruna',
                code: 'CZK',
                sym: 'Kč'
            }, {
                country: 'Denmark',
                zoom: 6,
                center: [10.0280099191, 55.9812529593],
                currency: 'Krone',
                code: 'DKK',
                sym: 'kr'
            }, {
                country: 'Dominican Republic',
                zoom: 6,
                center: [-70.5056889612, 18.8943308233],
                currency: 'Peso',
                code: 'DOP',
                sym: 'RD$'
            }, {
                country: 'Egypt',
                zoom: 6,
                center: [29.8619009908, 26.4959331064],
                currency: 'Pound',
                code: 'EGP',
                sym: '£'
            }, {
                country: 'El Salvador',
                zoom: 6,
                center: [-88.8716446906, 13.7394374383],
                currency: 'Colon',
                code: 'SVC',
                sym: '$'
            }, {
                country: 'Falkland Islands (Malvinas)',
                zoom: 6,
                center: [-59.35238956, -51.7448395441],
                currency: 'Pound',
                code: 'FKP',
                sym: '£'
            }, {
                country: 'Fiji',
                zoom: 6,
                center: [165.451954318, -17.4285803175],
                currency: 'Dollar',
                code: 'FJD',
                sym: '$'
            }, {
                country: 'Ghana',
                zoom: 6,
                center: [-1.21676565807, 7.95345643541],
                currency: 'Cedi',
                code: 'GHS',
                sym: '¢'
            }, {
                country: 'Guatemala',
                zoom: 6,
                center: [-90.3648200858, 15.694036635],
                currency: 'Quetzal',
                code: 'GTQ',
                sym: 'Q'
            }, {
                country: 'Guernsey',
                zoom: 6,
                center: [-2.57239063555, 49.4680976128],
                currency: 'Pound',
                code: 'GGP',
                sym: '£'
            }, {
                country: 'Guyana',
                zoom: 6,
                center: [-58.9820245893, 4.79378034012],
                currency: 'Dollar',
                code: 'GYD',
                sym: '$'
            }, {
                country: 'Honduras',
                zoom: 6,
                center: [-86.6151660963, 14.8268816519],
                currency: 'Lempira',
                code: 'HNL',
                sym: 'L'
            }, {
                country: 'Hong Kong',
                zoom: 6,
                center: [114.113804542, 22.3982773723],
                currency: 'Dollar',
                code: 'HKD',
                sym: '$'
            }, {
                country: 'Hungary',
                zoom: 6,
                center: [19.3955911607, 47.1627750614],
                currency: 'Forint',
                code: 'HUF',
                sym: 'Ft'
            }, {
                country: 'Iceland',
                zoom: 6,
                center: [-18.5739616708, 64.9957538607],
                currency: 'Krona',
                code: 'ISK',
                sym: 'kr'
            }, {
                country: 'India',
                zoom: 6,
                center: [79.6119761026, 22.8857821183],
                currency: 'Rupee',
                code: 'INR',
                sym: '₹'
            }, {
                country: 'Indonesia',
                zoom: 6,
                center: [117.240113662, -2.21505456346],
                currency: 'Rupiah',
                code: 'IDR',
                sym: 'Rp'
            }, {
                country: 'Iran',
                zoom: 6,
                center: [54.2740700448, 32.575032915],
                currency: 'Rial',
                code: 'IRR',
                sym: '﷼'
            }, {
                country: 'Isle of Man',
                zoom: 6,
                center: [-4.53873952326, 54.2241891077],
                currency: 'Pound',
                code: 'IMP',
                sym: '£'
            }, {
                country: 'Israel',
                zoom: 6,
                center: [35.0044469277, 31.4611010118],
                currency: 'Shekel',
                code: 'ILS',
                sym: '₪'
            }, {
                country: 'Jamaica',
                zoom: 6,
                center: [-77.3148259327, 18.1569487765],
                currency: 'Dollar',
                code: 'JMD',
                sym: 'J$'
            }, {
                country: 'Japan',
                zoom: 6,
                center: [138.030895577, 37.592301353],
                currency: 'Yen',
                code: 'JPY',
                sym: '¥'
            }, {
                country: 'Jersey',
                zoom: 6,
                center: [-2.12689937944, 49.2183737668],
                currency: 'Pound',
                code: 'JEP',
                sym: '£'
            }, {
                country: 'Kazakhstan',
                zoom: 6,
                center: [67.2914935687, 48.1568806661],
                currency: 'Tenge',
                code: 'KZT',
                sym: 'лв'
            }, {
                country: 'Korea (North)',
                zoom: 6,
                center: [127.192479732, 40.1535031093],
                currency: 'Won',
                code: 'KPW',
                sym: '₩'
            }, {
                country: 'Korea (South)',
                zoom: 6,
                center: [127.839160864, 36.3852398347],
                currency: 'Won',
                code: 'KRW',
                sym: '₩'
            }, {
                country: 'Kyrgyzstan',
                zoom: 6,
                center: [74.5416551329, 41.4622194346],
                currency: 'Som',
                code: 'KGS',
                sym: 'лв'
            }, {
                country: 'Laos',
                zoom: 6,
                center: [103.73772412, 18.5021743316],
                currency: 'Kip',
                code: 'LAK',
                sym: '₭'
            }, {
                country: 'Lebanon',
                zoom: 6,
                center: [35.880160715, 33.9230663057],
                currency: 'Pound',
                code: 'LBP',
                sym: '£'
            }, {
                country: 'Liberia',
                zoom: 6,
                center: [-9.3220757269, 6.45278491657],
                currency: 'Dollar',
                code: 'LRD',
                sym: '$'
            }, {
                country: 'Macedonia',
                zoom: 6,
                center: [21.6821134607, 41.5953089336],
                currency: 'Denar',
                code: 'MKD',
                sym: 'ден'
            }, {
                country: 'Malaysia',
                zoom: 6,
                center: [109.697622843, 3.78986845571],
                currency: 'Ringgit',
                code: 'MYR',
                sym: 'RM'
            }, {
                country: 'Mauritius',
                zoom: 6,
                center: [57.5712055061, -20.2776870433],
                currency: 'Rupee',
                code: 'MUR',
                sym: '₨'
            }, {
                country: 'Mexico',
                zoom: 6,
                center: [-102.523451692, 23.9475372406],
                currency: 'Peso',
                code: 'MXN',
                sym: '$'
            }, {
                country: 'Mongolia',
                zoom: 6,
                center: [103.052997649, 46.8268154394],
                currency: 'Tughrik',
                code: 'MNT',
                sym: '₮'
            }, {
                country: 'Mozambique',
                zoom: 6,
                center: [35.5336754259, -17.2738164259],
                currency: 'Metical',
                code: 'MZN',
                sym: 'MT'
            }, {
                country: 'Namibia',
                zoom: 6,
                center: [17.209635667, -22.1303256842],
                currency: 'Dollar',
                code: 'NAD',
                sym: '$'
            }, {
                country: 'Nepal',
                zoom: 6,
                center: [83.9158264002, 28.2489136496],
                currency: 'Rupee',
                code: 'NPR',
                sym: '₨'
            }, {
                country: 'New Zealand',
                zoom: 6,
                center: [171.484923466, -41.811135569],
                currency: 'Dollar',
                code: 'NZD',
                sym: '$'
            }, {
                country: 'Nicaragua',
                zoom: 6,
                center: [-85.0305296951, 12.8470942896],
                currency: 'Cordoba',
                code: 'NIO',
                sym: 'C$'
            }, {
                country: 'Nigeria',
                zoom: 6,
                center: [8.08943894771, 9.59411452233],
                currency: 'Naira',
                code: 'NGN',
                sym: '₦'
            }, {
                country: 'Norway',
                zoom: 6,
                center: [15.3483465622, 68.7501557205],
                currency: 'Krone',
                code: 'NOK',
                sym: 'kr'
            }, {
                country: 'Oman',
                zoom: 6,
                center: [56.0916615483, 20.6051533257],
                currency: 'Rial',
                code: 'OMR',
                sym: '﷼'
            }, {
                country: 'Pakistan',
                zoom: 6,
                center: [69.3395793748, 29.9497515031],
                currency: 'Rupee',
                code: 'PKR',
                sym: '₨'
            }, {
                country: 'Panama',
                zoom: 6,
                center: [-80.1191515612, 8.51750797491],
                currency: 'Balboa',
                code: 'PAB',
                sym: 'B/.'
            }, {
                country: 'Paraguay',
                zoom: 6,
                center: [-58.400137032, -23.228239132],
                currency: 'Guarani',
                code: 'PYG',
                sym: 'Gs'
            }, {
                country: 'Peru',
                zoom: 6,
                center: [-74.382426851, -9.15280381329],
                currency: 'Sol',
                code: 'PEN',
                sym: 'S/.'
            }, {
                country: 'Philippines',
                zoom: 6,
                center: [122.883932529, 11.7753677809],
                currency: 'Piso',
                code: 'PHP',
                sym: '₱'
            }, {
                country: 'Poland',
                zoom: 6,
                center: [19.3901283493, 52.1275956442],
                currency: 'Zloty',
                code: 'PLN',
                sym: 'zł'
            }, {
                country: 'Qatar',
                zoom: 6,
                center: [51.1847963212, 25.3060118763],
                currency: 'Riyal',
                code: 'QAR',
                sym: '﷼'
            }, {
                country: 'Romania',
                zoom: 6,
                center: [24.9729303933, 45.8524312742],
                currency: 'Leu',
                code: 'RON',
                sym: 'lei'
            }, {
                country: 'Russia',
                zoom: 6,
                center: [96.6865611231, 61.9805220919],
                currency: 'Ruble',
                code: 'RUB',
                sym: '₽'
            }, {
                country: 'Saint Helena',
                zoom: 6,
                center: [-9.5477941587, -12.4035595078],
                currency: 'Pound',
                code: 'SHP',
                sym: '£'
            }, {
                country: 'Saudi Arabia',
                zoom: 6,
                center: [44.5368627114, 24.1224584073],
                currency: 'Riyal',
                code: 'SAR',
                sym: '﷼'
            }, {
                country: 'Serbia',
                zoom: 6,
                center: [20.7895833363, 44.2215031993],
                currency: 'Dinar',
                code: 'RSD',
                sym: 'Дин.'
            }, {
                country: 'Seychelles',
                zoom: 6,
                center: [55.4760327912, -4.66099093522],
                currency: 'Rupee',
                code: 'SCR',
                sym: '₨'
            }, {
                country: 'Singapore',
                zoom: 6,
                center: [103.81725592, 1.35876087075],
                currency: 'Dollar',
                code: 'SGD',
                sym: '$'
            }, {
                country: 'Solomon Islands',
                zoom: 6,
                center: [159.632876678, -8.92178021692],
                currency: 'Dollar',
                code: 'SBD',
                sym: '$'
            }, {
                country: 'Somalia',
                zoom: 6,
                center: [45.7071448699, 4.75062876055],
                currency: 'Shilling',
                code: 'SOS',
                sym: 'S'
            }, {
                country: 'South Africa',
                zoom: 5.1,
                center: [25.0839009251, -29.0003409534],
                currency: 'Rand',
                code: 'ZAR',
                sym: 'R'
            }, {
                country: 'Sri Lanka',
                zoom: 6,
                center: [80.7010823782, 7.61266509224],
                currency: 'Rupee',
                code: 'LKR',
                sym: '₨'
            }, {
                country: 'Sweden',
                zoom: 6,
                center: [16.7455804869, 62.7796651931],
                currency: 'Krona',
                code: 'SEK',
                sym: 'kr'
            }, {
                country: 'Switzerland',
                zoom: 6,
                center: [8.20867470615, 46.7978587836],
                currency: 'Franc',
                code: 'CHF',
                sym: 'CHF'
            }, {
                country: 'Suriname',
                zoom: 6,
                center: [-55.9123456951, 4.1305541299],
                currency: 'Dollar',
                code: 'SRD',
                sym: '$'
            }, {
                country: 'Syria',
                zoom: 6,
                center: [38.5078820425, 35.025473894],
                currency: 'Pound',
                code: 'SYP',
                sym: '£'
            }, {
                country: 'Taiwan',
                zoom: 6,
                center: [120.954272814, 23.753992795],
                currency: 'New Dollar',
                code: 'TWD',
                sym: 'NT$'
            }, {
                country: 'Thailand',
                zoom: 6,
                center: [101.002881304, 15.1181579418],
                currency: 'Baht',
                code: 'THB',
                sym: '฿'
            }, {
                country: 'Trinidad and Tobago',
                zoom: 6,
                center: [-61.2656792335, 10.457334081],
                currency: 'Dollar',
                code: 'TTD',
                sym: 'TT$'
            }, {
                country: 'Turkey',
                zoom: 6,
                center: [35.1689534649, 39.0616029013],
                currency: 'Lira',
                code: 'TRY',
                sym: '₺'
            }, {
                country: 'Ukraine',
                zoom: 6,
                center: [31.3832646865, 48.9965667265],
                currency: 'Hryvnia',
                code: 'UAH',
                sym: '₴'
            }, {
                country: 'United Kingdom',
                zoom: 6,
                center: [-2.86563164084, 54.1238715577],
                currency: 'Pound',
                code: 'GBP',
                sym: '£'
            }, {
                country: 'United States',
                zoom: 6,
                center: [-112.4616737, 45.6795472026],
                currency: 'Dollar',
                code: 'USD',
                sym: '$'
            }, {
                country: 'Uruguay',
                zoom: 6,
                center: [-56.0180705315, -32.7995153444],
                currency: 'Peso',
                code: 'UYU',
                sym: '$U'
            }, {
                country: 'Uzbekistan',
                zoom: 6,
                center: [63.1400152805, 41.7555422527],
                currency: 'Som',
                code: 'UZS',
                sym: 'лв'
            }, {
                country: 'Venezuela',
                zoom: 6,
                center: [-66.1818412311, 7.12422421273],
                currency: 'Bolívar',
                code: 'VEF',
                sym: 'Bs'
            }, {
                country: 'Viet Nam',
                zoom: 6,
                center: [106.299146978, 16.6460167019],
                currency: 'Dong',
                code: 'VND',
                sym: '₫'
            }, {
                country: 'Yemen',
                zoom: 6,
                center: [47.5867618877, 15.9092800505],
                currency: 'Rial',
                code: 'YER',
                sym: '﷼'
            }, {
                country: 'Zimbabwe',
                zoom: 6,
                center: [29.8514412019, -19.0042041882],
                currency: 'Dollar',
                code: 'ZWD',
                sym: 'Z$'
            }
        ]);

        Organization.validates({
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 255
                }
            },
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
            },
            teams: {
                required: true,
                length: {
                    min: 1
                }
            }
        });

        return Organization;
    }]);


