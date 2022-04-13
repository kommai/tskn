const create = (...rules) => {
    let error = null;
    return {
        addRule: (rule) => {
            rules.push(rule);
        },
        validate: (value) => {
            for (const rule of rules) {
                const result = rule(value);
                if (result !== true && result !== undefined) {
                    error = result;
                    break;
                }
            }
            return (error === null);
        },
        getError: () => {
            return error;
        }
    }
};

// TODO: some presets for common rules?

export const Validator = {
    create,
}