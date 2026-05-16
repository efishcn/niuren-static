/*!
 * Pay Info Viewer - Admin JavaScript
 * Modern interactive functionality for the admin interface
 */

(function($) {
    'use strict';

    class PayInfoAdmin {
        constructor() {
            this.init();
        }

        init() {
            $(document).ready(() => {
                this.initCharts();
                this.initUserSearch();
                this.initFilters();
                this.initInteractiveElements();
            });
        }

        // Initialize Chart.js charts
        initCharts() {
            if (typeof window.payInfoChartData === 'undefined') {
                return;
            }

            this.initTrendChart();
            this.initDistributionChart();
        }

        initTrendChart() {
            const canvas = document.getElementById('trendChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const data = window.payInfoChartData.trend;

            // Prepare chart data
            const labels = data.map(item => item.period);
            const amountData = data.map(item => parseFloat(item.amount || 0));
            const countData = data.map(item => parseInt(item.count || 0));

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '支付金额',
                        data: amountData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    }, {
                        label: '支付笔数',
                        data: countData,
                        borderColor: '#f5576c',
                        backgroundColor: 'rgba(245, 87, 108, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: false // We have custom legend
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#333',
                            bodyColor: '#333',
                            borderColor: '#e1e5e9',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.datasetIndex === 0) {
                                        label += '￥' + context.parsed.y.toLocaleString();
                                    } else {
                                        label += context.parsed.y.toLocaleString() + '笔';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                display: false
                            },
                            border: {
                                color: '#e1e5e9'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            border: {
                                color: '#e1e5e9'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '￥' + value.toLocaleString();
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                            border: {
                                color: '#e1e5e9'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '笔';
                                }
                            }
                        },
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        }

        initDistributionChart() {
            const canvas = document.getElementById('distributionChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const data = window.payInfoChartData.distribution;

            // Prepare chart data
            const labels = data.map(item => item.type);
            const amounts = data.map(item => parseFloat(item.amount || 0));
            
            const colors = [
                'rgba(102, 126, 234, 0.8)',
                'rgba(245, 87, 108, 0.8)',
                'rgba(52, 211, 153, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(139, 69, 19, 0.8)'
            ];

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace('0.8', '1')),
                        borderWidth: 2,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#333',
                            bodyColor: '#333',
                            borderColor: '#e1e5e9',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ￥' + value.toLocaleString() + ' (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    cutout: '50%'
                }
            });
        }

        // Initialize user search functionality
        initUserSearch() {
            const userSelect = $('.user-select');
            if (userSelect.length === 0) return;

            // Convert to select2 if available, otherwise use basic autocomplete
            if (typeof userSelect.select2 === 'function') {
                userSelect.select2({
                    placeholder: '搜索用户...',
                    allowClear: true,
                    ajax: {
                        url: payInfoAjax.ajaxurl,
                        dataType: 'json',
                        delay: 300,
                        data: function(params) {
                            return {
                                action: 'pay_info_user_search',
                                search: params.term,
                                nonce: payInfoAjax.nonce
                            };
                        },
                        processResults: function(data) {
                            return {
                                results: data.success ? data.data : []
                            };
                        },
                        cache: true
                    },
                    minimumInputLength: 2,
                    width: '200px'
                });
            }
        }

        // Initialize filter interactions
        initFilters() {
            // Auto-submit form when filters change (with debouncing)
            let filterTimeout;
            $('.pay-info-stats .filters-form select, .pay-info-stats .filters-form input[type="date"]').on('change', function() {
                clearTimeout(filterTimeout);
                filterTimeout = setTimeout(() => {
                    $(this).closest('form').submit();
                }, 500);
            });

            // Quick date range buttons
            this.addQuickDateRanges();
            
            // Filter chips for active filters
            this.initFilterChips();
        }

        addQuickDateRanges() {
            const startDateInput = $('input[name="start_date"]');
            const endDateInput = $('input[name="end_date"]');
            
            if (startDateInput.length === 0) return;

            const quickRanges = [
                { label: '今天', days: 0 },
                { label: '最近7天', days: 7 },
                { label: '最近30天', days: 30 },
                { label: '最近90天', days: 90 }
            ];

            const quickRangeContainer = $('<div class="quick-date-ranges"></div>');
            
            quickRanges.forEach(range => {
                const button = $(`<button type="button" class="button button-small">${range.label}</button>`);
                button.on('click', (e) => {
                    e.preventDefault();
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - range.days);
                    
                    startDateInput.val(startDate.toISOString().split('T')[0]);
                    endDateInput.val(endDate.toISOString().split('T')[0]);
                    
                    // Auto-submit form
                    setTimeout(() => {
                        startDateInput.closest('form').submit();
                    }, 100);
                });
                quickRangeContainer.append(button);
            });

            startDateInput.closest('.filter-group').after(quickRangeContainer);
        }

        initFilterChips() {
            // This would show active filters as removable chips
            // Implementation depends on current filter values
        }

        // Initialize interactive elements
        initInteractiveElements() {
            // Animate statistics cards on page load
            this.animateStatCards();
            
            // Add loading states
            this.initLoadingStates();
            
            // Add tooltips
            this.initTooltips();
            
            // Add keyboard shortcuts
            this.initKeyboardShortcuts();
        }

        animateStatCards() {
            $('.stat-card').each(function(index) {
                $(this).css({
                    opacity: 0,
                    transform: 'translateY(20px)'
                }).delay(index * 100).animate({
                    opacity: 1
                }, {
                    duration: 600,
                    step: function(now) {
                        $(this).css('transform', `translateY(${20 * (1 - now)}px)`);
                    },
                    complete: function() {
                        $(this).css('transform', 'translateY(0)');
                    }
                });
            });

            // Animate stat values
            $('.stat-value').each(function() {
                const $this = $(this);
                const text = $this.text();
                const isAmount = text.includes('￥');
                const number = parseFloat(text.replace(/[^\d.]/g, ''));
                
                if (!isNaN(number)) {
                    $this.text(isAmount ? '￥0' : '0');
                    $({ counter: 0 }).animate({ counter: number }, {
                        duration: 1500,
                        easing: 'swing',
                        step: function() {
                            const formatted = Math.ceil(this.counter).toLocaleString();
                            $this.text(isAmount ? '￥' + formatted : formatted);
                        },
                        complete: function() {
                            $this.text(text); // Restore original formatting
                        }
                    });
                }
            });
        }

        initLoadingStates() {
            // Add loading overlay for AJAX operations
            $(document).ajaxStart(function() {
                $('.pay-info-viewer').addClass('loading');
                if ($('.loading-overlay').length === 0) {
                    $('.pay-info-viewer').append('<div class="loading-overlay"><div class="loading-spinner"></div></div>');
                }
            }).ajaxStop(function() {
                $('.pay-info-viewer').removeClass('loading');
                $('.loading-overlay').remove();
            });

            // Form submission loading states
            $('.pay-info-form, .filters-form').on('submit', function() {
                const form = $(this);
                const submitBtn = form.find('input[type="submit"], button[type="submit"]');
                
                submitBtn.prop('disabled', true).addClass('loading');
                
                // Add spinner to button if it doesn't have one
                if (submitBtn.find('.loading-spinner').length === 0) {
                    submitBtn.append('<span class="loading-spinner" style="margin-left: 5px; display: inline-block; width: 12px; height: 12px;"></span>');
                }
            });
        }

        initTooltips() {
            // Add tooltips to interactive elements
            $('[title]').each(function() {
                $(this).tooltip({
                    position: { my: "center bottom-20", at: "center top" },
                    show: { duration: 200 },
                    hide: { duration: 200 }
                });
            });

            // Custom tooltips for chart elements and statistics
            $('.stat-card').each(function() {
                const $card = $(this);
                const title = $card.find('h3').text();
                const value = $card.find('.stat-value').text();
                
                $card.attr('title', `${title}: ${value}`);
            });
        }

        initKeyboardShortcuts() {
            $(document).keydown((e) => {
                // Ctrl/Cmd + F: Focus search
                if ((e.ctrlKey || e.metaKey) && e.which === 70) {
                    const searchInput = $('#search-pay-info');
                    if (searchInput.length) {
                        e.preventDefault();
                        searchInput.focus();
                    }
                }
                
                // Ctrl/Cmd + R: Refresh data (prevent default page refresh)
                if ((e.ctrlKey || e.metaKey) && e.which === 82) {
                    if ($('.pay-info-stats').length) {
                        e.preventDefault();
                        $('.filters-form').submit();
                    }
                }
                
                // Escape: Clear search or close modals
                if (e.which === 27) {
                    const searchInput = $('#search-pay-info');
                    if (searchInput.length && searchInput.val()) {
                        searchInput.val('').trigger('input');
                    }
                }
            });
        }

        // Utility methods
        formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        formatCurrency(amount) {
            return '￥' + this.formatNumber(parseFloat(amount).toFixed(2));
        }

        showNotification(message, type = 'success') {
            const notification = $(`
                <div class="notice notice-${type} is-dismissible">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">关闭通知</span>
                    </button>
                </div>
            `);

            $('.pay-info-viewer').prepend(notification);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                notification.fadeOut(() => {
                    notification.remove();
                });
            }, 5000);

            // Handle dismiss button
            notification.find('.notice-dismiss').on('click', () => {
                notification.fadeOut(() => {
                    notification.remove();
                });
            });
        }

        // Export functionality
        initExportFeatures() {
            // Add export buttons to tables and charts
            const exportBtn = $(`
                <button type="button" class="button button-secondary export-btn">
                    <span class="dashicons dashicons-download"></span>
                    导出数据
                </button>
            `);

            $('.page-actions').append(exportBtn);

            exportBtn.on('click', () => {
                this.exportData();
            });
        }

        exportData() {
            // Simple CSV export functionality
            const table = $('.wp-list-table');
            if (table.length === 0) return;

            const csv = [];
            const headers = [];
            
            // Get headers
            table.find('th').each(function() {
                const text = $(this).text().trim();
                if (text && text !== '') {
                    headers.push(text);
                }
            });
            csv.push(headers.join(','));

            // Get data rows
            table.find('tbody tr').each(function() {
                const row = [];
                $(this).find('td').each(function() {
                    const text = $(this).text().trim().replace(/"/g, '""');
                    row.push(`"${text}"`);
                });
                if (row.length > 0) {
                    csv.push(row.join(','));
                }
            });

            // Download CSV
            const csvContent = csv.join('\n');
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `pay-info-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Initialize the admin functionality
    new PayInfoAdmin();

    // Global functions for backward compatibility
    window.PayInfoAdmin = PayInfoAdmin;

})(jQuery);

// Additional utility functions
function refreshPayInfoData() {
    if (jQuery('.filters-form').length) {
        jQuery('.filters-form').submit();
    } else {
        location.reload();
    }
}

function clearAllFilters() {
    const url = new URL(window.location);
    const params = ['status', 'business_type', 'user_filter', 'start_date', 'end_date', 's'];
    
    params.forEach(param => {
        url.searchParams.delete(param);
    });
    
    window.location.href = url.toString();
}

// Auto-refresh functionality (optional)
if (typeof payInfoAutoRefresh !== 'undefined' && payInfoAutoRefresh) {
    setInterval(refreshPayInfoData, 30000); // Refresh every 30 seconds
}
