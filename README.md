# node-goldwasher
[![Build Status](https://travis-ci.org/alexlangberg/node-goldwasher.svg?branch=master)](https://travis-ci.org/alexlangberg/node-goldwasher)
[![Coverage Status](https://coveralls.io/repos/alexlangberg/node-goldwasher/badge.png?branch=master)](https://coveralls.io/r/alexlangberg/node-goldwasher?branch=master)
[![Code Climate](https://codeclimate.com/github/alexlangberg/node-goldwasher.png)](https://codeclimate.com/github/alexlangberg/node-goldwasher)
[![Dependency Status](https://david-dm.org/alexlangberg/node-goldwasher.svg)](https://david-dm.org/alexlangberg/node-goldwasher)
[![devDependency Status](https://david-dm.org/alexlangberg/node-goldwasher/dev-status.svg)](https://david-dm.org/alexlangberg/node-goldwasher#info=devDependencies)

The purpose module is to extract text information from HTML, usually a website, which will often have to be sanitized and filtered to be useful. This module takes a pile of HTML and washes out the parts you need as small, golden nuggets of text and related metadata.

It works by passing it the targets (html tags) from which the text should be extracted, along with either pure HTML as a string (e.g. from [request](https://www.npmjs.org/package/request)) or a [cheerio](https://www.npmjs.org/package/cheerio) object. It will then return an array of nuggets (objects) of information - one per recognized tag. For each nugget, it will try to:

1. Get the text of the tag and sanitize it, e.g. remove newlines.
2. Optionally discard the nugget, if it matches an array of stop texts.
3. Get the exact time of processing.
4. Extract a count of each word in the text as keywords.
5. Optionally discard keywords that match an array of stop words.
6. Optionally discard keywords that match an external array of keywords (see the folder stop_words).
7. Extract the nearest URL of the closest link.
8. Extract the tag type of the matched target.
9. Index all nuggets in the order they were found.

The returned nuggets include the object properties:

- ```timestamp``` - the exact time the tag was processed.
- ```text``` - a sanitized version of the text of the tag.
- ```keywords``` - a count of each word in the text, special characters removed.
- ```href``` - the closest link, the first that matches one of:
  1. Is the tag itself a link?
  2. Does the tag have a child node that is a link?
  3. Is there a link if we traverse up the DOM tree?
- ```tag``` - the type of tag that was processed.
- ```index``` - the index of the object, indicating the order in which tags were found.

## Installation
```
npm install goldwasher
```

## Options
- ```targets``` - jquery/cheerio selection of target tags.
- ```url``` - base url of links, for sites that use relative urls.
- ```filterTexts``` - stop texts that should be excluded.
- ```filterKeywords``` - stop words that should be excluded as keywords.
- ```filterLocale``` - stop words from external json file (see the folder stop_words)

## Example
```javascript
var goldwasher = require('goldwasher');

var html = '<a href="/oak/strong"><h1>Oak is strong and also gives shade.</h1></a>';
    html += '<h2><a href="http://www.catsanddogs.com/hate">Cats and dogs each hate the other.</a></h2>';

var options = {
  targets: 'h1, h2',
  url: 'http://www.oakisstrong.com',
  filterTexts: ['Some unwanted text'],
  filterLocale: 'en',
  filterKeywords: ['also']
}

var result = goldwasher(options, html);

/* result:
[ 
  { 
    timestamp: 1402847736380,
    text: 'Oak is strong and also gives shade.',
    keywords: { oak: 1, strong: 1, gives: 1, shade: 1 },
    href: 'http://www.oakisstrong.com/oak/strong',
    tag: 'h1',
    index: 0 
   },
  { 
    timestamp: 1402847736381,
    text: 'Cats and dogs each hate the other.',
    keywords: { cats: 1, dogs: 1, hate: 1 },
    href: 'http://www.catsanddogs.com/hate',
    tag: 'h2',
    index: 1 
  }
]
*/
```