import { type FC } from 'react';

import {
    AddressesSection,
    DeliveryPreferencesSection,
} from '../components/commerce-sections';
import { SHIPPING_SECTIONS } from '../components/section-index';
import { SettingsPage } from '../components/settings-page';

const Shipping: FC = () => (
    <SettingsPage
        title="Addresses"
        description="Where your orders go. You can still pick a different address at checkout without changing anything here."
        sections={SHIPPING_SECTIONS}
    >
        <AddressesSection />
        <DeliveryPreferencesSection />
    </SettingsPage>
);

export default Shipping;
