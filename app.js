'use strict';
const templates = {
  profile: '[홈페이지 등록용 멤버 정보]\n1. 멤버명 :\n2. 이름표에 사용할 이름 :\n3. 소속 팀 :\n4. 플단명 :\n5. 프로필 이미지 : 사진 파일 첨부\n6. SOOP 링크 :\n7. CHZZK 링크 :\n8. TikTok 링크 :\n9. Instagram 링크 :\n10. YouTube 링크 :\n11. 구글메일 주소 :\n12. 투네이션 후원 링크 :\n\n※ 사용하지 않는 플랫폼은 ‘없음’으로 작성해주세요.\n※ 기존 멤버도 구글메일 주소와 투네이션 후원 링크를 제출해주세요.\n※ SOOP·YouTube 링크 제출 시 개인 방송국에 게시글·다시보기·클립이 표시됩니다. 노출을 원하지 않는 플랫폼 링크는 생략할 수 있습니다.',
  intro: '[방송용 멤버 소개 자료]\n• 스트리머명 :\n• 나이 :\n• 키 :\n• 혈액형 :\n• MBTI :\n• 주로 하는 콘텐츠 :\n• 나의 장점 :\n• 팬들에게 한마디 :\n• 잘하는 시그 :\n• 나의 대표 공약 :\n\n[웰컴 이미지용 사진]\n• 이름(활동명) :\n• 사진 : 파일 첨부\n\n[공약표 제작 — 희망자만]\n• 공약표에 넣을 내용 :',
  signal20: '[20만 원대 신호탄]\n• 후원 금액 :          원\n  ※ 200,000~299,900원 내에서 선택\n• 곡명 :\n• 음원 링크 :\n• 사용 구간 :\n  ※ 사용 구간은 최대 50초입니다. 시작·종료 시간을 적어주세요. (예: 00:30~01:20, 50초)',
  signal40: '[40만 원대 신호탄]\n• 후원 금액 :          원\n  ※ 400,000~499,900원 내에서 선택\n• 곡명 :\n• 음원 링크 :\n• 사용 구간 :\n  ※ 사용 구간은 최대 50초입니다. 시작·종료 시간을 적어주세요. (예: 00:30~01:20, 50초)'
};
templates.all = '[더디에르 자료 제출]\n이미 제출한 항목은 제외하고 미제출 항목과 변경된 내용만 작성해주세요.\n소속 팀 담당 매니저에게 전달해주세요.\n\n' + Object.values(templates).join('\n\n━━━━━━━━━━━━━━━━━━\n\n') + '\n\n※ OBS 후원 알림 위젯 링크는 일반 후원 링크와 다릅니다. 공개 단톡방이 아닌 담당 매니저 개인 메시지로 보내주세요.';
templates.member = '[더디에르 멤버 자료 제출]\n미제출·변경된 내용만 작성하고, 사진과 함께 소속 팀 담당 매니저에게 꼭 보내주세요.\n\n' + templates.profile + '\n\n━━━━━━━━━━━━━━━━━━\n\n' + templates.intro;
let toastTimer;
const toast = document.getElementById('toast');
function announce(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const dialogTitle = document.querySelector('#copy-dialog h2');
    dialogTitle.textContent = '양식을 복사해주세요';
    document.querySelector('#copy-dialog p').textContent = '아래 내용을 복사해 빈칸을 작성한 뒤, 사진과 함께 담당 매니저에게 꼭 보내주세요.';
    document.getElementById('copy-fallback').setAttribute('aria-label', '복사할 제출 양식');
    const text = templates[button.dataset.copy];
    if (!text) return;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      announce('복사 완료! 빈칸을 작성하고 사진과 함께 담당 매니저에게 꼭 보내주세요.');
    } catch {
      const dialog = document.getElementById('copy-dialog');
      const field = document.getElementById('copy-fallback');
      field.value = text;
      dialog.showModal();
      field.focus();
      field.select();
    }
  });
});

// Keep the date and weekday in Korea time, including after midnight or returning to the tab.
function updateStudioToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  }).formatToParts(now);
  const part = type => parts.find(value => value.type === type).value;
  const weekday = part('weekday');
  const date = document.getElementById('today-date');
  date.dateTime = part('year') + '-' + part('month') + '-' + part('day');
  date.textContent = part('year') + '년 ' + Number(part('month')) + '월 ' + Number(part('day')) + '일 ' + weekday + '요일';
  const todayStudios = [];
  document.querySelectorAll('.studio-card').forEach(card => {
    const active = card.dataset.days.split(',').includes(weekday);
    card.classList.toggle('is-today', active);
    card.querySelector('.today-badge').hidden = !active;
    if (active) {
      const team = card.querySelector('[data-day="' + weekday + '"] dd').textContent;
      todayStudios.push(team + ' → ' + card.querySelector('h3').textContent);
    }
  });
  const message = todayStudios.length
    ? '오늘은 ' + weekday + '요일 · ' + todayStudios.join(' / ')
    : '오늘은 ' + weekday + '요일 · 대관 취소로 정기 스튜디오 이용이 없습니다. 별도 일정은 담당 매니저에게 확인해주세요.';
  const status = document.getElementById('today-studio');
  if (status.textContent !== message) status.textContent = message;
}
updateStudioToday();
setInterval(updateStudioToday, 30000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateStudioToday();
});
document.querySelectorAll('[data-address]').forEach(button => {
  button.addEventListener('click', async () => {
    const address = button.dataset.address;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(address);
      announce('스튜디오 주소가 복사되었습니다.');
    } catch {
      const dialog = document.getElementById('copy-dialog');
      dialog.querySelector('h2').textContent = '스튜디오 주소를 복사해주세요';
      dialog.querySelector('p').textContent = '아래 주소를 길게 누르거나 선택해 복사해주세요.';
      const field = document.getElementById('copy-fallback');
      field.setAttribute('aria-label', '복사할 스튜디오 주소');
      field.value = address;
      dialog.showModal();
      field.focus();
      field.select();
    }
  });
});

// The external calendar has a 910px minimum width. Give it a desktop
// viewport, then scale the entire frame so all seven columns remain visible.
const scheduleViewport = document.querySelector('.schedule-viewport');
const scheduleCanvas = document.querySelector('.schedule-canvas');
const scheduleFrame = document.querySelector('.schedule-embed');
let scheduleView = 'fit';
function resizeSchedule() {
  const availableWidth = scheduleViewport.clientWidth;
  if (!availableWidth) return;
  const frameWidth = Math.max(1040, availableWidth);
  const frameHeight = 3600;
  const scale = scheduleView === 'fit' ? Math.min(1, availableWidth / frameWidth) : 1;
  scheduleFrame.style.width = frameWidth + 'px';
  scheduleFrame.style.height = frameHeight + 'px';
  scheduleFrame.style.transform = 'scale(' + scale + ')';
  scheduleCanvas.style.width = (frameWidth * scale) + 'px';
  scheduleCanvas.style.height = (frameHeight * scale) + 'px';
}
document.querySelectorAll('[data-schedule-view]').forEach(button => {
  button.addEventListener('click', () => {
    scheduleView = button.dataset.scheduleView;
    document.querySelectorAll('[data-schedule-view]').forEach(control => {
      control.setAttribute('aria-pressed', String(control === button));
    });
    resizeSchedule();
    scheduleViewport.scrollLeft = 0;
  });
});
if ('ResizeObserver' in window) new ResizeObserver(resizeSchedule).observe(scheduleViewport);
window.addEventListener('resize', resizeSchedule);
scheduleFrame.addEventListener('load', resizeSchedule);
resizeSchedule();
