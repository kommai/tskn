import { Validator } from '../util/validator.js';
import { Tooltip } from './tooltip.js';

/**
 * @param {HTMLFormElement} targetForm
 * @returns {Object} // TODO: how to explain custom object?
 */
const create = (targetForm) => {
    const elementValidatorMap = new Map();
    const elementErrorMap = new Map();
    let hasValidated = false;

    /**
     * @param {Validator} validator
     * @param {*} targetElement
     * @returns {ValidatableForm}
     */
    const setValidatorToElement = (validator, targetElement) => {
        elementValidatorMap.set(targetElement, validator);
        return validatableForm;
    };

    const validateElements = () => {
        console.group('validatable form is validating...');
        elementErrorMap.clear();
        for (const [element, validator] of elementValidatorMap) {
            console.log('validating:', element);
            if (validator.validate(element) !== true) {
                elementErrorMap.set(element, validator.getError());
                console.warn('ivalid input:', validator.getError(), element);
            }
        }
        hasValidated = true;
        console.groupEnd();
        return (elementErrorMap.size === 0);
    };

    const showErrors = () => {
        for (const [element] of elementValidatorMap) {
            if (elementErrorMap.has(element)) {
                const error = elementErrorMap.get(element);
                Tooltip.show(element, error);
            } else {
                Tooltip.hide(element);
            }
        }
    };

    const destroyErrors = () => {
        for (const [element] of elementValidatorMap) {
            Tooltip.destroy(element);
        }
    };

    const clearValidations = () => {
        elementErrorMap.clear();
        hasValidated = false;
        destroyErrors();
        console.log('validations have been cleared');
    };

    const onTargetFormChange = () => {
        if (hasValidated) {
            validateElements();
        }
        showErrors();
    };

    const onTargetFormInput = onTargetFormChange;

    const onTargetFormSubmit = (event) => {
        if (!validateElements()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
        }
        showErrors();
    };

    //targetForm.addEventListener('change', onTargetFormChange);
    targetForm.addEventListener('input', onTargetFormInput);
    targetForm.addEventListener('submit', onTargetFormSubmit);

    const validatableForm = {
        setValidatorToElement,
        clearValidations,
    };
    return validatableForm;
};

export const ValidatableForm = {
    create,
};