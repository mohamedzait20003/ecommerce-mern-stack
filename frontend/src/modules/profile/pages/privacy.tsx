import { type FC } from 'react';

import {
    AccountRightsSection,
    DataManagementSection,
    NotificationSettingsSection,
} from '../components/privacy-sections';
import { PRIVACY_SECTIONS } from '../components/section-index';
import { SettingsPage } from '../components/settings-page';

const PPrivacy: FC = () => (
    <SettingsPage
        title="Privacy"
        description="What we record, what we do with it, and how to make us stop. The full policy is linked from every page footer."
        sections={PRIVACY_SECTIONS}
    >
        <DataManagementSection />
        <AccountRightsSection />
        <NotificationSettingsSection />
    </SettingsPage>
);

export default PPrivacy;
