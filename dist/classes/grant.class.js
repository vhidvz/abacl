"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grant = void 0;
const utils_1 = require("../utils");
const driver_1 = require("../driver");
const consts_1 = require("../consts");
const is_in_subnet_1 = require("is-in-subnet");
const addOptions = (cKey) => {
    const patterns = [];
    const { subject, action, object, strict } = cKey;
    if (subject)
        patterns.push((0, driver_1.pattern)({ strict, subject }));
    if (action)
        patterns.push((0, driver_1.pattern)({ strict, action }));
    if (object)
        patterns.push((0, driver_1.pattern)({ strict, object }));
    return patterns;
};
class Grant {
    constructor(policies, options) {
        this.options = {};
        this.present = {};
        const { strict } = options !== null && options !== void 0 ? options : {};
        this.options.strict = strict !== null && strict !== void 0 ? strict : consts_1.STRICT;
        if (policies === null || policies === void 0 ? void 0 : policies.length)
            this.policies = policies;
    }
    set policies(policies) {
        if (!(policies === null || policies === void 0 ? void 0 : policies.length))
            this.present = {};
        for (const policy of policies)
            this.update(policy);
    }
    get policies() {
        return Object.values(this.present);
    }
    update(policy) {
        (0, utils_1.validate)(policy);
        const { action, object, subject, field, filter, location, time } = policy;
        const times = time === null || time === void 0 ? void 0 : time.map(({ cron_exp, duration }) => ({ cron_exp, duration }));
        this.present[(0, driver_1.key)(policy)] = { action, object, subject, field, filter, location, time: times };
    }
    exists(policy) {
        return (0, driver_1.key)(policy) in this.present;
    }
    delete(policy) {
        return delete this.present[(0, driver_1.key)(policy)];
    }
    has(cKey) {
        if (!Object.keys(cKey).length)
            throw new Error('Cache key is required');
        const keys = Object.keys(this.present);
        const test = (p) => keys.some((i) => p.test(i));
        return test((0, driver_1.pattern)(cKey));
    }
    scopes(prop, cKey) {
        if (!cKey || !Object.keys(cKey).length) {
            return [...new Set(this.policies.map((p) => (0, driver_1.parse)(p[prop]).scope).filter((s) => !!s))];
        }
        else {
            const add = (set, patterns) => {
                this.policies
                    .filter((p) => patterns.every((pattern) => pattern.test((0, driver_1.key)(p))))
                    .map((p) => (0, driver_1.parse)(p[prop]).scope)
                    .forEach((s) => s && set.add(s));
            };
            const scopes = new Set([]);
            add(scopes, addOptions(cKey));
            return [...scopes];
        }
    }
    subjects(cKey) {
        if (!cKey || !Object.keys(cKey).length)
            return [...new Set(this.policies.map((p) => p.subject))];
        else {
            const add = (set, patterns) => {
                this.policies.filter((p) => patterns.every((pattern) => pattern.test((0, driver_1.key)(p)))).map((p) => set.add(p.subject));
            };
            const subjects = new Set([]);
            add(subjects, addOptions(cKey));
            return [...subjects];
        }
    }
    time(options, cKey) {
        const times = {};
        if (!cKey || !Object.keys(cKey).length) {
            for (const time of this.policies.filter((p) => { var _a; return (_a = p.time) === null || _a === void 0 ? void 0 : _a.length; }).map((p) => p.time))
                time === null || time === void 0 ? void 0 : time.forEach((t) => t && (times[`${t.cron_exp}${consts_1.SEP}${t.duration}`] = t));
        }
        else {
            const add = (patterns) => {
                this.policies
                    .filter((p) => patterns.every((pattern) => pattern.test((0, driver_1.key)(p))))
                    .map((p) => p.time)
                    .flat()
                    .forEach((t) => t && (times[`${t.cron_exp}${consts_1.SEP}${t.duration}`] = t));
            };
            add(addOptions(cKey));
        }
        if (!Object.keys(times).length)
            return true;
        else
            return Object.values(times).some((t) => (0, utils_1.accessibility)(t, options));
    }
    location(ip, cKey) {
        const locations = new Set([]);
        if (!cKey || !Object.keys(cKey).length) {
            for (const location of this.policies.filter((p) => { var _a; return (_a = p.location) === null || _a === void 0 ? void 0 : _a.length; }).map((p) => p.location))
                location === null || location === void 0 ? void 0 : location.forEach((l) => l && locations.add(l));
        }
        else {
            const add = (patterns) => {
                this.policies
                    .filter((p) => patterns.every((pattern) => pattern.test((0, driver_1.key)(p))))
                    .map((p) => p.location)
                    .flat()
                    .forEach((l) => l && locations.add(l));
            };
            add(addOptions(cKey));
        }
        if (!locations.size)
            return true;
        else {
            return ((0, is_in_subnet_1.isInSubnet)(ip, [...locations].filter((l) => (0, utils_1.isCIDR)(l))) || locations.has(ip));
        }
    }
    async field(data, cKey) {
        const notation = (0, utils_1.accumulate)(...(await this.notations(this.policies, data, 'field', cKey)));
        if (!notation.length)
            return data;
        else {
            if (typeof cKey === 'function' && typeof data === 'object' && Array.isArray(data)) {
                return Promise.all(data.map(async (item) => {
                    const notation = (0, utils_1.accumulate)(...(await this.notations(this.policies, item, 'field', cKey)));
                    return notation.length ? (0, utils_1.filterByNotation)(item, notation) : item;
                }));
            }
            else
                return notation.length ? (0, utils_1.filterByNotation)(data, notation) : data;
        }
    }
    async filter(data, cKey) {
        const notation = (0, utils_1.accumulate)(...(await this.notations(this.policies, data, 'filter', cKey)));
        if (!notation.length)
            return data;
        else {
            if (typeof cKey === 'function' && typeof data === 'object' && Array.isArray(data)) {
                return Promise.all(data.map(async (item) => {
                    const notation = (0, utils_1.accumulate)(...(await this.notations(this.policies, item, 'field', cKey)));
                    return notation.length ? (0, utils_1.filterByNotation)(item, notation) : item;
                }));
            }
            else
                return notation.length ? (0, utils_1.filterByNotation)(data, notation) : data;
        }
    }
    async notations(policies, data, type, cKey) {
        const notations = [];
        if (typeof cKey !== 'function' && (!cKey || !Object.keys(cKey).length)) {
            for (const notation of policies.filter((p) => { var _a; return (_a = p[type]) === null || _a === void 0 ? void 0 : _a.length; }).map((p) => p[type]))
                notation && notations.push(notation);
        }
        else {
            const add = (patterns) => {
                policies
                    .filter((p) => patterns.every((pattern) => pattern.test((0, driver_1.key)(p))))
                    .map((p) => p[type])
                    .forEach((f) => f && notations.push(f));
            };
            add(addOptions(typeof cKey === 'function' ? await cKey(data) : cKey));
        }
        return notations;
    }
}
exports.Grant = Grant;
//# sourceMappingURL=grant.class.js.map