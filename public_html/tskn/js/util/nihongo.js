// @see https://ja.wikipedia.org/wiki/ASCII
// @see https://so-zou.jp/web-app/text/fullwidth-halfwidth/
// @see https://www.yoheim.net/blog.php?q=20191101

const mojiAsciiPrintableMap = new Map();
mojiAsciiPrintableMap.set('　', ' ');
mojiAsciiPrintableMap.set('！', '!');
mojiAsciiPrintableMap.set('＂', '"');
mojiAsciiPrintableMap.set('”', '"');
mojiAsciiPrintableMap.set('“', '"');
mojiAsciiPrintableMap.set('＃', '#');
mojiAsciiPrintableMap.set('＄', '$');
mojiAsciiPrintableMap.set('％', '%');
mojiAsciiPrintableMap.set('＆', '&');
mojiAsciiPrintableMap.set('＇', '\'');
mojiAsciiPrintableMap.set('（', '(');
mojiAsciiPrintableMap.set('）', ')');
mojiAsciiPrintableMap.set('＊', '*');
mojiAsciiPrintableMap.set('＋', '+');
mojiAsciiPrintableMap.set('，', ',');
mojiAsciiPrintableMap.set('－', '-');
mojiAsciiPrintableMap.set('．', '.');
mojiAsciiPrintableMap.set('／', '/');
mojiAsciiPrintableMap.set('：', ':');
mojiAsciiPrintableMap.set('；', ';');
mojiAsciiPrintableMap.set('＜', '<');
mojiAsciiPrintableMap.set('＝', '=');
mojiAsciiPrintableMap.set('＞', '>');
mojiAsciiPrintableMap.set('？', '?');
mojiAsciiPrintableMap.set('＠', '@');
mojiAsciiPrintableMap.set('［', '[');
mojiAsciiPrintableMap.set('＼', '\\');
mojiAsciiPrintableMap.set('］', ']');
mojiAsciiPrintableMap.set('＾', '^');
mojiAsciiPrintableMap.set('＿', '_');
mojiAsciiPrintableMap.set('｀', '`');
mojiAsciiPrintableMap.set('｛', '{');
mojiAsciiPrintableMap.set('｜', '|');
mojiAsciiPrintableMap.set('｝', '}');
mojiAsciiPrintableMap.set('～', '~');

/**
 * @param {*} value
 * @returns {string}
 */
export const mojiToAsciiSymbol = (value) => {
    let replaced = '';
    for (const char of value.toString()) {
        if (mojiAsciiPrintableMap.has(char)) {
            replaced += mojiAsciiPrintableMap.get(char);
        } else {
            replaced += char;
        }
    }
    return replaced;
};

/**
 * @param {*} value
 * @returns {string}
 */
export const mojiToAsciiAlphanumeric = (value) => {
    return value.toString().replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
};

/**
 * @param {*} value
 * @returns {string}
 */
export const mojiToAsciiPrintable = (value) => {
    return mojiToAsciiSymbol(mojiToAsciiAlphanumeric(value));
};

/**
 * @param {*} value
 * @returns {number}
 */
export const mojiToNumber = (value) => {
    return Number.parseFloat(mojiToAsciiPrintable(value));
};
