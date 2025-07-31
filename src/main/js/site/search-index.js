(function () {
  'use strict'

  const lunr = require('lunr');

  require('lunr-languages/lunr.stemmer.support')(lunr);
  require('lunr-languages/tinyseg')(lunr);
  require('lunr-languages/lunr.ko')(lunr);
  require('lunr-languages/lunr.multi')(lunr);

  const config = document.getElementById('search-ui-script')?.dataset || {}
  const siteRootPath = config.siteRootPath || ''

  const searchField = document.getElementById('search-field')
  const searchInput = document.getElementById('search-input')
  const searchResultContainer = document.createElement('div')
  searchResultContainer.classList.add('search-result-dropdown-menu')
  searchInput.parentNode.appendChild(searchResultContainer)
  const modifierKey = isMacClient() ? '⌘' : 'Ctrl'
  document.getElementById('search-input').placeholder = `Search…      (${modifierKey}K)`

  // Utils
  function highlight(text, term) {
    const re = new RegExp(term, 'gi')
    return text.replace(re,
      match => `<span class="search-result-highlight">${match}</span>`)
  }

  function createResultItem(doc, query) {
    const li = document.createElement('div')
    li.classList.add('search-result-item')

    const title = document.createElement('div')
    title.classList.add('search-result-document-title')
    title.innerHTML = highlight(doc.title, query)

    const snippet = document.createElement('div')
    snippet.classList.add('search-result-document-hit')
    const link = document.createElement('a')
    link.href = siteRootPath + doc.url

    let preview = '';
    const body = doc.body || '';
    const matchIndex = body.toLowerCase().indexOf(query)

    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - 40);
      const end = Math.min(body.length, matchIndex + query.length + 60);
      let snippet = body.replace(/\s+/g, ' ').slice(start, end).trim();

      if (snippet.length > 0) {
        snippet = highlight(snippet, query);
        const prefix = start > 0 ? '... ' : ''
        const suffix = end < body.length ? ' ...' : ''
        preview = prefix + snippet + suffix;
      }
    }

    if (!preview) {
      preview = body.replace(/\s+/g, ' ').slice(0, 100).trim()
      if (preview.length > 0) {
        preview += '...'
      } else {
        preview = '(No content preview available.)'
      }
    }

    link.innerHTML = preview
    snippet.appendChild(link)

    li.appendChild(title)
    li.appendChild(snippet)
    return li
  }

  function clearResults() {
    searchResultContainer.innerHTML = ''
    searchResultContainer.style.display = 'none'
  }

  function performSearch(index, docs, query) {
    clearResults()
    if (!query || query.length < 2) return
    try {
      const lowerCaseQuery = query.toLowerCase();
      const hits = index.search(lowerCaseQuery)
      if (!hits.length) {
        const empty = document.createElement('div')
        empty.classList.add('search-result-item')
        empty.innerText = `No results for "${query}"`
        searchResultContainer.appendChild(empty)
        searchResultContainer.style.display = 'block'
        return
      }
      hits.forEach(hit => {
        const doc = docs.find(d => d.id === hit.ref)
        if (doc) searchResultContainer.appendChild(
          createResultItem(doc, lowerCaseQuery))
      })
      searchResultContainer.style.display = 'block'
    } catch (e) {
      console.error('Search error:', e)
    }
  }

  function isMacClient() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }

  function enableSearch(indexData) {
    lunr.multiLanguage('en', 'ko')
    const idx = lunr.Index.load(indexData.index)
    const docs = indexData.documents

    searchInput.disabled = false
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim()
      performSearch(idx, docs, query)
    })
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') clearResults()
    })
    document.documentElement.addEventListener('click', clearResults)
    searchResultContainer.addEventListener('click', e => e.stopPropagation())
    searchInput.addEventListener('click', e => e.stopPropagation())
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dataset = document.querySelector('.search-result-dataset')
    if (!dataset) return;

    dataset.addEventListener('wheel', (e) => {
      const atTop = dataset.scrollTop === 0
      const atBottom = dataset.scrollHeight - dataset.scrollTop
        === dataset.clientHeight

      if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
        e.preventDefault() // Prevent page scroll when reaching top/bottom
      }
    }, { passive: false })
  });

  document.addEventListener('keydown', (e) => {
    const isMac = isMacClient()
    const isShortcut = (isMac && e.metaKey && e.key === 'k') || (!isMac && e.ctrlKey && e.key === 'k')

    if (isShortcut) {
      e.preventDefault();
      const input = document.getElementById('search-input')
      input?.focus();
    }
  })

  // Load index JSON
  fetch(siteRootPath + 'search/search-bundle.min.json')
  .then(res => res.json())
  .then(data => enableSearch(data))
  .catch(err => {
    console.warn('Search index not loaded or not available', err)
    if (searchField) {
      searchField.style.display = 'none'
    }
  })
})();
