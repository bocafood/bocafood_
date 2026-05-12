// js/modules/temporadas.js
window.Modules = window.Modules || {};
Modules.Temporadas = (function () {
  'use strict';

  var _tenantId = '';
  var _loading = false;
  var _error = null;
  var _state = {
    seasons: [],
    activeSeason: null,
    activeConflict: false,
    scheduledStartConflict: false,
    moduleTab: 'current',
    activeTab: 'overview',
    snapshots: {
      daily: null,
      weekly: null
    }
  };

  var _wizard = null;
  var _celebratedFinalResults = {};
  var _goalCelebrationsInMemory = {};
  var _goalCelebrationCheckRunning = false;
  var _lastGoalCelebrationCheckAt = 0;

  var ALLOWED_STATUS = {
    draft: true,
    scheduled: true,
    active: true,
    finished: true,
    abandoned: true
  };

  var OBJECTIVES = [
    { value: 'sell_more', label: 'Vender Mais', text: 'Foco em faturamento, pedidos e dias com venda.', metric: 'revenue' },
    { value: 'increase_ticket', label: 'Aumentar Ticket', text: 'Foco em ticket médio, valor por pedido e adicionais.', metric: 'averageTicket' },
    { value: 'retain_customers', label: 'Fidelizar Clientes', text: 'Foco em recorrência, recompra e frequência.', metric: 'recurringCustomers' },
    { value: 'improve_consistency', label: 'Melhorar Consistência', text: 'Foco em dias ativos, regularidade e redução de dias fracos.', metric: 'activeDays' }
  ];

  var DURATIONS = [
    { value: 'sprint', label: 'Sprint', text: '30 dias', days: 30 },
    { value: 'season', label: 'Temporada', text: '90 dias', days: 90 }
  ];

  var TARGET_MODES = [
    { value: 'automatic', label: 'Meta automática', text: 'BocaFood calcula com base no histórico recente da loja.' },
    { value: 'fixed', label: 'Meta fixa', text: 'Você informa a meta manualmente para esta temporada.' }
  ];

  var DIFFICULTIES = [
    { value: 'safe', label: 'Seguro', text: 'Exigência conservadora e menor pressão operacional.' },
    { value: 'balanced', label: 'Equilibrado', text: 'Ritmo intermediário para evolução consistente.' },
    { value: 'aggressive', label: 'Agressivo', text: 'Meta mais exigente e menor tolerância a desvio.' }
  ];

  var BUILDS = [
    { value: 'volume', label: 'Volume', text: 'Prioriza pedidos, frequência e dias ativos.' },
    { value: 'margin', label: 'Margem', text: 'Prioriza ticket, valor por pedido e margem estimada.' },
    { value: 'retention', label: 'Fidelização', text: 'Prioriza recompra, clientes recorrentes e frequência.' }
  ];

  function render() {
    _tenantId = (window.Auth && typeof Auth.getTenantId === 'function') ? (Auth.getTenantId() || '') : '';

    var app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = '' +
      '<section class="module-page seasons-page">' +
        '<div class="seasons-hero">' +
          '<div class="seasons-hero-copy">' +
            '<div class="seasons-kicker">' + _icon('track_changes') + ' Missões Operacionais</div>' +
            '<h1>Temporadas</h1>' +
            '<p>Crie missões de 30 ou 90 dias para acompanhar metas reais do negócio.</p>' +
          '</div>' +
          '<button class="seasons-primary-action" type="button" onclick="Modules.Temporadas.openCreateFlow()">' +
            _icon('add') +
            '<span>Nova Temporada</span>' +
          '</button>' +
        '</div>' +
        '<div id="seasons-module-tabs">' + _moduleTabs() + '</div>' +
        '<div class="seasons-shell seasons-shell-single">' +
          '<div id="seasons-active-slot">' + _loadingCard() + '</div>' +
          '<div id="seasons-scheduled-slot">' + _scheduledLoadingCard() + '</div>' +
          '<div id="seasons-history-slot">' + _historyLoadingCard() + '</div>' +
        '</div>' +
      '</section>';

    _loadSeasons();
  }

  function _loadSeasons() {
    _loading = true;
    _error = null;
    _paint();

    if (!_tenantId || !window.DB || typeof DB.getAll !== 'function') {
      _loading = false;
      _error = new Error('Tenant não identificado ou DB indisponível.');
      _state.seasons = [];
      _state.activeSeason = null;
      _state.activeConflict = false;
      _state.scheduledStartConflict = false;
      _state.snapshots = { daily: null, weekly: null };
      _paint();
      return;
    }

    DB.getAll('seasons').then(function (seasons) {
      _state.seasons = _normalizeSeasons(seasons || []);
      return _promoteDueScheduledSeasons(_state.seasons);
    }).then(function (seasons) {
      _state.seasons = _normalizeSeasons(seasons || _state.seasons || []);
      _refreshSeasonStateFlags();
      if (!_state.activeSeason) return null;
      return _refreshActiveSeasonMetrics(_state.activeSeason).then(function (season) {
        if (season) {
          _state.activeSeason = season;
          _state.seasons = _state.seasons.map(function (item) {
            return item.id === season.id ? season : item;
          });
        }
        return season;
      });
    }).then(function () {
      _loading = false;
      _paint();
    }).catch(function (err) {
      console.error('Temporadas load error', err);
      _loading = false;
      _error = err;
      _state.seasons = [];
      _state.activeSeason = null;
      _state.activeConflict = false;
      _state.scheduledStartConflict = false;
      _state.snapshots = { daily: null, weekly: null };
      _paint();
    });
  }

  function _paint() {
    var activeSlot = document.getElementById('seasons-active-slot');
    var scheduledSlot = document.getElementById('seasons-scheduled-slot');
    var historySlot = document.getElementById('seasons-history-slot');
    var tabsSlot = document.getElementById('seasons-module-tabs');
    if (!activeSlot || !scheduledSlot || !historySlot) return;
    var shell = activeSlot.parentNode;
    var activeModuleTab = _validModuleTab(_state.moduleTab);
    _state.moduleTab = activeModuleTab;
    if (tabsSlot) tabsSlot.innerHTML = _moduleTabs();

    if (_loading) {
      if (shell) shell.classList.add('seasons-shell-single');
      activeSlot.style.display = activeModuleTab === 'current' ? '' : 'none';
      scheduledSlot.style.display = activeModuleTab === 'scheduled' ? '' : 'none';
      historySlot.style.display = activeModuleTab === 'history' ? '' : 'none';
      activeSlot.innerHTML = _loadingCard();
      scheduledSlot.innerHTML = _scheduledLoadingCard();
      historySlot.innerHTML = _historyLoadingCard();
      return;
    }

    if (_error) {
      if (shell) shell.classList.add('seasons-shell-single');
      activeSlot.style.display = activeModuleTab === 'current' ? '' : 'none';
      scheduledSlot.style.display = activeModuleTab === 'scheduled' ? '' : 'none';
      historySlot.style.display = activeModuleTab === 'history' ? '' : 'none';
      activeSlot.innerHTML = _errorCard(_error);
      scheduledSlot.innerHTML = _scheduledCard([]);
      historySlot.innerHTML = _historyCard([]);
      return;
    }

    if (shell) shell.classList.add('seasons-shell-single');
    activeSlot.innerHTML = _state.activeSeason ? _activeSeasonCard(_state.activeSeason) : _emptyActiveCard();
    scheduledSlot.innerHTML = _scheduledCard(_scheduledSeasons());
    historySlot.innerHTML = _historyCard(_historySeasons());

    if (activeModuleTab === 'scheduled') {
      activeSlot.style.display = 'none';
      scheduledSlot.style.display = '';
      historySlot.style.display = 'none';
    } else if (activeModuleTab === 'history') {
      activeSlot.style.display = 'none';
      scheduledSlot.style.display = 'none';
      historySlot.style.display = '';
    } else {
      activeSlot.style.display = '';
      scheduledSlot.style.display = 'none';
      historySlot.style.display = 'none';
    }
  }

  function _moduleTabs() {
    var tab = _validModuleTab(_state.moduleTab);
    var items = [
      { key: 'current', label: 'Ativa', icon: 'track_changes' },
      { key: 'scheduled', label: 'Programadas', icon: 'event_upcoming' },
      { key: 'history', label: 'Histórico', icon: 'history' }
    ];
    return '<nav class="seasons-module-tabs" aria-label="Seções de Temporadas">' + items.map(function (item) {
      return '<button type="button" class="' + (tab === item.key ? 'active' : '') + '" onclick="Modules.Temporadas._setModuleTab(\'' + item.key + '\')">' + _icon(item.icon) + _esc(item.label) + '</button>';
    }).join('') + '</nav>';
  }

  function _validModuleTab(tab) {
    return ({ current: true, scheduled: true, history: true })[tab] ? tab : 'current';
  }

  function _setModuleTab(tab) {
    _state.moduleTab = _validModuleTab(tab);
    _paint();
  }

  function _loadingCard() {
    return '' +
      '<section class="seasons-active-card" aria-label="Carregando temporada ativa">' +
        '<div class="seasons-loading-box">' +
          _icon('hourglass_top') +
          '<div><strong>Carregando Temporadas</strong><p>Buscando temporadas do tenant atual.</p></div>' +
        '</div>' +
      '</section>';
  }

  function _historyLoadingCard() {
    return '' +
      '<section class="seasons-history-card" aria-label="Carregando histórico">' +
        '<div class="seasons-card-head">' +
          '<div><span class="seasons-section-label">Histórico</span><h2>Temporadas anteriores</h2></div>' +
        '</div>' +
        '<div class="seasons-history-empty">' + _icon('hourglass_top') + '<div><strong>Carregando histórico</strong><p>Aguardando retorno da coleção seasons.</p></div></div>' +
      '</section>';
  }

  function _scheduledLoadingCard() {
    return '' +
      '<section class="seasons-history-card" aria-label="Carregando temporadas programadas">' +
        '<div class="seasons-card-head">' +
          '<div><span class="seasons-section-label">Programadas</span><h2>Temporadas futuras</h2></div>' +
        '</div>' +
        '<div class="seasons-history-empty">' + _icon('hourglass_top') + '<div><strong>Carregando programadas</strong><p>Aguardando retorno da coleção seasons.</p></div></div>' +
      '</section>';
  }

  function _errorCard(err) {
    return '' +
      '<section class="seasons-active-card" aria-label="Erro ao carregar temporadas">' +
        '<div class="seasons-loading-box seasons-error-box">' +
          _icon('error') +
          '<div><strong>Não foi possível carregar Temporadas</strong><p>' + _esc((err && err.message) || err || 'Erro desconhecido') + '</p></div>' +
        '</div>' +
      '</section>';
  }

  function _emptyActiveCard() {
    return '' +
      '<section class="seasons-active-card" aria-label="Temporada ativa">' +
        '<div class="seasons-active-grid">' +
          '<div class="seasons-empty-mark">' + _icon('flag') + '</div>' +
          '<div class="seasons-empty-copy">' +
            '<span class="seasons-section-label">Temporada ativa</span>' +
            '<h2>Nenhuma temporada ativa</h2>' +
            '<p>A estrutura inicial está pronta. Na próxima fase, esta área exibirá objetivo, estratégia, dificuldade, progresso, score, status e dias restantes.</p>' +
            '<div class="seasons-readiness-row">' +
              '<span>' + _icon('verified') + ' Tenant carregado</span>' +
              '<span>' + _icon('timer') + ' Ciclos de 30 ou 90 dias</span>' +
              '<span>' + _icon('analytics') + ' Dados reais do sistema</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function _activeSeasonCard(season) {
    var metrics = season.currentMetrics || {};
    var snapshots = season.snapshotState || _state.snapshots || {};
    var recommendation = _recommendationFromSnapshots(snapshots);
    var tab = _validSeasonTab(season, _state.activeTab);
    return '' +
      '<section class="seasons-active-card" aria-label="Temporada ativa">' +
        _seasonHud(season, metrics) +
        (_state.activeConflict ? '<div class="seasons-warning-line">' + _icon('warning') + ' Mais de uma temporada ativa foi encontrada neste tenant. A próxima fase deve corrigir o dado antes de iniciar outra temporada.</div>' : '') +
        _seasonTabs(season, tab) +
        '<div class="seasons-tab-panel">' + _seasonTabContent(tab, season, metrics, snapshots, recommendation) + '</div>' +
      '</section>';
  }

  function _seasonHud(season, metrics) {
    var progress = _number(season.progressPercent, 0);
    return '' +
      '<div class="seasons-hud">' +
        '<div class="seasons-hud-main">' +
          '<span class="seasons-section-label">Painel da Temporada</span>' +
          '<h2>' + _esc(season.title || 'Temporada sem título') + '</h2>' +
          '<p>' + _esc(_formatPeriod(season.startDate, season.endDate)) + '</p>' +
          '<div class="seasons-hud-tags">' +
            _hudTag('Objetivo', _objectiveLabel(season.objective)) +
            _hudTag('Estratégia', _buildLabel(season.build)) +
            _hudTag('Dificuldade', _difficultyLabel(season.difficulty)) +
          '</div>' +
        '</div>' +
        '<div class="seasons-hud-metrics">' +
          _hudMetric('Score', Math.round(_number(season.currentScore, 0))) +
          _hudMetric('Ritmo Atual', _statusScoreLabel(season.currentStatus)) +
          _hudMetric('Progresso', Math.round(progress) + '%') +
          _hudMetric('Dias restantes', _number(metrics.daysRemaining, 0)) +
        '</div>' +
        '<div class="seasons-hud-actions">' +
          '<button class="seasons-help-button" type="button" onclick="Modules.Temporadas.openHelpModal()" aria-label="Como ler esta temporada"><span>?</span> Como ler</button>' +
          (season.status === 'active' ? '<button class="seasons-secondary-button seasons-finish-button" type="button" onclick="Modules.Temporadas.finishActiveSeason()">' + _icon('flag_check') + ' Finalizar</button>' : '') +
        '</div>' +
      '</div>';
  }

  function _hudTag(label, value) {
    return '<span><small>' + _esc(label) + '</small>' + _esc(value) + '</span>';
  }

  function _hudMetric(label, value) {
    return '<div><small>' + _esc(label) + '</small><strong>' + _esc(value === 0 ? '0' : value || '0') + '</strong></div>';
  }

  function _seasonTabs(season, activeTab) {
    var tabs = [
      { key: 'overview', label: 'Visão Geral', icon: 'dashboard' },
      { key: 'next', label: 'Próxima Jogada', icon: 'assistant_direction' },
      { key: 'analysis', label: 'Análises', icon: 'monitoring' }
    ];
    if (season.status === 'finished') tabs.push({ key: 'final', label: 'Resultado Final', icon: 'flag_check' });
    return '<nav class="seasons-inner-tabs" aria-label="Navegação da temporada">' + tabs.map(function (tab) {
      return '<button type="button" class="' + (activeTab === tab.key ? 'active' : '') + '" onclick="Modules.Temporadas._setSeasonTab(\'' + tab.key + '\')">' + _icon(tab.icon) + _esc(tab.label) + '</button>';
    }).join('') + '</nav>';
  }

  function _seasonTabContent(tab, season, metrics, snapshots, recommendation) {
    if (tab === 'next') return _nextMoveTab(season, metrics, recommendation);
    if (tab === 'analysis') return _analysisTab(season, snapshots);
    if (tab === 'final') return _finalResultInline(season);
    return _overviewTab(season, metrics, snapshots);
  }

  function _overviewTab(season, metrics, snapshots) {
    var progress = _number(season.progressPercent, 0);
    var primaryLabels = _primaryMetricLabels(season.objective);
    return '' +
      '<div class="seasons-tab-header"><span class="seasons-section-label">Dados do Sistema</span><h3>Como minha temporada está agora?</h3><p>Leitura automática calculada pelo BocaFood a partir dos dados reais do tenant.</p></div>' +
      '<div class="seasons-live-grid seasons-overview-grid">' +
        _metricTile('Progresso', Math.round(progress) + '%', 'trending_up', '', true, _metricBalloon('Progresso', Math.round(progress) + '%', _progressBalloonText(season, metrics, progress))) +
        _metricTile('Score', Math.round(_number(season.currentScore, 0)), 'speed', '', false, _metricBalloon('Score', Math.round(_number(season.currentScore, 0)) + '/100', _scoreBalloonText(season, metrics))) +
        _metricTile('Ritmo Atual', _statusScoreLabel(season.currentStatus), 'monitoring', '', false, _metricBalloon('Ritmo Atual', _statusScoreLabel(season.currentStatus), _paceBalloonText(season, metrics, progress))) +
        _metricTile('Chance de Falha', _riskLabel(season.riskLevel), 'warning', '', false, _metricBalloon('Chance de Falha', _riskLabel(season.riskLevel), _riskBalloonText(season, metrics, progress))) +
        _metricTile(primaryLabels.current, _formatMetricValue(metrics.currentValue, season.objective), 'radio_button_checked', '', true) +
        _metricTile(primaryLabels.target, _formatMetricValue(metrics.targetValue, season.objective), 'flag', '', true) +
      '</div>' +
      '<div class="seasons-progress-block seasons-progress-block-inner seasons-chart-clickable" role="button" tabindex="0" onclick="Modules.Temporadas.toggleMetricBalloon(this)" onkeydown="Modules.Temporadas._metricTileKey(event,this)">' +
        '<div class="seasons-progress-top"><span>Progresso da meta</span></div>' +
        '<div class="seasons-progress-line"><span style="width:' + _clamp(progress, 0, 100) + '%"></span></div>' +
        _chartBalloonHtml(_metricBalloon('Progresso da meta', Math.round(progress) + '%', _progressBalloonText(season, metrics, progress))) +
      '</div>' +
      _systemStatusBars(season, metrics) +
      _quickAlerts(snapshots);
  }

  function _nextMoveTab(season, metrics, recommendation) {
    return '' +
      '<div class="seasons-copilot-layout">' +
        '<section class="seasons-copilot-main">' +
          '<div class="seasons-tab-header"><span class="seasons-section-label">Copiloto IA</span><h3>O que fazer agora?</h3><p>A IA não calcula a temporada. Ela interpreta os dados já calculados e transforma em ação prática.</p></div>' +
          _nextMoveBlock(recommendation) +
        '</section>' +
        '<aside class="seasons-system-side">' +
          '<span class="seasons-section-label">Dados do Sistema</span>' +
          _metricTile('Score', Math.round(_number(season.currentScore, 0)), 'speed') +
          _metricTile('Progresso', Math.round(_number(season.progressPercent, 0)) + '%', 'trending_up') +
          _metricTile('Chance de Falha', _riskLabel(season.riskLevel), 'warning') +
          _metricTile('Métrica observada', _formatMetricValue(metrics.currentValue, season.objective), 'analytics') +
        '</aside>' +
      '</div>';
  }

  function _analysisTab(season, snapshots) {
    snapshots = snapshots || {};
    return '' +
      '<div class="seasons-tab-header"><span class="seasons-section-label">Análises Automáticas</span><h3>Snapshots da temporada</h3><p>Leituras geradas automaticamente para reduzir recálculo e registrar o histórico de interpretação.</p></div>' +
      '<div class="seasons-analysis-update">' + _icon('update') + ' Última atualização: <strong>' + _esc(_snapshotUpdatedLabel(snapshots)) + '</strong></div>' +
      '<div class="seasons-analysis-grid">' +
        _snapshotAnalysisCard('Análise Diária', snapshots.daily, 'Mudanças rápidas, alertas curtos e progresso recente.') +
        _snapshotAnalysisCard('Análise Semanal', snapshots.weekly, 'Tendência, evolução, riscos e oportunidades da semana.') +
      '</div>';
  }

  function _finalResultInline(season) {
    var summary = season.finalSummary || {};
    var metrics = season.finalMetrics || season.currentMetrics || {};
    return '' +
      '<div class="seasons-tab-header"><span class="seasons-section-label">Resultado Final</span><h3>' + _esc(season.finalResult || 'Resultado não calculado') + '</h3><p>Fechamento da campanha operacional.</p></div>' +
      '<div class="seasons-final-grid">' +
        _finalFact('Score final', Math.round(_number(season.finalScore, season.currentScore || 0))) +
        _finalFact('Progresso final', Math.round(_number(season.finalProgressPercent, season.progressPercent || 0)) + '%') +
        _finalFact('Resultado', _formatMetricValue(metrics.currentValue, season.objective)) +
      '</div>' +
      '<div class="seasons-final-columns">' +
        _finalList('O que funcionou', summary.worked || []) +
        _finalList('O que atrapalhou', summary.blocked || []) +
      '</div>' +
      '<div class="seasons-final-suggestion">' + _icon('next_plan') + '<div><small>Sugestão para próxima temporada</small><strong>' + _esc(_objectiveLabel(summary.nextSeasonSuggestion || '')) + '</strong><p>' + _esc(summary.suggestionReason || 'Sugestão baseada nas métricas finais disponíveis.') + '</p></div></div>';
  }

  function _systemStatusBars(season, metrics) {
    var consistency = _consistencyChartValue(metrics);
    return '' +
      '<div class="seasons-status-bars">' +
        _statusBar('Ritmo operacional', season.progressPercent, season.objective === 'sell_more' || season.objective === 'improve_consistency', _metricBalloon('Ritmo operacional', Math.round(_clamp(season.progressPercent, 0, 100)) + '%', _paceBalloonText(season, metrics, _number(season.progressPercent, 0)))) +
        _statusBar('Consistência', consistency.value, season.objective === 'improve_consistency', _metricBalloon('Consistência', consistency.label, _consistencyBalloonText(metrics))) +
        _statusBar('Fidelização', _number(metrics.repurchaseRate, 0) * 100, season.objective === 'retain_customers', _metricBalloon('Fidelização', Math.round(_clamp(_number(metrics.repurchaseRate, 0) * 100, 0, 100)) + '%', _retentionBalloonText(metrics))) +
        _statusBar('Chance de falha', _riskScore(season.riskLevel), false, null) +
      '</div>';
  }

  function _statusBar(label, value, highlighted, balloon) {
    var pct = _clamp(value, 0, 100);
    return '<div class="seasons-status-bar ' + (balloon ? 'seasons-chart-clickable ' : '') + (highlighted ? 'seasons-weighted-field' : '') + '" ' + (balloon ? 'role="button" tabindex="0" onclick="Modules.Temporadas.toggleMetricBalloon(this)" onkeydown="Modules.Temporadas._metricTileKey(event,this)"' : '') + '><div><span>' + _esc(label) + '</span></div><b><i style="width:' + pct + '%"></i></b>' + _chartBalloonHtml(balloon) + '</div>';
  }

  function _primaryMetricLabels(objective) {
    return ({
      sell_more: { current: 'Faturamento atual', target: 'Meta de faturamento' },
      increase_ticket: { current: 'Ticket atual', target: 'Meta de ticket' },
      retain_customers: { current: 'Recorrência atual', target: 'Meta de fidelização' },
      improve_consistency: { current: 'Dias ativos', target: 'Meta de consistência' }
    })[objective] || { current: 'Atual', target: 'Meta' };
  }

  function _riskScore(risk) {
    return ({ low: 20, medium: 45, high: 70, very_high: 92, unknown: 55 })[risk] || 55;
  }

  function _metricBalloon(title, value, text) {
    return { title: title, value: value, text: text };
  }

  function _chartBalloonHtml(balloon) {
    if (!balloon) return '';
    return '<div class="seasons-metric-balloon seasons-chart-balloon" hidden><strong>Resultado atual: ' + _esc(balloon.value) + '</strong><p>' + _esc(balloon.text) + '</p></div>';
  }

  function _progressBalloonText(season, metrics, progress) {
    var current = _formatMetricValue(metrics.currentValue, season.objective);
    var target = _formatMetricValue(metrics.targetValue, season.objective);
    var expected = _number(metrics.expectedProgress, 0);
    var parts = ['Este gráfico mostra quanto da meta principal já foi alcançado. O resultado atual é ' + current + ' de uma meta de ' + target + '.'];
    if (expected > 0) parts.push('Para este momento da temporada, o ritmo esperado era perto de ' + Math.round(expected) + '%, então a comparação principal é entre o progresso real e esse ponto de referência.');
    if (progress >= 100) parts.push('Como o progresso chegou a 100% ou mais, a meta da temporada já foi atingida ou superada.');
    else parts.push('Ainda falta aproximadamente ' + Math.max(0, Math.round(100 - progress)) + '% para chegar à meta. Se esse número ficar distante do ritmo esperado, a temporada tende a exigir ação mais rápida.');
    return parts.join(' ');
  }

  function _scoreBalloonText(season, metrics) {
    var score = _number(season.currentScore, 0);
    var weights = _objectiveWeights(season.objective).map(function (item) {
      return item.label + ' ' + item.weight;
    }).join(', ');
    var text = 'Este score considera principalmente: ' + (weights || 'as métricas do objetivo atual') + '.';
    if (score >= 85) return text + ' A nota está alta porque os indicadores principais estão acima do ritmo esperado.';
    if (score >= 65) return text + ' A nota está dentro de uma faixa estável, com avanço suficiente até agora.';
    if (score >= 40) return text + ' A nota mostra oscilação: existe avanço, mas ainda abaixo do ideal para este ponto da temporada.';
    return text + ' A nota está baixa porque os indicadores principais ainda estão longe da meta ou do ritmo esperado.';
  }

  function _paceBalloonText(season, metrics, progress) {
    var expected = _number(metrics.expectedProgress, 0);
    var ratio = _number(metrics.progressRatio, 0);
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    if (_statusScoreLabel(season.currentStatus) === 'Em início') {
      return 'Este gráfico compara o avanço real com o avanço esperado para agora. A temporada ainda está no começo, então o sistema evita marcar atraso grave apenas pela ausência de resultado imediato.';
    }
    if (expected <= 0) return 'Este gráfico depende de tempo decorrido e meta definida. Ainda há poucos dados de ritmo para comparar o progresso real com o progresso esperado.';
    if (ratio >= 1.10) return 'O progresso atual de ' + Math.round(progress) + '% está acima do esperado para o dia ' + elapsed + '. Isso indica que a temporada está andando mais rápido que o ritmo necessário.';
    if (ratio >= .80) return 'O progresso atual de ' + Math.round(progress) + '% está próximo do esperado, que era cerca de ' + Math.round(expected) + '%. Isso indica que a temporada está acompanhando o plano, mesmo que ainda não tenha chegado à meta final.';
    if (ratio >= .50) return 'O progresso atual de ' + Math.round(progress) + '% está abaixo do esperado de ' + Math.round(expected) + '%. Por isso o ritmo aparece instável: ainda há avanço, mas o sistema entende que precisa recuperar parte do atraso.';
    return 'O progresso atual de ' + Math.round(progress) + '% está muito abaixo do esperado de ' + Math.round(expected) + '%. Por isso o ritmo aparece crítico: o avanço até agora não acompanha o que seria necessário para chegar à meta no prazo.';
  }

  function _riskBalloonText(season, metrics, progress) {
    var risk = season.riskLevel || 'unknown';
    var expected = _number(metrics.expectedProgress, 0);
    var gap = Math.max(0, expected - progress);
    var daysRemaining = Math.round(_number(metrics.daysRemaining, 0));
    var initialRisk = season.initialRiskLevel || 'unknown';
    var reasons = [];

    if (initialRisk === 'high' || initialRisk === 'very_high') {
      reasons.push('a meta já nasceu com chance inicial ' + _riskLabel(initialRisk).toLowerCase() + ' em relação ao histórico');
    }
    if (expected > 0 && gap >= 35) reasons.push('o progresso está cerca de ' + Math.round(gap) + ' pontos abaixo do esperado para hoje');
    else if (expected > 0 && gap >= 15) reasons.push('o progresso está abaixo do ritmo esperado para hoje');
    if (_statusScoreLabel(season.currentStatus) === 'Crítico' || _statusScoreLabel(season.currentStatus) === 'Instável') {
      reasons.push('o ritmo atual está ' + _statusScoreLabel(season.currentStatus).toLowerCase());
    }
    if (daysRemaining <= 7 && progress < 75) reasons.push('restam poucos dias e a temporada ainda está abaixo de 75% da meta');

    if (!reasons.length) {
      if (risk === 'low') return 'A chance está baixa porque o progresso e o ritmo atual não indicam atraso relevante para a meta.';
      if (risk === 'medium') return 'A chance está média porque existe algum desvio de ritmo ou exigência da meta, mas ainda há espaço para recuperar.';
      return 'A chance considera a dificuldade da meta, histórico, ritmo atual e dias restantes.';
    }
    return 'A chance está ' + _riskLabel(risk).toLowerCase() + ' porque ' + reasons.join(', ') + '.';
  }

  function _consistencyBalloonText(metrics) {
    var value = _number(metrics.weeklyRegularity, 0) * 100;
    var weakDays = _number(metrics.weakDays, 0);
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    var activeDays = Math.round(_number(metrics.activeDays, 0));
    var orders = Math.round(_number(metrics.orders, 0));
    if (elapsed <= 2 || activeDays <= 1 || orders <= 1) {
      return 'Este gráfico mede regularidade ao longo do tempo. Como a temporada ainda está no começo, não há dias suficientes para concluir se as vendas estão consistentes. A leitura deve ser vista como inicial, não como desempenho bom.';
    }
    if (value >= 75) return 'Este gráfico mede regularidade. A leitura está boa porque as vendas parecem menos concentradas em poucos dias e a semana mostra comportamento mais estável.';
    if (value >= 45) return 'Este gráfico mede regularidade. A leitura está intermediária porque existe algum ritmo de venda, mas ainda há oscilação entre dias ou semanas.';
    if (weakDays > 0) return 'Este gráfico mede regularidade. A leitura está baixa porque existem dias fracos ou sem venda impactando a consistência da temporada.';
    return 'Este gráfico mede regularidade. A leitura está baixa porque ainda há poucos sinais de vendas distribuídas de forma estável no período analisado.';
  }

  function _consistencyChartValue(metrics) {
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    var activeDays = Math.round(_number(metrics.activeDays, 0));
    var orders = Math.round(_number(metrics.orders, 0));
    if (elapsed <= 2 || activeDays <= 1 || orders <= 1) {
      return { value: 12, label: 'Leitura inicial' };
    }
    var value = _clamp(_number(metrics.weeklyRegularity, 0) * 100, 0, 100);
    return { value: value, label: Math.round(value) + '%' };
  }

  function _retentionBalloonText(metrics) {
    var rate = _number(metrics.repurchaseRate, 0) * 100;
    var recurring = Math.round(_number(metrics.recurringCustomers, 0));
    if (rate >= 35) return 'Este gráfico mostra sinais de retorno de clientes. A leitura está forte porque a taxa de recompra está em ' + Math.round(rate) + '% e há ' + recurring + ' cliente(s) recorrente(s) no período.';
    if (rate >= 15) return 'Este gráfico mostra sinais de retorno de clientes. A leitura está intermediária porque já existe recompra, mas ainda pode crescer para sustentar melhor a temporada.';
    return 'Este gráfico mostra sinais de retorno de clientes. A leitura está baixa porque a recompra está em ' + Math.round(rate) + '% e há poucos clientes recorrentes no período.';
  }

  function _quickAlerts(snapshots) {
    var alerts = ((snapshots && snapshots.daily && snapshots.daily.alerts) || []).slice(0, 3);
    return '<section class="seasons-alert-panel"><span class="seasons-section-label">Alertas rápidos</span>' + (alerts.length ? alerts.map(function (alert) {
      return '<article><strong>' + _esc(alert.title || 'Alerta') + '</strong><p>' + _esc(alert.message || '') + '</p></article>';
    }).join('') : '<p>Nenhum alerta crítico no snapshot diário.</p>') + '</section>';
  }

  function _snapshotAnalysisCard(title, snapshot, description) {
    if (!snapshot) {
      return '<article class="seasons-analysis-card"><span class="seasons-section-label">' + _esc(title) + '</span><h4>Ainda não gerada</h4><p>' + _esc(description) + '</p></article>';
    }
    var alerts = (snapshot.alerts || []).slice(0, 3);
    return '' +
      '<article class="seasons-analysis-card">' +
        '<span class="seasons-section-label">' + _esc(title) + '</span>' +
        '<h4>' + _esc(_formatDate(snapshot.date || snapshot.createdAt) || snapshot.date || 'Snapshot') + '</h4>' +
        '<div class="seasons-analysis-facts">' +
          '<span>Score <strong>' + Math.round(_number(snapshot.score, 0)) + '</strong></span>' +
          '<span>Ritmo <strong>' + _esc(_statusScoreLabel(snapshot.status)) + '</strong></span>' +
          '<span>Progresso <strong>' + Math.round(_number(snapshot.progressPercent, 0)) + '%</strong></span>' +
        '</div>' +
        '<p>' + _esc(description) + '</p>' +
        (alerts.length ? '<div class="seasons-analysis-alerts">' + alerts.map(function (alert) { return '<small>' + _esc(alert.title || 'Alerta') + '</small>'; }).join('') + '</div>' : '<div class="seasons-analysis-alerts"><small>Sem alertas críticos</small></div>') +
      '</article>';
  }

  function _validSeasonTab(season, tab) {
    if (tab === 'final' && season.status !== 'finished') return 'overview';
    return ({ overview: true, next: true, analysis: true, final: true })[tab] ? tab : 'overview';
  }

  function _setSeasonTab(tab) {
    _state.activeTab = _validSeasonTab(_state.activeSeason || {}, tab);
    _paint();
  }

  function _snapshotBadge(label, snapshot) {
    return '' +
      '<span class="seasons-snapshot-badge ' + (snapshot ? 'is-ready' : '') + '">' +
        _icon(snapshot ? 'check_circle' : 'schedule') +
        _esc(label) +
      '</span>';
  }

  function _nextMoveBlock(recommendation) {
    recommendation = recommendation || _fallbackRecommendationForUI();
    var main = recommendation.mainAction || {};
    var steps = Array.isArray(main.howToApply) ? main.howToApply.slice(0, 4) : [];
    var secondary = Array.isArray(recommendation.secondaryActions) ? recommendation.secondaryActions.slice(0, 2) : [];

    return '' +
      '<div class="seasons-next-move">' +
        '<div class="seasons-next-move-head">' +
          '<span class="seasons-section-label">Próxima Jogada</span>' +
          '<strong>' + _esc(main.title || 'Acompanhar a temporada por mais alguns dias') + '</strong>' +
        '</div>' +
        '<p>' + _esc(main.description || 'Ainda há poucos dados para uma ação mais específica.') + '</p>' +
        '<div class="seasons-next-reason"><span>Motivo</span><strong>' + _esc(main.why || 'Recomendação gerada com base nos dados disponíveis da temporada.') + '</strong></div>' +
        (steps.length ? '<ol>' + steps.map(function (step) { return '<li>' + _esc(step) + '</li>'; }).join('') + '</ol>' : '') +
        '<div class="seasons-next-meta">' +
          '<span>Métrica: <strong>' + _esc(main.metricToWatch || 'Progresso') + '</strong></span>' +
          '<span>Revisar em: <strong>' + Math.round(_number(main.reviewInDays, 7)) + ' dias</strong></span>' +
        '</div>' +
        '<div class="seasons-next-risk"><span>Risco se ignorar</span><strong>' + _esc(main.riskIfIgnored || 'A temporada pode perder ritmo antes do fechamento.') + '</strong></div>' +
        (secondary.length ? '<div class="seasons-secondary-actions">' + secondary.map(function (item) {
          return '<article><strong>' + _esc(item.title || 'Ação secundária') + '</strong><p>' + _esc(item.description || item.why || '') + '</p></article>';
        }).join('') + '</div>' : '') +
        '<small>Recomendação gerada com base nos dados disponíveis da temporada.</small>' +
      '</div>';
  }

  function _metricTile(label, value, icon, helpText, highlighted, balloon) {
    var display = value === 0 ? '0' : (value || 'Não definido');
    return '' +
      '<div class="seasons-metric-tile ' + (highlighted ? 'seasons-weighted-field' : '') + (balloon ? ' seasons-metric-clickable' : '') + '" ' + (balloon ? 'role="button" tabindex="0" onclick="Modules.Temporadas.toggleMetricBalloon(this)" onkeydown="Modules.Temporadas._metricTileKey(event,this)"' : '') + '>' +
        _icon(icon) +
        '<small>' + _esc(label) + '</small>' +
        '<strong>' + _esc(display) + '</strong>' +
        (helpText ? '<em>' + _esc(helpText) + '</em>' : '') +
        (balloon ? '<div class="seasons-metric-balloon" hidden><small>' + _esc(balloon.title) + '</small><strong>Resultado atual: ' + _esc(balloon.value) + '</strong><p>' + _esc(balloon.text) + '</p></div>' : '') +
      '</div>';
  }

  function toggleMetricBalloon(card) {
    if (!card) return;
    var isOpen = card.classList.contains('open');
    Array.prototype.forEach.call(document.querySelectorAll('.seasons-metric-tile.open, .seasons-status-bar.open, .seasons-progress-block-inner.open'), function (item) {
      if (item !== card) {
        item.classList.remove('open');
        var itemBalloon = item.querySelector('.seasons-metric-balloon');
        if (itemBalloon) itemBalloon.hidden = true;
      }
    });
    var balloon = card.querySelector('.seasons-metric-balloon');
    card.classList.toggle('open', !isOpen);
    if (balloon) balloon.hidden = isOpen;
  }

  function _metricTileKey(event, card) {
    if (!event || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    toggleMetricBalloon(card);
  }

  function _historyCard(seasons) {
    return '' +
      '<section class="seasons-history-card" aria-label="Histórico de temporadas">' +
        '<div class="seasons-card-head">' +
          '<div>' +
            '<span class="seasons-section-label">Histórico</span>' +
            '<h2>Temporadas anteriores</h2>' +
          '</div>' +
          '<span class="seasons-status-pill">' + seasons.length + ' registro' + (seasons.length === 1 ? '' : 's') + '</span>' +
        '</div>' +
        (seasons.length ? '<div class="seasons-history-list">' + seasons.map(_historyRow).join('') + '</div>' : '<div class="seasons-history-empty">' +
          _icon('timeline') +
          '<div>' +
            '<strong>Espaço reservado para resultados concluídos</strong>' +
            '<p>Quando houver temporadas finalizadas ou abandonadas, esta lista mostrará período, resultado final e score.</p>' +
          '</div>' +
        '</div>') +
      '</section>';
  }

  function _scheduledCard(seasons) {
    return '' +
      '<section class="seasons-history-card" aria-label="Temporadas programadas">' +
        '<div class="seasons-card-head">' +
          '<div>' +
            '<span class="seasons-section-label">Programadas</span>' +
            '<h2>Temporadas futuras</h2>' +
          '</div>' +
          '<button class="seasons-secondary-button seasons-compact-action" type="button" onclick="Modules.Temporadas.openCreateFlow()">' + _icon('add') + ' Nova Temporada</button>' +
        '</div>' +
        (_state.scheduledStartConflict ? '<div class="seasons-warning-line">' + _icon('warning') + ' Existe temporada programada com data de início vencida, mas já há uma temporada ativa. Ela continuará programada até o período ficar livre.</div>' : '') +
        (seasons.length ? '<div class="seasons-history-list">' + seasons.map(_scheduledRow).join('') + '</div>' : '<div class="seasons-history-empty">' +
          _icon('event_upcoming') +
          '<div>' +
            '<strong>Nenhuma temporada programada</strong>' +
            '<p>Crie uma temporada com data futura para preparar a próxima campanha operacional sem iniciar análises agora.</p>' +
          '</div>' +
        '</div>') +
      '</section>';
  }

  function _scheduledRow(season) {
    return '' +
      '<article class="seasons-scheduled-row seasons-scheduled-row-clickable" onclick="Modules.Temporadas.openScheduledDetails(\'' + _esc(season.id || '') + '\')" role="button" tabindex="0">' +
        '<div class="seasons-scheduled-main">' +
          '<strong>' + _esc(season.title || 'Temporada sem título') + '</strong>' +
          '<span>' + _esc(_objectiveLabel(season.objective)) + ' · ' + _esc(_buildLabel(season.build)) + ' · ' + _esc(_difficultyLabel(season.difficulty)) + '</span>' +
          '<small>As análises começam quando a temporada ficar ativa.</small>' +
        '</div>' +
        '<div class="seasons-scheduled-meta">' +
          '<span class="seasons-mini-status seasons-mini-status-scheduled">Programada</span>' +
          '<small>Começa em <strong>' + _esc(_formatDate(season.startDate)) + '</strong></small>' +
          '<small>Termina em <strong>' + _esc(_formatDate(season.endDate)) + '</strong></small>' +
          '<small>Meta <strong>' + _esc(_scheduledTargetLabel(season)) + '</strong></small>' +
          '<small>Chance inicial <strong>' + _esc(_riskLabel(season.initialRiskLevel || season.riskLevel)) + '</strong></small>' +
        '</div>' +
      '</article>';
  }

  function _scheduledTargetLabel(season) {
    var value = season.targetMode === 'fixed' ? season.targetValue : season.calculatedTargetValue;
    var mode = season.targetMode === 'fixed' ? 'fixa' : 'automática';
    return mode + ' · ' + _formatMetricValue(value, season.objective);
  }

  function _historyRow(season) {
    var score = _number(season.finalScore, _number(season.currentScore, 0));
    return '' +
      '<article class="seasons-history-row seasons-history-row-clickable" onclick="Modules.Temporadas.openFinalResult(\'' + _esc(season.id || '') + '\')" role="button" tabindex="0">' +
        '<div>' +
          '<strong>' + _esc(season.title || 'Temporada sem título') + '</strong>' +
          '<span>' + _esc(_formatPeriod(season.startDate, season.endDate)) + '</span>' +
        '</div>' +
        '<div class="seasons-history-meta">' +
          '<span class="seasons-mini-status seasons-mini-status-' + _esc(season.status || 'draft') + '">' + _esc(season.finalResult || _statusLabel(season.status)) + '</span>' +
          '<small>Score ' + Math.round(score) + '</small>' +
        '</div>' +
      '</article>';
  }

  function finishActiveSeason() {
    if (_loading) {
      _toast('Aguarde o carregamento da temporada.', 'warning');
      return;
    }
    var season = _state.activeSeason;
    if (!season || season.status !== 'active') {
      _toast('Não há temporada ativa para finalizar.', 'warning');
      return;
    }
    if (season.tenantId && season.tenantId !== _tenantId) {
      _toast('Temporada pertence a outro tenant.', 'error');
      return;
    }

    var end = _toDate(season.endDate);
    if (end && end > new Date()) {
      var ok = window.confirm('Esta temporada ainda não chegou ao fim. Deseja finalizar manualmente agora?');
      if (!ok) return;
    }

    _loading = true;
    _paint();

    _finalizeSeason(season).then(function (finishedSeason) {
      _loading = false;
      _state.activeSeason = null;
      _state.snapshots = { daily: null, weekly: null };
      _state.seasons = _state.seasons.map(function (item) {
        return item.id === finishedSeason.id ? finishedSeason : item;
      });
      _paint();
      _toast('Temporada finalizada.', 'success');
      _renderFinalResultModal(finishedSeason);
    }).catch(function (err) {
      console.error('Temporadas finish error', err);
      _loading = false;
      _paint();
      _toast((err && err.message) || 'Erro ao finalizar temporada.', 'error');
    });
  }

  function openFinalResult(id) {
    var season = (_state.seasons || []).filter(function (item) { return item.id === id; })[0];
    if (!season) {
      _toast('Temporada não encontrada.', 'warning');
      return;
    }
    _renderFinalResultModal(season);
  }

  function openScheduledDetails(id) {
    var season = (_state.seasons || []).filter(function (item) { return item.id === id; })[0];
    if (!season || season.status !== 'scheduled') {
      _toast('Temporada programada não encontrada.', 'warning');
      return;
    }
    closeFinalResult();
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-final-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _scheduledDetailsHtml(season);
    document.body.appendChild(wrapper);
  }

  function closeFinalResult() {
    var modal = document.getElementById('seasons-final-modal');
    if (modal) modal.remove();
  }

  function _renderFinalResultModal(season) {
    closeFinalResult();
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-final-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _finalResultHtml(season);
    document.body.appendChild(wrapper);
    _triggerVictoryCelebration(season);
  }

  function _triggerVictoryCelebration(season) {
    if (!season || season.finalResult !== 'Vitória Total') return;
    var key = season.id || String(season.finishedAt || season.title || 'victory-total');
    if (_celebratedFinalResults[key]) return;
    _celebratedFinalResults[key] = true;

    var existing = document.getElementById('seasons-victory-celebration');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'seasons-victory-celebration';
    overlay.className = 'seasons-victory-celebration';
    overlay.setAttribute('aria-hidden', 'true');

    var palette = ['#B42318', '#E04B3F', '#B6925E', '#D8B46E', '#1A9E5A', '#2563EB', '#F4D4A8', '#FFFFFF'];
    var shapes = ['star', 'streamer', 'dot', 'spark'];
    var pieces = [];
    for (var i = 0; i < 86; i += 1) {
      var left = 3 + Math.random() * 94;
      var top = 4 + Math.random() * 18;
      var delay = Math.random() * .55;
      var duration = 3.6 + Math.random() * 1.2;
      var drift = (Math.random() * 280 - 140).toFixed(0) + 'px';
      var rotate = (Math.random() * 760 - 380).toFixed(0) + 'deg';
      var size = (6 + Math.random() * 9).toFixed(0) + 'px';
      var color = palette[i % palette.length];
      var shape = shapes[i % shapes.length];
      pieces.push('<span class="seasons-victory-piece seasons-victory-' + shape + '" style="left:' + left.toFixed(2) + '%;top:' + top.toFixed(2) + 'vh;--vc-delay:' + delay.toFixed(2) + 's;--vc-duration:' + duration.toFixed(2) + 's;--vc-drift:' + drift + ';--vc-rotate:' + rotate + ';--vc-color:' + color + ';--vc-size:' + size + ';"></span>');
    }
    overlay.innerHTML = '<div class="seasons-victory-burst">' + pieces.join('') + '</div>';
    document.body.appendChild(overlay);

    window.setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 5000);
  }

  function _showGoalReachedCelebration(season) {
    var existing = document.getElementById('seasons-goal-celebration');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'seasons-goal-celebration';
    overlay.className = 'seasons-goal-celebration';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    var palette = ['#B42318', '#E04B3F', '#B6925E', '#D8B46E', '#1A9E5A', '#2563EB', '#F4D4A8', '#FFFFFF'];
    var pieces = [];
    for (var i = 0; i < 74; i += 1) {
      var left = 3 + Math.random() * 94;
      var top = 4 + Math.random() * 20;
      var delay = Math.random() * .52;
      var duration = 3.5 + Math.random() * 1.15;
      var drift = (Math.random() * 250 - 125).toFixed(0) + 'px';
      var rotate = (Math.random() * 680 - 340).toFixed(0) + 'deg';
      var size = (6 + Math.random() * 8).toFixed(0) + 'px';
      var color = palette[i % palette.length];
      var shape = i % 4 === 0 ? 'star' : (i % 4 === 1 ? 'streamer' : (i % 4 === 2 ? 'dot' : 'spark'));
      pieces.push('<span class="seasons-goal-piece seasons-victory-' + shape + '" style="left:' + left.toFixed(2) + '%;top:' + top.toFixed(2) + 'vh;--vc-delay:' + delay.toFixed(2) + 's;--vc-duration:' + duration.toFixed(2) + 's;--vc-drift:' + drift + ';--vc-rotate:' + rotate + ';--vc-color:' + color + ';--vc-size:' + size + ';"></span>');
    }

    overlay.innerHTML = '' +
      '<div class="seasons-goal-burst">' + pieces.join('') + '</div>' +
      '<section class="seasons-goal-toast">' +
        '<div class="seasons-goal-mark">' + _icon('flag_check') + '</div>' +
        '<div>' +
          '<strong>Meta da temporada atingida.</strong>' +
          '<p>Você bateu o objetivo definido para esta temporada.</p>' +
        '</div>' +
        '<button type="button" onclick="Modules.Temporadas.openActiveFromCelebration()">Ver temporada</button>' +
      '</section>';

    document.body.appendChild(overlay);
    window.setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 5000);
  }

  function openActiveFromCelebration() {
    var overlay = document.getElementById('seasons-goal-celebration');
    if (overlay) overlay.remove();
    if (window.Router && typeof Router.navigate === 'function') {
      Router.navigate('crescimento/temporadas');
    }
  }

  function _finalResultHtml(season) {
    var summary = season.finalSummary || {};
    var metrics = season.finalMetrics || season.currentMetrics || {};
    var result = season.finalResult || 'Resultado não calculado';
    return '' +
      '<div class="seasons-modal seasons-final-modal" role="dialog" aria-modal="true" aria-label="Resultado Final">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Resultado Final</span>' +
            '<h2>' + _esc(result) + '</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeFinalResult()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-final-body">' +
          '<div class="seasons-final-hero">' +
            '<div>' +
              '<span>' + _esc(season.title || 'Temporada sem título') + '</span>' +
              '<h3>' + _esc(_objectiveLabel(season.objective)) + '</h3>' +
              '<p>' + _esc(_formatPeriod(season.startDate, season.finishedAt || season.endDate)) + '</p>' +
            '</div>' +
            '<strong>' + Math.round(_number(season.finalScore, season.currentScore || 0)) + '</strong>' +
          '</div>' +
          '<div class="seasons-final-grid">' +
            _finalFact('Estratégia', _buildLabel(season.build)) +
            _finalFact('Dificuldade', _difficultyLabel(season.difficulty)) +
            _finalFact('Meta', _formatMetricValue(metrics.targetValue, season.objective)) +
            _finalFact('Resultado', _formatMetricValue(metrics.currentValue, season.objective)) +
            _finalFact('Progresso final', Math.round(_number(season.finalProgressPercent, season.progressPercent || 0)) + '%') +
            _finalFact('Classificação', result) +
          '</div>' +
          '<div class="seasons-final-columns">' +
            _finalList('O que funcionou', summary.worked || []) +
            _finalList('O que atrapalhou', summary.blocked || []) +
          '</div>' +
          '<div class="seasons-final-summary">' +
            '<span class="seasons-section-label">Evolução detectada</span>' +
            '<p>' + _esc(summary.evolution || 'Ainda não há leitura estratégica suficiente para esta temporada.') + '</p>' +
          '</div>' +
          '<div class="seasons-final-suggestion">' +
            _icon('next_plan') +
            '<div><small>Sugestão para próxima temporada</small><strong>' + _esc(_objectiveLabel(summary.nextSeasonSuggestion || '')) + '</strong><p>' + _esc(summary.suggestionReason || 'Sugestão baseada nas métricas finais disponíveis.') + '</p></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _scheduledDetailsHtml(season) {
    return '' +
      '<div class="seasons-modal seasons-final-modal" role="dialog" aria-modal="true" aria-label="Temporada Programada">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Temporada Programada</span>' +
            '<h2>' + _esc(season.title || 'Temporada sem título') + '</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeFinalResult()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-final-body">' +
          '<div class="seasons-final-grid">' +
            _finalFact('Objetivo', _objectiveLabel(season.objective)) +
            _finalFact('Estratégia', _buildLabel(season.build)) +
            _finalFact('Dificuldade', _difficultyLabel(season.difficulty)) +
            _finalFact('Início', _formatDate(season.startDate)) +
            _finalFact('Fim', _formatDate(season.endDate)) +
            _finalFact('Meta', _scheduledTargetLabel(season)) +
            _finalFact('Chance inicial', _riskLabel(season.initialRiskLevel || season.riskLevel)) +
            _finalFact('Status', _statusLabel(season.status)) +
          '</div>' +
          '<div class="seasons-final-summary">' +
            '<span class="seasons-section-label">Análises</span>' +
            '<p>As análises, snapshots e recomendações da Próxima Jogada começam quando a temporada ficar ativa.</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _finalFact(label, value) {
    var display = value === 0 ? '0' : (value || 'Não definido');
    return '<div class="seasons-final-fact"><small>' + _esc(label) + '</small><strong>' + _esc(display) + '</strong></div>';
  }

  function _finalList(title, items) {
    items = items && items.length ? items : ['Sem leitura suficiente.'];
    return '' +
      '<div class="seasons-final-list">' +
        '<h4>' + _esc(title) + '</h4>' +
        '<ul>' + items.map(function (item) { return '<li>' + _esc(item) + '</li>'; }).join('') + '</ul>' +
      '</div>';
  }

  function openHelpModal() {
    if (!_state.activeSeason) {
      _toast('Abra uma temporada ativa para ver a explicação dos indicadores.', 'warning');
      return;
    }
    closeHelpModal();
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-help-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _helpModalHtml(_state.activeSeason);
    document.body.appendChild(wrapper);
  }

  function closeHelpModal() {
    var modal = document.getElementById('seasons-help-modal');
    if (modal) modal.remove();
  }

  function _helpModalHtml(season) {
    var objective = _objectiveHelp(season.objective);
    var build = _buildHelp(season.build);
    var difficulty = _difficultyHelp(season.difficulty);
    return '' +
      '<div class="seasons-modal seasons-help-modal" role="dialog" aria-modal="true" aria-label="Como ler esta temporada">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Ajuda da Temporada</span>' +
            '<h2>Como ler esta temporada</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeHelpModal()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-modal-body seasons-help-body">' +
          '<section class="seasons-help-summary">' +
            _helpSummaryCard('Objetivo', _objectiveLabel(season.objective)) +
            _helpSummaryCard('Estratégia', _buildLabel(season.build)) +
            _helpSummaryCard('Dificuldade', _difficultyLabel(season.difficulty)) +
            _helpSummaryCard('Duração', _durationDays(season) + ' dias') +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>O que significa este resumo</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Objetivo: ' + _objectiveLabel(season.objective), 'É o foco principal da temporada. Define qual resultado o sistema vai acompanhar com mais atenção.', objective.focus) +
              _helpItem('Estratégia: ' + _buildLabel(season.build), 'É a forma como o BocaFood interpreta os dados dentro da temporada.', build) +
              _helpItem('Dificuldade: ' + _difficultyLabel(season.difficulty), 'Define o nível de exigência da meta, a pressão do ritmo esperado e a tolerância ao risco.', difficulty) +
              _helpItem('Duração: ' + _durationDays(season) + ' dias', 'Define o período usado para acompanhar a meta e comparar o progresso real com o ritmo esperado.', 'Sprint usa 30 dias. Temporada usa 90 dias.') +
            '</div>' +
          '</section>' +
          _helpWeightHighlightsHtml(season) +
          '<section class="seasons-help-section">' +
            '<h3>Campos principais</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Progresso', 'Mostra quanto da meta já foi alcançado. Pode passar de 100% se a meta for superada. Muda conforme o objetivo da temporada.', objective.progress) +
              _helpItem('Score', 'Nota de 0 a 100 que combina as métricas principais da temporada. Não é só faturamento: os pesos mudam conforme o objetivo.', objective.score) +
              _helpItem('Ritmo Atual', 'Compara o progresso real com o progresso esperado para este momento da temporada. No início, não deve punir ausência de resultado imediato.', 'Estados: Em início, Excelente, Estável, Instável e Crítico.') +
              _helpItem('Chance de Falha', 'Estima o risco de não atingir a meta considerando histórico, dificuldade da meta, dias restantes e ritmo atual.', 'Estados: Baixo, Médio, Alto e Muito alto. Pode ser alta no começo se a meta estiver muito acima do histórico.') +
              _helpItem('Atual', 'Valor atual acumulado ou calculado até agora.', objective.current) +
              _helpItem('Meta', 'Valor que precisa ser alcançado até o final da temporada. Pode ser fixa ou automática.', objective.target) +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>Como ler os gráficos</h3>' +
            '<div class="seasons-help-intro">' +
              '<h4>Barras de status</h4>' +
              '<p>Mostram leituras rápidas de áreas importantes da temporada. Quanto maior a barra, maior o nível daquele indicador.</p>' +
              '<span>Use as barras para entender onde a temporada está forte e onde precisa de atenção.</span>' +
            '</div>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Barra de progresso', 'Mostra visualmente quanto da meta já foi alcançado. A barra enche até 100% para facilitar a leitura, mesmo que o progresso real possa passar disso.', objective.progress) +
              _helpItem('Ritmo operacional', 'Mostra se a temporada está avançando no ritmo necessário para o momento atual.', 'Não é a mesma coisa que a meta final: compara o progresso real com o esperado até hoje.') +
              _helpItem('Consistência', 'Mostra a regularidade das vendas ao longo da temporada.', 'Uma barra baixa indica vendas muito concentradas em poucos dias ou semanas irregulares.') +
              _helpItem('Fidelização', 'Mostra sinais de recompra, clientes recorrentes e frequência.', 'Se o objetivo não for fidelização, essa barra entra como apoio para leitura do negócio.') +
              _helpItem('Chance de falha', 'Mostra o nível visual de risco da temporada não atingir a meta.', 'Nesta barra, valor alto pede atenção: significa maior chance de falha, não melhor desempenho.') +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section seasons-help-split">' +
            '<div>' +
              '<h3>Objetivo desta temporada</h3>' +
              '<p>' + _esc(objective.focus) + '</p>' +
            '</div>' +
            '<div>' +
              '<h3>Estratégia operacional</h3>' +
              '<p>' + _esc(build) + '</p>' +
            '</div>' +
            '<div>' +
              '<h3>Dificuldade</h3>' +
              '<p>' + _esc(difficulty) + '</p>' +
            '</div>' +
          '</section>' +
          '<p class="seasons-help-note">As análises são automáticas. Você não precisa preencher esta tela manualmente. O sistema usa os dados gerados nos pedidos, clientes e demais módulos disponíveis.</p>' +
        '</div>' +
      '</div>';
  }

  function _helpSummaryCard(label, value) {
    return '<div><small>' + _esc(label) + '</small><strong>' + _esc(value) + '</strong></div>';
  }

  function _helpItem(title, text, detail) {
    return '' +
      '<article class="seasons-help-item">' +
        '<h4>' + _esc(title) + '</h4>' +
        '<p>' + _esc(text) + '</p>' +
        (detail ? '<span>' + _esc(detail) + '</span>' : '') +
      '</article>';
  }

  function _helpWeightHighlightsHtml(season) {
    var weights = _objectiveWeights(season.objective);
    if (!weights.length) return '';
    return '' +
      '<section class="seasons-help-section">' +
        '<h3>Campos com mais peso nesta temporada</h3>' +
        '<div class="seasons-weight-highlight">' +
          '<p>Estes indicadores puxam mais a leitura do score para o objetivo <strong>' + _esc(_objectiveLabel(season.objective)) + '</strong>.</p>' +
          '<div>' + weights.map(function (item) {
            return '<span><strong>' + _esc(item.weight) + '</strong>' + _esc(item.label) + '</span>';
          }).join('') + '</div>' +
          '<small>A estratégia ' + _esc(_buildLabel(season.build)) + ' ajuda a priorizar a interpretação, mas não muda os dados reais da temporada.</small>' +
        '</div>' +
      '</section>';
  }

  function _objectiveWeights(objective) {
    return ({
      sell_more: [
        { label: 'Faturamento', weight: '45%' },
        { label: 'Pedidos', weight: '35%' },
        { label: 'Dias com venda', weight: '20%' }
      ],
      increase_ticket: [
        { label: 'Ticket médio', weight: '50%' },
        { label: 'Valor médio por pedido', weight: '25%' },
        { label: 'Adicionais, combos ou upsell', weight: '25%' }
      ],
      retain_customers: [
        { label: 'Clientes recorrentes', weight: '45%' },
        { label: 'Recompra', weight: '35%' },
        { label: 'Frequência média', weight: '20%' }
      ],
      improve_consistency: [
        { label: 'Dias com venda', weight: '40%' },
        { label: 'Regularidade semanal', weight: '35%' },
        { label: 'Redução de dias fracos', weight: '25%' }
      ]
    })[objective] || [];
  }

  function _objectiveHelp(objective) {
    var map = {
      sell_more: {
        progress: 'Para esta temporada, o progresso compara o faturamento atual com a meta definida.',
        score: 'O score combina faturamento, pedidos e dias com venda.',
        current: 'Nesta temporada, representa o faturamento acumulado no período.',
        target: 'Nesta temporada, a meta principal é o faturamento esperado até o fim.',
        focus: 'Foco em faturamento, pedidos e dias com venda.'
      },
      increase_ticket: {
        progress: 'Para esta temporada, o progresso compara o ticket médio atual com a meta definida.',
        score: 'O score combina ticket médio, valor por pedido e sinais de adicionais, combos ou upsell.',
        current: 'Nesta temporada, representa o ticket médio calculado até agora.',
        target: 'Nesta temporada, a meta principal é o ticket médio esperado até o fim.',
        focus: 'Foco em ticket médio, valor por pedido e adicionais, combos ou upsell.'
      },
      retain_customers: {
        progress: 'Para esta temporada, o progresso acompanha recorrência e recompra conforme a meta.',
        score: 'O score combina clientes recorrentes, recompra e frequência média.',
        current: 'Nesta temporada, representa a recorrência ou recompra observada até agora.',
        target: 'Nesta temporada, a meta principal é melhorar a fidelização até o fim.',
        focus: 'Foco em recompra, clientes recorrentes e frequência.'
      },
      improve_consistency: {
        progress: 'Para esta temporada, o progresso acompanha dias ativos e regularidade de vendas.',
        score: 'O score combina dias com venda, regularidade semanal e redução de dias fracos.',
        current: 'Nesta temporada, representa os dias ativos e a consistência observada.',
        target: 'Nesta temporada, a meta principal é manter vendas mais regulares até o fim.',
        focus: 'Foco em dias com venda, regularidade semanal e redução de dias fracos.'
      }
    };
    return map[objective] || {
      progress: 'Para esta temporada, o progresso acompanha a métrica principal do objetivo escolhido.',
      score: 'O score combina as métricas principais da temporada.',
      current: 'Representa o valor atual da métrica principal.',
      target: 'Representa a meta definida para o fim da temporada.',
      focus: 'Foco nas métricas principais do objetivo escolhido.'
    };
  }

  function _buildHelp(build) {
    return ({
      volume: 'Com a estratégia Volume, o sistema dá mais peso para pedidos, frequência e movimento.',
      margin: 'Com a estratégia Margem, o sistema dá mais peso para ticket, valor por pedido e produtos de maior valor.',
      retention: 'Com a estratégia Fidelização, o sistema dá mais peso para recompra, recorrência e frequência.'
    })[build] || 'A estratégia altera o peso da leitura operacional sem mudar a temporada inteira.';
  }

  function _difficultyHelp(difficulty) {
    return ({
      safe: 'Seguro: meta mais realista, com menor pressão operacional.',
      balanced: 'Equilibrado: meta moderada, que exige consistência.',
      aggressive: 'Agressivo: meta mais alta, com maior risco e maior ritmo necessário.'
    })[difficulty] || 'A dificuldade define o nível de exigência da meta e do ritmo esperado.';
  }

  function openCreateFlow() {
    if (_loading) {
      _toast('Aguarde o carregamento das temporadas.', 'warning');
      return;
    }
    _wizard = _defaultWizard();
    _renderWizard();
  }

  function closeCreateFlow() {
    _wizard = null;
    _removeWizardModal();
  }

  function _removeWizardModal() {
    var modal = document.getElementById('seasons-create-modal');
    if (modal) modal.remove();
  }

  function _defaultWizard() {
    return {
      step: 0,
      saving: false,
      baselineLoading: false,
      baseline: null,
      error: '',
      values: {
        objective: '',
        durationType: '',
        startDate: _todayKey(),
        targetMode: '',
        targetValue: '',
        difficulty: '',
        build: ''
      }
    };
  }

  function _renderWizard() {
    _removeWizardModal();
    if (!_wizard) return;
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-create-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _wizardHtml();
    document.body.appendChild(wrapper);
  }

  function _wizardHtml() {
    var step = _wizard.step;
    var title = ['Objetivo', 'Duração', 'Data de início', 'Tipo de meta', 'Dificuldade', 'Estratégia operacional', 'Resumo final'][step] || 'Nova Temporada';
    var totalSteps = 7;
    return '' +
      '<div class="seasons-modal" role="dialog" aria-modal="true" aria-label="Nova Temporada">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Nova Temporada</span>' +
            '<h2>' + _esc(title) + '</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeCreateFlow()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-stepper">' + [0, 1, 2, 3, 4, 5, 6].map(function (idx) {
          return '<span class="' + (idx === step ? 'active' : (idx < step ? 'done' : '')) + '"></span>';
        }).join('') + '</div>' +
        '<div class="seasons-modal-body">' + _wizardStepHtml(step) + '</div>' +
        (_wizard.error ? '<div class="seasons-wizard-error">' + _icon('error') + _esc(_wizard.error) + '</div>' : '') +
        '<div class="seasons-modal-foot">' +
          '<button class="seasons-secondary-button" type="button" onclick="Modules.Temporadas._wizardBack()" ' + (step === 0 || _wizard.saving ? 'disabled' : '') + '>Voltar</button>' +
          '<button class="seasons-primary-button" type="button" onclick="Modules.Temporadas._wizardNext()" ' + (_wizard.saving ? 'disabled' : '') + '>' + (step === totalSteps - 1 ? (_wizard.saving ? 'Salvando...' : 'Salvar Temporada') : 'Continuar') + '</button>' +
        '</div>' +
      '</div>';
  }

  function _wizardStepHtml(step) {
    if (step === 0) return _optionGrid(OBJECTIVES, 'objective');
    if (step === 1) return _optionGrid(DURATIONS, 'durationType');
    if (step === 2) return _startDateStep();
    if (step === 3) return _targetModeStep();
    if (step === 4) return _optionGrid(DIFFICULTIES, 'difficulty');
    if (step === 5) return _optionGrid(BUILDS, 'build');
    return _summaryStep();
  }

  function _startDateStep() {
    var duration = _findByValue(DURATIONS, _wizard.values.durationType);
    var range = _wizardPeriodRange(_wizard.values);
    return '' +
      '<label class="seasons-target-field"><span>Data de início da temporada</span><input id="seasons-start-date" type="date" min="' + _esc(_todayKey()) + '" value="' + _esc(_wizard.values.startDate || _todayKey()) + '" onchange="Modules.Temporadas._wizardSetStartDate(this.value)"></label>' +
      '<div class="seasons-inline-note">' + _icon('event') + ' ' + _esc(range ? 'A temporada vai de ' + _formatDate(range.start) + ' até ' + _formatDate(range.end) + '.' : 'Escolha a duração para calcular a data final.') + '</div>' +
      (duration ? '<div class="seasons-inline-note">' + _icon('schedule') + ' Se a data for futura, a temporada ficará programada e só começará análises quando virar ativa.</div>' : '');
  }

  function _optionGrid(options, field) {
    return '<div class="seasons-option-grid">' + options.map(function (opt) {
      var active = _wizard.values[field] === opt.value;
      return '' +
        '<button class="seasons-choice-card ' + (active ? 'active' : '') + '" type="button" onclick="Modules.Temporadas._wizardSelect(\'' + _esc(field) + '\',\'' + _esc(opt.value) + '\')">' +
          '<strong>' + _esc(opt.label) + '</strong>' +
          '<span>' + _esc(opt.text) + '</span>' +
        '</button>';
    }).join('') + '</div>';
  }

  function _targetModeStep() {
    return '' +
      _optionGrid(TARGET_MODES, 'targetMode') +
      (_wizard.values.targetMode === 'fixed' ? '<label class="seasons-target-field"><span>Valor da meta</span><input id="seasons-target-value" type="number" step="0.01" min="0" value="' + _esc(_wizard.values.targetValue || '') + '" oninput="Modules.Temporadas._wizardSetTargetValue(this.value)" placeholder="Ex: 3000"></label>' : '') +
      (_wizard.values.targetMode === 'automatic' ? '<div class="seasons-inline-note">' + _icon('info') + ' A meta será calculada a partir do baseline dos últimos 30 ou 90 dias.</div>' : '');
  }

  function _summaryStep() {
    var values = _wizard.values;
    var duration = _findByValue(DURATIONS, values.durationType);
    var targetMode = _findByValue(TARGET_MODES, values.targetMode);
    var baseline = _wizard.baseline;
    return '' +
      '<div class="seasons-summary-list">' +
        _summaryRow('Objetivo', _objectiveLabel(values.objective)) +
        _summaryRow('Duração', duration ? duration.label + ' · ' + duration.text : 'Não definido') +
        _summaryRow('Início', values.startDate ? _formatDate(_parseDateInput(values.startDate)) : 'Hoje') +
        _summaryRow('Fim previsto', _wizardPeriodRange(values) ? _formatDate(_wizardPeriodRange(values).end) : 'Não calculado') +
        _summaryRow('Status inicial', _isFutureStart(values.startDate) ? 'Programada' : 'Ativa') +
        _summaryRow('Tipo de meta', targetMode ? targetMode.label : 'Não definido') +
        _summaryRow('Meta informada', values.targetMode === 'fixed' ? (_esc(values.targetValue || 'Não definida')) : 'Automática') +
        _summaryRow('Dificuldade', _difficultyLabel(values.difficulty)) +
        _summaryRow('Estratégia', _buildLabel(values.build)) +
        _summaryRow('Baseline encontrado', baseline ? _formatBaselineValue(baseline.baselineValue, values.objective) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculado')) +
        _summaryRow(values.targetMode === 'fixed' ? 'Meta fixa' : 'Meta calculada', baseline ? _formatBaselineValue(baseline.calculatedTargetValue, values.objective) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculada')) +
        _summaryRow('Chance de falha inicial', baseline ? _riskLabel(baseline.initialRiskLevel) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculado')) +
        _summaryRow('Confiabilidade', baseline ? _confidenceLabel(baseline.baselineConfidence) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculada')) +
      '</div>' +
      _creationAlertsHtml(_creationAlerts(values, baseline)) +
      '<div class="seasons-lock-note">' + _icon('lock') + ' Depois de iniciada, a temporada não poderá ser editada.</div>';
  }

  function _summaryRow(label, value) {
    return '<div class="seasons-summary-row"><span>' + _esc(label) + '</span><strong>' + _esc(value) + '</strong></div>';
  }

  function _creationAlerts(values, baseline) {
    var alerts = [];
    if (!baseline) return alerts;
    var growth = _targetGrowthPercent(baseline.baselineValue, baseline.calculatedTargetValue);

    if (growth !== null && growth >= 60) {
      alerts.push('Essa meta exige crescimento de ' + Math.round(growth) + '% sobre seu histórico recente.');
    }
    if (values.difficulty === 'aggressive' && baseline.baselineConfidence === 'low') {
      alerts.push('Você escolheu dificuldade agressiva, mas ainda há poucos dados para uma previsão confiável.');
    }
    if (_isBuildMisaligned(values.objective, values.build)) {
      alerts.push(_buildMisalignmentMessage(values.objective, values.build));
    }
    if (baseline.baselineConfidence === 'low') {
      alerts.push('Há poucos pedidos no período usado como base. A meta automática pode ser menos precisa.');
    }
    if (values.durationType === 'sprint' && growth !== null && growth >= 35) {
      alerts.push('Para 30 dias, essa meta exige um ritmo alto desde a primeira semana.');
    }
    if (_periodOverlapsExisting(values)) {
      alerts.push('Já existe uma temporada programada ou ativa nesse período. Escolha outra data.');
    }
    return alerts;
  }

  function _creationAlertsHtml(alerts) {
    if (!alerts || !alerts.length) return '';
    return '<div class="seasons-creation-alerts"><span class="seasons-section-label">Alertas da configuração</span>' + alerts.map(function (message) {
      return '<div>' + _icon('warning') + '<p>' + _esc(message) + '</p></div>';
    }).join('') + '</div>';
  }

  function _targetGrowthPercent(base, target) {
    base = _number(base, 0);
    target = _number(target, 0);
    if (base <= 0 || target <= 0) return null;
    return ((target - base) / base) * 100;
  }

  function _isBuildMisaligned(objective, build) {
    return (objective === 'increase_ticket' && build === 'volume') ||
      (objective === 'sell_more' && build === 'margin') ||
      (objective === 'retain_customers' && build === 'volume') ||
      (objective === 'improve_consistency' && build === 'margin');
  }

  function _buildMisalignmentMessage(objective, build) {
    if (objective === 'increase_ticket' && build === 'volume') return 'Essa combinação pode funcionar, mas Volume prioriza quantidade de pedidos, não valor por pedido.';
    if (objective === 'sell_more' && build === 'margin') return 'Essa combinação pode funcionar, mas Margem prioriza valor por pedido e produtos premium, não volume total.';
    if (objective === 'retain_customers' && build === 'volume') return 'Essa combinação pode funcionar, mas Volume prioriza pedidos, não recorrência e relacionamento.';
    if (objective === 'improve_consistency' && build === 'margin') return 'Essa combinação pode funcionar, mas Margem pode desviar o foco da regularidade operacional.';
    return 'Essa combinação pode funcionar, mas a estratégia escolhida não é a mais alinhada ao objetivo.';
  }

  function _wizardSelect(field, value) {
    if (!_wizard || _wizard.saving) return;
    _wizard.values[field] = value;
    _wizard.error = '';
    if (field === 'targetMode' && value === 'automatic') _wizard.values.targetValue = '';
    _renderWizard();
  }

  function _wizardSetTargetValue(value) {
    if (!_wizard || _wizard.saving) return;
    _wizard.values.targetValue = value;
    _wizard.error = '';
  }

  function _wizardSetStartDate(value) {
    if (!_wizard || _wizard.saving) return;
    _wizard.values.startDate = value || _todayKey();
    _wizard.baseline = null;
    _wizard.error = '';
    _renderWizard();
  }

  function _wizardBack() {
    if (!_wizard || _wizard.saving) return;
    _wizard.step = Math.max(0, _wizard.step - 1);
    _wizard.error = '';
    _renderWizard();
  }

  function _wizardNext() {
    if (!_wizard || _wizard.saving) return;
    var error = _validateWizardStep(_wizard.step);
    if (error) {
      _wizard.error = error;
      _renderWizard();
      return;
    }
    if (_wizard.step < 5) {
      _wizard.step += 1;
      _wizard.error = '';
      _renderWizard();
      if (_wizard.step === 5) _prepareBaselineSummary();
      return;
    }
    _startSeasonFromWizard();
  }

  function _validateWizardStep(step) {
    var values = _wizard.values;
    if (step === 0 && !values.objective) return 'Escolha um objetivo.';
    if (step === 1 && !values.durationType) return 'Escolha uma duração.';
    if (step === 2) {
      if (!values.startDate) return 'Escolha a data de início.';
      if (_parseDateInput(values.startDate) < _dayStart(new Date())) return 'A data de início não pode ser no passado.';
    }
    if (step === 3 && !values.targetMode) return 'Escolha o tipo de meta.';
    if (step === 3 && values.targetMode === 'fixed') {
      var target = _nullableNumber(values.targetValue);
      if (target === null || target <= 0) return 'Informe uma meta fixa maior que zero.';
    }
    if (step === 4 && !values.difficulty) return 'Escolha uma dificuldade.';
    if (step === 5 && !values.build) return 'Escolha uma estratégia operacional.';
    if (step === 6) {
      var required = [0, 1, 2, 3, 4, 5].map(_validateWizardStep).filter(Boolean);
      if (required.length) return required[0];
      if (_periodOverlapsExisting(values)) return 'Já existe uma temporada programada ou ativa nesse período. Escolha outra data.';
    }
    return '';
  }

  function _startSeasonFromWizard() {
    if (_wizard.baselineLoading) {
      _wizard.error = 'Aguarde o cálculo do baseline.';
      _renderWizard();
      return;
    }
    if (!_wizard.baseline) {
      _wizard.error = 'Não foi possível calcular o baseline.';
      _renderWizard();
      return;
    }
    _wizard.saving = true;
    _wizard.error = '';
    _renderWizard();

    var overlap = _periodOverlapsExisting(_wizard.values);
    if (overlap) {
      _wizard.saving = false;
      _wizard.error = 'Já existe uma temporada programada ou ativa nesse período. Escolha outra data.';
      _renderWizard();
      return;
    }

    var payload = _buildSeasonPayload(_wizard.values);
    createSeason(payload).then(function () {
      closeCreateFlow();
      _toast(payload.status === 'scheduled' ? 'Temporada programada.' : 'Temporada iniciada.', 'success');
    }).catch(function (err) {
      _wizard.saving = false;
      _wizard.error = (err && err.message) || 'Erro ao iniciar temporada.';
      _renderWizard();
    });
  }

  function _buildSeasonPayload(values) {
    var duration = _findByValue(DURATIONS, values.durationType);
    var now = new Date();
    var range = _wizardPeriodRange(values);
    var start = range ? range.start : _dayStart(now);
    var end = range ? range.end : new Date(start.getTime() + (((duration && duration.days) || 30) * 86400000));
    var status = _isFutureStart(values.startDate) ? 'scheduled' : 'active';
    var objective = _findByValue(OBJECTIVES, values.objective);
    var baseline = _wizard && _wizard.baseline ? _wizard.baseline : {};
    return {
      tenantId: _tenantId,
      title: _objectiveLabel(values.objective) + ' · ' + ((duration && duration.text) || '30 dias'),
      objective: values.objective,
      build: values.build,
      difficulty: values.difficulty,
      durationType: values.durationType,
      targetMode: values.targetMode,
      targetValue: values.targetMode === 'fixed' ? _nullableNumber(values.targetValue) : null,
      targetMetric: objective ? objective.metric : '',
      baselinePeriod: baseline.baselinePeriod || '',
      baselineValue: _nullableNumber(baseline.baselineValue),
      baselineRevenue: _number(baseline.baselineRevenue, 0),
      baselineOrders: _number(baseline.baselineOrders, 0),
      baselineAverageTicket: _number(baseline.baselineAverageTicket, 0),
      baselineActiveDays: _number(baseline.baselineActiveDays, 0),
      baselineRecurringCustomers: _number(baseline.baselineRecurringCustomers, 0),
      baselineRepurchaseRate: _number(baseline.baselineRepurchaseRate, 0),
      baselineConfidence: baseline.baselineConfidence || 'low',
      calculatedTargetValue: _nullableNumber(baseline.calculatedTargetValue),
      initialRiskLevel: baseline.initialRiskLevel || 'unknown',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: status,
      currentScore: 0,
      currentStatus: 'pending',
      riskLevel: baseline.initialRiskLevel || 'unknown',
      progressPercent: 0,
      goalReachedAt: null,
      goalCelebrationShownAt: null,
      goalCelebrationPending: false,
      goalReachedSnapshotId: '',
      startedAt: status === 'active' ? now.toISOString() : null,
      finishedAt: null,
      abandonedAt: null
    };
  }

  function _findByValue(list, value) {
    return (list || []).filter(function (item) { return item.value === value; })[0] || null;
  }

  function _wizardPeriodRange(values) {
    var duration = _findByValue(DURATIONS, values.durationType);
    var start = _parseDateInput(values.startDate || _todayKey());
    if (!duration || !start) return null;
    var end = new Date(start.getTime());
    end.setDate(end.getDate() + duration.days - 1);
    end.setHours(23, 59, 59, 999);
    return { start: start, end: end };
  }

  function _periodOverlapsExisting(values) {
    var range = _wizardPeriodRange(values);
    if (!range) return false;
    return (_state.seasons || []).some(function (season) {
      if (!season || (season.status !== 'active' && season.status !== 'scheduled')) return false;
      var start = _toDate(season.startDate || season.startedAt || season.createdAt);
      var end = _toDate(season.endDate);
      if (!start || !end) return false;
      return _periodsOverlap(range.start, range.end, start, end);
    });
  }

  function _periodsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart <= bEnd && bStart <= aEnd;
  }

  function _isFutureStart(value) {
    var start = _parseDateInput(value || _todayKey());
    return start > _dayStart(new Date());
  }

  function _parseDateInput(value) {
    var raw = String(value || '').trim();
    if (!raw) return _dayStart(new Date());
    var parts = raw.split('-');
    if (parts.length === 3) {
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return isNaN(d.getTime()) ? _dayStart(new Date()) : d;
    }
    return _dayStart(_toDate(raw) || new Date());
  }

  function _prepareBaselineSummary() {
    if (!_wizard || _wizard.baselineLoading) return;
    _wizard.baselineLoading = true;
    _wizard.baseline = null;
    _wizard.error = '';
    _renderWizard();

    _calculateBaseline(_wizard.values).then(function (baseline) {
      if (!_wizard) return;
      _wizard.baseline = baseline;
      _wizard.baselineLoading = false;
      _renderWizard();
    }).catch(function (err) {
      if (!_wizard) return;
      console.error('Temporadas baseline error', err);
      _wizard.baselineLoading = false;
      _wizard.error = (err && err.message) || 'Erro ao calcular baseline.';
      _renderWizard();
    });
  }

  function _calculateBaseline(values) {
    if (!window.DB || typeof DB.getAll !== 'function') return Promise.reject(new Error('DB indisponível.'));
    return DB.getAll('orders').then(function (orders) {
      var duration = _findByValue(DURATIONS, values.durationType) || DURATIONS[0];
      var end = new Date();
      var start = new Date(end.getTime());
      start.setDate(start.getDate() - duration.days);
      var validOrders = _ordersInPeriod(orders || [], start, end);
      var baseline = _buildBaselineMetrics(validOrders, duration.days);
      var baseValue = _baselineValueForObjective(baseline, values.objective);
      var calculatedTarget = values.targetMode === 'fixed'
        ? _nullableNumber(values.targetValue)
        : _automaticTargetValue(baseValue, values.objective, values.difficulty);
      var risk = values.targetMode === 'fixed'
        ? _fixedTargetRisk(baseValue, calculatedTarget, baseline.baselineConfidence)
        : 'low';

      return Object.assign({}, baseline, {
        baselinePeriod: duration.days + 'd',
        baselineValue: baseValue,
        calculatedTargetValue: calculatedTarget,
        initialRiskLevel: risk
      });
    });
  }

  function _ordersInPeriod(orders, start, end) {
    return (orders || []).filter(function (order) {
      if (!order || _isCanceledOrder(order)) return false;
      var date = _orderDate(order);
      if (!date) return false;
      return date >= start && date <= end;
    });
  }

  function _buildBaselineMetrics(orders, days) {
    var revenue = 0;
    var activeDayMap = {};
    var customers = {};
    var itemCount = 0;

    (orders || []).forEach(function (order) {
      var total = _money(order.total);
      revenue += total;
      itemCount += _orderItemCount(order);

      var date = _orderDate(order);
      if (date) activeDayMap[date.toISOString().slice(0, 10)] = true;

      var key = _customerKey(order);
      if (key) customers[key] = (customers[key] || 0) + 1;
    });

    var customerKeys = Object.keys(customers);
    var recurring = customerKeys.filter(function (key) { return customers[key] > 1; }).length;
    var count = (orders || []).length;
    var activeDays = Object.keys(activeDayMap).length;
    var confidence = count >= 10 ? 'high' : (count >= 3 ? 'medium' : 'low');

    return {
      baselineRevenue: revenue,
      baselineOrders: count,
      baselineAverageTicket: count ? revenue / count : 0,
      baselineAverageItemsPerOrder: count ? itemCount / count : 0,
      baselineActiveDays: activeDays,
      baselineRecurringCustomers: recurring,
      baselineRepurchaseRate: customerKeys.length ? recurring / customerKeys.length : 0,
      baselineConfidence: confidence,
      baselineDays: days
    };
  }

  function _baselineValueForObjective(baseline, objective) {
    if (objective === 'sell_more') return _number(baseline.baselineRevenue, 0);
    if (objective === 'increase_ticket') return _number(baseline.baselineAverageTicket, 0);
    if (objective === 'retain_customers') return _number(baseline.baselineRecurringCustomers, 0) || _number(baseline.baselineRepurchaseRate, 0);
    if (objective === 'improve_consistency') return _number(baseline.baselineActiveDays, 0);
    return 0;
  }

  function _automaticTargetValue(base, objective, difficulty) {
    base = _number(base, 0);
    var pct = {
      sell_more: { safe: .10, balanced: .20, aggressive: .35 },
      increase_ticket: { safe: .05, balanced: .10, aggressive: .18 },
      retain_customers: { safe: .05, balanced: .12, aggressive: .20 }
    };
    if (objective === 'improve_consistency') {
      var add = ({ safe: 1, balanced: 2, aggressive: 3 })[difficulty] || 1;
      return base + add;
    }
    var map = pct[objective] || {};
    return base * (1 + (map[difficulty] || 0));
  }

  function _fixedTargetRisk(base, target, confidence) {
    base = _number(base, 0);
    target = _number(target, 0);
    if (confidence === 'low' || base <= 0) return 'unknown';
    var growth = ((target - base) / base) * 100;
    if (growth <= 15) return 'low';
    if (growth <= 35) return 'medium';
    if (growth <= 60) return 'high';
    return 'very_high';
  }

  function _isCanceledOrder(order) {
    var status = String(order.status || '').trim().toLowerCase();
    return status === 'cancelado' || status === 'cancelada' || status === 'canceled' || status === 'cancelled';
  }

  function _orderDate(order) {
    return _toDate(order.canonicalDate || order.createdAt || order.date || order.data || order.deliveryDate || order.scheduleDate);
  }

  function _orderHour(order) {
    var direct = _nullableNumber(order.analyticsHour);
    if (direct !== null) return Math.max(0, Math.min(23, Math.floor(direct)));
    var time = String(order.analyticsTime || order.orderTime || order.saleTime || order.createdTime || order.deliveryTime || order.scheduleTime || order.slotTime || '').trim();
    var match = time.match(/(\d{1,2}):(\d{2})/);
    if (match) return Math.max(0, Math.min(23, parseInt(match[1], 10) || 0));
    var date = _orderDate(order);
    return date ? date.getHours() : null;
  }

  function _customerKey(order) {
    var id = String(order.customerId || order.clientId || '').trim();
    if (id) return 'id:' + id;
    var phone = _normalizePhone(order.customerPhone || order.phone || order.whatsapp || order.customerWhatsapp || '');
    if (phone) return 'phone:' + phone;
    var email = String(order.customerEmail || order.email || '').trim().toLowerCase();
    return email ? 'email:' + email : '';
  }

  function _normalizePhone(value) {
    return String(value || '').replace(/\D+/g, '');
  }

  function _money(value) {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    var raw = String(value === undefined || value === null ? '' : value).trim().replace(/[^\d,.-]/g, '');
    var normalized = raw.indexOf(',') >= 0 ? raw.replace(/\./g, '').replace(',', '.') : raw;
    var n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  function _normalizeSeasons(seasons) {
    return (seasons || []).filter(function (season) {
      return season && (!season.tenantId || season.tenantId === _tenantId);
    }).map(function (season) {
      var status = ALLOWED_STATUS[season.status] ? season.status : 'draft';
    return Object.assign({}, season, { status: status });
    }).sort(function (a, b) {
      return _dateValue(b.createdAt || b.startedAt || b.startDate) - _dateValue(a.createdAt || a.startedAt || a.startDate);
    });
  }

  function _refreshActiveSeasonMetrics(season) {
    if (!season || season.status !== 'active' || !season.id || !window.DB || typeof DB.getAll !== 'function' || typeof DB.update !== 'function') {
      return Promise.resolve(season);
    }

    var updatedSeason = season;
    return _loadScoreOrders(season).then(function (orders) {
      var result = _calculateSeasonScore(season, orders || []);
      var updates = {
        currentScore: result.currentScore,
        currentStatus: result.currentStatus,
        riskLevel: result.riskLevel,
        progressPercent: result.progressPercent,
        currentMetrics: result.currentMetrics
      };
      _appendGoalReachedPatch(season, result, updates);

      if (!_shouldPersistMetrics(season, updates)) {
        updatedSeason = Object.assign({}, season, updates);
        _maybeRunGoalCelebrationCheck(updatedSeason);
        return updatedSeason;
      }

      return DB.update('seasons', season.id, updates).then(function () {
        updatedSeason = Object.assign({}, season, updates);
        _maybeRunGoalCelebrationCheck(updatedSeason);
        return updatedSeason;
      });
    }).then(function () {
      return _ensureSeasonSnapshots(updatedSeason).then(function (snapshotState) {
        _state.snapshots = snapshotState || { daily: null, weekly: null };
        return Object.assign({}, updatedSeason, { snapshotState: _state.snapshots });
      });
    }).catch(function (err) {
      console.error('Temporadas scoring error', err);
      return season;
    });
  }

  function _appendGoalReachedPatch(season, result, updates) {
    if (!season || season.status !== 'active') return;
    if (_number(result && result.progressPercent, 0) < 100) return;
    if (season.goalReachedAt) return;
    updates.goalReachedAt = new Date().toISOString();
    updates.goalCelebrationPending = true;
    updates.goalCelebrationShownAt = season.goalCelebrationShownAt || null;
  }

  function _maybeRunGoalCelebrationCheck(season) {
    if (!season || season.status !== 'active') return;
    if (_number(season.progressPercent, 0) < 100 && _number(season.currentMetrics && season.currentMetrics.currentValue, 0) < _number(season.currentMetrics && season.currentMetrics.targetValue, 1)) return;
    checkPendingGoalCelebration({ force: true });
  }

  function checkPendingGoalCelebration(opts) {
    opts = opts || {};
    if (_goalCelebrationCheckRunning) return Promise.resolve(null);
    if (!opts.force && Date.now() - _lastGoalCelebrationCheckAt < 8000) return Promise.resolve(null);
    if (!window.Auth || !Auth.getUser || !Auth.getUser()) return Promise.resolve(null);
    if (!window.DB || typeof DB.getAll !== 'function' || typeof DB.update !== 'function') return Promise.resolve(null);

    _goalCelebrationCheckRunning = true;
    _lastGoalCelebrationCheckAt = Date.now();
    _tenantId = (window.Auth && typeof Auth.getTenantId === 'function') ? (Auth.getTenantId() || '') : _tenantId;

    return DB.getAll('seasons').then(function (seasons) {
      seasons = _normalizeSeasons(seasons || []);
      var pending = _pendingGoalCelebrationSeason(seasons);
      if (pending) return _displayPendingGoalCelebration(pending);

      var active = _resolveActiveSeason(seasons);
      if (!active || active.goalReachedAt) return null;
      if (_number(active.progressPercent, 0) >= 100) {
        return _markGoalReached(active).then(function (marked) {
          return marked ? _displayPendingGoalCelebration(marked) : null;
        });
      }
      return _refreshActiveSeasonMetrics(active).then(function (updated) {
        return _pendingGoalCelebrationSeason([updated]) ? _displayPendingGoalCelebration(updated) : null;
      });
    }).catch(function (err) {
      console.warn('Temporadas goal celebration check skipped', err);
      return null;
    }).finally(function () {
      _goalCelebrationCheckRunning = false;
    });
  }

  function _pendingGoalCelebrationSeason(seasons) {
    return (seasons || []).filter(function (season) {
      return season && season.status === 'active' &&
        season.goalCelebrationPending === true &&
        !season.goalCelebrationShownAt &&
        _number(season.progressPercent, 0) >= 100;
    }).sort(function (a, b) {
      return _dateValue(a.goalReachedAt || a.updatedAt || a.startedAt) - _dateValue(b.goalReachedAt || b.updatedAt || b.startedAt);
    })[0] || null;
  }

  function _displayPendingGoalCelebration(season) {
    if (!season || !season.id) return Promise.resolve(null);
    if (_goalCelebrationsInMemory[season.id]) return Promise.resolve(null);
    _goalCelebrationsInMemory[season.id] = true;
    try {
      _showGoalReachedCelebration(season);
    } catch (err) {
      console.warn('Temporadas goal celebration render skipped', err);
      _toast('Meta da temporada atingida.', 'success');
    }
    return _markGoalCelebrationShown(season);
  }

  function _markGoalReached(season) {
    if (!season || season.status !== 'active' || !season.id || season.goalReachedAt) return Promise.resolve(null);
    var reachedAt = new Date().toISOString();
    var patch = {
      goalReachedAt: reachedAt,
      goalCelebrationPending: true,
      goalCelebrationShownAt: null
    };
    return DB.update('seasons', season.id, patch).then(function () {
      return Object.assign({}, season, patch);
    }).catch(function (err) {
      console.warn('Temporadas goal reached update skipped', err);
      return null;
    });
  }

  function _markGoalCelebrationShown(season) {
    var shownAt = new Date().toISOString();
    return DB.update('seasons', season.id, {
      goalCelebrationShownAt: shownAt,
      goalCelebrationPending: false
    }).then(function () {
      _state.seasons = (_state.seasons || []).map(function (item) {
        return item.id === season.id ? Object.assign({}, item, { goalCelebrationShownAt: shownAt, goalCelebrationPending: false }) : item;
      });
      if (_state.activeSeason && _state.activeSeason.id === season.id) {
        _state.activeSeason = Object.assign({}, _state.activeSeason, { goalCelebrationShownAt: shownAt, goalCelebrationPending: false });
      }
      return true;
    }).catch(function (err) {
      console.warn('Temporadas goal celebration shown update skipped', err);
      return false;
    });
  }

  function _ensureSeasonSnapshots(season) {
    if (!season || season.status !== 'active' || !season.id || !window.DB || typeof DB.add !== 'function' || typeof DB.getAll !== 'function') {
      return Promise.resolve({ daily: null, weekly: null });
    }

    var todayKey = _dateKey(new Date());
    var weekStart = _weekStart(new Date());
    var weekKey = _dateKey(weekStart);

    return Promise.all([
      _ensureSnapshot(season, 'daily', todayKey),
      _ensureSnapshot(season, 'weekly', weekKey)
    ]).then(function (items) {
      var snapshotState = { daily: items[0], weekly: items[1] };
      return _ensureSnapshotAIRecommendation(season, snapshotState).then(function (updatedDaily) {
        if (updatedDaily) snapshotState.daily = updatedDaily;
        return snapshotState;
      });
    }).catch(function (err) {
      console.error('Temporadas snapshot error', err);
      return { daily: null, weekly: null };
    });
  }

  function _ensureSnapshot(season, snapshotType, dateKey) {
    return _findSnapshot(season.id, snapshotType, dateKey).then(function (existing) {
      if (existing) return existing;
      return _createSnapshot(season, snapshotType, dateKey);
    });
  }

  function _findSnapshot(seasonId, snapshotType, dateKey) {
    if (window.DB && typeof DB.col === 'function') {
      return DB.col('season_metrics_snapshots')
        .where('seasonId', '==', seasonId)
        .where('snapshotType', '==', snapshotType)
        .where('date', '==', dateKey)
        .get()
        .then(function (snap) {
          if (!snap || !snap.docs || !snap.docs.length) return null;
          var doc = snap.docs[0];
          return Object.assign({}, doc.data(), { id: doc.id });
        }).catch(function (err) {
          console.warn('Temporadas snapshot query fallback', err);
          return _findSnapshotFallback(seasonId, snapshotType, dateKey);
        });
    }
    return _findSnapshotFallback(seasonId, snapshotType, dateKey);
  }

  function _findSnapshotFallback(seasonId, snapshotType, dateKey) {
    return DB.getAll('season_metrics_snapshots').then(function (snapshots) {
      return (snapshots || []).filter(function (snapshot) {
        return snapshot &&
          snapshot.tenantId === _tenantId &&
          snapshot.seasonId === seasonId &&
          snapshot.snapshotType === snapshotType &&
          snapshot.date === dateKey;
      })[0] || null;
    });
  }

  function _createSnapshot(season, snapshotType, dateKey) {
    return _loadSnapshotOrders(season, snapshotType).then(function (orders) {
      var payload = _buildSnapshotPayload(season, snapshotType, dateKey, orders || []);
      return DB.add('season_metrics_snapshots', payload).then(function (ref) {
        return Object.assign({}, payload, {
          id: ref && ref.id ? ref.id : '',
          createdAt: new Date().toISOString()
        });
      });
    });
  }

  function _loadSnapshotOrders(season, snapshotType) {
    var range = _snapshotRange(season, snapshotType);
    if (window.DB && typeof DB.col === 'function') {
      return DB.col('orders')
        .where('createdAt', '>=', range.periodStart)
        .where('createdAt', '<=', range.periodEnd)
        .get()
        .then(function (snap) {
          return snap.docs.map(function (doc) {
            return Object.assign({}, doc.data(), { id: doc.id });
          });
        }).catch(function (err) {
          console.warn('Temporadas snapshot orders fallback', err);
          return DB.getAll('orders').then(function (orders) {
            return _ordersInPeriod(orders || [], range.periodStart, range.periodEnd);
          });
        });
    }
    return DB.getAll('orders').then(function (orders) {
      return _ordersInPeriod(orders || [], range.periodStart, range.periodEnd);
    });
  }

  function _buildSnapshotPayload(season, snapshotType, dateKey, orders) {
    var range = _snapshotRange(season, snapshotType);
    var validOrders = _ordersInPeriod(orders || [], range.periodStart, range.periodEnd);
    var days = Math.max(1, Math.ceil((range.periodEnd.getTime() - range.periodStart.getTime()) / 86400000));
    var metrics = _buildRuntimeMetrics(validOrders, days);
    var confidence = _snapshotConfidence(validOrders.length);
    var mainMetrics = _mainMetricsForSnapshot(season, metrics);
    var auxiliaryMetrics = _auxiliaryMetricsForSnapshot(metrics, confidence);
    var alerts = _snapshotAlerts(season, metrics, confidence);

    return {
      tenantId: _tenantId,
      seasonId: season.id,
      snapshotType: snapshotType,
      date: dateKey,
      periodStart: range.periodStart.toISOString(),
      periodEnd: range.periodEnd.toISOString(),
      objective: season.objective || '',
      build: season.build || '',
      difficulty: season.difficulty || '',
      score: _number(season.currentScore, 0),
      progressPercent: _number(season.progressPercent, 0),
      status: season.currentStatus || 'pending',
      riskLevel: season.riskLevel || 'unknown',
      confidence: confidence,
      metrics: metrics,
      mainMetrics: mainMetrics,
      auxiliaryMetrics: auxiliaryMetrics,
      alerts: alerts,
      insights: [],
      aiRecommendation: null,
      aiRecommendationGeneratedAt: null,
      aiRecommendationModel: '',
      aiRecommendationStatus: 'not_requested',
      aiRecommendationError: ''
    };
  }

  function _ensureSnapshotAIRecommendation(season, snapshotState) {
    if (!season || season.status !== 'active') return Promise.resolve(null);
    var daily = snapshotState && snapshotState.daily;
    if (!daily || !daily.id || !window.DB || typeof DB.update !== 'function') return Promise.resolve(daily || null);
    if (daily.aiRecommendation && (daily.aiRecommendationStatus === 'generated' || daily.aiRecommendationStatus === 'fallback')) {
      return Promise.resolve(daily);
    }

    var context = _buildAIContext(season, snapshotState);
    return _generateAIRecommendation(context).then(function (result) {
      var now = new Date().toISOString();
      var recommendation = result.recommendation || _fallbackRecommendationForUI();
      var patch = {
        aiRecommendation: recommendation,
        aiRecommendationGeneratedAt: now,
        aiRecommendationModel: result.model || 'local-rules-v1',
        aiRecommendationStatus: result.status || 'fallback',
        aiRecommendationError: result.error || ''
      };
      return DB.update('season_metrics_snapshots', daily.id, patch).then(function () {
        _persistSeasonAIFields(season, recommendation, now);
        return Object.assign({}, daily, patch);
      });
    }).catch(function (err) {
      var fallback = _fallbackRecommendationForUI();
      var patch = {
        aiRecommendation: fallback,
        aiRecommendationGeneratedAt: new Date().toISOString(),
        aiRecommendationModel: 'local-rules-v1',
        aiRecommendationStatus: 'fallback',
        aiRecommendationError: err && err.message ? err.message : 'AI recommendation fallback'
      };
      return DB.update('season_metrics_snapshots', daily.id, patch).then(function () {
        return Object.assign({}, daily, patch);
      });
    });
  }

  function _buildAIContext(season, snapshotState) {
    var metrics = season.currentMetrics || {};
    var relatedData = {
      topProducts: metrics.topProducts || [],
      lowSellingProducts: metrics.lowSellingProducts || [],
      strongDays: metrics.strongDays || [],
      strongHours: metrics.strongHours || [],
      revenuePreviousPeriod: 0,
      ordersPreviousPeriod: 0,
      averageTicketChange: 0,
      reviewsAverage: 0,
      couponUsage: 0,
      promotionUsage: 0,
      upsellUsage: 0
    };
    if (window.SeasonsAI && typeof SeasonsAI.buildSeasonAIContext === 'function') {
      return SeasonsAI.buildSeasonAIContext(season, metrics, snapshotState || {}, relatedData);
    }
    return { season: season, status: {}, operationalData: relatedData, confidence: { unavailableMetrics: ['seasons.ai.js'] } };
  }

  function _generateAIRecommendation(context) {
    if (window.SeasonsAI && typeof SeasonsAI.generateSeasonActionRecommendation === 'function') {
      return SeasonsAI.generateSeasonActionRecommendation(context);
    }
    return Promise.resolve({
      recommendation: _fallbackRecommendationForUI(),
      status: 'fallback',
      model: 'local-rules-v1',
      error: 'SeasonsAI indisponível'
    });
  }

  function _persistSeasonAIFields(season, recommendation, generatedAt) {
    if (!season || !season.id || !window.DB || typeof DB.update !== 'function') return;
    DB.update('seasons', season.id, {
      aiEnabled: false,
      lastAIRecommendationAt: generatedAt,
      lastAIRecommendationSummary: recommendation && recommendation.summary ? recommendation.summary : ''
    }).catch(function (err) {
      console.warn('Temporadas AI season fields update skipped', err);
    });
  }

  function _recommendationFromSnapshots(snapshots) {
    var daily = snapshots && snapshots.daily;
    return daily && daily.aiRecommendation ? daily.aiRecommendation : null;
  }

  function _fallbackRecommendationForUI() {
    if (window.SeasonsAI && typeof SeasonsAI.getFallbackRecommendation === 'function') {
      return SeasonsAI.getFallbackRecommendation(_buildAIContext(_state.activeSeason || {}, _state.snapshots || {}));
    }
    return {
      mainAction: {
        title: 'Acompanhar a temporada por mais alguns dias',
        description: 'Ainda há poucos dados disponíveis para recomendar uma ação específica.',
        why: 'A recomendação usa apenas dados calculados pelo BocaFood.',
        howToApply: ['Continue registrando pedidos normalmente.', 'Revise progresso, score e risco nos próximos dias.'],
        metricToWatch: 'Progresso',
        reviewInDays: 7,
        riskIfIgnored: 'A temporada pode ficar sem leitura operacional suficiente.'
      },
      secondaryActions: [],
      summary: 'Aguardar mais dados operacionais.',
      confidence: 'low',
      dataLimitations: ['Poucos dados disponíveis']
    };
  }

  function _snapshotRange(season, snapshotType) {
    var now = new Date();
    var seasonStart = _toDate(season.startDate || season.startedAt || season.createdAt) || now;
    var seasonEnd = _toDate(season.endDate) || now;
    var periodEnd = now < seasonEnd ? now : seasonEnd;
    var periodStart;

    if (snapshotType === 'final') {
      periodStart = seasonStart;
    } else if (snapshotType === 'weekly') {
      periodStart = new Date(periodEnd.getTime());
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart = _dayStart(periodEnd);
    }

    if (periodStart < seasonStart) periodStart = seasonStart;
    if (periodEnd < periodStart) periodEnd = periodStart;
    return { periodStart: periodStart, periodEnd: periodEnd };
  }

  function _mainMetricsForSnapshot(season, metrics) {
    if (season.objective === 'sell_more') {
      return { revenue: metrics.revenue, orders: metrics.orders, activeDays: metrics.activeDays };
    }
    if (season.objective === 'increase_ticket') {
      return {
        averageTicket: metrics.averageTicket,
        averageOrderValue: metrics.averageTicket,
        averageItemsPerOrder: metrics.averageItemsPerOrder
      };
    }
    if (season.objective === 'retain_customers') {
      return {
        recurringCustomers: metrics.recurringCustomers,
        repurchaseRate: metrics.repurchaseRate,
        averageFrequency: metrics.averageFrequency
      };
    }
    if (season.objective === 'improve_consistency') {
      return {
        activeDays: metrics.activeDays,
        weeklyRegularity: metrics.weeklyRegularity,
        weakDays: metrics.weakDays
      };
    }
    return {};
  }

  function _auxiliaryMetricsForSnapshot(metrics, confidence) {
    return {
      confidence: confidence,
      revenue: metrics.revenue,
      orders: metrics.orders,
      averageTicket: metrics.averageTicket,
      activeDays: metrics.activeDays,
      recurringCustomers: metrics.recurringCustomers,
      repurchaseRate: metrics.repurchaseRate,
      averageFrequency: metrics.averageFrequency,
      averageItemsPerOrder: metrics.averageItemsPerOrder,
      weeklyRegularity: metrics.weeklyRegularity,
      strongHours: metrics.strongHours || [],
      weakDays: metrics.weakDays
    };
  }

  function _snapshotAlerts(season, metrics, confidence) {
    var alerts = [];
    if (confidence === 'low') {
      alerts.push(_snapshotAlert('low_confidence', 'warning', 'Baixa confiança', 'Há poucos dados no período consolidado.', 'orders', metrics.orders, 3));
    }
    if (season.riskLevel === 'high' || season.riskLevel === 'very_high') {
      alerts.push(_snapshotAlert('risk_level', season.riskLevel === 'very_high' ? 'critical' : 'warning', 'Chance de falha elevada', 'A temporada exige atenção pelo histórico, meta ou ritmo atual.', 'riskLevel', season.riskLevel, 'low'));
    }
    if (_number(season.progressPercent, 0) >= 100) {
      alerts.push(_snapshotAlert('target_reached', 'success', 'Meta atingida', 'A métrica principal atingiu ou superou a meta atual.', 'progressPercent', season.progressPercent, 100));
    }
    if (season.objective === 'sell_more' && !metrics.orders) {
      alerts.push(_snapshotAlert('no_orders', 'warning', 'Sem pedidos no período', 'Nenhum pedido válido foi encontrado no período do snapshot.', 'orders', 0, 1));
    }
    return alerts;
  }

  function _snapshotAlert(type, severity, title, message, metric, value, expectedValue) {
    return {
      id: type + '-' + _dateKey(new Date()),
      type: type,
      severity: severity,
      title: title,
      message: message,
      metric: metric,
      value: value,
      expectedValue: expectedValue,
      createdAt: new Date().toISOString()
    };
  }

  function _snapshotConfidence(orderCount) {
    if (orderCount >= 10) return 'high';
    if (orderCount >= 3) return 'medium';
    return 'low';
  }

  function _finalizeSeason(season) {
    return _assertReady().then(function () {
      if (!season || !season.id) throw new Error('Temporada sem id.');
      if (typeof DB.getDoc !== 'function' || typeof DB.update !== 'function') throw new Error('DB indisponível para finalizar temporada.');
      return DB.getDoc('seasons', season.id);
    }).then(function (fresh) {
      if (!fresh) throw new Error('Temporada não encontrada.');
      if (fresh.tenantId && fresh.tenantId !== _tenantId) throw new Error('Temporada pertence a outro tenant.');
      if (fresh.status === 'finished') throw new Error('Temporada já finalizada.');
      if (fresh.status === 'abandoned') throw new Error('Temporada abandonada não pode ser finalizada.');
      if (fresh.status !== 'active') throw new Error('Apenas temporada ativa pode ser finalizada.');

      return _loadScoreOrders(fresh).then(function (orders) {
        var scored = _calculateSeasonScore(fresh, orders || []);
        var finalSeasonBase = Object.assign({}, fresh, {
          currentScore: scored.currentScore,
          currentStatus: scored.currentStatus,
          riskLevel: scored.riskLevel,
          progressPercent: scored.progressPercent,
          currentMetrics: scored.currentMetrics
        });
        var finalPatch = _buildFinalSeasonPatch(finalSeasonBase);
        var finishedSeason = Object.assign({}, finalSeasonBase, finalPatch, { id: fresh.id });

        return DB.update('seasons', fresh.id, finalPatch).then(function () {
          return _createFinalSnapshot(finishedSeason).then(function () {
            return finishedSeason;
          });
        });
      });
    });
  }

  function _buildFinalSeasonPatch(season) {
    var now = new Date().toISOString();
    var finalProgress = _number(season.progressPercent, 0);
    var finalScore = _number(season.currentScore, 0);
    var finalResult = _finalResultForSeason(season);
    var finalSummary = _finalSummaryForSeason(season, finalResult);

    return {
      status: 'finished',
      finalResult: finalResult,
      finalScore: Math.round(finalScore),
      finalProgressPercent: finalProgress,
      finalMetrics: season.currentMetrics || {},
      finalSummary: finalSummary,
      currentScore: Math.round(finalScore),
      currentStatus: season.currentStatus || _statusFromScore(finalScore),
      riskLevel: season.riskLevel || 'unknown',
      progressPercent: finalProgress,
      currentMetrics: season.currentMetrics || {},
      finishedAt: now
    };
  }

  function _finalResultForSeason(season) {
    var progress = _number(season.progressPercent, 0);
    var score = _number(season.currentScore, 0);
    var risk = season.riskLevel || 'unknown';
    var hasRelevantEvolution = score >= 65 || risk === 'low' || risk === 'medium';

    if (progress >= 100) return 'Vitória Total';
    if (progress >= 75 && hasRelevantEvolution) return 'Vitória Parcial';
    if (progress >= 40 || score >= 40) return 'Temporada Instável';
    return 'Falha Operacional';
  }

  function _finalSummaryForSeason(season, finalResult) {
    var metrics = season.currentMetrics || {};
    var worked = [];
    var blocked = [];

    if (_number(metrics.currentValue, 0) >= _number(metrics.targetValue, 0) && _number(metrics.targetValue, 0) > 0) {
      worked.push('A métrica principal atingiu a meta definida.');
    }
    if (_number(season.currentScore, 0) >= 65) worked.push('O score operacional ficou dentro de uma faixa saudável.');
    if (_number(metrics.orders, 0) > 0) worked.push('A temporada teve dados reais de pedidos para análise.');
    if (_number(metrics.activeDays, 0) > 0) worked.push('Houve dias ativos suficientes para medir ritmo operacional.');
    if (_number(metrics.recurringCustomers, 0) > 0) worked.push('Foram detectados clientes recorrentes durante o período.');

    if (_number(season.progressPercent, 0) < 75) blocked.push('O progresso ficou abaixo de 75% da meta.');
    if (season.riskLevel === 'high' || season.riskLevel === 'very_high') blocked.push('A chance de falha permaneceu elevada no encerramento.');
    if (!_number(metrics.orders, 0)) blocked.push('Faltaram pedidos válidos no período analisado.');
    if (_number(metrics.weeklyRegularity, 1) < .55) blocked.push('A regularidade semanal ficou instável.');
    if (!_number(metrics.recurringCustomers, 0) && season.objective === 'retain_customers') blocked.push('A recorrência de clientes ficou baixa.');

    return {
      worked: worked.length ? worked : ['Houve base suficiente para encerrar a temporada com leitura objetiva.'],
      blocked: blocked.length ? blocked : ['Nenhum bloqueio crítico foi detectado nas métricas finais.'],
      evolution: _finalEvolutionText(season, finalResult),
      nextSeasonSuggestion: _nextSeasonSuggestion(season),
      suggestionReason: _nextSeasonReason(season)
    };
  }

  function _finalEvolutionText(season, finalResult) {
    var progress = Math.round(_number(season.progressPercent, 0));
    var score = Math.round(_number(season.currentScore, 0));
    if (finalResult === 'Vitória Total') return 'A temporada atingiu a meta e encerrou com score ' + score + '.';
    if (finalResult === 'Vitória Parcial') return 'A temporada chegou a ' + progress + '% da meta com sinais operacionais relevantes.';
    if (finalResult === 'Temporada Instável') return 'Houve avanço parcial, mas o ritmo não ficou estável o suficiente.';
    return 'A temporada ficou abaixo do esperado e precisa de uma meta mais simples ou base operacional mais consistente.';
  }

  function _nextSeasonSuggestion(season) {
    var metrics = season.currentMetrics || {};
    var baselineTicket = _number(season.baselineAverageTicket, 0);
    var ticketLow = baselineTicket > 0 && _number(metrics.averageTicket, 0) < baselineTicket;
    var ordersLow = _number(season.baselineOrders, 0) > 0 && _number(metrics.orders, 0) < _number(season.baselineOrders, 0);
    var recurrenceLow = _number(metrics.recurringCustomers, 0) <= 0 || _number(metrics.repurchaseRate, 0) < .15;
    var consistencyLow = _number(metrics.weeklyRegularity, 1) < .55 || _number(metrics.activeDays, 0) <= Math.max(1, Math.round(_number(season.baselineActiveDays, 0) * .7));

    if (season.objective === 'sell_more' && _number(metrics.revenue, 0) > 0 && ticketLow) return 'increase_ticket';
    if (season.objective === 'increase_ticket' && _number(season.progressPercent, 0) >= 75 && ordersLow) return 'sell_more';
    if (recurrenceLow) return 'retain_customers';
    if (consistencyLow) return 'improve_consistency';
    if (!_number(metrics.orders, 0)) return 'sell_more';
    return 'improve_consistency';
  }

  function _nextSeasonReason(season) {
    var next = _nextSeasonSuggestion(season);
    if (next === 'increase_ticket') return 'O faturamento apareceu, mas o ticket médio pode sustentar melhor a margem.';
    if (next === 'sell_more') return 'O próximo ciclo deve recuperar volume e frequência de pedidos.';
    if (next === 'retain_customers') return 'A recorrência ainda está baixa e pode melhorar a base de clientes ativos.';
    if (next === 'improve_consistency') return 'O próximo ciclo deve reduzir oscilação e distribuir melhor os dias com venda.';
    return 'Sugestão gerada a partir das métricas finais disponíveis.';
  }

  function _createFinalSnapshot(season) {
    var dateKey = _dateKey(season.finishedAt || new Date());
    return _findSnapshot(season.id, 'final', dateKey).then(function (existing) {
      if (existing) return existing;
      return _loadSnapshotOrders(season, 'final').then(function (orders) {
        var payload = _buildSnapshotPayload(season, 'final', dateKey, orders || []);
        payload.score = _number(season.finalScore, season.currentScore || 0);
        payload.progressPercent = _number(season.finalProgressPercent, season.progressPercent || 0);
        payload.status = 'finished';
        payload.riskLevel = season.riskLevel || 'unknown';
        payload.metrics = season.finalMetrics || season.currentMetrics || payload.metrics;
        payload.mainMetrics = _mainMetricsForSnapshot(season, payload.metrics || {});
        payload.auxiliaryMetrics = _auxiliaryMetricsForSnapshot(payload.metrics || {}, payload.confidence || 'low');
        payload.insights = _finalInsights(season);
        return DB.add('season_metrics_snapshots', payload);
      });
    });
  }

  function _finalInsights(season) {
    var summary = season.finalSummary || {};
    return [
      { type: 'final_result', title: season.finalResult || 'Resultado final', message: summary.evolution || '' },
      { type: 'next_season', title: 'Próxima temporada sugerida', message: _objectiveLabel(summary.nextSeasonSuggestion || '') }
    ];
  }

  function _loadScoreOrders(season) {
    if (window.DB && typeof DB.col === 'function') {
      var period = _seasonPeriod(season);
      return DB.col('orders')
        .where('createdAt', '>=', period.baselineStart)
        .where('createdAt', '<=', period.currentEnd)
        .get()
        .then(function (snap) {
          return snap.docs.map(function (doc) {
            return Object.assign({}, doc.data(), { id: doc.id });
          });
        }).catch(function (err) {
          console.warn('Temporadas period query fallback', err);
          return DB.getAll('orders');
        });
    }
    return DB.getAll('orders');
  }

  function _calculateSeasonScore(season, allOrders) {
    var period = _seasonPeriod(season);
    var currentOrders = _ordersInPeriod(allOrders || [], period.start, period.currentEnd);
    var baselineOrders = _ordersInPeriod(allOrders || [], period.baselineStart, period.start);
    var current = _buildRuntimeMetrics(currentOrders, period.elapsedDays || 1);
    var baseline = _buildRuntimeMetrics(baselineOrders, period.durationDays || 30);
    var target = _targetValueForSeason(season);
    var primaryValue = _primaryValueForObjective(current, season.objective);
    var progressPercent = target > 0 ? (primaryValue / target) * 100 : 0;
    var score = _scoreByObjective(season, current, baseline, target, period);
    var pace = _paceStatus(progressPercent, period, current, season);
    var status = pace.status;
    var recentDrop = _hasRecentDrop(season, allOrders || [], period);
    var risk = _riskFromProgress(progressPercent, period, recentDrop, season);

    return {
      currentScore: Math.round(_clamp(score, 0, 100)),
      currentStatus: status,
      riskLevel: risk,
      progressPercent: Math.max(0, progressPercent),
      currentMetrics: {
        currentValue: primaryValue,
        targetValue: target,
        revenue: current.revenue,
        orders: current.orders,
        averageTicket: current.averageTicket,
        activeDays: current.activeDays,
        recurringCustomers: current.recurringCustomers,
        repurchaseRate: current.repurchaseRate,
        averageFrequency: current.averageFrequency,
        averageItemsPerOrder: current.averageItemsPerOrder,
        weeklyRegularity: current.weeklyRegularity,
        weakDays: current.weakDays,
        strongHours: current.strongHours || [],
        topProducts: current.topProducts || [],
        lowSellingProducts: current.lowSellingProducts || [],
        elapsedDays: period.elapsedDays,
        daysRemaining: period.daysRemaining,
        expectedProgress: pace.expectedProgress,
        progressRatio: pace.progressRatio,
        observations: _metricObservations(season, current)
      }
    };
  }

  function _seasonPeriod(season) {
    var now = new Date();
    var start = _toDate(season.startDate || season.startedAt || season.createdAt) || now;
    var configuredEnd = _toDate(season.endDate);
    var duration = _durationDays(season);
    var end = configuredEnd || new Date(start.getTime() + duration * 86400000);
    var currentEnd = now < end ? now : end;
    if (currentEnd < start) currentEnd = start;

    var elapsedMs = Math.max(0, currentEnd.getTime() - start.getTime());
    var totalMs = Math.max(86400000, end.getTime() - start.getTime());
    var baselineStart = new Date(start.getTime());
    baselineStart.setDate(baselineStart.getDate() - duration);

    return {
      start: start,
      end: end,
      currentEnd: currentEnd,
      baselineStart: baselineStart,
      durationDays: duration,
      elapsedDays: Math.max(1, Math.ceil(elapsedMs / 86400000)),
      daysRemaining: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)),
      expectedProgress: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
    };
  }

  function _durationDays(season) {
    if (season.durationType === 'season') return 90;
    if (season.durationType === 'sprint') return 30;
    var start = _toDate(season.startDate || season.startedAt);
    var end = _toDate(season.endDate);
    if (start && end) return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    return 30;
  }

  function _buildRuntimeMetrics(orders, days) {
    var base = _buildBaselineMetrics(orders, days);
    var customers = {};
    var products = {};
    var hours = {};
    (orders || []).forEach(function (order) {
      var key = _customerKey(order);
      if (key) customers[key] = (customers[key] || 0) + 1;
      _orderProducts(order).forEach(function (product) {
        var name = product.name || 'Produto sem nome';
        if (!products[name]) products[name] = { name: name, quantity: 0, revenue: 0 };
        products[name].quantity += product.quantity;
        products[name].revenue += product.revenue;
      });
      var hour = _orderHour(order);
      if (hour !== null) {
        if (!hours[hour]) hours[hour] = { hour: hour, orders: 0, revenue: 0 };
        hours[hour].orders += 1;
        hours[hour].revenue += _money(order.total);
      }
    });
    var customerKeys = Object.keys(customers);
    var frequencyTotal = customerKeys.reduce(function (sum, key) { return sum + customers[key]; }, 0);
    var weakDays = Math.max(0, _number(days, 0) - base.baselineActiveDays);
    var topProducts = Object.keys(products).map(function (key) { return products[key]; }).sort(function (a, b) {
      return b.quantity - a.quantity || b.revenue - a.revenue;
    }).slice(0, 5);
    var strongHours = Object.keys(hours).map(function (key) { return hours[key]; }).sort(function (a, b) {
      return b.orders - a.orders || b.revenue - a.revenue;
    }).slice(0, 5);

    return {
      revenue: base.baselineRevenue,
      orders: base.baselineOrders,
      averageTicket: base.baselineAverageTicket,
      averageItemsPerOrder: base.baselineAverageItemsPerOrder,
      activeDays: base.baselineActiveDays,
      recurringCustomers: base.baselineRecurringCustomers,
      repurchaseRate: base.baselineRepurchaseRate,
      averageFrequency: customerKeys.length ? frequencyTotal / customerKeys.length : 0,
      weakDays: weakDays,
      weeklyRegularity: _weeklyRegularity(orders),
      strongHours: strongHours,
      topProducts: topProducts,
      lowSellingProducts: []
    };
  }

  function _scoreByObjective(season, current, baseline, target, period) {
    if (season.objective === 'sell_more') {
      var revenueTarget = target || _derivedTarget(season.baselineRevenue, current.revenue);
      var orderTarget = _derivedTarget(season.baselineOrders, current.orders);
      var activeDaysTarget = Math.min(period.durationDays, _derivedTarget(season.baselineActiveDays, current.activeDays));
      return _weightedScore([
        { value: current.revenue, target: revenueTarget, weight: 45 },
        { value: current.orders, target: orderTarget, weight: 35 },
        { value: current.activeDays, target: activeDaysTarget, weight: 20 }
      ]);
    }

    if (season.objective === 'increase_ticket') {
      var ticketTarget = target || _derivedTarget(season.baselineAverageTicket, current.averageTicket);
      var orderValueTarget = _derivedTarget(season.baselineAverageTicket, current.averageTicket);
      var itemsTarget = _derivedTarget(baseline.averageItemsPerOrder, current.averageItemsPerOrder);
      return _weightedScore([
        { value: current.averageTicket, target: ticketTarget, weight: 50 },
        { value: current.averageTicket, target: orderValueTarget, weight: 25 },
        { value: current.averageItemsPerOrder, target: itemsTarget, weight: 25 }
      ]);
    }

    if (season.objective === 'retain_customers') {
      var recurringTarget = target || _derivedTarget(season.baselineRecurringCustomers, current.recurringCustomers);
      var repurchaseTarget = _derivedTarget(season.baselineRepurchaseRate, current.repurchaseRate);
      var frequencyTarget = _derivedTarget(baseline.averageFrequency, current.averageFrequency);
      return _weightedScore([
        { value: current.recurringCustomers, target: recurringTarget, weight: 45 },
        { value: current.repurchaseRate, target: repurchaseTarget, weight: 35 },
        { value: current.averageFrequency, target: frequencyTarget, weight: 20 }
      ]);
    }

    if (season.objective === 'improve_consistency') {
      var activeTarget = target || _derivedTarget(season.baselineActiveDays, current.activeDays);
      var weakBaseline = Math.max(1, baseline.weakDays);
      var weakReductionScore = current.weakDays <= weakBaseline ? 100 : Math.max(0, (weakBaseline / Math.max(1, current.weakDays)) * 100);
      return _weightedScore([
        { value: current.activeDays, target: activeTarget, weight: 40 },
        { value: current.weeklyRegularity, target: 1, weight: 35 },
        { score: weakReductionScore, weight: 25 }
      ]);
    }

    return target > 0 ? _clamp((_primaryValueForObjective(current, season.objective) / target) * 100, 0, 100) : 0;
  }

  function _weightedScore(parts) {
    var totalWeight = 0;
    var totalScore = 0;
    (parts || []).forEach(function (part) {
      var weight = _number(part.weight, 0);
      if (!weight) return;
      totalWeight += weight;
      var score = part.score !== undefined ? _number(part.score, 0) : _ratioScore(part.value, part.target);
      totalScore += _clamp(score, 0, 100) * weight;
    });
    return totalWeight ? totalScore / totalWeight : 0;
  }

  function _ratioScore(value, target) {
    value = _number(value, 0);
    target = _number(target, 0);
    if (target <= 0) return value > 0 ? 100 : 0;
    return (value / target) * 100;
  }

  function _targetValueForSeason(season) {
    var calculated = _nullableNumber(season.calculatedTargetValue);
    if (calculated !== null && calculated > 0) return calculated;
    var fixed = _nullableNumber(season.targetValue);
    return fixed !== null && fixed > 0 ? fixed : 0;
  }

  function _primaryValueForObjective(metrics, objective) {
    if (objective === 'sell_more') return _number(metrics.revenue, 0);
    if (objective === 'increase_ticket') return _number(metrics.averageTicket, 0);
    if (objective === 'retain_customers') return _number(metrics.recurringCustomers, 0) || _number(metrics.repurchaseRate, 0);
    if (objective === 'improve_consistency') return _number(metrics.activeDays, 0);
    return 0;
  }

  function _derivedTarget(base, current) {
    base = _number(base, 0);
    if (base > 0) return base;
    current = _number(current, 0);
    return current > 0 ? current : 1;
  }

  function _statusFromScore(score) {
    score = _number(score, 0);
    if (score >= 85) return 'Excelente';
    if (score >= 65) return 'Estável';
    if (score >= 40) return 'Instável';
    return 'Crítico';
  }

  function _paceStatus(progressPercent, period, current, season) {
    var expected = _expectedProgressForPace(period);
    var progress = Math.max(0, _number(progressPercent, 0));
    var ratio = expected > 0 ? progress / expected : (progress > 0 ? 1 : 0);
    var elapsed = _number(period.elapsedDays, 1);
    var grace = _criticalGraceDays(period);
    var hasEnoughData = _hasEnoughRuntimeData(current, season);

    if (!hasEnoughData && elapsed <= 1) {
      return { status: 'starting', expectedProgress: expected, progressRatio: ratio };
    }

    if (ratio >= 1.10) return { status: 'Excelente', expectedProgress: expected, progressRatio: ratio };
    if (ratio >= .80) return { status: 'Estável', expectedProgress: expected, progressRatio: ratio };
    if (ratio >= .50) return { status: 'Instável', expectedProgress: expected, progressRatio: ratio };
    if (elapsed <= grace) return { status: hasEnoughData ? 'Instável' : 'starting', expectedProgress: expected, progressRatio: ratio };
    return { status: 'Crítico', expectedProgress: expected, progressRatio: ratio };
  }

  function _expectedProgressForPace(period) {
    var elapsed = Math.max(1, _number(period.elapsedDays, 1));
    var duration = Math.max(1, _number(period.durationDays, 30));
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  }

  function _criticalGraceDays(period) {
    return _number(period.durationDays, 30) >= 90 ? 7 : 3;
  }

  function _hasEnoughRuntimeData(current, season) {
    if (!current) return false;
    if (_number(current.orders, 0) > 0) return true;
    if (season && season.objective === 'improve_consistency' && _number(current.activeDays, 0) > 0) return true;
    return false;
  }

  function _statusScoreLabel(value) {
    return ({
      excellent: 'Excelente',
      stable: 'Estável',
      unstable: 'Instável',
      critical: 'Crítico',
      pending: 'Inicial',
      starting: 'Em início',
      Excelente: 'Excelente',
      'Estável': 'Estável',
      'Instável': 'Instável',
      'Crítico': 'Crítico',
      'Em início': 'Em início'
    })[value] || value || 'Inicial';
  }

  function _riskFromProgress(progressPercent, period, recentDrop, season) {
    var progress = _clamp(progressPercent, 0, 100);
    var expected = _expectedProgressForPace(period);
    var gap = expected - progress;
    var baseRisk = _normalizeRisk((season && (season.initialRiskLevel || season.riskLevel)) || 'unknown');
    var dynamicRisk = 'low';
    var elapsed = _number(period.elapsedDays, 1);
    var grace = _criticalGraceDays(period);

    if (elapsed <= grace && progress <= expected) {
      return baseRisk;
    }

    if (period.daysRemaining <= 0 && progress < 75) dynamicRisk = 'very_high';
    else if (gap <= 0) dynamicRisk = 'low';
    else if (gap <= 15) dynamicRisk = 'medium';
    else if (gap <= 35) dynamicRisk = 'high';
    else dynamicRisk = 'very_high';

    var risk = _maxRisk(baseRisk, dynamicRisk);
    if (recentDrop && elapsed > grace) risk = _escalateRisk(risk);
    return risk;
  }

  function _normalizeRisk(value) {
    return ({ low: 'low', medium: 'medium', high: 'high', very_high: 'very_high', unknown: 'unknown' })[value] || 'unknown';
  }

  function _riskRank(value) {
    return ({ unknown: 0, low: 1, medium: 2, high: 3, very_high: 4 })[_normalizeRisk(value)] || 0;
  }

  function _maxRisk(a, b) {
    return _riskRank(a) >= _riskRank(b) ? _normalizeRisk(a) : _normalizeRisk(b);
  }

  function _hasRecentDrop(season, orders, period) {
    var end = period.currentEnd;
    var recentStart = new Date(end.getTime());
    recentStart.setDate(recentStart.getDate() - 7);
    var previousStart = new Date(recentStart.getTime());
    previousStart.setDate(previousStart.getDate() - 7);

    var recent = _buildRuntimeMetrics(_ordersInPeriod(orders, recentStart, end), 7);
    var previous = _buildRuntimeMetrics(_ordersInPeriod(orders, previousStart, recentStart), 7);
    var recentValue = _primaryValueForObjective(recent, season.objective);
    var previousValue = _primaryValueForObjective(previous, season.objective);
    return previousValue > 0 && recentValue < previousValue * .75;
  }

  function _escalateRisk(risk) {
    if (risk === 'low') return 'medium';
    if (risk === 'medium') return 'high';
    if (risk === 'high') return 'very_high';
    return risk || 'unknown';
  }

  function _weeklyRegularity(orders) {
    var weeks = {};
    (orders || []).forEach(function (order) {
      var date = _orderDate(order);
      if (!date) return;
      var weekStart = new Date(date.getTime());
      weekStart.setDate(date.getDate() - date.getDay());
      var key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    var counts = Object.keys(weeks).map(function (key) { return weeks[key]; });
    if (!counts.length) return 0;
    if (counts.length === 1) return 1;
    var avg = counts.reduce(function (sum, value) { return sum + value; }, 0) / counts.length;
    if (!avg) return 0;
    var variance = counts.reduce(function (sum, value) {
      var diff = value - avg;
      return sum + diff * diff;
    }, 0) / counts.length;
    return _clamp(1 - (Math.sqrt(variance) / avg), 0, 1);
  }

  function _orderItemCount(order) {
    var items = order.items || order.itens || order.products || [];
    if (!Array.isArray(items)) return _number(order.itemsCount || order.itemCount || order.quantity || 1, 1);
    if (!items.length) return 1;
    return items.reduce(function (sum, item) {
      return sum + Math.max(1, _number(item.qty || item.quantity || item.qtd || item.quantidade, 1));
    }, 0);
  }

  function _orderProducts(order) {
    var items = order.items || order.itens || order.products || [];
    if (!Array.isArray(items)) return [];
    return items.map(function (item) {
      var name = item.name || item.productName || item.nome || item.title || '';
      var quantity = Math.max(1, _number(item.qty || item.quantity || item.qtd || item.quantidade, 1));
      var revenue = _money(item.total || item.lineTotal || item.priceTotal || item.subtotal || item.price || item.preco || 0);
      return { name: String(name || 'Produto sem nome').slice(0, 90), quantity: quantity, revenue: revenue };
    }).filter(function (item) { return item.name; });
  }

  function _metricObservations(season, current) {
    var notes = [];
    if (season.objective === 'increase_ticket' && current.averageItemsPerOrder <= 1) {
      notes.push('upsell_fallback_items_per_order');
    }
    if (season.objective === 'retain_customers' && !current.recurringCustomers) {
      notes.push('retention_fallback_customer_phone_or_email');
    }
    return notes;
  }

  function _shouldPersistMetrics(season, updates) {
    if (Math.round(_number(season.currentScore, -1)) !== Math.round(_number(updates.currentScore, -1))) return true;
    if (season.currentStatus !== updates.currentStatus) return true;
    if (season.riskLevel !== updates.riskLevel) return true;
    if (Math.abs(_number(season.progressPercent, 0) - _number(updates.progressPercent, 0)) >= .1) return true;
    if (updates.goalReachedAt && !season.goalReachedAt) return true;
    if (updates.goalCelebrationPending !== undefined && updates.goalCelebrationPending !== season.goalCelebrationPending) return true;
    return JSON.stringify(season.currentMetrics || {}) !== JSON.stringify(updates.currentMetrics || {});
  }

  function _resolveActiveSeason(seasons) {
    return (seasons || []).filter(function (season) { return season.status === 'active'; }).sort(function (a, b) {
      return _dateValue(b.startedAt || b.startDate || b.createdAt) - _dateValue(a.startedAt || a.startDate || a.createdAt);
    })[0] || null;
  }

  function _refreshSeasonStateFlags() {
    _state.activeSeason = _resolveActiveSeason(_state.seasons);
    _state.activeConflict = (_state.seasons || []).filter(function (season) { return season.status === 'active'; }).length > 1;
    _state.scheduledStartConflict = _hasDueScheduled(_state.seasons) && !!_state.activeSeason;
  }

  function _historySeasons() {
    return (_state.seasons || []).filter(function (season) {
      return season.status === 'finished' || season.status === 'abandoned';
    });
  }

  function _scheduledSeasons() {
    return (_state.seasons || []).filter(function (season) {
      return season.status === 'scheduled';
    }).sort(function (a, b) {
      return _dateValue(a.startDate || a.createdAt) - _dateValue(b.startDate || b.createdAt);
    });
  }

  function _hasDueScheduled(seasons) {
    var today = _dayStart(new Date());
    return (seasons || []).some(function (season) {
      var start = _toDate(season.startDate);
      return season.status === 'scheduled' && start && start <= today;
    });
  }

  function _promoteDueScheduledSeasons(seasons) {
    seasons = _normalizeSeasons(seasons || []);
    if (!window.DB || typeof DB.update !== 'function') return Promise.resolve(seasons);
    if (_resolveActiveSeason(seasons)) return Promise.resolve(seasons);
    var today = _dayStart(new Date());
    var due = seasons.filter(function (season) {
      var start = _toDate(season.startDate);
      return season.status === 'scheduled' && start && start <= today;
    }).sort(function (a, b) {
      return _dateValue(a.startDate || a.createdAt) - _dateValue(b.startDate || b.createdAt);
    })[0];
    if (!due || !due.id) return Promise.resolve(seasons);

    var now = new Date().toISOString();
    var patch = {
      status: 'active',
      startedAt: now,
      updatedAt: now
    };
    return DB.update('seasons', due.id, patch).then(function () {
      return seasons.map(function (season) {
        return season.id === due.id ? Object.assign({}, season, patch) : season;
      });
    }).catch(function (err) {
      console.warn('Temporadas scheduled promotion skipped', err);
      return seasons;
    });
  }

  function createSeason(data) {
    return _assertReady().then(function () {
      var payload = _normalizeSeasonPayload(data || {});
      return _assertNoOverlappingSeason(payload).then(function () {
        if (payload.status === 'active') {
          return _assertNoActiveSeason().then(function () {
            return DB.add('seasons', payload);
          });
        }
        return DB.add('seasons', payload);
      });
    }).then(function (ref) {
      return _loadSeasonsPromise().then(function () { return ref; });
    });
  }

  function updateSeason(id, data) {
    return _assertReady().then(function () {
      if (!id) throw new Error('Temporada sem id.');
      return DB.getDoc('seasons', id);
    }).then(function (season) {
      if (!season) throw new Error('Temporada não encontrada.');
      if (season.tenantId && season.tenantId !== _tenantId) throw new Error('Temporada pertence a outro tenant.');
      if (season.status === 'active') throw new Error('Temporada ativa não pode ser editada.');
      if (season.status === 'finished') throw new Error('Temporada finalizada não pode ser editada.');
      if (season.status === 'abandoned') throw new Error('Temporada abandonada não pode ser reativada.');

      var next = _normalizeSeasonPayload(Object.assign({}, season, data || {}), { partial: true });
      if (next.status === 'active' || next.status === 'scheduled') {
        return _assertNoOverlappingSeason(next, id).then(function () {
          if (next.status !== 'active') return true;
          return _assertNoActiveSeason(id);
        }).then(function () {
          return DB.update('seasons', id, next);
        });
      }
      return DB.update('seasons', id, next);
    }).then(function () {
      return _loadSeasonsPromise();
    });
  }

  function getActiveSeason() {
    return _assertReady().then(function () {
      return DB.getAll('seasons');
    }).then(function (seasons) {
      return _resolveActiveSeason(_normalizeSeasons(seasons || []));
    });
  }

  function listSeasons() {
    return _assertReady().then(function () {
      return DB.getAll('seasons');
    }).then(function (seasons) {
      return _normalizeSeasons(seasons || []);
    });
  }

  function _assertReady() {
    _tenantId = (window.Auth && typeof Auth.getTenantId === 'function') ? (Auth.getTenantId() || '') : '';
    if (!_tenantId) return Promise.reject(new Error('Tenant não identificado.'));
    if (!window.DB || typeof DB.getAll !== 'function' || typeof DB.add !== 'function') {
      return Promise.reject(new Error('DB indisponível.'));
    }
    return Promise.resolve();
  }

  function _assertNoActiveSeason(ignoreId) {
    return DB.getAll('seasons').then(function (seasons) {
      var active = _normalizeSeasons(seasons || []).filter(function (season) {
        return season.status === 'active' && season.id !== ignoreId;
      });
      if (active.length) throw new Error('Já existe uma temporada ativa neste tenant.');
      return true;
    });
  }

  function _assertNoOverlappingSeason(candidate, ignoreId) {
    if (!candidate || (candidate.status !== 'active' && candidate.status !== 'scheduled')) return Promise.resolve(true);
    var cStart = _toDate(candidate.startDate || candidate.startedAt || candidate.createdAt);
    var cEnd = _toDate(candidate.endDate);
    if (!cStart || !cEnd) return Promise.resolve(true);
    return DB.getAll('seasons').then(function (seasons) {
      var conflict = _normalizeSeasons(seasons || []).filter(function (season) {
        if (!season || season.id === ignoreId) return false;
        if (season.status !== 'active' && season.status !== 'scheduled') return false;
        var sStart = _toDate(season.startDate || season.startedAt || season.createdAt);
        var sEnd = _toDate(season.endDate);
        return sStart && sEnd && _periodsOverlap(cStart, cEnd, sStart, sEnd);
      })[0];
      if (conflict) throw new Error('Já existe uma temporada programada ou ativa nesse período. Escolha outra data.');
      return true;
    });
  }

  function _loadSeasonsPromise() {
    return listSeasons().then(function (seasons) {
      _state.seasons = seasons;
      _refreshSeasonStateFlags();
      _paint();
      return seasons;
    });
  }

  function _normalizeSeasonPayload(data, opts) {
    opts = opts || {};
    var status = ALLOWED_STATUS[data.status] ? data.status : 'draft';
    var payload = {
      tenantId: _tenantId,
      title: String(data.title || '').trim() || 'Temporada',
      objective: data.objective || '',
      build: data.build || '',
      difficulty: data.difficulty || '',
      durationType: data.durationType || '',
      targetMode: data.targetMode || '',
      targetValue: _nullableNumber(data.targetValue),
      targetMetric: data.targetMetric || '',
      baselinePeriod: data.baselinePeriod || '',
      baselineValue: _nullableNumber(data.baselineValue),
      baselineRevenue: _number(data.baselineRevenue, 0),
      baselineOrders: _number(data.baselineOrders, 0),
      baselineAverageTicket: _number(data.baselineAverageTicket, 0),
      baselineActiveDays: _number(data.baselineActiveDays, 0),
      baselineRecurringCustomers: _number(data.baselineRecurringCustomers, 0),
      baselineRepurchaseRate: _number(data.baselineRepurchaseRate, 0),
      baselineConfidence: data.baselineConfidence || 'low',
      calculatedTargetValue: _nullableNumber(data.calculatedTargetValue),
      initialRiskLevel: data.initialRiskLevel || data.riskLevel || 'unknown',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: status,
      currentScore: _number(data.currentScore, 0),
      currentStatus: data.currentStatus || (status === 'active' ? 'pending' : 'Inicial'),
      riskLevel: data.riskLevel || data.initialRiskLevel || 'unknown',
      progressPercent: _number(data.progressPercent, 0),
      goalReachedAt: data.goalReachedAt || null,
      goalCelebrationShownAt: data.goalCelebrationShownAt || null,
      goalCelebrationPending: data.goalCelebrationPending === true,
      goalReachedSnapshotId: data.goalReachedSnapshotId || '',
      startedAt: data.startedAt || (status === 'active' ? new Date().toISOString() : null),
      finishedAt: data.finishedAt || null,
      abandonedAt: data.abandonedAt || null
    };
    payload.updatedAt = new Date().toISOString();
    if (!opts.partial) payload.createdAt = data.createdAt || new Date().toISOString();
    return payload;
  }

  function _statusLabel(status) {
    return ({ draft: 'Rascunho', scheduled: 'Programada', active: 'Ativa', finished: 'Finalizada', abandoned: 'Abandonada' })[status] || 'Rascunho';
  }

  function _objectiveLabel(value) {
    return ({
      sell_more: 'Vender Mais',
      increase_ticket: 'Aumentar Ticket',
      retain_customers: 'Fidelizar Clientes',
      improve_consistency: 'Melhorar Consistência'
    })[value] || value || 'Não definido';
  }

  function _buildLabel(value) {
    return ({ volume: 'Volume', margin: 'Margem', retention: 'Fidelização' })[value] || value || 'Não definido';
  }

  function _difficultyLabel(value) {
    return ({ safe: 'Seguro', balanced: 'Equilibrado', aggressive: 'Agressivo' })[value] || value || 'Não definido';
  }

  function _riskLabel(value) {
    return ({ low: 'Baixo', medium: 'Médio', high: 'Alto', very_high: 'Muito alto', unknown: 'Indefinido' })[value] || 'Indefinido';
  }

  function _confidenceLabel(value) {
    return ({ high: 'Alta', medium: 'Média', low: 'Baixa' })[value] || 'Baixa';
  }

  function _formatBaselineValue(value, objective) {
    var n = _number(value, 0);
    if (objective === 'sell_more' || objective === 'increase_ticket') return _fmtMoney(n);
    if (objective === 'retain_customers') return n < 1 && n > 0 ? Math.round(n * 100) + '%' : String(Math.round(n));
    if (objective === 'improve_consistency') return Math.round(n) + ' dia' + (Math.round(n) === 1 ? '' : 's');
    return String(Math.round(n));
  }

  function _formatMetricValue(value, objective) {
    var n = _number(value, 0);
    if (objective === 'sell_more' || objective === 'increase_ticket') return _fmtMoney(n);
    if (objective === 'retain_customers') return n < 1 && n > 0 ? Math.round(n * 100) + '%' : String(Math.round(n));
    if (objective === 'improve_consistency') return Math.round(n) + ' dia' + (Math.round(n) === 1 ? '' : 's');
    return String(Math.round(n));
  }

  function _snapshotUpdatedLabel(snapshots) {
    snapshots = snapshots || {};
    var dates = [snapshots.daily && snapshots.daily.createdAt, snapshots.weekly && snapshots.weekly.createdAt]
      .map(_toDate)
      .filter(Boolean)
      .sort(function (a, b) { return b.getTime() - a.getTime(); });
    if (!dates.length) return 'Ainda não gerada';
    return _formatDateTime(dates[0]);
  }

  function _fmtMoney(value) {
    if (window.UI && typeof UI.fmt === 'function') return UI.fmt(_number(value, 0));
    return '€ ' + _number(value, 0).toFixed(2).replace('.', ',');
  }

  function _formatPeriod(start, end) {
    var s = _formatDate(start);
    var e = _formatDate(end);
    if (s && e) return s + ' até ' + e;
    if (s) return 'Início em ' + s;
    if (e) return 'Até ' + e;
    return 'Período não definido';
  }

  function _formatDate(value) {
    var d = _toDate(value);
    if (!d) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function _formatDateTime(value) {
    var d = _toDate(value);
    if (!d) return '';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function _dateKey(value) {
    var d = _toDate(value) || new Date();
    return d.toISOString().slice(0, 10);
  }

  function _todayKey() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  function _dayStart(value) {
    var d = _toDate(value) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function _weekStart(value) {
    var d = _dayStart(value);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function _dateValue(value) {
    var d = _toDate(value);
    return d ? d.getTime() : 0;
  }

  function _toDate(value) {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function _nullableNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function _number(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function _clamp(value, min, max) {
    return Math.max(min, Math.min(max, _number(value, 0)));
  }

  function _icon(name) {
    var paths = {
      add: '<path d="M12 5v14M5 12h14"/>',
      analytics: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/>',
      assistant_direction: '<path d="M12 3l2.2 5.4L20 10.5l-5.4 2.2L12 19l-2.6-6.3L4 10.5l5.8-2.1L12 3z"/><path d="M18 16l2 2"/><path d="M4 18l2-2"/>',
      check_circle: '<path d="M20 11.1V12a8 8 0 1 1-4.7-7.3"/><path d="M9 11.5l2 2L20 4.5"/>',
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      dashboard: '<path d="M4 5h7v7H4z"/><path d="M13 5h7v4h-7z"/><path d="M13 11h7v8h-7z"/><path d="M4 14h7v5H4z"/>',
      error: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
      event: '<path d="M7 3v4M17 3v4"/><path d="M4 8h16"/><path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
      event_upcoming: '<path d="M7 3v4M17 3v4"/><path d="M4 8h16"/><path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M9 14l2 2 4-5"/>',
      flag: '<path d="M6 21V4"/><path d="M6 5h10l-1 4 1 4H6"/>',
      flag_check: '<path d="M6 21V4"/><path d="M6 5h10l-1 4 1 4H6"/><path d="M9 9.5l1.5 1.5L14 7.5"/>',
      hourglass_top: '<path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3c0 4 4 5 4 9s-4 5-4 9"/><path d="M16 3c0 4-4 5-4 9s4 5 4 9"/><path d="M9 6h6"/>',
      info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      monitoring: '<path d="M4 17l5-5 4 4 7-8"/><path d="M4 20h16"/>',
      next_plan: '<path d="M5 5h10a4 4 0 0 1 0 8H8"/><path d="M8 9l-4 4 4 4"/><path d="M16 17h4"/><path d="M18 15v4"/>',
      radio_button_checked: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
      schedule: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
      speed: '<path d="M5 17a8 8 0 1 1 14 0"/><path d="M12 17l4-6"/><path d="M8 17h8"/>',
      timeline: '<path d="M4 6h5"/><path d="M15 6h5"/><path d="M9 6a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/><path d="M4 18h5"/><path d="M15 18h5"/><path d="M9 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/>',
      timer: '<path d="M10 2h4"/><path d="M12 6v6l3 2"/><circle cx="12" cy="13" r="8"/>',
      track_changes: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/><path d="M20 4l-4 4"/><path d="M17 4h3v3"/>',
      trending_up: '<path d="M4 16l5-5 4 4 7-8"/><path d="M14 7h6v6"/>',
      update: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/><path d="M12 8v5l3 2"/>',
      verified: '<path d="M12 3l2 2.5 3.2-.3.8 3.1 2.7 1.7-1.4 2.9 1.4 2.9-2.7 1.7-.8 3.1-3.2-.3L12 21l-2-2.5-3.2.3-.8-3.1-2.7-1.7 1.4-2.9-1.4-2.9L6 6.5l.8-3.1 3.2.3L12 3z"/><path d="M8.5 12l2 2 5-5"/>',
      warning: '<path d="M12 3l9 16H3L12 3z"/><path d="M12 9v4"/><path d="M12 16h.01"/>'
    };
    var body = paths[name] || paths.analytics;
    return '<svg class="mi seasons-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  function _toast(message, type) {
    if (window.UI && typeof UI.toast === 'function') UI.toast(message, type || 'info');
  }

  function _esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function destroy() {}

  return {
    render: render,
    destroy: destroy,
    createSeason: createSeason,
    updateSeason: updateSeason,
    getActiveSeason: getActiveSeason,
    listSeasons: listSeasons,
    openCreateFlow: openCreateFlow,
    closeCreateFlow: closeCreateFlow,
    finishActiveSeason: finishActiveSeason,
    openFinalResult: openFinalResult,
    openScheduledDetails: openScheduledDetails,
    openHelpModal: openHelpModal,
    closeHelpModal: closeHelpModal,
    toggleMetricBalloon: toggleMetricBalloon,
    openActiveFromCelebration: openActiveFromCelebration,
    checkPendingGoalCelebration: checkPendingGoalCelebration,
    closeFinalResult: closeFinalResult,
    _setModuleTab: _setModuleTab,
    _setSeasonTab: _setSeasonTab,
    _wizardSelect: _wizardSelect,
    _wizardSetTargetValue: _wizardSetTargetValue,
    _wizardSetStartDate: _wizardSetStartDate,
    _metricTileKey: _metricTileKey,
    _wizardBack: _wizardBack,
    _wizardNext: _wizardNext
  };
})();
