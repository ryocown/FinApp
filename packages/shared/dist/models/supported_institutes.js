import { InstituteTypes } from './institute.js';
export const SUPPORTED_INSTITUTES = [
    // Citi Bank
    {
        instituteId: 'citiau',
        commonName: 'Citi',
        displayName: 'Citi Bank',
        shortName: 'Citi',
        logo: '/assets/logos/C.svg',
        logoFull: '',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'citiau'
    },
    // US Banks
    {
        instituteId: 'chase',
        commonName: 'Chase',
        displayName: 'Chase Bank',
        shortName: 'Chase',
        logo: '',
        logoFull: '',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'chase'
    },
    // Brokerages
    {
        instituteId: 'morgan_stanley',
        commonName: 'Morgan Stanley',
        displayName: 'Morgan Stanley',
        shortName: 'MS',
        logo: '/assets/logos/MS.svg',
        logoFull: '/assets/logos/MS_BIG.svg',
        type: InstituteTypes.BROKERAGE,
        supportedInstituteId: 'morgan_stanley'
    },
    // Financial Services
    {
        instituteId: 'paypay',
        commonName: 'PayPay',
        displayName: 'PayPay',
        shortName: 'PYPL',
        logo: '/assets/logos/PYPL.svg',
        logoFull: '/assets/logos/PYPL_BIG.svg',
        type: InstituteTypes.FINANCIAL_SERVICE,
        supportedInstituteId: 'paypay'
    },
    {
        instituteId: 'etoro',
        commonName: 'eToro',
        displayName: 'eToro',
        shortName: 'ETOR',
        logo: '/assets/logos/ETOR.svg',
        logoFull: '/assets/logos/ETOR_BIG.svg',
        type: InstituteTypes.BROKERAGE,
        supportedInstituteId: 'etoro'
    },
    {
        instituteId: 'amexau',
        commonName: 'AMEX',
        displayName: 'AMEX',
        shortName: 'AXP',
        logo: '/assets/logos/AXP.svg',
        logoFull: '/assets/logos/AXP_BIG.svg',
        type: InstituteTypes.FINANCIAL_SERVICE,
        supportedInstituteId: 'amexau'
    },
    // Australian Banks
    {
        instituteId: 'commbankau',
        commonName: 'CommBank',
        displayName: 'Commonwealth Bank',
        shortName: 'CBA.AX',
        logo: '/assets/logos/CBA.AX.svg',
        logoFull: '',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'commbankau'
    },
    {
        instituteId: 'suncorbankau',
        commonName: 'Suncorp',
        displayName: 'Suncorp Australia',
        shortName: 'SUN.AX',
        logo: '/assets/logos/SUN.AX.svg',
        logoFull: '/assets/logos/SUN.AX_BIG.svg',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'suncorbankau'
    },
    {
        instituteId: 'anzbankau',
        commonName: 'ANZ',
        displayName: 'ANZ Bank',
        shortName: 'ANZ.AX',
        logo: '/assets/logos/ANZ.AX.svg',
        logoFull: '/assets/logos/ANZ.AX_BIG.svg',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'anzbankau'
    },
    {
        instituteId: 'nabau',
        commonName: 'NAB',
        displayName: 'NAB Bank',
        shortName: 'NAB.AX',
        logo: '/assets/logos/NAB.AX.svg',
        logoFull: '/assets/logos/NAB.AX_BIG.svg',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'nabau'
    },
    {
        instituteId: 'macquarieau',
        commonName: 'Macquarie',
        displayName: 'Macquarie Bank',
        shortName: 'MQG.AX',
        logo: '/assets/logos/MQG.AX.svg',
        logoFull: '/assets/logos/MQG.AX_BIG.svg',
        type: InstituteTypes.BANK,
        supportedInstituteId: 'macquarieau'
    }
];
