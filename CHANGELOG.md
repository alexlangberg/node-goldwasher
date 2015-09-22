# 5.1.0 (2015-09-22)

## New features

- New ```contractAdjecent``` option to contract adjecent targets. See readme.

- When finding nearest href, it will not only look at children but all other successors.

# 5.0.0 (2015-05-21)

## Breaking changes

- To avoid the heavy iconv module, input support for feeds and goldwasher xml has been dropped. These were both very rare use cases and the native compilation required for iconv was both error prone and not very lightweight. The option to output to either XML or feeds is still available.

- The XML output format has changed. Keywords will now be correctly put inside a ```<keywords>``` element.


# 4.1.2 (2015-05-17)

## Bugfixes

-- Replace dashes (-) with spaces.

# 4.1.1 (2015-05-17)

## Bugfixes

-- Now preserves numbers in texts.

# 4.1.0 (2015-05-17)

## Features

- No longer uses slugification. This resulted in the removal of characters not present in the English alphabet, such as scandinavian, greek, russian etc. These are now preserved.

# 4.0.0 (2015-05-16)

## Features

- It is now possible to both use goldwasher for scraping and conversion of its own formats. Thus, the input can now be any of the following: HTML, XML, cheerio object, array of goldwasher items, goldwasher XML or even an RSS/Atom feed. The output can be either JSON, XML, Atom or RSS. Note that feeds do not contain the same amount of information as JSON or XML.
- The parameter "batch" has been added to the format. It contains a UUID that will be the same for all nuggets of a goldwasher batch.
- The parameter "source" has been added to the format. It contains the original URL of the scraped page.

## Breaking changes

- The flags for individual goldwasher format keys have been removed. You will thus always get full goldwasher formatted objects out. If you need to remove keys from them, do so afterwards.
- If upgrading from older versions, note that ```target``` has been renamed to the more proper ```selector``` and ```format``` to ```output```.