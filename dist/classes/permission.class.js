"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
const grant_class_1 = require("./grant.class");
class Permission {
    constructor(granted, grant) {
        this.granted = granted;
        this.grant = grant;
    }
    get policies() {
        return this.grant.policies;
    }
    has(cKey) {
        return this.grant.has(cKey);
    }
    scopes(prop, cKey) {
        return this.grant.scopes(prop, cKey);
    }
    subjects(cKey) {
        return this.grant.subjects(cKey);
    }
    time(options, cKey) {
        return this.grant.time(options, cKey);
    }
    location(ip, cKey) {
        return this.grant.location(ip, cKey);
    }
    field(data, cKey) {
        return this.grant.field(data, cKey);
    }
    filter(data, cKey) {
        return this.grant.filter(data, cKey);
    }
    static build(granted, policies, options) {
        return new Permission(granted, new grant_class_1.Grant(policies, options));
    }
}
exports.Permission = Permission;
//# sourceMappingURL=permission.class.js.map