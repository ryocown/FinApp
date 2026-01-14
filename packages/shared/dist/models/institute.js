import { v4 } from "uuid";
export var SupportedInstitute;
(function (SupportedInstitute) {
    SupportedInstitute["CHASE"] = "Chase";
    SupportedInstitute["MORGAN_STANLEY"] = "Morgan Stanley";
    SupportedInstitute["PAYPAY"] = "PayPay";
})(SupportedInstitute || (SupportedInstitute = {}));
export var InstituteTypes;
(function (InstituteTypes) {
    InstituteTypes["BANK"] = "Bank";
    InstituteTypes["BROKERAGE"] = "Brokerage";
    InstituteTypes["FINANCIAL_SERVICE"] = "Financial Service";
    InstituteTypes["SUPERANNUATION"] = "Superannuation";
    InstituteTypes["OTHER"] = "Other";
})(InstituteTypes || (InstituteTypes = {}));
export class Institute {
    instituteId;
    name;
    userId;
    accounts;
    type;
    supportedInstituteId;
    constructor(name, userId, accounts, type, supportedInstituteId) {
        this.instituteId = v4();
        this.name = name;
        this.userId = userId;
        this.accounts = accounts;
        this.type = type;
        this.supportedInstituteId = supportedInstituteId;
    }
    static fromProp(prop) {
        const inst = new Institute(prop.name, prop.userId, prop.accounts || [], prop.type, prop.supportedInstituteId);
        inst.instituteId = prop.instituteId;
        return inst;
    }
}
