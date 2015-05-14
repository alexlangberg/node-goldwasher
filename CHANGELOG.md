# 4.0.0 (2015-15-05)

## Features

- It is now possible to both use goldwasher for scraping and conversion of its own formats. Thus, the input can now be any of the following: html, xml, cheerio object, array of goldwasher items, goldwasher xml or even an RSS/Atom feed. The output can be either json, xml, atom or rss. Note that feeds do not contain the same amount of information as json or xml.
- The parameter "batch" has been added to the format. It contains a UUID that will be the same for all nuggets of a goldwasher batch.
- The parameter "source" has been added to the format. It contains the original URL of the scraped page.

## Breaking changes

- The flags for individual goldwasher format keys have been removed. You will thus always get full goldwasher formatted objects out. If you need to remove keys from them, do so afterwards.
- If upgrading from older versions, note that ```target``` has been renamed to the more proper ```selector``` and ```format``` to ```output```.