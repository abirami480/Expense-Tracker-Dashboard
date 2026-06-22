import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  RadialLinearScale, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Pie as PieChart, Bar as BarChart, Line as LineChart, Doughnut as DoughnutChart, PolarArea as PolarChart } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  RadialLinearScale, 
  Tooltip, 
  Legend
);

function App() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('my_expenses_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(''); 
  const [chartType, setChartType] = useState('pie');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Existing Features
  const [budgetLimit, setBudgetLimit] = useState(10000);
  const [dateFilter, setDateFilter] = useState('all');

  // 🔥 NEW FEATURE: Zoom Chart Modal State
  const [isChartZoomed, setIsChartZoomed] = useState(false);

  useEffect(() => {
    localStorage.setItem('my_expenses_list', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (e) => {
    e.preventDefault();
    if (!text || !amount) return alert("Please fill all fields!");
    
    const selectedCategory = category === '' ? 'Others' : category;

    const newEntry = {
      id: Date.now().toString(),
      text: text,
      amount: Number(amount),
      category: selectedCategory,
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [...prev, newEntry]);
    setText(''); 
    setAmount('');
    setCategory(''); 
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(item => item.id !== id));
  };

  const clearAllData = () => {
    if(window.confirm("Are you sure you want to delete all data?")) {
      setExpenses([]);
      localStorage.removeItem('my_expenses_list');
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return alert("No data to export!");
    let csvContent = "data:text/csv;charset=utf-8,Title,Category,Date,Amount\n";
    expenses.forEach(item => {
      csvContent += `"${item.text}","${item.category}","${new Date(item.createdAt).toLocaleDateString()}",${item.amount}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Expense_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredExpenses = () => {
    return expenses.filter(item => {
      const matchesSearch = item.text ? item.text.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesFilter = filterType === 'all' ? true : 
                            filterType === 'income' ? item.amount > 0 : item.amount < 0;

      let matchesDate = true;
      const itemDate = new Date(item.createdAt);
      const today = new Date();

      if (dateFilter === 'today') {
        matchesDate = itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'month') {
        matchesDate = itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  const income = filteredExpenses.filter(item => item.amount > 0).reduce((acc, item) => acc + item.amount, 0);
  const expense = filteredExpenses.filter(item => item.amount < 0).reduce((acc, item) => acc + item.amount, 0);
  const total = income + expense;
  const totalExpenseAbs = Math.abs(expense);

  const allAvailableCategories = [
    'Salary/Job', 'Food', 'Entertainment', 'Rent', 'Shopping', 'Bills/Utilities', 'Others'
  ];

  const categoryDataMap = {};
  allAvailableCategories.forEach(cat => {
    categoryDataMap[cat] = 0;
  });

  filteredExpenses.forEach(item => {
    const cat = item.category || 'Others';
    if (categoryDataMap[cat] !== undefined) {
      categoryDataMap[cat] += Math.abs(item.amount);
    } else {
      categoryDataMap['Others'] += Math.abs(item.amount);
    }
  });

  const categoryLabels = Object.keys(categoryDataMap);
  const categoryValues = Object.values(categoryDataMap);
  const categoryColors = ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#95a5a6'];

  const incomeVsExpenseData = {
    labels: ['Income', 'Expense'],
    datasets: [{
      data: [income, totalExpenseAbs],
      backgroundColor: ['#2ecc71', '#e74c3c'],
      borderColor: ['#27ae60', '#c0392b'],
      borderWidth: 1
    }]
  };

  const categoryChartData = {
    labels: categoryLabels,
    datasets: [{
      label: 'Amount (₹)',
      data: categoryValues,
      backgroundColor: categoryColors,
      borderWidth: 1
    }]
  };

  // Turn off default legends for standard view, can enable for big view
  const commonOptions = (showLegend = false) => ({ 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { display: showLegend, labels: { color: isDarkMode ? '#fff' : '#333' } } }
  });

  const renderSelectedChart = (data, isZoomedView = false) => {
    if (filteredExpenses.length === 0) return <p style={{ textAlign: 'center', color: '#999', paddingTop: isZoomedView ? '150px' : '70px', fontSize: '13px' }}>No Data for this filter</p>;
    
    const options = commonOptions(isZoomedView); // Zoom பண்ணும்போது மட்டும் லெஜண்ட் (Labels) காட்டும்
    
    switch (chartType) {
      case 'pie': return <PieChart data={data} options={options} />;
      case 'bar': return <BarChart data={data} options={options} />;
      case 'line': return <LineChart data={data} options={options} />;
      case 'doughnut': return <DoughnutChart data={data} options={options} />;
      case 'polar': return <PolarChart data={data} options={options} />;
      default: return <PieChart data={data} options={options} />;
    }
  };

  const boxBg = isDarkMode ? '#2d2d2d' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#2c3e50';
  const subTextColor = isDarkMode ? '#b3b3b3' : '#7f8c8d';
  const inputBg = isDarkMode ? '#3d3d3d' : '#fff';
  const inputBorder = isDarkMode ? '#555' : '#ddd';

  return (
    <div style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#f4f7f6', minHeight: '100vh', padding: '20px 25px', fontFamily: '"Segoe UI", Roboto, sans-serif', color: isDarkMode ? '#fff' : '#000', boxSizing: 'border-box' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '25px', maxWidth: '1200px', margin: '0 auto 25px auto' }}>
        <h1 style={{ margin: 0, color: textColor, fontSize: '26px', fontWeight: 'bold', textAlign: 'center' }}>📊 Expense Tracker Dashboard</h1>
        
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={{ padding: '8px 12px', borderRadius: '5px', border: 'none', backgroundColor: '#27ae60', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📥 Export Excel</button>
          <button onClick={clearAllData} style={{ padding: '8px 12px', borderRadius: '5px', border: 'none', backgroundColor: '#c0392b', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🗑️ Clear All</button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: isDarkMode ? '#fff' : '#2c3e50', color: isDarkMode ? '#2c3e50' : '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
        </div>
      </div>

      {/* BUDGET WARNING ALERT */}
      {totalExpenseAbs > budgetLimit && (
        <div style={{ backgroundColor: '#f2d7d5', color: '#c0392b', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', maxWidth: '1200px', margin: '0 auto 20px auto', border: '1px solid #e6b0aa', fontSize: '14px' }}>
          ⚠️ Warning: Your total expense (₹{totalExpenseAbs}) has crossed your set budget limit of ₹{budgetLimit}!
        </div>
      )}

      {/* PREMIUM STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto 30px auto' }}>
        <div style={{ backgroundColor: boxBg, padding: '15px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: subTextColor }}>TOTAL INCOME</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#2ecc71', marginTop: '5px' }}>₹{income.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ backgroundColor: boxBg, padding: '15px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: subTextColor }}>TOTAL EXPENSES</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#e74c3c', marginTop: '5px' }}>₹{totalExpenseAbs.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ backgroundColor: boxBg, padding: '15px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: total >= 0 ? '4px solid #3498db' : '4px solid #f39c12' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: total >= 0 ? '#3498db' : '#f39c12', marginTop: '5px' }}>₹{total.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '25px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* LEFT COLUMN: FORMS & ANALYTICS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Add Transaction + Budget Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '15px' }}>
            <div style={{ backgroundColor: boxBg, padding: '14px 18px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: textColor }}>➕ Add Transaction</h3>
              <form onSubmit={addExpense}>
                <input type="text" placeholder="Description" value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: '6px 10px', marginBottom: '8px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, boxSizing: 'border-box', fontSize: '12px' }} />
                <input type="number" placeholder="Amount (- for expense)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '6px 10px', marginBottom: '8px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, boxSizing: 'border-box', fontSize: '12px' }} />
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '6px 10px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px' }}>
                  <option value="" disabled hidden>Category</option>
                  <option value="Salary/Job">Salary/Job</option>
                  <option value="Food">Food</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Rent">Rent</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills/Utilities">Bills/Utilities</option>
                  <option value="Others">Others</option>
                </select>
                <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Add Data</button>
              </form>
            </div>

            <div style={{ backgroundColor: boxBg, padding: '14px 15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: textColor }}>⚙️ Budget Limit</h4>
              <input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(Number(e.target.value))} style={{ width: '100%', padding: '6px 8px', marginBottom: '5px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, boxSizing: 'border-box', fontSize: '12px' }} />
              <span style={{ fontSize: '10px', color: subTextColor }}>Alert triggers when expense exceeds this.</span>
            </div>
          </div>

          {/* 📉 ANALYTICS CHARTS SECTION */}
          <div style={{ backgroundColor: boxBg, padding: '18px 20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: textColor }}>📉 Analytics & Categories</span>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* 🔥 NEW ZOOM BUTTON */}
                <button 
                  onClick={() => setIsChartZoomed(true)} 
                  style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#1a73e8', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  🔍 View Big Chart
                </button>

                <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <option value="pie">Pie</option>
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="doughnut">Doughnut</option>
                  <option value="polar">Polar</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', minHeight: '170px' }}>
              <div style={{ flex: '1.2', display: 'flex', gap: '10px', height: '170px' }}>
                <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: subTextColor, marginBottom: '5px' }}>BY CATEGORY</span>
                  <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                    {renderSelectedChart(categoryChartData, false)}
                  </div>
                </div>
                <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: `1px solid ${inputBorder}` }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: subTextColor, marginBottom: '5px' }}>INCOME / EXPENSE</span>
                  <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                    {renderSelectedChart(incomeVsExpenseData, false)}
                  </div>
                </div>
              </div>

              <div style={{ flex: '0.8', display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '10px', borderLeft: `2px solid ${inputBorder}`, maxHeight: '170px', overflowY: 'auto' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: subTextColor, marginBottom: '2px' }}>CATEGORY OPTIONS</span>
                {allAvailableCategories.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: categoryColors[idx] }}></div>
                      <span style={{ color: textColor }}>{cat}</span>
                    </div>
                    <span style={{ color: subTextColor, marginLeft: 'auto' }}>₹{categoryDataMap[cat]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRANSACTION HISTORY TABLE */}
        <div style={{ backgroundColor: boxBg, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: textColor, fontWeight: '700' }}>📋 Transaction History</h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="🔍 Search title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1.5, padding: '6px 10px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px' }} />
            
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px' }}>
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px', fontWeight: 'bold' }}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '350px' }}> 
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${inputBorder}`, color: subTextColor, fontSize: '13px' }}>
                  <th style={{ padding: '8px 4px' }}>Title</th>
                  <th style={{ padding: '8px 4px' }}>Category</th>
                  <th style={{ padding: '8px 4px' }}>Date</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item, index) => (
                  <tr key={item.id || index} style={{ borderBottom: `1px solid ${isDarkMode ? '#3d3d3d' : '#f9f9f9'}`, fontSize: '13px' }}>
                    <td style={{ padding: '10px 4px', fontWeight: '500' }}>{item.text}</td>
                    <td style={{ padding: '10px 4px' }}>
                      <span style={{ backgroundColor: isDarkMode ? '#3d3d3d' : '#f0f2f5', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: isDarkMode ? '#fff' : '#555', fontWeight: '600' }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 4px', color: subTextColor, fontSize: '11px' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 'bold', color: item.amount > 0 ? '#2ecc71' : '#e74c3c' }}>
                      {item.amount > 0 ? '+' : ''}₹{item.amount}
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                      <button onClick={() => deleteExpense(item.id)} style={{ background: 'none', border: 'none', color: '#95a5a6', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '15px' }}>No data found!</p>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 🔥 NEW FEATURE: ZOOM CHART MODAL POPUP VIEW              */}
      {/* ========================================================= */}
      {isChartZoomed && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: boxBg, padding: '30px', borderRadius: '12px', width: '85%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsChartZoomed(false)} 
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', color: textColor, fontSize: '28px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              &times;
            </button>

            {/* Modal Title & Chart Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingRight: '30px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: textColor }}>🔍 Expanded Analytics View</h2>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                <option value="pie">Pie Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="doughnut">Doughnut Chart</option>
                <option value="polar">Polar Area Chart</option>
              </select>
            </div>

            {/* Big Zoomed Charts Display inside Modal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expenses By Category</h4>
                <div style={{ width: '100%', flex: 1, position: 'relative' }}>
                  {renderSelectedChart(categoryChartData, true)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', borderLeft: `1px solid ${inputBorder}`, paddingLeft: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Income vs Expense</h4>
                <div style={{ width: '100%', flex: 1, position: 'relative' }}>
                  {renderSelectedChart(incomeVsExpenseData, true)}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;