document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById("main-navbar");
    if (!navbar) return;

    // Scroll effect
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    // Highlight active link
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = navbar.querySelectorAll(".nav-link");
    
    navLinks.forEach(link => {
        const href = link.getAttribute("href").split("/").pop();
        if (href === currentPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});



