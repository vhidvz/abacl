"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryDriver = exports.DefaultMemoryDriverOptions = void 0;
const memory_tools_1 = require("./memory.tools");
const consts_1 = require("../../consts");
exports.DefaultMemoryDriverOptions = { sep: consts_1.SEP };
class MemoryDriver {
    constructor(options = exports.DefaultMemoryDriverOptions) {
        this.options = options;
        this.present = {};
        this.options.sep = options.sep || consts_1.SEP;
    }
    clear() {
        this.present = {};
        return consts_1.OK;
    }
    get(cKey) {
        const p = (0, memory_tools_1.pattern)(cKey, this.options);
        const policies = [];
        for (const index of Object.keys(this.present)) {
            if (p.test(index))
                policies.push(this.present[index]);
        }
        return policies;
    }
    set(policy) {
        this.present[(0, memory_tools_1.key)(policy, this.options)] = policy;
        return consts_1.OK;
    }
    del(policy) {
        delete this.present[(0, memory_tools_1.key)(policy, this.options)];
        return consts_1.OK;
    }
    has(policy) {
        return (0, memory_tools_1.key)(policy, this.options) in this.present;
    }
    static build(options = exports.DefaultMemoryDriverOptions) {
        return new MemoryDriver(options);
    }
}
exports.MemoryDriver = MemoryDriver;
//# sourceMappingURL=memory.driver.js.map