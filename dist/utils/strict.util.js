"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStrict = void 0;
const consts_1 = require("../consts");
/**
 * The function `isStrict` checks if a given property type matches a strict mode, returning a boolean
 * value.
 *
 * @param {PropType} prop - The `prop` parameter is of type `PropType`. It represents a property that
 * is being checked for strictness.
 *
 * @param {boolean | string} strict - The `strict` parameter is a boolean or string that determines
 * whether the code should be executed in strict mode. If it is a boolean, the function will return the
 * value of `strict`. If it is a string, the function will check if the first character of the `prop`
 * parameter is included
 *
 * @returns a boolean value.
 */
const isStrict = (prop, strict = consts_1.STRICT) => {
    if (typeof strict === 'boolean')
        return strict;
    return (strict !== null && strict !== void 0 ? strict : 'sao').toLowerCase().includes(prop[0]);
};
exports.isStrict = isStrict;
//# sourceMappingURL=strict.util.js.map