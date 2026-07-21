/**
 * Port of the Rails AppConfigurator. Selects branding based on APP_NAME.
 * Defaults to 'sapler'.
 */
const APP_NAME = process.env.APP_NAME || 'sapler';

type Branding = {
  tabTitle: string;
  companyName: string;
  logoPath: string;
  logo2xPath: string;
};

const BRANDING: Record<string, Branding> = {
  sapler: {
    tabTitle: 'Sapler.cz',
    companyName: 'Sapler a. s.',
    logoPath: '/assets/template/logo-sapler.png',
    logo2xPath: '/assets/template/logo@2x-sapler.png',
  },
  plastic_slovakia: {
    tabTitle: 'PLASTIC SLOVAKIA, s.r.o.',
    companyName: 'PLASTIC SLOVAKIA, s.r.o.',
    logoPath: '/assets/template/logo-plastic-slovakia.png',
    logo2xPath: '/assets/template/logo@2x-plastic-slovakia.png',
  },
};

export const appConfig: Branding = BRANDING[APP_NAME] ?? BRANDING.sapler;
export { APP_NAME };
