# wikidata-altLabels
Small WikiData user interface enhancement.
This tool will add the 3 most common labels used in other languages below
the label's edit box in your language. A simple click will approve the
selected label for the current item.
If the item already has a label in your language nothing is changed.
This is especially helpful for names of places or people which are similar
in many languages.

# How To use:
Add the following to your
[common.js](https://www.wikidata.org/wiki/Special:MyPage/common.js):
```
importScript( 'User:Joern/altLabels.js' );
```

# Links:
 * https://www.wikidata.org/wiki/User:Joern/altLabels.js
 * https://github.com/joernhees/wikidata-altLabels
 * Top items without labels:
   [[http://tools.wmflabs.org/wikidata-terminator/?list&lang=de&mode=t1000]]

# Bug Reports, Feature Requests, Development:
Feel free to report bugs or even pull requests here on github.
For testing purposes you can also run the latest development version by adding
the following to your
[common.js](https://www.wikidata.org/wiki/Special:MyPage/common.js)
instead of the above `importScript(...);`:
```
mw.loader.load('//joernhees.github.io/wikidata-altLabels/altLabels.js');
```
