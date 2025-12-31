import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './Settings.css';

interface LLMConfig {
  api_url: string;
  api_key: string;
  model: string;
}

interface SettingsProps {
  onLLMConfigured?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLLMConfigured }) => {
  const [config, setConfig] = useState<LLMConfig>({
    api_url: '',
    api_key: '',
    model: 'default/deepseek-v3-2'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load current config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLLMConfig();
      if (response.success && response.data) {
        setConfig({
          api_url: response.data.api_url || '',
          api_key: response.data.api_key || '',
          model: response.data.model || 'default/deepseek-v3-2'
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage({ type: 'error', text: '加载配置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.api_url.trim()) {
      setMessage({ type: 'error', text: '请填写 API URL' });
      return;
    }
    if (!config.api_key.trim()) {
      setMessage({ type: 'error', text: '请填写 API Key' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await apiService.saveLLMConfig(config);
      if (response.success) {
        setMessage({ type: 'success', text: '配置保存成功！' });
        // 保存成功后刷新 LLM 状态
        if (onLLMConfigured) {
          onLLMConfigured();
        }
      } else {
        setMessage({ type: 'error', text: response.error || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请检查网络连接' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.api_url.trim() || !config.api_key.trim()) {
      setTestResult({ success: false, message: '请先填写 API URL 和 API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await apiService.testLLMConfig(config);
      if (response.success) {
        setTestResult({ success: true, message: 'LLM 连接测试成功！' });
        // 测试成功后刷新 LLM 状态
        if (onLLMConfigured) {
          onLLMConfigured();
        }
      } else {
        setTestResult({ success: false, message: response.error || 'LLM 连接测试失败' });
      }
    } catch (error) {
      setTestResult({ success: false, message: '测试失败，请检查网络连接' });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setConfig({
      api_url: '',
      api_key: '',
      model: 'default/deepseek-v3-2'
    });
    setTestResult(null);
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">加载配置中...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h2>⚙️ 系统配置</h2>
      <p className="settings-description">
        在此页面配置 LLM（大语言模型）的 API 连接信息，配置后即可使用 AI 智能生成功能。
      </p>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>🤖 LLM 配置</h3>
          <span className="settings-hint">用于周报生成、OKR 生成等 AI 功能</span>
        </div>

        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="api_url">
              API URL <span className="required">*</span>
            </label>
            <input
              id="api_url"
              type="text"
              value={config.api_url}
              onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
              placeholder="例如: https://api.openai.com/v1"
            />
            <span className="form-hint">
              LLM API 的基础 URL 地址，无需包含 /chat/completions（支持 OpenAI 兼容接口）
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="api_key">
              API Key <span className="required">*</span>
            </label>
            <div className="input-with-toggle">
              <input
                id="api_key"
                type={showApiKey ? 'text' : 'password'}
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                placeholder="输入您的 API Key"
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '🙈 隐藏' : '👁️ 显示'}
              </button>
            </div>
            <span className="form-hint">
              您的 LLM API 访问密钥，将安全存储在本地
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="model">模型名称</label>
            <input
              id="model"
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="例如: gpt-4 或 deepseek-v3"
            />
            <span className="form-hint">
              要使用的模型名称（根据您的 API 提供商而定）
            </span>
          </div>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
        )}

        <div className="settings-actions">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={saving || testing}
          >
            重置
          </button>
          <button
            className="btn btn-outline"
            onClick={handleTest}
            disabled={saving || testing}
          >
            {testing ? '测试中...' : '🔗 测试连接'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || testing}
          >
            {saving ? '保存中...' : '💾 保存配置'}
          </button>
        </div>
      </div>

      <div className="settings-info">
        <h4>📝 配置说明</h4>
        <ul>
          <li>
            <strong>API URL：</strong>填写 LLM 服务的基础地址（如 https://api.openai.com/v1），系统会自动添加 /chat/completions 路径。
          </li>
          <li>
            <strong>API Key：</strong>您的 API 访问密钥，配置后存储在本地服务器中。
          </li>
          <li>
            <strong>模型名称：</strong>指定要使用的模型，如 gpt-4、deepseek-v3 等。
          </li>
        </ul>
        <p className="settings-warning">
          ⚠️ 注意：API Key 是敏感信息，请确保不要泄露给他人。
        </p>
      </div>
    </div>
  );
};

export default Settings;
