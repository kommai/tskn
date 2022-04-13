export class Abstract {
    static isEqual(instanceA, instanceB) {
        const propertiesA = Object.getOwnPropertyNames(instanceA);
        const propertiesB = Object.getOwnPropertyNames(instanceB);
        if (propertiesA.length !== propertiesB.length) {
            return false;
        }
        for (let property of propertiesA) {
            if (instanceA[property] !== instanceB[property]) {
                return false;
            }
        }
        return true;
    }
    static isEmpty(instance) {
        const emptyInstance = new this();
        return this.isEqual(instance, emptyInstance);
    }
    hasId() {
        return !!this.id;
    }
}
