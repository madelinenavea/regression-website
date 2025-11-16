document.addEventListener("DOMContentLoaded", () => {

    // OUTER TABS
    const outerTabs = document.querySelectorAll(".outer-tab");
    const outerPanels = document.querySelectorAll(".tab-panel");

    outerTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            outerTabs.forEach(t => t.classList.remove("active"));
            outerPanels.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");
        });
    });

    // INNER TABS
    const innerTabs = document.querySelectorAll(".inner-tab");
    const innerPanels = document.querySelectorAll(".inner-panel");

    innerTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const parent = tab.closest(".tab-panel");
            parent.querySelectorAll(".inner-tab").forEach(t => t.classList.remove("active"));
            parent.querySelectorAll(".inner-panel").forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");
        });
    });

});
