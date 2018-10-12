var sdkModelLocale  = angular.module('ag.sdk.model.locale', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelLocale.factory('Locale', ['computedProperty', 'Base', 'inheritModel', 'Model', 'privateProperty', 'readOnlyProperty', 'underscore',
    function (computedProperty, Base, inheritModel, Model, privateProperty, readOnlyProperty, underscore) {
        function Locale (attrs) {
            Model.Base.apply(this, arguments);

            computedProperty(this, 'countryLocale', function () {
                return countryLocale(this);
            });

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.country = attrs.country;
        }

        inheritModel(Locale, Model.Base);

        function countryLocale (instance) {
            return underscore.findWhere(Locale.countryLocales, {
                country: instance.country || 'South Africa'
            });
        }

        privateProperty(Locale, 'countryLocale', function (instance) {
            return countryLocale(instance);
        });

        readOnlyProperty(Locale, 'countryLocales', underscore.map([
            [[41.1424498947,20.0498339611], 'Albania',6, 'Lek', 'ALL', 'Lek'],
            [[33.8352307278,66.0047336558], 'Afghanistan',6, 'Afghani', 'AFN', '؋'],
            [[-35.3813487953,-65.179806925], 'Argentina',6, 'Peso', 'ARS', '$'],
            [[-25.7328870417,134.491000082], 'Australia',6, 'Dollar', 'AUD', '$'],
            [[40.2882723471,47.5459987892], 'Azerbaijan',6, 'Manat', 'AZN', '₼'],
            [[24.2903670223,-76.6284303802], 'Bahamas',6, 'Dollar', 'BSD', '$'],
            [[13.1814542822,-59.5597970021], 'Barbados',6, 'Dollar', 'BBD', '$'],
            [[53.5313137685,28.0320930703], 'Belarus',6, 'Ruble', 'BYN', 'Br'],
            [[17.2002750902,-88.7101048564], 'Belize',6, 'Dollar', 'BZD', 'BZ$'],
            [[32.3136780208,-64.7545588982], 'Bermuda',6, 'Dollar', 'BMD', '$'],
            [[-16.7081478725,-64.6853864515], 'Bolivia',6, 'Bolíviano', 'BOB', '$b'],
            [[44.1745012472,17.7687673323], 'Bosnia and Herzegovina',6, 'Convertible Marka', 'BAM', 'KM'],
            [[-22.1840321328,23.7985336773], 'Botswana',6, 'Pula', 'BWP', 'P'],
            [[42.7689031797,25.2155290863], 'Bulgaria',6, 'Lev', 'BGN', 'лв'],
            [[-10.7877770246,-53.0978311267], 'Brazil',6, 'Real', 'BRL', 'R$'],
            [[4.51968957503,114.722030354], 'Brunei Darussalam',6, 'Dollar', 'BND', '$'],
            [[12.7200478567,104.906943249], 'Cambodia',6, 'Riel', 'KHR', '៛'],
            [[61.3620632437,-98.3077702819], 'Canada',6, 'Dollar', 'CAD', '$'],
            [[19.4289649722,-80.9121332147], 'Cayman Islands',6, 'Dollar', 'KYD', '$'],
            [[-37.730709893,-71.3825621318], 'Chile',6, 'Peso', 'CLP', '$'],
            [[36.5617654559,103.81907349], 'China',6, 'Yuan Renminbi', 'CNY', '¥'],
            [[3.91383430725,-73.0811458241], 'Colombia',6, 'Peso', 'COP', '$'],
            [[9.9763446384,-84.1920876775], 'Costa Rica',6, 'Colon', 'CRC', '₡'],
            [[45.0804763057,16.404128994], 'Croatia',6, 'Kuna', 'HRK', 'kn'],
            [[21.6228952793,-79.0160538445], 'Cuba',6, 'Peso', 'CUP', '₱'],
            [[49.7334123295,15.3124016281], 'Czech Republic',6, 'Koruna', 'CZK', 'Kč'],
            [[55.9812529593,10.0280099191], 'Denmark',6, 'Krone', 'DKK', 'kr'],
            [[18.8943308233,-70.5056889612], 'Dominican Republic',6, 'Peso', 'DOP', 'RD$'],
            [[26.4959331064,29.8619009908], 'Egypt',6, 'Pound', 'EGP', '£'],
            [[13.7394374383,-88.8716446906], 'El Salvador',6, 'Colon', 'SVC', '$'],
            [[-51.7448395441,-59.35238956], 'Falkland Islands (Malvinas)',6, 'Pound', 'FKP', '£'],
            [[-17.4285803175,165.451954318], 'Fiji',6, 'Dollar', 'FJD', '$'],
            [[7.95345643541,-1.21676565807], 'Ghana',6, 'Cedi', 'GHS', '¢'],
            [[15.694036635,-90.3648200858], 'Guatemala',6, 'Quetzal', 'GTQ', 'Q'],
            [[49.4680976128,-2.57239063555], 'Guernsey',6, 'Pound', 'GGP', '£'],
            [[4.79378034012,-58.9820245893], 'Guyana',6, 'Dollar', 'GYD', '$'],
            [[14.8268816519,-86.6151660963], 'Honduras',6, 'Lempira', 'HNL', 'L'],
            [[22.3982773723,114.113804542], 'Hong Kong',6, 'Dollar', 'HKD', '$'],
            [[47.1627750614,19.3955911607], 'Hungary',6, 'Forint', 'HUF', 'Ft'],
            [[64.9957538607,-18.5739616708], 'Iceland',6, 'Krona', 'ISK', 'kr'],
            [[22.8857821183,79.6119761026], 'India',6, 'Rupee', 'INR', '₹'],
            [[-2.21505456346,117.240113662], 'Indonesia',6, 'Rupiah', 'IDR', 'Rp'],
            [[32.575032915,54.2740700448], 'Iran',6, 'Rial', 'IRR', '﷼'],
            [[54.2241891077,-4.53873952326], 'Isle of Man',6, 'Pound', 'IMP', '£'],
            [[31.4611010118,35.0044469277], 'Israel',6, 'Shekel', 'ILS', '₪'],
            [[18.1569487765,-77.3148259327], 'Jamaica',6, 'Dollar', 'JMD', 'J$'],
            [[37.592301353,138.030895577], 'Japan',6, 'Yen', 'JPY', '¥'],
            [[49.2183737668,-2.12689937944], 'Jersey',6, 'Pound', 'JEP', '£'],
            [[48.1568806661,67.2914935687], 'Kazakhstan',6, 'Tenge', 'KZT', 'лв'],
            [[40.1535031093,127.192479732], 'Korea (North)',6, 'Won', 'KPW', '₩'],
            [[36.3852398347,127.839160864], 'Korea (South)',6, 'Won', 'KRW', '₩'],
            [[41.4622194346,74.5416551329], 'Kyrgyzstan',6, 'Som', 'KGS', 'лв'],
            [[18.5021743316,103.73772412], 'Laos',6, 'Kip', 'LAK', '₭'],
            [[33.9230663057,35.880160715], 'Lebanon',6, 'Pound', 'LBP', '£'],
            [[6.45278491657,-9.3220757269], 'Liberia',6, 'Dollar', 'LRD', '$'],
            [[41.5953089336,21.6821134607], 'Macedonia',6, 'Denar', 'MKD', 'ден'],
            [[3.78986845571,109.697622843], 'Malaysia',6, 'Ringgit', 'MYR', 'RM'],
            [[-20.2776870433,57.5712055061], 'Mauritius',6, 'Rupee', 'MUR', '₨'],
            [[23.9475372406,-102.523451692], 'Mexico',6, 'Peso', 'MXN', '$'],
            [[46.8268154394,103.052997649], 'Mongolia',6, 'Tughrik', 'MNT', '₮'],
            [[-17.2738164259,35.5336754259], 'Mozambique',6, 'Metical', 'MZN', 'MT'],
            [[-22.1303256842,17.209635667], 'Namibia',6, 'Dollar', 'NAD', '$'],
            [[28.2489136496,83.9158264002], 'Nepal',6, 'Rupee', 'NPR', '₨'],
            [[-41.811135569,171.484923466], 'New Zealand',6, 'Dollar', 'NZD', '$'],
            [[12.8470942896,-85.0305296951], 'Nicaragua',6, 'Cordoba', 'NIO', 'C$'],
            [[9.59411452233,8.08943894771], 'Nigeria',6, 'Naira', 'NGN', '₦'],
            [[68.7501557205,15.3483465622], 'Norway',6, 'Krone', 'NOK', 'kr'],
            [[20.6051533257,56.0916615483], 'Oman',6, 'Rial', 'OMR', '﷼'],
            [[29.9497515031,69.3395793748], 'Pakistan',6, 'Rupee', 'PKR', '₨'],
            [[8.51750797491,-80.1191515612], 'Panama',6, 'Balboa', 'PAB', 'B/.'],
            [[-23.228239132,-58.400137032], 'Paraguay',6, 'Guarani', 'PYG', 'Gs'],
            [[-9.15280381329,-74.382426851], 'Peru',6, 'Sol', 'PEN', 'S/.'],
            [[11.7753677809,122.883932529], 'Philippines',6, 'Piso', 'PHP', '₱'],
            [[52.1275956442,19.3901283493], 'Poland',6, 'Zloty', 'PLN', 'zł'],
            [[25.3060118763,51.1847963212], 'Qatar',6, 'Riyal', 'QAR', '﷼'],
            [[45.8524312742,24.9729303933], 'Romania',6, 'Leu', 'RON', 'lei'],
            [[61.9805220919,96.6865611231], 'Russia',6, 'Ruble', 'RUB', '₽'],
            [[-12.4035595078,-9.5477941587], 'Saint Helena',6, 'Pound', 'SHP', '£'],
            [[24.1224584073,44.5368627114], 'Saudi Arabia',6, 'Riyal', 'SAR', '﷼'],
            [[44.2215031993,20.7895833363], 'Serbia',6, 'Dinar', 'RSD', 'Дин.'],
            [[-4.66099093522,55.4760327912], 'Seychelles',6, 'Rupee', 'SCR', '₨'],
            [[1.35876087075,103.81725592], 'Singapore',6, 'Dollar', 'SGD', '$'],
            [[-8.92178021692,159.632876678], 'Solomon Islands',6, 'Dollar', 'SBD', '$'],
            [[4.75062876055,45.7071448699], 'Somalia',6, 'Shilling', 'SOS', 'S'],
            [[-29.0003409534,25.0839009251], 'South Africa',5.1, 'Rand', 'ZAR', 'R'],
            [[7.61266509224,80.7010823782], 'Sri Lanka',6, 'Rupee', 'LKR', '₨'],
            [[62.7796651931,16.7455804869], 'Sweden',6, 'Krona', 'SEK', 'kr'],
            [[46.7978587836,8.20867470615], 'Switzerland',6, 'Franc', 'CHF', 'CHF'],
            [[4.1305541299,-55.9123456951], 'Suriname',6, 'Dollar', 'SRD', '$'],
            [[35.025473894,38.5078820425], 'Syria',6, 'Pound', 'SYP', '£'],
            [[23.753992795,120.954272814], 'Taiwan',6, 'New Dollar', 'TWD', 'NT$'],
            [[15.1181579418,101.002881304], 'Thailand',6, 'Baht', 'THB', '฿'],
            [[10.457334081,-61.2656792335], 'Trinidad and Tobago',6, 'Dollar', 'TTD', 'TT$'],
            [[39.0616029013,35.1689534649], 'Turkey',6, 'Lira', 'TRY', '₺'],
            [[48.9965667265,31.3832646865], 'Ukraine',6, 'Hryvnia', 'UAH', '₴'],
            [[54.1238715577,-2.86563164084], 'United Kingdom',6, 'Pound', 'GBP', '£'],
            [[45.6795472026,-112.4616737], 'United States',6, 'Dollar', 'USD', '$'],
            [[-32.7995153444,-56.0180705315], 'Uruguay',6, 'Peso', 'UYU', '$U'],
            [[41.7555422527,63.1400152805], 'Uzbekistan',6, 'Som', 'UZS', 'лв'],
            [[7.12422421273,-66.1818412311], 'Venezuela',6, 'Bolívar', 'VEF', 'Bs'],
            [[16.6460167019,106.299146978], 'Viet Nam',6, 'Dong', 'VND', '₫'],
            [[15.9092800505,47.5867618877], 'Yemen',6, 'Rial', 'YER', '﷼'],
            [[-19.0042041882,29.8514412019], 'Zimbabwe',6, 'Dollar', 'ZWD', 'Z$']
        ], function (countryLocale) {
            return underscore.object(['coordinates', 'country', 'zoom', 'currency', 'code', 'symbol'], countryLocale);
        }));

        Locale.validates({
            country: {
                required: true,
                length: {
                    min: 1,
                    max: 64
                }
            }
        });

        return Locale;
    }]);


