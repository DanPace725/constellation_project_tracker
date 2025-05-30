// script.js

// -- Configuration --
const GOOGLE_SHEETS_ID = 'YOUR_GOOGLE_SHEETS_ID_HERE';
const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:json`;

let allProjects = [];
let currentFilter = 'all';

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  setupFilterButtons();
});

// Fetch and load projects
async function loadProjects() {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL);
    const text = await response.text();
    const jsonString = text.substring(47).slice(0, -2);
    const data = JSON.parse(jsonString);

    allProjects = parseProjects(data);
    displayProjects(allProjects);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('projects').style.display = 'grid';
  } catch (error) {
    console.error('Error loading projects:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
  }
}

// Turn raw sheet data into project objects
function parseProjects(data) {
  const projects = [];
  if (data.table && data.table.rows) {
    for (let i = 1; i < data.table.rows.length; i++) {
      const row = data.table.rows[i];
      if (!row.c || !row.c[1] || !row.c[1].v) continue;

      const project = {
        timestamp: row.c[0] ? row.c[0].f : '',
        name: row.c[1].v,
        type: row.c[2] ? row.c[2].v : 'Other',
        status: row.c[3] ? row.c[3].v : 'Just Started',
        description: row.c[4] ? row.c[4].v : '',
        startDate: row.c[5] ? row.c[5].f : '',
        docs: row.c[6] && row.c[6].v
          ? row.c[6].v.split(',').map(s => s.trim())
          : []
      };
      projects.push(project);
    }
  }
  return projects;
}

// Render project cards
function displayProjects(projects) {
  const container = document.getElementById('projects');
  if (projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #9ca3af;">
        No projects yet. <a href="YOUR_GOOGLE_FORM_URL_HERE" style="color: #3b82f6;">Add your first project!</a>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(project => {
    const docsHtml = project.docs.length
      ? `<div class="project-docs">
           <strong>Docs:</strong>
           ${project.docs.map(url =>
             `<a href="${url}" target="_blank">🔗 ${url}</a>`
           ).join('<br/>')}
         </div>`
      : '';

    return `
      <div class="project-card">
        <div class="project-title">${escapeHtml(project.name)}</div>
        <div class="project-meta">
          <span class="project-type type-${slugify(project.type)}">${escapeHtml(project.type)}</span>
          <span class="project-status status-${slugify(project.status)}">${escapeHtml(project.status)}</span>
        </div>
        ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}
        ${project.startDate ? `<div class="project-start">Started: ${escapeHtml(project.startDate)}</div>` : ''}
        ${docsHtml}
      </div>
    `;
  }).join('');
}

// Filtering controls
function setupFilterButtons() {
  document.querySelectorAll('.btn-filter').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      currentFilter = filter;
      if (filter === 'all') displayProjects(allProjects);
      else displayProjects(allProjects.filter(p => p.status === filter));
    });
  });
}

// Helpers
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
