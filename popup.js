window.onload = function(){
  main();
  setupEvents();
};
function setupEvents() {
  document.getElementById("submitLink").addEventListener('click', submitCurrentTab, false);
  document.getElementById("refresh").addEventListener('click', refreshLinks, false);
  document.getElementById("options").addEventListener('click', openOptions, false);
  document.getElementById("searchbox").addEventListener('keydown', function(event) {
    if (event.which === 13) {
      search();
    }
  });
}
function main() {
  if (localStorage['HN.NumLinks'] == null) {
    buildPopupAfterResponse = true;
    UpdateFeed();
  }
  else {
    buildPopup(RetrieveLinksFromLocalStorage());
  }
}

function buildPopup(links) {
  var header = document.getElementById("header");
  var feed = document.getElementById("feed");
  var issueLink = document.getElementById("issues");
  issueLink.addEventListener("click", openLinkFront);

  //Setup Title Link
  var title = document.getElementById("title");
  title.addEventListener("click", openLink);
  
  //Setup search button
  var searchButton = document.getElementById("searchbutton");
  searchButton.addEventListener("click", search);

  for (var i=0; i<links.length; i++) {
    hnLink = links[i];
    var row = document.createElement("tr");
    row.className = "link";
    var num = document.createElement("td");
    num.innerText = i+1;
    var link_col = document.createElement("td")
    var title = document.createElement("a");
      title.className = "link_title";
      title.innerText = hnLink.Title;
      title.href = hnLink.Link;
      title.addEventListener("click", openLink);
    var comments = document.createElement("a");
      comments.className = "comments";
      comments.innerText = "(comments)";
      comments.href = hnLink.CommentsLink;
      comments.addEventListener("click", openLink);
    link_col.appendChild(title);
    link_col.appendChild(comments);
    row.appendChild(num);
    row.appendChild(link_col)
    feed.appendChild(row);
  }
  hideElement("spinner");
  showElement("container");
}

function search() {
  var searchBox = document.getElementById("searchbox");
  var keywords = searchBox.value;
  if (keywords.length > 0) {
    var search_url = "https://hn.algolia.com/?query=" + keywords.replace(" ", "+");
    openUrl(search_url, true);
  }
}

function refreshLinks() {
  var linkTable = document.getElementById("feed");
  while(linkTable.hasChildNodes()) linkTable.removeChild(linkTable.firstChild); //Remove all current links
  toggle("container");
  toggle("spinner");
  buildPopupAfterResponse = true;
  UpdateFeed();
  updateLastRefreshTime();
}


function updateLastRefreshTime() {
  localStorage["HN.LastRefresh"] = (new Date()).getTime();
}

//Submit the current tab
function submitCurrentTab() {
  console.log('submitCurrentTab!');
    chrome.tabs.query({
      active: true,
      currentWindow: true // no longer lastChangedWindow
  }).then(tabs => {
      var tab = tabs[0];
      console.log('tab', Object.keys(tab))
      var submit_url = "https://news.ycombinator.com/submitlink?u=" + encodeURIComponent(tab.url) + "&t=" + encodeURIComponent(tab.title);
      console.log('submit_url', submit_url)
      // setTimeout(() => { // just for testing
        openUrl(submit_url, true);
      // }, 3000); // just for testing
    });
}


/// ----------------- Helper Functions ----------------- ///


function RetrieveLinksFromLocalStorage() {
  var numLinks = localStorage["HN.NumLinks"];
  if (numLinks == null) {
    return null;
  }
  else {
    var links = new Array();
    for (var i=0; i<numLinks; i++) {
      links.push(JSON.parse(localStorage["HN.Link" + i]))
    }
    return links;
  }
}


function openLink(e) {
  e.preventDefault();
  openUrl(this.href, (localStorage['HN.BackgroundTabs'] == 'false'));
}

function openLinkFront(e) {
  e.preventDefault();
  openUrl(this.href, true);
}

// Show |url| in a new tab.
function openUrl(url, take_focus) {
  // Only allow http and https URLs.
  if (url.indexOf("http:") != 0 && url.indexOf("https:") != 0) {
    return;
  }
  chrome.tabs.create({url: url, selected: take_focus});
}
  

function hideElement(id) {
  var e = document.getElementById(id);
  e.style.display = 'none';
}

function showElement(id) {
  var e = document.getElementById(id);
  e.style.display = 'block';
}

function toggle(id) {
  var e = document.getElementById(id);
  if(e.style.display == 'block')
    e.style.display = 'none';
  else
    e.style.display = 'block';
}



function openOptions() {
  var optionsUrl = chrome.extension.getURL('options.html');
  chrome.tabs.create({url: optionsUrl});
}



function printTime(d) {
  var hour   = d.getHours();
  var minute = d.getMinutes();
  var ap = "AM";
  if (hour   > 11) { ap = "PM";             }
  if (hour   > 12) { hour = hour - 12;      }
  if (hour   == 0) { hour = 12;             }
  if (minute < 10) { minute = "0" + minute; }
  var timeString = hour +
          ':' +
          minute +
          " " +
          ap;
  return timeString;
}


// CORE.js

var maxFeedItems = 15;
var req;
var buildPopupAfterResponse = false;
var OnFeedSuccess = null;
var OnFeedFail = null;
var retryMilliseconds = 60000;

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
