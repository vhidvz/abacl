"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pattern = exports.key = exports.parse = exports.memoryIgnore = void 0;
const memory_driver_1 = require("./memory.driver");
const consts_1 = require("../../consts");
const utils_1 = require("../../utils");
const memoryIgnore = (sep) => `[^${sep}][^${sep}]*`;
exports.memoryIgnore = memoryIgnore;
function parse(prop, options = memory_driver_1.DefaultMemoryDriverOptions) {
    options.sep = options.sep || consts_1.SEP;
    const { sep, prefix } = options;
    if (prefix)
        prop = String(prop).replace(prefix + sep, '');
    const [main, scope] = String(prop).split(sep);
    return { main, scope };
}
exports.parse = parse;
function key(polity, options = memory_driver_1.DefaultMemoryDriverOptions) {
    var _a, _b, _c;
    options.sep = options.sep || consts_1.SEP;
    const { sep, prefix } = options;
    const subject = parse(polity.subject, options);
    const action = parse(polity.action, options);
    const object = parse(polity.object, options);
    const subject_key = `${subject.main}${sep}${(_a = subject.scope) !== null && _a !== void 0 ? _a : consts_1.NULL}`;
    const action_key = `${action.main}${sep}${(_b = action.scope) !== null && _b !== void 0 ? _b : consts_1.ANY}`;
    const object_key = `${object.main}${sep}${(_c = object.scope) !== null && _c !== void 0 ? _c : consts_1.ALL}`;
    if (!prefix)
        return [subject_key, action_key, object_key].join(sep);
    else
        return [prefix, subject_key, action_key, object_key].join(sep);
}
exports.key = key;
function pattern(cKey, options = memory_driver_1.DefaultMemoryDriverOptions) {
    options.sep = options.sep || consts_1.SEP;
    const { sep, prefix } = options;
    const ignore = (0, exports.memoryIgnore)(sep);
    const ignored = (prop, scope, options) => { var _a; return (0, utils_1.isStrict)(prop, (_a = options.strict) !== null && _a !== void 0 ? _a : consts_1.STRICT) ? scope : ignore; };
    const regex = (prop) => {
        var _a, _b;
        if (prop && cKey[prop]) {
            const val = typeof cKey[prop] === 'string' ? parse(cKey[prop]) : cKey[prop];
            val.scope = (_a = val.scope) !== null && _a !== void 0 ? _a : String((prop === 'subject' && consts_1.NULL) || (prop === 'action' && consts_1.ANY) || (prop === 'object' && consts_1.ALL));
            const { main, scope } = val;
            return `${main}${sep}${ignored(prop, scope, { strict: (_b = val.strict) !== null && _b !== void 0 ? _b : cKey.strict })}`;
        }
        else
            return [ignore, ignore].join(sep);
    };
    if (!prefix)
        return RegExp(`^${[regex('subject'), regex('action'), regex('object')].join(sep)}$`);
    else
        return RegExp(`^${[prefix, regex('subject'), regex('action'), regex('object')].join(sep)}$`);
}
exports.pattern = pattern;
//# sourceMappingURL=memory.tools.js.map