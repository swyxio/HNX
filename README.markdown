## Hacker News Extended

This is an extension for Google Chrome that:

- displays the latest links from Y Combinator's [Hacker News](https://news.ycombinator.com)
- Offers a link for submitting the url of the current tab.
- shows previous results when submitting in case someone recently submitted

![https://pbs.twimg.com/media/FWO1kRkXoAMsBwE?format=jpg&name=4096x4096](https://pbs.twimg.com/media/FWO1kRkXoAMsBwE?format=jpg&name=4096x4096)

## Usage instructions

This extension has not yet been published. To use this you'll have to:

- clone this repo
- open `chrome://extensions/` and enable Developer mode
- "Load unpacked" and open the folder that contains this repo

enjoy!

## See also

My other fave extension: https://github.com/sw-yx/Twitter-Links-beta

## Acknowledgements

The starter code for this extension came from https://chrome.google.com/webstore/detail/hacker-news/geancnifhbkbjijfkcjjdnfemppmcjmk

Migrated to v3 with https://blog.shahednasser.com/chrome-extension-tutorial-migrating-to-manifest-v3-from-v2/#from-background-scripts-to-service-workers

other helpful:

- https://developer.chrome.com/docs/extensions/mv3/content_scripts/
- https://stackoverflow.com/questions/9444926/chrome-extension-in-tabs-doc-dont-exist-this-chrome-tabs-getselected-but-i-s
- https://groups.google.com/a/chromium.org/g/chromium-extensions/c/gywzLNsOMVI?pli=1
- loading js files (i gave up)
  - https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources
- lastChangedWindow -> currentWindow