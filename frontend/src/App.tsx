import React, { useState, useEffect, useCallback } from 'react';
import DailyReportEntry from './components/DailyReportEntry';
import WeeklyReportGenerator from './components/WeeklyReportGenerator';
import WeeklyReportQuery from './components/WeeklyReportQuery';
import OKRGenerator from './components/OKRGenerator';
import CareerAssets from './components/CareerAssets';
import SkillsRadar from './components/SkillsRadar';
import Settings from './components/Settings';
import apiService, { HealthResponse } from './services/api';
import './App.css';

// Get version from package.json
const APP_VERSION = process.env.REACT_APP_VERSION || '0.6.0';

type TabType = 'daily-entry' | 'weekly-report' | 'weekly-query' | 'okr' | 'career-assets' | 'skills-radar' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('daily-entry');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string>('');
  const [llmStatus, setLlmStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking');

  // 检查健康状态（基础连接和LLM配置）
  const checkHealth = useCallback(async () => {
    try {
      const response = await apiService.healthCheck();
      setHealth(response);
      setHealthError('');
      
      // 直接使用后端返回的 llm_configured 状态
      // 后端会检查数据库中保存的配置和环境变量配置
      setLlmStatus(response.llm_configured ? 'configured' : 'not-configured');
    } catch (err) {
      setHealthError('无法连接到后端服务，请确保后端已启动');
      setLlmStatus('not-configured');
    }
  }, []);

  // 刷新 LLM 状态（供 Settings 组件调用）
  const refreshLLMStatus = useCallback(async () => {
    try {
      const response = await apiService.healthCheck();
      setHealth(response);
      setLlmStatus(response.llm_configured ? 'configured' : 'not-configured');
    } catch {
      // 忽略错误
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // 获取 LLM 状态显示文本
  const getLLMStatusDisplay = () => {
    switch (llmStatus) {
      case 'checking':
        return { text: '正在检测 LLM 连接...', className: 'checking' };
      case 'configured':
        return { text: 'LLM 已配置', className: 'configured' };
      case 'not-configured':
        return { text: 'LLM 未配置 (使用模拟模式)', className: 'not-configured' };
    }
  };

  const statusDisplay = getLLMStatusDisplay();

  return (
    <div className="App">
      <header className="App-header">
        <h1>WorkPilot 效能助手</h1>
        <p className="App-subtitle">
          基于 LLM 的智能日报/周报/OKR/职业资产管理工具
        </p>
        {health && (
          <div className={`status-badge ${statusDisplay.className}`}>
            {statusDisplay.text}
          </div>
        )}
        {healthError && (
          <div className="health-error">
            {healthError}
          </div>
        )}
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'daily-entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily-entry')}
        >
          📅 日报录入
        </button>
        <button
          className={`tab-btn ${activeTab === 'weekly-report' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly-report')}
        >
          📋 周报生成
        </button>
        <button
          className={`tab-btn ${activeTab === 'weekly-query' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly-query')}
        >
          🔍 周报查询
        </button>
        <button
          className={`tab-btn ${activeTab === 'okr' ? 'active' : ''}`}
          onClick={() => setActiveTab('okr')}
        >
          🎯 OKR 生成
        </button>
        <button
          className={`tab-btn ${activeTab === 'career-assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('career-assets')}
        >
          💼 简历积木
        </button>
        <button
          className={`tab-btn ${activeTab === 'skills-radar' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills-radar')}
        >
          📊 能力雷达
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 设置
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'daily-entry' && <DailyReportEntry />}
        {activeTab === 'weekly-report' && <WeeklyReportGenerator />}
        {activeTab === 'weekly-query' && <WeeklyReportQuery />}
        {activeTab === 'okr' && <OKRGenerator />}
        {activeTab === 'career-assets' && <CareerAssets />}
        {activeTab === 'skills-radar' && <SkillsRadar />}
        {activeTab === 'settings' && <Settings onLLMConfigured={refreshLLMStatus} />}
      </main>

      <footer className="App-footer">
        <p>
          WorkPilot v{APP_VERSION} | 
          最大输入长度: {health?.max_input_chars || 20000} 字符
        </p>
      </footer>
    </div>
  );
}

export default App;
