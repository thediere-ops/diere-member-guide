'use strict';
const templates = {
  profile: '[홈페이지 등록용 멤버 정보]\n1. 멤버명 :\n2. 이름표에 사용할 이름 :\n3. 소속 팀 :\n4. 플단명 :\n5. 프로필 이미지 : 사진 파일 첨부\n6. SOOP 링크 :\n7. CHZZK 링크 :\n8. TikTok 링크 :\n9. Instagram 링크 :\n10. YouTube 링크 :\n11. 구글메일 주소 :\n12. 투네이션 후원 링크 :\n\n※ 사용하지 않는 플랫폼은 ‘없음’으로 작성해주세요.\n※ 기존 멤버도 구글메일 주소와 투네이션 후원 링크를 제출해주세요.\n※ SOOP·YouTube 링크 제출 시 개인 방송국에 게시글·다시보기·클립이 표시됩니다. 노출을 원하지 않는 플랫폼 링크는 생략할 수 있습니다.',
  intro: '[방송용 멤버 소개 자료]\n• 스트리머명 :\n• 나이 :\n• 키 :\n• 혈액형 :\n• MBTI :\n• 주로 하는 콘텐츠 :\n• 나의 장점 :\n• 팬들에게 한마디 :\n• 잘하는 시그 :\n• 나의 대표 공약 :\n\n[웰컴 이미지용 사진]\n• 이름(활동명) :\n• 사진 : 파일 첨부\n\n[공약표 제작 — 희망자만]\n• 공약표에 넣을 내용 :',
  signal20: '[20만 원대 신호탄]\n• 후원 금액 :          원\n  ※ 200,000~299,900원 내에서 선택\n• 곡명 :\n• 음원 링크 :\n• 사용 구간 :\n  ※ 원하는 구간이 있다면 시작·종료 시간 기재 (예: 00:30~01:00)',
  signal40: '[40만 원대 신호탄]\n• 후원 금액 :          원\n  ※ 400,000~499,900원 내에서 선택\n• 곡명 :\n• 음원 링크 :\n• 사용 구간 :\n  ※ 원하는 구간이 있다면 시작·종료 시간 기재 (예: 00:30~01:00)'
};
templates.all = '[더디에르 자료 제출]\n이미 제출한 항목은 제외하고 미제출 항목과 변경된 내용만 작성해주세요.\n소속 팀 담당 매니저에게 전달해주세요.\n\n' + Object.values(templates).join('\n\n━━━━━━━━━━━━━━━━━━\n\n') + '\n\n※ OBS 후원 알림 위젯 링크는 일반 후원 링크와 다릅니다. 공개 단톡방이 아닌 담당 매니저 개인 메시지로 보내주세요.';
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
    const text = templates[button.dataset.copy];
    if (!text) return;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      announce('양식을 복사했어요. 작성 후 담당 매니저에게 보내주세요.');
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
const key = 'diere-member-guide-checks-v1';
const checks = [...document.querySelectorAll('[data-check]')];
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    checks.forEach(input => { input.checked = saved[input.dataset.check] === true; });
  }
} catch { storageAvailable = false; }
function updateProgress(save) {
  const done = checks.filter(input => input.checked).length;
  document.getElementById('progress').value = done;
  document.getElementById('progress-text').textContent = `${done} / ${checks.length} 완료`;
  if (save) {
    try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(checks.map(input => [input.dataset.check, input.checked])))); storageAvailable = true; }
    catch { storageAvailable = false; }
  }
  if (!storageAvailable) document.getElementById('storage-note').textContent = '브라우저 저장 기능을 사용할 수 없어 현재 화면에서만 체크가 유지됩니다. 매니저에게 전송되지 않아요.';
}
checks.forEach(input => input.addEventListener('change', () => updateProgress(true)));
document.getElementById('reset-checks').addEventListener('click', () => {
  checks.forEach(input => { input.checked = false; });
  updateProgress(true);
  announce('체크리스트를 초기화했어요.');
});
updateProgress(false);
