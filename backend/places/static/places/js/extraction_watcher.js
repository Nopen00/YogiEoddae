/**
 * 재생목록 일괄 추출(PlaylistExtractionJob) 진행 상황을 어느 관리자 페이지에서든
 * 볼 수 있게 하는 공유 위젯 + 모달.
 *
 * - admin_playlist_extract.html이 일괄 추출을 시작하면 YgeExtractionWatcher.start(jobId)를 호출한다.
 * - 진행 상황은 localStorage('extractionJobId'/'extractionJobViewState')로 추적되므로,
 *   관리자가 이 페이지를 벗어나 다른 화면에서 작업 중이어도 화면 우측 하단에 작은 위젯으로 표시된다.
 * - 위젯을 클릭하면 (페이지 이동 없이) 이 스크립트가 직접 그리는 전체 진행 모달이 뜬다.
 * - 모달의 "축소" 버튼을 누르면 다시 위젯으로 줄어들어서, 다른 작업을 하다가 중간중간
 *   확인만 하고 이어서 다른 작업을 계속할 수 있다.
 *
 * Tailwind가 로드되지 않은 페이지에서도 동일하게 보이도록 순수 인라인 스타일/자체 <style>만 사용한다.
 */
(function () {
  var JOB_ID_KEY = 'extractionJobId';
  var VIEW_STATE_KEY = 'extractionJobViewState'; // 'expanded' | 'minimized'

  var STATUS_LABEL = {
    queued: '대기중', processing: '처리중', success: '완료', failed: '실패', cancelled: '취소됨(미처리)',
  };
  var STATUS_COLOR = {
    queued: '#9ca3af', processing: '#2563eb', success: '#16a34a', failed: '#dc2626', cancelled: '#9ca3af',
  };

  var pollTimer = null;
  var dotsTimer = null;
  var dots = 0;
  var els = null;

  function csrfToken() {
    var m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : '';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function injectStyles() {
    if (document.getElementById('yge-ext-watcher-style')) return;
    var style = document.createElement('style');
    style.id = 'yge-ext-watcher-style';
    style.textContent =
      '.yge-ext-widget{position:fixed;right:20px;bottom:76px;z-index:9998;background:#1f2937;color:#fff;' +
      'padding:12px 16px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.25);font-size:13px;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;align-items:center;' +
      'gap:10px;cursor:pointer;max-width:280px;}' +
      '.yge-ext-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;' +
      'display:flex;align-items:center;justify-content:center;}' +
      '.yge-ext-modal{background:#fff;border-radius:16px;padding:28px;width:480px;max-width:92vw;max-height:80vh;' +
      'display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.2);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}' +
      '.yge-ext-modal h3{font-size:16px;font-weight:700;color:#1f2937;margin:0;}' +
      '.yge-ext-header{display:flex;align-items:center;gap:8px;margin-bottom:16px;}' +
      '.yge-ext-list{flex:1;overflow-y:auto;border-top:1px solid #f3f4f6;padding-top:8px;margin-bottom:16px;}' +
      '.yge-ext-row{display:flex;align-items:center;justify-content:space-between;gap:8px;' +
      'padding:6px 0;border-bottom:1px solid #f9fafb;font-size:13px;}' +
      '.yge-ext-row .yge-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151;}' +
      '.yge-ext-row .yge-status{flex-shrink:0;font-weight:600;}' +
      '.yge-ext-retry-btn{flex-shrink:0;font-size:11px;background:#fff;border:1px solid #fecaca;' +
      'color:#dc2626;border-radius:8px;padding:3px 8px;cursor:pointer;margin-left:6px;}' +
      '.yge-ext-btns{display:flex;gap:10px;}' +
      '.yge-ext-btns button{flex:1;border:none;border-radius:10px;padding:11px;font-size:14px;' +
      'font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.yge-ext-btn-minimize{background:#f3f4f6;color:#374151;}' +
      '.yge-ext-btn-minimize:hover{background:#e5e7eb;}' +
      '.yge-ext-btn-cancel{background:#fef2f2;color:#dc2626;}' +
      '.yge-ext-btn-cancel:hover{background:#fee2e2;}' +
      '.yge-ext-btn-close{background:#2563eb;color:#fff;}' +
      '.yge-ext-btn-close:hover{background:#1d4ed8;}' +
      '.yge-ext-btns button:disabled{opacity:0.5;cursor:default;}';
    document.head.appendChild(style);
  }

  function ensureUi() {
    if (els) return;
    injectStyles();

    var overlay = document.createElement('div');
    overlay.className = 'yge-ext-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML =
      '<div class="yge-ext-modal">' +
      '  <div class="yge-ext-header">' +
      '    <img src="/static/places/icons/clock.svg" style="width:20px;height:20px" alt="">' +
      '    <h3 id="ygeExtHeader">처리 준비 중...</h3>' +
      '  </div>' +
      '  <div class="yge-ext-list" id="ygeExtList"></div>' +
      '  <div class="yge-ext-btns">' +
      '    <button type="button" class="yge-ext-btn-minimize" id="ygeExtMinimizeBtn">축소</button>' +
      '    <button type="button" class="yge-ext-btn-cancel" id="ygeExtActionBtn">취소 (처리 중인 영상까지만 완료)</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);

    var widget = document.createElement('div');
    widget.className = 'yge-ext-widget';
    widget.style.display = 'none';
    widget.innerHTML =
      '<span id="ygeExtWidgetLabel">재생목록 추출 중</span>' +
      '<img src="/static/places/icons/x.svg" alt="" style="width:12px;height:12px;opacity:0.6;flex-shrink:0" id="ygeExtWidgetClose">';
    document.body.appendChild(widget);

    els = {
      overlay: overlay,
      header: document.getElementById('ygeExtHeader'),
      list: document.getElementById('ygeExtList'),
      minimizeBtn: document.getElementById('ygeExtMinimizeBtn'),
      actionBtn: document.getElementById('ygeExtActionBtn'),
      widget: widget,
      widgetLabel: document.getElementById('ygeExtWidgetLabel'),
      widgetClose: document.getElementById('ygeExtWidgetClose'),
    };

    els.minimizeBtn.addEventListener('click', function () { setViewState('minimized'); });
    els.widget.addEventListener('click', function (e) {
      if (e.target === els.widgetClose) return;
      setViewState('expanded');
    });
    els.widgetClose.addEventListener('click', function (e) {
      e.stopPropagation();
      stopWatching();
    });
  }

  function startDots() {
    stopDots();
    dotsTimer = setInterval(function () {
      dots = (dots + 1) % 4;
      var base = els.widgetLabel.dataset.base || '재생목록 추출 중';
      els.widgetLabel.textContent = base + '.'.repeat(dots);
    }, 400);
  }
  function stopDots() {
    if (dotsTimer) { clearInterval(dotsTimer); dotsTimer = null; }
  }

  function setViewState(state) {
    localStorage.setItem(VIEW_STATE_KEY, state);
    renderVisibility();
  }

  function renderVisibility() {
    var jobId = localStorage.getItem(JOB_ID_KEY);
    if (!jobId) {
      els.overlay.style.display = 'none';
      els.widget.style.display = 'none';
      stopDots();
      return;
    }
    var state = localStorage.getItem(VIEW_STATE_KEY) || 'expanded';
    if (state === 'minimized') {
      els.overlay.style.display = 'none';
      els.widget.style.display = 'flex';
    } else {
      els.overlay.style.display = 'flex';
      els.widget.style.display = 'none';
      stopDots();
    }
  }

  function stopWatching() {
    localStorage.removeItem(JOB_ID_KEY);
    localStorage.removeItem(VIEW_STATE_KEY);
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    stopDots();
    ensureUi();
    els.overlay.style.display = 'none';
    els.widget.style.display = 'none';
  }

  function renderData(data) {
    var total = data.total;
    var doneCount = data.videos.filter(function (v) {
      return ['success', 'failed', 'cancelled'].indexOf(v.status) !== -1;
    }).length;
    var currentPos = data.current_index >= 0 ? data.current_index + 1 : doneCount;
    var running = data.status === 'running';

    els.header.textContent = running
      ? total + '개 중 ' + currentPos + '번째 처리 중...'
      : '처리 종료 — 총 ' + total + '개 중 ' + doneCount + '개 처리됨';

    els.list.innerHTML = data.videos.map(function (v) {
      var retryBtn = v.status === 'failed'
        ? '<button type="button" class="yge-ext-retry-btn" onclick="window.YgeExtractionWatcher._retry(\'' +
          v.video_id + '\')">재시도</button>'
        : '';
      return '<div class="yge-ext-row"><span class="yge-title">' + escapeHtml(v.title) + '</span>' +
        '<span class="yge-status" style="color:' + (STATUS_COLOR[v.status] || '#9ca3af') + '">' +
        (STATUS_LABEL[v.status] || v.status) + '</span>' + retryBtn + '</div>';
    }).join('');

    if (running) {
      els.actionBtn.textContent = '취소 (처리 중인 영상까지만 완료)';
      els.actionBtn.className = 'yge-ext-btn-cancel';
      els.actionBtn.disabled = false;
      els.actionBtn.onclick = doCancel;
      els.widgetLabel.dataset.base = '재생목록 추출 중 (' + total + '개 중 ' + currentPos + '번째)';
      if (!dotsTimer) startDots();
    } else {
      els.actionBtn.textContent = '닫기';
      els.actionBtn.className = 'yge-ext-btn-close';
      els.actionBtn.disabled = false;
      els.actionBtn.onclick = stopWatching;
      stopDots();
      els.widgetLabel.textContent = data.status === 'error'
        ? '재생목록 추출 오류 — 클릭해서 확인'
        : '재생목록 추출 완료(' + total + '개 중 ' + doneCount + '개) — 클릭해서 보기';
    }
  }

  function poll() {
    var jobId = localStorage.getItem(JOB_ID_KEY);
    if (!jobId) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      return;
    }
    fetch('/places/extract/playlist/job/' + jobId + '/status/')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) return;
        renderData(data);
        if (data.status !== 'running' && pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      })
      .catch(function () { /* 다음 폴링에서 재시도 */ });
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    poll();
    pollTimer = setInterval(poll, 2000);
  }

  function doCancel() {
    var jobId = localStorage.getItem(JOB_ID_KEY);
    if (!jobId) return;
    els.actionBtn.disabled = true;
    els.actionBtn.textContent = '취소 요청됨 — 처리 중인 영상 완료 대기...';
    fetch('/places/extract/playlist/job/' + jobId + '/cancel/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
    }).catch(function () { /* no-op — 다음 폴링에서 상태 갱신 */ });
  }

  function retry(videoId) {
    var jobId = localStorage.getItem(JOB_ID_KEY);
    if (!jobId) return;
    fetch('/places/extract/playlist/job/' + jobId + '/retry/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
      body: JSON.stringify({ video_ids: [videoId] }),
    }).then(function () { startPolling(); }).catch(function () { /* no-op */ });
  }

  function start(jobId) {
    ensureUi();
    localStorage.setItem(JOB_ID_KEY, String(jobId));
    localStorage.setItem(VIEW_STATE_KEY, 'expanded');
    renderVisibility();
    startPolling();
  }

  function initIfActive() {
    ensureUi();
    var jobId = localStorage.getItem(JOB_ID_KEY);
    if (!jobId) return;
    renderVisibility();
    startPolling();
  }

  window.YgeExtractionWatcher = { start: start, _retry: retry };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIfActive);
  } else {
    initIfActive();
  }
})();
