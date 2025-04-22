document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('nav');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('#nav ul li a');
    
    // Handle scroll events for nav style
    window.addEventListener('scroll', () => {
        // Add scrolled class for style changes
        if (window.pageYOffset > 50) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
        
        // Update active section
        updateActiveSection();
    });

    // Update active section based on scroll position
    function updateActiveSection() {
        const fromTop = window.scrollY + nav.offsetHeight + 50;
        
        sections.forEach(section => {
            const id = section.getAttribute('id');
            if (!id) return;
            
            const link = document.querySelector(`#nav a[href="#${id}"]`);
            if (!link) return;

            const { top, bottom } = section.getBoundingClientRect();
            const sectionTop = top + window.pageYOffset;
            const sectionBottom = bottom + window.pageYOffset;

            if (fromTop >= sectionTop && fromTop <= sectionBottom) {
                navLinks.forEach(link => link.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }

    // Smooth scroll to section when clicking nav links
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initial active section check
    updateActiveSection();
});
