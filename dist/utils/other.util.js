"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterByNotation = exports.accessibility = exports.accumulate = void 0;
const cron_parser_1 = __importDefault(require("cron-parser"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Notation } = require('notation');
function accumulate(...notations) {
    notations = notations.filter((f) => f.length > 0);
    const first = notations.shift();
    if (!first)
        return [];
    let neg = first.filter((f) => f.startsWith('!'));
    let pos = first.filter((f) => !f.startsWith('!'));
    for (const notation of notations) {
        pos = [...new Set([...pos, ...notation.filter((f) => !f.startsWith('!'))])];
        neg = neg.filter((n) => notation.filter((f) => f.startsWith('!')).includes(n));
    }
    return [...pos, ...neg];
}
exports.accumulate = accumulate;
function accessibility(time, options) {
    var _a;
    const { cron_exp, duration } = time;
    const currentDate = (_a = options === null || options === void 0 ? void 0 : options.currentDate) !== null && _a !== void 0 ? _a : new Date();
    const prevDate = cron_parser_1.default.parseExpression(cron_exp, options).prev();
    const nextDate = new Date(prevDate.getTime() + duration * 1000);
    return currentDate >= prevDate.toDate() && currentDate < nextDate;
}
exports.accessibility = accessibility;
function filterByNotation(data, notation, deep_copy = false) {
    if (!notation.length)
        throw new Error('Notation should not empty');
    if (deep_copy)
        data = JSON.parse(JSON.stringify(data));
    if (Array.isArray(data))
        return data.map((datum) => new Notation(datum).filter(notation).value);
    else
        return new Notation(data).filter(notation).value;
}
exports.filterByNotation = filterByNotation;
//# sourceMappingURL=other.util.js.map