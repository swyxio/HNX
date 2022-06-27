console.log('hello from HNX extension');


// - loading js files (i gave up)
//   - https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
//   - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources
// import {load} from './injectedUI/index.js'

// load()

// (async () => {
//   const src = chrome.runtime.getURL('injectedUI/index.js');
//   console.log('src', src);
//   const contentMain = await import(src);
//   contentMain.load();
// })();




const rtf = new Intl.RelativeTimeFormat("en", {
  localeMatcher: "best fit", // other values: "lookup"
  numeric: "always", // other values: "auto"
  style: "long", // other values: "short" or "narrow"
});
function getDifferenceInDays(fromDate, toDate) {
  const diff =  Math.floor((fromDate - toDate) / (1000 * 60 * 60 * 24));
  return rtf.format(diff, "day");
}



if (location.pathname === '/submitlink') {
  const anchor = document.createElement('div')
  anchor.id = 'hnx-anchor'
  document.getElementById('hnmain').parentElement.append(anchor)

  // parse
  var abc = new URL(location)
  var submittedURL = abc.searchParams.get('u')
  // https://hn.algolia.com/api
  // https%3A%2F%2Fhn.algolia.com%2Fapi&sort=byPopularity&type=story
  // https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=
  fetch('https://hn.algolia.com/api/v1/search_by_date?query=' + encodeURIComponent(submittedURL))
  .then(res => res.json())
  .then(res => console.log(res) || res)
  .then(({hits}) => {
    if (hits.length) {
      anchor.append(document.createElement('hr'))
      // create h1 element with text "hi"
      const h1 = document.createElement('h1')
      h1.innerText = hits.length + ' previous results found:'
      anchor.append(h1); 
      anchor.append(document.createElement('br'))
      const ul = document.createElement('ul')
      anchor.append(ul)
      // display
      hits.forEach(({title, comment_text, points, objectID, author, created_at}) => {
        const li = document.createElement('li')
        ul.appendChild(li)
        li.style = 'text-align: left'
        const a = document.createElement('a')
        a.href = `https://news.ycombinator.com/item?id=${objectID}`
        const datediff = getDifferenceInDays(new Date(created_at), new Date())
        a.innerHTML = `${datediff}`
        li.appendChild(a)
        const span = document.createElement('span')
        span.innerHTML = ` [${author}${points ? `, ${points}pts` : ''}]: ${title || comment_text}`
        li.appendChild(span)
      })
    } else {
      // display
      anchor.append('no previous submissions found');
    }
  })


}