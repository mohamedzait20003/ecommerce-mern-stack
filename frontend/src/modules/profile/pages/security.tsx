import { type FC } from 'react';

import {
    ActiveSessionsSection,
    ChangePasswordSection,
    TwoFactorSection,
} from '../components/security-sections';
import { SECURITY_SECTIONS } from '../components/section-index';
import { SettingsPage } from '../components/settings-page';

const Security: FC = () => (
    <SettingsPage
        title="Security"
        description="What stands between your account and someone else. Two-factor authentication is the single biggest thing you can turn on here."
        sections={SECURITY_SECTIONS}
    >
        <ChangePasswordSection />
        <TwoFactorSection />
        <ActiveSessionsSection />
    </SettingsPage>
);

export default Security;
