(function($) {
    'use strict';

    // 侧边栏折叠/展开功能
    class SidebarManager {
        constructor() {
            this.body = $('body');
            this.init();
        }

        init() {
            this.addToggleButton();
            this.handleToggle();
            this.loadSavedState();
        }

        addToggleButton() {
            const button = $('<button>', {
                class: 'sidebar-toggle',
                html: '<span class="dashicons dashicons-arrow-left-alt2"></span>'
            });
            $('#adminmenuwrap').append(button);
        }

        handleToggle() {
            $('.sidebar-toggle').on('click', () => {
                this.body.toggleClass('folded');
                this.saveState();
            });
        }

        saveState() {
            localStorage.setItem('adminMenuFolded', this.body.hasClass('folded'));
        }

        loadSavedState() {
            const isFolded = localStorage.getItem('adminMenuFolded') === 'true';
            if (isFolded) {
                this.body.addClass('folded');
            }
        }
    }

    // 顶部搜索功能
    class SearchManager {
        constructor() {
            this.init();
        }

        init() {
            this.addSearchBar();
            this.handleSearch();
        }

        addSearchBar() {
            const searchBar = $('<div>', {
                class: 'top-search-bar',
                html: `
                    <input type="text" placeholder="搜索...">
                    <span class="dashicons dashicons-search"></span>
                `
            });
            $('#wpadminbar').append(searchBar);
        }

        handleSearch() {
            let timeout = null;
            $('.top-search-bar input').on('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }

        performSearch(query) {
            // 实现搜索逻辑
        }
    }

    // 主题切换功能
    class ThemeManager {
        constructor() {
            this.init();
        }

        init() {
            this.addThemeToggle();
            this.handleThemeChange();
            this.loadSavedTheme();
        }

        addThemeToggle() {
            const toggle = $('<div>', {
                class: 'theme-toggle',
                html: `
                    <span class="dashicons dashicons-sun"></span>
                    <span class="dashicons dashicons-moon"></span>
                `
            });
            $('#wpadminbar').append(toggle);
        }

        handleThemeChange() {
            $('.theme-toggle').on('click', () => {
                $('body').toggleClass('dark-theme');
                this.saveTheme();
            });
        }

        saveTheme() {
            localStorage.setItem('darkTheme', $('body').hasClass('dark-theme'));
        }

        loadSavedTheme() {
            const isDark = localStorage.getItem('darkTheme') === 'true';
            if (isDark) {
                $('body').addClass('dark-theme');
            }
        }
    }

    // 页面加载完成后初始化
    $(document).ready(() => {
        new SidebarManager();
        new SearchManager();
        new ThemeManager();
    });

})(jQuery); 