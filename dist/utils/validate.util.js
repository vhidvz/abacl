"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.isCRON = exports.IP_CIDR = exports.isCIDR = exports.isIP = void 0;
const regex_util_1 = require("./regex.util");
const cron_validator_1 = require("cron-validator");
function isIP(str) {
    return regex_util_1.ipRegex.test(str);
}
exports.isIP = isIP;
function isCIDR(str) {
    return regex_util_1.cidrRegex.test(str);
}
exports.isCIDR = isCIDR;
function IP_CIDR(str) {
    return isIP(str) || isCIDR(str);
}
exports.IP_CIDR = IP_CIDR;
function isCRON(str) {
    return !/^(\*\s)+\*$/.test(str) && (0, cron_validator_1.isValidCron)(str, { seconds: true, alias: true });
}
exports.isCRON = isCRON;
function validate(policy) {
    const { subject, action, object, location, time } = policy;
    if (!subject || !action || !object)
        throw new Error('Policy is not valid');
    if ((location === null || location === void 0 ? void 0 : location.length) && !(location === null || location === void 0 ? void 0 : location.every((l) => IP_CIDR(l))))
        throw new Error('Policy location is not valid');
    if ((time === null || time === void 0 ? void 0 : time.length) && !(time === null || time === void 0 ? void 0 : time.every((t) => isCRON(t.cron_exp) && t.duration > 0)))
        throw new Error('Policy time is not valid');
}
exports.validate = validate;
//# sourceMappingURL=validate.util.js.map