# node-goldwasher
[![Build Status](http://img.shields.io/travis/alexlangberg/node-goldwasher.svg)](https://travis-ci.org/alexlangberg/node-goldwasher)
[![Coverage Status](http://img.shields.io/coveralls/alexlangberg/node-goldwasher.svg)](https://coveralls.io/r/alexlangberg/node-goldwasher?branch=master)
[![Code Climate](http://img.shields.io/codeclimate/github/alexlangberg/node-goldwasher.svg)](https://codeclimate.com/github/alexlangberg/node-goldwasher)
[![Dependency Status](https://david-dm.org/alexlangberg/node-goldwasher.svg)](https://david-dm.org/alexlangberg/node-goldwasher)
[![devDependency Status](https://david-dm.org/alexlangberg/node-goldwasher/dev-status.svg)](https://david-dm.org/alexlangberg/node-goldwasher#info=devDependencies)
[![npm version](http://img.shields.io/npm/v/goldwasher.svg)](https://www.npmjs.org/package/goldwasher)

**NOTE:** Version 3 has been a complete rewrite. UUIDs have been added and all parts can be selectively turned off by passing e.g. ```href: false``` as an option. The only breaking change should be that you have to switch the html and options parameters and rename the ```targets``` parameter to ```selector```.

The purpose module is to extract text information from HTML, usually a website, which will often have to be sanitized and filtered to be useful. This module takes a pile of HTML and washes out the parts you need as small, golden nuggets of text and related metadata, the default options referred to as "goldwasher format":

JSON format (see additional formats in the bottom):
```javascript
{ 
    timestamp: 1402847736380,
    text: "Oak is strong and also gives shade.",
    keywords: [ 
        {word: "oak", count: 1}, 
        {word: "strong", count: 1}, 
        {word: "gives", count: 1}, 
        {word: "shade", count: 1}
    ],
    href: "http://www.oakisstrong.com/oak/strong",
    tag: "h1",
    position: 0,
    total: 2,
    uuid: "808b7490-f743-11e4-90b2-df723554e9be"
}
```

It works by passing it either pure HTML as a string (e.g. from [request](https://www.npmjs.org/package/request)) or a [cheerio](https://www.npmjs.org/package/cheerio) object, usually along with a [cheerio](https://www.npmjs.org/package/cheerio) (jQuery) selector (html tags) from which the text should be extracted, along with other options. It will then return an array of nuggets (objects) of information - one per recognized tag. For each nugget, it will try to:

1. Get the text of the tag and sanitize it, e.g. remove newlines.
2. Optionally discard the nugget, if it matches an array of stop texts.
3. Get the exact time of processing.
4. Extract a count of each word in the text as keywords.
5. Optionally discard keywords that match an array of stop words.
6. Optionally discard keywords that match an external array of keywords (see the folder stop_words).
7. Extract the nearest URL of the closest link.
8. Extract the tag type of the matched target.
9. Assign a unique identifier (UUID V1).
10. Index the nugget position in the order it was found found.
11. Add the total nugget count.

The returned nuggets include the object properties:

- ```timestamp``` - the exact time the tag was processed.
- ```text``` - a sanitized version of the text of the tag.
- ```keywords``` - a count of each word in the text, special characters removed.
- ```href``` - the closest link, the first that matches one of:
  1. Is the tag itself a link?
  2. Does the tag have a child node that is a link?
  3. Is there a link if we traverse up the DOM tree?
  4. Is there an adjecent (sibling) link?
- ```tag``` - the type of tag that was processed.
- ```position``` - the position of the object, indicating the order in which tags were found. 0-based.
- ```total``` - total number of nuggets in relation to the position. 1-based.
- ```uuid``` - a unique identifier (UUID V1).

## Installation
```
npm install goldwasher
```

## Options
- ```selector``` - cheerio (jQuery) selector, a selection of target tags.
- ```search``` - only pick results containing these terms. Not case or special character sensitive (sluggified search).
- ```limit``` - limit number of results.
- ```url``` - base url of links, for sites that use relative urls.
- ```filterTexts``` - stop texts that should be excluded.
- ```filterKeywords``` - stop words that should be excluded as keywords.
- ```filterLocale``` - stop words from external json file (see the folder stop_words).
- ```format``` - output format (```json``` or ```xml```).
- The rest can be selectively turned off by passing e.g. ```href: false```.

## Example
```javascript
var goldwasher = require('goldwasher');

var html = '<a href="/oak/strong"><h1>Oak is strong and also gives shade.</h1></a>';
    html += '<h2><a href="http://www.catsanddogs.com/hate">Cats and dogs each hate the other.</a></h2>';
    html += '<h2>Some unwanted text.</h2>';

var options = {
  selector: 'h1, h2',
  url: 'http://www.oakisstrong.com',
  filterTexts: ['Some unwanted text.'],
  filterLocale: 'en',
  filterKeywords: ['also']
}

var result = goldwasher(html, options);

/* result:
[ 
  { 
    timestamp: 1402847736380,
    text: "Oak is strong and also gives shade.",
    keywords: [ 
        {word: "oak", count: 1}, 
        {word: "strong", count: 1}, 
        {word: "gives", count: 1}, 
        {word: "shade", count: 1}
    ],
    href: "http://www.oakisstrong.com/oak/strong",
    tag: "h1",
    position: 0,
    total: 2,
    uuid: "808b7490-f743-11e4-90b2-df723554e9be"
   },
  { 
    timestamp: 1402847736381,
    text: "Cats and dogs each hate the other.",
    keywords: [ 
        {word: "cats", count: 1}, 
        {word: "dogs", count: 1}, 
        {word: "hate", count: 1} 
    ],
    href: "http://www.catsanddogs.com/hate",
    tag: "h2",
    position: 1,
    total: 2,
    uuid: "a48fbb30-f743-11e4-96e6-7b423a412011"
  }
]
*/
```

## Formats
**JSON:**
```javascript
{ 
    timestamp: 1402847736380,
    text: "Oak is strong and also gives shade.",
    keywords: [ 
        {word: "oak", count: 1}, 
        {word: "strong", count: 1}, 
        {word: "gives", count: 1}, 
        {word: "shade", count: 1}
    ],
    href: "http://www.oakisstrong.com/oak/strong",
    tag: "h1",
    position: 0,
    total: 2,
    uuid: "808b7490-f743-11e4-90b2-df723554e9be"
}
```

**XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<goldwasher>
    <nugget>
        <href>/oak/strong</href>
        <tag>h1</tag>
        <text>Oak is strong and also gives shade.</text>
        <position>0</position>
        <timestamp>1431296135800</timestamp>
        <uuid>14eefda0-f762-11e4-a0b3-d5647c4f7651</uuid>
        <total>3</total>
        <keyword>
            <word>oak</word>
            <count>1</count>
        </keyword>
        <keyword>
            <word>is</word>
            <count>1</count>
        </keyword>
        <keyword>
            <word>strong</word>
            <count>1</count>
        </keyword>
        <keyword>
            <word>and</word>
            <count>1</count>
        </keyword>
        <keyword>
            <word>also</word>
            <count>1</count>
        </keyword>
        <keyword>
            <word>gives</word>
            <count>1</count>
        </keyword>
        <keyword>
            <word>shade</word>
            <count>1</count>
        </keyword>
    </nugget>
<goldwasher>
```