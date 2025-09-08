"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControl = void 0;
const consts_1 = require("../consts");
const permission_class_1 = require("./permission.class");
const driver_1 = require("../driver");
const grant_class_1 = require("./grant.class");
const utils_1 = require("../utils");
class AccessControl {
    constructor(policies, options) {
        this.options = {};
        const { strict, driver } = options !== null && options !== void 0 ? options : {};
        this.setDriver(driver);
        this.options.strict = strict !== null && strict !== void 0 ? strict : consts_1.STRICT;
        if (policies === null || policies === void 0 ? void 0 : policies.length)
            policies.forEach((policy) => this.update(policy));
    }
    async setDriver(driver) {
        if (!driver || driver === 'memory') {
            this.driver = driver_1.MemoryDriver.build();
        }
        else
            this.driver = typeof driver === 'function' ? await driver() : driver;
    }
    async clear() {
        return this.driver.clear();
    }
    async exists(policy) {
        return this.driver.has(policy);
    }
    async delete(policy) {
        return this.driver.del(policy);
    }
    async update(policy) {
        (0, utils_1.validate)(policy);
        const { action, object, subject, field, filter, location, time } = policy;
        const times = time === null || time === void 0 ? void 0 : time.map(({ cron_exp, duration }) => ({ cron_exp, duration }));
        return this.driver.set({ action, object, subject, field, filter, location, time: times });
    }
    async can(subjects, action, object, options) {
        var _a, _b;
        const strict = (_b = (_a = options === null || options === void 0 ? void 0 : options.strict) !== null && _a !== void 0 ? _a : this.options.strict) !== null && _b !== void 0 ? _b : consts_1.STRICT;
        if (!(subjects === null || subjects === void 0 ? void 0 : subjects.length))
            throw new Error('No subjects given');
        const keys = subjects.map((subject) => ({ subject, action, object }));
        keys.push(...subjects.map((subject) => ({ subject, action: consts_1.ANY, object })));
        keys.push(...subjects.map((subject) => ({ subject, action, object: consts_1.ALL })));
        keys.push(...subjects.map((subject) => ({ subject, action: consts_1.ANY, object: consts_1.ALL })));
        const policies = (await Promise.all(keys.map((key) => this.driver.get({ strict, ...key })))).flat();
        let granted = !!(policies === null || policies === void 0 ? void 0 : policies.length);
        const grant = new grant_class_1.Grant(policies, { strict });
        if (granted && (options === null || options === void 0 ? void 0 : options.callable))
            granted && (granted = !!(await options.callable(new permission_class_1.Permission(granted, grant))));
        return new permission_class_1.Permission(granted, grant);
    }
}
exports.AccessControl = AccessControl;
//# sourceMappingURL=acl.class.js.map