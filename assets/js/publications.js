async function loadPublications() {
    const publicationsList = document.getElementById('publications-list');
    const grantsList = document.getElementById('grants-list');

    try {
        const response = await fetch('../data/publications.bib');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bibText = await response.text();
        
        // Initialize parser
        const parser = new BibtexParser();
        parser.setInput(bibText);
        parser.bibtex();
        const entries = parser.getEntries();
        
        // Sort entries by year in descending order
        const sortedEntries = Object.values(entries).sort((a, b) => {
            return parseInt(b.year || b.entryTags?.year || 0) - parseInt(a.year || a.entryTags?.year || 0);
        });

        // Group entries by type
        const publications = sortedEntries.filter(entry => 
            (entry.type || entry.entryType) !== 'grant'
        );
        const grants = sortedEntries.filter(entry => 
            (entry.type || entry.entryType) === 'grant'
        );

        // Display publications
        if (publicationsList) {
            displayPublications(publications);
        }
        
        // Display grants
        if (grantsList && grants.length > 0) {
            displayGrants(grants);
        }
    } catch (error) {
        console.error('Error loading publications:', error);
        if (publicationsList) {
            publicationsList.innerHTML = '<div class="error-message">Error loading publications. Please try again later.</div>';
        }
        if (grantsList) {
            grantsList.innerHTML = '';
        }
    }
}

function displayPublications(publications) {
    const container = document.getElementById('publications-list');
    if (!container) return;

    // Group publications by year
    const byYear = publications.reduce((acc, pub) => {
        const year = pub.year || pub.entryTags?.year || 'Unknown';
        if (!acc[year]) acc[year] = [];
        acc[year].push(pub);
        return acc;
    }, {});

    // Create HTML for each year
    const html = Object.entries(byYear)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([year, pubs]) => `
            <div class="year-section">
                <h3>${year}</h3>
                <ul class="alt">
                    ${pubs.map(pub => createPublicationHTML(pub)).join('')}
                </ul>
            </div>
        `).join('');

    container.innerHTML = html || '<p>No publications available.</p>';
}

function displayGrants(grants) {
    const container = document.getElementById('grants-list');
    if (!container) return;

    const html = `
        <ul class="alt">
            ${grants.map(grant => createGrantHTML(grant)).join('')}
        </ul>
    `;

    container.innerHTML = html || '<p>No grants available.</p>';
}

function createPublicationHTML(pub) {
    const entryTags = pub.entryTags || pub;
    const authors = formatAuthors(entryTags.author);
    const title = (entryTags.title || '').replace(/[{}]/g, '');
    const venue = entryTags.journal || entryTags.booktitle || '';
    const year = entryTags.year || '';
    const doi = entryTags.doi ? `<a href="https://doi.org/${entryTags.doi}" target="_blank">DOI</a>` : '';
    
    return `
        <li>
            <strong>${authors}</strong><br>
            "${title}"<br>
            <em>${venue}</em> ${year ? `(${year})` : ''}
            ${doi ? ` | ${doi}` : ''}
        </li>
    `;
}

function createGrantHTML(grant) {
    const entryTags = grant.entryTags || grant;
    return `
        <li>
            <strong>${entryTags.title || ''}</strong><br>
            ${entryTags.agency || ''} ${entryTags.period ? `(${entryTags.period})` : ''}
            ${entryTags.amount ? `<br>Amount: ${entryTags.amount}` : ''}
        </li>
    `;
}

function formatAuthors(authorString) {
    if (!authorString) return '';
    return authorString
        .split(' and ')
        .map(author => author.trim())
        .join(', ');
}

// Add some basic styles for the error message
const style = document.createElement('style');
style.textContent = `
    .error-message {
        color: #ef4444;
        padding: 1em;
        border-radius: 8px;
        background: #fee2e2;
        margin: 1em 0;
    }
`;
document.head.appendChild(style);

// Load publications when the document is ready
document.addEventListener('DOMContentLoaded', loadPublications);
