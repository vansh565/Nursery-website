document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loadingScreen = document.getElementById('loadingScreen');
  const dashboard = document.getElementById('dashboard');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const menuLinks = document.querySelectorAll('.menu-link');
  const searchInput = document.querySelector('.search-box input');
  const notificationBtn = document.querySelector('.notification-btn');
  const themeToggle = document.querySelector('.theme-toggle');
  const fab = document.getElementById('fab');
  const logoutBtn = document.querySelector('.logout-btn');
  const ordersList = document.querySelector('.orders-list');
  const productsList = document.querySelector('.products-list');
  const statCards = document.querySelectorAll('.stat-card');
  const salesChartCanvas = document.getElementById('salesChart').getContext('2d');

  // Simulate loading time
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    dashboard.style.opacity = '1';
    initializeAnimations();
    fetchOrders(); // Fetch orders after loading
  }, 2500);

  // Sidebar functionality
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
    }
  });

  // Close sidebar when clicking outside (mobile)
  if (window.innerWidth <= 768) {
    document.addEventListener('click', function(e) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Menu navigation
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
      this.parentElement.classList.add('active');
      const pageName = this.dataset.page;
      const pageTitle = document.querySelector('.page-title');
      pageTitle.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);
      const contentArea = document.querySelector('.content-area');
      contentArea.style.opacity = '0.5';
      contentArea.style.transform = 'translateY(20px)';
      setTimeout(() => {
        contentArea.style.opacity = '1';
        contentArea.style.transform = 'translateY(0)';
      }, 200);
    });
  });

  // Animated counters for stats
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-value[data-target]');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;
      const updateCounter = () => {
        if (current < target) {
          current += increment;
          if (current > target) current = target;
          const formatted = Math.floor(current).toLocaleString();
          counter.textContent = counter.classList.contains('revenue') ? `₹${formatted}` : formatted;
          requestAnimationFrame(updateCounter);
        }
      };
      updateCounter();
    });
  }

    // View All Pending Orders Button
  const viewAllPendingBtn = document.getElementById('viewAllPendingBtn');
  viewAllPendingBtn.addEventListener('click', function () {
    fetchAndShowPendingOrders();
  });

  async function fetchAndShowPendingOrders() {
    try {
      const response = await fetch('https://new-plant-1.onrender.com/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const orders = await response.json();

      const pendingOrders = orders.filter(order => order.status === 'Pending');

      ordersList.innerHTML = pendingOrders.length > 0
        ? pendingOrders.map(order => `
            <div class="order-item">
              <div class="order-info">
                <span class="order-id">${order._id}</span>
                <span class="customer-name">${order.email || 'Guest'}</span>
              </div>
              <div class="order-details">
                <span class="order-amount">₹${(order.finalAmount || 0).toFixed(2)}</span>
                <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
              </div>
            </div>
          `).join('')
        : '<p>No pending orders</p>';

      showNotification(`Showing ${pendingOrders.length} pending order(s)`, 'info');
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      ordersList.innerHTML = '<p>Error loading pending orders</p>';
    }
  }


  // Initialize animations
  function initializeAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );
    animatedElements.forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'all 0.8s ease-out';
      observer.observe(element);
    });
    setTimeout(animateCounters, 1000);
  }

  // Fetch and display orders from the API
  async function fetchOrders() {
    try {
      const response = await fetch('https://new-plant-1.onrender.com/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const orders = await response.json();
      if (Array.isArray(orders)) {
        updateDashboard(orders);
      } else {
        console.error('Expected an array of orders, got:', orders);
        ordersList.innerHTML = '<p>No orders found</p>';
        showNotification('No orders found', 'warning');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      ordersList.innerHTML = '<p>Error loading orders</p>';
      showNotification('Error loading orders', 'error');
    }
  }

  // Update dashboard with order data
  function updateDashboard(orders) {
    // Update Recent Orders
    ordersList.innerHTML = orders.slice(0, 3).map(order => `
      <div class="order-item">
        <div class="order-info">
          <span class="order-id">${order._id}</span>
          <span class="customer-name">${order.email || 'Guest'}</span>
        </div>
        <div class="order-details">
          <span class="order-amount">₹${(order.finalAmount || 0).toFixed(2)}</span>
          <span class="order-status ${order.status.toLowerCase()}">${order.status || 'Pending'}</span>
        </div>
      </div>
    `).join('') || '<p>No orders found</p>';

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
    const totalOrders = orders.length;
    const uniqueProducts = new Set(
      orders.flatMap(order => (order.items || []).map(item => item.name))
    ).size;
    const customers = new Set(orders.map(order => order.email)).size;

    // Update stats cards
    const revenueStat = document.querySelector('.stat-value[data-target="45280"]');
    const ordersStat = document.querySelector('.stat-value[data-target="1247"]');
    const customersStat = document.querySelector('.stat-value[data-target="892"]');
    const productsStat = document.querySelector('.stat-value[data-target="2156"]');
    revenueStat.dataset.target = Math.floor(totalRevenue);
    revenueStat.classList.add('revenue');
    ordersStat.dataset.target = totalOrders;
    customersStat.dataset.target = customers;
    productsStat.dataset.target = uniqueProducts;

    // Aggregate product data for Top Products (without images)
    const productMap = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!productMap[item.name]) {
          productMap[item.name] = {
            name: item.name,
            sales: 0,
            revenue: 0
          };
        }
        productMap[item.name].sales += (item.quantity || 1);
        productMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    // Update Top Products (without images)
    const topProducts = Object.values(productMap).sort((a, b) => b.sales - a.sales).slice(0, 3);
    productsList.innerHTML = topProducts.map(product => `
      <div class="product-item">
        <div class="product-info">
          <span class="product-name">${product.name}</span>
          <span class="product-sales">${product.sales} sold</span>
        </div>
        <div class="product-revenue">₹${product.revenue.toFixed(2)}</div>
      </div>
    `).join('') || '<p>No products found</p>';

    // Update Sales Chart
    updateSalesChart(orders);

    // Re-run animations for updated stats
    animateCounters();
  }

  // Update sales chart using Chart.js
  function updateSalesChart(orders) {
    const monthlySales = Array(12).fill(0);
    orders.forEach(order => {
      const date = new Date(order.orderDate);
      const month = date.getMonth();
      monthlySales[month] += order.finalAmount || 0;
    });

    new Chart(salesChartCanvas, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Sales',
          data: monthlySales,
          borderColor: '#fb641b',
          backgroundColor: 'rgba(251, 100, 27, 0.2)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // Search functionality
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    this.style.background = searchTerm ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-bg)';
    console.log('Searching for:', searchTerm);
  });

  // Notification button
  notificationBtn.addEventListener('click', function() {
    showNotification('You have 3 new notifications!', 'info');
  });

  // Theme toggle
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('ultra-dark');
    const icon = this.querySelector('i');
    if (document.body.classList.contains('ultra-dark')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  });

  // Floating Action Button
  fab.addEventListener('click', function() {
    showQuickActionMenu();
  });

  // Logout functionality
  logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
      document.body.style.opacity = '0';
      document.body.style.transform = 'scale(0.95)';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }
  });

  // Quick action cards
  const actionCards = document.querySelectorAll('.action-card');
  actionCards.forEach(card => {
    card.addEventListener('click', function() {
      const action = this.querySelector('span').textContent;
      showNotification(`${action} clicked!`, 'success');
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);
    });
  });

  // Order items click
  ordersList.addEventListener('click', function(e) {
    const orderItem = e.target.closest('.order-item');
    if (orderItem) {
      const orderId = orderItem.querySelector('.order-id').textContent;
      showNotification(`Viewing order ${orderId}`, 'info');
    }
  });

  // Product items click
  productsList.addEventListener('click', function(e) {
    const productItem = e.target.closest('.product-item');
    if (productItem) {
      const productName = productItem.querySelector('.product-name').textContent;
      showNotification(`Viewing ${productName}`, 'info');
    }
  });

  // Notification utility
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${getNotificationColor(type)};
      color: white;
      border-radius: 12px;
      box-shadow: var(--shadow-medium);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'exclamation-circle';
      case 'warning': return 'exclamation-triangle';
      default: return 'info-circle';
    }
  }

  function getNotificationColor(type) {
    switch (type) {
      case 'success': return 'var(--accent-green)';
      case 'error': return 'var(--accent-red)';
      case 'warning': return 'var(--accent-orange)';
      default: return 'var(--accent-blue)';
    }
  }

  // Quick action menu
  function showQuickActionMenu() {
    const menu = document.createElement('div');
    menu.className = 'quick-action-menu';
    menu.innerHTML = `
      <div class="quick-action-item" data-action="add-product">
        <i class="fas fa-plus"></i>
        <span>Add Product</span>
      </div>
      <div class="quick-action-item" data-action="create-order">
        <i class="fas fa-file-invoice"></i>
        <span>Create Order</span>
      </div>
      <div class="quick-action-item" data-action="add-customer">
        <i class="fas fa-user-plus"></i>
        <span>Add Customer</span>
      </div>
      <div class="quick-action-item" data-action="view-reports">
        <i class="fas fa-chart-line"></i>
        <span>View Reports</span>
      </div>
    `;
    menu.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 30px;
      background: var(--secondary-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 10px;
      box-shadow: var(--shadow-heavy);
      z-index: 10000;
      transform: scale(0) translateY(20px);
      transition: all 0.3s ease;
    `;
    const style = document.createElement('style');
    style.textContent = `
      .quick-action-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        color: var(--text-secondary);
      }
      .quick-action-item:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
        transform: translateX(5px);
      }
      .quick-action-item i {
        width: 16px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(menu);
    setTimeout(() => {
      menu.style.transform = 'scale(1) translateY(0)';
    }, 100);
    menu.querySelectorAll('.quick-action-item').forEach(item => {
      item.addEventListener('click', function() {
        const action = this.dataset.action;
        showNotification(`${this.querySelector('span').textContent} clicked!`, 'success');
        document.body.removeChild(menu);
        document.head.removeChild(style);
      });
    });
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !fab.contains(e.target)) {
          menu.style.transform = 'scale(0) translateY(20px)';
          setTimeout(() => {
            if (document.body.contains(menu)) {
              document.body.removeChild(menu);
              document.head.removeChild(style);
            }
          }, 300);
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      sidebar.classList.toggle('collapsed');
    }
    if (e.key === 'Escape') {
      const quickMenu = document.querySelector('.quick-action-menu');
      if (quickMenu) {
        document.body.removeChild(quickMenu);
      }
    }
  });

  // Ultra dark theme styles
  const ultraDarkStyles = document.createElement('style');
  ultraDarkStyles.textContent = `
    .ultra-dark {
      --primary-bg: #000000;
      --secondary-bg: #111111;
      --card-bg: #1a1a1a;
      --hover-bg: #2a2a2a;
      --border-color: #333333;
    }
  `;
  document.head.appendChild(ultraDarkStyles);

  // Particle effect on stat cards
  statCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: var(--accent-green);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1000;
        `;
        const rect = this.getBoundingClientRect();
        particle.style.left = rect.left + Math.random() * rect.width + 'px';
        particle.style.top = rect.top + Math.random() * rect.height + 'px';
        document.body.appendChild(particle);
        particle.animate(
          [
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-50px) scale(0)', opacity: 0 }
          ],
          { duration: 1000, easing: 'ease-out' }
        ).onfinish = () => {
          document.body.removeChild(particle);
        };
      }
    });
  });

  // Real-time clock
  setInterval(() => {
    const now = new Date();
    console.log('Current time:', now.toLocaleTimeString());
  }, 1000);

  // Performance monitoring
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
  });
});