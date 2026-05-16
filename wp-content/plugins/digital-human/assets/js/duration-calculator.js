/**
 * Duration Calculator for Digital Human plugin
 * Calculates estimated duration of text based on character count and voice speed
 */
const DHDurationCalculator = {
    // Constants
    CHARS_PER_SECOND: 3.83, // 230 chars per minute = 3.83 chars per second
    PUNCTUATION_PAUSE: {
        '，': 0.3, // 逗号
        '。': 0.5, // 句号
        '！': 0.5, // 感叹号
        '？': 0.5, // 问号
        '；': 0.4, // 分号
        '：': 0.4, // 冒号
        '\n': 0.5, // 换行
    },

    /**
     * Calculate estimated duration in seconds
     * @param {string} text - The text content
     * @param {number} speed - Voice speed multiplier (default: 1.0)
     * @returns {number} - Duration in seconds
     */
    calculateDuration: function(text, speed = 1.0) {
        if (!text) return 0;

        // Base duration from character count
        let duration = text.length / this.CHARS_PER_SECOND;

        // Add pauses for punctuation
        for (const [punct, pause] of Object.entries(this.PUNCTUATION_PAUSE)) {
            const count = (text.match(new RegExp(punct, 'g')) || []).length;
            duration += count * pause;
        }

        // Apply speed adjustment
        return duration / speed;
    }
};
