// Simple line-level diff utility
const DiffUtil = {
  // Returns array of { type: 'same' | 'added' | 'removed', line: string }
  lineDiff(a, b) {
    const aLines = a.split('\n');
    const bLines = b.split('\n');
    const result = [];

    // Simple LCS-based diff
    const m = aLines.length;
    const n = bLines.length;

    // Build LCS table
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (aLines[i - 1] === bLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack
    let i = m, j = n;
    const ops = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
        ops.unshift({ type: 'same', line: aLines[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.unshift({ type: 'added', line: bLines[j - 1] });
        j--;
      } else {
        ops.unshift({ type: 'removed', line: aLines[i - 1] });
        i--;
      }
    }

    return ops;
  },

  renderDiff(a, b) {
    const ops = this.lineDiff(a, b);
    return ops.map(op => {
      const cls = op.type === 'same' ? '' : op.type === 'added' ? 'diff-added' : 'diff-removed';
      const prefix = op.type === 'same' ? ' ' : op.type === 'added' ? '+' : '-';
      const escaped = op.line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="diff-line ${cls}"><span class="diff-prefix">${prefix}</span>${escaped}</div>`;
    }).join('');
  },
};
