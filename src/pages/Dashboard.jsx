import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProfit: 0,
    profitByDay: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const selectedMonthIndex = months.indexOf(selectedMonth);
      const startDate = new Date(now.getFullYear(), selectedMonthIndex, 1);
      const endDate = new Date(now.getFullYear(), selectedMonthIndex + 1, 0);

      // Fetch orders for the selected month
      const ordersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Fetch all products to get cost prices
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = {};
      productsSnapshot.forEach(doc => {
        products[doc.id] = doc.data();
      });

      let totalSales = 0;
      let totalOrders = 0;
      let totalProfit = 0;
      const profitByDay = {};

      // Debug: Log all orders
      console.log('All orders:', ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        totalOrders++;
        
        let orderTotal = 0;
        let orderProfit = 0;
        
        // Debug: Log each order's items
        console.log('Order items:', order.items);
        
        order.items.forEach(item => {
          const product = products[item.productId];
          if (product) {
            const itemTotal = item.price * item.quantity;
            const itemProfit = (item.price - (product.costPrice || 0)) * item.quantity;
            orderTotal += itemTotal;
            orderProfit += itemProfit;
            
            // Debug: Log item calculations
            console.log('Item calculation:', {
              itemName: item.name,
              price: item.price,
              quantity: item.quantity,
              itemTotal,
              itemProfit
            });
          }
        });
        
        // Debug: Log order totals
        console.log('Order totals:', {
          orderId: doc.id,
          orderTotal,
          orderProfit
        });
        
        totalSales += orderTotal;
        totalProfit += orderProfit;

        // Track profit by day
        const orderDate = order.createdAt.toDate();
        const dayKey = orderDate.toLocaleDateString();
        profitByDay[dayKey] = (profitByDay[dayKey] || 0) + orderProfit;
      });

      // Debug: Log final totals
      console.log('Final totals:', {
        totalSales,
        totalOrders,
        totalProfit
      });

      // Convert profit by day to array for chart
      const profitByDayArray = Object.entries(profitByDay)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
        .map(([date, profit]) => ({
          date,
          profit
        }));

      setStats({
        totalSales,
        totalOrders,
        totalProfit,
        profitByDay: profitByDayArray
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: stats.profitByDay.map(item => item.date),
    datasets: [
      {
        label: 'Daily Profit',
        data: stats.profitByDay.map(item => item.profit),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Profit Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Rs. ' + value.toFixed(2);
          }
        }
      }
    }
  };

  return (
    <div className="dark:text-white">
      <div className="mb-6">
        <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Month
        </label>
        <select
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Sales
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Rs. {stats.totalSales.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Orders
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalOrders}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Profit
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Rs. {stats.totalProfit.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
} 