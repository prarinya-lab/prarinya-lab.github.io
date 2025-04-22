// Mobile Navigation
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.main-nav');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = `
        <span class="menu-icon"></span>
    `;
    
    // Only add mobile menu button on small screens
    if (window.innerWidth <= 768) {
        nav.insertBefore(mobileMenuBtn, navLinks);
    }
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            if (nav.contains(mobileMenuBtn)) {
                nav.removeChild(mobileMenuBtn);
            }
        } else if (!nav.contains(mobileMenuBtn)) {
            nav.insertBefore(mobileMenuBtn, navLinks);
        }
    });
});

// Dynamic content loading
async function loadContent() {
    // Load latest news
    const newsResponse = await fetch('news.html');
    const newsHtml = await newsResponse.text();
    const newsDoc = new DOMParser().parseFromString(newsHtml, 'text/html');
    const newsItems = Array.from(newsDoc.querySelectorAll('.news-item')).slice(0, 3);
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid && newsItems.length) {
        newsItems.forEach(item => newsGrid.appendChild(item.cloneNode(true)));
    }

    // Load recent publications
    const pubResponse = await fetch('research.html');
    const pubHtml = await pubResponse.text();
    const pubDoc = new DOMParser().parseFromString(pubHtml, 'text/html');
    const pubItems = Array.from(pubDoc.querySelectorAll('.publications li')).slice(0, 3);
    const pubGrid = document.querySelector('.publications-grid');
    if (pubGrid && pubItems.length) {
        pubItems.forEach(item => pubGrid.appendChild(item.cloneNode(true)));
    }

    // Load active grants
    const grantItems = Array.from(pubDoc.querySelectorAll('.grants li')).slice(0, 3);
    const grantGrid = document.querySelector('.grants-grid');
    if (grantGrid && grantItems.length) {
        grantItems.forEach(item => grantGrid.appendChild(item.cloneNode(true)));
    }
}

// Load dynamic content when DOM is ready
document.addEventListener('DOMContentLoaded', loadContent);
