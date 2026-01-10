import { InstituteTypes } from './institute.js';
export const SUPPORTED_INSTITUTES = [
    // Citi Bank
    {
        instituteId: 'citi',
        commonName: 'Citi',
        displayName: 'Citi Bank',
        shortName: 'Citi',
        logo: '/assets/logos/C.svg',
        logoFull: '',
        type: InstituteTypes.BANK
    },
    // US Banks
    {
        instituteId: 'chase',
        commonName: 'Chase',
        displayName: 'Chase Bank',
        shortName: 'Chase',
        logo: '',
        logoFull: '',
        type: InstituteTypes.BANK
    },
    // Brokerages
    {
        instituteId: 'morgan_stanley',
        commonName: 'Morgan Stanley',
        displayName: 'Morgan Stanley',
        shortName: 'MS',
        logo: '/assets/logos/MS.svg',
        logoFull: '/assets/logos/MS_BIG.svg',
        type: InstituteTypes.BROKERAGE
    },
    // Financial Services
    {
        instituteId: 'paypay',
        commonName: 'PayPay',
        displayName: 'PayPay',
        shortName: 'PYPL',
        logo: '/assets/logos/PYPL.svg',
        logoFull: '/assets/logos/PYPL_BIG.svg',
        type: InstituteTypes.FINANCIAL_SERVICE
    },
    {
        instituteId: 'etoro',
        commonName: 'eToro',
        displayName: 'eToro',
        shortName: 'ETOR',
        logo: '/assets/logos/ETOR.svg',
        logoFull: '/assets/logos/ETOR_BIG.svg',
        type: InstituteTypes.BROKERAGE
    },
    {
        instituteId: 'amex',
        commonName: 'AMEX',
        displayName: 'AMEX',
        shortName: 'AXP',
        logo: '/assets/logos/AXP.svg',
        logoFull: '/assets/logos/AXP_BIG.svg',
        type: InstituteTypes.FINANCIAL_SERVICE
    },
    // Australian Banks
    {
        instituteId: 'commbank',
        commonName: 'CommBank',
        displayName: 'Commonwealth Bank',
        shortName: 'CBA.AX',
        logo: '/assets/logos/CBA.AX.svg',
        logoFull: '',
        type: InstituteTypes.BANK
    },
    {
        instituteId: 'suncorbank',
        commonName: 'Suncorp',
        displayName: 'Suncorp Australia',
        shortName: 'SUN.AX',
        logo: '/assets/logos/SUN.AX.svg',
        logoFull: '/assets/logos/SUN.AX_BIG.svg',
        type: InstituteTypes.BANK
    },
    {
        instituteId: 'anzbank',
        commonName: 'ANZ',
        displayName: 'ANZ Bank',
        shortName: 'ANZ.AX',
        logo: '/assets/logos/ANZ.AX.svg',
        logoFull: '/assets/logos/ANZ.AX_BIG.svg',
        type: InstituteTypes.BANK
    },
    {
        instituteId: 'nab',
        commonName: 'NAB',
        displayName: 'NAB Bank',
        shortName: 'NAB.AX',
        logo: '/assets/logos/NAB.AX.svg',
        logoFull: '/assets/logos/NAB.AX_BIG.svg',
        type: InstituteTypes.BANK
    },
    {
        instituteId: 'macquarie',
        commonName: 'Macquarie',
        displayName: 'Macquarie Bank',
        shortName: 'MQG.AX',
        logo: '/assets/logos/MQG.AX.svg',
        logoFull: '/assets/logos/MQG.AX_BIG.svg',
        type: InstituteTypes.BANK
    }
];
