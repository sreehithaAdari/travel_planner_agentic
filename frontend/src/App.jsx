import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [formData, setFormData] = useState({
    destination: '',
    days: 3,
    people: 2,
    adults: 2,
    children: 0,
    budget: 1000,
    travel_type: 'budget-friendly'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ['days', 'people', 'adults', 'children', 'budget'].includes(name) ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/planner/generate', formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred while generating the plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div>
        <h1>AI Travel Genie</h1>
        <p className="subtitle">Your personalized, agentic trip planner</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group full-width">
          <label>Destination</label>
          <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="e.g. Paris, Tokyo, Bali" required />
        </div>
        
        <div className="form-group">
          <label>Number of Days</label>
          <input type="number" name="days" value={formData.days} onChange={handleChange} min="1" required />
        </div>

        <div className="form-group">
          <label>Total People</label>
          <input type="number" name="people" value={formData.people} onChange={handleChange} min="1" required />
        </div>

        <div className="form-group">
          <label>Adults</label>
          <input type="number" name="adults" value={formData.adults} onChange={handleChange} min="1" required />
        </div>

        <div className="form-group">
          <label>Children</label>
          <input type="number" name="children" value={formData.children} onChange={handleChange} min="0" required />
        </div>

        <div className="form-group">
          <label>Budget (USD)</label>
          <input type="number" name="budget" value={formData.budget} onChange={handleChange} min="1" required />
        </div>

        <div className="form-group">
          <label>Travel Style</label>
          <select name="travel_type" value={formData.travel_type} onChange={handleChange}>
            <option value="luxury">Luxury</option>
            <option value="budget-friendly">Budget-Friendly</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Consulting Agents...' : 'Generate Itinerary'}
        </button>
      </form>

      {error && (
        <div className="result-section" style={{ borderColor: 'var(--accent)' }}>
          <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--secondary)', fontWeight: 600 }}>Analyzing budget & curating the perfect experience...</p>
        </div>
      )}

      {result && !loading && (
        <div className="result-section">
          <div className="result-header">
            <div>
              <h2 style={{ margin: 0 }}>Proposed Plan</h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Cost: ${result.estimated_cost?.toFixed(2)}</span>
            </div>
            <div className={`status-badge ${result.budget_sufficient ? 'success' : 'warning'}`}>
              {result.budget_sufficient ? 'Budget Sufficient' : 'Budget Adjusted'}
            </div>
          </div>
          
          <div className="markdown-content" style={{ whiteSpace: 'pre-wrap' }}>
            {result.final_itinerary}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
