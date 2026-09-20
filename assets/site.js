(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const publications = document.getElementById('publication-groups');
  const papers = [...publications.querySelectorAll('.pub-list > li')].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
  const areas = JSON.parse(document.getElementById('research-data').textContent);
  const byId = new Map(papers.map(paper => [paper.id, paper]));
  const search = document.getElementById('paper-search');
  const year = document.getElementById('year-filter');
  const status = document.getElementById('result-status');
  const empty = document.getElementById('empty-state');
  const filters = [...document.querySelectorAll('[data-area-filter]')];
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  let area = 'all';
  let view = 'research';
  const normalize = text => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'");
  const searchable = new Map(papers.map(paper => [paper, normalize(paper.textContent)]));
  function render() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const visible = papers.filter(paper => (area === 'all' || paper.dataset.area === area) &&
      (!year.value || paper.dataset.year === year.value) && terms.every(term => searchable.get(paper).includes(term)));
    const groups = view === 'research'
      ? areas.map(item => ({id: 'papers-' + item.id, title: item.title, papers: visible.filter(p => p.dataset.area === item.id)}))
      : [...new Set(papers.map(p => p.dataset.year))].sort((a,b) => b-a).map(y => ({id: 'publications-' + y, title:y, papers:visible.filter(p => p.dataset.year === y)}));
    const fragment = document.createDocumentFragment();
    groups.filter(group => group.papers.length).forEach(group => {
      const section = document.createElement('section');
      section.className = 'publication-group'; section.id = group.id;
      const header = document.createElement('header'); header.className = 'group-heading';
      const heading = document.createElement('h3'); heading.textContent = group.title;
      const count = document.createElement('span'); count.textContent = `${group.papers.length} ${group.papers.length === 1 ? 'paper' : 'papers'}`;
      header.append(heading,count);
      const list = document.createElement('ul'); list.className = 'pub-list';
      group.papers.forEach(paper => list.append(paper));
      section.append(header,list); fragment.append(section);
    });
    publications.replaceChildren(fragment);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.areaFilter === area)));
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    status.textContent = `Showing ${visible.length} of ${papers.length} papers`;
    empty.hidden = visible.length > 0;
    document.getElementById('reset-filters').hidden = area === 'all' && !year.value && !search.value;
  }
  function clearFilters() {area = 'all';year.value = '';search.value = '';render();}
  filters.forEach(button => button.addEventListener('click', () => {area = button.dataset.areaFilter;render();}));
  viewButtons.forEach(button => button.addEventListener('click', () => {view = button.dataset.view;render();}));
  search.addEventListener('input', render);year.addEventListener('change', render);
  document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', clearFilters));
  document.querySelectorAll('[data-research-link]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();area = link.dataset.researchLink;year.value = '';search.value = '';view = 'research';render();
    history.replaceState(null, '', '#publications');document.getElementById('publications').scrollIntoView({behavior:'auto'});
  }));
  function handleHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId.has(id)) {
      const paper = byId.get(id);
      if (!paper.isConnected) clearFilters();
      requestAnimationFrame(() => paper.scrollIntoView({behavior:'auto',block:'start'}));
    } else if (/^publications-\d{4}$/.test(id)) {
      clearFilters();view = 'year';render();
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({behavior:'auto'}));
    }
  }
  document.querySelectorAll('a[href^="#pub-"]').forEach(link => link.addEventListener('click', () => {
    const paper = byId.get(link.hash.slice(1));
    if (paper && !paper.isConnected) clearFilters();
    if (location.hash === link.hash) requestAnimationFrame(handleHash);
  }));
  window.addEventListener('hashchange', handleHash);
  const navLinks = [...document.querySelectorAll('.sidebar-nav a')];
  const sections = navLinks.map(link => document.querySelector(link.hash)).filter(Boolean);
  let navigationFrame = 0;
  function updateNavigation() {
    navigationFrame = 0;
    const threshold = Math.min(160, innerHeight * .25);
    const current = sections.filter(section => section.getBoundingClientRect().top <= threshold).pop() || sections[0];
    navLinks.forEach(link => {
      const active = link.hash === '#' + current.id;
      link.classList.toggle('active', active);
      if(active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {if(!navigationFrame) navigationFrame=requestAnimationFrame(updateNavigation);}, {passive:true});
  window.addEventListener('resize', updateNavigation);
  window.addEventListener('beforeprint', () => document.querySelectorAll('details').forEach(detail => {detail.dataset.printOpen=String(detail.open);detail.open=true;}));
  window.addEventListener('afterprint', () => document.querySelectorAll('details').forEach(detail => {detail.open=detail.dataset.printOpen==='true';}));
  render();handleHash();updateNavigation();
})();
