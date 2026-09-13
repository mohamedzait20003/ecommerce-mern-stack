import { type FC } from 'react';

import {
    AccountInformationSection,
    PersonalInformationSection,
    PreferencesSection,
    ProfilePictureSection,
} from '../components/identity-sections';
import { IDENTITY_SECTIONS } from '../components/section-index';
import { SettingsPage } from '../components/settings-page';

const Information: FC = () => (
    <SettingsPage
        title="Your details"
        description="Who you are on MingleMart, and how we address you. Everything here is visible only to you, apart from your username."
        sections={IDENTITY_SECTIONS}
    >
        <ProfilePictureSection />
        <PersonalInformationSection />
        <AccountInformationSection />
        <PreferencesSection />
    </SettingsPage>
);

export default Information;
