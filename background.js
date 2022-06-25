// main code

var firstRequest = true;
async function startRequest() {
  await UpdateIfReady(firstRequest);
  firstRequest = false;
  setTimeout(startRequest, 60000);
}
//If any options are not already set, they will be set to defaults here
SetInitialOption("HN.RequestInterval", 1200000);
SetInitialOption("HN.BackgroundTabs", false);

startRequest();

// CORE.js

var maxFeedItems = 15;
var req;
var buildPopupAfterResponse = false;
var OnFeedSuccess = null;
var OnFeedFail = null;
var retryMilliseconds = 120000;

function SetInitialOption(key, value) {
  chrome.storage.local.get([key], function(result) {
    if (result == null) {
      chrome.storage.local.set({[key]: value}, function() {
        console.log(`Value ${key} is initialized to ` + value);
      });
    }
  });
}

async function localStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function(result) {
      resolve(result[key]);
    });
  });
}
async function setLocalStorage(key, val) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({[key]: val}, resolve);
  });
}

async function UpdateIfReady(force) {
  var lastRefresh = parseFloat(await localStorage("HN.LastRefresh"));
  var interval = parseFloat(await localStorage("HN.RequestInterval"));
  var nextRefresh = lastRefresh + interval;
  var curTime = parseFloat((new Date()).getTime());
  var isReady = (curTime > nextRefresh);
  var isNull = (await localStorage("HN.LastRefresh") == null);
  if ((force == true) || (await localStorage("HN.LastRefresh") == null)) {
    await UpdateFeed();
  }
  else {
    if (isReady) {
      await UpdateFeed();
    }
  }
}

async function UpdateFeed() {
  return fetch('https://news.ycombinator.com/rss')
  .then(response => response.text())
  .then(text => onRssSuccess(text))
  .catch(error => onRssError(error));
  // var xhr = new XMLHttpRequest();
  // xhr.open('GET', );
  // xhr.onload = await (async function() {
  //   if (xhr.status === 200) {
  //     await onRssSuccess(xhr.responseText);
  //   }
  //   else {
  //     await onRssError();
  //   }
  // }());
  // xhr.send();
}

async function onRssSuccess(doc) {
  console.log('doc', doc);
  if (!doc) {
    handleFeedParsingFailed("Not a valid feed.");
    return;
  }
  links = parseHNLinks(doc);
  await SaveLinksToLocalStorage(links);
  if (buildPopupAfterResponse == true) {
    buildPopup(links);
    buildPopupAfterResponse = false;
  }
  return setLocalStorage("HN.LastRefresh", new Date().getTime());
}

// function updateLastRefreshTime() {
//   localStorage["HN.LastRefresh"] = (new Date()).getTime();
// }

async function onRssError(xhr, type, error) {
  return handleFeedParsingFailed('Failed to fetch RSS feed.');
}

async function handleFeedParsingFailed(error) {
  //var feed = document.getElementById("feed");
  //feed.className = "error"
  //feed.innerText = "Error: " + error;
  const newthing = (await localStorage("HN.LastRefresh")) + retryMilliseconds;
  return setLocalStorage("HN.LastRefresh", newthing);
}

function parseXml(xml) {
  var xmlDoc;
  try {
    xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = false;
    xmlDoc.loadXML(xml);
  } 
  catch (e) {
    xmlDoc = (new DOMParser).parseFromString(xml, 'text/xml');
  }

  return xmlDoc;
}

function parseHNLinks(rawXmlStr) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(rawXmlStr, "text/xml");
  var entries = doc.getElementsByTagName('entry');
  if (entries.length == 0) {
    entries = doc.getElementsByTagName('item');
  }
  var count = Math.min(entries.length, maxFeedItems);
  var links = new Array();
  for (var i=0; i< count; i++) {
    item = entries.item(i);
    var hnLink = new Object();
    //Grab the title
    var itemTitle = item.getElementsByTagName('title')[0];
    if (itemTitle) {
      hnLink.Title = itemTitle.textContent;
    } else {
      hnLink.Title = "Unknown Title";
    }
    
    //Grab the Link
    var itemLink = item.getElementsByTagName('link')[0];
    if (!itemLink) {
      itemLink = item.getElementsByTagName('comments')[0];
    }
    if (itemLink) {
      hnLink.Link = itemLink.textContent;
    } else {
      hnLink.Link = '';
    }

    //Grab the comments link
    var commentsLink = item.getElementsByTagName('comments')[0];
    if (commentsLink) {
      hnLink.CommentsLink = commentsLink.textContent;
    } else {
      hnLink.CommentsLink = '';
    }
    
    links.push(hnLink);
  }
  return links;
}

async function SaveLinksToLocalStorage(links) {
  await setLocalStorage("HN.NumLinks", links.length);
  for (var i=0; i<links.length; i++) {
    await setLocalStorage("HN.Link" + i, JSON.stringify(links[i]));
  }
}
