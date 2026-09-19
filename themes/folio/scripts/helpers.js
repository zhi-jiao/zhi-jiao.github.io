'use strict';

const escape = (value) => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

// All translated content is escaped, including values from YAML.
hexo.extend.helper.register('bi', (value, chinese) => {
  const en = typeof value === 'object' ? value.en : value;
  const zh = typeof value === 'object' ? value.zh : chinese;
  return `<span data-lang="en" lang="en">${escape(en)}</span><span data-lang="zh" lang="zh-CN">${escape(zh || en)}</span>`;
});
