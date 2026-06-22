import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [expenses, setExpenses] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary/Job'); 
  const [chartType, setChartType] = useState('pie');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Local storage backup to remember categories by title names
  const [localCats, setLocalCats] = useState(() => {
    const saved = localStorage.getItem('my_tracker_cats');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!text || !amount) return alert("Please fill all fields!");
    
    // We only send 'text' and 'amount' because your original server only accepts these two fields!
    const newEntry = {
      text: text,
      amount: Number(amount)
    };

    try {
      const res = await axios.post('http://localhost:5000/api/expenses', newEntry);
      
      // Save the category inside browser memory mapped with the exact Description text
      const updatedCats = { ...localCats, [text.toLowerCase().trim()]: category };
      setLocalCats(updatedCats);
      localStorage.setItem('my_tracker_cats', JSON.stringify(updatedCats));

      // Refresh the UI list
      if (res.data) {
        setExpenses(prev => [...prev, res.data]);
      } else {
        fetchExpenses();
      }

      setText(''); 
      setAmount('');
      setCategory('Salary/Job');
    } catch (err) {
      alert("Error adding entry");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      setExpenses(expenses.filter(item => item.id !== id));
    } catch (err) {
      alert("Error deleting entry");
    }
  };

  // Maps and reads category names properly without database support
  const displayCategory = (item) => {
    const title = item.text ? item.text.toLowerCase().trim() : '';
    
    // 1. Check if the description is saved in browser memory
    if (localCats[title]) return localCats[title];

    // 2. Fallback smart keywords matching
    if (title.includes('pizza') || title.includes('food') || title.includes('apple') || title.includes('burger') || title.includes('mongo')) {
      return 'Food';
    }
    if (title.includes('dress') || title.includes('cloth') || title.includes('shopping')) {
      return 'Shopping';
    }
    if (title.includes('car') || title.includes('bike')) {
      return 'Entertainment';
    }
    if (title.includes('rent') || title.includes('room')) {
      return 'Rent';
    }
    
    return 'Others';
  };

  const income = expenses.filter(item => item.amount > 0).reduce((acc, item) => acc + item.amount, 0);
  const expense = expenses.filter(item => item.amount < 0).reduce((acc, item) => acc + item.amount, 0);
  const total = income + expense;

  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = item.text ? item.text.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesFilter = filterType === 'all' ? true : 
                          filterType === 'income' ? item.amount > 0 : item.amount < 0;
    return matchesSearch && matchesFilter;
  });

  const chartData = {
    labels: ['Income', 'Expense'],
    datasets: [{
      data: [income, Math.abs(expense)],
      backgroundColor: ['#2ecc71', '#e74c3c'],
      borderColor: ['#27ae60', '#c0392b'],
      borderWidth: 1
    }]
  };

  const commonOptions = { 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: isDarkMode ? '#fff' : '#333' } } }
  };

  const renderChart = () => {
    if (income === 0 && expense === 0) return <p style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>No Data Available</p>;
    switch (chartType) {
      case 'pie': return <PieChart data={chartData} options={commonOptions} />;
      case 'bar': return <BarChart data={chartData} options={commonOptions} />;
      case 'line': return <LineChart data={chartData} options={commonOptions} />;
      case 'doughnut': return <DoughnutChart data={chartData} options={commonOptions} />;
      case 'polar': return <PolarChart data={chartData} options={commonOptions} />;
      default: return <PieChart data={chartData} options={commonOptions} />;
    }
  };

  const boxBg = isDarkMode ? '#2d2d2d' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#2c3e50';
  const subTextColor = isDarkMode ? '#b3b3b3' : '#7f8c8d';
  const inputBg = isDarkMode ? '#3d3d3d' : '#fff';
  const inputBorder = isDarkMode ? '#555' : '#ddd';

  return (
    <div style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#f4f7f6', minHeight: '100vh', padding: '15px 25px', fontFamily: '"Segoe UI", Roboto, sans-serif', color: isDarkMode ? '#fff' : '#000', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', maxWidth: '1200px', margin: '0 auto 15px auto' }}>
        <h1 style={{ margin: 0, color: textColor, fontSize: '24px', fontWeight: 'bold' }}>📊 Expense Tracker Dashboard</h1>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: isDarkMode ? '#fff' : '#2c3e50', color: isDarkMode ? '#2c3e50' : '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
        >
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '1200px', margin: '0 auto 15px auto' }}>
        <div style={{ backgroundColor: boxBg, padding: '12px', borderRadius: '6px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)', borderLeft: '4px solid #2ecc71', textAlign: 'center' }}>
          <span style={{ color: subTextColor, fontSize: '11px', fontWeight: 'bold' }}>TOTAL INCOME</span>
          <h3 style={{ margin: '3px 0 0 0', color: '#2ecc71', fontSize: '20px' }}>₹{income.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: boxBg, padding: '12px', borderRadius: '6px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)', borderLeft: '4px solid #e74c3c', textAlign: 'center' }}>
          <span style={{ color: subTextColor, fontSize: '11px', fontWeight: 'bold' }}>TOTAL EXPENSES</span>
          <h3 style={{ margin: '3px 0 0 0', color: '#e74c3c', fontSize: '20px' }}>₹{Math.abs(expense).toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: boxBg, padding: '12px', borderRadius: '6px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)', borderLeft: '4px solid #3498db', textAlign: 'center' }}>
          <span style={{ color: subTextColor, fontSize: '11px', fontWeight: 'bold' }}>NET BALANCE</span>
          <h3 style={{ margin: '3px 0 0 0', color: '#3498db', fontSize: '20px' }}>₹{total.toFixed(2)}</h3>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Left Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Add Transaction Form */}
          <div style={{ backgroundColor: boxBg, padding: '18px', borderRadius: '6px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: textColor }}>➕ Add Transaction</h3>
            <form onSubmit={addExpense}>
              <input type="text" placeholder="Description / Title" value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, boxSizing: 'border-box', fontSize: '13px' }} />
              <input type="number" placeholder="Amount (negative for expense)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, boxSizing: 'border-box', fontSize: '13px' }} />
              
              <label style={{ fontSize: '12px', color: subTextColor, display: 'block', marginBottom: '4px' }}>Choose Category:</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '13px', cursor: 'pointer' }}>
                <option value="Salary/Job">Salary/Job</option>
                <option value="Food">Food</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Rent">Rent</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills/Utilities">Bills/Utilities</option>
                <option value="Others">Others</option>
              </select>
              
              <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Add Data</button>
            </form>
          </div>

          {/* Visual Analytics Box */}
          <div style={{ backgroundColor: boxBg, padding: '15px', borderRadius: '6px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: textColor }}>📉 Visual Analytics</h3>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                <option value="pie">Pie Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="doughnut">Doughnut</option>
                <option value="polar">Polar Area</option>
              </select>
            </div>
            <div style={{ height: '160px', width: '100%' }}>
              {renderChart()}
            </div>
          </div>

        </div>

        {/* Right Side: Table History */}
        <div style={{ backgroundColor: boxBg, padding: '18px', borderRadius: '6px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: textColor }}>📋 Transaction History</h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" placeholder="🔍 Search title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 2, padding: '7px 10px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px' }} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ flex: 1, padding: '7px', borderRadius: '4px', border: `1px solid ${inputBorder}`, backgroundColor: inputBg, color: textColor, fontSize: '12px' }}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '310px' }}>
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
                        {displayCategory(item)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 4px', color: subTextColor, fontSize: '11px' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
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
    </div>
  );
}

export default App;