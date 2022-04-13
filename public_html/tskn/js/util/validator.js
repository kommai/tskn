/**
 * @param  {...Function} rules
 * @returns {Object}
 */
const create = (...rules) => {
    let errors = [];
    /**
     * @param {Function} rule
     * @returns {Object}
     */
    const addRule = (rule) => {
        rules.push(rule);
        return validator;
    };
    /**
     * @param {*} target
     * @returns {boolean}
     */
    const validate = (target) => {
        errors = [];
        for (const rule of rules) {
            const result = rule(target);
            if (result !== true && result !== undefined) {
                errors.push(result);
            }
        }
        return (errors.length === 0);
    };
    /**
     * @returns {Array}
     */
    const getErrors = () => {
        return errors;
    };
    /**
     * @returns {*}
     */
    const getError = () => {
        return errors[0];
    };
    const validator = {
        addRule,
        validate,
        getErrors,
        getError,
    };
    return validator;
};

// TODO: some presets for common rules?

export const Validator = {
    create,
};