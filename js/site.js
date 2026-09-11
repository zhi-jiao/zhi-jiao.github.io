'use strict';

const root = document.documentElement;
const languageButton = document.querySelector('.language-toggle');

function setLanguage(language) {
  const english = language === 'en';
  root.lang = english ? 'en' : 'zh-CN';
  document.title = english ? root.dataset.titleEn : root.dataset.titleZh;
  languageButton.setAttribute('aria-label', english ? '切换为中文' : 'Switch to English');
}

let language = 'zh';
try { language = localStorage.getItem('profile-language') === 'en' ? 'en' : 'zh'; } catch (_) {}
setLanguage(language);
languageButton.addEventListener('click', () => {
  const selected = root.lang === 'en' ? 'zh' : 'en';
  setLanguage(selected);
  try { localStorage.setItem('profile-language', selected); } catch (_) {}
});
root.classList.add('js');
