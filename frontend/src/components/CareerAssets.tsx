import React, { useState, useEffect } from 'react';
import apiService, { 
  ProjectSummary, 
  ProjectWithWorkItems, 
  ExtractionResult,
  ExtractedWorkItem,
  WorkItem
} from '../services/api';
import './CareerAssets.css';

// 时间线分组类型
type TimelineGroupBy = 'year' | 'quarter' | 'month';

interface TimelineGroup {
  key: string;
  label: string;
  items: WorkItem[];
}

const CareerAssets: React.FC = () => {
  const [activeView, setActiveView] = useState<'projects' | 'timeline'>('projects');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithWorkItems | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // New project modal
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  
  // STAR generation and editing
  const [generatingStar, setGeneratingStar] = useState<boolean>(false);
  const [editingStarSummary, setEditingStarSummary] = useState<boolean>(false);
  const [starSummaryDraft, setStarSummaryDraft] = useState<string>('');
  const [savingStarSummary, setSavingStarSummary] = useState<boolean>(false);
  
  // Extract modal - 改进版：从日报中选择
  const [showExtractModal, setShowExtractModal] = useState<boolean>(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractResult, setExtractResult] = useState<ExtractionResult | null>(null);
  const [extractStep, setExtractStep] = useState<'select' | 'result'>('select');
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState<boolean>(false);

  // Timeline state
  const [timelineGroupBy, setTimelineGroupBy] = useState<TimelineGroupBy>('month');
  const [allWorkItems, setAllWorkItems] = useState<WorkItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);

  // Data cleanup state
  const [showCleanupModal, setShowCleanupModal] = useState<boolean>(false);
  const [similarGroups, setSimilarGroups] = useState<Array<{ recommended_target: any; projects: any[]; project_ids: number[] }>>([]);
  const [loadingCleanup, setLoadingCleanup] = useState<boolean>(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load timeline data when switching to timeline view
  useEffect(() => {
    if (activeView === 'timeline' && allWorkItems.length === 0) {
      loadTimelineData();
    }
  }, [activeView]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-hide error message
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getProjectsSummary();
      if (response.success && response.data) {
        // 过滤掉无效项目名称（null、空、未命名等）
        const validProjects = response.data.filter((project: any) => {
          const name = project.name;  // 使用正确的字段名 name
          if (!name || name === 'null' || name === 'undefined' || name.trim() === '') {
            return false;
          }
          return true;
        });
        setProjects(validProjects);
      }
    } catch (err) {
      setError('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineData = async () => {
    setLoadingTimeline(true);
    try {
      const response = await apiService.getWorkItems();
      if (response.success && response.data) {
        setAllWorkItems(response.data);
      }
    } catch (err) {
      setError('加载时间线数据失败');
    } finally {
      setLoadingTimeline(false);
    }
  };

  // 按时间维度分组工作项
  const groupWorkItemsByTime = (items: WorkItem[], groupBy: TimelineGroupBy): TimelineGroup[] => {
    const groups: Record<string, TimelineGroup> = {};
    
    items.forEach(item => {
      if (!item.raw_log_date) return;
      
      const date = new Date(item.raw_log_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      
      let key: string;
      let label: string;
      
      switch (groupBy) {
        case 'year':
          key = `${year}`;
          label = `${year}年`;
          break;
        case 'quarter':
          key = `${year}-Q${quarter}`;
          label = `${year}年 第${quarter}季度`;
          break;
        case 'month':
        default:
          key = `${year}-${month.toString().padStart(2, '0')}`;
          label = `${year}年${month}月`;
          break;
      }
      
      if (!groups[key]) {
        groups[key] = { key, label, items: [] };
      }
      groups[key].items.push(item);
    });
    
    // 按时间倒序排序
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  };

  const timelineGroups = groupWorkItemsByTime(allWorkItems, timelineGroupBy);

  const handleSelectProject = async (projectId: number) => {
    setLoading(true);
    try {
      const response = await apiService.getProject(projectId);
      if (response.success && response.data) {
        setSelectedProject(response.data);
      }
    } catch (err) {
      setError('加载项目详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const response = await apiService.createProject(newProjectName.trim(), newProjectDesc.trim());
      if (response.success) {
        setShowNewProjectModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        loadProjects();
        setSuccessMessage('项目创建成功');
      }
    } catch (err) {
      setError('创建项目失败');
    }
  };

  const handleGenerateStar = async () => {
    if (!selectedProject) return;
    
    setGeneratingStar(true);
    try {
      const response = await apiService.generateProjectStar(selectedProject.id);
      if (response.success && response.summary) {
        setSelectedProject({
          ...selectedProject,
          star_summary: response.summary
        });
        setSuccessMessage('STAR 摘要生成成功');
      } else {
        setError(response.error || '生成 STAR 总结失败');
      }
    } catch (err) {
      setError('生成 STAR 总结失败');
    } finally {
      setGeneratingStar(false);
    }
  };

  // 打开智能提取弹窗，加载可用日期
  const handleOpenExtractModal = async () => {
    setShowExtractModal(true);
    setExtractStep('select');
    setExtractResult(null);
    setSelectedDates([]);
    setLoadingDailyReports(true);
    
    try {
      const response = await apiService.getDailyReportDates();
      if (response.success && response.data) {
        setAvailableDates(response.data);
      }
    } catch (err) {
      setError('加载日报日期失败');
    } finally {
      setLoadingDailyReports(false);
    }
  };

  // 切换日期选择
  const toggleDateSelection = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedDates.length === availableDates.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates([...availableDates]);
    }
  };

  // 执行智能提取
  const handleExtract = async () => {
    if (selectedDates.length === 0) return;
    
    setExtracting(true);
    setExtractResult(null);
    
    try {
      // 获取选中日期的日报内容
      const sortedDates = [...selectedDates].sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      
      const reportsResponse = await apiService.getDailyReportsByRange(startDate, endDate);
      
      if (!reportsResponse.success || !reportsResponse.data || reportsResponse.data.length === 0) {
        setError('未找到选中日期的日报内容');
        setExtracting(false);
        return;
      }
      
      // 过滤只保留选中的日期
      const selectedReports = reportsResponse.data.filter(r => selectedDates.includes(r.entry_date));
      
      if (selectedReports.length === 0) {
        setError('选中的日期没有日报内容');
        setExtracting(false);
        return;
      }
      
      // 合并所有日报内容并提取
      let allResults: ExtractedWorkItem[] = [];
      let overallQuality: 'good' | 'partial' | 'insufficient' = 'good';
      
      for (const report of selectedReports) {
        const result = await apiService.extractWorkItems(report.content, report.entry_date, true);
        if (result.success) {
          allResults = [...allResults, ...result.work_items];
          if (result.extraction_quality === 'insufficient') {
            overallQuality = 'insufficient';
          } else if (result.extraction_quality === 'partial' && overallQuality !== 'insufficient') {
            overallQuality = 'partial';
          }
        }
      }
      
      setExtractResult({
        success: true,
        work_items: allResults,
        extraction_quality: overallQuality,
        notes: `从 ${selectedReports.length} 天的日报中提取`
      });
      setExtractStep('result');
      loadProjects(); // 刷新项目列表
      
    } catch (err) {
      setError('提取工作项失败');
    } finally {
      setExtracting(false);
    }
  };

  // 关闭提取弹窗
  const handleCloseExtractModal = () => {
    setShowExtractModal(false);
    setExtractResult(null);
    setSelectedDates([]);
    setExtractStep('select');
  };

  const handleArchiveProject = async (projectId: number) => {
    try {
      await apiService.updateProject(projectId, { status: 'archived' });
      loadProjects();
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      setSuccessMessage('项目已归档');
    } catch (err) {
      setError('归档项目失败');
    }
  };

  // 删除项目
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await apiService.deleteProject(projectToDelete.id);
      if (response.success) {
        loadProjects();
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(null);
        }
        setSuccessMessage('项目删除成功');
      } else {
        setError(response.error || '删除项目失败');
      }
    } catch (err) {
      setError('删除项目失败');
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  // 显示删除确认
  const confirmDeleteProject = (project: ProjectSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  // 数据清理：将 null 项目合并到"临时工作"
  const handleCleanupNullProjects = async () => {
    setLoadingCleanup(true);
    try {
      const result = await apiService.cleanupNullProjects();
      if (result.success) {
        setSuccessMessage(result.message);
        loadProjects();
      } else {
        setError(result.message || '清理失败');
      }
    } catch (err) {
      setError('清理失败');
    } finally {
      setLoadingCleanup(false);
    }
  };

  // 加载相似项目分组
  const loadSimilarProjects = async () => {
    setLoadingCleanup(true);
    try {
      const result = await apiService.getSimilarProjects(0.6);
      if (result.success) {
        setSimilarGroups(result.groups);
        setShowCleanupModal(true);
      } else {
        setError('加载相似项目失败');
      }
    } catch (err) {
      setError('加载相似项目失败');
    } finally {
      setLoadingCleanup(false);
    }
  };

  // 合并相似项目
  const handleMergeProjects = async (targetId: number, sourceIds: number[]) => {
    setLoadingCleanup(true);
    try {
      const result = await apiService.mergeProjects(targetId, sourceIds);
      if (result.success) {
        setSuccessMessage(result.message);
        // 重新加载相似项目
        const newResult = await apiService.getSimilarProjects(0.6);
        if (newResult.success) {
          setSimilarGroups(newResult.groups);
        }
        loadProjects();
      } else {
        setError(result.message || '合并失败');
      }
    } catch (err) {
      setError('合并失败');
    } finally {
      setLoadingCleanup(false);
    }
  };

  // 删除全部项目
  const handleDeleteAllProjects = async () => {
    setLoadingCleanup(true);
    try {
      const result = await apiService.deleteAllProjects();
      if (result.success) {
        setSuccessMessage(result.message);
        setProjects([]);
        setSelectedProject(null);
        setAllWorkItems([]);
      } else {
        setError(result.message || '删除失败');
      }
    } catch (err) {
      setError('删除失败');
    } finally {
      setLoadingCleanup(false);
      setShowDeleteAllConfirm(false);
    }
  };

  const handleCopyStar = () => {
    if (selectedProject?.star_summary) {
      navigator.clipboard.writeText(selectedProject.star_summary);
      setSuccessMessage('已复制到剪贴板');
    }
  };

  // 开始编辑摘要
  const handleStartEditStar = () => {
    if (selectedProject?.star_summary) {
      setStarSummaryDraft(selectedProject.star_summary);
      setEditingStarSummary(true);
    }
  };

  // 取消编辑摘要
  const handleCancelEditStar = () => {
    setEditingStarSummary(false);
    setStarSummaryDraft('');
  };

  // 保存编辑后的摘要
  const handleSaveStarSummary = async () => {
    if (!selectedProject) return;
    
    setSavingStarSummary(true);
    try {
      const response = await apiService.updateProject(selectedProject.id, {
        star_summary: starSummaryDraft
      });
      if (response.success) {
        setSelectedProject({
          ...selectedProject,
          star_summary: starSummaryDraft
        });
        setEditingStarSummary(false);
        setStarSummaryDraft('');
        setSuccessMessage('摘要保存成功');
      } else {
        setError(response.error || '保存失败');
      }
    } catch (err) {
      setError('保存摘要失败');
    } finally {
      setSavingStarSummary(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  // 安全解析 JSON 字符串，返回数组
  const safeParseSkillsTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return [];
    try {
      const parsed = JSON.parse(tagsStr);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && s !== 'null' && s !== '待补充');
      }
      return [];
    } catch {
      return [];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#34c759';
      case 'partial': return '#ff9500';
      case 'insufficient': return '#ff3b30';
      default: return '#8e8e93';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'good': return '提取完整';
      case 'partial': return '部分提取';
      case 'insufficient': return '信息不足';
      default: return quality;
    }
  };

  return (
    <div className="career-assets">
      {/* Toast messages */}
      {successMessage && (
        <div className="ca-toast ca-toast-success">{successMessage}</div>
      )}
      {error && (
        <div className="ca-toast ca-toast-error">{error}</div>
      )}

      {/* Header */}
      <div className="ca-header">
        <div className="ca-header-content">
          <h2>简历积木库</h2>
          <p className="ca-subtitle">把日常工作转化为简历素材</p>
        </div>
        <div className="ca-header-actions">
          <button 
            className="ca-btn ca-btn-secondary"
            onClick={handleOpenExtractModal}
          >
            <span className="ca-btn-icon">✨</span>
            智能提取
          </button>
          <button 
            className="ca-btn ca-btn-primary"
            onClick={() => setShowNewProjectModal(true)}
          >
            <span className="ca-btn-icon">+</span>
            新建项目
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="ca-view-toggle">
        <button 
          className={`ca-toggle-btn ${activeView === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveView('projects')}
        >
          项目视图
        </button>
        <button 
          className={`ca-toggle-btn ${activeView === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveView('timeline')}
        >
          时间线
        </button>
        
        {/* Timeline grouping options */}
        {activeView === 'timeline' && (
          <div className="ca-timeline-options">
            <span className="ca-timeline-label">按</span>
            <select 
              value={timelineGroupBy} 
              onChange={(e) => setTimelineGroupBy(e.target.value as TimelineGroupBy)}
              className="ca-timeline-select"
            >
              <option value="month">月</option>
              <option value="quarter">季度</option>
              <option value="year">年</option>
            </select>
            <span className="ca-timeline-label">查看</span>
          </div>
        )}
      </div>

      {error && <div className="ca-error">{error}</div>}

      {/* Main Content - Projects View */}
      {activeView === 'projects' && (
        <div className="ca-main">
          {/* Projects List */}
          <div className="ca-sidebar">
            <div className="ca-sidebar-header">
              <h3>项目列表</h3>
              <span className="ca-count">{projects.length}</span>
              <div className="ca-sidebar-actions">
                <button 
                  className="ca-btn-icon"
                  onClick={handleCleanupNullProjects}
                  disabled={loadingCleanup}
                  title="将未分类工作归类到'临时工作'"
                >
                  🧹
                </button>
                <button 
                  className="ca-btn-icon"
                  onClick={loadSimilarProjects}
                  disabled={loadingCleanup}
                  title="查找并合并相似项目"
                >
                  🔗
                </button>
                <button 
                  className="ca-btn-icon ca-btn-icon-danger"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={loadingCleanup || projects.length === 0}
                  title="删除全部项目"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {loading && !projects.length ? (
              <div className="ca-loading">加载中...</div>
            ) : (
              <div className="ca-project-list">
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className={`ca-project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div className="ca-project-header">
                      <h4>{project.name}</h4>
                      <div className="ca-project-actions">
                        <span className={`ca-status ca-status-${project.status}`}>
                          {project.status === 'active' ? '进行中' : '已归档'}
                        </span>
                        <button 
                          className="ca-btn-icon-only ca-btn-delete"
                          onClick={(e) => confirmDeleteProject(project, e)}
                          title="删除项目"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="ca-project-meta">
                    <span className="ca-meta-item">
                      <span className="ca-meta-icon">📝</span>
                      {project.work_item_count || 0} 条记录
                    </span>
                    {project.last_work_date && (
                      <span className="ca-meta-item">
                        <span className="ca-meta-icon">📅</span>
                        {formatDate(project.last_work_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {!projects.length && !loading && (
                <div className="ca-empty">
                  <div className="ca-empty-icon">📁</div>
                  <p>暂无项目</p>
                  <p className="ca-empty-hint">点击"新建项目"开始</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Detail */}
        <div className="ca-detail">
          {selectedProject ? (
            <>
              <div className="ca-detail-header">
                <div>
                  <h3>{selectedProject.name}</h3>
                  {selectedProject.description && (
                    <p className="ca-description">{selectedProject.description}</p>
                  )}
                </div>
                <div className="ca-detail-actions">
                  <button 
                    className="ca-btn ca-btn-ghost"
                    onClick={() => handleArchiveProject(selectedProject.id)}
                  >
                    归档
                  </button>
                </div>
              </div>

              {/* STAR Summary Section */}
              <div className="ca-star-section">
                <div className="ca-section-header">
                  <h4>
                    <span className="ca-section-icon">⭐</span>
                    STAR 简历摘要
                  </h4>
                  <div className="ca-section-actions">
                    {selectedProject.star_summary && !editingStarSummary && (
                      <>
                        <button 
                          className="ca-btn ca-btn-ghost ca-btn-sm"
                          onClick={handleStartEditStar}
                        >
                          编辑
                        </button>
                        <button 
                          className="ca-btn ca-btn-ghost ca-btn-sm"
                          onClick={handleCopyStar}
                        >
                          复制
                        </button>
                      </>
                    )}
                    {editingStarSummary && (
                      <>
                        <button 
                          className="ca-btn ca-btn-ghost ca-btn-sm"
                          onClick={handleCancelEditStar}
                          disabled={savingStarSummary}
                        >
                          取消
                        </button>
                        <button 
                          className="ca-btn ca-btn-primary ca-btn-sm"
                          onClick={handleSaveStarSummary}
                          disabled={savingStarSummary}
                        >
                          {savingStarSummary ? '保存中...' : '保存'}
                        </button>
                      </>
                    )}
                    {!editingStarSummary && (
                      <button 
                        className="ca-btn ca-btn-primary ca-btn-sm"
                        onClick={handleGenerateStar}
                        disabled={generatingStar || !selectedProject.work_items?.length}
                      >
                        {generatingStar ? '生成中...' : '生成摘要'}
                      </button>
                    )}
                  </div>
                </div>
                
                {editingStarSummary ? (
                  <div className="ca-star-edit">
                    <textarea
                      className="ca-star-textarea"
                      value={starSummaryDraft}
                      onChange={(e) => setStarSummaryDraft(e.target.value)}
                      placeholder="编辑 STAR 摘要..."
                      rows={12}
                    />
                  </div>
                ) : selectedProject.star_summary ? (
                  <div className="ca-star-content">
                    <div className="ca-markdown" dangerouslySetInnerHTML={{ 
                      __html: selectedProject.star_summary
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                        .replace(/- /g, '• ')
                    }} />
                  </div>
                ) : (
                  <div className="ca-star-empty">
                    <p>暂无 STAR 摘要</p>
                    <p className="ca-hint">添加工作记录后，点击"生成摘要"自动创建简历素材</p>
                  </div>
                )}
              </div>

              {/* Work Items */}
              <div className="ca-work-items-section">
                <div className="ca-section-header">
                  <h4>
                    <span className="ca-section-icon">📋</span>
                    工作记录 ({selectedProject.work_items?.length || 0})
                  </h4>
                </div>
                
                <div className="ca-work-items">
                  {selectedProject.work_items?.length ? (
                    selectedProject.work_items.map(item => (
                      <div key={item.id} className="ca-work-item">
                        <div className="ca-work-item-date">
                          {formatDate(item.raw_log_date)}
                        </div>
                        <div className="ca-work-item-content">
                          {item.action && (
                            <p className="ca-work-action">{item.action}</p>
                          )}
                          {item.result_metric && (
                            <p className="ca-work-result">
                              <span className="ca-result-badge">📊</span>
                              {item.result_metric}
                            </p>
                          )}
                          {item.skills_tags && safeParseSkillsTags(item.skills_tags).length > 0 && (
                            <div className="ca-skills">
                              {safeParseSkillsTags(item.skills_tags).map((skill: string, i: number) => (
                                <span key={i} className="ca-skill-tag">{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="ca-empty-items">
                      <p>暂无工作记录</p>
                      <p className="ca-hint">使用"智能提取"从日报中提取工作项</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="ca-no-selection">
              <div className="ca-no-selection-icon">👈</div>
              <h4>选择一个项目</h4>
              <p>从左侧列表选择项目查看详情</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Timeline View */}
      {activeView === 'timeline' && (
        <div className="ca-timeline">
          {loadingTimeline ? (
            <div className="ca-loading">加载中...</div>
          ) : timelineGroups.length === 0 ? (
            <div className="ca-empty">
              <div className="ca-empty-icon">📅</div>
              <p>暂无工作记录</p>
              <p className="ca-empty-hint">使用"智能提取"从日报中提取工作项</p>
            </div>
          ) : (
            <div className="ca-timeline-content">
              {timelineGroups.map(group => (
                <div key={group.key} className="ca-timeline-group">
                  <div className="ca-timeline-header">
                    <h3>{group.label}</h3>
                    <span className="ca-timeline-count">{group.items.length} 条记录</span>
                  </div>
                  <div className="ca-timeline-items">
                    {group.items.map(item => (
                      <div key={item.id} className="ca-timeline-item">
                        <div className="ca-timeline-dot"></div>
                        <div className="ca-timeline-card">
                          <div className="ca-timeline-item-header">
                            <span className="ca-timeline-date">{formatDate(item.raw_log_date)}</span>
                            {item.project_name && item.project_name !== 'null' && (
                              <span className="ca-timeline-project">📁 {item.project_name}</span>
                            )}
                          </div>
                          {item.action && item.action !== 'null' && (
                            <p className="ca-timeline-action">{item.action}</p>
                          )}
                          {item.result_metric && item.result_metric !== 'null' && (
                            <p className="ca-timeline-result">📊 {item.result_metric}</p>
                          )}
                          {item.skills_tags && safeParseSkillsTags(item.skills_tags).length > 0 && (
                            <div className="ca-timeline-skills">
                              {safeParseSkillsTags(item.skills_tags).map((skill: string, i: number) => (
                                <span key={i} className="ca-skill-tag">{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="ca-modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="ca-modal" onClick={e => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>新建项目</h3>
              <button 
                className="ca-modal-close"
                onClick={() => setShowNewProjectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="ca-modal-body">
              <div className="ca-form-group">
                <label>项目名称 *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="如：鉴权系统重构"
                  autoFocus
                />
              </div>
              <div className="ca-form-group">
                <label>项目描述</label>
                <textarea
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="简要描述项目背景和目标..."
                  rows={3}
                />
              </div>
            </div>
            <div className="ca-modal-footer">
              <button 
                className="ca-btn ca-btn-secondary"
                onClick={() => setShowNewProjectModal(false)}
              >
                取消
              </button>
              <button 
                className="ca-btn ca-btn-primary"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extract Modal - 从日报选择日期 */}
      {showExtractModal && (
        <div className="ca-modal-overlay" onClick={handleCloseExtractModal}>
          <div className="ca-modal ca-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>✨ 智能提取工作项</h3>
              <button 
                className="ca-modal-close"
                onClick={handleCloseExtractModal}
              >
                ×
              </button>
            </div>
            <div className="ca-modal-body">
              {extractStep === 'select' && (
                <>
                  <p className="ca-modal-desc">
                    选择要提取的日报日期，AI 将自动分析并提取结构化的工作项信息。
                  </p>
                  
                  {loadingDailyReports ? (
                    <div className="ca-loading-inline">
                      <div className="ca-spinner-small"></div>
                      <span>加载日报列表...</span>
                    </div>
                  ) : availableDates.length === 0 ? (
                    <div className="ca-empty-state">
                      <p>📭 暂无已录入的日报</p>
                      <p className="ca-empty-hint">请先在"周报生成"页面录入每日工作内容</p>
                    </div>
                  ) : (
                    <>
                      <div className="ca-date-selector-header">
                        <span className="ca-date-count">
                          共 {availableDates.length} 条日报，已选择 {selectedDates.length} 条
                        </span>
                        <button 
                          className="ca-btn ca-btn-text"
                          onClick={toggleSelectAll}
                        >
                          {selectedDates.length === availableDates.length ? '取消全选' : '全选'}
                        </button>
                      </div>
                      <div className="ca-date-grid">
                        {availableDates.map(date => (
                          <div 
                            key={date}
                            className={`ca-date-card ${selectedDates.includes(date) ? 'selected' : ''}`}
                            onClick={() => toggleDateSelection(date)}
                          >
                            <span className="ca-date-check">
                              {selectedDates.includes(date) ? '✓' : ''}
                            </span>
                            <span className="ca-date-text">{formatDisplayDate(date)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {extractStep === 'result' && extractResult && (
                <div className="ca-extract-result">
                  <div className="ca-extract-header">
                    <span 
                      className="ca-extract-quality"
                      style={{ color: getStatusColor(extractResult.extraction_quality) }}
                    >
                      {getQualityLabel(extractResult.extraction_quality)}
                    </span>
                    <span className="ca-extract-count">
                      提取到 {extractResult.work_items.length} 个工作项
                    </span>
                  </div>
                  
                  {extractResult.notes && (
                    <p className="ca-extract-notes">{extractResult.notes}</p>
                  )}
                  
                  <div className="ca-extract-items">
                    {extractResult.work_items.map((item, index) => (
                      <div key={index} className="ca-extracted-item">
                        {item.project && item.project !== 'null' && item.project !== 'None' && (
                          <span className="ca-extracted-project">📁 {item.project}</span>
                        )}
                        {item.action && item.action !== 'null' && (
                          <p className="ca-extracted-action">{item.action}</p>
                        )}
                        {item.result_metric && item.result_metric !== 'null' && (
                          <p className="ca-extracted-result">📊 {item.result_metric}</p>
                        )}
                        {item.skills && item.skills.length > 0 && (
                          <div className="ca-extracted-skills">
                            {item.skills
                              .filter(skill => skill && skill !== 'null' && skill !== '待补充')
                              .map((skill, i) => (
                                <span key={i} className="ca-skill-tag">{skill}</span>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="ca-modal-footer">
              {extractStep === 'select' && (
                <>
                  <button 
                    className="ca-btn ca-btn-secondary"
                    onClick={handleCloseExtractModal}
                  >
                    取消
                  </button>
                  <button 
                    className="ca-btn ca-btn-primary"
                    onClick={handleExtract}
                    disabled={extracting || selectedDates.length === 0}
                  >
                    {extracting ? '提取中...' : `提取 ${selectedDates.length} 天的工作项`}
                  </button>
                </>
              )}
              {extractStep === 'result' && (
                <button 
                  className="ca-btn ca-btn-primary"
                  onClick={handleCloseExtractModal}
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="ca-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="ca-modal ca-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>⚠️ 确认删除</h3>
            </div>
            <div className="ca-modal-body">
              <p className="ca-delete-warning">
                确定要删除项目「{projectToDelete.name}」吗？
              </p>
              <p className="ca-delete-hint">
                此操作将同时删除该项目下的所有工作项记录，且无法恢复。
              </p>
            </div>
            <div className="ca-modal-footer">
              <button 
                className="ca-btn ca-btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button 
                className="ca-btn ca-btn-danger"
                onClick={handleDeleteProject}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="ca-modal-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
          <div className="ca-modal ca-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>⚠️ 确认删除全部</h3>
            </div>
            <div className="ca-modal-body">
              <p className="ca-delete-warning">
                确定要删除全部项目吗？
              </p>
              <p className="ca-delete-hint">
                此操作将删除 {projects.length} 个项目及其所有工作记录和技能数据，且<strong>无法恢复</strong>！
              </p>
            </div>
            <div className="ca-modal-footer">
              <button 
                className="ca-btn ca-btn-secondary"
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                取消
              </button>
              <button 
                className="ca-btn ca-btn-danger"
                onClick={handleDeleteAllProjects}
                disabled={loadingCleanup}
              >
                {loadingCleanup ? '删除中...' : '确认删除全部'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Similar Projects Merge Modal */}
      {showCleanupModal && (
        <div className="ca-modal-overlay" onClick={() => setShowCleanupModal(false)}>
          <div className="ca-modal ca-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>🔗 相似项目合并</h3>
              <button className="ca-modal-close" onClick={() => setShowCleanupModal(false)}>×</button>
            </div>
            <div className="ca-modal-body">
              {loadingCleanup ? (
                <div className="ca-loading">处理中...</div>
              ) : similarGroups.length === 0 ? (
                <div className="ca-empty-state">
                  <span className="ca-empty-icon">✅</span>
                  <p>没有发现相似的项目需要合并</p>
                </div>
              ) : (
                <div className="ca-similar-groups">
                  <p className="ca-cleanup-hint">
                    系统发现了 {similarGroups.length} 组相似项目，点击"合并"将把工作记录合并到推荐项目中。
                  </p>
                  {similarGroups.map((group, index) => (
                    <div key={index} className="ca-similar-group">
                      <div className="ca-similar-group-header">
                        <span className="ca-similar-label">推荐保留:</span>
                        <strong>{group.recommended_target.name}</strong>
                        <button
                          className="ca-btn ca-btn-sm ca-btn-primary"
                          onClick={() => handleMergeProjects(
                            group.recommended_target.id,
                            group.project_ids.filter(id => id !== group.recommended_target.id)
                          )}
                          disabled={loadingCleanup}
                        >
                          合并到此项目
                        </button>
                      </div>
                      <div className="ca-similar-projects">
                        {group.projects.filter(p => p.id !== group.recommended_target.id).map((p: any) => (
                          <div key={p.id} className="ca-similar-project-item">
                            <span className="ca-similar-icon">↳</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ca-modal-footer">
              <button 
                className="ca-btn ca-btn-secondary"
                onClick={() => setShowCleanupModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerAssets;
