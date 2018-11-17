# Master Lists

## Enterprise Types

This can be considerd enterprise master list.

Suggest that this list is replaced with ```commodities.csv```

## Commodities

As above.

Rule of thumb for commodities:

| Commodity Type | Description |
| --- | --- | 
| Crop | Is a seasonal plant |
| Fruit & Nuts | Permanent crops with carry fruit and have a stem or are shrubs |
| Vegetables | Are seasonal fruits and tubers |
| Pastures | Crops used for grazing or feed |
| Plantations | Permanent crops where the whole plant material is harvested |
| Livestock | All forms of animals |
| Horticulture | Flowers and nurseries |

## Land Cover Classes

This is a list of unique land covers that ideally can be identified using satellite imagery.

## Enterprises

This lists all enterprises that are used for financial planning. Enterprises link back to the ```enterprises.csv``` list

Each enterprise is also associated with one or more land cover classes to allow users to select applicable budgets.

## Budget Blueprints

This list containes all published budgets. Ideally this should match ```entperprises.csv```.

## References

[List of Alternative Crops and Enterprises for Small Farm Diversification](https://www.nal.usda.gov/afsic/list-alternative-crops-and-enterprises-small-farm-diversification)

[Alternative Crop Suitability Maps](http://www.isws.illinois.edu/data/altcrops/cropreq.asp?pid=&Suit=&suitVal=&ordrBy=&fp=croplist&letter=C&nmeType=cmn&c=&QStr=pid%3D%26Suit%3D%26suitVal%3D%26ordrBy%3D%26fp%3Dcroplist%26letter%3DC%26nmeType%3Dcmn%26c%3D%26QStr%3Dcrop%253D964%2526fp%253Dcroplist%2526letter%253DC%2526nmeType%253Dcmn%26mapselect%gd3Do%26submit%3DSubmit%26crop%3D964&mapselect=gd&submit=Submit&crop=964&m=met)

[Understanding citrus](http://www.farmersweekly.co.za/farm-basics/how-to-crop-production/understanding-citrus-2/)

## OpenRefine Reconcile

# Starting the Server

To start the reconciliation server download the jar file above, then start it with:

```bash
java -Xmx2g -jar reconcile-csv-0.1.2.jar <CSV-File> <Search Column> <ID Column>
```

Example:

```bash
java -Xmx2g -jar tools/reconcile-csv-0.1.2.jar data/Agrista/portfolios.csv name uuid
```

**CSV-File** is the csv file you will use as a basis of reconciliation. As stated above preferably the cleaner, more complete or trusted one. You will introduce the unique IDs from that file to the other file.

**Search Column** is the primary column you want to use for matching. E.g. you want to match facilities with names spelled slightly differently - this would be the column to add here.

**ID Column** is the column containing unique ids for the facilities - if you don’t have one: generate one.

# Reconciling in OpenRefine

Start OpenRefine and load the dataset, where you want to introduce the unique-ids from the other dataset. Select the column options for the column containing the primary names for matching. this should be the same information than the search column (e.g. if you specified a column of facility names in the search, pick the column containing facility names).

In the options select “Reconcile” and “Start Reconciling”. Add a standard reconciliation service pointing to http://localhost:8000/reconcile. The service will offer you to add additional columns as parameters - if you e.g. also have city names, you could add them and specify the column name containing city names in the other CSV file.

Start the reconciliation - depending on the size of your datasets this might take a while. Fuzzy-matching is no easy feat, and each row in one dataset has to be compared to each row in another dataset.

When done OpenRefine will show you a facet that allows you to select the score the entries got. Reconcile-csv uses a fuzzy-matching algorithm called dice that returns the likelyhood the two compared entries are the same: if it’s 1 it means it’s exactly the same and is automatically matched up.

Look at your results often matches with very high scores (e.g. >0.85) can be automatically matched to the highest scoring entry using the “action” submeny in the reconciliation menu. For the others, go through manually, if you like the link, click the check-mark.

Reconcile-csv also supports searching for matches, if e.g. a match can’t be found but you happen to know the name of the facility in the other dataset, you can click on “search for more” and enter the search term, hovering over an entry will show you additional information to the term, clicking will assign the match.

Once you found all the matches you can find- create the unique id column. Do this by selecting “edit column -> add column based on this column” from the options of the column where you did your matching. Now give the column a name (the same as in the other spreadsheet helps increadibly) and use the expression

```bash
cell.recon.match.id
```

to get the IDs for the matches.

Now you can join the datasets using the unique ids