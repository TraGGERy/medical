'use client';

import { useState } from 'react';

export default function AIPerformance() {
  const [selectedModel, setSelectedModel] = useState('gemini-2.5');
  const [timeRange, setTimeRange] = useState('7d');

  const performanceData = {
    accuracy: 94.2,
    confidence: 87.8,
    responseTime: 1.2,
    flaggedCases: 23,
    totalProcessed: 15234
  };

  const flaggedCases = [
    {
      id: 'RPT-15234',
      date: '2025-01-29',
      condition: 'Chest Pain Assessment',
      confidence: 45.2,
      reason: 'Low confidence score',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'RPT-15233',
      date: '2025-01-29',
      condition: 'Neurological Symptoms',
      confidence: 52.1,
      reason: 'Conflicting indicators',
      status: 'reviewed',
      priority: 'medium'
    },
    {
      id: 'RPT-15232',
      date: '2025-01-28',
      condition: 'Skin Condition',
      confidence: 38.7,
      reason: 'Unusual symptom combination',
      status: 'pending',
      priority: 'high'
    }
  ];

  const modelPerformance = [
    { model: 'Gemini 2.5', accuracy: 94.2, speed: 1.2, cost: '$0.003' },
    { model: 'OpenAI o3', accuracy: 91.8, speed: 2.1, cost: '$0.008' },
    { model: 'Claude 3', accuracy: 89.5, speed: 1.8, cost: '$0.005' }
  ];

  const handleReviewCase = (caseId: string, action: 'approve' | 'reject' | 'flag') => {
    alert(`Case ${caseId} ${action}ed`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">AI Performance Metrics</h1>
          <p className="text-gray-600">Monitor AI accuracy, speed, and quality metrics</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="gemini-2.5">Gemini 2.5</option>
            <option value="openai-o3">OpenAI o3</option>
            <option value="claude-3">Claude 3</option>
          </select>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Accuracy</h3>
            <span className="text-green-600 text-xs">+0.8%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{performanceData.accuracy}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${performanceData.accuracy}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Avg Confidence</h3>
            <span className="text-green-600 text-xs">+2.1%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{performanceData.confidence}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${performanceData.confidence}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Response Time</h3>
            <span className="text-green-600 text-xs">-0.3s</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{performanceData.responseTime}s</p>
          <p className="text-xs text-gray-500 mt-1">avg response</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Flagged Cases</h3>
            <span className="text-red-600 text-xs">+5</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{performanceData.flaggedCases}</p>
          <p className="text-xs text-gray-500 mt-1">need review</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Processed</h3>
            <span className="text-green-600 text-xs">+12.5%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{performanceData.totalProcessed.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">this period</p>
        </div>
      </div>

      {/* Model Comparison */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Model Performance Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Model</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Accuracy</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Avg Speed</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Cost per Query</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {modelPerformance.map((model, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        model.model === 'Gemini 2.5' ? 'bg-green-500' : 
                        model.model === 'OpenAI o3' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-800">{model.model}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-800">{model.accuracy}%</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{model.speed}s</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{model.cost}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagged Cases for Review */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Cases Flagged for Manual Review</h2>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Filter
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
              Bulk Review
            </button>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {flaggedCases.map((case_item) => (
            <div key={case_item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800">{case_item.id}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                      case_item.priority === 'high' ? 'bg-red-100 text-red-800' :
                      case_item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {case_item.priority} priority
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                      case_item.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {case_item.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{case_item.condition}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>📅 {case_item.date}</span>
                    <span>🎯 {case_item.confidence}% confidence</span>
                    <span>⚠️ {case_item.reason}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleReviewCase(case_item.id, 'approve')}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReviewCase(case_item.id, 'flag')}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    🏃 Flag
                  </button>
                  <button
                    onClick={() => handleReviewCase(case_item.id, 'reject')}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Accuracy Trend</h2>
          
          <div className="space-y-3">
            {[
              { date: 'Jan 29', accuracy: 94.2 },
              { date: 'Jan 28', accuracy: 93.8 },
              { date: 'Jan 27', accuracy: 94.5 },
              { date: 'Jan 26', accuracy: 93.1 },
              { date: 'Jan 25', accuracy: 92.9 }
            ].map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-12 text-xs text-gray-600">{item.date}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${item.accuracy}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-xs text-gray-600 text-right">{item.accuracy}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Feedback Scores</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Positive Feedback</p>
                <p className="text-sm text-gray-600">Users satisfied with results</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">87.3%</p>
                <p className="text-xs text-green-600">+2.1%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Neutral Feedback</p>
                <p className="text-sm text-gray-600">Mixed or unclear responses</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">9.2%</p>
                <p className="text-xs text-yellow-600">-0.5%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Negative Feedback</p>
                <p className="text-sm text-gray-600">Users dissatisfied</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">3.5%</p>
                <p className="text-xs text-red-600">-1.6%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}