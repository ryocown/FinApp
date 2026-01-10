import {} from './merchant.js';
export const KNOWN_MERCHANTS = [
    {
        commonName: 'Woolworths',
        logo: 'assets/logos/woolworths.svg',
        logoFull: 'assets/logos/woolworths-full.svg',
        category: 'Groceries',
        matcher: /woolworths|ww metro/i,
        website: 'https://www.woolworths.com.au'
    },
    {
        commonName: 'Coles',
        logo: 'assets/logos/coles.svg',
        logoFull: 'assets/logos/coles-full.svg',
        category: 'Groceries',
        matcher: /coles/i,
        website: 'https://www.coles.com.au'
    },
    {
        commonName: 'Uber',
        logo: 'assets/logos/uber.svg',
        logoFull: 'assets/logos/uber-full.svg',
        category: 'Transport',
        matcher: /uber\s*trip|uber\s*eats/i,
        website: 'https://www.uber.com'
    },
    {
        commonName: 'Netflix',
        logo: 'assets/logos/netflix.svg',
        logoFull: 'assets/logos/netflix-full.svg',
        category: 'Entertainment',
        matcher: /netflix/i,
        website: 'https://www.netflix.com'
    },
    {
        commonName: 'Spotify',
        logo: 'assets/logos/spotify.svg',
        logoFull: 'assets/logos/spotify-full.svg',
        category: 'Entertainment',
        matcher: /spotify/i,
        website: 'https://www.spotify.com'
    }
];
