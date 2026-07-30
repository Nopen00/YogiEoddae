/**
 * 재생목록 "목록 불러오기" 작업이 백그라운드에서 진행 중일 때,
 * 관리자가 이 작업을 시작한 페이지(/places/extract/playlist/)를 벗어나
 * 다른 관리자 화면에서 작업하고 있어도 화면 하단 구석에 진행 상황을 띄워주는 위젯.
 * localStorage의 'playlistFetchJobId' 키를 admin_playlist_extract.html과 공유한다.
 */
(function () {
  var KEY = 'playlistFetchJobId';
  var PLAYLIST_PAGE_PATH = '/places/extract/playlist/';

  function init() {
    // 그 페이지 자체는 인라인 UI로 이미 보여주고 있으므로 위젯을 중복 표시하지 않음
    if (window.location.pathname.indexOf(PLAYLIST_PAGE_PATH) === 0) return;
    var jobId = localStorage.getItem(KEY);
    if (!jobId) return;
    renderWidget(jobId);
  }

  function renderWidget(jobId) {
    var box = document.createElement('div');
    box.id = 'playlistFetchWatcherWidget';
    box.style.cssText = [
      'position:fixed', 'right:20px', 'bottom:20px', 'z-index:9999',
      'background:#1f2937', 'color:#fff', 'padding:12px 16px', 'border-radius:12px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.25)', 'font-size:13px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'display:flex', 'align-items:center', 'gap:10px', 'cursor:pointer', 'max-width:280px',
    ].join(';');

    var label = document.createElement('span');
    label.id = 'playlistFetchWatcherLabel';
    label.textContent = '재생목록 불러오는 중';

    var closeBtn = document.createElement('img');
    closeBtn.src = '/static/places/icons/x.svg';
    closeBtn.alt = '';
    closeBtn.style.cssText = 'width:12px;height:12px;opacity:0.6;flex-shrink:0';
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      localStorage.removeItem(KEY);
      clearInterval(pollTimer);
      clearInterval(dotsTimer);
      box.remove();
    });

    box.appendChild(label);
    box.appendChild(closeBtn);
    box.addEventListener('click', function () {
      window.location.href = PLAYLIST_PAGE_PATH;
    });
    document.body.appendChild(box);

    var done = false;
    var dots = 0;
    var dotsTimer = setInterval(function () {
      if (done) return;
      dots = (dots + 1) % 4;
      label.textContent = '재생목록 불러오는 중' + '.'.repeat(dots);
    }, 400);

    function poll() {
      fetch('/places/extract/playlist/fetch/' + jobId + '/status/')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.ok || data.status === 'running') return;
          done = true;
          clearInterval(pollTimer);
          clearInterval(dotsTimer);
          if (data.status === 'error') {
            label.textContent = '재생목록 불러오기 실패 — 클릭해서 확인';
            box.style.background = '#7f1d1d';
          } else {
            label.textContent = '재생목록 불러오기 완료(' + data.videos.length + '개) — 클릭해서 보기';
            box.style.background = '#065f46';
          }
        })
        .catch(function () { /* 다음 폴링에서 재시도 */ });
    }

    var pollTimer = setInterval(poll, 1500);
    poll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
