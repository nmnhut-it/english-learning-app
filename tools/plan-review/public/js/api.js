// API client for plan-review backend
const API = {
  base: '',

  async get(path) {
    const res = await fetch(`${this.base}/api${path}`);
    if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(`${this.base}/api${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path}: ${res.status}`);
    return res.json();
  },

  getTree() { return this.get('/tree'); },

  getContent(grade, unit, section) {
    return this.get(`/content/${grade}/${unit}/${section}`);
  },

  saveLecture(grade, unit, section, content) {
    return this.put(`/content/${grade}/${unit}/${section}/lecture`, { content });
  },

  saveSource(grade, unit, section, content) {
    return this.put(`/content/${grade}/${unit}/${section}/source`, { content });
  },

  analyze(grade, unit, section) {
    return this.get(`/analyze/${grade}/${unit}/${section}`);
  },

  audioAudit(grade, unit, section) {
    return this.get(`/audio-audit/${grade}/${unit}/${section}`);
  },

  dialogueCheck(grade, unit, section) {
    return this.get(`/dialogue-check/${grade}/${unit}/${section}`);
  },

  getCoverage() { return this.get('/coverage'); },

  getReviewStatus() { return this.get('/review-status'); },

  setReviewStatus(grade, unit, section, status) {
    return this.put(`/review-status/${grade}/${unit}/${section}`, { status });
  },
};
